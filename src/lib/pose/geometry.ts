import {
  Landmark,
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
} from "./landmarks";

/**
 * PANDUAN KOORDINAT DAN DISTORSI ASPEK RASIO:
 *
 * 1. Sangat disarankan menggunakan `worldLandmarks` (koordinat dunia 3D dalam satuan meter)
 *    yang disediakan oleh MediaPipe PoseLandmarker jika tersedia, karena skalanya 1:1:1
 *    dan bebas dari distorsi rasio aspek layar / viewport kamera.
 *
 * 2. Apabila Anda harus menggunakan koordinat gambar yang dinormalisasi (`landmarks` dengan rentang 0..1),
 *    pastikan untuk mengalikan koordinat x dengan lebar video (frameWidth) dan koordinat y dengan
 *    tinggi video (frameHeight) terlebih dahulu sebelum memanggil fungsi kalkulasi sudut ini.
 *    Jika tidak dikalikan piksel nyata, perbedaan rasio layar (misal 16:9 atau 4:3) akan
 *    mendistorsi sudut sendi secara signifikan.
 */

/**
 * Menghitung sudut sendi di titik b (antara vektor BA dan BC) dalam derajat (0°–180°).
 * Menggunakan vektor 3D (x, y, z).
 *
 * @param a Titik ujung pertama
 * @param b Titik sendi pusat (vertex sudut)
 * @param c Titik ujung kedua
 * @returns Sudut dalam derajat dari 0 hingga 180
 */
export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const v1 = {
    x: a.x - b.x,
    y: a.y - b.y,
    z: (a.z ?? 0) - (b.z ?? 0),
  };

  const v2 = {
    x: c.x - b.x,
    y: c.y - b.y,
    z: (c.z ?? 0) - (b.z ?? 0),
  };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y + v2.z * v2.z);

  if (mag1 === 0 || mag2 === 0) {
    return 0;
  }

  // Menjaga nilai cosinus dalam batas valid [-1, 1] untuk mencegah NaN dari pembulatan floating point
  const cosine = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  const angleRad = Math.acos(cosine);

  return (angleRad * 180) / Math.PI;
}

/**
 * Menghitung sudut sendi 2D (x, y) di titik b dalam derajat (0°–180°), mengabaikan sumbu z.
 */
export function angleAt2D(a: Landmark, b: Landmark, c: Landmark): number {
  return angleAt(
    { x: a.x, y: a.y, z: 0 },
    { x: b.x, y: b.y, z: 0 },
    { x: c.x, y: c.y, z: 0 }
  );
}

/**
 * Menghitung sudut kemiringan garis (dari top ke bottom) terhadap sumbu vertikal.
 * - Garis lurus vertikal sempurna = 0°
 * - Garis horizontal sempurna = 90°
 *
 * @param top Titik bagian atas garis
 * @param bottom Titik bagian bawah garis
 * @returns Sudut deviasi dari vertikal dalam derajat (0°–90°+)
 */
export function angleFromVertical(top: Landmark, bottom: Landmark): number {
  const dx = bottom.x - top.x;
  const dy = Math.abs(bottom.y - top.y);
  const dz = (bottom.z ?? 0) - (top.z ?? 0);

  const horizontalDist = Math.sqrt(dx * dx + dz * dz);

  if (horizontalDist === 0 && dy === 0) {
    return 0;
  }

  // Sudut deviasi dari sumbu vertikal (Y)
  const angleRad = Math.atan2(horizontalDist, dy);
  return (angleRad * 180) / Math.PI;
}

/**
 * Menghitung sudut kemiringan 2D (x, y) garis (dari top ke bottom) terhadap sumbu vertikal, mengabaikan sumbu z.
 */
export function angleFromVertical2D(top: Landmark, bottom: Landmark): number {
  return angleFromVertical(
    { x: top.x, y: top.y, z: 0 },
    { x: bottom.x, y: bottom.y, z: 0 }
  );
}

/**
 * Menentukan sisi tubuh mana ("left" | "right") yang paling terlihat jelas menghadap kamera
 * berdasarkan rata-rata nilai visibility dari 4 sendi utama: bahu, pinggul, lutut, dan pergelangan kaki.
 *
 * @param landmarks Array landmark pose lengkap
 * @returns "left" jika sisi kiri lebih terlihat, "right" jika sisi kanan lebih terlihat
 */
export function pickVisibleSide(landmarks: Landmark[]): "left" | "right" {
  if (!landmarks || landmarks.length === 0) {
    return "left";
  }

  const leftJoints = [L_SHOULDER, L_HIP, L_KNEE, L_ANKLE];
  const rightJoints = [R_SHOULDER, R_HIP, R_KNEE, R_ANKLE];

  const getAvgVisibility = (indices: number[]): number => {
    let total = 0;
    for (const idx of indices) {
      const lm = landmarks[idx];
      total += lm?.visibility ?? 0;
    }
    return total / indices.length;
  };

  const leftAvg = getAvgVisibility(leftJoints);
  const rightAvg = getAvgVisibility(rightJoints);

  return leftAvg >= rightAvg ? "left" : "right";
}
