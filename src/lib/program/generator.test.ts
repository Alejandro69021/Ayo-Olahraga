import { describe, it, expect } from "vitest";
import { generatePlan } from "./generator";
import {
  ALL_MUSCLES,
  MUSCLE_CLASS,
  PROGRAM_CONFIG,
  type EquipmentId,
  type MuscleKey,
  type PlannedSession,
  type UserProfile,
} from "./program-types";
import { EXERCISES_DATABASE } from "@/data/exercises";
import { EXERCISE_META } from "@/data/exercise-meta";

function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: "me",
    updatedAt: 1700000000000,
    adultConfirmed: true,
    goal: "otot",
    level: "Menengah",
    daysPerWeek: 4,
    sessionMinutes: 60,
    equipment: ["barbell", "dumbbell"],
    priorityMuscles: [],
    jointComplaints: [],
    ...overrides,
  };
}

function estimateMinutes(session: PlannedSession): number {
  let total = PROGRAM_CONFIG.warmupMinutes;
  for (const ex of session.exercises) {
    const role = EXERCISE_META[ex.exerciseId].role;
    total += ex.sets * PROGRAM_CONFIG.minutesPerSet[role];
  }
  return total;
}

describe("program/generator", () => {
  const exerciseMap = new Map(EXERCISES_DATABASE.map((e) => [e.id, e]));

  it("a. deterministik: profil sama menghasilkan hasil sama persis", () => {
    const profile = makeProfile();
    const p1 = generatePlan(profile);
    const p2 = generatePlan(profile);
    expect(p1).toEqual(p2);
  });

  it("b. tidak ada gerakan di luar alat profil (bodyweight selalu tersedia)", () => {
    const combos: EquipmentId[][] = [
      [],
      ["bodyweight"],
      ["dumbbell"],
      ["kettlebell"],
      ["barbell", "dumbbell"],
    ];

    for (const equipment of combos) {
      const allowed = new Set<EquipmentId>([...equipment, "bodyweight"]);
      const plan = generatePlan(makeProfile({ equipment }));
      for (const week of plan.weeks) {
        for (const sess of week.sessions) {
          for (const planned of sess.exercises) {
            const ex = exerciseMap.get(planned.exerciseId)!;
            expect(allowed.has(ex.equipment)).toBe(true);
          }
        }
      }
    }
  });

  it('c. keluhan "knee" -> tidak ada gerakan dengan jointCaution "knee"', () => {
    const plan = generatePlan(
      makeProfile({
        equipment: ["barbell", "dumbbell", "kettlebell", "plate"],
        jointComplaints: ["knee"],
      })
    );

    for (const week of plan.weeks) {
      for (const sess of week.sessions) {
        for (const planned of sess.exercises) {
          const meta = EXERCISE_META[planned.exerciseId];
          expect(meta.jointCaution).not.toContain("knee");
        }
      }
    }
  });

  it("d. level Pemula -> tidak ada gerakan skillDemand 3", () => {
    const plan = generatePlan(
      makeProfile({
        level: "Pemula",
        equipment: ["barbell", "dumbbell", "kettlebell", "plate"],
        daysPerWeek: 6,
      })
    );

    for (const week of plan.weeks) {
      for (const sess of week.sessions) {
        for (const planned of sess.exercises) {
          const meta = EXERCISE_META[planned.exerciseId];
          expect(meta.skillDemand).toBeLessThan(3);
        }
      }
    }
  });

  it("e. minggu terakhir isDeload true dan total set < total set minggu sebelumnya", () => {
    const plan = generatePlan(makeProfile());
    const lastWeek = plan.weeks[plan.weeks.length - 1];
    const prevWeek = plan.weeks[plan.weeks.length - 2];

    expect(lastWeek.isDeload).toBe(true);

    const sumSets = (w: typeof lastWeek) =>
      w.sessions.reduce(
        (sAcc, s) => sAcc + s.exercises.reduce((eAcc, e) => eAcc + e.sets, 0),
        0
      );

    expect(sumSets(lastWeek)).toBeLessThan(sumSets(prevWeek));
  });

  it("f. tidak ada otot yang melewati cap set mingguan pada minggu mana pun", () => {
    const profiles: UserProfile[] = [
      makeProfile({ level: "Pemula", daysPerWeek: 3 }),
      makeProfile({ level: "Pemula", daysPerWeek: 6, equipment: ["bodyweight"] }),
      makeProfile({ level: "Menengah", daysPerWeek: 4 }),
      makeProfile({ level: "Menengah", daysPerWeek: 4, priorityMuscles: ["CHEST"] }),
      makeProfile({ level: "Lanjutan", daysPerWeek: 5, equipment: ["barbell", "dumbbell", "plate"] }),
    ];

    for (const profile of profiles) {
      const plan = generatePlan(profile);
      for (const week of plan.weeks) {
        const weeklyEff = new Map<MuscleKey, number>();
        for (const m of ALL_MUSCLES) weeklyEff.set(m, 0);

        for (const sess of week.sessions) {
          for (const planned of sess.exercises) {
            const ex = exerciseMap.get(planned.exerciseId)!;
            const p = ex.primaryMuscle as MuscleKey;
            weeklyEff.set(p, (weeklyEff.get(p) ?? 0) + planned.sets);

            for (const sec of ex.secondaryMuscles) {
              const sk = sec as MuscleKey;
              if (sk !== p) {
                weeklyEff.set(
                  sk,
                  (weeklyEff.get(sk) ?? 0) +
                    planned.sets * PROGRAM_CONFIG.secondaryMuscleWeight
                );
              }
            }
          }
        }

        for (const m of ALL_MUSCLES) {
          const factor =
            MUSCLE_CLASS[m] === "small" ? PROGRAM_CONFIG.smallMuscleFactor : 1;
          const cap = PROGRAM_CONFIG.levelVolume[profile.level].cap * factor;
          expect(
            weeklyEff.get(m) ?? 0,
            `${profile.level} ${profile.daysPerWeek}d week ${week.weekIndex} muscle ${m}`
          ).toBeLessThanOrEqual(cap);
        }
      }
    }
  });

  it('g. profil hanya ["bodyweight"] -> warnings menyebut HAMSTRINGS atau TRAPS', () => {
    const plan = generatePlan(makeProfile({ equipment: ["bodyweight"] }));
    const joined = plan.warnings.join(" ");
    expect(joined.includes("HAMSTRINGS") || joined.includes("TRAPS")).toBe(true);
  });

  it('h. prioritas ["CHEST"] -> set mingguan CHEST minggu 1 >= tanpa prioritas', () => {
    const basePlan = generatePlan(makeProfile({ priorityMuscles: [] }));
    const prioPlan = generatePlan(makeProfile({ priorityMuscles: ["CHEST"] }));

    const countChestSets = (plan: typeof basePlan) => {
      let total = 0;
      for (const sess of plan.weeks[0].sessions) {
        for (const planned of sess.exercises) {
          const ex = exerciseMap.get(planned.exerciseId)!;
          if (ex.primaryMuscle === "CHEST") {
            total += planned.sets;
          } else if (ex.secondaryMuscles.includes("CHEST" as never)) {
            total += planned.sets * PROGRAM_CONFIG.secondaryMuscleWeight;
          }
        }
      }
      return total;
    };

    expect(countChestSets(prioPlan)).toBeGreaterThanOrEqual(
      countChestSets(basePlan)
    );
  });

  it("i. semua exerciseId di rencana ada di EXERCISES_DATABASE", () => {
    const plan = generatePlan(
      makeProfile({
        daysPerWeek: 6,
        equipment: ["barbell", "dumbbell", "kettlebell", "plate"],
      })
    );
    for (const week of plan.weeks) {
      for (const sess of week.sessions) {
        for (const planned of sess.exercises) {
          expect(exerciseMap.has(planned.exerciseId)).toBe(true);
        }
      }
    }
  });

  it("j. jumlah sesi per minggu = daysPerWeek untuk daysPerWeek 2..6", () => {
    const daysOptions: Array<2 | 3 | 4 | 5 | 6> = [2, 3, 4, 5, 6];
    for (const daysPerWeek of daysOptions) {
      const plan = generatePlan(makeProfile({ daysPerWeek }));
      expect(plan.weeks).toHaveLength(PROGRAM_CONFIG.mesocycleWeeks);
      for (const week of plan.weeks) {
        expect(week.sessions).toHaveLength(daysPerWeek);
      }
    }
  });

  it("k. estimasi menit tiap sesi <= sessionMinutes", () => {
    const sessionOptions: Array<30 | 45 | 60 | 75 | 90> = [30, 45, 60, 75, 90];
    for (const sessionMinutes of sessionOptions) {
      const plan = generatePlan(
        makeProfile({
          level: "Lanjutan",
          daysPerWeek: 4,
          sessionMinutes,
        })
      );
      for (const week of plan.weeks) {
        for (const sess of week.sessions) {
          expect(estimateMinutes(sess)).toBeLessThanOrEqual(sessionMinutes);
        }
      }
    }
  });

  it('l. untuk profil otot/Menengah/4 hari/60 menit/["barbell","dumbbell"]: minggu non-deload tanpa sets < minSetsPerExercise', () => {
    const plan = generatePlan(makeProfile());
    for (const week of plan.weeks) {
      if (week.isDeload) continue;
      for (const sess of week.sessions) {
        for (const planned of sess.exercises) {
          expect(
            planned.sets,
            `week ${week.weekIndex} ${sess.label} ${planned.exerciseId}`
          ).toBeGreaterThanOrEqual(PROGRAM_CONFIG.minSetsPerExercise);
        }
      }
    }
  });

  it("m. untuk profil yang sama: setiap sesi Lower punya minimal 2 gerakan dengan alat selain bodyweight", () => {
    const plan = generatePlan(makeProfile());
    for (const week of plan.weeks) {
      for (const sess of week.sessions) {
        if (!sess.label.toLowerCase().includes("lower")) continue;
        const nonBodyweight = sess.exercises.filter((planned) => {
          const ex = exerciseMap.get(planned.exerciseId)!;
          return ex.equipment !== "bodyweight";
        });
        expect(
          nonBodyweight.length,
          `week ${week.weekIndex} ${sess.label}`
        ).toBeGreaterThanOrEqual(2);
      }
    }
  });

  it('n. untuk profil Pemula dengan alat ["bodyweight"]: hasil tanpa error dan tanpa 1 set di minggu non-deload', () => {
    const plan = generatePlan(
      makeProfile({
        level: "Pemula",
        equipment: ["bodyweight"],
      })
    );
    expect(plan.weeks).toHaveLength(PROGRAM_CONFIG.mesocycleWeeks);
    for (const week of plan.weeks) {
      if (week.isDeload) continue;
      for (const sess of week.sessions) {
        for (const planned of sess.exercises) {
          expect(
            planned.sets,
            `week ${week.weekIndex} ${sess.label} ${planned.exerciseId}`
          ).toBeGreaterThanOrEqual(PROGRAM_CONFIG.minSetsPerExercise);
        }
      }
    }
  });
});
