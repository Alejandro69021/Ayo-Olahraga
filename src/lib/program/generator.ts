/**
 * Generator program latihan deterministik (fungsi murni tanpa UI / DOM / IndexedDB).
 * Seluruh parameter volume, RIR, istirahat, durasi, dan deload dibaca dari PROGRAM_CONFIG.
 */
import { EXERCISES_DATABASE, type ExerciseDetail } from "@/data/exercises";
import { EXERCISE_META, type ExerciseMeta } from "@/data/exercise-meta";
import {
  ALL_MUSCLES,
  GOAL_LABEL_ID,
  MUSCLE_CLASS,
  PROGRAM_CONFIG,
  SPLIT_TEMPLATES,
  type EquipmentId,
  type GoalPreset,
  type Level,
  type MuscleKey,
  type PlannedExercise,
  type PlannedSession,
  type PlannedWeek,
  type ProgramPlan,
  type UserProfile,
} from "./program-types";

const BEGINNER_MAX_SKILL = 2;

function getMuscleCap(muscle: MuscleKey, level: Level): number {
  const baseCap = PROGRAM_CONFIG.levelVolume[level].cap;
  const factor = MUSCLE_CLASS[muscle] === "small" ? PROGRAM_CONFIG.smallMuscleFactor : 1;
  return baseCap * factor;
}

function getMuscleWeek1Target(muscle: MuscleKey, profile: UserProfile): number {
  const levelStart = PROGRAM_CONFIG.levelVolume[profile.level].start;
  const goalFactor = PROGRAM_CONFIG.goals[profile.goal].volumeFactor;
  const smallFactor = MUSCLE_CLASS[muscle] === "small" ? PROGRAM_CONFIG.smallMuscleFactor : 1;
  const priorityFactor = profile.priorityMuscles.includes(muscle)
    ? PROGRAM_CONFIG.priority.volumeMultiplier
    : 1;

  const rawTarget = levelStart * goalFactor * smallFactor * priorityFactor;
  const cap = Math.floor(getMuscleCap(muscle, profile.level));
  return Math.max(1, Math.min(cap, Math.round(rawTarget)));
}

function createZeroMuscleMap(): Record<MuscleKey, number> {
  const map = {} as Record<MuscleKey, number>;
  for (const muscle of ALL_MUSCLES) {
    map[muscle] = 0;
  }
  return map;
}

function getExerciseContributions(
  ex: ExerciseDetail
): Array<{ muscle: MuscleKey; weight: number }> {
  const contributions: Array<{ muscle: MuscleKey; weight: number }> = [
    { muscle: ex.primaryMuscle as MuscleKey, weight: 1 },
  ];
  for (const sec of ex.secondaryMuscles) {
    const secKey = sec as MuscleKey;
    if (secKey !== ex.primaryMuscle) {
      contributions.push({
        muscle: secKey,
        weight: PROGRAM_CONFIG.secondaryMuscleWeight,
      });
    }
  }
  return contributions;
}

function estimateSessionMinutes(exercises: PlannedExercise[]): number {
  let total = PROGRAM_CONFIG.warmupMinutes;
  for (const ex of exercises) {
    const meta = EXERCISE_META[ex.exerciseId];
    if (!meta) continue;
    total += ex.sets * PROGRAM_CONFIG.minutesPerSet[meta.role];
  }
  return total;
}

function getRirForWeek(profile: UserProfile, weekIndex: number, isDeload: boolean): number {
  const [rirLow, rirHigh] = PROGRAM_CONFIG.goals[profile.goal].rirTarget;
  if (isDeload) return rirHigh;
  const accumWeeks = Math.max(1, PROGRAM_CONFIG.mesocycleWeeks - 1);
  if (accumWeeks === 1) return rirLow;
  const progress = (weekIndex - 1) / (accumWeeks - 1);
  return Math.round(rirHigh - progress * (rirHigh - rirLow));
}

function buildPlannedExercise(
  ex: ExerciseDetail,
  sets: number,
  profile: UserProfile,
  targetRIR: number
): PlannedExercise {
  const meta: ExerciseMeta = EXERCISE_META[ex.id];
  const goalPreset = PROGRAM_CONFIG.goals[profile.goal] as GoalPreset;
  const useOverride =
    Boolean(goalPreset.mainRepOverride) &&
    meta.strengthFriendly &&
    meta.role === "main";

  const [repMin, repMax] = useOverride
    ? goalPreset.mainRepOverride!
    : meta.repRange;

  const restSeconds =
    meta.role === "main"
      ? goalPreset.restMainSeconds
      : goalPreset.restAccessorySeconds;

  return {
    exerciseId: ex.id,
    sets,
    repMin,
    repMax,
    targetRIR,
    restSeconds,
  };
}

function sortSessionExercises(exercises: PlannedExercise[]): PlannedExercise[] {
  return [...exercises].sort((a, b) => {
    const metaA = EXERCISE_META[a.exerciseId];
    const metaB = EXERCISE_META[b.exerciseId];
    const isFinA = metaA.role === "finisher" ? 1 : 0;
    const isFinB = metaB.role === "finisher" ? 1 : 0;
    if (isFinA !== isFinB) return isFinA - isFinB;

    if (metaB.systemicFatigue !== metaA.systemicFatigue) {
      return metaB.systemicFatigue - metaA.systemicFatigue;
    }

    const isMainA = metaA.role === "main" ? 0 : 1;
    const isMainB = metaB.role === "main" ? 0 : 1;
    if (isMainA !== isMainB) return isMainA - isMainB;

    return a.exerciseId < b.exerciseId ? -1 : a.exerciseId > b.exerciseId ? 1 : 0;
  });
}

/**
 * Pengurutan kandidat gerakan deterministik per otot:
 * (1) role "main" sebelum non-main (aksesori/skill/finisher)
 * (2) belum terpakai di sesi lain dalam minggu ini (variasi sesi A vs B)
 * (3) untuk Menengah/Lanjutan: alat selain "bodyweight" milik pengguna sebelum "bodyweight"; Pemula: tanpa preferensi alat
 * (4) bila goal "kekuatan": utamakan strengthFriendly
 * (5) skillDemand lebih rendah dulu
 * (6) id sebagai pemutus terakhir
 */
function pickCandidateForMuscle(
  pool: ExerciseDetail[],
  profile: UserProfile,
  usageCount: Map<string, number>
): ExerciseDetail {
  const ownedExternal = new Set<EquipmentId>(
    profile.equipment.filter((eq) => eq !== "bodyweight")
  );
  const preferExternal = profile.level !== "Pemula";
  const preferStrength = PROGRAM_CONFIG.goals[profile.goal].preferStrengthFriendly;

  const sorted = [...pool].sort((a, b) => {
    const metaA = EXERCISE_META[a.id];
    const metaB = EXERCISE_META[b.id];

    // (1) role "main" sebelum non-main
    const mainA = metaA.role === "main" ? 0 : 1;
    const mainB = metaB.role === "main" ? 0 : 1;
    if (mainA !== mainB) return mainA - mainB;

    // Variasi antar sesi A & B dalam satu minggu
    const useA = usageCount.get(a.id) ?? 0;
    const useB = usageCount.get(b.id) ?? 0;
    if (useA !== useB) return useA - useB;

    // (2) Untuk Menengah/Lanjutan, utamakan alat selain "bodyweight" yang dimiliki pengguna
    if (preferExternal) {
      const extA = ownedExternal.has(a.equipment) ? 0 : 1;
      const extB = ownedExternal.has(b.equipment) ? 0 : 1;
      if (extA !== extB) return extA - extB;
    }

    // Prioritaskan strengthFriendly untuk goal kekuatan
    if (preferStrength) {
      const strA = metaA.strengthFriendly ? 0 : 1;
      const strB = metaB.strengthFriendly ? 0 : 1;
      if (strA !== strB) return strA - strB;
    }

    // (3) skillDemand lebih rendah dulu
    if (metaA.skillDemand !== metaB.skillDemand) {
      return metaA.skillDemand - metaB.skillDemand;
    }

    // (4) id sebagai pemutus terakhir
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  return sorted[0];
}

function buildDeterministicPlanId(profile: UserProfile): string {
  const signature = [
    profile.goal,
    profile.level,
    profile.daysPerWeek,
    profile.sessionMinutes,
    [...profile.equipment].sort().join(","),
    [...profile.priorityMuscles].sort().join(","),
    [...profile.jointComplaints].sort().join(","),
    profile.updatedAt,
  ].join("|");

  let hash = 0;
  for (let i = 0; i < signature.length; i++) {
    hash = (hash * 31 + signature.charCodeAt(i)) >>> 0;
  }
  return `plan-${profile.daysPerWeek}d-${profile.goal}-${hash.toString(36)}`;
}

export function generatePlan(profile: UserProfile): ProgramPlan {
  const templates = SPLIT_TEMPLATES[profile.daysPerWeek];
  const exerciseById = new Map<string, ExerciseDetail>(
    EXERCISES_DATABASE.map((ex) => [ex.id, ex])
  );

  // 1. Saring kandidat gerakan dari EXERCISES_DATABASE
  const availableEquipment = new Set<EquipmentId>([
    ...profile.equipment,
    "bodyweight",
  ]);
  const jointComplaints = new Set(profile.jointComplaints);

  const candidates = EXERCISES_DATABASE.filter((ex) => {
    if (!availableEquipment.has(ex.equipment)) return false;
    const meta = EXERCISE_META[ex.id];
    if (!meta) return false;
    if (meta.jointCaution.some((j) => jointComplaints.has(j))) return false;
    if (profile.level === "Pemula" && meta.skillDemand > BEGINNER_MAX_SKILL) {
      return false;
    }
    return true;
  });

  const templateMusclesSet = new Set<MuscleKey>();
  for (const tpl of templates) {
    for (const m of tpl.muscles) {
      templateMusclesSet.add(m);
    }
  }

  // 2. Hitung target mingguan & pelacak set efektif
  const week1Target = createZeroMuscleMap();
  for (const m of ALL_MUSCLES) {
    week1Target[m] = getMuscleWeek1Target(m, profile);
  }

  const weeklyEffective = createZeroMuscleMap();
  const sessionEffectiveList = templates.map(() => createZeroMuscleMap());
  const usageCount = new Map<string, number>();

  const canApplySets = (
    ex: ExerciseDetail,
    sessionEffective: Record<MuscleKey, number>,
    deltaSets: number
  ): boolean => {
    for (const { muscle, weight } of getExerciseContributions(ex)) {
      const cap = getMuscleCap(muscle, profile.level);
      if (weeklyEffective[muscle] + deltaSets * weight > cap) {
        return false;
      }
      if (
        sessionEffective[muscle] + deltaSets * weight >
        PROGRAM_CONFIG.maxSetsPerMusclePerSession
      ) {
        return false;
      }
    }
    return true;
  };

  const applySets = (
    ex: ExerciseDetail,
    sessionEffective: Record<MuscleKey, number>,
    deltaSets: number
  ): void => {
    for (const { muscle, weight } of getExerciseContributions(ex)) {
      weeklyEffective[muscle] += deltaSets * weight;
      sessionEffective[muscle] += deltaSets * weight;
    }
  };

  // Inisialisasi sesi minggu 1 dalam 2 fase agar gerakan utama tidak tergeser aksesori
  const week1Rir = getRirForWeek(profile, 1, false);
  const minSets = PROGRAM_CONFIG.minSetsPerExercise;
  const sessionPickedExercises: PlannedExercise[][] = templates.map(() => []);
  const pickedInSessionSet: Set<string>[] = templates.map(() => new Set());
  const sessionSlotDone: Set<MuscleKey>[] = templates.map(() => new Set());

  const tryAssignSlot = (sIdx: number, muscle: MuscleKey, requireMainRole: boolean) => {
    if (sessionSlotDone[sIdx].has(muscle)) return;

    const pool = candidates.filter(
      (ex) => ex.primaryMuscle === muscle && !pickedInSessionSet[sIdx].has(ex.id)
    );
    if (pool.length === 0) return;

    const hasMain = pool.some((ex) => EXERCISE_META[ex.id].role === "main");
    if (requireMainRole && !hasMain) return;

    const chosen = pickCandidateForMuscle(pool, profile, usageCount);
    sessionSlotDone[sIdx].add(muscle);

    // Tetapkan set awal sebesar minSetsPerExercise bila muat di batas sesi & cap
    if (!canApplySets(chosen, sessionEffectiveList[sIdx], minSets)) {
      return;
    }
    applySets(chosen, sessionEffectiveList[sIdx], minSets);
    pickedInSessionSet[sIdx].add(chosen.id);
    usageCount.set(chosen.id, (usageCount.get(chosen.id) ?? 0) + 1);
    sessionPickedExercises[sIdx].push(
      buildPlannedExercise(chosen, minSets, profile, week1Rir)
    );
  };

  // Pass 1a: pilih semua otot yang punya gerakan role "main" di setiap sesi
  templates.forEach((tpl, sIdx) => {
    for (const muscle of tpl.muscles) {
      tryAssignSlot(sIdx, muscle, true);
    }
  });

  // Pass 1b: pilih sisa otot (role non-main) di setiap sesi
  templates.forEach((tpl, sIdx) => {
    for (const muscle of tpl.muscles) {
      tryAssignSlot(sIdx, muscle, false);
    }
  });

  // Pass 2: tambah set menuju week1Target (prioritas otot priorityMuscles lebih dulu)
  const orderedMusclesForTopUp: MuscleKey[] = [
    ...profile.priorityMuscles,
    ...ALL_MUSCLES.filter((m) => !profile.priorityMuscles.includes(m)),
  ];

  let topUpChanged = true;
  while (topUpChanged) {
    topUpChanged = false;
    for (const muscle of orderedMusclesForTopUp) {
      if (weeklyEffective[muscle] >= week1Target[muscle]) continue;

      let bestTarget: { sIdx: number; eIdx: number } | null = null;
      let lowestSets = Infinity;

      sessionPickedExercises.forEach((exercises, sIdx) => {
        exercises.forEach((planned, eIdx) => {
          const ex = exerciseById.get(planned.exerciseId);
          if (!ex || ex.primaryMuscle !== muscle) return;

          const meta = EXERCISE_META[planned.exerciseId];
          if (
            estimateSessionMinutes(exercises) +
              PROGRAM_CONFIG.minutesPerSet[meta.role] >
            profile.sessionMinutes
          ) {
            return;
          }

          if (
            canApplySets(ex, sessionEffectiveList[sIdx], 1) &&
            planned.sets < lowestSets
          ) {
            lowestSets = planned.sets;
            bestTarget = { sIdx, eIdx };
          }
        });
      });

      if (bestTarget !== null) {
        const target = bestTarget as { sIdx: number; eIdx: number };
        const planned = sessionPickedExercises[target.sIdx][target.eIdx];
        const ex = exerciseById.get(planned.exerciseId)!;
        planned.sets += 1;
        applySets(ex, sessionEffectiveList[target.sIdx], 1);
        topUpChanged = true;
      }
    }
  }

  // Langkah 5 & Masalah 1: pangkas durasi berlebih & pastikan non-deload >= minSetsPerExercise via urutan (a), (b), (c)
  const enforceSessionConstraints = (
    exercises: PlannedExercise[],
    sessionEffective: Record<MuscleKey, number>
  ) => {
    while (
      exercises.length > 0 &&
      estimateSessionMinutes(exercises) > profile.sessionMinutes
    ) {
      let trimIdx = -1;
      for (let i = exercises.length - 1; i >= 0; i--) {
        if (EXERCISE_META[exercises[i].exerciseId].role !== "main") {
          trimIdx = i;
          break;
        }
      }

      if (trimIdx !== -1) {
        const removed = exercises.splice(trimIdx, 1)[0];
        const ex = exerciseById.get(removed.exerciseId);
        if (ex) applySets(ex, sessionEffective, -removed.sets);
        continue;
      }

      let maxSetsIdx = -1;
      let maxSetsVal: number = minSets;
      for (let i = exercises.length - 1; i >= 0; i--) {
        if (exercises[i].sets > maxSetsVal) {
          maxSetsVal = exercises[i].sets;
          maxSetsIdx = i;
        }
      }

      if (maxSetsIdx !== -1) {
        exercises[maxSetsIdx].sets -= 1;
        const ex = exerciseById.get(exercises[maxSetsIdx].exerciseId);
        if (ex) applySets(ex, sessionEffective, -1);
      } else {
        const removed = exercises.pop()!;
        const ex = exerciseById.get(removed.exerciseId);
        if (ex) applySets(ex, sessionEffective, -removed.sets);
      }
    }

    // Pastikan tidak ada gerakan dengan set < minSetsPerExercise melalui urutan (a), (b), (c)
    let idx = 0;
    while (idx < exercises.length) {
      const current = exercises[idx];
      if (current.sets >= minSets) {
        idx += 1;
        continue;
      }

      const currentEx = exerciseById.get(current.exerciseId);
      if (!currentEx) {
        exercises.splice(idx, 1);
        continue;
      }

      // (a) Gabungkan sisa setnya ke gerakan lain di sesi yang sama untuk otot yang sama
      let merged = false;
      for (let j = 0; j < exercises.length; j++) {
        if (j === idx) continue;
        const other = exercises[j];
        const otherEx = exerciseById.get(other.exerciseId);
        if (!otherEx || otherEx.primaryMuscle !== currentEx.primaryMuscle) continue;

        const currentRole = EXERCISE_META[current.exerciseId].role;
        const otherRole = EXERCISE_META[other.exerciseId].role;
        const minuteDelta =
          current.sets *
          (PROGRAM_CONFIG.minutesPerSet[otherRole] -
            PROGRAM_CONFIG.minutesPerSet[currentRole]);

        applySets(currentEx, sessionEffective, -current.sets);
        const fitsLimits =
          canApplySets(otherEx, sessionEffective, current.sets) &&
          estimateSessionMinutes(exercises) + minuteDelta <= profile.sessionMinutes;

        if (fitsLimits) {
          applySets(otherEx, sessionEffective, current.sets);
          other.sets += current.sets;
          exercises.splice(idx, 1);
          merged = true;
          break;
        } else {
          applySets(currentEx, sessionEffective, current.sets);
        }
      }
      if (merged) continue;

      // (b) Naikkan jadi minimum bila masih muat di sessionMinutes, cap, & sessionMax
      const needed = minSets - current.sets;
      const currentRole = EXERCISE_META[current.exerciseId].role;
      const addedMinutes = needed * PROGRAM_CONFIG.minutesPerSet[currentRole];
      if (
        estimateSessionMinutes(exercises) + addedMinutes <= profile.sessionMinutes &&
        canApplySets(currentEx, sessionEffective, needed)
      ) {
        applySets(currentEx, sessionEffective, needed);
        current.sets = minSets;
        idx += 1;
        continue;
      }

      // (c) Hapus gerakan tersebut
      applySets(currentEx, sessionEffective, -current.sets);
      exercises.splice(idx, 1);
    }
  };

  const week1Sessions: PlannedSession[] = templates.map((tpl, sIdx) => {
    enforceSessionConstraints(sessionPickedExercises[sIdx], sessionEffectiveList[sIdx]);
    return {
      label: tpl.label,
      exercises: sortSessionExercises(sessionPickedExercises[sIdx]),
    };
  });

  // Langkah 8: Bangun mesocycleWeeks minggu
  const mesocycleWeeks = PROGRAM_CONFIG.mesocycleWeeks;
  const accumWeeksCount = Math.max(1, mesocycleWeeks - 1);
  const weeks: PlannedWeek[] = [
    {
      weekIndex: 1,
      isDeload: false,
      sessions: week1Sessions,
    },
  ];

  // Minggu 2..(n-1): tambah weeklySetIncrement per otot tanpa melewati cap / maxSets / sessionMinutes
  for (let w = 2; w <= accumWeeksCount; w++) {
    const prevWeek = weeks[w - 2];
    const targetRIR = getRirForWeek(profile, w, false);

    const nextSessions: PlannedSession[] = prevWeek.sessions.map((s) => ({
      label: s.label,
      exercises: s.exercises.map((ex) => ({ ...ex, targetRIR })),
    }));

    const weekEff = createZeroMuscleMap();
    const sessEffs = nextSessions.map(() => createZeroMuscleMap());

    nextSessions.forEach((sess, sIdx) => {
      for (const planned of sess.exercises) {
        const ex = exerciseById.get(planned.exerciseId);
        if (!ex) continue;
        for (const { muscle, weight } of getExerciseContributions(ex)) {
          weekEff[muscle] += planned.sets * weight;
          sessEffs[sIdx][muscle] += planned.sets * weight;
        }
      }
    });

    const musclesToProgress: MuscleKey[] = [
      ...profile.priorityMuscles,
      ...ALL_MUSCLES.filter((m) => !profile.priorityMuscles.includes(m)),
    ];

    for (const muscle of musclesToProgress) {
      let remainingIncrement = PROGRAM_CONFIG.weeklySetIncrement;
      while (remainingIncrement > 0) {
        let bestCandidate: { sIdx: number; eIdx: number } | null = null;
        let lowestSets = Infinity;

        nextSessions.forEach((sess, sIdx) => {
          sess.exercises.forEach((planned, eIdx) => {
            const ex = exerciseById.get(planned.exerciseId);
            if (!ex || ex.primaryMuscle !== muscle) return;

            const meta = EXERCISE_META[planned.exerciseId];
            if (
              estimateSessionMinutes(sess.exercises) +
                PROGRAM_CONFIG.minutesPerSet[meta.role] >
              profile.sessionMinutes
            ) {
              return;
            }

            let withinLimits = true;
            for (const { muscle: affected, weight } of getExerciseContributions(ex)) {
              const cap = getMuscleCap(affected, profile.level);
              if (weekEff[affected] + weight > cap) {
                withinLimits = false;
                break;
              }
              if (
                sessEffs[sIdx][affected] + weight >
                PROGRAM_CONFIG.maxSetsPerMusclePerSession
              ) {
                withinLimits = false;
                break;
              }
            }

            if (withinLimits && planned.sets < lowestSets) {
              lowestSets = planned.sets;
              bestCandidate = { sIdx, eIdx };
            }
          });
        });

        if (!bestCandidate) break;

        const { sIdx, eIdx } = bestCandidate;
        const targetPlanned = nextSessions[sIdx].exercises[eIdx];
        targetPlanned.sets += 1;
        const ex = exerciseById.get(targetPlanned.exerciseId)!;
        for (const { muscle: affected, weight } of getExerciseContributions(ex)) {
          weekEff[affected] += weight;
          sessEffs[sIdx][affected] += weight;
        }
        remainingIncrement -= 1;
      }
    }

    weeks.push({
      weekIndex: w,
      isDeload: false,
      sessions: nextSessions,
    });
  }

  // Minggu terakhir: isDeload true, set x deloadVolumeFactor dibulatkan ke atas, minimum 1
  if (mesocycleWeeks > accumWeeksCount) {
    const lastAccumWeek = weeks[weeks.length - 1];
    const deloadRir = getRirForWeek(profile, mesocycleWeeks, true);

    const deloadSessions: PlannedSession[] = lastAccumWeek.sessions.map((s) => ({
      label: s.label,
      exercises: s.exercises.map((ex) => ({
        ...ex,
        sets: Math.max(
          1,
          Math.ceil(ex.sets * PROGRAM_CONFIG.deloadVolumeFactor)
        ),
        targetRIR: deloadRir,
      })),
    }));

    weeks.push({
      weekIndex: mesocycleWeeks,
      isDeload: true,
      sessions: deloadSessions,
    });
  }

  // Langkah 9: Susun warnings[]
  const primaryTrainedMuscles = new Set<MuscleKey>();
  for (const sess of weeks[0].sessions) {
    for (const planned of sess.exercises) {
      const ex = exerciseById.get(planned.exerciseId);
      if (ex) primaryTrainedMuscles.add(ex.primaryMuscle as MuscleKey);
    }
  }

  const musclesToCheck = new Set<MuscleKey>([
    ...templateMusclesSet,
    ...profile.priorityMuscles,
  ]);
  const warnings: string[] = [];

  for (const muscle of ALL_MUSCLES) {
    if (!musclesToCheck.has(muscle)) continue;
    if (primaryTrainedMuscles.has(muscle)) continue;

    const existsInCatalog = EXERCISES_DATABASE.some(
      (ex) => ex.primaryMuscle === muscle
    );
    if (!existsInCatalog) {
      warnings.push(`Otot ${muscle} tidak punya gerakan utama di katalog.`);
    } else {
      const hasFilteredCandidate = candidates.some(
        (ex) => ex.primaryMuscle === muscle
      );
      if (!hasFilteredCandidate) {
        warnings.push(
          `Otot ${muscle} tidak mendapat gerakan karena keterbatasan alat, level, atau keluhan sendi.`
        );
      } else {
        warnings.push(
          `Otot ${muscle} tidak mendapat gerakan langsung pada minggu awal karena batas durasi sesi atau batas set.`
        );
      }
    }
  }

  // Langkah 9: rationale[] (3-5 kalimat Indonesia singkat)
  const goalPreset = PROGRAM_CONFIG.goals[profile.goal];
  const levelVol = PROGRAM_CONFIG.levelVolume[profile.level];
  const splitLabels = templates.map((t) => t.label).join(", ");
  const rationale: string[] = [
    `Jadwal ${profile.daysPerWeek} hari per minggu menggunakan split ${splitLabels} agar pembagian beban antar otot terstruktur.`,
    `Volume awal diatur dari titik level ${profile.level} (${levelVol.start}–${levelVol.cap} set efektif/minggu otot besar) dengan faktor target ${goalPreset.volumeFactor} untuk tujuan ${GOAL_LABEL_ID[profile.goal].toLowerCase()}.`,
    `Set bertambah +${PROGRAM_CONFIG.weeklySetIncrement} per minggu selama ${accumWeeksCount} minggu akumulasi sambil menjaga durasi maksimal ${profile.sessionMinutes} menit per sesi.`,
    `Minggu ke-${mesocycleWeeks} adalah minggu deload (volume dikurangi ke sekitar ${Math.round(PROGRAM_CONFIG.deloadVolumeFactor * 100)}% dengan RIR tinggi) untuk memulihkan kelelahan sebelum siklus baru.`,
  ];

  if (profile.priorityMuscles.length > 0) {
    rationale.push(
      `Otot prioritas (${profile.priorityMuscles.join(", ")}) mendapat pengali volume ${PROGRAM_CONFIG.priority.volumeMultiplier}x hingga batas kapasitas mingguan.`
    );
  }

  return {
    id: buildDeterministicPlanId(profile),
    createdAt: profile.updatedAt,
    name: `Program ${profile.daysPerWeek} Hari • ${GOAL_LABEL_ID[profile.goal]} (${profile.level})`,
    goal: profile.goal,
    level: profile.level,
    daysPerWeek: profile.daysPerWeek,
    mesocycleWeeks,
    weeks,
    rationale,
    warnings,
  };
}
