import { EXERCISES_DATABASE, type ExerciseDetail } from "@/data/exercises";
import type { WorkoutSessionPayload } from "@/lib/offline-storage";
import {
  ALL_MUSCLES,
  PROGRAM_CONFIG,
  type MuscleKey,
  type PlannedWeek,
} from "./program-types";

export const WEEK_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const MUSCLE_LABEL_ID: Record<MuscleKey, string> = {
  CHEST: "Dada",
  BACK: "Punggung (Lats)",
  SHOULDERS: "Bahu",
  BICEPS: "Lengan Depan (Biceps)",
  TRICEPS: "Lengan Belakang (Triceps)",
  QUADRICEPS: "Paha Depan (Quads)",
  HAMSTRINGS: "Paha Belakang",
  GLUTES: "Pantat / Pinggul (Glutes)",
  CALVES: "Betis (Calves)",
  ABDOMINALS: "Perut (Abs)",
  OBLIQUES: "Pinggang Samping",
  FOREARMS: "Lengan Bawah",
  TRAPS: "Pundak Atas (Traps)",
};

export interface MuscleContribution {
  muscle: MuscleKey;
  weight: number;
}

export interface MuscleVolumeRow {
  muscle: MuscleKey;
  label: string;
  actualSets: number;
  targetSets: number;
  isZeroTarget: boolean;
}

export interface WeeklyVolumeSummary {
  rows: MuscleVolumeRow[];
  hasAnyLogs: boolean;
  hasLogsInWindow: boolean;
  sessionsInWindowCount: number;
  completedSetsInWindow: number;
}

const EXERCISE_BY_ID = new Map<string, ExerciseDetail>(
  EXERCISES_DATABASE.map((exercise) => [exercise.id, exercise])
);

const VALID_MUSCLE_SET = new Set<string>(ALL_MUSCLES);

function createZeroMuscleRecord(): Record<MuscleKey, number> {
  const map = {} as Record<MuscleKey, number>;
  for (const muscle of ALL_MUSCLES) {
    map[muscle] = 0;
  }
  return map;
}

function roundOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Aturan kontribusi set efektif sama dengan generator: utama = 1, pendukung = PROGRAM_CONFIG.secondaryMuscleWeight. */
export function getExerciseMuscleWeights(exerciseId: string): MuscleContribution[] {
  const exercise = EXERCISE_BY_ID.get(exerciseId);
  if (!exercise) return [];

  const contributions: MuscleContribution[] = [];
  const primary = exercise.primaryMuscle as MuscleKey;
  if (VALID_MUSCLE_SET.has(primary)) {
    contributions.push({ muscle: primary, weight: 1 });
  }

  const seenSecondary = new Set<string>();
  for (const sec of exercise.secondaryMuscles) {
    const secKey = sec as MuscleKey;
    if (
      secKey !== primary &&
      VALID_MUSCLE_SET.has(secKey) &&
      !seenSecondary.has(secKey)
    ) {
      seenSecondary.add(secKey);
      contributions.push({
        muscle: secKey,
        weight: PROGRAM_CONFIG.secondaryMuscleWeight,
      });
    }
  }

  return contributions;
}

/** Hitung target set efektif mingguan per otot dari satu minggu pada ProgramPlan. */
export function calculatePlannedWeekVolume(
  week: PlannedWeek | null | undefined
): Record<MuscleKey, number> {
  const totals = createZeroMuscleRecord();
  if (!week) return totals;

  for (const session of week.sessions) {
    for (const item of session.exercises) {
      if (item.sets <= 0) continue;
      for (const { muscle, weight } of getExerciseMuscleWeights(item.exerciseId)) {
        totals[muscle] += item.sets * weight;
      }
    }
  }

  return totals;
}

/** Ambil sesi nyata dalam jendela 7 hari terakhir berakhir pada nowMs. */
export function filterSessionsInLastWeek(
  sessions: readonly WorkoutSessionPayload[],
  nowMs: number = Date.now()
): WorkoutSessionPayload[] {
  const windowStart = nowMs - WEEK_WINDOW_MS;
  return sessions.filter(
    (session) => session.startedAt >= windowStart && session.startedAt <= nowMs
  );
}

/** Hitung set efektif mingguan dari log nyata (hanya set yang completed === true). */
export function calculateLoggedVolume(
  sessions: readonly WorkoutSessionPayload[],
  nowMs: number = Date.now()
): {
  setsByMuscle: Record<MuscleKey, number>;
  completedSetsCount: number;
  sessionsCount: number;
} {
  const setsByMuscle = createZeroMuscleRecord();
  const windowSessions = filterSessionsInLastWeek(sessions, nowMs);
  let completedSetsCount = 0;

  for (const session of windowSessions) {
    for (const ex of session.exercises ?? []) {
      const doneCount = ex.sets.filter((set) => set.completed).length;
      if (doneCount === 0) continue;
      completedSetsCount += doneCount;
      for (const { muscle, weight } of getExerciseMuscleWeights(ex.id)) {
        setsByMuscle[muscle] += doneCount * weight;
      }
    }
  }

  return {
    setsByMuscle,
    completedSetsCount,
    sessionsCount: windowSessions.length,
  };
}

/** Bandingkan set efektif 13 otot dari log nyata vs target rencana minggu aktif. */
export function compareWeeklyMuscleVolume(options: {
  sessions: readonly WorkoutSessionPayload[];
  week?: PlannedWeek | null;
  nowMs?: number;
}): WeeklyVolumeSummary {
  const nowMs = options.nowMs ?? Date.now();
  const hasAnyLogs = options.sessions.some((session) =>
    session.exercises?.some((ex) => ex.sets.some((set) => set.completed))
  );

  const planned = calculatePlannedWeekVolume(options.week);
  const logged = calculateLoggedVolume(options.sessions, nowMs);

  const rows: MuscleVolumeRow[] = ALL_MUSCLES.map((muscle) => {
    const targetSets = roundOneDecimal(planned[muscle]);
    const actualSets = roundOneDecimal(logged.setsByMuscle[muscle]);
    return {
      muscle,
      label: MUSCLE_LABEL_ID[muscle],
      actualSets,
      targetSets,
      isZeroTarget: targetSets === 0,
    };
  });

  return {
    rows,
    hasAnyLogs,
    hasLogsInWindow: logged.completedSetsCount > 0,
    sessionsInWindowCount: logged.sessionsCount,
    completedSetsInWindow: logged.completedSetsCount,
  };
}
