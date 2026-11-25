import { describe, expect, it } from "vitest";
import { PROGRAM_CONFIG } from "./program-types";
import type { WorkoutSessionPayload } from "@/lib/offline-storage";
import {
  BODYWEIGHT_VARIANT_HINT,
  LOW_FORM_SCORE_MESSAGE,
  evaluateExerciseProgression,
  extractExerciseHistoryFromSessions,
} from "./progression";

describe("progression engine", () => {
  it("naik beban sesuai loadIncrementKg[alat] dan reset target ke repMin saat semua set mencapai repMax", () => {
    const bb = evaluateExerciseProgression({
      exerciseId: "bb-bench-press",
      repMin: 5,
      repMax: 10,
      sessions: [{ loadKg: 60, repsPerSet: [10, 10, 10] }],
    });
    expect(bb.action).toBe("increase_load");
    expect(bb.nextLoadKg).toBe(60 + PROGRAM_CONFIG.progression.loadIncrementKg.barbell);
    expect(bb.nextRepTarget).toBe(5);

    const db = evaluateExerciseProgression({
      exerciseId: "db-bicep-curl",
      repMin: 8,
      repMax: 15,
      sessions: [{ loadKg: 10, repsPerSet: [15, 16] }],
    });
    expect(db.nextLoadKg).toBe(10 + PROGRAM_CONFIG.progression.loadIncrementKg.dumbbell);
    expect(db.nextRepTarget).toBe(8);

    const kb = evaluateExerciseProgression({
      exerciseId: "kb-swing",
      repMin: 10,
      repMax: 20,
      sessions: [{ loadKg: 16, repsPerSet: [20, 20, 20] }],
    });
    expect(kb.nextLoadKg).toBe(16 + PROGRAM_CONFIG.progression.loadIncrementKg.kettlebell);
    expect(kb.nextRepTarget).toBe(10);

    const plate = evaluateExerciseProgression({
      exerciseId: "plate-steering-raise",
      repMin: 10,
      repMax: 15,
      sessions: [{ loadKg: 10, repsPerSet: [15, 15] }],
    });
    expect(plate.nextLoadKg).toBe(10 + PROGRAM_CONFIG.progression.loadIncrementKg.plate);
    expect(plate.nextRepTarget).toBe(10);
  });

  it("turun beban dengan decreaseFactor bila >= separuh set di bawah repMin selama sessionsBelowFloorToDecrease sesi berturut", () => {
    const res = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 6,
      repMax: 10,
      sessions: [
        { loadKg: 100, repsPerSet: [5, 5, 7] }, // 2/3 < 6
        { loadKg: 100, repsPerSet: [6, 5, 4] }, // 2/3 < 6
      ],
    });
    expect(res.action).toBe("decrease_load");
    expect(res.nextLoadKg).toBe(
      Math.round(100 * PROGRAM_CONFIG.progression.decreaseFactor * 100) / 100
    );
    expect(res.nextRepTarget).toBe(6);
  });

  it("tidak menurunkan beban bila hanya 1 sesi di bawah repMin atau streak terputus atau kurang dari separuh set", () => {
    const onlyOneLow = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 6,
      repMax: 10,
      sessions: [
        { loadKg: 100, repsPerSet: [8, 8, 8] },
        { loadKg: 100, repsPerSet: [5, 5, 6] },
      ],
    });
    expect(onlyOneLow.action).toBe("increase_reps");
    expect(onlyOneLow.nextLoadKg).toBe(100);

    const lessThanHalf = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 6,
      repMax: 10,
      sessions: [
        { loadKg: 100, repsPerSet: [5, 7, 7] }, // 1/3 < separuh
        { loadKg: 100, repsPerSet: [5, 8, 8] },
      ],
    });
    expect(lessThanHalf.action).toBe("increase_reps");
    expect(lessThanHalf.nextLoadKg).toBe(100);
  });

  it("selain itu mempertahankan beban dan menaikkan target repetisi +1 (maks repMax)", () => {
    const mid = evaluateExerciseProgression({
      exerciseId: "db-bench-press",
      repMin: 6,
      repMax: 12,
      sessions: [{ loadKg: 20, repsPerSet: [9, 9, 8] }],
    });
    expect(mid.action).toBe("increase_reps");
    expect(mid.nextLoadKg).toBe(20);
    expect(mid.nextRepTarget).toBe(9);

    const capped = evaluateExerciseProgression({
      exerciseId: "db-bench-press",
      repMin: 6,
      repMax: 12,
      sessions: [{ loadKg: 20, repsPerSet: [12, 12, 11] }],
    });
    expect(capped.action).toBe("increase_reps");
    expect(capped.nextLoadKg).toBe(20);
    expect(capped.nextRepTarget).toBe(12);
  });

  it("bodyweight tidak menambah beban, menaikkan repetisi dulu, lalu memberi teks 'coba varian lebih sulit' saat mencapai repMax", () => {
    const climbing = evaluateExerciseProgression({
      exerciseId: "bw-pushup",
      repMin: 8,
      repMax: 20,
      sessions: [{ loadKg: 0, repsPerSet: [12, 12, 12] }],
    });
    expect(climbing.action).toBe("increase_reps");
    expect(climbing.nextLoadKg).toBe(0);
    expect(climbing.nextRepTarget).toBe(13);
    expect(climbing.reason).not.toContain(BODYWEIGHT_VARIANT_HINT);

    const topped = evaluateExerciseProgression({
      exerciseId: "bw-pushup",
      repMin: 8,
      repMax: 20,
      sessions: [{ loadKg: 0, repsPerSet: [20, 20, 20] }],
    });
    expect(topped.action).toBe("bodyweight_advance");
    expect(topped.nextLoadKg).toBe(0);
    expect(topped.nextRepTarget).toBe(20);
    expect(topped.reason).toContain(BODYWEIGHT_VARIANT_HINT);

    const timedBw = evaluateExerciseProgression({
      exerciseId: "bw-plank",
      repMin: 20,
      repMax: 60,
      sessions: [{ loadKg: 0, repsPerSet: [60, 60] }],
    });
    expect(timedBw.action).toBe("bodyweight_advance");
    expect(timedBw.nextLoadKg).toBe(0);
    expect(timedBw.reason).toContain(BODYWEIGHT_VARIANT_HINT);
  });

  it("minggu deload mempertahankan beban tetap dan tidak memberi saran naik atau varian lebih sulit", () => {
    const externalDeload = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 5,
      repMax: 10,
      isDeload: true,
      sessions: [{ loadKg: 80, repsPerSet: [10, 10, 10] }],
    });
    expect(externalDeload.action).toBe("deload");
    expect(externalDeload.nextLoadKg).toBe(80);
    expect(externalDeload.nextRepTarget).toBe(5);
    expect(externalDeload.reason.toLowerCase()).toContain("deload");

    const bwDeload = evaluateExerciseProgression({
      exerciseId: "bw-pushup",
      repMin: 8,
      repMax: 20,
      isDeload: true,
      sessions: [{ loadKg: 0, repsPerSet: [20, 20, 20] }],
    });
    expect(bwDeload.action).toBe("deload");
    expect(bwDeload.nextLoadKg).toBe(0);
    expect(bwDeload.reason).not.toContain(BODYWEIGHT_VARIANT_HINT);
  });

  it("saran form lunak muncul untuk tier A/B bila skor rata-rata < lowScoreThreshold selama sessionsToTrigger sesi berturut, tanpa ubah beban", () => {
    const low = PROGRAM_CONFIG.formLink.lowScoreThreshold - 5;

    const tierA = evaluateExerciseProgression({
      exerciseId: "bw-air-squat", // Tier A
      repMin: 10,
      repMax: 25,
      sessions: [
        { loadKg: 0, repsPerSet: [15, 15], avgFormScore: low },
        { loadKg: 0, repsPerSet: [15, 15], avgFormScore: low - 2 },
        { loadKg: 0, repsPerSet: [15, 15], avgFormScore: low - 1 },
      ],
    });
    expect(tierA.formWarning).toBe(LOW_FORM_SCORE_MESSAGE);
    // Pastikan rencana progresi tidak dipaksa turun oleh saran form
    expect(tierA.nextRepTarget).toBe(16);

    const tierB = evaluateExerciseProgression({
      exerciseId: "bb-deadlift", // Tier B
      repMin: 3,
      repMax: 8,
      sessions: [
        { loadKg: 100, repsPerSet: [8, 8, 8], avgFormScore: 55 },
        { loadKg: 100, repsPerSet: [8, 8, 8], avgFormScore: 58 },
        { loadKg: 100, repsPerSet: [8, 8, 8], avgFormScore: 52 },
      ],
    });
    expect(tierB.formWarning).toBe(LOW_FORM_SCORE_MESSAGE);
    expect(tierB.nextLoadKg).toBe(102.5);
  });

  it("saran form tidak muncul bila skor = threshold, streak terputus, atau gerakan tier C / scored:false", () => {
    const atThreshold = evaluateExerciseProgression({
      exerciseId: "bw-air-squat",
      repMin: 10,
      repMax: 25,
      sessions: [
        { loadKg: 0, repsPerSet: [12], avgFormScore: 50 },
        { loadKg: 0, repsPerSet: [12], avgFormScore: 55 },
        {
          loadKg: 0,
          repsPerSet: [12],
          avgFormScore: PROGRAM_CONFIG.formLink.lowScoreThreshold,
        },
      ],
    });
    expect(atThreshold.formWarning).toBeNull();

    const brokenStreak = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 5,
      repMax: 10,
      sessions: [
        { loadKg: 80, repsPerSet: [8], avgFormScore: 45 },
        { loadKg: 80, repsPerSet: [8], avgFormScore: 72 },
        { loadKg: 80, repsPerSet: [8], avgFormScore: 45 },
        { loadKg: 80, repsPerSet: [8], avgFormScore: 45 },
      ],
    });
    expect(brokenStreak.formWarning).toBeNull();

    // Tier C (scored: false & tier: "C") wajib TIDAK memicu saran form meski skor rendah 3x
    for (const tierCId of [
      "bb-bench-press",
      "bb-skull-crusher",
      "plate-russian-twist",
      "plate-g2oh",
      "kb-clean-press",
    ]) {
      const res = evaluateExerciseProgression({
        exerciseId: tierCId,
        repMin: 6,
        repMax: 12,
        sessions: [
          { loadKg: 40, repsPerSet: [8, 8], avgFormScore: 30 },
          { loadKg: 40, repsPerSet: [8, 8], avgFormScore: 25 },
          { loadKg: 40, repsPerSet: [8, 8], avgFormScore: 20 },
        ],
      });
      expect(res.formWarning).toBeNull();
    }
  });

  it("extractExerciseHistoryFromSessions mengurutkan kronologis dan menghitung skor rata-rata Form Coach", () => {
    const payload = (
      id: string,
      startedAt: number,
      avgScore?: number
    ): WorkoutSessionPayload => ({
      id,
      title: "Tes",
      startedAt,
      endedAt: startedAt + 600_000,
      durationSeconds: 600,
      totalVolumeKg: 300,
      totalReps: 30,
      prsBroken: 0,
      synced: false,
      exercises: [
        {
          id: "bb-back-squat",
          name: "Squat",
          sets: [
            {
              id: 1,
              exerciseId: "bb-back-squat",
              exerciseName: "Squat",
              setNumber: 1,
              weight: 60,
              reps: 10,
              completed: true,
              timestamp: startedAt,
              ...(avgScore !== undefined
                ? {
                    formSummary: {
                      repsAnalyzed: 10,
                      avgScore,
                      topIssues: [],
                    },
                  }
                : {}),
            },
          ],
        },
      ],
    });

    // Urutan datang dari DB adalah terbaru dulu -> ekstrak mengembalikan terlama -> terbaru
    const history = extractExerciseHistoryFromSessions("bb-back-squat", [
      payload("s3", 3000, 52),
      payload("s1", 1000, 50),
      payload("s2", 2000, 55),
    ]);

    expect(history.map((h) => h.timestamp)).toEqual([1000, 2000, 3000]);
    const advice = evaluateExerciseProgression({
      exerciseId: "bb-back-squat",
      repMin: 5,
      repMax: 10,
      sessions: history,
    });
    expect(advice.nextLoadKg).toBe(62.5);
    expect(advice.formWarning).toBe(LOW_FORM_SCORE_MESSAGE);
  });
});
