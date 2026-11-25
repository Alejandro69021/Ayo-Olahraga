/**
 * Metadata penyusun program (Program Builder) — Ayo-Olahraga
 *
 * Melengkapi src/data/exercises.ts (yang sudah punya primaryMuscle, secondaryMuscles, difficulty).
 * Tidak mengulang field itu. Isi file ini adalah KLASIFIKASI PRAKTIK pelatihan untuk keperluan
 * pemilihan gerakan, bukan temuan studi. Semua nilai (kelelahan, rentang repetisi, area perhatian sendi)
 * heuristik dan boleh disetel; jangan ditampilkan sebagai "berdasarkan penelitian".
 *
 * jointCaution = area yang perlu DIHINDARI/DIGANTI bila pengguna melaporkan keluhan di sana.
 * Ini filter kehati-hatian sederhana, BUKAN penilaian medis.
 */

export type MovementPattern =
  | "squat" | "lunge" | "hinge" | "hinge-ballistic"
  | "h-push" | "v-push" | "dip" | "h-pull" | "v-pull"
  | "elbow-flexion" | "elbow-extension" | "delt-raise" | "rear-delt"
  | "core-flexion" | "core-stability" | "core-rotation"
  | "calf" | "bridge" | "carry" | "prone-extension" | "mobility" | "full-body";

export type ExerciseRole = "main" | "accessory" | "finisher" | "skill";
export type LoadType = "external" | "bodyweight" | "time";
export type JointArea = "shoulder" | "elbow" | "wrist" | "lowerBack" | "knee" | "ankle";
export type Level3 = 1 | 2 | 3;

export interface ExerciseMeta {
  pattern: MovementPattern;
  role: ExerciseRole;
  /** 1 = ringan, 3 = sangat melelahkan secara sistemik. Dipakai untuk urutan & batas per sesi. */
  systemicFatigue: Level3;
  /** 1 = mudah dipelajari, 3 = butuh teknik tinggi. Gerakan skill 3 tidak diberikan ke pemula. */
  skillDemand: Level3;
  loadType: LoadType;
  /** Rentang repetisi (atau detik bila loadType = "time") untuk hipertrofi/umum. Heuristik. */
  repRange: readonly [number, number];
  /** Layak untuk beban berat rendah-repetisi (fokus kekuatan). */
  strengthFriendly: boolean;
  unilateral: boolean;
  jointCaution: readonly JointArea[];
}

const m = (
  pattern: MovementPattern,
  role: ExerciseRole,
  systemicFatigue: Level3,
  skillDemand: Level3,
  loadType: LoadType,
  repRange: readonly [number, number],
  strengthFriendly: boolean,
  unilateral: boolean,
  jointCaution: readonly JointArea[],
): ExerciseMeta => ({ pattern, role, systemicFatigue, skillDemand, loadType, repRange, strengthFriendly, unilateral, jointCaution });

export const EXERCISE_META: Record<string, ExerciseMeta> = {
  // ===== BARBEL =====
  "bb-bench-press":       m("h-push", "main", 2, 2, "external", [5, 10], true, false, ["shoulder"]),
  "bb-incline-press":     m("h-push", "main", 2, 2, "external", [6, 12], true, false, ["shoulder"]),
  "bb-back-squat":        m("squat", "main", 3, 3, "external", [5, 10], true, false, ["knee", "lowerBack"]),
  "bb-bent-row":          m("h-pull", "main", 3, 2, "external", [6, 12], true, false, ["lowerBack"]),
  "bb-reverse-lunges":    m("lunge", "accessory", 2, 2, "external", [8, 12], false, true, ["knee"]),
  "bb-deadlift":          m("hinge", "main", 3, 3, "external", [3, 8], true, false, ["lowerBack"]),
  "bb-romanian-deadlift": m("hinge", "main", 2, 2, "external", [6, 12], true, false, ["lowerBack"]),
  "bb-overhead-press":    m("v-push", "main", 2, 3, "external", [5, 10], true, false, ["shoulder", "lowerBack"]),
  "bb-barbell-curl":      m("elbow-flexion", "accessory", 1, 1, "external", [8, 15], false, false, ["elbow", "wrist"]),
  "bb-skull-crusher":     m("elbow-extension", "accessory", 1, 2, "external", [8, 15], false, false, ["elbow", "shoulder"]),

  // ===== DUMBEL =====
  "db-bench-press":       m("h-push", "main", 2, 1, "external", [6, 12], true, false, ["shoulder"]),
  "db-incline-press":     m("h-push", "main", 2, 1, "external", [8, 12], false, false, ["shoulder"]),
  "db-floor-press":       m("h-push", "accessory", 1, 1, "external", [8, 12], false, true, []),
  "db-single-row":        m("h-pull", "main", 2, 1, "external", [8, 12], false, true, []),
  "db-bicep-curl":        m("elbow-flexion", "accessory", 1, 1, "external", [8, 15], false, false, ["elbow"]),
  "db-hammer-curl":       m("elbow-flexion", "accessory", 1, 1, "external", [8, 15], false, false, ["elbow"]),
  "db-lateral-raise":     m("delt-raise", "accessory", 1, 1, "external", [10, 20], false, false, ["shoulder"]),
  "db-rear-delt-fly":     m("rear-delt", "accessory", 1, 1, "external", [10, 20], false, false, ["shoulder"]),
  "db-goblet-squat":      m("squat", "main", 2, 1, "external", [8, 15], false, false, ["knee"]),
  "db-bulgarian-squat":   m("lunge", "main", 2, 2, "external", [8, 12], false, true, ["knee"]),

  // ===== BERAT BADAN =====
  "bw-pushup":            m("h-push", "main", 1, 1, "bodyweight", [8, 20], false, false, ["wrist", "shoulder"]),
  "bw-diamond-pushup":    m("h-push", "accessory", 1, 2, "bodyweight", [6, 15], false, false, ["wrist", "elbow", "shoulder"]),
  "bw-pike-pushup":       m("v-push", "main", 1, 2, "bodyweight", [6, 15], false, false, ["wrist", "shoulder"]),
  "bw-air-squat":         m("squat", "main", 1, 1, "bodyweight", [10, 25], false, false, ["knee"]),
  "bw-sky-divers":        m("prone-extension", "finisher", 1, 1, "time", [20, 40], false, false, ["lowerBack"]),
  "bw-pullup":            m("v-pull", "main", 2, 2, "bodyweight", [4, 12], true, false, ["shoulder", "elbow"]),
  "bw-hanging-knees":     m("core-flexion", "accessory", 1, 2, "bodyweight", [8, 15], false, false, ["shoulder"]),
  "bw-plank":             m("core-stability", "finisher", 1, 1, "time", [20, 60], false, false, ["shoulder"]),
  "bw-dips":              m("dip", "accessory", 2, 2, "bodyweight", [6, 12], false, false, ["shoulder", "elbow", "wrist"]),
  "bw-glute-bridge":      m("bridge", "accessory", 1, 1, "bodyweight", [12, 25], false, false, []),
  "bw-calf-raise":        m("calf", "accessory", 1, 1, "bodyweight", [10, 25], false, true, ["ankle"]),

  // ===== KETTLEBELL =====
  "kb-swing":             m("hinge-ballistic", "skill", 2, 2, "external", [10, 20], false, false, ["lowerBack"]),
  "kb-goblet-squat":      m("squat", "main", 2, 1, "external", [8, 15], false, false, ["knee"]),
  "kb-clean-press":       m("full-body", "skill", 2, 3, "external", [5, 10], false, true, ["shoulder", "wrist", "lowerBack"]),
  "kb-single-row":        m("h-pull", "main", 2, 1, "external", [8, 12], false, true, []),
  "kb-snatch":            m("full-body", "skill", 3, 3, "external", [5, 10], false, true, ["shoulder", "wrist", "lowerBack"]),
  "kb-halo":              m("mobility", "finisher", 1, 1, "external", [6, 12], false, false, ["shoulder"]),

  // ===== PLATE =====
  "plate-g2oh":           m("full-body", "skill", 2, 2, "external", [6, 10], false, false, ["shoulder", "lowerBack"]),
  "plate-steering-raise": m("delt-raise", "accessory", 1, 1, "external", [10, 15], false, false, ["shoulder"]),
  "plate-russian-twist":  m("core-rotation", "finisher", 1, 1, "external", [12, 24], false, false, ["lowerBack"]),
  "plate-overhead-squat": m("squat", "accessory", 2, 3, "external", [6, 10], false, false, ["shoulder", "knee", "lowerBack"]),
  "plate-pinch-carry":    m("carry", "finisher", 1, 1, "time", [20, 40], false, false, ["wrist"]),
};
