import type { Goal } from "./program-types";

export interface NutritionGuidance {
  goal: Goal;
  proteinPerKgRange: readonly [number, number];
  energyDirection: string;
  extraNote: string | null;
}

export interface ProteinGramRange {
  min: number;
  max: number;
}

/**
 * Panduan protein umum berbasis berat badan per hari.
 * Sumber kisaran protein: ISSN Position Stand: protein and exercise, 2017 (JISSN 14:20).
 */
export const NUTRITION_CONFIG = {
  proteinPerKg: {
    otot: [1.4, 2.0],
    kekuatan: [1.4, 2.0],
    umum: [1.4, 2.0],
    diet: [1.4, 2.0],
  } satisfies Record<Goal, readonly [number, number]>,
  energyDirection: {
    otot: "surplus ringan",
    diet: "defisit sedang",
    kekuatan: "pertahankan",
    umum: "pertahankan",
  } satisfies Record<Goal, string>,
  dietExtraNote:
    "Penelitian pada orang yang sudah terlatih beban memakai 2,3-3,1 g/kg saat defisit; ini tidak wajib dicapai.",
} as const;

const MIN_WEIGHT_KG = 30;
const MAX_WEIGHT_KG = 250;
const GRAM_ROUND_STEP = 5;

function roundToMultipleOfFive(value: number): number {
  return Math.round(value / GRAM_ROUND_STEP) * GRAM_ROUND_STEP;
}

/** Hitung kisaran protein harian (gram) dibulatkan ke kelipatan 5; null bila berat badan di luar 30-250 kg. */
export function proteinGramRange(
  weightKg: number,
  goal: Goal
): ProteinGramRange | null {
  if (
    typeof weightKg !== "number" ||
    !Number.isFinite(weightKg) ||
    weightKg < MIN_WEIGHT_KG ||
    weightKg > MAX_WEIGHT_KG
  ) {
    return null;
  }

  const [minFactor, maxFactor] = NUTRITION_CONFIG.proteinPerKg[goal];
  return {
    min: roundToMultipleOfFive(weightKg * minFactor),
    max: roundToMultipleOfFive(weightKg * maxFactor),
  };
}

/** Ambil kisaran protein per kg, arah energi, dan catatan tambahan sesuai tujuan program. */
export function getNutritionGuidance(goal: Goal): NutritionGuidance {
  return {
    goal,
    proteinPerKgRange: NUTRITION_CONFIG.proteinPerKg[goal],
    energyDirection: NUTRITION_CONFIG.energyDirection[goal],
    extraNote: goal === "diet" ? NUTRITION_CONFIG.dietExtraNote : null,
  };
}
