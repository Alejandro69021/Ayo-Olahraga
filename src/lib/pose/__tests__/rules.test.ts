import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter } from "../rep-counter";
import {
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
  ALL_RULESETS,
  getRuleSetForExercise,
  resetViolationStreaks,
} from "../rules/config";
import { PoseFrame } from "../rules/types";
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
} from "../landmarks";

/**
 * Membuat frame sintetis dengan sudut lutut spesifik.
 */
function createSquatFrame(kneeAngleDeg: number, timestampMs: number): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  // Bahu tegak lurus di atas pinggul
  landmarks[L_SHOULDER] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
  // Pinggul
  landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
  // Lutut di bawah pinggul
  landmarks[L_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };

  // Hitung posisi pergelangan kaki agar sudut pinggul-lutut-mata kaki persis kneeAngleDeg
  // Vektor knee -> hip adalah (0, -0.2). Sudut lurus (180°) menghadap ke bawah (0, +0.2).
  const rad = (kneeAngleDeg * Math.PI) / 180;
  const ankleX = 0.5 + 0.2 * Math.sin(Math.PI - rad);
  const ankleY = 0.7 + 0.2 * Math.cos(Math.PI - rad);

  landmarks[L_ANKLE] = { x: ankleX, y: ankleY, z: 0, visibility: 0.95 };
  // Tumit tetap menapak di lantai (y=0.9)
  landmarks[L_HEEL] = { x: 0.48, y: 0.9, z: 0, visibility: 0.95 };

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

/**
 * Membuat frame sintetis push-up dengan sudut siku dan posisi pinggul tertentu.
 */
function createPushupFrame(
  elbowAngleDeg: number,
  hipSagged: boolean,
  timestampMs: number
): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  // Posisi horizontal pushup: Bahu di x=0.2, y=0.5; Ankle di x=0.8, y=0.5
  landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.8, y: 0.5, z: 0, visibility: 0.95 };

  // Jika hipSagged, pinggul melorot ke bawah (Y lebih besar ke arah lantai)
  // Normal garis lurus y = 0.5, jika melorot y = 0.65 sehingga sudut < 160°
  landmarks[L_HIP] = { x: 0.5, y: hipSagged ? 0.65 : 0.5, z: 0, visibility: 0.95 };

  // Siku sebagai vertex sudut siku:
  // Bahu di (0.2, 0.5), Siku di (0.2, 0.65) -> vektor siku->bahu = (0, -0.15)
  // Lengan lurus (180°) memiliki wrist di (0.2, 0.80) -> vektor siku->wrist = (0, +0.15)
  landmarks[L_ELBOW] = { x: 0.2, y: 0.65, z: 0, visibility: 0.95 };
  const rad = (elbowAngleDeg * Math.PI) / 180;
  landmarks[L_WRIST] = {
    x: 0.2 + 0.15 * Math.sin(Math.PI - rad),
    y: 0.65 + 0.15 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

describe("Form Coach - Rep Counter & Rule Sets", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });
  it("deret sudut lutut yang turun ke 90 lalu kembali ke 170 -> tepat 1 repetisi, tanpa issue depth", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");

    // 1. Kalibrasi 1.5 detik
    for (let t = 0; t <= 1500; t += 300) {
      counter.update(createSquatFrame(170, t));
    }

    // 2. Turun (descending) hingga ke 90° (melebihi paralel) secara terkontrol (> 1000 ms)
    const anglesDescending = [165, 155, 145, 130, 110, 95, 90];
    let time = 1600;
    for (const angle of anglesDescending) {
      time += 260;
      counter.update(createSquatFrame(angle, time));
    }

    // 3. Naik (ascending) kembali ke 170°
    const anglesAscending = [95, 115, 135, 150, 162, 170];
    for (const angle of anglesAscending) {
      time += 200;
      counter.update(createSquatFrame(angle, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.some((i) => i.checkId === "squat-depth")).toBe(false);
    expect(reps[0].score).toBe(100);
  });

  it("turun hanya ke 130 -> 1 repetisi dengan issue 'depth'", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");

    // Kalibrasi
    for (let t = 0; t <= 1500; t += 300) {
      counter.update(createSquatFrame(170, t));
    }

    // Turun setengah (hanya ke 130°)
    let time = 1600;
    const angles = [155, 145, 135, 130, 135, 150, 165, 170];
    for (const angle of angles) {
      time += 150;
      counter.update(createSquatFrame(angle, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    const depthIssue = reps[0].issues.find((i) => i.checkId === "squat-depth");
    expect(depthIssue).toBeDefined();
    expect(depthIssue?.severity).toBe("major");
    expect(depthIssue?.cue).toContain("Turun lebih dalam");
  });

  it("osilasi kecil 165 <-> 155 -> 0 repetisi", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");

    // Kalibrasi
    for (let t = 0; t <= 1500; t += 300) {
      counter.update(createSquatFrame(170, t));
    }

    // Osilasi dangkal di atas downThreshold (150°)
    let time = 1600;
    for (let i = 0; i < 10; i++) {
      time += 100;
      counter.update(createSquatFrame(165, time));
      time += 100;
      counter.update(createSquatFrame(155, time));
    }

    expect(counter.getCompletedReps().length).toBe(0);
  });

  it("push-up dengan pinggul melorot -> issue 'hip-sag' severity critical, skor <= 75", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");

    // Kalibrasi
    for (let t = 0; t <= 1500; t += 300) {
      counter.update(createPushupFrame(170, false, t));
    }

    // Lakukan rep pushup tapi dengan pinggul melorot (hipSagged = true)
    let time = 1600;
    const angles = [160, 140, 95, 85, 95, 140, 160];
    for (const angle of angles) {
      time += 150;
      counter.update(createPushupFrame(angle, true, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);

    const sagIssue = reps[0].issues.find((i) => i.checkId === "pushup-hip-sag");
    expect(sagIssue).toBeDefined();
    expect(sagIssue?.severity).toBe("critical");
    expect(sagIssue?.cue).toContain("Pinggul turun");
    expect(reps[0].score).toBeLessThanOrEqual(75);
  });

  it("plank 10 detik, 3 detik di antaranya melorot -> waktu bersih ≈ 7 detik", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");

    let time = 0;
    // 4 detik pertama: plank form bagus
    for (let i = 0; i < 40; i++) {
      time += 100;
      counter.update(createPushupFrame(170, false, time));
    }

    // 3 detik berikutnya: pinggul melorot (form rusak)
    for (let i = 0; i < 30; i++) {
      time += 100;
      counter.update(createPushupFrame(170, true, time));
    }

    // 3 detik terakhir: kembali form bagus
    for (let i = 0; i < 30; i++) {
      time += 100;
      counter.update(createPushupFrame(170, false, time));
    }

    const holdResult = counter.getHoldResult();
    const cleanSeconds = Math.round(holdResult.cleanHoldMs / 1000);
    const totalSeconds = Math.round(holdResult.totalHoldMs / 1000);

    expect(totalSeconds).toBe(10);
    expect(cleanSeconds).toBe(7);
    expect(holdResult.score).toBeCloseTo(70, 0);
  });

  // =========================================================================
  // FASE 6a: TES KELUARGA BARU (Split, Hinge, Ballistic, Calf, Bridge, Core)
  // =========================================================================

  // Helper untuk Split
  function createSplitFrame(
    frontKneeAngleDeg: number,
    trunkLeanDeg: number,
    heelLift: boolean,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    const trunkRad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = {
      x: 0.5 - 0.3 * Math.sin(trunkRad),
      y: 0.5 - 0.3 * Math.cos(trunkRad),
      z: 0,
      visibility: 0.95,
    };

    landmarks[L_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };
    const kneeRad = (frontKneeAngleDeg * Math.PI) / 180;
    landmarks[L_ANKLE] = {
      x: 0.5 + 0.2 * Math.sin(Math.PI - kneeRad),
      y: 0.7 + 0.2 * Math.cos(Math.PI - kneeRad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_HEEL] = {
      x: 0.48,
      y: heelLift ? 0.82 : 0.9,
      z: 0,
      visibility: 0.95,
    };

    return { landmarks, side: "left", timestampMs };
  }

  // 1. SPLIT (bb-reverse-lunges)
  it("SPLIT: rep lunge sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(SPLIT_RULESET, "bb-reverse-lunges");
    for (let t = 0; t <= 1500; t += 300) counter.update(createSplitFrame(170, 15, false, t));

    const angles = [155, 140, 125, 105, 95, 100, 125, 145, 162];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createSplitFrame(a, 20, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("SPLIT: melanggar tepat satu cek 'front-knee-angle' (turun kurang dalam) -> 1 issue front-knee-angle", () => {
    const counter = new RepCounter(SPLIT_RULESET, "bb-reverse-lunges");
    for (let t = 0; t <= 1500; t += 300) counter.update(createSplitFrame(170, 15, false, t));

    // Turun menembus downThreshold (< 120°) ke 115°, namun tetap > 110° sehingga melanggar kedalaman
    const angles = [155, 135, 122, 115, 115, 122, 135, 150, 162];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createSplitFrame(a, 20, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("front-knee-angle");
    expect(reps[0].issues[0].cue).toContain("Turunkan lutut depan lebih dalam");
  });

  // Helper untuk Hinge
  function createHingeFrame(
    hipAngleDeg: number,
    kneeAngleDeg: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
    // Lutut ke bawah
    landmarks[L_KNEE] = { x: 0.5, y: 0.72, z: 0, visibility: 0.95 };
    const kneeRad = (kneeAngleDeg * Math.PI) / 180;
    landmarks[L_ANKLE] = {
      x: 0.5 + 0.2 * Math.sin(Math.PI - kneeRad),
      y: 0.72 + 0.2 * Math.cos(Math.PI - kneeRad),
      z: 0,
      visibility: 0.95,
    };

    // Bahu berputar terhadap pinggul menghasilkan sudut hipAngleDeg (condong ke depan: x > 0.5)
    const hipRad = (hipAngleDeg * Math.PI) / 180;
    landmarks[L_SHOULDER] = {
      x: 0.5 + 0.3 * Math.sin(Math.PI - hipRad),
      y: 0.5 - 0.3 * Math.cos(Math.PI - hipRad),
      z: 0,
      visibility: 0.95,
    };

    return { landmarks, side: "left", timestampMs };
  }

  // 2. HINGE (bb-deadlift & bb-romanian-deadlift)
  it("HINGE: rep deadlift sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-deadlift");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHingeFrame(175, 165, t));

    const hipAngles = [155, 140, 125, 120, 125, 140, 155, 168, 175];
    let time = 1600;
    for (const a of hipAngles) {
      time += 150;
      counter.update(createHingeFrame(a, 165, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("HINGE: melanggar tepat satu cek 'hip-lockout' (tidak tegak di atas) -> 1 issue hip-lockout", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-deadlift");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHingeFrame(175, 165, t));

    // Naik hanya mencapai 161° (< 165°)
    const hipAngles = [155, 140, 125, 120, 125, 140, 150, 158, 161];
    let time = 1600;
    for (const a of hipAngles) {
      time += 150;
      counter.update(createHingeFrame(a, 165, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("hip-lockout");
    expect(reps[0].issues[0].cue).toContain("Kunci pinggul di posisi tegak");
  });

  // Helper untuk Ballistic (Kettlebell)
  function createBallisticFrame(
    hipAngleDeg: number,
    wristY: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.75, z: 0, visibility: 0.95 };
    const hipRad = (hipAngleDeg * Math.PI) / 180;
    landmarks[L_SHOULDER] = {
      x: 0.5 + 0.3 * Math.sin(Math.PI - hipRad),
      y: 0.5 - 0.3 * Math.cos(Math.PI - hipRad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_WRIST] = { x: 0.65, y: wristY, z: 0, visibility: 0.95 };

    return { landmarks, side: "left", timestampMs };
  }

  // 3. HINGE-BALLISTIC (kb-swing)
  it("BALLISTIC: swing bersih -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    const hipAngles = [155, 135, 120, 120, 135, 155, 168, 175];
    let time = 1600;
    for (const a of hipAngles) {
      time += 100;
      counter.update(createBallisticFrame(a, 0.30, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("BALLISTIC: melanggar tepat satu cek 'swing-height' (ayun terlalu tinggi >= 3 frame) -> 1 issue swing-height", () => {
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    let time = 1600;
    counter.update(createBallisticFrame(155, 0.35, (time += 100)));
    counter.update(createBallisticFrame(130, 0.45, (time += 100)));
    counter.update(createBallisticFrame(120, 0.45, (time += 100)));
    counter.update(createBallisticFrame(135, 0.35, (time += 100)));
    // 3 frame beruntun wrist terlalu tinggi saat naik sebelum lockout tercapai
    counter.update(createBallisticFrame(140, 0.10, (time += 100)));
    counter.update(createBallisticFrame(150, 0.10, (time += 100)));
    counter.update(createBallisticFrame(155, 0.10, (time += 100)));
    // Lockout sempurna (175° >= 165°)
    counter.update(createBallisticFrame(175, 0.10, (time += 100)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("swing-height");
    expect(reps[0].issues[0].cue).toContain("Jangan ayun terlalu tinggi");
  });

  // Helper untuk Calf
  function createCalfFrame(kneeAngleDeg: number, heelY: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    landmarks[L_HIP] = { x: 0.5, y: 0.4, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.65, z: 0, visibility: 0.95 };
    const kneeRad = (kneeAngleDeg * Math.PI) / 180;
    landmarks[L_ANKLE] = {
      x: 0.5 + 0.25 * Math.sin(Math.PI - kneeRad),
      y: 0.65 + 0.25 * Math.cos(Math.PI - kneeRad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_HEEL] = { x: 0.48, y: heelY, z: 0, visibility: 0.95 };

    return { landmarks, side: "left", timestampMs };
  }

  // 4. CALF (bw-calf-raise)
  it("CALF: rep jinjit bersih dengan lutut lurus -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(CALF_RULESET, "bw-calf-raise");
    for (let t = 0; t <= 1500; t += 300) counter.update(createCalfFrame(175, 0.9, t));

    // Jinjit terkontrol (> 500ms): tumit naik ke 0.80 lalu kembali ke 0.9
    let time = 1600;
    const heels = [0.88, 0.85, 0.80, 0.80, 0.80, 0.83, 0.86, 0.90];
    for (const h of heels) {
      time += 150;
      counter.update(createCalfFrame(175, h, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("CALF: melanggar tepat satu cek 'straight-knee' (lutut ditekuk >= 3 frame) -> 1 issue straight-knee", () => {
    const counter = new RepCounter(CALF_RULESET, "bw-calf-raise");
    for (let t = 0; t <= 1500; t += 300) counter.update(createCalfFrame(175, 0.9, t));

    let time = 1600;
    counter.update(createCalfFrame(175, 0.86, (time += 150)));
    counter.update(createCalfFrame(175, 0.82, (time += 150)));
    // 4 frame beruntun lutut ditekuk (150° < 165°), heelY disesuaikan agar lift tetap dalam (>300ms descent)
    counter.update(createCalfFrame(150, 0.76, (time += 150)));
    counter.update(createCalfFrame(150, 0.76, (time += 150)));
    counter.update(createCalfFrame(150, 0.76, (time += 150)));
    counter.update(createCalfFrame(150, 0.78, (time += 150)));
    counter.update(createCalfFrame(175, 0.85, (time += 150)));
    counter.update(createCalfFrame(175, 0.90, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toEqual(["straight-knee"]);
    expect(reps[0].issues[0].checkId).toBe("straight-knee");
    expect(reps[0].issues[0].cue).toContain("Jaga lutut tetap lurus");
  });

  // Helper untuk Bridge
  function createBridgeFrame(hipAngleDeg: number, heelLift: boolean, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    landmarks[L_SHOULDER] = { x: 0.2, y: 0.8, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.8, y: 0.8, z: 0, visibility: 0.95 };
    const rad = (hipAngleDeg * Math.PI) / 180;
    const hipY = 0.8 + 0.3 * Math.cos(rad / 2);
    landmarks[L_HIP] = { x: 0.5, y: hipY, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.8, y: heelLift ? 0.82 : 0.9, z: 0, visibility: 0.95 };

    return { landmarks, side: "left", timestampMs };
  }

  // 5. BRIDGE (bw-glute-bridge)
  it("BRIDGE: rep glute bridge sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(BRIDGE_RULESET, "bw-glute-bridge");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBridgeFrame(175, false, t));

    const angles = [155, 140, 130, 130, 140, 155, 170, 175];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createBridgeFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("BRIDGE: melanggar tepat satu cek 'full-hip-ext' (ekstensi kurang di atas) -> 1 issue full-hip-ext", () => {
    const counter = new RepCounter(BRIDGE_RULESET, "bw-glute-bridge");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBridgeFrame(175, false, t));

    // Menembus downThreshold (< 140°) ke 130°, lalu naik melewati upThreshold (>= 160°) ke 162° tapi < 165°
    const angles = [155, 140, 130, 130, 140, 150, 162];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createBridgeFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("full-hip-ext");
    expect(reps[0].issues[0].cue).toContain("Dorong pinggul hingga sejajar");
  });

  // Helper untuk Hanging Core
  function createHangingFrame(
    hipAngleDeg: number,
    hipX: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));

    landmarks[L_SHOULDER] = { x: hipX, y: 0.2, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: hipX, y: 0.5, z: 0, visibility: 0.95 };

    // Lutut berayun ke depan dan ke atas saat sudut pinggul mengecil
    const rad = (hipAngleDeg * Math.PI) / 180;
    landmarks[L_KNEE] = {
      x: hipX - 0.25 * Math.sin(Math.PI - rad),
      y: 0.5 + 0.25 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };

    return { landmarks, side: "left", timestampMs };
  }

  // 6. HANGING-CORE (bw-hanging-knees)
  it("HANGING-CORE: rep knee raise bersih -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(HANGING_CORE_RULESET, "bw-hanging-knees");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHangingFrame(175, 0.5, t));

    // Angkat lutut (hipAngle mengecil ke 80° <= 95°), tanpa ayunan
    const angles = [155, 125, 95, 80, 95, 125, 150, 165];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createHangingFrame(a, 0.5, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("HANGING-CORE: melanggar tepat satu cek 'no-swing' (berayun horizontal >= 3 frame) -> 1 issue no-swing", () => {
    const counter = new RepCounter(HANGING_CORE_RULESET, "bw-hanging-knees");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHangingFrame(175, 0.5, t));

    let time = 1600;
    counter.update(createHangingFrame(155, 0.50, (time += 150)));
    counter.update(createHangingFrame(125, 0.50, (time += 150)));
    // 4 frame beruntun berayun (hipX = 0.62, deviasi 0.12 > 0.08)
    counter.update(createHangingFrame(100, 0.62, (time += 150)));
    counter.update(createHangingFrame(80, 0.62, (time += 150)));
    counter.update(createHangingFrame(100, 0.62, (time += 150)));
    counter.update(createHangingFrame(125, 0.62, (time += 150)));
    counter.update(createHangingFrame(165, 0.50, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("no-swing");
    expect(reps[0].issues[0].cue).toContain("Hindari berayun saat mengangkat");
  });

  // 7. TES NEGATIF KHUSUS SESUAI PROMPT
  it("bb-deadlift TIDAK memiliki cek id 'back-round'", () => {
    const deadliftRuleSet = getRuleSetForExercise("bb-deadlift");
    expect(deadliftRuleSet).toBeDefined();
    const hasBackRound = deadliftRuleSet?.checks.some((c) => c.id === "back-round");
    expect(hasBackRound).toBe(false);
  });

  it("bb-reverse-lunges TIDAK memiliki cek tentang lutut/ujung kaki", () => {
    const lungeRuleSet = getRuleSetForExercise("bb-reverse-lunges");
    expect(lungeRuleSet).toBeDefined();
    const hasKneeToeCheck = lungeRuleSet?.checks.some(
      (c) =>
        c.id.toLowerCase().includes("toe") ||
        c.id.toLowerCase().includes("ujung") ||
        c.label.toLowerCase().includes("ujung kaki") ||
        c.label.toLowerCase().includes("melewati")
    );
    expect(hasKneeToeCheck).toBe(false);
  });

  // ============================================================================
  // FASE 6b: TES RULESET BARU
  // ============================================================================

  // Helper OHP
  function createOhpFrame(elbowAngleDeg: number, wristOffsetX: number, trunkLeanDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    const trunkRad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[NOSE] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: 0.6, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.8, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.48, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = {
      x: 0.5 + 0.3 * Math.sin(trunkRad),
      y: 0.6 - 0.3 * Math.cos(trunkRad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_ELBOW] = { x: landmarks[L_SHOULDER].x + wristOffsetX / 2, y: landmarks[L_SHOULDER].y - 0.15, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: landmarks[L_ELBOW].x + wristOffsetX / 2 + 0.15 * Math.sin(Math.PI - rad),
      y: landmarks[L_ELBOW].y - 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 1. PRESS-VERTICAL (bb-overhead-press)
  it("PRESS-VERTICAL: rep overhead press sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(PRESS_VERTICAL_RULESET, "bb-overhead-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createOhpFrame(175, 0, 0, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 175];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createOhpFrame(a, 0, 0, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("PRESS-VERTICAL: melanggar tepat satu cek 'ohp-stack' (pergelangan tidak lurus di atas bahu)", () => {
    const counter = new RepCounter(PRESS_VERTICAL_RULESET, "bb-overhead-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createOhpFrame(175, 0, 0, t));

    let time = 1600;
    counter.update(createOhpFrame(150, 0, 0, (time += 150)));
    counter.update(createOhpFrame(120, 0, 0, (time += 150)));
    counter.update(createOhpFrame(90, 0, 0, (time += 150)));
    counter.update(createOhpFrame(85, 0, 0, (time += 150)));
    counter.update(createOhpFrame(120, 0, 0, (time += 150)));
    counter.update(createOhpFrame(150, 0, 0, (time += 150)));
    // Puncak lockout dengan pergelangan melenceng (offset 0.12 > 0.08)
    counter.update(createOhpFrame(175, 0.12, 0, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("ohp-stack");
    expect(reps[0].issues[0].cue).toContain("Posisikan pergelangan lurus di atas bahu");
  });

  // Helper Row
  function createRowFrame(elbowAngleDeg: number, trunkLeanDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    const rad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[L_HIP] = { x: 0.5, y: 0.6, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.8, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.48, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = {
      x: 0.5 + 0.3 * Math.sin(rad),
      y: 0.6 - 0.3 * Math.cos(rad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_ELBOW] = { x: landmarks[L_SHOULDER].x, y: landmarks[L_SHOULDER].y + 0.15, z: 0, visibility: 0.95 };
    const elbowRad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: landmarks[L_ELBOW].x + 0.15 * Math.sin(Math.PI - elbowRad),
      y: landmarks[L_ELBOW].y + 0.15 * Math.cos(Math.PI - elbowRad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 2. ROW (bb-bent-row)
  it("ROW: rep row sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    for (let t = 0; t <= 1500; t += 300) counter.update(createRowFrame(170, 45, t));

    const angles = [150, 125, 100, 90, 100, 125, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createRowFrame(a, 45, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("ROW: melanggar tepat satu cek 'trunk-stable' (sudut punggung berubah > 15 derajat >= 3 frame)", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    for (let t = 0; t <= 1500; t += 300) counter.update(createRowFrame(170, 45, t));

    let time = 1600;
    counter.update(createRowFrame(150, 45, (time += 150)));
    counter.update(createRowFrame(125, 45, (time += 150)));
    // 3 frame berturut-turut sudut batang tubuh berubah drastis (lean = 70°, selisih 25 > 15)
    counter.update(createRowFrame(100, 70, (time += 150)));
    counter.update(createRowFrame(90, 70, (time += 150)));
    counter.update(createRowFrame(100, 70, (time += 150)));
    counter.update(createRowFrame(125, 45, (time += 150)));
    counter.update(createRowFrame(170, 45, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("trunk-stable");
    expect(reps[0].issues[0].cue).toContain("Jaga sudut punggung tetap stabil");
  });

  // Helper Pull-up
  function createPullupFrame(elbowAngleDeg: number, swingOffsetX: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[NOSE] = { x: 0.5, y: 0.20, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = { x: 0.5, y: 0.35, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5 + swingOffsetX, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5 + swingOffsetX, y: 0.80, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5 + swingOffsetX, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.48 + swingOffsetX, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.5, y: 0.20, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: 0.5 + 0.15 * Math.sin(Math.PI - rad),
      y: 0.20 - 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 3. PULL-VERTICAL (bw-pullup)
  it("PULL-VERTICAL: rep pull-up bersih -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(PULL_VERTICAL_RULESET, "bw-pullup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPullupFrame(170, 0, t));

    const angles = [150, 120, 85, 80, 85, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createPullupFrame(a, 0, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("PULL-VERTICAL: melanggar tepat satu cek 'no-kip' (mengayun kaki horizontal >= 3 frame)", () => {
    const counter = new RepCounter(PULL_VERTICAL_RULESET, "bw-pullup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPullupFrame(170, 0, t));

    let time = 1600;
    counter.update(createPullupFrame(150, 0, (time += 150)));
    counter.update(createPullupFrame(120, 0, (time += 150)));
    // 3 frame beruntun mengayun (swing = 0.18 > 0.12)
    counter.update(createPullupFrame(85, 0.18, (time += 150)));
    counter.update(createPullupFrame(80, 0.18, (time += 150)));
    counter.update(createPullupFrame(85, 0.18, (time += 150)));
    counter.update(createPullupFrame(120, 0, (time += 150)));
    counter.update(createPullupFrame(170, 0, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("no-kip");
    expect(reps[0].issues[0].cue).toContain("Lakukan pull-up tanpa mengayun badan");
  });

  // Helper Pike Push-Up
  function createPikeFrame(elbowAngleDeg: number, hipAngleDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_ANKLE] = { x: 0.75, y: 0.85, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.73, y: 0.85, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.65, y: 0.65, z: 0, visibility: 0.95 };
    const hipY = hipAngleDeg > 120 ? 0.70 : 0.40;
    landmarks[L_HIP] = { x: 0.55, y: hipY, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = { x: 0.40, y: 0.55, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.40, y: 0.70, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: 0.40 + 0.15 * Math.sin(Math.PI - rad),
      y: 0.70 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 4. PUSHUP VARIAN (bw-pike-pushup)
  it("PUSHUP-VARIANT: rep pike push-up bersih -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(PUSHUP_VARIANT_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createPikeFrame(a, 90, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("PUSHUP-VARIANT: pike push-up melanggar 'pike-hip-high' (pinggul mendatar >= 3 frame)", () => {
    const counter = new RepCounter(PUSHUP_VARIANT_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    let time = 1600;
    counter.update(createPikeFrame(150, 90, (time += 150)));
    counter.update(createPikeFrame(120, 90, (time += 150)));
    // 3 frame berturut-turut sudut pinggul mendatar (140° > 110°)
    counter.update(createPikeFrame(90, 140, (time += 150)));
    counter.update(createPikeFrame(85, 140, (time += 150)));
    counter.update(createPikeFrame(90, 140, (time += 150)));
    counter.update(createPikeFrame(120, 90, (time += 150)));
    counter.update(createPikeFrame(170, 90, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("pike-hip-high");
    expect(reps[0].issues[0].cue).toContain("Dorong pinggul tinggi membentuk huruf V");
  });

  // Helper Dip
  function createDipFrame(elbowAngleDeg: number, shrug: boolean, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[NOSE] = { x: 0.5, y: shrug ? 0.35 : 0.20, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = { x: 0.5, y: 0.40, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: 0.65, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.80, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.48, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.5, y: 0.55, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: 0.5 + 0.15 * Math.sin(Math.PI - rad),
      y: 0.55 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 5. DIP (bw-dips)
  it("DIP: rep dips bersih -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(DIP_RULESET, "bw-dips");
    for (let t = 0; t <= 1500; t += 300) counter.update(createDipFrame(170, false, t));

    const angles = [145, 120, 100, 90, 100, 120, 145, 170];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createDipFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("DIP: melanggar cek 'dip-depth' (terlalu dalam < 70 derajat) -> memicu peringatan minor", () => {
    const counter = new RepCounter(DIP_RULESET, "bw-dips");
    for (let t = 0; t <= 1500; t += 300) counter.update(createDipFrame(170, false, t));

    let time = 1600;
    counter.update(createDipFrame(145, false, (time += 150)));
    counter.update(createDipFrame(100, false, (time += 150)));
    // Turun terlalu dalam hingga 60° (< 70°)
    counter.update(createDipFrame(60, false, (time += 150)));
    counter.update(createDipFrame(80, false, (time += 150)));
    counter.update(createDipFrame(110, false, (time += 150)));
    counter.update(createDipFrame(140, false, (time += 150)));
    counter.update(createDipFrame(170, false, (time += 150)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("dip-depth");
    expect(reps[0].issues[0].severity).toBe("minor");
    expect(reps[0].issues[0].cue).toContain("Kedalaman cukup, jangan terlalu rendah");
  });

  // Helper Press-Horizontal
  function createHorizontalPressFrame(elbowAngleDeg: number, buttLift: boolean, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_SHOULDER] = { x: 0.30, y: 0.50, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.60, y: buttLift ? 0.35 : 0.50, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.75, y: 0.50, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.75, y: 0.80, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.73, y: 0.80, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.30, y: 0.65, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: 0.30 + 0.15 * Math.sin(Math.PI - rad),
      y: 0.65 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 6. PRESS-HORIZONTAL (Tier C - bb-bench-press)
  it("PRESS-HORIZONTAL: gerakan tier C menghitung repetisi tetapi TIDAK menghasilkan field 'score'", () => {
    const counter = new RepCounter(PRESS_HORIZONTAL_RULESET, "bb-bench-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHorizontalPressFrame(170, false, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createHorizontalPressFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    // Verifikasi keras Tier C: tidak menghasilkan field score
    expect(reps[0].score).toBeUndefined();
    expect("score" in reps[0]).toBe(false);
  });

  // 7. TES NEGATIF KHUSUS SESUAI PROMPT FASE 6b
  it("Seluruh RuleSet Form Coach TIDAK memiliki cek tentang siku mengembang, lintasan beban, atau gerak skapula", () => {
    for (const rs of ALL_RULESETS) {
      for (const check of rs.checks) {
        const text = `${check.id} ${check.label}`.toLowerCase();
        expect(text.includes("mengembang") || text.includes("flare")).toBe(false);
        expect(text.includes("lintasan") || text.includes("bar-path")).toBe(false);
        expect(text.includes("skapula") || text.includes("scapula")).toBe(false);
      }
    }
  });
});
