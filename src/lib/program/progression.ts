import { EXERCISES_DATABASE, type ExerciseDetail } from "@/data/exercises";
import { EXERCISE_META, type LoadType } from "@/data/exercise-meta";
import { FORM_COACH_MATRIX, type FormCoachEntry } from "@/data/form-coach-matrix";
import { getRuleSetForExercise } from "@/lib/pose/rules/config";
import type { WorkoutSessionPayload } from "@/lib/offline-storage";
import {
  PROGRAM_CONFIG,
  type EquipmentId,
  type ProgressionSuggestion,
} from "./program-types";

export const BODYWEIGHT_VARIANT_HINT = "coba varian lebih sulit";
export const LOW_FORM_SCORE_MESSAGE =
  "Form sering kurang baik; pertimbangkan menurunkan beban atau varian lebih mudah.";

export interface ExerciseSessionEntry {
  loadKg: number;
  repsPerSet: number[];
  /** Skor rata-rata Form Coach sesi ini (0–100) bila direkam kamera. */
  avgFormScore?: number;
  /** Timestamp sesi (ms) bila ingin diurutkan kronologis dari log mentah. */
  timestamp?: number;
}

export interface ProgressionInput {
  exerciseId: string;
  repMin: number;
  repMax: number;
  isDeload?: boolean;
  /** Riwayat sesi gerakan ini (urut kronologis lama → terbaru, atau punya timestamp). */
  sessions: readonly ExerciseSessionEntry[];
  /** Opsional override alat & tipe beban (default dibaca dari katalog & metadata). */
  equipment?: EquipmentId;
  loadType?: LoadType;
}

export type ProgressionAction =
  | "none"
  | "deload"
  | "increase_load"
  | "decrease_load"
  | "increase_reps"
  | "bodyweight_advance"
  | "maintain";

export interface ExerciseProgressionAdvice extends ProgressionSuggestion {
  hasHistory: boolean;
  action: ProgressionAction;
  formWarning: string | null;
}

const EXERCISE_MAP = new Map<string, ExerciseDetail>(
  EXERCISES_DATABASE.map((exercise) => [exercise.id, exercise])
);

const COACH_MATRIX_MAP = new Map<string, FormCoachEntry>(
  FORM_COACH_MATRIX.map((entry) => [entry.exerciseId, entry])
);

function roundLoad(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeSessions(
  sessions: readonly ExerciseSessionEntry[]
): ExerciseSessionEntry[] {
  if (
    sessions.length > 1 &&
    sessions.every((session) => typeof session.timestamp === "number")
  ) {
    return [...sessions].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }
  return [...sessions];
}

/** Cek apakah gerakan boleh menerima saran lunak dari skor Form Coach (hanya tier A/B, bukan scored:false). */
export function isFormFeedbackEligible(exerciseId: string): boolean {
  const matrixEntry = COACH_MATRIX_MAP.get(exerciseId);
  if (!matrixEntry) return false;
  if (matrixEntry.tier !== "A" && matrixEntry.tier !== "B") return false;

  const ruleSet = getRuleSetForExercise(exerciseId);
  if (ruleSet?.scored === false) return false;
  if (ruleSet?.tier === "C") return false;

  return true;
}

/** Evaluasi saran lunak skor Form Coach tanpa mengubah target beban/repetisi secara otomatis. */
export function evaluateFormCoachSoftAdvice(
  exerciseId: string,
  sessions: readonly ExerciseSessionEntry[]
): string | null {
  if (!isFormFeedbackEligible(exerciseId)) return null;

  const { lowScoreThreshold, sessionsToTrigger } = PROGRAM_CONFIG.formLink;
  if (sessions.length < sessionsToTrigger) return null;

  const recent = sessions.slice(-sessionsToTrigger);
  const consistentlyLow = recent.every(
    (entry) =>
      typeof entry.avgFormScore === "number" &&
      Number.isFinite(entry.avgFormScore) &&
      entry.avgFormScore < lowScoreThreshold
  );

  return consistentlyLow ? LOW_FORM_SCORE_MESSAGE : null;
}

function isSessionAtTop(session: ExerciseSessionEntry, repMax: number): boolean {
  return (
    session.repsPerSet.length > 0 &&
    session.repsPerSet.every((reps) => reps >= repMax)
  );
}

function isSessionBelowFloor(session: ExerciseSessionEntry, repMin: number): boolean {
  if (session.repsPerSet.length === 0) return false;
  const belowCount = session.repsPerSet.filter((reps) => reps < repMin).length;
  return belowCount * 2 >= session.repsPerSet.length;
}

/** Hitung saran beban, repetisi berikutnya, serta saran lunak Form Coach secara murni dan deterministik. */
export function evaluateExerciseProgression(
  input: ProgressionInput
): ExerciseProgressionAdvice {
  const { exerciseId, repMin, repMax, isDeload = false } = input;
  const catalogEntry = EXERCISE_MAP.get(exerciseId);
  const equipment: EquipmentId =
    input.equipment ?? catalogEntry?.equipment ?? "bodyweight";
  const loadType: LoadType =
    input.loadType ??
    EXERCISE_META[exerciseId]?.loadType ??
    (equipment === "bodyweight" ? "bodyweight" : "external");
  const isBodyweightOnly = loadType === "bodyweight" || equipment === "bodyweight";
  const unitLabel = loadType === "time" ? "detik" : "rep";

  const ordered = normalizeSessions(input.sessions);
  const validSessions = ordered.filter((session) => session.repsPerSet.length > 0);
  const formWarning = evaluateFormCoachSoftAdvice(exerciseId, ordered);

  if (validSessions.length === 0) {
    return {
      exerciseId,
      nextLoadKg: 0,
      nextRepTarget: repMin,
      reason: isDeload
        ? "Minggu deload: pertahankan beban tanpa target naik."
        : "Belum ada catatan sesi; mulai dari batas bawah target.",
      hasHistory: false,
      action: isDeload ? "deload" : "none",
      formWarning,
    };
  }

  const lastSession = validSessions[validSessions.length - 1];
  const lastLoadKg = isBodyweightOnly
    ? 0
    : roundLoad(Math.max(0, lastSession.loadKg));

  if (isDeload) {
    return {
      exerciseId,
      nextLoadKg: lastLoadKg,
      nextRepTarget: repMin,
      reason: isBodyweightOnly
        ? "Minggu deload: beban tubuh tetap, fokus pemulihan tanpa menaikkan target."
        : "Minggu deload: beban tetap, fokus pemulihan tanpa menaikkan beban atau repetisi.",
      hasHistory: true,
      action: "deload",
      formWarning,
    };
  }

  const {
    loadIncrementKg,
    sessionsAtTopToIncrease,
    sessionsBelowFloorToDecrease,
    decreaseFactor,
  } = PROGRAM_CONFIG.progression;

  const reachedTop =
    validSessions.length >= sessionsAtTopToIncrease &&
    validSessions
      .slice(-sessionsAtTopToIncrease)
      .every((session) => isSessionAtTop(session, repMax));

  if (reachedTop) {
    if (isBodyweightOnly) {
      return {
        exerciseId,
        nextLoadKg: 0,
        nextRepTarget: repMax,
        reason: `Semua set mencapai ${repMax} ${unitLabel}; ${BODYWEIGHT_VARIANT_HINT}.`,
        hasHistory: true,
        action: "bodyweight_advance",
        formWarning,
      };
    }

    const increment = loadIncrementKg[equipment] ?? 0;
    const nextLoadKg = roundLoad(lastLoadKg + increment);
    return {
      exerciseId,
      nextLoadKg,
      nextRepTarget: repMin,
      reason: `Semua set mencapai ${repMax} ${unitLabel}; naikkan beban +${increment} kg ke ${nextLoadKg} kg (${repMin} ${unitLabel}).`,
      hasHistory: true,
      action: "increase_load",
      formWarning,
    };
  }

  const consecutiveBelowFloor =
    validSessions.length >= sessionsBelowFloorToDecrease &&
    validSessions
      .slice(-sessionsBelowFloorToDecrease)
      .every((session) => isSessionBelowFloor(session, repMin));

  if (consecutiveBelowFloor) {
    if (isBodyweightOnly) {
      return {
        exerciseId,
        nextLoadKg: 0,
        nextRepTarget: repMin,
        reason: `Separuh atau lebih set di bawah ${repMin} ${unitLabel} selama ${sessionsBelowFloorToDecrease} sesi; pertahankan gerakan dan fokus capai batas bawah.`,
        hasHistory: true,
        action: "maintain",
        formWarning,
      };
    }

    const nextLoadKg = roundLoad(lastLoadKg * decreaseFactor);
    return {
      exerciseId,
      nextLoadKg,
      nextRepTarget: repMin,
      reason: `Separuh atau lebih set di bawah ${repMin} ${unitLabel} selama ${sessionsBelowFloorToDecrease} sesi berturut; turunkan beban menjadi ${nextLoadKg} kg.`,
      hasHistory: true,
      action: "decrease_load",
      formWarning,
    };
  }

  const minReps = Math.min(...lastSession.repsPerSet);
  const nextRepTarget = Math.min(repMax, Math.max(repMin, minReps + 1));

  return {
    exerciseId,
    nextLoadKg: lastLoadKg,
    nextRepTarget,
    reason: isBodyweightOnly
      ? `Pertahankan beban tubuh, targetkan ${nextRepTarget} ${unitLabel} per set.`
      : `Pertahankan beban ${lastLoadKg} kg, targetkan ${nextRepTarget} ${unitLabel} per set.`,
    hasHistory: true,
    action: "increase_reps",
    formWarning,
  };
}

/** Ekstrak riwayat kronologis satu gerakan dari daftar sesi pelacak offline (ayo_olahraga_db). */
export function extractExerciseHistoryFromSessions(
  exerciseId: string,
  offlineSessions: readonly WorkoutSessionPayload[]
): ExerciseSessionEntry[] {
  const sorted = [...offlineSessions].sort((a, b) => a.startedAt - b.startedAt);
  const entries: ExerciseSessionEntry[] = [];

  for (const session of sorted) {
    const match = session.exercises?.find((item) => item.id === exerciseId);
    if (!match) continue;

    const completedSets = match.sets.filter((set) => set.completed);
    if (completedSets.length === 0) continue;

    const loadKg = Math.max(
      0,
      ...completedSets.map((set) =>
        Number.isFinite(Number(set.weight)) ? Number(set.weight) : 0
      )
    );
    const repsPerSet = completedSets.map((set) =>
      Math.max(0, Number.isFinite(Number(set.reps)) ? Number(set.reps) : 0)
    );

    const scoredSets = completedSets.filter(
      (set) =>
        typeof set.formSummary?.avgScore === "number" &&
        Number.isFinite(set.formSummary.avgScore)
    );

    let avgFormScore: number | undefined;
    if (scoredSets.length > 0) {
      const totalAnalyzedReps = scoredSets.reduce(
        (sum, set) => sum + (set.formSummary?.repsAnalyzed ?? 0),
        0
      );
      if (totalAnalyzedReps > 0) {
        const weighted = scoredSets.reduce(
          (sum, set) =>
            sum +
            (set.formSummary?.avgScore ?? 0) * (set.formSummary?.repsAnalyzed ?? 0),
          0
        );
        avgFormScore = weighted / totalAnalyzedReps;
      } else {
        const simpleSum = scoredSets.reduce(
          (sum, set) => sum + (set.formSummary?.avgScore ?? 0),
          0
        );
        avgFormScore = simpleSum / scoredSets.length;
      }
    }

    entries.push({
      loadKg,
      repsPerSet,
      avgFormScore,
      timestamp: session.startedAt,
    });
  }

  return entries;
}
