/**
 * Matriks Form Coach — SEMUA 46 gerakan di src/data/exercises.ts
 *
 * Tiga tingkat kelayakan kamera (1 kamera 2D, model PoseLandmarker):
 *  A = andal  : sudut sendi sagital terbaca baik; semua cek utama bisa dinilai.
 *  B = sebagian: sebagian cek andal, sebagian TIDAK dinilai (lihat notScored).
 *  C = terbatas: hanya hitung repetisi/waktu + 1–2 cek kasar. Jangan beri skor yang terkesan presisi.
 *
 * Setiap cek punya label bukti:
 *  - "prinsip-jurnal"  : ALASAN cek ini didukung studi di form-references.ts (arah/prinsip, bukan angka derajat).
 *  - "praktik-pelatih" : praktik umum pelatih; belum ada jurnal terverifikasi untuk cek spesifik ini.
 * Angka ambang (derajat/rasio) SELALU heuristik dan hidup di src/lib/pose/rules/config.ts.
 *
 * Isi file ini disusun dan diperiksa tipenya. Jangan diubah oleh agen tanpa persetujuan pemilik proyek.
 */

import type { FormReferenceId } from "./form-references";

export type CoachTier = "A" | "B" | "C";
export type CoachView = "samping" | "depan";
export type EvidenceLabel = "prinsip-jurnal" | "praktik-pelatih";
export type CheckLevel = "risiko" | "teknik";

export interface CoachCheck {
  id: string;
  cue: string; // kalimat koreksi singkat (≤ 8 kata)
  level: CheckLevel; // 'risiko' = terkait potensi cedera; 'teknik' = preferensi teknik
  evidence: EvidenceLabel;
  refs: readonly FormReferenceId[];
  views?: readonly CoachView[]; // bila cek hanya valid dari sudut tertentu
}

export interface FormCoachEntry {
  exerciseId: string;
  family: string;
  tier: CoachTier;
  primaryView: CoachView;
  mode: "reps" | "hold";
  checks: readonly CoachCheck[];
  notScored: readonly string[]; // hal yang SENGAJA tidak dinilai & alasannya
  readingRefs: readonly FormReferenceId[]; // bacaan terkait gerakan ini (konteks, bukan bukti per cek)
  honestNote?: string;
}

/** Rujukan validitas pose: tampilkan di layar "Tentang akurasi" dan pakai untuk menetapkan toleransi ≥ ±10–15°. */
export const POSE_VALIDITY_REFS: readonly FormReferenceId[] = [
  "pose-resistance-arxiv-2026",
  "blazepose-knee-jmir-2026",
  "pose-clinical-arxiv-2025",
  "pose-viewangle-2025",
];

// ───────────────────────── PUSTAKA CEK (dipakai ulang) ─────────────────────────
const chk = (c: CoachCheck): CoachCheck => c;

const CK = {
  // squat
  squatDepth: chk({ id: "squat-depth", cue: "Turun lebih dalam, paha sejajar lantai", level: "teknik", evidence: "prinsip-jurnal", refs: ["hartmann-2013", "schoenfeld-2010", "myer-2014"] }),
  trunkLean: chk({ id: "trunk-lean", cue: "Dada lebih tegak", level: "teknik", evidence: "prinsip-jurnal", refs: ["straub-powers-2024", "schoenfeld-2010"] }),
  heelLift: chk({ id: "heel-lift", cue: "Tumit tetap menapak", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  kneeCave: chk({ id: "knee-cave", cue: "Dorong lutut searah jari kaki", level: "risiko", evidence: "praktik-pelatih", refs: [], views: ["depan"] }),
  // hinge
  hingeNotSquat: chk({ id: "hinge-not-squat", cue: "Dorong pinggul ke belakang, lutut jangan menekuk", level: "teknik", evidence: "praktik-pelatih", refs: ["mcgill-marshall-2012"] }),
  hipLockout: chk({ id: "hip-lockout", cue: "Berdiri tegak penuh di atas", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  barClose: chk({ id: "bar-close", cue: "Dekatkan beban ke tubuh", level: "risiko", evidence: "praktik-pelatih", refs: [] }),
  hipShoot: chk({ id: "hip-shoot", cue: "Naikkan pinggul dan bahu bersamaan", level: "risiko", evidence: "praktik-pelatih", refs: [] }),
  noLeanBack: chk({ id: "no-lean-back", cue: "Jangan condong ke belakang di atas", level: "risiko", evidence: "prinsip-jurnal", refs: ["andersen-2019-swing"] }),
  swingHeight: chk({ id: "swing-height", cue: "Ayun sampai setinggi dada, bukan lebih", level: "teknik", evidence: "praktik-pelatih", refs: ["mcgill-marshall-2012"] }),
  // row
  trunkStable: chk({ id: "trunk-stable", cue: "Jaga sudut badan tetap", level: "risiko", evidence: "prinsip-jurnal", refs: ["fenwick-2009"] }),
  noMomentum: chk({ id: "no-momentum", cue: "Jangan mengayun, tarik dengan terkontrol", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  rowElbowBack: chk({ id: "row-elbow-back", cue: "Tarik siku ke belakang badan", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // press
  gripWidth: chk({ id: "grip-width", cue: "Genggam maksimal 1,5x lebar bahu", level: "risiko", evidence: "prinsip-jurnal", refs: ["green-comfort-2007", "noteboom-2024"], views: ["depan"] }),
  buttLift: chk({ id: "butt-lift", cue: "Pantat tetap menempel bench", level: "risiko", evidence: "praktik-pelatih", refs: [] }),
  benchAngle: chk({ id: "bench-angle", cue: "Sudut bench maksimal 45 derajat", level: "teknik", evidence: "prinsip-jurnal", refs: ["rodriguez-ridao-2020"] }),
  pressSymmetry: chk({ id: "press-symmetry", cue: "Dorong kedua sisi bersamaan", level: "teknik", evidence: "praktik-pelatih", refs: [], views: ["depan"] }),
  pressLockout: chk({ id: "press-lockout", cue: "Luruskan siku di atas", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  ohpStack: chk({ id: "ohp-stack", cue: "Tumpuk pergelangan di atas bahu", level: "teknik", evidence: "praktik-pelatih", refs: ["saeterbakken-fimland-2013"] }),
  ohpLeanBack: chk({ id: "ohp-lean-back", cue: "Jangan melengkung ke belakang", level: "risiko", evidence: "praktik-pelatih", refs: [] }),
  // pull
  pullRom: chk({ id: "pull-rom", cue: "Turun penuh, naik sampai dagu di atas palang", level: "teknik", evidence: "praktik-pelatih", refs: ["dickie-2017"] }),
  noKip: chk({ id: "no-kip", cue: "Kurangi ayunan kaki dan pinggul", level: "teknik", evidence: "praktik-pelatih", refs: ["williamson-price-2021"] }),
  gripNotWide: chk({ id: "grip-not-wide", cue: "Genggam sekitar selebar bahu", level: "risiko", evidence: "prinsip-jurnal", refs: ["prinold-bull-2016"], views: ["depan"] }),
  // push-up / plank
  pushDepth: chk({ id: "push-depth", cue: "Turun lebih dalam, siku sekitar 90 derajat", level: "teknik", evidence: "praktik-pelatih", refs: ["marcolin-2015"] }),
  hipSag: chk({ id: "hip-sag", cue: "Pinggul turun, kencangkan perut", level: "risiko", evidence: "praktik-pelatih", refs: ["mcgill-2010-core"] }),
  hipPike: chk({ id: "hip-pike", cue: "Pinggul terlalu naik, sejajarkan badan", level: "teknik", evidence: "praktik-pelatih", refs: ["mcgill-2010-core"] }),
  narrowHands: chk({ id: "narrow-hands", cue: "Rapatkan tangan di bawah dada", level: "teknik", evidence: "prinsip-jurnal", refs: ["cogley-2005", "marcolin-2015"], views: ["depan"] }),
  elbowUnderShoulder: chk({ id: "elbow-under-shoulder", cue: "Siku tepat di bawah bahu", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  pikeHipHigh: chk({ id: "pike-hip-high", cue: "Pertahankan pinggul tinggi", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // dips
  dipDepth: chk({ id: "dip-depth", cue: "Jangan turun terlalu dalam", level: "risiko", evidence: "prinsip-jurnal", refs: ["mckenzie-2022-dips", "mckenzie-2022-fatigue"] }),
  noShrug: chk({ id: "no-shrug", cue: "Turunkan bahu, jauh dari telinga", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // core / posterior
  kneeRaiseHeight: chk({ id: "knee-raise-height", cue: "Angkat lutut sampai di atas pinggul", level: "teknik", evidence: "prinsip-jurnal", refs: ["escamilla-2006"] }),
  noSwing: chk({ id: "no-swing", cue: "Hentikan ayunan badan", level: "teknik", evidence: "praktik-pelatih", refs: ["mcgill-2014-anterior"] }),
  neckNeutral: chk({ id: "neck-neutral", cue: "Leher netral, pandang ke lantai", level: "risiko", evidence: "praktik-pelatih", refs: ["superman-emg"] }),
  symmetricLift: chk({ id: "symmetric-lift", cue: "Angkat lengan dan tungkai setinggi sama", level: "teknik", evidence: "praktik-pelatih", refs: ["dafkou-2021"] }),
  fullHipExt: chk({ id: "full-hip-ext", cue: "Dorong pinggul sampai bahu-lutut lurus", level: "teknik", evidence: "prinsip-jurnal", refs: ["contreras-2015", "gmax-review-2020"] }),
  heelPress: chk({ id: "heel-press", cue: "Tekan tumit ke lantai", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  straightKnee: chk({ id: "straight-knee", cue: "Jaga lutut tetap lurus", level: "teknik", evidence: "prinsip-jurnal", refs: ["triceps-surae-knee-2002", "heel-raise-2012", "gastroc-torque-1995"] }),
  calfRom: chk({ id: "calf-rom", cue: "Naik setinggi mungkin, turun penuh", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  noBounce: chk({ id: "no-bounce", cue: "Tahan sebentar di atas, jangan memantul", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // arms / shoulders
  elbowFixed: chk({ id: "elbow-fixed", cue: "Kunci siku di samping badan", level: "teknik", evidence: "prinsip-jurnal", refs: ["oliveira-2009"] }),
  noBodySwing: chk({ id: "no-body-swing", cue: "Jangan mengayun badan", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  raiseHeight: chk({ id: "raise-height", cue: "Angkat maksimal sejajar bahu", level: "teknik", evidence: "praktik-pelatih", refs: ["campos-2020", "lateral-raise-2020"] }),
  raiseSymmetry: chk({ id: "raise-symmetry", cue: "Angkat kedua lengan setinggi sama", level: "teknik", evidence: "praktik-pelatih", refs: [], views: ["depan"] }),
  upperArmFixed: chk({ id: "upper-arm-fixed", cue: "Lengan atas diam, hanya siku bergerak", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // lunge / split
  lungeTrunk: chk({ id: "lunge-trunk", cue: "Jaga batang tubuh tetap tegak", level: "teknik", evidence: "prinsip-jurnal", refs: ["farrokhi-2008", "lunge-trunk-2021"] }),
  frontKneeAngle: chk({ id: "front-knee-angle", cue: "Turun sampai lutut depan sekitar 90 derajat", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  frontHeel: chk({ id: "front-heel", cue: "Tumit depan tetap menapak", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  // carry / misc
  uprightCarry: chk({ id: "upright-carry", cue: "Berdiri tegak, bahu tidak jatuh ke depan", level: "teknik", evidence: "praktik-pelatih", refs: ["winwood-2014", "mcgill-strongman-2009"] }),
  headStill: chk({ id: "head-still", cue: "Kepala diam menghadap depan", level: "teknik", evidence: "praktik-pelatih", refs: [], views: ["depan"] }),
  twistRotation: chk({ id: "twist-rotation", cue: "Putar bahu, bukan hanya tangan", level: "teknik", evidence: "praktik-pelatih", refs: [], views: ["depan"] }),
  overheadArms: chk({ id: "overhead-arms", cue: "Lengan lurus di atas, sejajar telinga", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
  legsThenArms: chk({ id: "legs-then-arms", cue: "Dorong dengan kaki dulu, baru lengan", level: "teknik", evidence: "praktik-pelatih", refs: [] }),
} as const;

// teks "tidak dinilai" yang berulang
const NS_SPINE = "Lengkung/bulat tulang belakang tidak bisa dinilai kamera 2D (33 landmark tubuh tidak mencakup ruas tulang belakang; lengkung lumbal memang berubah normal saat angkat beban).";
const NS_GRIP = "Orientasi genggaman (pronasi/supinasi/netral) tidak terbaca andal.";
const NS_BAR = "Lintasan beban tidak dilacak (hanya posisi pergelangan sebagai perkiraan).";
const NS_SCAP = "Gerak skapula tidak bisa dinilai kamera 2D.";

const SQ_READ = ["schoenfeld-2010", "straub-powers-2024", "hartmann-2013", "myer-2014", "akd-review-2023"] as const;
const NS_SQ = ["Lutut melewati ujung jari kaki TIDAK ditandai sebagai kesalahan (ulasan menunjukkan membatasinya menggeser beban ke pinggul/punggung dan mengurangi kedalaman).", NS_SPINE] as const;

// ───────────────────────── 46 GERAKAN ─────────────────────────
export const FORM_COACH_MATRIX: readonly FormCoachEntry[] = [
  // ===== SQUAT (tier A) =====
  { exerciseId: "bw-air-squat", family: "squat", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.squatDepth, CK.trunkLean, CK.heelLift, CK.kneeCave], notScored: NS_SQ, readingRefs: SQ_READ },
  { exerciseId: "db-goblet-squat", family: "squat", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.squatDepth, CK.trunkLean, CK.heelLift, CK.kneeCave], notScored: NS_SQ, readingRefs: SQ_READ },
  { exerciseId: "kb-goblet-squat", family: "squat", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.squatDepth, CK.trunkLean, CK.heelLift, CK.kneeCave], notScored: NS_SQ, readingRefs: SQ_READ },
  { exerciseId: "bb-back-squat", family: "squat", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.squatDepth, CK.trunkLean, CK.heelLift, CK.kneeCave],
    notScored: [...NS_SQ, NS_BAR], readingRefs: SQ_READ,
    honestNote: "Batas condong batang tubuh back squat lebih longgar daripada goblet/air squat; atur di config." },

  // ===== SQUAT OVERHEAD & PLATE (tier B/C) =====
  { exerciseId: "plate-overhead-squat", family: "squat-overhead", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.squatDepth, CK.trunkLean, CK.heelLift, CK.overheadArms], notScored: [...NS_SQ, "Mobilitas bahu tidak diukur; hanya apakah lengan tetap lurus di atas.", NS_BAR],
    readingRefs: SQ_READ, honestNote: "Belum ada jurnal terverifikasi khusus overhead squat dengan plate; cek lengan overhead = praktik pelatih." },
  { exerciseId: "plate-g2oh", family: "ground-to-overhead", tier: "C", primaryView: "samping", mode: "reps",
    checks: [CK.legsThenArms, CK.hipLockout, CK.overheadArms], notScored: [NS_SPINE, NS_BAR],
    readingRefs: ["ramirez-2022", "schoenfeld-2010"], honestNote: "Gerakan multi-fase cepat; skor hanya kasar. Belum ada jurnal terverifikasi khusus plate ground-to-overhead." },

  // ===== SPLIT STANCE (tier B) =====
  { exerciseId: "bb-reverse-lunges", family: "split", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.frontKneeAngle, CK.lungeTrunk, CK.frontHeel], notScored: NS_SQ, readingRefs: ["farrokhi-2008", "lunge-trunk-2021", "akd-review-2023"],
    honestNote: "Condong ke depan = pilihan penekanan pinggul (Farrokhi 2008), bukan salah per se; tampilkan sebagai saran." },
  { exerciseId: "db-bulgarian-squat", family: "split", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.frontKneeAngle, CK.lungeTrunk, CK.frontHeel, CK.kneeCave], notScored: NS_SQ, readingRefs: ["deforest-2014", "mackey-riemann-2021", "farrokhi-2008"] },

  // ===== HINGE (tier B) =====
  { exerciseId: "bb-deadlift", family: "hinge", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.hipShoot, CK.barClose, CK.hipLockout, CK.noLeanBack], notScored: [NS_SPINE, NS_BAR],
    readingRefs: ["ramirez-2022", "deadlift-lumbar-2022"],
    honestNote: "Punggung bulat TIDAK dinilai. Teks tutorial 'punggung melengkung' tetap tampil sebagai panduan manual." },
  { exerciseId: "bb-romanian-deadlift", family: "hinge", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.hingeNotSquat, CK.barClose, CK.hipLockout], notScored: [NS_SPINE, NS_BAR],
    readingRefs: ["ramirez-2022", "deadlift-lumbar-2022"] },
  { exerciseId: "kb-swing", family: "hinge-ballistic", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.hingeNotSquat, CK.hipLockout, CK.swingHeight, CK.noLeanBack], notScored: [NS_SPINE],
    readingRefs: ["mcgill-marshall-2012", "andersen-2019-swing"], honestNote: "Gerakan cepat: perlu kamera ≥ 30 fps dan penghalusan yang tidak menumpulkan puncak gerak." },
  { exerciseId: "kb-snatch", family: "hinge-ballistic", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.hingeNotSquat, CK.hipLockout, CK.pressLockout, CK.noLeanBack], notScored: [NS_SPINE, "Benturan kettlebell ke pergelangan tidak terdeteksi."],
    readingRefs: ["mcgill-marshall-2012"] },
  { exerciseId: "kb-clean-press", family: "hinge-ballistic", tier: "C", primaryView: "samping", mode: "reps",
    checks: [CK.pressLockout, CK.ohpLeanBack], notScored: [NS_SPINE, "Fase clean (benturan di posisi rack) tidak dinilai; hanya fase press."],
    readingRefs: ["kb-ohp-2018", "mcgill-marshall-2012"] },

  // ===== ROW (tier B) =====
  { exerciseId: "bb-bent-row", family: "row", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.trunkStable, CK.noMomentum, CK.rowElbowBack], notScored: [NS_SPINE, NS_BAR], readingRefs: ["fenwick-2009", "saeterbakken-2015-row"] },
  { exerciseId: "db-single-row", family: "row", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.trunkStable, CK.noMomentum, CK.rowElbowBack], notScored: [NS_SPINE, "Rotasi batang tubuh sulit dari samping; hanya perkiraan kasar."], readingRefs: ["fenwick-2009", "saeterbakken-2015-row"] },
  { exerciseId: "kb-single-row", family: "row", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.trunkStable, CK.noMomentum, CK.rowElbowBack], notScored: [NS_SPINE], readingRefs: ["fenwick-2009", "saeterbakken-2015-row"] },
  { exerciseId: "db-rear-delt-fly", family: "row", tier: "C", primaryView: "samping", mode: "reps",
    checks: [CK.trunkStable, CK.noBodySwing, CK.raiseSymmetry], notScored: [NS_SPINE, "Meremas belikat terlalu awal tidak bisa dinilai."],
    readingRefs: ["deltoid-exercises-2023"], honestNote: "Jurnal yang ditemukan membandingkan aktivasi otot, bukan kriteria form." },

  // ===== BENCH PRESS (tier C: sudut kamera & beban menutupi) =====
  { exerciseId: "bb-bench-press", family: "press-horizontal", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.gripWidth, CK.buttLift, CK.pressSymmetry, CK.pressLockout], notScored: [NS_BAR, NS_SCAP, "Pantulan barbel ke dada tidak terdeteksi."],
    readingRefs: ["green-comfort-2007", "noteboom-2024"], honestNote: "Kamera ditaruh di ujung kaki bench setinggi dada. Lebar genggam dibandingkan lebar bahu dari landmark." },
  { exerciseId: "bb-incline-press", family: "press-horizontal", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.benchAngle, CK.gripWidth, CK.buttLift, CK.pressSymmetry], notScored: [NS_BAR, NS_SCAP],
    readingRefs: ["rodriguez-ridao-2020", "green-comfort-2007", "noteboom-2024"], honestNote: "Sudut bench diperkirakan dari garis bahu-pinggul saat berbaring; teks di exercises.ts menyebut batas 45°, sesuai jurnal." },
  { exerciseId: "db-bench-press", family: "press-horizontal", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.buttLift, CK.pressSymmetry, CK.pressLockout], notScored: ["Dumbel membentur di atas tidak terdeteksi.", NS_SCAP],
    readingRefs: ["noteboom-2024", "green-comfort-2007"], honestNote: "Jurnal press yang ditemukan memakai barbel; kecocokan ke dumbel adalah ekstrapolasi." },
  { exerciseId: "db-incline-press", family: "press-horizontal", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.benchAngle, CK.buttLift, CK.pressSymmetry], notScored: [NS_SCAP, "Pergelangan tangan tertekuk ke belakang tidak terbaca andal."],
    readingRefs: ["rodriguez-ridao-2020"], honestNote: "Koreksi teks repo: batas sudut bench yang didukung jurnal adalah 45°, bukan 60°." },
  { exerciseId: "db-floor-press", family: "press-horizontal", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.pressSymmetry, CK.buttLift, CK.pressLockout], notScored: [NS_SCAP],
    readingRefs: ["noteboom-2024"], honestNote: "Tidak ada jurnal terverifikasi khusus floor press; cek berstatus praktik pelatih." },

  // ===== OVERHEAD PRESS (tier B) =====
  { exerciseId: "bb-overhead-press", family: "press-vertical", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.ohpStack, CK.ohpLeanBack, CK.pressLockout], notScored: [NS_BAR, NS_SPINE],
    readingRefs: ["saeterbakken-fimland-2013", "coratella-2022-ohp"], honestNote: "Belum ada jurnal terverifikasi yang menetapkan batas lengkung punggung bawah; cek 'ohp-lean-back' berstatus praktik pelatih." },

  // ===== PULL-UP (tier B) =====
  { exerciseId: "bw-pullup", family: "pull-vertical", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.pullRom, CK.noKip, CK.gripNotWide], notScored: [NS_SCAP, NS_GRIP],
    readingRefs: ["prinold-bull-2016", "dickie-2017", "williamson-price-2021"], honestNote: "Lebar genggaman dicek dari kamera depan; ROM dan ayunan dari samping." },

  // ===== PUSH-UP FAMILY (A/B) =====
  { exerciseId: "bw-pushup", family: "pushup", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.pushDepth, CK.hipSag, CK.hipPike, CK.pressLockout], notScored: ["Siku mengembang tidak terbaca dari samping.", NS_SCAP],
    readingRefs: ["cogley-2005", "marcolin-2015", "pushup-scoping-2022"] },
  { exerciseId: "bw-diamond-pushup", family: "pushup", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.pushDepth, CK.hipSag, CK.narrowHands], notScored: ["Siku mengembang tidak terbaca dari samping.", NS_SCAP],
    readingRefs: ["cogley-2005", "marcolin-2015", "pushup-scoping-2022"] },
  { exerciseId: "bw-pike-pushup", family: "pushup", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.pikeHipHigh, CK.pushDepth, CK.pressLockout], notScored: [NS_SCAP],
    readingRefs: ["pushup-scoping-2022"], honestNote: "Tidak ada jurnal terverifikasi khusus pike push-up; cek berstatus praktik pelatih." },

  // ===== DIPS (tier B) =====
  { exerciseId: "bw-dips", family: "dip", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.dipDepth, CK.noShrug, CK.pressLockout], notScored: [NS_SCAP],
    readingRefs: ["mckenzie-2022-dips", "mckenzie-2022-fatigue"], honestNote: "Jurnal mengukur kinematika dip, bukan menetapkan 'batas 90°'; tampilkan sebagai peringatan kedalaman, bukan vonis." },

  // ===== CORE (A/B/C) =====
  { exerciseId: "bw-plank", family: "plank", tier: "A", primaryView: "samping", mode: "hold",
    checks: [CK.hipSag, CK.hipPike, CK.elbowUnderShoulder], notScored: ["Netral/lengkung panggul tidak terlihat."],
    readingRefs: ["mcgill-2010-core", "plank-legraise-2019"], honestNote: "Skor = persentase waktu tahan dengan garis tubuh lurus." },
  { exerciseId: "bw-hanging-knees", family: "hanging-core", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.kneeRaiseHeight, CK.noSwing], notScored: ["Gulungan panggul (posterior tilt) tidak terbaca andal."],
    readingRefs: ["escamilla-2006", "mcgill-2014-anterior"], honestNote: "Studi Escamilla memakai strap; hasil bisa berbeda tanpa strap." },
  { exerciseId: "plate-russian-twist", family: "rotation", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.twistRotation], notScored: [NS_SPINE, "Besar rotasi tulang belakang lumbar tidak terukur."],
    readingRefs: ["mcgill-2010-core"], honestNote: "Tidak ada jurnal terverifikasi khusus Russian twist yang ditemukan; hanya hitung repetisi dan rotasi bahu." },
  { exerciseId: "bw-sky-divers", family: "prone-extension", tier: "B", primaryView: "samping", mode: "hold",
    checks: [CK.neckNeutral, CK.symmetricLift], notScored: ["Besar ekstensi lumbal tidak bisa dinilai."],
    readingRefs: ["superman-emg", "dafkou-2021"] },
  { exerciseId: "bw-glute-bridge", family: "bridge", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.fullHipExt, CK.heelPress], notScored: ["Hiperekstensi lumbal tidak terlihat."],
    readingRefs: ["contreras-2015", "gmax-review-2020"], honestNote: "Jurnal menguji hip thrust berbeban, bukan glute bridge bodyweight." },
  { exerciseId: "bw-calf-raise", family: "calf", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.straightKnee, CK.calfRom, CK.noBounce], notScored: [],
    readingRefs: ["triceps-surae-knee-2002", "heel-raise-2012", "gastroc-torque-1995"] },

  // ===== LENGAN & BAHU ISOLASI =====
  { exerciseId: "db-bicep-curl", family: "curl", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.elbowFixed, CK.noBodySwing], notScored: [NS_GRIP], readingRefs: ["oliveira-2009", "marcolin-2018"] },
  { exerciseId: "bb-barbell-curl", family: "curl", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.elbowFixed, CK.noBodySwing], notScored: [NS_GRIP], readingRefs: ["oliveira-2009", "marcolin-2018"] },
  { exerciseId: "db-hammer-curl", family: "curl", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.elbowFixed, CK.noBodySwing], notScored: [NS_GRIP], readingRefs: ["curl-handgrip-2023", "oliveira-2009"],
    honestNote: "Genggaman netral (inti hammer curl) tidak bisa diverifikasi kamera." },
  { exerciseId: "bb-skull-crusher", family: "triceps-ext", tier: "C", primaryView: "samping", mode: "reps",
    checks: [CK.upperArmFixed, CK.pressLockout], notScored: ["Siku melebar ke samping hanya terbaca dari depan.", NS_BAR],
    readingRefs: [], honestNote: "Tidak ada jurnal peer-reviewed terverifikasi untuk kriteria form skull crusher (hanya poster/artikel populer ditemukan); semua cek berstatus praktik pelatih." },
  { exerciseId: "db-lateral-raise", family: "raise", tier: "B", primaryView: "depan", mode: "reps",
    checks: [CK.raiseHeight, CK.raiseSymmetry, CK.noBodySwing], notScored: ["Rotasi humerus (yang mengubah target otot) tidak terbaca."],
    readingRefs: ["campos-2020", "lateral-raise-2020", "deltoid-exercises-2023"] },
  { exerciseId: "plate-steering-raise", family: "raise", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.raiseHeight, CK.noBodySwing, CK.ohpLeanBack], notScored: [],
    readingRefs: ["lateral-raise-2020"], honestNote: "Frontal raise terutama mengaktifkan deltoid anterior dan pectoralis major (jurnal)." },
  { exerciseId: "kb-halo", family: "mobility-carry", tier: "C", primaryView: "depan", mode: "reps",
    checks: [CK.headStill, CK.upperArmFixed], notScored: [NS_SCAP], readingRefs: [],
    honestNote: "Tidak ada jurnal terverifikasi yang ditemukan untuk kettlebell halo; hanya cek kasar." },
  { exerciseId: "plate-pinch-carry", family: "carry", tier: "C", primaryView: "samping", mode: "hold",
    checks: [CK.uprightCarry], notScored: ["Kekuatan genggam tidak terbaca.", NS_SCAP],
    readingRefs: ["winwood-2014", "mcgill-strongman-2009", "loaded-carry-2024"], honestNote: "Hitung durasi tegak; tidak ada skor presisi." },

  // ===== TAMBAHAN 4 GERAKAN BARU =====
  { exerciseId: "db-romanian-deadlift", family: "hinge", tier: "B", primaryView: "samping", mode: "reps",
    checks: [CK.hingeNotSquat, CK.barClose, CK.hipLockout], notScored: [NS_SPINE, "Lintasan dumbel tidak dilacak (hanya posisi pergelangan sebagai perkiraan)."],
    readingRefs: ["ramirez-2022", "deadlift-lumbar-2022"] },
  { exerciseId: "db-glute-bridge", family: "bridge", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.fullHipExt, CK.heelPress], notScored: ["Hiperekstensi lumbal tidak terlihat.", "Dumbel di pinggul dapat menutupi titik pinggul."],
    readingRefs: ["contreras-2015", "gmax-review-2020"], honestNote: "Jurnal menguji hip thrust berbeban, bukan glute bridge dengan dumbel di lantai." },
  { exerciseId: "db-standing-calf-raise", family: "calf", tier: "A", primaryView: "samping", mode: "reps",
    checks: [CK.straightKnee, CK.calfRom, CK.noBounce], notScored: [],
    readingRefs: ["triceps-surae-knee-2002", "heel-raise-2012", "gastroc-torque-1995"] },
  { exerciseId: "db-overhead-triceps-extension", family: "triceps-ext", tier: "C", primaryView: "samping", mode: "reps",
    checks: [CK.upperArmFixed, CK.pressLockout], notScored: ["Siku melebar ke samping hanya terbaca dari depan.", "Lintasan dumbel tidak dilacak."],
    readingRefs: [], honestNote: "Tidak ada jurnal peer-reviewed terverifikasi untuk kriteria form gerakan ini; semua cek berstatus praktik pelatih." },
];
