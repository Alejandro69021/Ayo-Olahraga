import { describe, expect, it } from "vitest";
import { EXERCISES_DATABASE } from "@/data/exercises";
import type { WorkoutSessionPayload } from "@/lib/offline-storage";
import { generatePlan } from "./generator";
import { ALL_MUSCLES, PROGRAM_CONFIG, type UserProfile } from "./program-types";
import {
  WEEK_WINDOW_MS,
  calculateLoggedVolume,
  calculatePlannedWeekVolume,
  compareWeeklyMuscleVolume,
  getExerciseMuscleWeights,
} from "./volume";

function makeSession(
  id: string,
  startedAt: number,
  items: Array<{ exerciseId: string; completedCount: number; incompleteCount?: number }>
): WorkoutSessionPayload {
  return {
    id,
    title: "Sesi Uji",
    startedAt,
    endedAt: startedAt + 1_800_000,
    durationSeconds: 1800,
    totalVolumeKg: 500,
    totalReps: 30,
    prsBroken: 0,
    synced: false,
    exercises: items.map((item) => {
      const sets = [];
      for (let i = 0; i < item.completedCount; i++) {
        sets.push({
          id: i + 1,
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseId,
          setNumber: i + 1,
          weight: 40,
          reps: 10,
          completed: true,
          timestamp: startedAt + i * 60_000,
        });
      }
      for (let j = 0; j < (item.incompleteCount ?? 0); j++) {
        sets.push({
          id: item.completedCount + j + 1,
          exerciseId: item.exerciseId,
          exerciseName: item.exerciseId,
          setNumber: item.completedCount + j + 1,
          weight: 40,
          reps: 10,
          completed: false,
          timestamp: startedAt,
        });
      }
      return { id: item.exerciseId, name: item.exerciseId, sets };
    }),
  };
}

describe("volume mingguan per otot", () => {
  it("menghitung kontribusi otot utama = 1 dan pendukung = secondaryMuscleWeight", () => {
    const bench = EXERCISES_DATABASE.find((e) => e.id === "bb-bench-press");
    expect(bench).toBeDefined();

    const weights = getExerciseMuscleWeights("bb-bench-press");
    const primary = weights.find((w) => w.muscle === "CHEST");
    expect(primary?.weight).toBe(1);

    for (const sec of bench!.secondaryMuscles) {
      const found = weights.find((w) => w.muscle === sec);
      expect(found?.weight).toBe(PROGRAM_CONFIG.secondaryMuscleWeight);
    }

    expect(getExerciseMuscleWeights("tidak-ada-id")).toEqual([]);
  });

  it("menghitung set efektif log nyata 7 hari terakhir dan mengabaikan set belum selesai atau sesi lama", () => {
    const nowMs = 1_750_000_000_000;
    const recentSession = makeSession("recent", nowMs - 2 * 24 * 60 * 60 * 1000, [
      { exerciseId: "bb-bench-press", completedCount: 4, incompleteCount: 2 },
    ]);
    const oldSession = makeSession("old", nowMs - WEEK_WINDOW_MS - 1000, [
      { exerciseId: "bb-bench-press", completedCount: 5 },
    ]);

    const logged = calculateLoggedVolume([recentSession, oldSession], nowMs);
    expect(logged.sessionsCount).toBe(1);
    expect(logged.completedSetsCount).toBe(4);
    expect(logged.setsByMuscle.CHEST).toBe(4);
    expect(logged.setsByMuscle.TRICEPS).toBe(
      4 * PROGRAM_CONFIG.secondaryMuscleWeight
    );
    expect(logged.setsByMuscle.SHOULDERS).toBe(
      4 * PROGRAM_CONFIG.secondaryMuscleWeight
    );
    expect(logged.setsByMuscle.QUADRICEPS).toBe(0);
  });

  it("mengembalikan keadaan kosong tanpa angka palsu ketika log kosong", () => {
    const summary = compareWeeklyMuscleVolume({
      sessions: [],
      week: null,
      nowMs: 1_750_000_000_000,
    });

    expect(summary.hasAnyLogs).toBe(false);
    expect(summary.hasLogsInWindow).toBe(false);
    expect(summary.completedSetsInWindow).toBe(0);
    expect(summary.rows).toHaveLength(13);
    for (const row of summary.rows) {
      expect(row.actualSets).toBe(0);
      expect(row.targetSets).toBe(0);
      expect(row.isZeroTarget).toBe(true);
    }
  });

  it("membandingkan 13 otot log nyata vs target rencana dan menandai otot target 0 sebagai isZeroTarget", () => {
    const profile: UserProfile = {
      id: "me",
      updatedAt: 100,
      adultConfirmed: true,
      goal: "otot",
      level: "Pemula",
      daysPerWeek: 3,
      sessionMinutes: 45,
      equipment: ["bodyweight"],
      priorityMuscles: [],
      jointComplaints: [],
    };
    const plan = generatePlan(profile);
    const week1 = plan.weeks[0];
    const plannedTotals = calculatePlannedWeekVolume(week1);

    const nowMs = 1_750_000_000_000;
    const logged = makeSession("s1", nowMs - 86_400_000, [
      { exerciseId: "bw-air-squat", completedCount: 3 },
    ]);

    const summary = compareWeeklyMuscleVolume({
      sessions: [logged],
      week: week1,
      nowMs,
    });

    expect(summary.hasAnyLogs).toBe(true);
    expect(summary.hasLogsInWindow).toBe(true);
    expect(summary.rows.map((r) => r.muscle)).toEqual([...ALL_MUSCLES]);

    const quads = summary.rows.find((r) => r.muscle === "QUADRICEPS");
    expect(quads?.actualSets).toBe(3);
    expect(quads?.targetSets).toBe(Math.round(plannedTotals.QUADRICEPS * 10) / 10);
    expect(quads?.isZeroTarget).toBe(false);

    const zeroRows = summary.rows.filter((r) => r.isZeroTarget);
    expect(zeroRows.length).toBeGreaterThan(0);
    for (const row of summary.rows) {
      expect(row.isZeroTarget).toBe(row.targetSets === 0);
    }
  });
});
