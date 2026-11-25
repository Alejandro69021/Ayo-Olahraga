import { describe, expect, it } from "vitest";
import type { Goal } from "./program-types";
import {
  NUTRITION_CONFIG,
  getNutritionGuidance,
  proteinGramRange,
} from "./nutrition";

const ALL_GOALS: readonly Goal[] = ["otot", "kekuatan", "umum", "diet"];

describe("nutrition guidance", () => {
  it("a. berat 70 kg menghasilkan 100 sampai 140 gram untuk setiap goal", () => {
    for (const goal of ALL_GOALS) {
      expect(proteinGramRange(70, goal)).toEqual({ min: 100, max: 140 });
    }
  });

  it("b. input 20 dan 300 (serta nilai di luar 30-250 / non-finite) mengembalikan null", () => {
    expect(proteinGramRange(20, "otot")).toBeNull();
    expect(proteinGramRange(300, "diet")).toBeNull();
    expect(proteinGramRange(29.9, "umum")).toBeNull();
    expect(proteinGramRange(250.1, "kekuatan")).toBeNull();
    expect(proteinGramRange(Number.NaN, "otot")).toBeNull();

    // Batas inklusif 30 dan 250 valid
    expect(proteinGramRange(30, "otot")).not.toBeNull();
    expect(proteinGramRange(250, "otot")).not.toBeNull();
  });

  it("c. setiap goal memiliki arah energi sesuai ketentuan", () => {
    expect(getNutritionGuidance("otot").energyDirection).toBe("surplus ringan");
    expect(getNutritionGuidance("diet").energyDirection).toBe("defisit sedang");
    expect(getNutritionGuidance("kekuatan").energyDirection).toBe("pertahankan");
    expect(getNutritionGuidance("umum").energyDirection).toBe("pertahankan");

    for (const goal of ALL_GOALS) {
      const guidance = getNutritionGuidance(goal);
      expect(guidance.proteinPerKgRange).toEqual([1.4, 2.0]);
      expect(guidance.energyDirection.length).toBeGreaterThan(0);
    }
  });

  it("d. tidak ada string atau metrik kalori di keluaran fungsi maupun konfigurasi", () => {
    const serialized = [
      JSON.stringify(NUTRITION_CONFIG),
      ...ALL_GOALS.map((g) => JSON.stringify(getNutritionGuidance(g))),
      ...ALL_GOALS.map((g) => JSON.stringify(proteinGramRange(70, g))),
    ]
      .join(" ")
      .toLowerCase();

    expect(serialized).not.toMatch(/kalori|calorie|kcal|kkal|bmr|tdee/);
  });

  it("e. hanya goal 'diet' yang punya catatan tambahan; goal lain null", () => {
    const dietGuidance = getNutritionGuidance("diet");
    expect(dietGuidance.extraNote).toBe(
      "Penelitian pada orang yang sudah terlatih beban memakai 2,3-3,1 g/kg saat defisit; ini tidak wajib dicapai."
    );

    for (const goal of ["otot", "kekuatan", "umum"] as const) {
      expect(getNutritionGuidance(goal).extraNote).toBeNull();
    }
  });
});
