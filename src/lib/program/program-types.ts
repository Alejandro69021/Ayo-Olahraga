/**
 * Tipe & konfigurasi Program Builder — Ayo-Olahraga
 *
 * ATURAN: semua angka di PROGRAM_CONFIG adalah HEURISTIK titik awal (kecuali yang diberi catatan sumber).
 * Jangan ditampilkan ke pengguna sebagai "berdasarkan penelitian". Disetel di satu tempat ini.
 * File ini murni (tanpa React/DOM) sehingga bisa dites dengan vitest dan dipakai ulang (mis. ProspekBola).
 */

// ───────────── Dasar ─────────────
export type Goal = "otot" | "diet" | "kekuatan" | "umum";
export type Level = "Pemula" | "Menengah" | "Lanjutan"; // sama dengan ExerciseDetail.difficulty
export type EquipmentId = "barbell" | "dumbbell" | "bodyweight" | "kettlebell" | "plate";
export type MuscleKey =
  | "CHEST" | "BACK" | "SHOULDERS" | "BICEPS" | "TRICEPS" | "QUADRICEPS" | "HAMSTRINGS"
  | "GLUTES" | "CALVES" | "ABDOMINALS" | "OBLIQUES" | "FOREARMS" | "TRAPS"; // = ExerciseAttributeValueEnum
export type JointAreaKey = "shoulder" | "elbow" | "wrist" | "lowerBack" | "knee" | "ankle";

export const ALL_MUSCLES: readonly MuscleKey[] = [
  "CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS", "QUADRICEPS", "HAMSTRINGS",
  "GLUTES", "CALVES", "ABDOMINALS", "OBLIQUES", "FOREARMS", "TRAPS",
];

// ───────────── Profil pengguna (disimpan lokal) ─────────────
export interface UserProfile {
  id: "me"; // satu profil per perangkat
  updatedAt: number;
  /** Konfirmasi pengguna bahwa ia berusia 18+; usia/tanggal lahir TIDAK disimpan. */
  adultConfirmed: boolean;
  goal: Goal;
  level: Level;
  daysPerWeek: 2 | 3 | 4 | 5 | 6;
  sessionMinutes: 30 | 45 | 60 | 75 | 90;
  equipment: EquipmentId[];
  /** Otot yang ingin diprioritaskan (maks 2). Kosong = tanpa prioritas. */
  priorityMuscles: MuscleKey[];
  /** Area yang sedang ada keluhan; gerakan yang berisiko di area ini dihindari. Bukan penilaian medis. */
  jointComplaints: JointAreaKey[];
}

// ───────────── Rencana program ─────────────
export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  repMin: number; // atau detik bila loadType = "time"
  repMax: number;
  targetRIR: number; // repetisi cadangan yang disarankan (0–4)
  restSeconds: number;
}

export interface PlannedSession {
  label: string; // mis. "Upper A"
  exercises: PlannedExercise[];
}

export interface PlannedWeek {
  weekIndex: number; // 1..mesocycleWeeks
  isDeload: boolean;
  sessions: PlannedSession[];
}

export interface ProgramPlan {
  id: string;
  createdAt: number;
  name: string;
  goal: Goal;
  level: Level;
  daysPerWeek: number;
  mesocycleWeeks: number;
  weeks: PlannedWeek[];
  /** Penjelasan singkat bahasa Indonesia mengapa program ini dibentuk (transparansi). */
  rationale: string[];
  /** Peringatan keterbatasan katalog/profil, mis. "Otot TRAPS tidak punya gerakan di katalog". */
  warnings: string[];
}

// ───────────── Status progresi per gerakan ─────────────
export interface ProgressionState {
  exerciseId: string;
  lastLoadKg: number; // 0 untuk berat badan/waktu
  lastRepsPerSet: number[]; // repetisi (atau detik) per set pada sesi terakhir
  updatedAt: number;
}

export interface ProgressionSuggestion {
  exerciseId: string;
  nextLoadKg: number;
  nextRepTarget: number;
  reason: string; // kalimat Indonesia singkat
}

// ───────────── Konfigurasi (HEURISTIK) ─────────────
export const MUSCLE_CLASS: Record<MuscleKey, "large" | "small"> = {
  CHEST: "large", BACK: "large", QUADRICEPS: "large", HAMSTRINGS: "large", GLUTES: "large", SHOULDERS: "large",
  BICEPS: "small", TRICEPS: "small", CALVES: "small", ABDOMINALS: "small", OBLIQUES: "small", FOREARMS: "small", TRAPS: "small",
};

export interface GoalPreset {
  /** Pengali volume (set per otot per minggu) terhadap tabel level. Heuristik. */
  volumeFactor: number;
  rirTarget: readonly [number, number];
  restMainSeconds: number;
  restAccessorySeconds: number;
  /** Gerakan utama dipaksa ke rentang repetisi ini bila gerakannya strengthFriendly. */
  mainRepOverride?: readonly [number, number];
  preferStrengthFriendly: boolean;
}

export const PROGRAM_CONFIG = {
  /**
   * Set mingguan per otot BESAR (efektif) dari awal sampai batas atas mesosiklus, per level.
   * Satu-satunya jangkar bukti: tinjauan sistematis menyarankan rentang 12–20 set/minggu/otot untuk
   * pria muda terlatih (PMC8884877). Nilai pemula/menengah dan titik awal = heuristik konservatif.
   */
  levelVolume: {
    Pemula:   { start: 6,  cap: 10 },
    Menengah: { start: 10, cap: 16 },
    Lanjutan: { start: 12, cap: 20 },
  } satisfies Record<Level, { start: number; cap: number }>,

  /** Otot KECIL memakai pengali ini terhadap tabel di atas. Heuristik. */
  smallMuscleFactor: 0.6,

  /** Set efektif: 1 untuk otot utama, bobot ini untuk otot pendukung. Heuristik (metode hitung diperdebatkan). */
  secondaryMuscleWeight: 0.5,

  /** Tambahan set per otot per minggu selama blok akumulasi (pola RP: ±1 set/minggu). */
  weeklySetIncrement: 1,

  /** Panjang mesosiklus: 4 minggu akumulasi + 1 minggu deload (blok 4–6 minggu + deload wajib, pola RP). */
  mesocycleWeeks: 5,
  /** Volume minggu deload terhadap volume minggu terakhir akumulasi. Beban tetap. Heuristik. */
  deloadVolumeFactor: 0.5,

  /** Batas set efektif satu otot dalam satu sesi. Heuristik. */
  maxSetsPerMusclePerSession: 8,

  /** Batas minimum set per gerakan pada minggu akumulasi (non-deload). Heuristik. */
  minSetsPerExercise: 2,

  /** Batas maksimum set per gerakan dalam satu sesi. Heuristik. */
  maxSetsPerExercise: 5,

  /** Estimasi menit per set (termasuk istirahat). Untuk menyesuaikan jumlah gerakan dengan durasi sesi. Heuristik. */
  minutesPerSet: { main: 2.5, accessory: 1.8, finisher: 1.2, skill: 2.5 },
  warmupMinutes: 5,

  /** Pengali volume & batas gerakan bila pengguna memilih otot prioritas. Heuristik. */
  priority: { volumeMultiplier: 1.25, maxPriorityMuscles: 2 },

  goals: {
    otot:     { volumeFactor: 1.0, rirTarget: [1, 3], restMainSeconds: 120, restAccessorySeconds: 75, preferStrengthFriendly: false },
    diet:     { volumeFactor: 0.8, rirTarget: [1, 3], restMainSeconds: 90,  restAccessorySeconds: 60, preferStrengthFriendly: false },
    kekuatan: { volumeFactor: 0.7, rirTarget: [1, 3], restMainSeconds: 180, restAccessorySeconds: 90, preferStrengthFriendly: true, mainRepOverride: [3, 6] },
    umum:     { volumeFactor: 0.7, rirTarget: [2, 4], restMainSeconds: 90,  restAccessorySeconds: 60, preferStrengthFriendly: false },
  } satisfies Record<Goal, GoalPreset>,

  /** Progresi ganda: naikkan repetisi dulu; bila semua set mencapai batas atas, naikkan beban. */
  progression: {
    loadIncrementKg: { barbell: 2.5, dumbbell: 2, kettlebell: 4, plate: 2.5, bodyweight: 0 } satisfies Record<EquipmentId, number>,
    /** Bila batas atas tercapai di semua set pada sesi ini, naikkan beban pada sesi berikutnya. */
    sessionsAtTopToIncrease: 1,
    /** Turunkan beban bila repetisi jatuh di bawah batas bawah di ≥ separuh set dua sesi berturut-turut. */
    sessionsBelowFloorToDecrease: 2,
    decreaseFactor: 0.9,
  },

  /** Hubungan dengan Form Coach: hanya saran lunak; skor kamera punya galat ±10–15°. Hanya tier A/B. */
  formLink: { lowScoreThreshold: 60, sessionsToTrigger: 3 },
} as const;

// ───────────── Templat split (berdasarkan hari per minggu) ─────────────
export interface SessionTemplate {
  label: string;
  /** Otot yang dilatih sesi ini, urut dari yang diprioritaskan pada sesi itu. */
  muscles: readonly MuscleKey[];
}

const FB_A: SessionTemplate = { label: "Full Body A", muscles: ["QUADRICEPS", "CHEST", "BACK", "SHOULDERS", "ABDOMINALS", "BICEPS"] };
const FB_B: SessionTemplate = { label: "Full Body B", muscles: ["HAMSTRINGS", "GLUTES", "BACK", "CHEST", "TRICEPS", "CALVES"] };
const FB_C: SessionTemplate = { label: "Full Body C", muscles: ["QUADRICEPS", "BACK", "SHOULDERS", "CHEST", "BICEPS", "TRICEPS"] };
const UP_A: SessionTemplate = { label: "Upper A", muscles: ["CHEST", "BACK", "SHOULDERS", "BICEPS", "TRICEPS"] };
const UP_B: SessionTemplate = { label: "Upper B", muscles: ["BACK", "CHEST", "SHOULDERS", "TRICEPS", "BICEPS"] };
const LO_A: SessionTemplate = { label: "Lower A", muscles: ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ABDOMINALS"] };
const LO_B: SessionTemplate = { label: "Lower B", muscles: ["HAMSTRINGS", "QUADRICEPS", "GLUTES", "CALVES", "ABDOMINALS"] };
const PUSH: SessionTemplate = { label: "Push", muscles: ["CHEST", "SHOULDERS", "TRICEPS"] };
const PULL: SessionTemplate = { label: "Pull", muscles: ["BACK", "BICEPS", "FOREARMS"] };
const LEGS: SessionTemplate = { label: "Legs", muscles: ["QUADRICEPS", "HAMSTRINGS", "GLUTES", "CALVES", "ABDOMINALS"] };

export const SPLIT_TEMPLATES: Record<2 | 3 | 4 | 5 | 6, readonly SessionTemplate[]> = {
  2: [FB_A, FB_B],
  3: [FB_A, FB_B, FB_C],
  4: [UP_A, LO_A, UP_B, LO_B],
  5: [UP_A, LO_A, PUSH, PULL, LEGS],
  6: [PUSH, PULL, LEGS, { ...PUSH, label: "Push 2" }, { ...PULL, label: "Pull 2" }, { ...LEGS, label: "Legs 2" }],
};

export const JOINT_LABEL_ID: Record<JointAreaKey, string> = {
  shoulder: "Bahu", elbow: "Siku", wrist: "Pergelangan tangan", lowerBack: "Punggung bawah", knee: "Lutut", ankle: "Pergelangan kaki",
};

export const GOAL_LABEL_ID: Record<Goal, string> = {
  otot: "Menambah otot (bulking)", diet: "Menurunkan lemak (diet)", kekuatan: "Meningkatkan kekuatan", umum: "Kebugaran umum",
};
