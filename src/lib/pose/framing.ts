import { Landmark } from "./landmarks";
import { RuleSet } from "./rules/types";

export interface FramingResult {
  ok: boolean;
  missing: number[];
  message: string;
}

function isLandmarkVisible(landmarks: Landmark[], idx: number): boolean {
  const lm = landmarks[idx];
  if (!lm) return false;
  const isVisible = lm.visibility === undefined || lm.visibility >= 0.5;
  const inBounds = lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;
  return isVisible && inBounds;
}

/**
 * Memeriksa apakah sendi-sendi (landmarks) yang diwajibkan berada di dalam area pandang kamera
 * dan memiliki nilai visibilitas yang cukup.
 *
 * Kriteria terlihat:
 * 1. Nilai visibility >= 0.5 (jika field visibility tidak ada, diasumsikan terlihat selama dalam koordinat batas)
 * 2. Berada di dalam frame normalisasi 0–1 (x >= 0 && x <= 1 && y >= 0 && y <= 1)
 * 3. Jika view === "side", titik < 11 tetap wajib dan titik >= 11 cukup lengkap pada sisi kiri (ganjil) ATAU kanan (genap).
 *
 * @param landmarks Array landmark dari pose landmarker
 * @param requiredIndices Daftar indeks landmark yang wajib tampak dalam frame
 * @param view Sudut pandang latihan opsional
 * @returns FramingResult dengan status 'ok', daftar indeks yang hilang, dan pesan panduan
 */
export function checkFraming(
  landmarks: Landmark[] | null | undefined,
  requiredIndices: number[],
  view?: RuleSet["view"]
): FramingResult {
  if (!landmarks || landmarks.length === 0) {
    return {
      ok: false,
      missing: [...requiredIndices],
      message: "Tubuh tidak terdeteksi — silakan berdiri menghadap kamera.",
    };
  }

  let missing: number[];

  if (view === "side") {
    const headMissing = requiredIndices.filter(
      (idx) => idx < 11 && !isLandmarkVisible(landmarks, idx)
    );
    const leftIndices = requiredIndices.filter((idx) => idx >= 11 && idx % 2 === 1);
    const rightIndices = requiredIndices.filter((idx) => idx >= 11 && idx % 2 === 0);
    const leftMissing = leftIndices.filter((idx) => !isLandmarkVisible(landmarks, idx));
    const rightMissing = rightIndices.filter((idx) => !isLandmarkVisible(landmarks, idx));

    let sideOk = true;
    let bestSideMissing: number[] = [];

    if (leftIndices.length > 0 && rightIndices.length > 0) {
      sideOk = leftMissing.length === 0 || rightMissing.length === 0;
      bestSideMissing =
        leftMissing.length <= rightMissing.length ? leftMissing : rightMissing;
    } else if (leftIndices.length > 0) {
      sideOk = leftMissing.length === 0;
      bestSideMissing = leftMissing;
    } else if (rightIndices.length > 0) {
      sideOk = rightMissing.length === 0;
      bestSideMissing = rightMissing;
    }

    missing = headMissing.length === 0 && sideOk ? [] : [...headMissing, ...bestSideMissing];
  } else {
    missing = requiredIndices.filter((idx) => !isLandmarkVisible(landmarks, idx));
  }

  if (missing.length === 0) {
    return {
      ok: true,
      missing: [],
      message: "Posisi tubuh ideal — siap latihan.",
    };
  }

  return {
    ok: false,
    missing,
    message: "Mundur sedikit — seluruh tubuh harus terlihat di kamera.",
  };
}
