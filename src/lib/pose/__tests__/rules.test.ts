import { describe, it, expect, beforeEach } from "vitest";
import { EXERCISES_DATABASE } from "../../../data/exercises";
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
  PIKE_PUSHUP_RULESET,
  PUSHUP_VARIANT_RULESET,
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
  ALL_RULESETS,
  getRuleSetForExercise,
  setBallisticFps,
  resetViolationStreaks,
} from "../rules/config";
import { PoseFrame } from "../rules/types";
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
    expect(reps[0].issues[0].cue).toContain("Turun sampai lutut depan sekitar 90 derajat");
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

    const hipAngles = [155, 135, 110, 110, 125, 140, 155, 168, 175];
    let time = 1600;
    for (const a of hipAngles) {
      time += 250;
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
    const hipAngles = [155, 135, 110, 110, 125, 140, 150, 158, 161];
    let time = 1600;
    for (const a of hipAngles) {
      time += 250;
      counter.update(createHingeFrame(a, 165, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("hip-lockout");
    expect(reps[0].issues[0].cue).toContain("Berdiri tegak penuh di atas");
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
    setBallisticFps(30);
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    const hipAngles = [155, 135, 110, 110, 135, 155, 168, 175];
    let time = 1600;
    for (const a of hipAngles) {
      time += 200;
      counter.update(createBallisticFrame(a, 0.30, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("BALLISTIC: melanggar tepat satu cek 'swing-height' (ayun terlalu tinggi >= 3 frame) -> 1 issue swing-height", () => {
    setBallisticFps(30);
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    let time = 1600;
    counter.update(createBallisticFrame(155, 0.35, (time += 200)));
    counter.update(createBallisticFrame(110, 0.45, (time += 200)));
    counter.update(createBallisticFrame(110, 0.45, (time += 200)));
    counter.update(createBallisticFrame(135, 0.35, (time += 200)));
    // 3 frame beruntun wrist terlalu tinggi saat naik sebelum lockout tercapai
    counter.update(createBallisticFrame(140, 0.10, (time += 200)));
    counter.update(createBallisticFrame(150, 0.10, (time += 200)));
    counter.update(createBallisticFrame(155, 0.10, (time += 200)));
    // Lockout sempurna (175° >= 165°)
    counter.update(createBallisticFrame(175, 0.10, (time += 200)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("swing-height");
    expect(reps[0].issues[0].cue).toContain("Ayun sampai setinggi dada, bukan lebih");
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
      time += 200;
      counter.update(createBridgeFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("full-hip-ext");
    expect(reps[0].issues[0].cue).toContain("Dorong pinggul sampai bahu-lutut lurus");
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
    landmarks[NOSE] = { x: 0.3, y: 0.2, z: 0, visibility: 0.95 };
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

    const angles = [150, 120, 85, 80, 85, 120, 150, 175];
    let time = 1600;
    for (const a of angles) {
      time += 250;
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
    counter.update(createOhpFrame(150, 0, 0, (time += 250)));
    counter.update(createOhpFrame(120, 0, 0, (time += 250)));
    counter.update(createOhpFrame(85, 0, 0, (time += 250)));
    counter.update(createOhpFrame(80, 0, 0, (time += 250)));
    counter.update(createOhpFrame(120, 0, 0, (time += 250)));
    counter.update(createOhpFrame(150, 0, 0, (time += 250)));
    // Puncak lockout dengan pergelangan melenceng (offset 0.12 > 0.08)
    counter.update(createOhpFrame(175, 0.12, 0, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("ohp-stack");
    expect(reps[0].issues[0].cue).toContain("Tumpuk pergelangan di atas bahu");
  });

  // Helper Row
  function createRowFrame(elbowAngleDeg: number, trunkLeanDeg: number, timestampMs: number, elbowPassedBack: boolean = true): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    const rad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[NOSE] = { x: 0.2, y: 0.3, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: 0.6, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.5, y: 0.8, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.48, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = {
      x: 0.5 - 0.3 * Math.sin(rad),
      y: 0.6 - 0.3 * Math.cos(rad),
      z: 0,
      visibility: 0.95,
    };
    // Siku menarik melewati badan ke belakang (rowElbowPassedBack)
    const elbowOffsetX = elbowPassedBack ? 0.04 : -0.04;
    landmarks[L_ELBOW] = { x: landmarks[L_SHOULDER].x + elbowOffsetX, y: landmarks[L_SHOULDER].y + 0.15, z: 0, visibility: 0.95 };
    const theta1 = Math.atan2(landmarks[L_SHOULDER].y - landmarks[L_ELBOW].y, landmarks[L_SHOULDER].x - landmarks[L_ELBOW].x);
    const theta2 = theta1 + (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: landmarks[L_ELBOW].x + 0.15 * Math.cos(theta2),
      y: landmarks[L_ELBOW].y + 0.15 * Math.sin(theta2),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // 2. ROW (bb-bent-row)
  it("ROW: rep row sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    for (let t = 100; t <= 1700; t += 300) counter.update(createRowFrame(170, 45, t));

    const angles = [150, 125, 95, 90, 85, 90, 95, 125, 150, 170];
    let time = 1800;
    for (const a of angles) {
      time += 200;
      counter.update(createRowFrame(a, 45, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("ROW: melanggar tepat satu cek 'trunk-stable' (sudut punggung berubah > 15 derajat >= 3 frame)", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    // Kalibrasi pada 45°
    for (let t = 100; t <= 1700; t += 300) counter.update(createRowFrame(170, 45, t));

    // Posisi sudut punggung berubah ke 65° (> 15° dari baseline 45°), namun stabil tanpa ayunan (no-momentum = 0)
    const angles = [150, 125, 95, 90, 85, 90, 95, 125, 150, 170];
    let time = 1800;
    for (const a of angles) {
      time += 200;
      counter.update(createRowFrame(a, 65, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("trunk-stable");
    expect(reps[0].issues[0].cue).toContain("Jaga sudut badan tetap");
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
      time += 350;
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
    counter.update(createPullupFrame(150, 0, (time += 350)));
    counter.update(createPullupFrame(120, 0, (time += 350)));
    // 3 frame beruntun mengayun (swing = 0.18 > 0.12)
    counter.update(createPullupFrame(85, 0.18, (time += 350)));
    counter.update(createPullupFrame(80, 0.18, (time += 350)));
    counter.update(createPullupFrame(85, 0.18, (time += 350)));
    counter.update(createPullupFrame(120, 0, (time += 350)));
    counter.update(createPullupFrame(170, 0, (time += 350)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("no-kip");
    expect(reps[0].issues[0].cue).toContain("Kurangi ayunan kaki dan pinggul");
  });

  // Helper Pike Push-Up
  function createPikeFrame(elbowAngleDeg: number, hipAngleDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_ANKLE] = { x: 0.75, y: 0.85, z: 0, visibility: 0.95 };
    landmarks[L_HEEL] = { x: 0.73, y: 0.85, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: 0.65, y: 0.65, z: 0, visibility: 0.95 };
    // Posisi hip: jika mendatar (> 120), hip.y turun sejajar badan (0.60); jika pike (< 120), hip.y naik tinggi (0.35)
    const hipY = hipAngleDeg > 120 ? 0.60 : 0.35;
    landmarks[L_HIP] = { x: 0.52, y: hipY, z: 0, visibility: 0.95 };
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
    const counter = new RepCounter(PIKE_PUSHUP_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createPikeFrame(a, 90, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("PUSHUP-VARIANT: pike push-up melanggar 'pike-hip-high' (pinggul mendatar >= 3 frame)", () => {
    const counter = new RepCounter(PIKE_PUSHUP_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    let time = 1600;
    counter.update(createPikeFrame(150, 90, (time += 250)));
    counter.update(createPikeFrame(120, 90, (time += 250)));
    // 3 frame berturut-turut sudut pinggul mendatar (> 120)
    counter.update(createPikeFrame(90, 140, (time += 250)));
    counter.update(createPikeFrame(85, 140, (time += 250)));
    counter.update(createPikeFrame(90, 140, (time += 250)));
    counter.update(createPikeFrame(120, 90, (time += 250)));
    counter.update(createPikeFrame(170, 90, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("pike-hip-high");
    expect(reps[0].issues[0].cue).toContain("Pertahankan pinggul tinggi");
  });

  // Helper Dip
  function createDipFrame(elbowAngleDeg: number, shrug: boolean, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[NOSE] = { x: 0.5, y: 0.20, z: 0, visibility: 0.95 };
    landmarks[L_EAR] = { x: 0.5, y: shrug ? 0.35 : 0.25, z: 0, visibility: 0.95 };
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

    const angles = [145, 120, 90, 85, 90, 120, 145, 170];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createDipFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  it("DIP: melanggar cek 'dip-depth' (terlalu dalam < 70 derajat) -> memicu peringatan major", () => {
    const counter = new RepCounter(DIP_RULESET, "bw-dips");
    for (let t = 0; t <= 1500; t += 300) counter.update(createDipFrame(170, false, t));

    let time = 1600;
    counter.update(createDipFrame(145, false, (time += 250)));
    counter.update(createDipFrame(120, false, (time += 250)));
    // Turun terlalu dalam hingga 60° (< 70°)
    counter.update(createDipFrame(60, false, (time += 250)));
    counter.update(createDipFrame(80, false, (time += 250)));
    counter.update(createDipFrame(110, false, (time += 250)));
    counter.update(createDipFrame(140, false, (time += 250)));
    counter.update(createDipFrame(170, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(1);
    expect(reps[0].issues[0].checkId).toBe("dip-depth");
    expect(reps[0].issues[0].severity).toBe("major");
    expect(reps[0].issues[0].cue).toContain("Jangan turun terlalu dalam");
  });

  // Helper Press-Horizontal
  function createHorizontalPressFrame(elbowAngleDeg: number, buttLift: boolean, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[NOSE] = { x: 0.15, y: 0.50, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = { x: 0.30, y: 0.50, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.60, y: buttLift ? 0.40 : 0.50, z: 0, visibility: 0.95 };
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
    expect(PRESS_HORIZONTAL_RULESET.scored).toBe(false);
    expect(PRESS_HORIZONTAL_RULESET.tier).toBe("C");
    expect(PRESS_HORIZONTAL_RULESET.banner).toBe("Akurasi terbatas untuk gerakan ini");

    const counter = new RepCounter(PRESS_HORIZONTAL_RULESET, "bb-bench-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHorizontalPressFrame(170, false, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 250;
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
  it("Latihan Form Coach Fase 6b-2 memiliki konfigurasi formCoach yang valid di database", () => {
    const byId = new Map(EXERCISES_DATABASE.map((e) => [e.id, e]));

    // bw-diamond-pushup -> pushup
    expect(byId.get("bw-diamond-pushup")?.formCoach).toEqual({
      ruleSetId: "pushup",
      view: "side",
      cameraTip: expect.any(String),
    });

    // bw-pike-pushup -> pike-pushup
    expect(byId.get("bw-pike-pushup")?.formCoach).toEqual({
      ruleSetId: "pike-pushup",
      view: "side",
      cameraTip: expect.any(String),
    });

    // bw-dips -> dip
    expect(byId.get("bw-dips")?.formCoach).toEqual({
      ruleSetId: "dip",
      view: "side",
      cameraTip: expect.any(String),
    });

    // 5 gerakan press horizontal Tier C -> press-horizontal
    const benchPresses = [
      "bb-bench-press",
      "bb-incline-press",
      "db-bench-press",
      "db-incline-press",
      "db-floor-press",
    ];
    for (const id of benchPresses) {
      expect(byId.get(id)?.formCoach).toEqual({
        ruleSetId: "press-horizontal",
        view: "side",
        cameraTip: expect.any(String),
      });
    }

    // Gerakan Fase 6c-wire (misal bb-barbell-curl) sekarang memiliki formCoach
    expect(byId.get("bb-barbell-curl")?.formCoach).toEqual({
      ruleSetId: "curl",
      view: "side",
      cameraTip: expect.any(String),
    });
  });

  // =========================================================================
  // CAKUPAN TES TAMBAHAN UNTUK SETIAP RULESET WAJIB & FORMCHECK
  // =========================================================================

  // Helper Squat Tambahan
  function createSquatFrameDetailed(
    kneeAngleDeg: number,
    trunkLeanDeg: number,
    heelLift: boolean,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
    const trunkRad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[L_SHOULDER] = {
      x: 0.5 - 0.3 * Math.sin(trunkRad),
      y: 0.5 - 0.3 * Math.cos(trunkRad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };
    const rad = (kneeAngleDeg * Math.PI) / 180;
    landmarks[L_ANKLE] = {
      x: 0.5 + 0.2 * Math.sin(Math.PI - rad),
      y: 0.7 + 0.2 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[L_HEEL] = { x: 0.48, y: heelLift ? 0.82 : 0.90, z: 0, visibility: 0.95 };
    return { landmarks, side: "left", timestampMs };
  }

  // SQUAT: Pelanggaran squat-trunk-lean
  it("SQUAT: melanggar cek 'squat-trunk-lean' (dada condong berlebih di bawah > 45 derajat)", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    for (let t = 100; t <= 1700; t += 300) counter.update(createSquatFrameDetailed(170, 10, false, t));

    let time = 1800;
    const desc = [155, 140, 120, 105, 95, 90];
    for (const a of desc) {
      time += 250;
      // Di bawah (<= 110), badan condong 55° (> 45°)
      counter.update(createSquatFrameDetailed(a, a <= 110 ? 55 : 10, false, time));
    }
    const asc = [95, 120, 145, 162, 170];
    for (const a of asc) {
      time += 200;
      // Saat mulai berbalik di titik bawah (95), badan tetap condong 55° agar evaluasi bottom check memicu
      counter.update(createSquatFrameDetailed(a, a <= 110 ? 55 : 10, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("squat-trunk-lean");
    const issue = reps[0].issues.find(i => i.checkId === "squat-trunk-lean");
    expect(issue?.cue).toContain("Dada lebih tegak");
  });

  // SQUAT: Pelanggaran squat-heel-lift
  it("SQUAT: melanggar cek 'squat-heel-lift' (tumit terangkat dari lantai)", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    for (let t = 100; t <= 1700; t += 300) counter.update(createSquatFrameDetailed(170, 10, false, t));

    let time = 1800;
    const desc = [155, 140, 120, 105, 95, 90];
    for (const a of desc) {
      time += 250;
      counter.update(createSquatFrameDetailed(a, 10, a <= 105, time));
    }
    const asc = [95, 120, 145, 162, 170];
    for (const a of asc) {
      time += 200;
      counter.update(createSquatFrameDetailed(a, 10, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("squat-heel-lift");
    const issue = reps[0].issues.find(i => i.checkId === "squat-heel-lift");
    expect(issue?.cue).toContain("Tumit tetap menapak");
  });

  // SQUAT: Pelanggaran squat-descent-speed
  it("SQUAT: melanggar cek 'squat-descent-speed' (turun terburu-buru < 1000 ms)", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    for (let t = 100; t <= 1700; t += 300) counter.update(createSquatFrameDetailed(170, 10, false, t));

    // Turun sangat cepat: dari t=1800 (145°) ke t=2200 (90°) -> 400ms < 1000ms
    counter.update(createSquatFrameDetailed(145, 10, false, 1800));
    counter.update(createSquatFrameDetailed(90, 10, false, 2200));
    // Naik kembali
    counter.update(createSquatFrameDetailed(95, 10, false, 2400));
    counter.update(createSquatFrameDetailed(135, 10, false, 2600));
    counter.update(createSquatFrameDetailed(170, 10, false, 2800));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("squat-descent-speed");
    const issue = reps[0].issues.find(i => i.checkId === "squat-descent-speed");
    expect(issue?.cue).toContain("Turun lebih terkontrol");
  });

  // Helper Pushup Tambahan
  function createPushupFrameDetailed(
    elbowAngleDeg: number,
    hipY: number,
    elbowX: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.8, y: 0.5, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: hipY, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: elbowX, y: 0.65, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: elbowX + 0.15 * Math.sin(Math.PI - rad),
      y: 0.65 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // PUSHUP: Rep push-up bersih
  it("PUSHUP: rep push-up bersih sempurna -> 1 rep, 0 issue, skor 100", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPushupFrameDetailed(170, 0.5, 0.2, t));

    const angles = [150, 120, 95, 85, 95, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 200;
      counter.update(createPushupFrameDetailed(a, 0.5, 0.2, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // PUSHUP: Pelanggaran pushup-hip-pike
  it("PUSHUP: melanggar cek 'pushup-hip-pike' (pinggul terlalu naik di atas garis badan)", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPushupFrameDetailed(170, 0.5, 0.2, t));

    const angles = [150, 120, 95, 85, 95, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 200;
      // Hip naik ke y=0.38 (pikeRatio ~ 0.20 > 0.08)
      counter.update(createPushupFrameDetailed(a, 0.38, 0.2, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("pushup-hip-pike");
    const issue = reps[0].issues.find(i => i.checkId === "pushup-hip-pike");
    expect(issue?.cue).toContain("Pinggul terlalu naik");
  });

  // PUSHUP: Pelanggaran pushup-lockout
  it("PUSHUP: melanggar cek 'pushup-lockout' (siku tidak lurus penuh di atas < 160 derajat)", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPushupFrameDetailed(170, 0.5, 0.2, t));

    const angles = [150, 120, 95, 85, 95, 120, 150, 156];
    let time = 1600;
    for (const a of angles) {
      time += 200;
      counter.update(createPushupFrameDetailed(a, 0.5, 0.2, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("pushup-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "pushup-lockout");
    expect(issue?.cue).toContain("Luruskan lengan di atas");
  });

  // PUSHUP: pushup-depth aktif setelah perbaikan downThreshold = 120
  it("PUSHUP: melanggar cek 'pushup-depth' (kedalaman push-up siku > 100 derajat)", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPushupFrame(170, false, t));

    // Turun hanya sampai 115° (< 120 terhitung repetisi, namun > 100 sehingga melanggar kedalaman)
    const angles = [150, 130, 115, 125, 145, 160];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createPushupFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("pushup-depth");
    const issue = reps[0].issues.find(i => i.checkId === "pushup-depth");
    expect(issue?.cue).toContain("Turun lebih dalam, siku sekitar 90 derajat");
  });

  it("PUSHUP-FIX: repetisi push-up yang turun hanya sampai siku 115 derajat terhitung 1 repetisi DAN memicu 'pushup-depth'", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPushupFrame(170, false, t));

    const angles = [150, 130, 115, 125, 145, 160];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createPushupFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("pushup-depth");
  });

  // PLANK: Tahanan plank bersih
  it("PLANK: tahanan plank 10 detik bersih sempurna -> cleanHold = 10 detik, skor 100", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");
    let time = 0;
    for (let i = 0; i < 100; i++) {
      time += 100;
      counter.update(createPushupFrameDetailed(170, 0.5, 0.2, time));
    }

    const holdResult = counter.getHoldResult();
    expect(Math.round(holdResult.totalHoldMs / 1000)).toBe(10);
    expect(Math.round(holdResult.cleanHoldMs / 1000)).toBe(10);
    expect(holdResult.score).toBe(100);
  });

  // PLANK: Pelanggaran plank-hip-pike
  it("PLANK: melanggar cek 'plank-hip-pike' (pinggul terlalu naik)", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");
    let time = 0;
    for (let i = 0; i < 50; i++) {
      time += 100;
      counter.update(createPushupFrameDetailed(170, 0.38, 0.2, time));
    }

    const holdResult = counter.getHoldResult();
    expect(holdResult.cleanHoldMs).toBe(0);
    expect(holdResult.score).toBe(0);
  });

  // PLANK: Pelanggaran plank-elbow-alignment
  it("PLANK: melanggar cek 'plank-elbow-alignment' (siku tidak sejajar di bawah bahu)", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");
    let time = 0;
    for (let i = 0; i < 50; i++) {
      time += 100;
      // Siku di x=0.35 sementara bahu di x=0.2 (selisih 0.15 / 0.6 = 0.25 > 0.10)
      counter.update(createPushupFrameDetailed(170, 0.5, 0.35, time));
    }

    const holdResult = counter.getHoldResult();
    expect(holdResult.cleanHoldMs).toBe(0);
    expect(holdResult.score).toBe(0);
  });

  // SPLIT: Pelanggaran lunge-trunk
  it("SPLIT: melanggar cek 'lunge-trunk' (batang tubuh condong ke depan > 40 derajat di titik terendah)", () => {
    const counter = new RepCounter(SPLIT_RULESET, "bb-reverse-lunges");
    for (let t = 0; t <= 1500; t += 300) counter.update(createSplitFrame(170, 15, false, t));

    const angles = [155, 140, 125, 105, 95, 100, 125, 145, 162];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createSplitFrame(a, a <= 105 ? 50 : 20, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("lunge-trunk");
    const issue = reps[0].issues.find(i => i.checkId === "lunge-trunk");
    expect(issue?.cue).toContain("Jaga batang tubuh tetap tegak");
  });

  // SPLIT: Pelanggaran front-heel
  it("SPLIT: melanggar cek 'front-heel' (tumit depan terangkat >= 3 frame)", () => {
    const counter = new RepCounter(SPLIT_RULESET, "bb-reverse-lunges");
    for (let t = 100; t <= 1700; t += 300) counter.update(createSplitFrame(170, 15, false, t));

    const angles = [155, 140, 125, 105, 95, 100, 125, 145, 162];
    let time = 1800;
    for (const a of angles) {
      time += 150;
      counter.update(createSplitFrame(a, 20, true, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("front-heel");
    const issue = reps[0].issues.find(i => i.checkId === "front-heel");
    expect(issue?.cue).toContain("Tumit depan tetap menapak");
  });

  // Helper Deadlift Tambahan
  function createDeadliftFrameWithRise(
    hipX: number,
    hipY: number,
    shoulderX: number,
    shoulderY: number,
    kneeX: number,
    kneeY: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.95 }));
    landmarks[L_HIP] = { x: hipX, y: hipY, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = { x: shoulderX, y: shoulderY, z: 0, visibility: 0.95 };
    landmarks[L_KNEE] = { x: kneeX, y: kneeY, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.90, z: 0, visibility: 0.95 };
    return { landmarks, side: "left", timestampMs };
  }

  // HINGE: Pelanggaran hip-shoot
  it("HINGE: melanggar cek 'hip-shoot' (pinggul naik jauh lebih cepat daripada bahu saat naik)", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-deadlift");
    // Kalibrasi tegak
    for (let t = 100; t <= 1700; t += 300) counter.update(createDeadliftFrameWithRise(0.5, 0.50, 0.5, 0.20, 0.5, 0.70, t));

    let time = 1800;
    // Turun ke bottom (hip.y = 0.55, shoulder.y = 0.40 -> angle = 116.86° < 120°)
    counter.update(createDeadliftFrameWithRise(0.5, 0.50, 0.60, 0.30, 0.48, 0.72, (time += 250)));
    counter.update(createDeadliftFrameWithRise(0.45, 0.55, 0.65, 0.40, 0.48, 0.72, (time += 250)));
    counter.update(createDeadliftFrameWithRise(0.45, 0.55, 0.65, 0.40, 0.48, 0.72, (time += 250)));

    // Naik: pinggul naik cepat (hip.y = 0.40) sementara bahu relatif tertinggal (shoulder.y = 0.36) -> diffRatio > 0.10 selama 4 frame
    counter.update(createDeadliftFrameWithRise(0.46, 0.40, 0.50, 0.36, 0.48, 0.72, (time += 250)));
    counter.update(createDeadliftFrameWithRise(0.46, 0.40, 0.50, 0.36, 0.48, 0.72, (time += 250)));
    counter.update(createDeadliftFrameWithRise(0.46, 0.40, 0.50, 0.36, 0.48, 0.72, (time += 250)));
    counter.update(createDeadliftFrameWithRise(0.46, 0.40, 0.50, 0.36, 0.48, 0.72, (time += 250)));

    // Lockout tegak
    counter.update(createDeadliftFrameWithRise(0.5, 0.50, 0.5, 0.20, 0.5, 0.70, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("hip-shoot");
    const issue = reps[0].issues.find(i => i.checkId === "hip-shoot");
    expect(issue?.cue).toContain("Naikkan pinggul dan bahu bersamaan");
  });

  // HINGE: Pelanggaran hinge-not-squat pada bb-romanian-deadlift
  it("HINGE: bb-romanian-deadlift melanggar cek 'hinge-not-squat' (lutut terlalu menekuk < 135 derajat)", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHingeFrame(175, 165, t));

    // Lutut ditekuk ke 120° (< 135°) selama fase gerakan
    const hipAngles = [155, 135, 110, 110, 125, 140, 155, 168, 175];
    let time = 1600;
    for (const a of hipAngles) {
      time += 250;
      counter.update(createHingeFrame(a, 120, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("hinge-not-squat");
    const issue = reps[0].issues.find(i => i.checkId === "hinge-not-squat");
    expect(issue?.cue).toContain("Dorong pinggul ke belakang, lutut jangan menekuk");
  });

  // HINGE: Pelanggaran no-lean-back
  it("HINGE: melanggar cek 'no-lean-back' (bahu condong ke belakang di atas > 10 derajat)", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-deadlift");
    for (let t = 100; t <= 1700; t += 300) counter.update(createHingeFrame(175, 165, t));

    const hipAngles = [155, 135, 110, 110, 125, 140, 150, 155];
    let time = 1800;
    for (const a of hipAngles) {
      time += 250;
      counter.update(createHingeFrame(a, 165, time));
    }
    // Posisi atas: condong ke belakang (shoulder.x = 0.42 < hip.x - 0.04 & lean > 10)
    const leanFrame = createHingeFrame(175, 165, (time += 250));
    leanFrame.landmarks[L_SHOULDER] = { x: 0.42, y: 0.20, z: 0, visibility: 0.95 };
    counter.update(leanFrame);

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("no-lean-back");
    const issue = reps[0].issues.find(i => i.checkId === "no-lean-back");
    expect(issue?.cue).toContain("Jangan condong ke belakang di atas");
  });

  // BALLISTIC: Pelanggaran hip-lockout
  it("BALLISTIC: melanggar cek 'hip-lockout' (tidak lockout penuh di atas < 165 derajat)", () => {
    setBallisticFps(30);
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    // Puncak lockout hanya mencapai 161° (< 165°)
    const hipAngles = [155, 135, 110, 110, 135, 150, 158, 161];
    let time = 1600;
    for (const a of hipAngles) {
      time += 200;
      counter.update(createBallisticFrame(a, 0.30, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("hip-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "hip-lockout");
    expect(issue?.cue).toContain("Berdiri tegak penuh di atas");
  });

  // BALLISTIC: Pelanggaran no-lean-back
  it("BALLISTIC: melanggar cek 'no-lean-back' (condong ke belakang di puncak ayunan)", () => {
    setBallisticFps(30);
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    const hipAngles = [155, 135, 110, 110, 135, 150, 155];
    let time = 1600;
    for (const a of hipAngles) {
      time += 200;
      counter.update(createBallisticFrame(a, 0.30, time));
    }
    // Lockout frame condong ke belakang
    const topFrame = createBallisticFrame(175, 0.30, (time += 200));
    topFrame.landmarks[L_SHOULDER] = { x: 0.42, y: 0.20, z: 0, visibility: 0.95 };
    counter.update(topFrame);

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("no-lean-back");
    const issue = reps[0].issues.find(i => i.checkId === "no-lean-back");
    expect(issue?.cue).toContain("Jangan condong ke belakang di atas");
  });

  // BALLISTIC: Proteksi FPS rendah (< 24 FPS)
  it("BALLISTIC: kb-swing pada FPS < 24 tidak memicu koreksi meskipun ayunan tinggi (proteksi FPS rendah)", () => {
    setBallisticFps(15); // Paksa simulasi FPS rendah
    const counter = new RepCounter(HINGE_BALLISTIC_RULESET, "kb-swing");
    for (let t = 0; t <= 1500; t += 300) counter.update(createBallisticFrame(175, 0.35, t));

    let time = 1600;
    counter.update(createBallisticFrame(155, 0.35, (time += 200)));
    counter.update(createBallisticFrame(110, 0.45, (time += 200)));
    counter.update(createBallisticFrame(110, 0.45, (time += 200)));
    counter.update(createBallisticFrame(135, 0.35, (time += 200)));
    // Ayunan sangat tinggi (wrist.y = 0.10 < shoulder.y)
    counter.update(createBallisticFrame(140, 0.10, (time += 200)));
    counter.update(createBallisticFrame(150, 0.10, (time += 200)));
    counter.update(createBallisticFrame(155, 0.10, (time += 200)));
    counter.update(createBallisticFrame(175, 0.10, (time += 200)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // CALF: calf-rom aktif setelah perbaikan downThreshold = 165
  it("CALF: melanggar cek 'calf-rom' (elevasi tumit dangkal, minMetric > 158)", () => {
    const counter = new RepCounter(CALF_RULESET, "bw-calf-raise");
    for (let t = 100; t <= 1700; t += 300) counter.update(createCalfFrame(175, 0.90, t));

    // heelY 0.86 menghasilkan lift 0.04 -> metric 164 (< 165 downThreshold terhitung rep, namun > 158 cek calf-rom)
    counter.update(createCalfFrame(175, 0.86, 1800));
    counter.update(createCalfFrame(175, 0.865, 2150));
    counter.update(createCalfFrame(175, 0.875, 2450));
    counter.update(createCalfFrame(175, 0.90, 2750));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("calf-rom");
    const issue = reps[0].issues.find(i => i.checkId === "calf-rom");
    expect(issue?.cue).toContain("Naik setinggi mungkin, turun penuh");
  });

  it("CALF-FIX: repetisi jinjit dangkal (metric 164) terhitung 1 repetisi DAN memicu 'calf-rom'", () => {
    const counter = new RepCounter(CALF_RULESET, "bw-calf-raise");
    for (let t = 100; t <= 1700; t += 300) counter.update(createCalfFrame(175, 0.90, t));

    counter.update(createCalfFrame(175, 0.86, 1800));
    counter.update(createCalfFrame(175, 0.865, 2150));
    counter.update(createCalfFrame(175, 0.875, 2450));
    counter.update(createCalfFrame(175, 0.90, 2750));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("calf-rom");
  });

  // CALF: Pelanggaran no-bounce
  it("CALF: melanggar cek 'no-bounce' (jinjit terburu-buru tanpa jeda kontrol di atas < 300 ms)", () => {
    const counter = new RepCounter(CALF_RULESET, "bw-calf-raise");
    for (let t = 100; t <= 1700; t += 300) counter.update(createCalfFrame(175, 0.90, t));

    // Transisi naik sangat cepat: mulai di 1800 (0.88), mencapai puncak di 1950 (0.80) -> durasi 150 ms < 300 ms
    counter.update(createCalfFrame(175, 0.88, 1800));
    counter.update(createCalfFrame(175, 0.80, 1950));
    counter.update(createCalfFrame(175, 0.85, 2050));
    counter.update(createCalfFrame(175, 0.90, 2600));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("no-bounce");
    const issue = reps[0].issues.find(i => i.checkId === "no-bounce");
    expect(issue?.cue).toContain("Tahan sebentar di atas, jangan memantul");
  });

  // BRIDGE: Pelanggaran heel-press
  it("BRIDGE: melanggar cek 'heel-press' (tumit terangkat dari lantai saat mendorong pinggul)", () => {
    const counter = new RepCounter(BRIDGE_RULESET, "bw-glute-bridge");
    for (let t = 100; t <= 1700; t += 300) counter.update(createBridgeFrame(175, false, t));

    const angles = [155, 140, 130, 130, 140, 155, 170, 175];
    let time = 1800;
    for (const a of angles) {
      time += 150;
      // Tumit terangkat (heelLift = true)
      counter.update(createBridgeFrame(a, true, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("heel-press");
    const issue = reps[0].issues.find(i => i.checkId === "heel-press");
    expect(issue?.cue).toContain("Tekan tumit ke lantai");
  });

  // HANGING-CORE: Pelanggaran knee-raise-height
  it("HANGING-CORE: melanggar cek 'knee-raise-height' (lutut tidak mencapai ketinggian pinggul)", () => {
    const counter = new RepCounter(HANGING_CORE_RULESET, "bw-hanging-knees");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHangingFrame(175, 0.5, t));

    // Angkat lutut hanya mencapai 110° (> 95°), namun < downThreshold 130° sehingga repetisi dihitung
    const angles = [155, 135, 120, 110, 110, 120, 140, 165];
    let time = 1600;
    for (const a of angles) {
      time += 150;
      counter.update(createHangingFrame(a, 0.5, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("knee-raise-height");
    const issue = reps[0].issues.find(i => i.checkId === "knee-raise-height");
    expect(issue?.cue).toContain("Angkat lutut minimal setinggi pinggul");
  });

  // PRESS-VERTICAL: Pelanggaran ohp-lean-back
  it("PRESS-VERTICAL: melanggar cek 'ohp-lean-back' (batang tubuh melengkung ke belakang > 12 derajat)", () => {
    const counter = new RepCounter(PRESS_VERTICAL_RULESET, "bb-overhead-press");
    for (let t = 100; t <= 1700; t += 300) counter.update(createOhpFrame(175, 0, 0, t));

    // Melengkung ke belakang 18° (> 12°)
    let time = 1800;
    counter.update(createOhpFrame(150, 0, 18, (time += 250)));
    counter.update(createOhpFrame(120, 0, 18, (time += 250)));
    counter.update(createOhpFrame(85, 0, 18, (time += 250)));
    counter.update(createOhpFrame(80, 0, 18, (time += 250)));
    counter.update(createOhpFrame(120, 0, 18, (time += 250)));
    counter.update(createOhpFrame(150, 0, 18, (time += 250)));
    counter.update(createOhpFrame(175, 0, 18, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("ohp-lean-back");
    const issue = reps[0].issues.find(i => i.checkId === "ohp-lean-back");
    expect(issue?.cue).toContain("Jangan melengkung ke belakang");
  });

  // PRESS-VERTICAL: Pelanggaran press-lockout
  it("PRESS-VERTICAL: melanggar cek 'press-lockout' (siku tidak lurus penuh di atas < 160 derajat)", () => {
    const counter = new RepCounter(PRESS_VERTICAL_RULESET, "bb-overhead-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createOhpFrame(175, 0, 0, t));

    // Naik kembali hanya mencapai 156° (< 160°)
    const angles = [150, 120, 85, 80, 85, 120, 150, 156];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createOhpFrame(a, 0, 0, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("press-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "press-lockout");
    expect(issue?.cue).toContain("Luruskan siku di atas");
  });

  // ROW: Pelanggaran no-momentum
  it("ROW: melanggar cek 'no-momentum' (mengayunkan badan saat fase tarik dengan variasi > 10 derajat)", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    for (let t = 100; t <= 1700; t += 300) counter.update(createRowFrame(170, 45, t));

    let time = 1800;
    counter.update(createRowFrame(150, 45, (time += 200)));
    counter.update(createRowFrame(125, 45, (time += 200)));
    // Masuk descending (< 100°)
    counter.update(createRowFrame(95, 45, (time += 200)));
    // Fase descending: variasi sudut batang tubuh antara 40° dan 52° (selisih 12° > 10°, diff baseline 7° <= 15°)
    counter.update(createRowFrame(90, 40, (time += 200)));
    counter.update(createRowFrame(87, 52, (time += 200)));
    counter.update(createRowFrame(84, 52, (time += 200)));
    counter.update(createRowFrame(80, 52, (time += 200)));
    // Naik kembali
    counter.update(createRowFrame(85, 45, (time += 200)));
    counter.update(createRowFrame(125, 45, (time += 200)));
    counter.update(createRowFrame(150, 45, (time += 200)));
    counter.update(createRowFrame(170, 45, (time += 200)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("no-momentum");
    const issue = reps[0].issues.find(i => i.checkId === "no-momentum");
    expect(issue?.cue).toContain("Jangan mengayun, tarik dengan terkontrol");
  });

  // ROW: Pelanggaran row-elbow-back
  it("ROW: melanggar cek 'row-elbow-back' (siku tidak ditarik melewati garis badan ke belakang)", () => {
    const counter = new RepCounter(ROW_RULESET, "bb-bent-row");
    // Kalibrasi dan repetisi dengan siku selalu di depan badan (elbowPassedBack = false)
    for (let t = 100; t <= 1700; t += 300) counter.update(createRowFrame(170, 45, t, false));

    const angles = [150, 125, 95, 90, 85, 90, 95, 125, 150, 170];
    let time = 1800;
    for (const a of angles) {
      time += 200;
      counter.update(createRowFrame(a, 45, time, false));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("row-elbow-back");
    const issue = reps[0].issues.find(i => i.checkId === "row-elbow-back");
    expect(issue?.cue).toContain("Tarik siku ke belakang badan");
  });

  // PULL-VERTICAL: Pelanggaran pull-rom
  it("PULL-VERTICAL: melanggar cek 'pull-rom' (dagu tidak melewati palang di atas)", () => {
    const counter = new RepCounter(PULL_VERTICAL_RULESET, "bw-pullup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPullupFrame(170, 0, t));

    const angles = [150, 120, 85, 80, 85, 120, 150, 170];
    let time = 1600;
    for (const a of angles) {
      time += 350;
      const frame = createPullupFrame(a, 0, time);
      // Posisikan hidung di bawah palang (y=0.30 > wrist.y + 0.03)
      frame.landmarks[NOSE] = { x: 0.5, y: 0.30, z: 0, visibility: 0.95 };
      counter.update(frame);
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("pull-rom");
    const issue = reps[0].issues.find(i => i.checkId === "pull-rom");
    expect(issue?.cue).toContain("Turun penuh, naik sampai dagu di atas palang");
  });

  // PUSHUP-VARIANT: push-depth aktif setelah perbaikan downThreshold = 120
  it("PUSHUP-VARIANT: pike push-up melanggar 'push-depth' (kedalaman siku > 100 derajat)", () => {
    const counter = new RepCounter(PIKE_PUSHUP_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    // Turun hingga siku 115° (< 120 terhitung rep, namun > 100 sehingga melanggar kedalaman)
    const angles = [140, 115, 120, 130, 145, 160];
    let time = 1600;
    for (const a of angles) {
      time += 300;
      counter.update(createPikeFrame(a, 90, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("push-depth");
    const issue = reps[0].issues.find(i => i.checkId === "push-depth");
    expect(issue?.cue).toContain("Turun lebih dalam, siku sekitar 90 derajat");
  });

  it("PIKE-PUSHUP-FIX: repetisi pike push-up yang turun hanya sampai siku 115 derajat terhitung 1 repetisi DAN memicu 'push-depth'", () => {
    const counter = new RepCounter(PIKE_PUSHUP_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    const angles = [140, 115, 120, 130, 145, 160];
    let time = 1600;
    for (const a of angles) {
      time += 300;
      counter.update(createPikeFrame(a, 90, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("push-depth");
  });

  // PUSHUP-VARIANT: Pelanggaran press-lockout
  it("PUSHUP-VARIANT: pike push-up melanggar 'press-lockout' (siku tidak lurus penuh di atas < 160 derajat)", () => {
    const counter = new RepCounter(PIKE_PUSHUP_RULESET, "bw-pike-pushup");
    for (let t = 0; t <= 1500; t += 300) counter.update(createPikeFrame(170, 90, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 156];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createPikeFrame(a, 90, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("press-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "press-lockout");
    expect(issue?.cue).toContain("Luruskan siku di atas");
  });

  // DIP: Pelanggaran no-shrug
  it("DIP: melanggar cek 'no-shrug' (bahu terangkat/shrug ke arah telinga >= 3 frame)", () => {
    const counter = new RepCounter(DIP_RULESET, "bw-dips");
    for (let t = 0; t <= 1500; t += 300) counter.update(createDipFrame(170, false, t));

    let time = 1600;
    counter.update(createDipFrame(145, false, (time += 250)));
    counter.update(createDipFrame(120, false, (time += 250)));
    // 3 frame beruntun bahu shrug (shrink > 0.15)
    counter.update(createDipFrame(90, true, (time += 250)));
    counter.update(createDipFrame(85, true, (time += 250)));
    counter.update(createDipFrame(90, true, (time += 250)));
    counter.update(createDipFrame(120, false, (time += 250)));
    counter.update(createDipFrame(145, false, (time += 250)));
    counter.update(createDipFrame(170, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("no-shrug");
    const issue = reps[0].issues.find(i => i.checkId === "no-shrug");
    expect(issue?.cue).toContain("Turunkan bahu, jauh dari telinga");
  });

  // DIP: Pelanggaran press-lockout
  it("DIP: melanggar cek 'press-lockout' (siku tidak lurus penuh di atas < 160 derajat)", () => {
    const counter = new RepCounter(DIP_RULESET, "bw-dips");
    for (let t = 0; t <= 1500; t += 300) counter.update(createDipFrame(170, false, t));

    const angles = [145, 120, 90, 85, 90, 120, 145, 156];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createDipFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("press-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "press-lockout");
    expect(issue?.cue).toContain("Luruskan siku di atas");
  });

  // PRESS-HORIZONTAL: Pelanggaran press-lockout
  it("PRESS-HORIZONTAL: melanggar cek 'press-lockout' (siku tidak lurus penuh di atas < 160 derajat)", () => {
    const counter = new RepCounter(PRESS_HORIZONTAL_RULESET, "bb-bench-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHorizontalPressFrame(170, false, t));

    const angles = [150, 120, 90, 85, 90, 120, 150, 156];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createHorizontalPressFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("press-lockout");
    const issue = reps[0].issues.find(i => i.checkId === "press-lockout");
    expect(issue?.cue).toContain("Luruskan siku di atas");
  });

  // PRESS-HORIZONTAL: Pelanggaran butt-lift
  it("PRESS-HORIZONTAL: melanggar cek 'butt-lift' (pantat terangkat dari bench >= 3 frame)", () => {
    const counter = new RepCounter(PRESS_HORIZONTAL_RULESET, "bb-bench-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createHorizontalPressFrame(170, false, t));

    let time = 1600;
    counter.update(createHorizontalPressFrame(150, false, (time += 250)));
    counter.update(createHorizontalPressFrame(120, false, (time += 250)));
    // 3 frame beruntun pantat terangkat (buttLift = true)
    counter.update(createHorizontalPressFrame(90, true, (time += 250)));
    counter.update(createHorizontalPressFrame(85, true, (time += 250)));
    counter.update(createHorizontalPressFrame(90, true, (time += 250)));
    counter.update(createHorizontalPressFrame(120, false, (time += 250)));
    counter.update(createHorizontalPressFrame(150, false, (time += 250)));
    counter.update(createHorizontalPressFrame(170, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("butt-lift");
    const issue = reps[0].issues.find(i => i.checkId === "butt-lift");
    expect(issue?.cue).toContain("Pantat tetap menempel bench");
  });

  // =========================================================================
  // FASE 6c-fix: TES UNTUK RULESET TAMBAHAN (CURL, RAISE, TRICEPS, PRONE, CARRY, KB-OTHER, SQUAT-OVERHEAD)
  // =========================================================================

  function createCurlFrame(
    elbowAngleDeg: number,
    elbowMovedForward: boolean,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    landmarks[L_SHOULDER] = { x: 0.5, y: 0.25, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: 0.55, z: 0, visibility: 0.95 };
    const elbowX = elbowMovedForward ? 0.44 : 0.5;
    landmarks[L_ELBOW] = { x: elbowX, y: 0.40, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: elbowX + 0.15 * Math.sin(Math.PI - rad),
      y: 0.40 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // CURL: 1 sekuens lolos-bersih
  it("CURL: 1 repetisi bersih sempurna -> score 100 tanpa issue", () => {
    const counter = new RepCounter(CURL_RULESET, "db-bicep-curl");
    for (let t = 0; t <= 1500; t += 300) counter.update(createCurlFrame(160, false, t));

    const angles = [140, 110, 85, 80, 85, 110, 140, 160];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createCurlFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // CURL: 1 sekuens melanggar tepat 1 cek (elbow-fixed)
  it("CURL: melanggar cek 'elbow-fixed' (siku bergerak maju >= 3 frame)", () => {
    const counter = new RepCounter(CURL_RULESET, "db-bicep-curl");
    for (let t = 0; t <= 1500; t += 300) counter.update(createCurlFrame(160, false, t));

    let time = 1600;
    counter.update(createCurlFrame(140, false, (time += 250)));
    counter.update(createCurlFrame(110, false, (time += 250)));
    counter.update(createCurlFrame(85, true, (time += 250)));
    counter.update(createCurlFrame(80, true, (time += 250)));
    counter.update(createCurlFrame(75, true, (time += 250)));
    counter.update(createCurlFrame(80, true, (time += 250)));
    counter.update(createCurlFrame(110, false, (time += 250)));
    counter.update(createCurlFrame(140, false, (time += 250)));
    counter.update(createCurlFrame(160, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("elbow-fixed");
    const issue = reps[0].issues.find(i => i.checkId === "elbow-fixed");
    expect(issue?.cue).toContain("Jaga siku tetap di samping badan");
  });

  function createRaiseFrame(
    armElevationDeg: number,
    wristAboveShoulder: boolean,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    landmarks[L_SHOULDER] = { x: 0.5, y: 0.30, z: 0, visibility: 0.95 };
    landmarks[R_SHOULDER] = { x: 0.5, y: 0.30, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.5, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[R_HIP] = { x: 0.5, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.4, y: 0.40, z: 0, visibility: 0.95 };
    landmarks[R_ELBOW] = { x: 0.6, y: 0.40, z: 0, visibility: 0.95 };
    const rad = (armElevationDeg * Math.PI) / 180;
    const wristY = wristAboveShoulder ? 0.15 : 0.30 + 0.30 * Math.cos(rad);
    const wristX = 0.5 - 0.30 * Math.sin(rad);
    landmarks[L_WRIST] = { x: wristX, y: wristY, z: 0, visibility: 0.95 };
    landmarks[R_WRIST] = { x: 1 - wristX, y: wristY, z: 0, visibility: 0.95 };
    return { landmarks, side: "left", timestampMs };
  }

  // RAISE: 1 sekuens lolos-bersih
  it("RAISE: 1 repetisi lateral raise bersih sempurna -> score 100 tanpa issue", () => {
    const counter = new RepCounter(RAISE_RULESET, "db-lateral-raise");
    for (let t = 0; t <= 1500; t += 300) counter.update(createRaiseFrame(10, false, t));

    const angles = [30, 60, 85, 90, 85, 60, 30, 10];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createRaiseFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // RAISE: 1 sekuens melanggar tepat 1 cek (raise-height)
  it("RAISE: melanggar cek 'raise-height' (pergelangan tangan melewati bahu >= 3 frame)", () => {
    const counter = new RepCounter(RAISE_RULESET, "db-lateral-raise");
    for (let t = 0; t <= 1500; t += 300) counter.update(createRaiseFrame(10, false, t));

    let time = 1600;
    counter.update(createRaiseFrame(30, false, (time += 250)));
    counter.update(createRaiseFrame(60, false, (time += 250)));
    counter.update(createRaiseFrame(85, true, (time += 250)));
    counter.update(createRaiseFrame(90, true, (time += 250)));
    counter.update(createRaiseFrame(85, true, (time += 250)));
    counter.update(createRaiseFrame(60, false, (time += 250)));
    counter.update(createRaiseFrame(30, false, (time += 250)));
    counter.update(createRaiseFrame(10, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("raise-height");
    const issue = reps[0].issues.find(i => i.checkId === "raise-height");
    expect(issue?.cue).toContain("Angkat beban tidak melebihi bahu");
  });

  function createTricepsFrame(
    elbowAngleDeg: number,
    armLeaned: boolean,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    landmarks[L_SHOULDER] = { x: 0.5, y: 0.50, z: 0, visibility: 0.95 };
    const elbowX = armLeaned ? 0.35 : 0.5;
    landmarks[L_ELBOW] = { x: elbowX, y: 0.30, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: elbowX + 0.20 * Math.sin(Math.PI - rad),
      y: 0.30 - 0.20 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // TRICEPS-EXT: 1 sekuens lolos-bersih
  it("TRICEPS-EXT: 1 repetisi skull crusher bersih sempurna -> 1 repetisi tanpa issue", () => {
    const counter = new RepCounter(TRICEPS_EXT_RULESET, "bb-skull-crusher");
    for (let t = 0; t <= 1500; t += 300) counter.update(createTricepsFrame(160, false, t));

    const angles = [140, 110, 85, 80, 85, 110, 140, 160];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createTricepsFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
  });

  // TRICEPS-EXT: 1 sekuens melanggar tepat 1 cek (upper-arm-fixed)
  it("TRICEPS-EXT: melanggar cek 'upper-arm-fixed' (lengan atas berayun > 25 derajat >= 3 frame)", () => {
    const counter = new RepCounter(TRICEPS_EXT_RULESET, "bb-skull-crusher");
    for (let t = 0; t <= 1500; t += 300) counter.update(createTricepsFrame(160, false, t));

    let time = 1600;
    counter.update(createTricepsFrame(140, false, (time += 250)));
    counter.update(createTricepsFrame(110, false, (time += 250)));
    counter.update(createTricepsFrame(85, true, (time += 250)));
    counter.update(createTricepsFrame(80, true, (time += 250)));
    counter.update(createTricepsFrame(75, true, (time += 250)));
    counter.update(createTricepsFrame(80, true, (time += 250)));
    counter.update(createTricepsFrame(110, false, (time += 250)));
    counter.update(createTricepsFrame(140, false, (time += 250)));
    counter.update(createTricepsFrame(160, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("upper-arm-fixed");
    const issue = reps[0].issues.find(i => i.checkId === "upper-arm-fixed");
    expect(issue?.cue).toContain("Jaga posisi lengan atas stabil");
  });

  function createProneFrame(neckAngleDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    landmarks[L_SHOULDER] = { x: 0.40, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[R_SHOULDER] = { x: 0.40, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = { x: 0.65, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[R_HIP] = { x: 0.65, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[L_ANKLE] = { x: 0.85, y: 0.55, z: 0, visibility: 0.95 };
    landmarks[R_ANKLE] = { x: 0.85, y: 0.55, z: 0, visibility: 0.95 };
    const rad = (neckAngleDeg * Math.PI) / 180;
    landmarks[NOSE] = {
      x: 0.40 - 0.15 * Math.cos(Math.PI - rad),
      y: 0.60 - 0.15 * Math.sin(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // PRONE-EXTENSION: 1 sekuens tahanan bersih
  it("PRONE-EXTENSION: tahanan sky divers 5 detik bersih sempurna -> cleanHold = 5 detik, score 100", () => {
    const counter = new RepCounter(PRONE_EXTENSION_RULESET, "bw-sky-divers");
    let time = 0;
    for (let i = 0; i < 50; i++) {
      time += 100;
      counter.update(createProneFrame(160, time));
    }

    const holdResult = counter.getHoldResult();
    expect(Math.round(holdResult.totalHoldMs / 1000)).toBe(5);
    expect(Math.round(holdResult.cleanHoldMs / 1000)).toBe(5);
    expect(holdResult.score).toBe(100);
    expect(holdResult.issues.length).toBe(0);
  });

  // PRONE-EXTENSION: 1 sekuens melanggar tepat 1 cek (neck-neutral)
  it("PRONE-EXTENSION: melanggar cek 'neck-neutral' (leher hiperekstensi < 135 derajat)", () => {
    const counter = new RepCounter(PRONE_EXTENSION_RULESET, "bw-sky-divers");
    let time = 0;
    for (let i = 0; i < 20; i++) {
      time += 100;
      counter.update(createProneFrame(160, time));
    }
    // Pelanggaran leher selama 10 frame (1 detik)
    for (let i = 0; i < 10; i++) {
      time += 100;
      counter.update(createProneFrame(110, time));
    }
    for (let i = 0; i < 20; i++) {
      time += 100;
      counter.update(createProneFrame(160, time));
    }

    const holdResult = counter.getHoldResult();
    expect(Math.round(holdResult.totalHoldMs / 1000)).toBe(5);
    expect(holdResult.cleanHoldMs).toBeLessThan(5000);
    expect(holdResult.issues.map(i => i.checkId)).toContain("neck-neutral");
    const issue = holdResult.issues.find(i => i.checkId === "neck-neutral");
    expect(issue?.cue).toContain("Jaga leher sejajar tulang punggung");
  });

  function createCarryFrame(trunkLeanDeg: number, timestampMs: number): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    const rad = (trunkLeanDeg * Math.PI) / 180;
    landmarks[L_HIP] = { x: 0.5, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[R_HIP] = { x: 0.5, y: 0.60, z: 0, visibility: 0.95 };
    landmarks[L_SHOULDER] = {
      x: 0.5 - 0.35 * Math.sin(rad),
      y: 0.60 - 0.35 * Math.cos(rad),
      z: 0,
      visibility: 0.95,
    };
    landmarks[R_SHOULDER] = { ...landmarks[L_SHOULDER] };
    landmarks[L_ANKLE] = { x: 0.5, y: 0.90, z: 0, visibility: 0.95 };
    landmarks[R_ANKLE] = { x: 0.5, y: 0.90, z: 0, visibility: 0.95 };
    return { landmarks, side: "left", timestampMs };
  }

  // CARRY: 1 sekuens tahanan bersih
  it("CARRY: tahanan carry 5 detik postur tegak sempurna -> cleanHold = 5 detik, score 100", () => {
    const counter = new RepCounter(CARRY_RULESET, "plate-pinch-carry");
    let time = 0;
    for (let i = 0; i < 50; i++) {
      time += 100;
      counter.update(createCarryFrame(5, time));
    }

    const holdResult = counter.getHoldResult();
    expect(Math.round(holdResult.totalHoldMs / 1000)).toBe(5);
    expect(Math.round(holdResult.cleanHoldMs / 1000)).toBe(5);
    expect(holdResult.score).toBe(100);
    expect(holdResult.issues.length).toBe(0);
  });

  // CARRY: 1 sekuens melanggar tepat 1 cek (trunk-erect)
  it("CARRY: melanggar cek 'trunk-erect' (badan condong > 15 derajat >= 3 frame)", () => {
    const counter = new RepCounter(CARRY_RULESET, "plate-pinch-carry");
    let time = 0;
    for (let i = 0; i < 20; i++) {
      time += 100;
      counter.update(createCarryFrame(5, time));
    }
    // Badan condong 25° selama 10 frame
    for (let i = 0; i < 10; i++) {
      time += 100;
      counter.update(createCarryFrame(25, time));
    }
    for (let i = 0; i < 20; i++) {
      time += 100;
      counter.update(createCarryFrame(5, time));
    }

    const holdResult = counter.getHoldResult();
    expect(Math.round(holdResult.totalHoldMs / 1000)).toBe(5);
    expect(holdResult.cleanHoldMs).toBeLessThan(5000);
    expect(holdResult.issues.map(i => i.checkId)).toContain("trunk-erect");
    const issue = holdResult.issues.find(i => i.checkId === "trunk-erect");
    expect(issue?.cue).toContain("Jaga tubuh tegak saat melangkah");
  });

  function createKbOtherFrame(
    elbowAngleDeg: number,
    headOffsetX: number,
    timestampMs: number
  ): PoseFrame {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    landmarks[L_SHOULDER] = { x: 0.45, y: 0.35, z: 0, visibility: 0.95 };
    landmarks[R_SHOULDER] = { x: 0.55, y: 0.35, z: 0, visibility: 0.95 };
    landmarks[NOSE] = { x: 0.5 + headOffsetX, y: 0.20, z: 0, visibility: 0.95 };
    landmarks[L_ELBOW] = { x: 0.45, y: 0.50, z: 0, visibility: 0.95 };
    const rad = (elbowAngleDeg * Math.PI) / 180;
    landmarks[L_WRIST] = {
      x: 0.45 + 0.15 * Math.sin(Math.PI - rad),
      y: 0.50 + 0.15 * Math.cos(Math.PI - rad),
      z: 0,
      visibility: 0.95,
    };
    return { landmarks, side: "left", timestampMs };
  }

  // KETTLEBELL-OTHER: 1 sekuens lolos-bersih
  it("KETTLEBELL-OTHER: 1 repetisi press bersih sempurna -> score 100 tanpa issue", () => {
    const counter = new RepCounter(KETTLEBELL_OTHER_RULESET, "kb-clean-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createKbOtherFrame(160, 0, t));

    const angles = [140, 110, 90, 85, 90, 110, 140, 160];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createKbOtherFrame(a, 0, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // KETTLEBELL-OTHER: 1 sekuens melanggar tepat 1 cek (head-still)
  it("KETTLEBELL-OTHER: melanggar cek 'head-still' (kepala bergoyang miring > 0.08 >= 3 frame)", () => {
    const counter = new RepCounter(KETTLEBELL_OTHER_RULESET, "kb-clean-press");
    for (let t = 0; t <= 1500; t += 300) counter.update(createKbOtherFrame(160, 0, t));

    let time = 1600;
    counter.update(createKbOtherFrame(140, 0, (time += 250)));
    counter.update(createKbOtherFrame(110, 0, (time += 250)));
    counter.update(createKbOtherFrame(90, 0.12, (time += 250)));
    counter.update(createKbOtherFrame(85, 0.12, (time += 250)));
    counter.update(createKbOtherFrame(90, 0.12, (time += 250)));
    counter.update(createKbOtherFrame(110, 0, (time += 250)));
    counter.update(createKbOtherFrame(140, 0, (time += 250)));
    counter.update(createKbOtherFrame(160, 0, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("head-still");
    const issue = reps[0].issues.find(i => i.checkId === "head-still");
    expect(issue?.cue).toContain("Jaga kepala tetap tegak diam");
  });

  function createOverheadSquatFrame(
    kneeAngleDeg: number,
    armDropped: boolean,
    timestampMs: number
  ): PoseFrame {
    const frame = createSquatFrame(kneeAngleDeg, timestampMs);
    const shoulder = frame.landmarks[L_SHOULDER];
    if (armDropped) {
      frame.landmarks[L_WRIST] = {
        x: shoulder.x + 0.20,
        y: shoulder.y + 0.05,
        z: 0,
        visibility: 0.95,
      };
    } else {
      frame.landmarks[L_WRIST] = {
        x: shoulder.x,
        y: shoulder.y - 0.25,
        z: 0,
        visibility: 0.95,
      };
    }
    return frame;
  }

  // SQUAT-OVERHEAD: 1 sekuens lolos-bersih
  it("SQUAT-OVERHEAD: 1 repetisi overhead squat bersih sempurna -> score 100 tanpa issue", () => {
    const counter = new RepCounter(SQUAT_OVERHEAD_RULESET, "plate-overhead-squat");
    for (let t = 0; t <= 1500; t += 300) counter.update(createOverheadSquatFrame(170, false, t));

    const angles = [155, 140, 110, 95, 110, 140, 155, 170];
    let time = 1600;
    for (const a of angles) {
      time += 250;
      counter.update(createOverheadSquatFrame(a, false, time));
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.length).toBe(0);
    expect(reps[0].score).toBe(100);
  });

  // SQUAT-OVERHEAD: 1 sekuens melanggar tepat 1 cek (overhead-arms)
  it("SQUAT-OVERHEAD: melanggar cek 'overhead-arms' (lengan jatuh ke depan >= 3 frame)", () => {
    const counter = new RepCounter(SQUAT_OVERHEAD_RULESET, "plate-overhead-squat");
    for (let t = 0; t <= 1500; t += 300) counter.update(createOverheadSquatFrame(170, false, t));

    let time = 1600;
    counter.update(createOverheadSquatFrame(155, false, (time += 250)));
    counter.update(createOverheadSquatFrame(140, false, (time += 250)));
    counter.update(createOverheadSquatFrame(110, true, (time += 250)));
    counter.update(createOverheadSquatFrame(95, true, (time += 250)));
    counter.update(createOverheadSquatFrame(110, true, (time += 250)));
    counter.update(createOverheadSquatFrame(140, false, (time += 250)));
    counter.update(createOverheadSquatFrame(155, false, (time += 250)));
    counter.update(createOverheadSquatFrame(170, false, (time += 250)));

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map(i => i.checkId)).toContain("overhead-arms");
    const issue = reps[0].issues.find(i => i.checkId === "overhead-arms");
    expect(issue?.cue).toContain("Jaga lengan tetap di atas kepala");
  });

  // ROTATION & GROUND-TO-OVERHEAD: Sederhanakan ke mode hitung saja (Tier C)
  it("ROTATION & GROUND-TO-OVERHEAD: disederhanakan ke mode hitung saja (Tier C, scored false, banner peringatan)", () => {
    expect(ROTATION_RULESET.tier).toBe("C");
    expect(ROTATION_RULESET.scored).toBe(false);
    expect(ROTATION_RULESET.banner).toBe("Akurasi terbatas untuk gerakan ini");
    expect(ROTATION_RULESET.checks.length).toBe(0);

    expect(GROUND_TO_OVERHEAD_RULESET.tier).toBe("C");
    expect(GROUND_TO_OVERHEAD_RULESET.scored).toBe(false);
    expect(GROUND_TO_OVERHEAD_RULESET.banner).toBe("Akurasi terbatas untuk gerakan ini");
    expect(GROUND_TO_OVERHEAD_RULESET.checks.length).toBe(0);
  });

  // =========================================================================
  // TES KHUSUS INTEGRASI & NEGATIF TAMBAHAN
  // =========================================================================

  it("Seluruh RuleSet Form Coach TIDAK memiliki cek dengan id 'knee-over-toes' atau 'back-round'", () => {
    for (const rs of ALL_RULESETS) {
      for (const check of rs.checks) {
        expect(check.id).not.toContain("knee-over-toes");
        expect(check.id).not.toContain("back-round");
      }
    }
  });

  it("Integritas Form Coach: seluruh 42 exercise memiliki formCoach valid, ruleSetId terdaftar di config.ts, dan view in {'side', 'front'}", () => {
    const validRuleSetIds = new Set(ALL_RULESETS.map((r) => r.id));
    const exercisesWithCoach = EXERCISES_DATABASE.filter((ex) => ex.formCoach);

    // (a) setiap exercise dengan formCoach merujuk ruleSetId yang ada di config.ts
    for (const ex of exercisesWithCoach) {
      expect(validRuleSetIds.has(ex.formCoach!.ruleSetId)).toBe(true);
      // (b) setiap formCoach.view in {"side", "front"}
      expect(["side", "front"]).toContain(ex.formCoach!.view);
    }

    // (c) jumlah exercise dengan formCoach adalah tepat 42 (tanpa ada yang dikecualikan)
    expect(exercisesWithCoach.length).toBe(42);
    expect(EXERCISES_DATABASE.length).toBe(42);
  });
});
