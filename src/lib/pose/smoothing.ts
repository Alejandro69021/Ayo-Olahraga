import { Landmark } from "./landmarks";

/**
 * Menghaluskan satu koordinat Landmark menggunakan Exponential Moving Average (EMA).
 *
 * Rumus: smoothed = alpha * current + (1 - alpha) * previous
 *
 * @param current Landmark saat ini (frame baru)
 * @param previous Landmark hasil penghalusan frame sebelumnya
 * @param alpha Faktor bobot (0 < alpha <= 1). Nilai lebih kecil = lebih halus, nilai lebih besar = lebih responsif.
 * @returns Landmark yang telah dihaluskan
 */
export function smoothLandmark(
  current: Landmark,
  previous: Landmark,
  alpha: number
): Landmark {
  const a = Math.max(0.0001, Math.min(1, alpha));
  const oneMinusA = 1 - a;

  return {
    x: a * current.x + oneMinusA * previous.x,
    y: a * current.y + oneMinusA * previous.y,
    z: a * (current.z ?? 0) + oneMinusA * (previous.z ?? 0),
    visibility:
      current.visibility !== undefined && previous.visibility !== undefined
        ? a * current.visibility + oneMinusA * previous.visibility
        : current.visibility ?? previous.visibility,
  };
}

/**
 * Menghaluskan array Landmark secara keseluruhan menggunakan EMA.
 *
 * @param current Array landmark frame saat ini
 * @param previous Array landmark frame sebelumnya
 * @param alpha Faktor bobot (0 < alpha <= 1)
 * @returns Array landmark yang telah dihaluskan
 */
export function smoothLandmarks(
  current: Landmark[],
  previous: Landmark[] | null,
  alpha: number
): Landmark[] {
  if (!previous || previous.length !== current.length) {
    return current.map((lm) => ({ ...lm }));
  }

  return current.map((curr, idx) => smoothLandmark(curr, previous[idx], alpha));
}

/**
 * Kelas pembungkus untuk menyimpan riwayat dan melakukan smoothing per frame.
 */
export class LandmarkSmoother {
  private previous: Landmark[] | null = null;
  private alpha: number;

  constructor(alpha: number = 0.5) {
    this.alpha = Math.max(0.0001, Math.min(1, alpha));
  }

  /**
   * Menghaluskan landmark frame saat ini berdasarkan riwayat internal.
   */
  public smooth(current: Landmark[]): Landmark[] {
    const smoothed = smoothLandmarks(current, this.previous, this.alpha);
    this.previous = smoothed;
    return smoothed;
  }

  /**
   * Mengatur ulang riwayat penghalusan (misal saat berganti gerakan).
   */
  public reset(): void {
    this.previous = null;
  }
}
