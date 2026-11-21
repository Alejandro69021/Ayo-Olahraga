import {
  RuleSet,
  FormCheck,
  PoseFrame,
  RepContext,
  CheckResult,
} from "./types";
import { angleAt, angleFromVertical } from "../geometry";
import {
  Landmark,
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

export function resetViolationStreaks(): void {
  streakMap.clear();
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
// ============================================================================

export const SQUAT_DEPTH_CHECK: FormCheck = {
  id: "squat-depth",
  label: "Kedalaman Squat",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Sudut lutut minimum di fase terbawah (bottom)
    // Standar paralel: sudut lutut < 110°. Jika >= 110°, paha belum mencapai paralel
    const minKneeAngle = ctx.minMetricValue;
    if (minKneeAngle >= 110) {
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

    // Sudut garis bahu-ke-pinggul terhadap sumbu vertikal
    const leanAngle = angleFromVertical(shoulder, hip);

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
    // Fase turun (eksentrik) yang terburu-buru (< 1000 ms)
    if (ctx.descentDurationMs > 0 && ctx.descentDurationMs < 1000) {
      return {
        ok: false,
        value: ctx.descentDurationMs,
        cue: "Turun lebih terkontrol",
      };
    }
    return { ok: true, value: ctx.descentDurationMs, cue: "" };
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
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.hip || !joints.knee || !joints.ankle) return 180;
      return angleAt(joints.hip, joints.knee, joints.ankle);
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
// ============================================================================

export const PUSHUP_DEPTH_CHECK: FormCheck = {
  id: "pushup-depth",
  label: "Kedalaman Push-up",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Sudut siku minimum di bawah harus <= 100° (sekitar 90°)
    const minElbowAngle = ctx.minMetricValue;
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

    const bodyAngle = angleAt(shoulder, hip, ankle);

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
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const pikeDist = expectedY - hip.y;
    const pikeRatio = pikeDist / bodyHeight;

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
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow || !wrist) return { ok: true, value: 180, cue: "" };

    const elbowAngle = angleAt(shoulder, elbow, wrist);
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
  exerciseIds: ["bw-pushup"],
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
    // Metrik utama: sudut siku (bahu-siku-pergelangan tangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155,
    downThreshold: 100,
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
// ============================================================================

export const PLANK_HIP_SAG_CHECK: FormCheck = {
  id: "plank-hip-sag",
  label: "Pinggul Turun (Plank)",
  severity: "critical",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 180, cue: "" };

    const bodyAngle = angleAt(shoulder, hip, ankle);
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

    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const pikeDist = expectedY - hip.y;
    const pikeRatio = pikeDist / bodyHeight;

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

    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const horizontalDiff = Math.abs(shoulder.x - elbow.x);
    const diffRatio = horizontalDiff / bodyHeight;

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
        cue: "Turunkan lutut depan lebih dalam",
      };
    }
    return { ok: true, value: Math.round(minAngle), cue: "Kedalaman lunge baik" };
  },
};

export const LUNGE_TRUNK_CHECK: FormCheck = {
  id: "lunge-trunk",
  label: "Kemiringan Batang Tubuh",
  severity: "minor", // saran, bukan kesalahan
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const trunkLean = angleFromVertical(shoulder, hip);
    const isViolating = trunkLean > 40;
    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("lunge-trunk", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Tegakkan dada sedikit",
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
        cue: "Jaga tumit depan tetap menapak",
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
      return angleAt(joints.hip, joints.knee, joints.ankle);
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
// Sudut pandang: SAMPING. Catatan: JANGAN membuat cek punggung membulat (back-round).
// ============================================================================

export const HIP_SHOOT_CHECK: FormCheck = {
  id: "hip-shoot",
  label: "Pinggul Naik Terlalu Cepat",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Pada fase naik (ascending), jika dada tetap terlalu condong (trunk lean > 65°)
    const trunkLean = angleFromVertical(shoulder, hip);
    const isViolating = ctx.currentPhase === "ascending" && trunkLean > 65;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("hip-shoot", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Angkat dada bersamaan dengan pinggul",
      };
    }
    return { ok: true, value: Math.round(trunkLean), cue: "" };
  },
};

export const HIP_LOCKOUT_CHECK: FormCheck = {
  id: "hip-lockout",
  label: "Kunci Pinggul di Atas",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !knee) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const hipAngle = angleAt(shoulder, hip, knee);
    if (hipAngle < 165) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Kunci pinggul di posisi tegak",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "Kunci pinggul sempurna" };
  },
};

export const HINGE_NOT_SQUAT_CHECK: FormCheck = {
  id: "hinge-not-squat",
  label: "Pola Engsel Pinggul RDL",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Berlaku spesifik untuk Romanian Deadlift di mana lutut hanya soft bend
    if (ctx.exerciseId !== "bb-romanian-deadlift") return { ok: true, value: 180, cue: "" };

    const { hip, knee, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!hip || !knee || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    // Lutut tertekuk berlebih (> 35° dari posisi hampir lurus 165° -> sudut < 130°)
    const kneeAngle = angleAt(hip, knee, ankle);
    const isViolating = kneeAngle < 130;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("hinge-not-squat", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(kneeAngle),
        cue: "Lutut sedikit ditekuk, dominan pinggul",
      };
    }
    return { ok: true, value: Math.round(kneeAngle), cue: "" };
  },
};

export const NO_LEAN_BACK_CHECK: FormCheck = {
  id: "no-lean-back",
  label: "Hiperektensi Pinggul ke Belakang",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    const leanAngle = angleFromVertical(shoulder, hip);
    const isLeaningBack = shoulder.x < hip.x - 0.04 && leanAngle > 12;
    if (isLeaningBack) {
      return {
        ok: false,
        value: Math.round(leanAngle),
        cue: "Jangan condong ke belakang",
      };
    }
    return { ok: true, value: Math.round(leanAngle), cue: "" };
  },
};

export const HINGE_RULESET: RuleSet = {
  id: "hinge",
  exerciseIds: ["bb-deadlift", "bb-romanian-deadlift"],
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
      return angleAt(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 135, // heuristik, toleransi ±10–15°
    minRepMs: 600,
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
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Pergelangan tangan melewati tinggi bahu secara berlebihan (wrist.y lebih tinggi dari shoulder.y)
    const isViolating = wrist.y < shoulder.y - 0.05;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("swing-height", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round((shoulder.y - wrist.y) * 100),
        cue: "Jangan ayun terlalu tinggi",
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
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.hip || !joints.knee) return 180;
      return angleAt(joints.shoulder, joints.hip, joints.knee);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 135, // heuristik, toleransi ±10–15°
    minRepMs: 400, // balistik
  },
  checks: [
    HIP_LOCKOUT_CHECK,
    SWING_HEIGHT_CHECK,
    NO_LEAN_BACK_CHECK,
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
    const kneeAngle = angleAt(hip, knee, ankle);
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
        cue: "Angkat tumit lebih tinggi",
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
        cue: "Kontrol gerakan tanpa memantul",
      };
    }
    return { ok: true, value: ctx.descentDurationMs, cue: "" };
  },
};

export const CALF_RULESET: RuleSet = {
  id: "calf",
  exerciseIds: ["bw-calf-raise"],
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
    downThreshold: 155, // heuristik, toleransi ±10–15°
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
    const hipAngle = angleAt(shoulder, hip, knee);
    if (hipAngle < 165) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Dorong pinggul hingga sejajar",
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
    const bodyHeight = Math.max(0.1, ctx.bodyHeight);
    const liftRatio = liftDist / bodyHeight;
    const isViolating = liftRatio > 0.03;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("heel-press", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(liftRatio * 100),
        cue: "Dorong melalui tumit",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const BRIDGE_RULESET: RuleSet = {
  id: "bridge",
  exerciseIds: ["bw-glute-bridge"],
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
      return angleAt(joints.shoulder, joints.hip, joints.knee);
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
        cue: "Angkat lutut di atas pinggul",
      };
    }
    return { ok: true, value: Math.round(minAngle), cue: "Tinggi lutut optimal" };
  },
};

export const NO_SWING_CHECK: FormCheck = {
  id: "no-swing",
  label: "Stabilitas Tanpa Berayun",
  severity: "major",
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
      return angleAt(joints.shoulder, joints.hip, joints.knee);
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
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !wrist) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Pergelangan harus berada tepat di atas bahu pada puncak
    const horizontalOffset = Math.abs(wrist.x - shoulder.x);
    if (horizontalOffset > 0.08) {
      return {
        ok: false,
        value: Math.round(horizontalOffset * 100),
        cue: "Posisikan pergelangan lurus di atas bahu",
      };
    }
    return { ok: true, value: Math.round(horizontalOffset * 100), cue: "Posisi lengan sejajar baik" };
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
    const trunkLean = angleFromVertical(shoulder, hip);
    const isLeaningBack = (frame.side === "left" ? shoulder.x < hip.x : shoulder.x > hip.x) && trunkLean > 12;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("ohp-lean-back", isLeaningBack, 3)) {
      return {
        ok: false,
        value: Math.round(trunkLean),
        cue: "Jangan condongkan badan ke belakang",
      };
    }
    return { ok: true, value: Math.round(trunkLean), cue: "" };
  },
};

export const PRESS_LOCKOUT_CHECK: FormCheck = {
  id: "press-lockout",
  label: "Ekstensi Siku Penuh di Atas",
  severity: "major",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, elbow, wrist } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !elbow || !wrist) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    const elbowAngle = angleAt(shoulder, elbow, wrist);
    if (elbowAngle < 165) {
      return {
        ok: false,
        value: Math.round(elbowAngle),
        cue: "Kunci siku lurus di atas",
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
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    OHP_STACK_CHECK,
    OHP_LEAN_BACK_CHECK,
    PRESS_LOCKOUT_CHECK,
  ],
};

// ============================================================================
// 11. ATURAN ROW (bb-bent-row, db-single-row, kb-single-row)
// Sudut pandang: SAMPING. Catatan: Rotasi batang tubuh TIDAK dinilai.
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
    const currentLean = angleFromVertical(shoulder, hip);
    // Simpan acuan torso di awal latihan/repetisi
    const targetLean = 45;
    const diff = Math.abs(currentLean - targetLean);
    const isViolating = diff > 15;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("trunk-stable", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(diff),
        cue: "Jaga sudut punggung tetap stabil",
      };
    }
    return { ok: true, value: Math.round(diff), cue: "" };
  },
};

export const ROW_NO_MOMENTUM_CHECK: FormCheck = {
  id: "no-momentum",
  label: "Tarikan Tanpa Momentum Ayunan",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    const { shoulder, hip } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Mengayun badan tegak mendadak saat fase tarikan (descending/tarik beban, lean < 25°)
    const currentLean = angleFromVertical(shoulder, hip);
    const isViolating = ctx.currentPhase === "descending" && currentLean < 25;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-momentum", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(currentLean),
        cue: "Tarik beban tanpa mengayun badan",
      };
    }
    return { ok: true, value: Math.round(currentLean), cue: "" };
  },
};

export const ROW_ELBOW_BACK_CHECK: FormCheck = {
  id: "row-elbow-back",
  label: "Siku Melewati Garis Badan",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Di puncak tarikan (sudut siku minimum di bottom)
    // heuristik, toleransi ±10–15°
    const minElbowAngle = ctx.minMetricValue;
    if (minElbowAngle > 110) {
      return {
        ok: false,
        value: Math.round(minElbowAngle),
        cue: "Tarik siku melewati garis tubuh",
      };
    }
    return { ok: true, value: Math.round(minElbowAngle), cue: "Tarikan siku cukup dalam" };
  },
};

export const ROW_RULESET: RuleSet = {
  id: "row",
  exerciseIds: ["bb-bent-row", "db-single-row", "kb-single-row"],
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
  ],
  mode: "reps",
  counter: {
    // Metrik: sudut siku (bahu-siku-pergelangan)
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 110, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    ROW_TRUNK_STABLE_CHECK,
    ROW_NO_MOMENTUM_CHECK,
    ROW_ELBOW_BACK_CHECK,
  ],
};

// ============================================================================
// 12. ATURAN PULL-VERTICAL (bw-pullup)
// Sudut pandang: SAMPING / DEPAN.
// ============================================================================

export const PULL_ROM_CHECK: FormCheck = {
  id: "pull-rom",
  label: "Rentang Gerak Pull-Up",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Di puncak tarikan (bottom): dagu/bahu melewati pergelangan tangan (sudut siku <= 85°)
    const minElbow = ctx.minMetricValue;
    if (minElbow > 85) {
      return {
        ok: false,
        value: Math.round(minElbow),
        cue: "Tarik dagu hingga lewati palang",
      };
    }
    return { ok: true, value: Math.round(minElbow), cue: "Rentang tarikan penuh" };
  },
};

export const NO_KIP_CHECK: FormCheck = {
  id: "no-kip",
  label: "Pull-Up Bersih Tanpa Kipping",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const { shoulder, hip, knee } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !knee) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Osilasi horizontal lutut atau pinggul > 0.12 dari garis vertikal bahu
    const swingOffset = Math.max(Math.abs(knee.x - shoulder.x), Math.abs(hip.x - shoulder.x));
    const isViolating = swingOffset > 0.12;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-kip", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(swingOffset * 100),
        cue: "Lakukan pull-up tanpa mengayun badan",
      };
    }
    return { ok: true, value: Math.round(swingOffset * 100), cue: "" };
  },
};

export const GRIP_NOT_WIDE_CHECK: FormCheck = {
  id: "grip-not-wide",
  label: "Lebar Cengkeraman Palang",
  severity: "minor",
  when: "top",
  evaluate: (frame: PoseFrame): CheckResult => {
    const lWrist = frame.landmarks[L_WRIST];
    const rWrist = frame.landmarks[R_WRIST];
    const lShoulder = frame.landmarks[L_SHOULDER];
    const rShoulder = frame.landmarks[R_SHOULDER];

    // grip-not-wide hanya dievaluasi bila mode kamera depan; abaikan bila tidak ada
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
    if (ratio > 1.8) {
      return {
        ok: false,
        value: Math.round(ratio * 10),
        cue: "Gunakan cengkeraman selebar bahu",
      };
    }
    return { ok: true, value: Math.round(ratio * 10), cue: "" };
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
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 90, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    PULL_ROM_CHECK,
    NO_KIP_CHECK,
    GRIP_NOT_WIDE_CHECK,
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
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame, ctx: RepContext): CheckResult => {
    // Hanya berlaku untuk bw-pike-pushup
    if (ctx.exerciseId !== "bw-pike-pushup") return { ok: true, value: 0, cue: "" };

    const { shoulder, hip, ankle } = getSideJoints(frame.landmarks, frame.side);
    if (!shoulder || !hip || !ankle) return { ok: true, value: 180, cue: "" };

    // heuristik, toleransi ±10–15°
    // Tubuh harus membentuk inverted V (sudut pinggul bahu-pinggul-pergelangan kaki < 110°)
    const hipAngle = angleAt(shoulder, hip, ankle);
    const isViolating = hipAngle > 110;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("pike-hip-high", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(hipAngle),
        cue: "Dorong pinggul tinggi membentuk huruf V",
      };
    }
    return { ok: true, value: Math.round(hipAngle), cue: "" };
  },
};

export const PUSHUP_VARIANT_DEPTH_CHECK: FormCheck = {
  id: "push-depth",
  label: "Kedalaman Tekukan Siku",
  severity: "major",
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    const minElbow = ctx.minMetricValue;
    if (minElbow > 100) {
      return {
        ok: false,
        value: Math.round(minElbow),
        cue: "Turun lebih dalam, tekuk siku",
      };
    }
    return { ok: true, value: Math.round(minElbow), cue: "Kedalaman siku baik" };
  },
};

export const PUSHUP_VARIANT_RULESET: RuleSet = {
  id: "pushup-variant",
  exerciseIds: ["bw-diamond-pushup", "bw-pike-pushup"],
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
    // Metrik: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 160, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 500,
  },
  checks: [
    NARROW_HANDS_CHECK,
    PIKE_HIP_HIGH_CHECK,
    PUSHUP_VARIANT_DEPTH_CHECK,
  ],
};

// ============================================================================
// 14. ATURAN DIP (bw-dips)
// Sudut pandang: SAMPING.
// ============================================================================

export const DIP_DEPTH_CHECK: FormCheck = {
  id: "dip-depth",
  label: "Batas Kedalaman Dips",
  severity: "minor", // peringatan, bukan vonis
  when: "bottom",
  evaluate: (_frame: PoseFrame, ctx: RepContext): CheckResult => {
    // heuristik, toleransi ±10–15°
    // Jika sudut siku terlalu dalam (< 70°), berikan peringatan aman
    const minElbow = ctx.minMetricValue;
    if (minElbow < 70) {
      return {
        ok: false,
        value: Math.round(minElbow),
        cue: "Kedalaman cukup, jangan terlalu rendah",
      };
    }
    return { ok: true, value: Math.round(minElbow), cue: "Kedalaman siku aman" };
  },
};

export const NO_SHRUG_CHECK: FormCheck = {
  id: "no-shrug",
  label: "Depresi Bahu Tanpa Shrug",
  severity: "major",
  when: "continuous",
  evaluate: (frame: PoseFrame): CheckResult => {
    const nose = frame.landmarks[NOSE];
    const { shoulder } = getSideJoints(frame.landmarks, frame.side);
    if (!nose || !shoulder || (nose.visibility ?? 0) < 0.5) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Bahu terdorong ke atas mendekati telinga/hidung (jarak vertikal < 0.08)
    const dist = shoulder.y - nose.y;
    const isShrugging = dist < 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("no-shrug", isShrugging, 3)) {
      return {
        ok: false,
        value: Math.round(dist * 100),
        cue: "Jauhkan bahu dari telinga",
      };
    }
    return { ok: true, value: Math.round(dist * 100), cue: "" };
  },
};

export const DIP_RULESET: RuleSet = {
  id: "dip",
  exerciseIds: ["bw-dips"],
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
    // Metrik: sudut siku
    metric: (frame: PoseFrame): number => {
      const joints = getSideJoints(frame.landmarks, frame.side);
      if (!joints.shoulder || !joints.elbow || !joints.wrist) return 180;
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 105, // heuristik, toleransi ±10–15°
    minRepMs: 600,
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
    const leftAngle = angleAt(lShoulder, lElbow, lWrist);
    const rightAngle = angleAt(rShoulder, rElbow, rWrist);
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
    if (!ctx.isCalibrated) return { ok: true, value: 0, cue: "" };
    const { hip } = getSideJoints(frame.landmarks, frame.side);
    if (!hip) return { ok: true, value: 0, cue: "" };

    // heuristik, toleransi ±10–15°
    // Pantat tidak terangkat dari bench/lantai
    const lift = (ctx.heelYBaseline - hip.y) / Math.max(0.1, ctx.bodyHeight);
    const isViolating = ctx.currentPhase === "ascending" && lift > 0.08;

    // hanya memicu koreksi bila pelanggaran konsisten >= 3 frame
    if (checkConsecutiveViolation("butt-lift", isViolating, 3)) {
      return {
        ok: false,
        value: Math.round(lift * 100),
        cue: "Jaga pantat tetap menempel bangku",
      };
    }
    return { ok: true, value: 0, cue: "" };
  },
};

export const PRESS_HORIZONTAL_RULESET: RuleSet = {
  id: "press-horizontal",
  exerciseIds: [
    "bb-bench-press",
    "db-bench-press",
    "bb-incline-press",
    "db-incline-press",
    "db-floor-press",
  ],
  view: "side",
  tier: "C",
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
      return angleAt(joints.shoulder, joints.elbow, joints.wrist);
    },
    upThreshold: 155, // heuristik, toleransi ±10–15°
    downThreshold: 100, // heuristik, toleransi ±10–15°
    minRepMs: 600,
  },
  checks: [
    PRESS_SYMMETRY_CHECK,
    PRESS_GRIP_WIDTH_CHECK,
    BUTT_LIFT_CHECK,
  ],
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
  PUSHUP_VARIANT_RULESET,
  DIP_RULESET,
  PRESS_HORIZONTAL_RULESET,
];

/**
 * Menemukan RuleSet yang sesuai dengan ID latihan yang dipilih.
 */
export function getRuleSetForExercise(exerciseId: string): RuleSet | null {
  return (
    ALL_RULESETS.find((rs) => rs.exerciseIds.includes(exerciseId)) || null
  );
}
