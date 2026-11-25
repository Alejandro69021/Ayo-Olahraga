import { describe, it, expect } from "vitest";
import { EXERCISE_META } from "./exercise-meta";
import { EXERCISES_DATABASE } from "./exercises";

describe("EXERCISE_META", () => {
  it("setiap id di EXERCISES_DATABASE punya entri di EXERCISE_META (semua) dan tidak ada id yatim", () => {
    const dbIds = EXERCISES_DATABASE.map((e) => e.id);
    const metaIds = Object.keys(EXERCISE_META);

    expect(dbIds).toHaveLength(EXERCISES_DATABASE.length);
    expect(metaIds).toHaveLength(EXERCISES_DATABASE.length);

    const dbIdSet = new Set(dbIds);
    const metaIdSet = new Set(metaIds);

    const missingInMeta = dbIds.filter((id) => !metaIdSet.has(id));
    const orphanInMeta = metaIds.filter((id) => !dbIdSet.has(id));

    expect(missingInMeta).toEqual([]);
    expect(orphanInMeta).toEqual([]);
  });

  it("repMin < repMax untuk semua gerakan", () => {
    for (const [id, meta] of Object.entries(EXERCISE_META)) {
      expect(meta.repRange[0], `${id}: repMin harus < repMax`).toBeLessThan(meta.repRange[1]);
    }
  });

  it('gerakan dengan loadType "time" punya repRange dalam 15-90', () => {
    const timeExercises = Object.entries(EXERCISE_META).filter(
      ([, meta]) => meta.loadType === "time"
    );
    expect(timeExercises.length).toBeGreaterThan(0);

    for (const [id, meta] of timeExercises) {
      expect(meta.repRange[0], `${id}: durasi minimum < 15`).toBeGreaterThanOrEqual(15);
      expect(meta.repRange[1], `${id}: durasi maksimum > 90`).toBeLessThanOrEqual(90);
    }
  });
});
