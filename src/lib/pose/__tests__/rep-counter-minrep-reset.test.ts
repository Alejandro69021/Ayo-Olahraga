import { describe, it, expect } from "vitest";
import { RepCounter } from "../rep-counter";
import { HINGE_RULESET, HINGE_NOT_SQUAT_CHECK } from "../rules/config";
import { PoseFrame, RepContext } from "../rules/types";
import {
  Landmark,
  L_SHOULDER,
  L_HIP,
  L_KNEE,
  L_ANKLE,
  R_SHOULDER,
  R_HIP,
  R_KNEE,
  R_ANKLE,
} from "../landmarks";

const TORSO_LEN = 0.28;
const THIGH_LEN = 0.25;
const SHIN_LEN = 0.22;

function createHingePose(
  hipAngleDeg: number,
  timestampMs: number,
  kneeAngleDeg = 170
): PoseFrame {
  const hipX = 0.5;
  const hipY = 0.48;
  const kneeX = hipX;
  const kneeY = hipY + THIGH_LEN;

  // Putar tulang kering dari vektor ke atas agar sudut lutut sesuai kneeAngleDeg
  const kneeRad = (kneeAngleDeg * Math.PI) / 180;
  const ankleX = kneeX + SHIN_LEN * Math.sin(Math.PI - kneeRad);
  const ankleY = kneeY + SHIN_LEN * Math.cos(Math.PI - kneeRad);

  // Vektor hip->knee mengarah ke bawah (0, +1); sudut hipAngleDeg terhadap bahu (ke kanan untuk maju)
  const rad = (hipAngleDeg * Math.PI) / 180;
  const shoulderX = hipX + TORSO_LEN * Math.sin(rad);
  const shoulderY = hipY + TORSO_LEN * Math.cos(rad);

  const lms: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  const sh: Landmark = { x: shoulderX, y: shoulderY, z: 0, visibility: 0.95 };
  const hip: Landmark = { x: hipX, y: hipY, z: 0, visibility: 0.95 };
  const kn: Landmark = { x: kneeX, y: kneeY, z: 0, visibility: 0.95 };
  const an: Landmark = { x: ankleX, y: ankleY, z: 0, visibility: 0.95 };

  lms[L_SHOULDER] = sh;
  lms[R_SHOULDER] = { ...sh };
  lms[L_HIP] = hip;
  lms[R_HIP] = { ...hip };
  lms[L_KNEE] = kn;
  lms[R_KNEE] = { ...kn };
  lms[L_ANKLE] = an;
  lms[R_ANKLE] = { ...an };

  return {
    landmarks: lms,
    rawLandmarks: lms,
    timestampMs,
    side: "left",
  };
}

describe("minRepMs dari posisi atas dan reset state global di RepCounter", () => {
  it("2a. RDL dangkal: durasi di bawah downThreshold 700 ms tetapi 3000 ms sejak meninggalkan upThreshold -> terhitung", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    let t = 1000;

    // Kalibrasi berdiri >= 1500 ms pada sudut >= upThreshold (160°)
    for (let i = 0; i < 40; i++) {
      counter.update(createHingePose(175, t));
      t += 50;
    }

    // Frame terakhir >= upThreshold (t = 3000)
    counter.update(createHingePose(170, t));
    const lastTopMs = t;

    // Turun lambat di zona antara upThreshold (160°) dan downThreshold (120°) selama 2300 ms
    for (let ms = 100; ms <= 2300; ms += 100) {
      t = lastTopMs + ms;
      const angle = 155 - (ms / 2300) * 32; // 155° -> 123° (selalu >= 120° dan < 160°)
      counter.update(createHingePose(angle, t));
    }

    // Masuk di bawah downThreshold (< 120°) dan naik kembali >= upThreshold hanya dalam 700 ms (< minRepMs 1000 ms)
    counter.update(createHingePose(118, lastTopMs + 2400)); // masuk descending: repStartTimeMs = lastTopMs + 2400
    counter.update(createHingePose(115, lastTopMs + 2550));
    counter.update(createHingePose(125, lastTopMs + 2700)); // masuk bottom -> ascending
    counter.update(createHingePose(145, lastTopMs + 2850));
    const endUpdate = counter.update(createHingePose(165, lastTopMs + 3100)); // 700 ms di bawah downThreshold, 3100 ms sejak puncak

    expect(endUpdate.repsCount).toBe(1);
    expect(counter.getCompletedReps()).toHaveLength(1);
  });

  it("2b. Dip jitter: turun < downThreshold dan kembali dalam 150 ms, total sejak puncak < minRepMs -> tidak terhitung", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    let t = 1000;

    // Kalibrasi berdiri >= 1500 ms pada 175° (>= upThreshold 160°)
    for (let i = 0; i < 40; i++) {
      counter.update(createHingePose(175, t));
      t += 50;
    }

    // Puncak terakhir tepat sebelum jitter pada t = 3000
    counter.update(createHingePose(172, t));
    const lastTopMs = t;

    // Jitter cepat < downThreshold lalu balik ke >= upThreshold hanya dalam 150 ms (total sejak puncak 200 ms < 1000 ms)
    counter.update(createHingePose(115, lastTopMs + 50));
    counter.update(createHingePose(112, lastTopMs + 100));
    counter.update(createHingePose(140, lastTopMs + 150));
    const endUpdate = counter.update(createHingePose(170, lastTopMs + 200));

    expect(endUpdate.repsCount).toBe(0);
    expect(counter.getCompletedReps()).toHaveLength(0);
  });

  it("4. RepCounter.reset() (dan konstruktor) mengosongkan streak pelanggaran sebelumnya", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    const violatingFrame = createHingePose(115, 2000, 100); // knee 100° < 135°
    const ctx: RepContext = {
      bodyHeight: 0.7,
      torsoLength: 0.28,
      heelYBaseline: 0.95,
      isCalibrated: true,
      calibrationProgress: 1,
      currentPhase: "descending",
      repStartTimeMs: 1000,
      descentDurationMs: 0,
      minMetricValue: 115,
      maxMetricValue: 170,
      repIndex: 0,
      exerciseId: "bb-romanian-deadlift",
    };

    // Isi streak 2 frame berturut-turut (< 3 sehingga belum trigger cue, tetapi streak tersimpan = 2)
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);

    // Setelah reset(), streak harus kembali 0 -> 2 frame berikutnya tidak langsung trigger di frame ke-1
    counter.reset();
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);
    // Frame ke-3 baru memicu
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(false);

    // Uji konstruktor juga mengosongkan streak yang sedang penuh/sebagian
    new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(true);
    expect(HINGE_NOT_SQUAT_CHECK.evaluate(violatingFrame, ctx).ok).toBe(false);
  });
});
