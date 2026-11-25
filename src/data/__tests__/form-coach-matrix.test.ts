import { describe, it, expect } from "vitest";
import { FORM_COACH_MATRIX } from "../form-coach-matrix";
import { FORM_REFERENCE_MAP } from "../form-references";
import { EXERCISES_DATABASE } from "../exercises";

describe("Form Coach Matrix & References Integrity", () => {
  it("(a) semua entri cocok jumlahnya dan setiap exerciseId ada di src/data/exercises.ts", () => {
    expect(FORM_COACH_MATRIX.length).toBe(EXERCISES_DATABASE.length);

    const validExerciseIds = new Set(EXERCISES_DATABASE.map((e) => e.id));
    for (const entry of FORM_COACH_MATRIX) {
      expect(validExerciseIds.has(entry.exerciseId)).toBe(true);
    }
  });

  it("(b) setiap id di refs dan readingRefs ada di FORM_REFERENCE_MAP", () => {
    for (const entry of FORM_COACH_MATRIX) {
      // Check readingRefs
      for (const refId of entry.readingRefs) {
        expect(FORM_REFERENCE_MAP[refId]).toBeDefined();
        expect(FORM_REFERENCE_MAP[refId].id).toBe(refId);
      }

      // Check checks[].refs
      for (const check of entry.checks) {
        for (const refId of check.refs) {
          expect(FORM_REFERENCE_MAP[refId]).toBeDefined();
          expect(FORM_REFERENCE_MAP[refId].id).toBe(refId);
        }
      }
    }
  });

  it("(c) tidak ada exerciseId ganda", () => {
    const seenIds = new Set<string>();
    for (const entry of FORM_COACH_MATRIX) {
      expect(seenIds.has(entry.exerciseId)).toBe(false);
      seenIds.add(entry.exerciseId);
    }
    expect(seenIds.size).toBe(EXERCISES_DATABASE.length);
  });
});
