import {
  RuleSet,
  FormCheck,
  PoseFrame,
  RepContext,
  CheckResult,
} from "./types";
import {
  angleAt2D,
  angleFromVertical2D,
  pickVisibleSide,
} from "../geometry";
import {
  Landmark,
  NOSE,
  L_EAR,
  R_EAR,
  L_SHOULDER,
  R_SHOULDER,
  L_ELBOW,
  R_ELBOW,
  L_WRIST,
  R_WRIST,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
  L_HEEL,
  R_HEEL,
  L_FOOT_INDEX,
  R_FOOT_INDEX,
} from "../landmarks";

// Penyimpanan streak pelanggaran per checkId untuk memastikan koreksi
// hanya dipicu bila terjadi konsisten >= 3 frame berturut-turut (mencegah jitter sensor).
const streakMap = new Map<string, number>();

// Tracking titik terendah hinge untuk deteksi hip-shoot
let hingeBottomHipY: number | null = null;
let hingeBottomShoulderY: number | null = null;

export function resetHingeTracking(): void {
  hingeBottomHipY = null;
  hingeBottomShoulderY = null;
}

// Tracking FPS untuk gerakan balistik (kb-swing, kb-snatch)
let ballisticOverrideFps: number | null = null;
let ballisticLastTimeMs: number = 0;
let ballisticAverageFps: number = 30; // default 30 fps
let ballisticFrameCount: number = 0;

export function setBallisticFps(fps: number | null): void {
  ballisticOverrideFps = fps;
}

export function resetBallisticFps(): void {
  ballisticOverrideFps = null;
  ballisticLastTimeMs = 0;
  ballisticAverageFps = 30;
  ballisticFrameCount = 0;
}

export function recordBallisticFrame(timestampMs: number): void {
  if (ballisticLastTimeMs > 0 && timestampMs > ballisticLastTimeMs) {
    const dt = timestampMs - ballisticLastTimeMs;
    if (dt > 0) {
      const instantFps = 1000 / dt;
      ballisticAverageFps = ballisticAverageFps * 0.8 + instantFps * 0.2;
    }
  }
  ballisticLastTimeMs = timestampMs;
  ballisticFrameCount++;
}

export function isBallisticFpsTooLow(ctx?: RepContext): boolean {
  if (ctx && ctx.exerciseId !== "kb-swing" && ctx.exerciseId !== "kb-snatch") {
    return false;
  }
  if (ballisticOverrideFps !== null) {
    return ballisticOverrideFps < 24;
  }
  return ballisticAverageFps < 24;
}

// Tracking baris (row) dan pull-up
let rowTrunkBaseline: number | null = null;
let rowPullMinTrunk: number = 999;
let rowPullMaxTrunk: number = -999;
let rowElbowPassedBack: boolean = false;
let pullChinPassedBar: boolean = false;

export function resetRowTracking(): void {
  rowTrunkBaseline = null;
  rowPullMinTrunk = 999;
  rowPullMaxTrunk = -999;
  rowElbowPassedBack = false;
}

export function resetPullupTracking(): void {
  pullChinPassedBar = false;
}

let dipEarShoulderBaseline: number | null = null;
let benchHipBaseline: number | null = null;

export function resetDipTracking(): void {
  dipEarShoulderBaseline = null;
}

export function resetPressHorizontalTracking(): void {
  benchHipBaseline = null;
}

export function resetCheckTrackingState(): void {
  streakMap.clear();
  resetHingeTracking();
  resetRowTracking();
  resetPullupTracking();
  resetDipTracking();
  resetPressHorizontalTracking();
}

export function resetViolationStreaks(): void {
  resetCheckTrackingState();
  resetBallisticFps();
}

export function checkConsecutiveViolation(
  checkId: string,
  isViolation: boolean,
  minFrames: number = 3
): boolean {
  const current = streakMap.get(checkId) || 0;
  if (isViolation) {
    const updated = current + 1;
    streakMap.set(checkId, updated);
    return updated >= minFrames;
  } else {
    streakMap.set(checkId, 0);
    return false;
  }
}

/**
 * Mengambil landmark sendi yang relevan berdasarkan sisi tubuh yang menghadap kamera.
 */
export function getSideJoints(landmarks: Landmark[], side: "left" | "right") {
  const isLeft = side === "left";
  return {
    ear: landmarks[isLeft ? L_EAR : R_EAR],
    shoulder: landmarks[isLeft ? L_SHOULDER : R_SHOULDER],
    elbow: landmarks[isLeft ? L_ELBOW : R_ELBOW],
    wrist: landmarks[isLeft ? L_WRIST : R_WRIST],
    hip: landmarks[isLeft ? L_HIP : R_HIP],
    knee: landmarks[isLeft ? L_KNEE : R_KNEE],
    ankle: landmarks[isLeft ? L_ANKLE : R_ANKLE],
    heel: landmarks[isLeft ? L_HEEL : R_HEEL],
    footIndex: landmarks[isLeft ? L_FOOT_INDEX : R_FOOT_INDEX],
  };
}

// ============================================================================
// 1. ATURAN SQUAT (Air Squat, Goblet Squat, Back Squat)
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek lutut melewati ujung jari kaki atau punggung membulat.
// ============================================================================

export const SQUAT_DEPTH_CHECK: FormCheck = {
  id: "squat-depth",
  label: "Kedalaman Squat",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Sudut lutut minimum di fase terbawah (bottom)
    // heuristik, toleransi ±10–15°
    // Standar paralel: sudut lutut < 110° atau paha sejajar (maxDepthProxy = hip.y - knee.y >= -0.02)
    const minKneeAngle = ctx.minRawMetricValue ?? ctx.minMetricValue;
    const depthOkByAngle = minKneeAngle < 110;
    const depthOkByProxy = ctx.maxDepthProxy !== undefined && ctx.maxDepthProxy >= -0.02;
    if (!depthOkByAngle && !depthOkByProxy) {
      return {
        ok: false,
        value: Math.round(minKneeAngle),
        cue: "Turun lebih dalam, paha sejajar lantai",
      };
    }
    return { ok: true, value: Math.round(minKneeAngle), cue: "Kedalaman paha bagus" };
  },
};

export const SQUAT_TRUNK_LEAN_CHECK: FormCheck = {
  id: "squat-trunk-lean",
  label: "Kemiringan Batang Tubuh",
  severity: "major",
  when: "bottom",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) {
      return { ok: true, value: 0, cue: "" };
    }

    // Sudut garis bahu-ke-pinggul terhadap sumbu vertikal (2D x,y tanpa z)
    // heuristik, toleransi ±10–15°
    const leanAngle = angleFromVertical2D(shoulder, hip);

    // Back squat memiliki toleransi kemiringan lebih besar (60°) dibanding bodyweight/goblet (45°)
    const maxLean = ctx.exerciseId === "bb-back-squat" ? 60 : 45;

    if (leanAngle > maxLean) {
      return {
        ok: false,
        value: Math.round(leanAngle),
        cue: "Dada lebih tegak",
      };
    }
    return { ok: true, value: Math.round(leanAngle), cue: "Posisi dada baik" };
  },
};

export const SQUAT_HEEL_LIFT_CHECK: FormCheck = {
  id: "squat-heel-lift",
  label: "Tumit Menapak",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (!ctx.isCalibrated) return { ok: true, value: 0, cue: "" };

    const { heel } = getSideJoints(frame.landmarks, frame.side);
    if (!heel) return { ok: true, value: 0, cue: "" };

    // Pada koordinat layar normalisasi, Y makin kecil = makin ke atas (tumit terangkat)
    // heuristik, toleransi ±10–15°
    const liftDist = ctx.heelYBaseline - heel.y;
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const liftRatio = liftDist / bodyHeight;

    // Jika tumit terangkat melebihi 3% tinggi badan
    if (liftRatio > 0.03) {
      return {
        ok: false,
        value: Math.round(liftRatio * 100),
        cue: "Tumit tetap menapak",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const SQUAT_DESCENT_SPEED_CHECK: FormCheck = {
  id: "squat-descent-speed",
  label: "Kontrol Fase Turun",
  severity: "minor",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Ambang tetap 600 ms, tetapi kini diukur dari saat meninggalkan posisi atas
    // (frame terakhir metrik terhalus >= upThreshold), bukan dari 150 derajat.
    const descentMs = ctx.descentFromTopMs ?? ctx.descentDurationMs;
    if (descentMs > 0 && descentMs < 600) {
      return {
        ok: false,
        value: descentMs,
        cue: "Turun lebih terkontrol",
      };
    }
    return { ok: true, value: descentMs, cue: "" };
  },
};

export const SQUAT_RULESET: RuleSet = {
  id: "squat",
  exerciseIds: ["bw-air-squat", "db-goblet-squat", "kb-goblet-squat", "bb-back-squat"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
    L_HEEL,
    R_HEEL,
  ],
  mode: "reps",
  counter: {
    // Metrik utama: sudut lutut (pinggul-lutut-pergelangan kaki)
    // 2D (x,y): z ter-normalisasi MediaPipe tidak andal pada kamera serong (lihat diagnosis dvids-squat 14 Nov).
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.knee || !joints.ankle) return 180;
      return angleAt2D(joints.hip, joints.knee, joints.ankle);
    },
    depthProxy: (landmarks: Landmark[], side?: "left" | "right"): number => {
      const resolvedSide = side ?? pickVisibleSide(landmarks);
      const joints = getSideJoints(landmarks, resolvedSide);
      if (!joints.hip || !joints.knee) return -1;
      return joints.hip.y - joints.knee.y;
    },
    upThreshold: 160,
    downThreshold: 150,
    minRepMs: 500,
  },
  checks: [
    SQUAT_DEPTH_CHECK,
    SQUAT_TRUNK_LEAN_CHECK,
    SQUAT_HEEL_LIFT_CHECK,
    SQUAT_DESCENT_SPEED_CHECK,
  ],
};

// ============================================================================
// 2. ATURAN PUSH-UP
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek siku mengembang (flare) di view samping.
// ============================================================================

export const PUSHUP_DEPTH_CHECK: FormCheck = {
  id: "pushup-depth",
  label: "Kedalaman Push-up",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Sudut siku minimum di bawah harus <= 100° (sekitar 90°)
    // heuristik, toleransi ±10–15°
    const minElbowAngle = ctx.minRawMetricValue ?? ctx.minMetricValue;
    if (minElbowAngle > 100) {
      return {
        ok: false,
        value: Math.round(minElbowAngle),
        cue: "Turun lebih dalam, siku sekitar 90 derajat",
      };
    }
    return { ok: true, value: Math.round(minElbowAngle), cue: "Kedalaman siku baik" };
  },
};

export const PUSHUP_HIP_SAG_CHECK: FormCheck = {
  id: "pushup-hip-sag",
  label: "Pinggul Turun (Hip Sag)",
  severity: "critical",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const bodyAngle = angleAt2D(shoulder, hip, ankle);

    // Garis lurus bahu-pergelangan kaki: Y di posisi X pinggul
    const dx = ankle.x - shoulder.x;
    const expectedY =
      Math.abs(dx) > 0.001
        ? shoulder.y + ((hip.x - shoulder.x) / dx) * (ankle.y - shoulder.y)
        : (shoulder.y + ankle.y) / 2;

    // Di koordinat gambar, Y lebih besar = lebih rendah ke arah lantai
    const isBelowLine = hip.y > expectedY + 0.01;

    if (bodyAngle < 160 && isBelowLine) {
      return {
        ok: false,
        value: Math.round(bodyAngle),
        cue: "Pinggul turun, kencangkan perut",
      };
    }
    return { ok: true, value: Math.round(bodyAngle), cue: "" };
  },
};

export const PUSHUP_HIP_PIKE_CHECK: FormCheck = {
  id: "pushup-hip-pike",
  label: "Pinggul Terlalu Naik (Hip Pike)",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 0, cue: "" };

    const dx = ankle.x - shoulder.x;
    const expectedY =
      Math.abs(dx) > 0.001
        ? shoulder.y + ((hip.x - shoulder.x) / dx) * (ankle.y - shoulder.y)
        : (shoulder.y + ankle.y) / 2;

    // Pinggul naik di atas garis lurus (Y lebih kecil) melebihi 8% panjang tubuh
    // heuristik, toleransi ±10–15°
    const bodyLength = Math.max(0.1, ctx.bodyLength ?? ctx.bodyHeight);
    const pikeDist = expectedY - hip.y;
    const pikeRatio = pikeDist / bodyLength;

    if (pikeRatio > 0.08) {
      return {
        ok: false,
        value: Math.round(pikeRatio * 100),
        cue: "Pinggul terlalu naik",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const PUSHUP_LOCKOUT_CHECK: FormCheck = {
  id: "pushup-lockout",
  label: "Ekstensi Siku di Atas",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    const frameElbowAngle =
      shoulder && elbow && wrist ? angleAt2D(shoulder, elbow, wrist) : undefined;
    if (ctx.maxRawMetricValue === undefined && frameElbowAngle === undefined) {
      return { ok: true, value: 180, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    const elbowAngle = ctx.maxRawMetricValue ?? frameElbowAngle ?? 180;
    if (elbowAngle < 160) {
      return {
        ok: false,
        value: Math.round(elbowAngle),
        cue: "Luruskan lengan di atas",
      };
    }
    return { ok: true, value: Math.round(elbowAngle), cue: "" };
  },
};

export const PUSHUP_RULESET: RuleSet = {
  id: "pushup",
  exerciseIds: ["bw-pushup", "bw-diamond-pushup"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "reps",
  counter: {
    // Metrik utama: sudut siku 2D (bahu-siku-pergelangan tangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155,
    downThreshold: 120, // heuristik, toleransi ±10–15° (margin >= 15° di atas ambang cek 100)
    minRepMs: 600,
  },
  checks: [
    PUSHUP_DEPTH_CHECK,
    PUSHUP_HIP_SAG_CHECK,
    PUSHUP_HIP_PIKE_CHECK,
    PUSHUP_LOCKOUT_CHECK,
  ],
};

// ============================================================================
// 3. ATURAN PLANK (Mode Hold)
// Sudut pandang: SAMPING.
// ============================================================================

export const PLANK_HIP_SAG_CHECK: FormCheck = {
  id: "plank-hip-sag",
  label: "Pinggul Turun (Plank)",
  severity: "critical",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const bodyAngle = angleAt2D(shoulder, hip, ankle);
    const dx = ankle.x - shoulder.x;
    const expectedY =
      Math.abs(dx) > 0.001
        ? shoulder.y + ((hip.x - shoulder.x) / dx) * (ankle.y - shoulder.y)
        : (shoulder.y + ankle.y) / 2;

    const isBelowLine = hip.y > expectedY + 0.01;

    // Ambang tubuh plank: < 165°
    if (bodyAngle < 165 && isBelowLine) {
      return {
        ok: false,
        value: Math.round(bodyAngle),
        cue: "Pinggul turun, kencangkan perut",
      };
    }
    return { ok: true, value: Math.round(bodyAngle), cue: "" };
  },
};

export const PLANK_HIP_PIKE_CHECK: FormCheck = {
  id: "plank-hip-pike",
  label: "Pinggul Terlalu Naik (Plank)",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 0, cue: "" };

    const dx = ankle.x - shoulder.x;
    const expectedY =
      Math.abs(dx) > 0.001
        ? shoulder.y + ((hip.x - shoulder.x) / dx) * (ankle.y - shoulder.y)
        : (shoulder.y + ankle.y) / 2;

    // heuristik, toleransi ±10–15°
    const bodyLength = Math.max(0.1, ctx.bodyLength ?? ctx.bodyHeight);
    const pikeDist = expectedY - hip.y;
    const pikeRatio = pikeDist / bodyLength;

    if (pikeRatio > 0.08) {
      return {
        ok: false,
        value: Math.round(pikeRatio * 100),
        cue: "Pinggul terlalu naik",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const PLANK_ELBOW_UNDER_SHOULDER_CHECK: FormCheck = {
  id: "plank-elbow-alignment",
  label: "Posisi Siku di Bawah Bahu",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, elbow } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const bodyLength = Math.max(0.1, ctx.bodyLength ?? ctx.bodyHeight);
    const horizontalDiff = Math.abs(shoulder.x - elbow.x);
    const diffRatio = horizontalDiff / bodyLength;

    // Selisih horizontal siku-bahu > 10% tinggi badan
    if (diffRatio > 0.1) {
      return {
        ok: false,
        value: Math.round(diffRatio * 100),
        cue: "Siku tepat di bawah bahu",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const PLANK_RULESET: RuleSet = {
  id: "plank",
  exerciseIds: ["bw-plank"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_HIP,
    R_HIP,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "hold",
  counter: {
    metric: () => 180,
    upThreshold: 180,
    downThreshold: 180,
    minRepMs: 0,
  },
  checks: [
    PLANK_HIP_SAG_CHECK,
    PLANK_HIP_PIKE_CHECK,
    PLANK_ELBOW_UNDER_SHOULDER_CHECK,
  ],
};

// ============================================================================
// 4. ATURAN SPLIT (bb-reverse-lunges, db-bulgarian-squat)
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek lutut melewati ujung kaki.
// ============================================================================

export const FRONT_KNEE_ANGLE_CHECK: FormCheck = {
  id: "front-knee-angle",
  label: "Kedalaman Lutut Depan",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Sudut lutut depan minimum di fase bottom
    // heuristik, toleransi ±10–15°
    const minAngle = ctx.minMetricValue;
    if (minAngle > 110) {
      return {
        ok: false,
        value: Math.round(minAngle),
        cue: "Turun sampai lutut depan sekitar 90 derajat",
      };
    }
    return { ok: true, value: Math.round(minAngle), cue: "Kedalaman lunge baik" };
  },
};

export const LUNGE_TRUNK_CHECK: FormCheck = {
  id: "lunge-trunk",
  label: "Kemiringan Batang Tubuh",
  severity: "minor", // saran, bukan kesalahan
  when: "bottom",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const trunkLean = angleFromVertical2D(shoulder, hip);
    if (trunkLean > 40) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Jaga batang tubuh tetap tegak",
      };
    }
    return { ok: true, value: Math.round(trunkLean), cue: "" };
  },
};

export const FRONT_HEEL_CHECK: FormCheck = {
  id: "front-heel",
  label: "Tumit Depan Menapak",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (!ctx.isCalibrated) return { ok: true, value: 0, cue: "" };

    const { heel } = getSideJoints(frame.landmarks, frame.side);
    if (!heel) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const liftDist = ctx.heelYBaseline - heel.y;
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const liftRatio = liftDist / bodyHeight;
    const isViolating = liftRatio > 0.03;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("front-heel", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(liftRatio * 100),
        cue: "Tumit depan tetap menapak",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const SPLIT_RULESET: RuleSet = {
  id: "split",
  exerciseIds: ["bb-reverse-lunges", "db-bulgarian-squat"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
    L_HEEL,
    R_HEEL,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut lutut depan
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.knee || !joints.ankle) return 180;
      return angleAt2D(joints.hip, joints.knee, joints.ankle);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 120, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    FRONT_KNEE_ANGLE_CHECK,
    LUNGE_TRUNK_CHECK,
    FRONT_HEEL_CHECK,
  ],
};

// ============================================================================
// 5. ATURAN HINGE (bb-deadlift, bb-romanian-deadlift)
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek punggung membulat (back-round) atau lintasan barbel.
// ============================================================================

export const HIP_SHOOT_CHECK: FormCheck = {
  id: "hip-shoot",
  label: "Pinggul Naik Terlalu Cepat",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // Simpan posisi titik terbawah saat fase descending atau bottom
    if (ctx.currentPhase === "descending" || ctx.currentPhase === "bottom") {
      if (hingeBottomHipY === null || hip.y > hingeBottomHipY) {
        hingeBottomHipY = hip.y;
      }
      if (hingeBottomShoulderY === null || shoulder.y > hingeBottomShoulderY) {
        hingeBottomShoulderY = shoulder.y;
      }
    } else if (ctx.currentPhase === "idle") {
      hingeBottomHipY = null;
      hingeBottomShoulderY = null;
    }

    let isViolating = false;
    let diffPercent = 0;

    if (ctx.currentPhase === "ascending") {
      // heuristik, toleransi ±10–15°
      // Selisih kenaikan y pinggul vs bahu > 10% panjang badan
      const bodyHeight = Math.max(0.1, ctx.bodyHeight);
      if (hingeBottomHipY !== null && hingeBottomShoulderY !== null) {
        const hipRise = hingeBottomHipY - hip.y;
        const shoulderRise = hingeBottomShoulderY - shoulder.y;
        const diff = hipRise - shoulderRise;
        const diffRatio = diff / bodyHeight;
        diffPercent = Math.round(diffRatio * 100);
        isViolating = diffRatio > 0.10;
      } else {
        // Fallback jika frame ascending tanpa melalui descending: dada tetap terlalu condong
        const trunkLean = angleFromVertical2D(shoulder, hip);
        isViolating = trunkLean > 60;
        diffPercent = Math.round(trunkLean);
      }
    }

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("hip-shoot", isViolating, 3)) {
      return {
        ok: false,
        value: diffPercent,
        cue: "Naikkan pinggul dan bahu bersamaan",
      };
    }
    return { ok: true, value: diffPercent, cue: "" };
  },
};

export const HIP_LOCKOUT_CHECK: FormCheck = {
  id: "hip-lockout",
  label: "Kunci Pinggul di Atas",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Pembatas balistik: jika FPS < 24, jangan keluarkan koreksi
    if (isBallisticFpsTooLow(ctx)) return { ok: true, value: 180, cue: "" };

    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    const frameHipAngle =
      shoulder && hip && knee ? angleAt2D(shoulder, hip, knee) : undefined;
    if (ctx.maxRawMetricValue === undefined && frameHipAngle === undefined) {
      return { ok: true, value: 180, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    const hipAngle = ctx.maxRawMetricValue ?? frameHipAngle ?? 180;
    if (hipAngle < 165) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Berdiri tegak penuh di atas",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "Kunci pinggul sempurna" };
  },
};

export const HINGE_NOT_SQUAT_CHECK: FormCheck = {
  id: "hinge-not-squat",
  label: "Pola Engsel Pinggul RDL",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Berlaku spesifik untuk Romanian Deadlift di mana lutut hanya soft bend
    if (
      ctx.exerciseId !== "bb-romanian-deadlift" &&
      ctx.exerciseId !== "db-romanian-deadlift"
    ) {
      return { ok: true, value: 180, cue: "" };
    }

    const { hip, knee, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!hip || !knee || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    // Sudut lutut berubah > 35° antar posisi atas (~170°-175°) dan bawah -> lutut tertekuk < 135°
    const kneeAngle = angleAt2D(hip, knee, ankle);
    const isViolating = kneeAngle < 135;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("hinge-not-squat", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(kneeAngle),
        cue: "Dorong pinggul ke belakang, lutut jangan menekuk",
      };
    }
    return { ok: true, value: Math.round(kneeAngle), cue: "" };
  },
};

export const NO_LEAN_BACK_CHECK: FormCheck = {
  id: "no-lean-back",
  label: "Hiperektensi Pinggul ke Belakang",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Pembatas balistik: jika FPS < 24, jangan keluarkan koreksi
    if (isBallisticFpsTooLow(ctx)) return { ok: true, value: 0, cue: "" };

    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    const leanAngle = angleFromVertical2D(shoulder, hip);
    if (!ctx.bottomLandmarks) {
      return { ok: true, value: Math.round(leanAngle), cue: "" };
    }

    const bottomJoints = getSideJoints(ctx.bottomLandmarks, frame.side);
    if (!bottomJoints.shoulder || !bottomJoints.hip) {
      return { ok: true, value: Math.round(leanAngle), cue: "" };
    }

    // heuristik, toleransi ±10–15°
    // Arah "maju" dari titik terbawah; tegur hanya jika condong berlawanan arah di atas > 10°
    const forwardSign = Math.sign(bottomJoints.shoulder.x - bottomJoints.hip.x);
    const topDiffX = shoulder.x - hip.x;
    const isLeaningBack =
      forwardSign !== 0 &&
      Math.sign(topDiffX) !== forwardSign &&
      Math.abs(topDiffX) > 0.04 &&
      leanAngle > 10;
    if (isLeaningBack) {
      return {
        ok: false,
        value: Math.round(leanAngle),
        cue: "Jangan condong ke belakang di atas",
      };
    }
    return { ok: true, value: Math.round(leanAngle), cue: "" };
  },
};

// Cek asli dipertahankan untuk HINGE_BALLISTIC_RULESET agar kb-swing/kb-snatch tidak berubah
const BALLISTIC_HIP_LOCKOUT_CHECK: FormCheck = {
  id: "hip-lockout",
  label: "Kunci Pinggul di Atas",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (isBallisticFpsTooLow(ctx)) return { ok: true, value: 180, cue: "" };

    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !knee) return { ok: true, value: 180, cue: "" };

    const hipAngle = angleAt2D(shoulder, hip, knee);
    if (hipAngle < 165) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Berdiri tegak penuh di atas",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "Kunci pinggul sempurna" };
  },
};

const BALLISTIC_NO_LEAN_BACK_CHECK: FormCheck = {
  id: "no-lean-back",
  label: "Hiperektensi Pinggul ke Belakang",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (isBallisticFpsTooLow(ctx)) return { ok: true, value: 0, cue: "" };

    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    const leanAngle = angleFromVertical2D(shoulder, hip);
    const isLeaningBack = shoulder.x < hip.x - 0.04 && leanAngle > 10;
    if (isLeaningBack) {
      return {
        ok: false,
        value: Math.round(leanAngle),
        cue: "Jangan condong ke belakang di atas",
      };
    }
    return { ok: true, value: Math.round(leanAngle), cue: "" };
  },
};

export const HINGE_RULESET: RuleSet = {
  id: "hinge",
  exerciseIds: ["bb-deadlift", "bb-romanian-deadlift", "db-romanian-deadlift"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut pinggul 2D (bahu-pinggul-lutut)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.hip || !joints.knee) return 180;
      return angleAt2D(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15° (penyelesaian repetisi; lockout penuh dicek pada 165°)
    downThreshold: 120, // heuristik, toleransi ±10–15°
    minRepMs: 1000,
  },
  checks: [
    HIP_SHOOT_CHECK,
    HIP_LOCKOUT_CHECK,
    HINGE_NOT_SQUAT_CHECK,
    NO_LEAN_BACK_CHECK,
  ],
};

// ============================================================================
// 6. ATURAN HINGE-BALLISTIC (kb-swing, kb-snatch)
// Sudut pandang: SAMPING. Catatan: hanya mode kamera >= 30 fps
// ============================================================================

export const SWING_HEIGHT_CHECK: FormCheck = {
  id: "swing-height",
  label: "Tinggi Ayunan Beban",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (ctx.exerciseId !== "kb-swing") return { ok: true, value: 0, cue: "" };
    // Pembatas balistik: jika FPS < 24, jangan keluarkan koreksi
    if (isBallisticFpsTooLow(ctx)) return { ok: true, value: 0, cue: "" };

    const { shoulder, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Pergelangan tangan melewati tinggi bahu (wrist.y lebih tinggi dari shoulder.y)
    const isViolating = wrist.y < shoulder.y;
    if (isViolating) {
      return {
        ok: false,
        value: Math.round((shoulder.y - wrist.y) * 100),
        cue: "Ayun sampai setinggi dada, bukan lebih",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const HINGE_BALLISTIC_RULESET: RuleSet = {
  id: "hinge-ballistic",
  exerciseIds: ["kb-swing", "kb-snatch"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_WRIST,
    R_WRIST,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut pinggul (bahu-pinggul-lutut)
    metric: (frame: PoseFrame): number => {
      recordBallisticFrame(frame.timestampMs);
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.hip || !joints.knee) return 180;
      return angleAt2D(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15° (penyelesaian repetisi; lockout penuh dicek pada 165°)
    downThreshold: 120, // heuristik, toleransi ±10–15°
    minRepMs: 700,
  },
  checks: [
    BALLISTIC_HIP_LOCKOUT_CHECK,
    SWING_HEIGHT_CHECK,
    BALLISTIC_NO_LEAN_BACK_CHECK,
  ],
};

// ============================================================================
// 7. ATURAN CALF (bw-calf-raise)
// Sudut pandang: SAMPING.
// ============================================================================

export const CALF_STRAIGHT_KNEE_CHECK: FormCheck = {
  id: "straight-knee",
  label: "Lutut Tetap Lurus",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { hip, knee, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!hip || !knee || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const kneeAngle = angleAt2D(hip, knee, ankle);
    const isViolating = kneeAngle < 165;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("straight-knee", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(kneeAngle),
        cue: "Jaga lutut tetap lurus",
      };
    }
    return { ok: true, value: Math.round(kneeAngle), cue: "" };
  },
};

export const CALF_ROM_CHECK: FormCheck = {
  id: "calf-rom",
  label: "Rentang Gerak Jinjit",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Jika elevasi tumit di puncak jinjit belum maksimal (metric value masih > 158)
    const minMetric = ctx.minMetricValue;
    if (minMetric > 158) {
      return {
        ok: false,
        value: Math.round(minMetric),
        cue: "Naik setinggi mungkin, turun penuh",
      };
    }
    return { ok: true, value: Math.round(minMetric), cue: "Rentang jinjit baik" };
  },
};

export const CALF_NO_BOUNCE_CHECK: FormCheck = {
  id: "no-bounce",
  label: "Kontrol Jinjit Tanpa Pantulan",
  severity: "minor",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Durasi fase naik tergesa-gesa tanpa kontrol (< 300 ms)
    if (ctx.descentDurationMs > 0 && ctx.descentDurationMs < 300) {
      return {
        ok: false,
        value: ctx.descentDurationMs,
        cue: "Tahan sebentar di atas, jangan memantul",
      };
    }
    return { ok: true, value: ctx.descentDurationMs, cue: "" };
  },
};

export const CALF_RULESET: RuleSet = {
  id: "calf",
  exerciseIds: ["bw-calf-raise", "db-standing-calf-raise"],
  view: "side",
  requiredLandmarks: [
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
    L_HEEL,
    R_HEEL,
  ],
  mode: "reps",
  counter: {
    // Metrik: tinggi angkatan tumit relatif mata kaki (180 = rileks di lantai, ~140 = puncak jinjit)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.heel || !joints.ankle) return 180;
      const lift = Math.max(0, joints.ankle.y - joints.heel.y);
      return 180 - Math.min(60, lift * 400);
    },
    upThreshold: 170, // heuristik, toleransi ±10–15°
    downThreshold: 165, // heuristik, toleransi ±10–15° (memungkinkan repetisi terhitung saat metric > 158)
    minRepMs: 500,
  },
  checks: [
    CALF_STRAIGHT_KNEE_CHECK,
    CALF_ROM_CHECK,
    CALF_NO_BOUNCE_CHECK,
  ],
};

// ============================================================================
// 8. ATURAN BRIDGE (bw-glute-bridge)
// Sudut pandang: SAMPING.
// ============================================================================

export const FULL_HIP_EXT_CHECK: FormCheck = {
  id: "full-hip-ext",
  label: "Ekstensi Pinggul Penuh",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !knee) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const hipAngle = angleAt2D(shoulder, hip, knee);
    if (hipAngle < 165) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Dorong pinggul sampai bahu-lutut lurus",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "Ekstensi pinggul penuh" };
  },
};

export const HEEL_PRESS_CHECK: FormCheck = {
  id: "heel-press",
  label: "Dorong Melalui Tumit",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    if (!ctx.isCalibrated) return { ok: true, value: 0, cue: "" };

    const { heel } = getSideJoints(frame.landmarks, frame.side);
    if (!heel) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const liftDist = ctx.heelYBaseline - heel.y;
    const bodyLength = Math.max(0.1, ctx.bodyLength ?? ctx.bodyHeight);
    const liftRatio = liftDist / bodyLength;
    const isViolating = liftRatio > 0.03;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("heel-press", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(liftRatio * 100),
        cue: "Tekan tumit ke lantai",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const BRIDGE_RULESET: RuleSet = {
  id: "bridge",
  exerciseIds: ["bw-glute-bridge", "db-glute-bridge"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_HEEL,
    R_HEEL,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut pinggul (bahu-pinggul-lutut)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.hip || !joints.knee) return 180;
      return angleAt2D(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 140, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    FULL_HIP_EXT_CHECK,
    HEEL_PRESS_CHECK,
  ],
};

// ============================================================================
// 9. ATURAN HANGING-CORE (bw-hanging-knees)
// Sudut pandang: SAMPING.
// ============================================================================

export const KNEE_RAISE_HEIGHT_CHECK: FormCheck = {
  id: "knee-raise-height",
  label: "Tinggi Angkatan Lutut",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Puncak angkatan lutut harus mengangkat lutut sejajar/di atas pinggul (sudut pinggul <= 95°)
    const minAngle = ctx.minMetricValue;
    if (minAngle > 95) {
      return {
        ok: false,
        value: Math.round(minAngle),
        cue: "Angkat lutut minimal setinggi pinggul",
      };
    }
    return { ok: true, value: Math.round(minAngle), cue: "Tinggi lutut optimal" };
  },
};

export const NO_SWING_CHECK: FormCheck = {
  id: "no-swing",
  label: "Stabilitas Tanpa Berayun",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { hip } = getSideJoints(frame.landmarks, frame.side);
    if (!hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Deviasi horizontal pinggul terhadap sumbu tengah (0.5) melebihi 0.08
    const swingOffset = Math.abs(hip.x - 0.5);
    const isViolating = swingOffset > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-swing", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(swingOffset * 100),
        cue: "Hindari berayun saat mengangkat",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const HANGING_CORE_RULESET: RuleSet = {
  id: "hanging-core",
  exerciseIds: ["bw-hanging-knees"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut pinggul (bahu-pinggul-lutut)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.hip || !joints.knee) return 180;
      return angleAt2D(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 130, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    KNEE_RAISE_HEIGHT_CHECK,
    NO_SWING_CHECK,
  ],
};

// ============================================================================
// 10. ATURAN PRESS-VERTICAL (bb-overhead-press)
// Sudut pandang: SAMPING.
// ============================================================================

export const OHP_STACK_CHECK: FormCheck = {
  id: "ohp-stack",
  label: "Penyelarasan Beban Vertikal",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Selisih horizontal pergelangan–bahu > 8% panjang badan
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const horizontalOffset = Math.abs(wrist.x - shoulder.x);
    const offsetRatio = horizontalOffset / bodyHeight;
    if (offsetRatio > 0.08) {
      return {
        ok: false,
        value: Math.round(offsetRatio * 100),
        cue: "Tumpuk pergelangan di atas bahu",
      };
    }
    return { ok: true, value: Math.round(offsetRatio * 100), cue: "Posisi lengan sejajar baik" };
  },
};

export const OHP_LEAN_BACK_CHECK: FormCheck = {
  id: "ohp-lean-back",
  label: "Batang Tubuh Condong ke Belakang",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Batang tubuh condong ke belakang > 12° dari vertikal
    const trunkLean = angleFromVertical2D(shoulder, hip);
    const nose = frame.landmarks[NOSE];
    const isFacingLeft = nose ? nose.x < hip.x : frame.side === "left";
    const isLeaningBack = isFacingLeft
      ? shoulder.x > hip.x + 0.02 && trunkLean > 12
      : shoulder.x < hip.x - 0.02 && trunkLean > 12;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("ohp-lean-back", isLeaningBack, 3)) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Jangan melengkung ke belakang",
      };
    }
    return { ok: true, value: Math.round(trunkLean), cue: "" };
  },
};

export const PRESS_LOCKOUT_CHECK: FormCheck = {
  id: "press-lockout",
  label: "Ekstensi Siku Penuh di Atas",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow || !wrist) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    // siku di atas < 160
    const elbowAngle = angleAt2D(shoulder, elbow, wrist);
    if (elbowAngle < 160) {
      return {
        ok: false,
        value: Math.round(elbowAngle),
        cue: "Luruskan siku di atas",
      };
    }
    return { ok: true, value: Math.round(elbowAngle), cue: "Ekstensi siku sempurna" };
  },
};

export const PRESS_VERTICAL_RULESET: RuleSet = {
  id: "press-vertical",
  exerciseIds: ["bb-overhead-press"],
  view: "side",
  requiredLandmarks: [
    NOSE,
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku (bahu-siku-pergelangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15° (rep selesai; lockout penuh dicek pada 160°)
    downThreshold: 90, // heuristik, toleransi ±10–15°
    minRepMs: 900,
  },
  checks: [
    OHP_STACK_CHECK,
    OHP_LEAN_BACK_CHECK,
    PRESS_LOCKOUT_CHECK,
  ],
};

// ============================================================================
// 11. ATURAN ROW (bb-bent-row, db-single-row, kb-single-row)
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek punggung membulat, rotasi batang tubuh, atau lintasan beban.
// ============================================================================

export const ROW_TRUNK_STABLE_CHECK: FormCheck = {
  id: "trunk-stable",
  label: "Stabilitas Sudut Batang Tubuh",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Sudut batang tubuh berubah > 15° dari baseline kalibrasi
    const currentLean = angleFromVertical2D(shoulder, hip);
    if (rowTrunkBaseline === null && ctx.isCalibrated) {
      rowTrunkBaseline = currentLean;
    }
    const baseline = rowTrunkBaseline ?? 45;
    const diff = Math.abs(currentLean - baseline);
    const isViolating = diff > 15;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("trunk-stable", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(diff),
        cue: "Jaga sudut badan tetap",
      };
    }
    return { ok: true, value: Math.round(diff), cue: "" };
  },
};

export const ROW_NO_MOMENTUM_CHECK: FormCheck = {
  id: "no-momentum",
  label: "Tarikan Tanpa Momentum Ayunan",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Variasi sudut batang tubuh selama fase tarik (descending) > 10°
    const currentLean = angleFromVertical2D(shoulder, hip);
    let isViolating = false;
    let variation = 0;

    if (ctx.currentPhase === "descending") {
      if (currentLean < rowPullMinTrunk) rowPullMinTrunk = currentLean;
      if (currentLean > rowPullMaxTrunk) rowPullMaxTrunk = currentLean;
      variation = rowPullMaxTrunk - rowPullMinTrunk;
      isViolating = variation > 10;
    } else if (ctx.currentPhase === "idle") {
      rowPullMinTrunk = 999;
      rowPullMaxTrunk = -999;
    }

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-momentum", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(variation),
        cue: "Jangan mengayun, tarik dengan terkontrol",
      };
    }
    return { ok: true, value: Math.round(variation), cue: "" };
  },
};

export const ROW_ELBOW_BACK_CHECK: FormCheck = {
  id: "row-elbow-back",
  label: "Siku Melewati Garis Badan",
  severity: "minor",
  when: "top",
  evaluate: (_frame: PoseFrame): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Siku tidak melewati garis badan ke belakang pada akhir repetisi
    if (!rowElbowPassedBack) {
      return {
        ok: false,
        value: 0,
        cue: "Tarik siku ke belakang badan",
      };
    }
    rowElbowPassedBack = false;
    return { ok: true, value: 0, cue: "Tarikan siku cukup dalam" };
  },
};

export const ROW_RULESET: RuleSet = {
  id: "row",
  exerciseIds: ["bb-bent-row", "db-single-row", "kb-single-row"],
  view: "side",
  requiredLandmarks: [
    NOSE,
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku (bahu-siku-pergelangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      if (joints.hip) {
        const nose = frame.landmarks[NOSE];
        const isFacingLeft = nose ? nose.x < joints.hip.x : frame.side === "left";
        const passed = isFacingLeft
          ? joints.elbow.x > joints.shoulder.x + 0.02
          : joints.elbow.x < joints.shoulder.x - 0.02;
        if (passed) rowElbowPassedBack = true;
      }
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 150, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 700,
  },
  checks: [
    ROW_TRUNK_STABLE_CHECK,
    ROW_NO_MOMENTUM_CHECK,
    ROW_ELBOW_BACK_CHECK,
  ],
};

// ============================================================================
// 12. ATURAN PULL-VERTICAL (bw-pullup)
// Sudut pandang: SAMPING. Catatan: grip-not-wide ditunda (butuh kamera depan).
// ============================================================================

export const PULL_ROM_CHECK: FormCheck = {
  id: "pull-rom",
  label: "Rentang Gerak Pull-Up",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Di bawah, siku < 150 -> cue "Turun penuh"
    const elbowAngle = angleAt2D(shoulder, elbow, wrist);
    if (elbowAngle < 150) {
      return {
        ok: false,
        value: Math.round(elbowAngle),
        cue: "Turun penuh",
      };
    }

    // Di atas, hidung/dagu tidak di atas pergelangan -> cue dari matriks
    if (!pullChinPassedBar) {
      return {
        ok: false,
        value: Math.round(ctx.minMetricValue),
        cue: "Turun penuh, naik sampai dagu di atas palang",
      };
    }
    pullChinPassedBar = false;
    return { ok: true, value: Math.round(elbowAngle), cue: "Rentang tarikan penuh" };
  },
};

export const NO_KIP_CHECK: FormCheck = {
  id: "no-kip",
  label: "Pull-Up Bersih Tanpa Kipping",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Osilasi horizontal pinggul > 8% panjang badan
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const hipOffset = Math.abs(hip.x - shoulder.x);
    const swingRatio = hipOffset / bodyHeight;
    const isViolating = swingRatio > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-kip", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(swingRatio * 100),
        cue: "Kurangi ayunan kaki dan pinggul",
      };
    }
    return { ok: true, value: Math.round(swingRatio * 100), cue: "" };
  },
};

export const PULL_VERTICAL_RULESET: RuleSet = {
  id: "pull-vertical",
  exerciseIds: ["bw-pullup"],
  view: "side",
  requiredLandmarks: [
    NOSE,
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      const nose = frame.landmarks[NOSE];
      if (nose && joints.wrist && nose.y <= joints.wrist.y + 0.03) {
        pullChinPassedBar = true;
      }
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 150, // heuristik, toleransi ±10–15°
    downThreshold: 90, // heuristik, toleransi ±10–15°
    minRepMs: 1200,
  },
  checks: [
    PULL_ROM_CHECK,
    NO_KIP_CHECK,
  ],
};

// ============================================================================
// 13. ATURAN PUSHUP VARIAN (bw-diamond-pushup, bw-pike-pushup)
// Sudut pandang: SAMPING / DEPAN.
// ============================================================================

export const NARROW_HANDS_CHECK: FormCheck = {
  id: "narrow-hands",
  label: "Posisi Tangan Berlian",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Hanya berlaku untuk bw-diamond-pushup
    if (ctx.exerciseId !== "bw-diamond-pushup") return { ok: true, value: 0, cue: "" };

    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];

    // narrow-hands hanya dievaluasi bila mode kamera depan; abaikan bila tidak ada
    if (
      !lWrist || !rWrist || !lShoulder || !rShoulder ||
      (lWrist.visibility ?? 0) < 0.5 ||
      (rWrist.visibility ?? 0) < 0.5 ||
      (lShoulder.visibility ?? 0) < 0.5 ||
      (rShoulder.visibility ?? 0) < 0.5
    ) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    const wristDist = Math.abs(lWrist.x - rWrist.x);
    const shoulderDist = Math.max(0.1, Math.abs(lShoulder.x - rShoulder.x));
    const ratio = wristDist / shoulderDist;
    if (ratio > 0.6) {
      return {
        ok: false,
        value: Math.round(ratio * 10),
        cue: "Rapatkan kedua tangan membentuk berlian",
      };
    }
    return { ok: true, value: Math.round(ratio * 10), cue: "Posisi tangan baik" };
  },
};

export const PIKE_HIP_HIGH_CHECK: FormCheck = {
  id: "pike-hip-high",
  label: "Posisi Pinggul Tinggi Pike",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !knee) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // sudut bahu–pinggul–lutut > 120 → cue dari matriks
    const hipAngle = angleAt2D(shoulder, hip, knee);
    const isViolating = hipAngle > 120;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("pike-hip-high", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Pertahankan pinggul tinggi",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "" };
  },
};

export const PUSHUP_VARIANT_DEPTH_CHECK: FormCheck = {
  id: "push-depth",
  label: "Kedalaman Tekukan Siku",
  severity: "minor",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // push-depth (bottom): siku minimum > 100
    const minElbow = ctx.minMetricValue;
    if (minElbow > 100) {
      return {
        ok: false,
        value: Math.round(minElbow),
        cue: "Turun lebih dalam, siku sekitar 90 derajat",
      };
    }
    return { ok: true, value: Math.round(minElbow), cue: "Kedalaman siku baik" };
  },
};

export const PIKE_PUSHUP_RULESET: RuleSet = {
  id: "pike-pushup",
  exerciseIds: ["bw-pike-pushup"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 120, // heuristik, toleransi ±10–15° (margin >= 15° di atas ambang cek 100)
    minRepMs: 800,
  },
  checks: [
    PIKE_HIP_HIGH_CHECK,
    PUSHUP_VARIANT_DEPTH_CHECK,
    PRESS_LOCKOUT_CHECK,
  ],
};

export const PUSHUP_VARIANT_RULESET = PIKE_PUSHUP_RULESET;

// ============================================================================
// 14. ATURAN DIP (bw-dips)
// Sudut pandang: SAMPING.
// ============================================================================

export const DIP_DEPTH_CHECK: FormCheck = {
  id: "dip-depth",
  label: "Batas Kedalaman Dips",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Jika sudut siku terlalu dalam (< 70°), berikan peringatan
    const minElbow = ctx.minMetricValue;
    if (minElbow < 70) {
      return {
        ok: false,
        value: Math.round(minElbow),
        cue: "Jangan turun terlalu dalam",
      };
    }
    return { ok: true, value: Math.round(minElbow), cue: "Kedalaman siku aman" };
  },
};

export const NO_SHRUG_CHECK: FormCheck = {
  id: "no-shrug",
  label: "Depresi Bahu Tanpa Shrug",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, ear } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !ear || (ear.visibility ?? 0) < 0.5) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // jarak telinga–bahu menyempit > 15% dari baseline
    const currentDist = Math.hypot(shoulder.x - ear.x, shoulder.y - ear.y);
    if (dipEarShoulderBaseline === null && (ctx.isCalibrated || currentDist > 0)) {
      dipEarShoulderBaseline = currentDist;
    }
    const baseline = dipEarShoulderBaseline ?? currentDist;
    const shrink = baseline > 0 ? (baseline - currentDist) / baseline : 0;
    const isShrugging = shrink > 0.15;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-shrug", isShrugging, 3)) {
      return {
        ok: false,
        value: Math.round(shrink * 100),
        cue: "Turunkan bahu, jauh dari telinga",
      };
    }
    return { ok: true, value: Math.round(shrink * 100), cue: "" };
  },
};

export const DIP_RULESET: RuleSet = {
  id: "dip",
  exerciseIds: ["bw-dips"],
  view: "side",
  requiredLandmarks: [
    L_EAR,
    R_EAR,
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 800,
  },
  checks: [
    DIP_DEPTH_CHECK,
    NO_SHRUG_CHECK,
    PRESS_LOCKOUT_CHECK,
  ],
};

// ============================================================================
// 15. ATURAN PRESS-HORIZONTAL (Tier C)
// Latihan: bb-bench-press, db-bench-press, bb-incline-press, db-incline-press, db-floor-press
// Batasan: JANGAN membuat skor 0–100 untuk tier C.
// Tidak ada cek siku mengembang, lintasan beban, atau gerak skapula.
// ============================================================================

export const PRESS_SYMMETRY_CHECK: FormCheck = {
  id: "press-symmetry",
  label: "Simetri Dorongan Horizontal",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lElbow = frame.landmarks[L_ELBOW];
    const rElbow = frame.landmarks[R_ELBOW];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];
    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];

    if (
      !lElbow || !rElbow || !lShoulder || !rShoulder || !lWrist || !rWrist ||
      (lElbow.visibility ?? 0) < 0.5 || (rElbow.visibility ?? 0) < 0.5
    ) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    const leftAngle = angleAt2D(lShoulder, lElbow, lWrist);
    const rightAngle = angleAt2D(rShoulder, rElbow, rWrist);
    const diff = Math.abs(leftAngle - rightAngle);
    const isViolating = diff > 20;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("press-symmetry", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(diff),
        cue: "Dorong kedua tangan secara seimbang",
      };
    }
    return { ok: true, value: Math.round(diff), cue: "" };
  },
};

export const PRESS_GRIP_WIDTH_CHECK: FormCheck = {
  id: "grip-width",
  label: "Lebar Genggaman Tangan",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];

    if (
      !lWrist || !rWrist || !lShoulder || !rShoulder ||
      (lWrist.visibility ?? 0) < 0.5 ||
      (rWrist.visibility ?? 0) < 0.5 ||
      (lShoulder.visibility ?? 0) < 0.5 ||
      (rShoulder.visibility ?? 0) < 0.5
    ) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    // Rasio jarak pergelangan terhadap jarak bahu dari kamera depan, peringatan bila > 1,5
    const wristDist = Math.abs(lWrist.x - rWrist.x);
    const shoulderDist = Math.max(0.05, Math.abs(lShoulder.x - rShoulder.x));
    const ratio = wristDist / shoulderDist;
    if (ratio > 1.5) {
      return {
        ok: false,
        value: Math.round(ratio * 10),
        cue: "Rapatkan genggaman tangan sedikit",
      };
    }
    return { ok: true, value: Math.round(ratio * 10), cue: "" };
  },
};

export const BUTT_LIFT_CHECK: FormCheck = {
  id: "butt-lift",
  label: "Pantat Terangkat dari Bangku",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { hip } = getSideJoints(frame.landmarks, frame.side);
    if (!hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // pinggul naik > 5% panjang badan dari baseline
    if (benchHipBaseline === null && (ctx.isCalibrated || hip.y > 0)) {
      benchHipBaseline = hip.y;
    }
    const baseline = benchHipBaseline ?? hip.y;
    const bodyLength = Math.max(0.1, ctx.bodyLength ?? ctx.bodyHeight);
    const lift = (baseline - hip.y) / bodyLength;
    const isViolating = lift > 0.05;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("butt-lift", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(lift * 100),
        cue: "Pantat tetap menempel bench",
      };
    }
    return { ok: true, value: Math.round(lift * 100), cue: "" };
  },
};

export const PRESS_HORIZONTAL_RULESET: RuleSet = {
  id: "press-horizontal",
  exerciseIds: [
    "bb-bench-press",
    "bb-incline-press",
    "db-bench-press",
    "db-incline-press",
    "db-floor-press",
  ],
  view: "side",
  tier: "C",
  scored: false,
  banner: "Akurasi terbatas untuk gerakan ini",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
  ],
  mode: "reps",
  counter: {
    // Metrik: hanya hitung repetisi dari sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 800,
  },
  checks: [
    PRESS_LOCKOUT_CHECK,
    BUTT_LIFT_CHECK,
  ],
};

// 16. ATURAN BICEP & HAMMER CURL (db-bicep-curl, bb-barbell-curl, db-hammer-curl)
// Sudut pandang: SAMPING. Catatan: Orientasi genggaman TIDAK dinilai.
// ============================================================================

export const CURL_ELBOW_FIXED_CHECK: FormCheck = {
  id: "elbow-fixed",
  label: "Posisi Siku Diam di Tempat",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, elbow } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Siku bergeser > 12% panjang lengan atas dari garis vertikal bahu
    const upperArmLength = Math.max(0.1, Math.hypot(shoulder.x - elbow.x, shoulder.y - elbow.y));
    const horizontalShift = Math.abs(elbow.x - shoulder.x);
    const ratio = horizontalShift / upperArmLength;
    const isViolating = ctx.currentPhase !== "idle" && ratio > 0.12;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("elbow-fixed", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(ratio * 100),
        cue: "Jaga siku tetap di samping badan",
      };
    }
    return { ok: true, value: Math.round(ratio * 100), cue: "" };
  },
};

export const CURL_NO_BODY_SWING_CHECK: FormCheck = {
  id: "no-body-swing",
  label: "Batang Tubuh Tanpa Ayunan",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Bahu bergeser horizontal / ayunan badan saat mengangkat (lean angle > 15°)
    const trunkLean = angleFromVertical2D(shoulder, hip);
    const isViolating = ctx.currentPhase !== "idle" && trunkLean > 15;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-body-swing", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Jangan mengayunkan badan saat mengangkat",
      };
    }
    return { ok: true, value: Math.round(trunkLean), cue: "" };
  },
};

export const CURL_RULESET: RuleSet = {
  id: "curl",
  exerciseIds: ["db-bicep-curl", "bb-barbell-curl", "db-hammer-curl"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku (bahu-siku-pergelangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 150, // heuristik, toleransi ±10–15°
    downThreshold: 95, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    CURL_ELBOW_FIXED_CHECK,
    CURL_NO_BODY_SWING_CHECK,
  ],
};

// ============================================================================
// 17. ATURAN RAISE (db-lateral-raise, plate-steering-raise, db-rear-delt-fly)
// Sudut pandang: DEPAN / SAMPING.
// ============================================================================

export const RAISE_HEIGHT_CHECK: FormCheck = {
  id: "raise-height",
  label: "Ketinggian Angkatan Lengan",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];

    if (!lWrist || !rWrist || !lShoulder || !rShoulder) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    // Pergelangan tangan tidak melewati bahu (koordinat Y layar: y makin kecil = makin tinggi)
    const isViolating = lWrist.y < lShoulder.y - 0.05 || rWrist.y < rShoulder.y - 0.05;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("raise-height", isViolating, 3)) {
      return {
        ok: false,
        value: 1,
        cue: "Angkat beban tidak melebihi bahu",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const RAISE_SYMMETRY_CHECK: FormCheck = {
  id: "raise-symmetry",
  label: "Simetri Angkatan Lengan Kiri Kanan",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];

    if (
      !lWrist || !rWrist ||
      (lWrist.visibility ?? 0) < 0.5 ||
      (rWrist.visibility ?? 0) < 0.5
    ) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    // Perbedaan elevasi pergelangan tangan kiri dan kanan > 0.08
    const diff = Math.abs(lWrist.y - rWrist.y);
    const isViolating = diff > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("raise-symmetry", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(diff * 100),
        cue: "Angkat kedua lengan secara seimbang",
      };
    }
    return { ok: true, value: Math.round(diff * 100), cue: "" };
  },
};

export const RAISE_RULESET: RuleSet = {
  id: "raise",
  exerciseIds: ["db-lateral-raise", "plate-steering-raise", "db-rear-delt-fly"],
  view: "any",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
  ],
  mode: "reps",
  counter: {
    // Metrik: 180 - sudut elevasi lengan dari panggul (pinggul-bahu-pergelangan)
    // Tangan di bawah: sudut ~20° -> metrik ~160°
    // Tangan di atas setinggi bahu: sudut ~85° -> metrik ~95°
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.shoulder || !joints.wrist) return 180;
      const angle = angleAt2D(joints.hip, joints.shoulder, joints.wrist);
      return Math.max(0, 180 - angle);
    },
    upThreshold: 150, // heuristik, toleransi ±10–15°
    downThreshold: 115, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    RAISE_HEIGHT_CHECK,
    RAISE_SYMMETRY_CHECK,
  ],
};

// ============================================================================
// 18. ATURAN TRICEPS EXTENSION (bb-skull-crusher) — TIER C
// Sudut pandang: SAMPING. Banner: "Tidak ada rujukan jurnal terverifikasi"
// ============================================================================

export const TRICEPS_UPPER_ARM_FIXED_CHECK: FormCheck = {
  id: "upper-arm-fixed",
  label: "Stabilitas Lengan Atas",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, elbow } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Lengan atas tidak boleh berayun maju-mundur > 25° dari vertikal
    const armLean = angleFromVertical2D(shoulder, elbow);
    const isViolating = ctx.currentPhase !== "idle" && armLean > 25;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("upper-arm-fixed", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(armLean),
        cue: "Jaga posisi lengan atas stabil",
      };
    }
    return { ok: true, value: Math.round(armLean), cue: "" };
  },
};

export const TRICEPS_PRESS_LOCKOUT_CHECK: FormCheck = {
  id: "press-lockout",
  label: "Kunci Ekstensi Siku di Puncak",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow || !wrist) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const elbowAngle = angleAt2D(shoulder, elbow, wrist);
    if (elbowAngle < 155) {
      return {
        ok: false,
        value: Math.round(elbowAngle),
        cue: "Kunci siku lurus di atas",
      };
    }
    return { ok: true, value: Math.round(elbowAngle), cue: "Ekstensi siku optimal" };
  },
};

export const TRICEPS_EXT_RULESET: RuleSet = {
  id: "triceps-ext",
  exerciseIds: ["bb-skull-crusher", "db-overhead-triceps-extension"],
  view: "side",
  tier: "C",
  banner: "Tidak ada rujukan jurnal terverifikasi",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku (bahu-siku-pergelangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 150, // heuristik, toleransi ±10–15° (memungkinkan rep selesai saat lockout < 155)
    downThreshold: 95, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    TRICEPS_UPPER_ARM_FIXED_CHECK,
    TRICEPS_PRESS_LOCKOUT_CHECK,
  ],
};

// ============================================================================
// 19. ATURAN PRONE EXTENSION (bw-sky-divers)
// Sudut pandang: SAMPING. Mode: HOLD.
// ============================================================================

export const PRONE_NECK_NEUTRAL_CHECK: FormCheck = {
  id: "neck-neutral",
  label: "Leher Netral Sejajar Punggung",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const nose = frame.landmarks[NOSE];
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!nose || !shoulder || !hip) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    // Leher hiperekstensi (mendongak berlebihan ke atas) saat sudut hidung-bahu-pinggul < 135°
    const angle = angleAt2D(nose, shoulder, hip);
    const isViolating = angle < 135;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("neck-neutral", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(angle),
        cue: "Jaga leher sejajar tulang punggung",
      };
    }
    return { ok: true, value: Math.round(angle), cue: "" };
  },
};

export const PRONE_SYMMETRIC_LIFT_CHECK: FormCheck = {
  id: "symmetric-lift",
  label: "Keseimbangan Angkatan Dada dan Kaki",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];
    const lAnkle = frame.landmarks[L_ANKLE];
    const rAnkle = frame.landmarks[R_ANKLE];

    if (!lShoulder || !rShoulder || !lAnkle || !rAnkle) {
      return { ok: true, value: 0, cue: "" };
    }

    // heuristik, toleransi ±10–15°
    const shoulderDiff = Math.abs(lShoulder.y - rShoulder.y);
    const ankleDiff = Math.abs(lAnkle.y - rAnkle.y);
    const isViolating = shoulderDiff > 0.08 || ankleDiff > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("symmetric-lift", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(Math.max(shoulderDiff, ankleDiff) * 100),
        cue: "Angkat dada dan kaki seimbang",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const PRONE_EXTENSION_RULESET: RuleSet = {
  id: "prone-extension",
  exerciseIds: ["bw-sky-divers"],
  view: "side",
  requiredLandmarks: [
    NOSE,
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "hold",
  counter: {
    metric: (): number => 180,
    upThreshold: 180,
    downThreshold: 0,
    minRepMs: 1000,
  },
  checks: [
    PRONE_NECK_NEUTRAL_CHECK,
    PRONE_SYMMETRIC_LIFT_CHECK,
  ],
};

// ============================================================================
// 20. ATURAN ROTATION (plate-russian-twist)
// Sudut pandang: DEPAN. Catatan: Hanya hitung rotasi bahu terhadap pinggul.
// ============================================================================

export const ROTATION_RULESET: RuleSet = {
  id: "rotation",
  exerciseIds: ["plate-russian-twist"],
  view: "front",
  tier: "C",
  scored: false,
  banner: "Akurasi terbatas untuk gerakan ini",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_WRIST,
    R_WRIST,
  ],
  mode: "reps",
  counter: {
    // Metrik: 180 - rotasi bahu terhadap garis horizontal
    // Di tengah: sudut ~0° -> metrik ~180°
    // Saat rotasi ke samping: kemiringan sudut bertambah -> metrik turun di bawah 145°
    metric: (frame: PoseFrame): number => {
      const lShoulder = frame.landmarks[L_SHOULDER];
      const rShoulder = frame.landmarks[R_SHOULDER];
      if (!lShoulder || !rShoulder) return 180;
      const angleRad = Math.atan2(
        Math.abs(rShoulder.y - lShoulder.y),
        Math.max(0.01, Math.abs(rShoulder.x - lShoulder.x))
      );
      const angleDeg = (angleRad * 180) / Math.PI;
      return Math.max(0, 180 - angleDeg * 1.5);
    },
    upThreshold: 165, // heuristik, toleransi ±10–15°
    downThreshold: 145, // heuristik, toleransi ±10–15°
    minRepMs: 500,
  },
  checks: [],
};

// ============================================================================
// 21. ATURAN CARRY (plate-pinch-carry)
// Sudut pandang: SAMPING. Mode: HOLD (waktu tegak saja).
// ============================================================================

export const CARRY_TRUNK_ERECT_CHECK: FormCheck = {
  id: "trunk-erect",
  label: "Postur Tubuh Tegak Lurus",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Tubuh condong ke depan atau ke belakang > 15° dari sumbu vertikal
    const lean = angleFromVertical2D(shoulder, hip);
    const isViolating = lean > 15;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("trunk-erect", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(lean),
        cue: "Jaga tubuh tegak saat melangkah",
      };
    }
    return { ok: true, value: Math.round(lean), cue: "" };
  },
};

export const CARRY_RULESET: RuleSet = {
  id: "carry",
  exerciseIds: ["plate-pinch-carry"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "hold",
  counter: {
    metric: (): number => 180,
    upThreshold: 180,
    downThreshold: 0,
    minRepMs: 1000,
  },
  checks: [
    CARRY_TRUNK_ERECT_CHECK,
  ],
};

// ============================================================================
// 22. ATURAN KETTLEBELL LAIN (kb-clean-press, kb-halo)
// kb-clean-press fase press saja, kb-halo: head-still.
// ============================================================================

export const KB_HEAD_STILL_CHECK: FormCheck = {
  id: "head-still",
  label: "Kepala Tidak Ikut Bergoyang",
  severity: "minor",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const nose = frame.landmarks[NOSE];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];
    if (!nose || !lShoulder || !rShoulder) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Deviasi horizontal hidung terhadap titik tengah bahu > 0.08
    const midShoulderX = (lShoulder.x + rShoulder.x) / 2;
    const headOffset = Math.abs(nose.x - midShoulderX);
    const isViolating = headOffset > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("head-still", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(headOffset * 100),
        cue: "Jaga kepala tetap tegak diam",
      };
    }
    return { ok: true, value: Math.round(headOffset * 100), cue: "" };
  },
};

export const KETTLEBELL_OTHER_RULESET: RuleSet = {
  id: "kettlebell-other",
  exerciseIds: ["kb-clean-press", "kb-halo"],
  view: "any",
  requiredLandmarks: [
    NOSE,
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
  ],
  mode: "reps",
  counter: {
    // Metrik fase press: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt2D(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 105, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    KB_HEAD_STILL_CHECK,
  ],
};

// ============================================================================
// 23. ATURAN SQUAT OVERHEAD (plate-overhead-squat)
// Cek squat + overhead-arms.
// ============================================================================

export const OVERHEAD_ARMS_CHECK: FormCheck = {
  id: "overhead-arms",
  label: "Lengan Tetap di Atas Kepala",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Lengan tidak boleh condong jatuh ke depan (sudut dari vertikal > 30° atau pergelangan di bawah bahu)
    const armLean = angleFromVertical2D(wrist, shoulder);
    const isDropped = wrist.y >= shoulder.y;
    const isViolating = armLean > 30 || isDropped;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("overhead-arms", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(armLean),
        cue: "Jaga lengan tetap di atas kepala",
      };
    }
    return { ok: true, value: Math.round(armLean), cue: "" };
  },
};

export const SQUAT_OVERHEAD_RULESET: RuleSet = {
  id: "squat-overhead",
  exerciseIds: ["plate-overhead-squat"],
  view: "side",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_ELBOW,
    R_ELBOW,
    L_WRIST,
    R_WRIST,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
    L_HEEL,
    R_HEEL,
  ],
  mode: "reps",
  counter: {
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.knee || !joints.ankle) return 180;
      return angleAt2D(joints.hip, joints.knee, joints.ankle);
    },
    depthProxy: (landmarks: Landmark[], side?: "left" | "right"): number => {
      const joints = getSideJoints(landmarks, side ?? pickVisibleSide(landmarks));
      if (!joints.hip || !joints.knee) return -1;
      return joints.hip.y - joints.knee.y;
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 150, // heuristik, toleransi ±10–15°
    minRepMs: 500,
  },
  checks: [
    SQUAT_DEPTH_CHECK,
    SQUAT_TRUNK_LEAN_CHECK,
    SQUAT_HEEL_LIFT_CHECK,
    OVERHEAD_ARMS_CHECK,
  ],
};

// ============================================================================
// 24. ATURAN GROUND TO OVERHEAD (plate-g2oh) — TIER C
// Hanya hitung repetisi (Tier C).
// ============================================================================

export const GROUND_TO_OVERHEAD_RULESET: RuleSet = {
  id: "ground-to-overhead",
  exerciseIds: ["plate-g2oh"],
  view: "side",
  tier: "C",
  scored: false,
  banner: "Akurasi terbatas untuk gerakan ini",
  requiredLandmarks: [
    L_SHOULDER,
    R_SHOULDER,
    L_HIP,
    R_HIP,
    L_KNEE,
    R_KNEE,
    L_ANKLE,
    R_ANKLE,
  ],
  mode: "reps",
  counter: {
    // Metrik: pergerakan squat / angkatan lutut
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.knee || !joints.ankle) return 180;
      return angleAt2D(joints.hip, joints.knee, joints.ankle);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 145, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [],
};

/**
 * Daftar seluruh RuleSet aktif untuk Form Coach
 */
export const ALL_RULESETS: RuleSet[] = [
  SQUAT_RULESET,
  PUSHUP_RULESET,
  PLANK_RULESET,
  SPLIT_RULESET,
  HINGE_RULESET,
  HINGE_BALLISTIC_RULESET,
  CALF_RULESET,
  BRIDGE_RULESET,
  HANGING_CORE_RULESET,
  PRESS_VERTICAL_RULESET,
  ROW_RULESET,
  PULL_VERTICAL_RULESET,
  PIKE_PUSHUP_RULESET,
  DIP_RULESET,
  PRESS_HORIZONTAL_RULESET,
  CURL_RULESET,
  RAISE_RULESET,
  TRICEPS_EXT_RULESET,
  PRONE_EXTENSION_RULESET,
  ROTATION_RULESET,
  CARRY_RULESET,
  KETTLEBELL_OTHER_RULESET,
  SQUAT_OVERHEAD_RULESET,
  GROUND_TO_OVERHEAD_RULESET,
];

/**
 * Menemukan RuleSet yang sesuai dengan ID latihan yang dipilih.
 */
export function getRuleSetForExercise(exerciseId: string): RuleSet | null {
  return (
    ALL_RULESETS.find((rs) => rs.exerciseIds.includes(exerciseId)) || null
  );
}
