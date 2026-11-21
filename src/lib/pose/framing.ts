import { Landmark } from "./landmarks";

export interface FramingResult {
  ok: boolean;
  missing: number[];
  message: string;
}

/**
 * Memeriksa apakah sendi-sendi (landmarks) yang diwajibkan berada di dalam area pandang kamera
 * dan memiliki nilai visibilitas yang cukup.
 *
 * Kriteria terlihat:
 * 1. Nilai visibility >= 0.5 (jika field visibility tidak ada, diasumsikan terlihat selama dalam koordinat batas)
 * 2. Berada di dalam frame normalisasi 0–1 (x >= 0 && x <= 1 && y >= 0 && y <= 1)
 *
 * @param landmarks Array landmark dari pose landmarker
 * @param requiredIndices Daftar indeks landmark yang wajib tampak dalam frame
 * @returns FramingResult dengan status 'ok', daftar indeks yang hilang, dan pesan panduan
 */
export function checkFraming(
  landmarks: Landmark[] | null | undefined,
  requiredIndices: number[]
): FramingResult {
  if (!landmarks || landmarks.length === 0) {
    return {
      ok: false,
      missing: [...requiredIndices],
      message: "Tubuh tidak terdeteksi — silakan berdiri menghadap kamera.",
    };
  }

  const missing: number[] = [];

  for (const idx of requiredIndices) {
    const lm = landmarks[idx];
    if (!lm) {
      missing.push(idx);
      continue;
    }

    const isVisible = lm.visibility === undefined || lm.visibility >= 0.5;
    const inBounds = lm.x >= 0 && lm.x <= 1 && lm.y >= 0 && lm.y <= 1;

    if (!isVisible || !inBounds) {
      missing.push(idx);
    }
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
