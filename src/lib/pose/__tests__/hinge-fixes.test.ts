import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter } from "../rep-counter";
import {
  HINGE_RULESET,
  HINGE_NOT_SQUAT_CHECK,
  resetViolationStreaks,
} from "../rules/config";
import { angleAt, angleAt2D } from "../geometry";
import { LandmarkSmoother } from "../smoothing";
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

const FRAME_MS = 40; // ~25 fps
const TORSO_LEN = 0.28;
const THIGH_LEN = 0.25;
const SHIN_LEN = 0.22;

/**
 * Membangun pose tampak samping untuk gerakan hinge.
 * trunkAngleFromUpDeg: > 0 berarti condong ke depan sesuai arah `facing`,
 * < 0 berarti condong ke belakang berlawanan dengan `facing`.
 */
function createSideHingePose(options: {
  trunkAngleFromUpDeg: number;
  facing: "right" | "left";
  kneeAngle2DDeg?: number;
  kneeZ?: number;
  shoulderZ?: number;
  timestampMs: number;
  rawOverride?: Partial<{
    trunkAngleFromUpDeg: number;
  }>;
}): PoseFrame {
  const dir = options.facing === "right" ? 1 : -1;
  const kneeAngleDeg = options.kneeAngle2DDeg ?? 172;
  const hipX = 0.5;
  const hipY = 0.48;

  // Tempatkan knee di bawah hip (sedikit mengarah ke depan agar sudut lutut realistis)
  const kneeX = hipX + dir * 0.02;
  const kneeY = hipY + THIGH_LEN;

  // Hitung posisi ankle dari knee berdasarkan sudut lutut 2D (hip-knee-ankle)
  const ux = (hipX - kneeX) / Math.hypot(hipX - kneeX, hipY - kneeY);
  const uy = (hipY - kneeY) / Math.hypot(hipX - kneeX, hipY - kneeY);
  const rotRad = (dir * kneeAngleDeg * Math.PI) / 180;
  const cosR = Math.cos(rotRad);
  const sinR = Math.sin(rotRad);
  const axDir = ux * cosR - uy * sinR;
  const ayDir = ux * sinR + uy * cosR;
  const ankleX = kneeX + SHIN_LEN * axDir;
  const ankleY = kneeY + SHIN_LEN * ayDir;

  const makeShoulder = (trunkDeg: number) => {
    const rad = (trunkDeg * Math.PI) / 180;
    return {
      x: hipX + dir * TORSO_LEN * Math.sin(rad),
      y: hipY - TORSO_LEN * Math.cos(rad),
    };
  };

  const buildLandmarks = (trunkDeg: number): Landmark[] => {
    const sh = makeShoulder(trunkDeg);
    const lms: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    const shoulderLm: Landmark = {
      x: sh.x,
      y: sh.y,
      z: options.shoulderZ ?? 0,
      visibility: 0.95,
    };
    const hipLm: Landmark = { x: hipX, y: hipY, z: 0, visibility: 0.95 };
    const kneeLm: Landmark = {
      x: kneeX,
      y: kneeY,
      z: options.kneeZ ?? 0,
      visibility: 0.95,
    };
    const ankleLm: Landmark = { x: ankleX, y: ankleY, z: 0, visibility: 0.95 };

    lms[L_SHOULDER] = shoulderLm;
    lms[R_SHOULDER] = { ...shoulderLm };
    lms[L_HIP] = hipLm;
    lms[R_HIP] = { ...hipLm };
    lms[L_KNEE] = kneeLm;
    lms[R_KNEE] = { ...kneeLm };
    lms[L_ANKLE] = ankleLm;
    lms[R_ANKLE] = { ...ankleLm };
    return lms;
  };

  const landmarks = buildLandmarks(options.trunkAngleFromUpDeg);
  const frame: PoseFrame = {
    landmarks,
    timestampMs: options.timestampMs,
    side: "left",
  };
  if (options.rawOverride?.trunkAngleFromUpDeg !== undefined) {
    frame.rawLandmarks = buildLandmarks(options.rawOverride.trunkAngleFromUpDeg);
  } else {
    frame.rawLandmarks = landmarks;
  }
  return frame;
}

function calibrateCounter(
  counter: RepCounter,
  startMs: number,
  facing: "right" | "left",
  opts?: { kneeZ?: number; shoulderZ?: number; kneeAngle2DDeg?: number }
): number {
  let t = startMs;
  for (let i = 0; i < 45; i++) {
    counter.update(
      createSideHingePose({
        trunkAngleFromUpDeg: 5,
        facing,
        kneeZ: opts?.kneeZ,
        shoulderZ: opts?.shoulderZ,
        kneeAngle2DDeg: opts?.kneeAngle2DDeg,
        timestampMs: t,
      })
    );
    t += FRAME_MS;
  }
  return t;
}

describe("Perbaikan HINGE_RULESET (2D dan no-lean-back agnostik arah)", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });

  it("23. z besar (offset 0.3 pada lutut dan bahu): 1 rep hinge penuh terhitung tanpa false positive", () => {
    const counter = new RepCounter(HINGE_RULESET, "bb-romanian-deadlift");
    const smoother = new LandmarkSmoother(0.25);
    let t = 1000;

    for (let i = 0; i < 45; i++) {
      const raw = createSideHingePose({
        trunkAngleFromUpDeg: 4,
        facing: "right",
        kneeZ: 0.3,
        shoulderZ: 0.3,
        kneeAngle2DDeg: 168,
        timestampMs: t,
      });
      const smoothed = smoother.smooth(raw.landmarks);
      counter.update({ ...raw, landmarks: smoothed, rawLandmarks: raw.landmarks });
      t += FRAME_MS;
    }

    // Pastikan durasi antara crossing downThreshold (<120°) hingga upThreshold (>=160°) >= 1000 ms
    const seq = [
      12, 22, 32, 42, 52, 60, 66, 72, 76, 80,
      80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
      80, 80, 80, 80, 80, 74, 68, 60, 52, 44,
      34, 24, 14, 4, 3, 2, 2, 2, 2, 2,
      2, 2, 2, 2, 2,
    ];
    let lastUpdate = counter.update({
      ...createSideHingePose({
        trunkAngleFromUpDeg: 8,
        facing: "right",
        kneeZ: 0.3,
        shoulderZ: 0.3,
        kneeAngle2DDeg: 168,
        timestampMs: t,
      }),
      landmarks: smoother.smooth(
        createSideHingePose({
          trunkAngleFromUpDeg: 8,
          facing: "right",
          kneeZ: 0.3,
          shoulderZ: 0.3,
          kneeAngle2DDeg: 168,
          timestampMs: t,
        }).landmarks
      ),
    });
    for (const deg of seq) {
      t += FRAME_MS;
      const raw = createSideHingePose({
        trunkAngleFromUpDeg: deg,
        facing: "right",
        kneeZ: 0.3,
        shoulderZ: 0.3,
        kneeAngle2DDeg: 168,
        timestampMs: t,
      });
      const smoothed = smoother.smooth(raw.landmarks);
      lastUpdate = counter.update({
        ...raw,
        landmarks: smoothed,
        rawLandmarks: raw.landmarks,
      });
    }

    expect(lastUpdate.repsCount).toBe(1);
    const rep = counter.getCompletedReps()[0];
    expect(rep).toBeDefined();
    const issueIds = rep.issues.map((i) => i.checkId);
    expect(issueIds).not.toContain("hip-lockout");
    expect(issueIds).not.toContain("hinge-not-squat");
    expect(issueIds).not.toContain("hip-shoot");
  });

  it("24. lockout mentah: EMA 163 dengan puncak mentah 172 lulus; puncak mentah 155 memicu hip-lockout", () => {
    // Sub-kasus A: sinyal EMA melewati upThreshold di ~163° sementara rawLandmarks sudah berada di 172° (trunk ~3.5°)
    const counterPass = new RepCounter(HINGE_RULESET, "bb-deadlift");
    const smoother = new LandmarkSmoother(0.25);
    let t = 1000;

    for (let i = 0; i < 45; i++) {
      const raw = createSideHingePose({
        trunkAngleFromUpDeg: 5,
        facing: "right",
        timestampMs: t,
      });
      const smoothed = smoother.smooth(raw.landmarks);
      counterPass.update({
        ...raw,
        landmarks: smoothed,
        rawLandmarks: raw.landmarks,
      });
      t += FRAME_MS;
    }

    // Turun & tahan di bawah > 1000 ms agar memenuhi minRepMs
    const descendAndHold: number[] = [];
    for (let i = 0; i < 16; i++) {
      descendAndHold.push(Math.min(75, 15 + i * 4));
    }
    for (let i = 0; i < 20; i++) {
      descendAndHold.push(75);
    }
    // Naik perlahan ke 28° (masih di bawah upThreshold 160°), lalu lonjak mentah ke ~172° (trunk 3.5°)
    for (let deg = 70; deg >= 28; deg -= 6) {
      descendAndHold.push(deg);
    }
    for (const trunkDeg of descendAndHold) {
      const raw = createSideHingePose({
        trunkAngleFromUpDeg: trunkDeg,
        facing: "right",
        timestampMs: t,
      });
      const smoothed = smoother.smooth(raw.landmarks);
      counterPass.update({
        ...raw,
        landmarks: smoothed,
        rawLandmarks: raw.landmarks,
      });
      t += FRAME_MS;
    }

    let metricAtComplete = 0;
    for (let i = 0; i < 20; i++) {
      const raw = createSideHingePose({
        trunkAngleFromUpDeg: 3.5,
        facing: "right",
        timestampMs: t,
      });
      const smoothed = smoother.smooth(raw.landmarks);
      const prevReps = counterPass.getCompletedReps().length;
      counterPass.update({
        ...raw,
        landmarks: smoothed,
        rawLandmarks: raw.landmarks,
      });
      if (counterPass.getCompletedReps().length > prevReps) {
        metricAtComplete = HINGE_RULESET.counter.metric({
          ...raw,
          landmarks: smoothed,
        });
        break;
      }
      t += FRAME_MS;
    }

    expect(metricAtComplete).toBeGreaterThanOrEqual(160);
    expect(metricAtComplete).toBeLessThan(165);
    expect(counterPass.getCompletedReps()).toHaveLength(1);
    expect(
      counterPass.getCompletedReps()[0].issues.map((i) => i.checkId)
    ).not.toContain("hip-lockout");

    // Sub-kasus B: smoothed mencapai upThreshold (~161°), tetapi puncak mentah selama naik hanya 155° (trunk ~20.5°)
    resetViolationStreaks();
    const counterFail = new RepCounter(HINGE_RULESET, "bb-deadlift");
    let t2 = calibrateCounter(counterFail, 1000, "right");

    const seqFail: Array<{ smoothTrunk: number; rawTrunk: number }> = [];
    for (let i = 0; i < 20; i++) {
      const deg = Math.min(75, 20 + i * 4);
      seqFail.push({ smoothTrunk: deg, rawTrunk: deg });
    }
    for (let i = 0; i < 15; i++) {
      seqFail.push({ smoothTrunk: 75, rawTrunk: 75 });
    }
    for (let i = 0; i < 12; i++) {
      const smoothDeg = Math.max(14.5, 70 - i * 5); // akhir ~14.5° => hipAngle ~161° >= 160
      seqFail.push({ smoothTrunk: smoothDeg, rawTrunk: 20.5 }); // raw ~155° (< 165)
    }

    for (const step of seqFail) {
      t2 += FRAME_MS;
      counterFail.update(
        createSideHingePose({
          trunkAngleFromUpDeg: step.smoothTrunk,
          rawOverride: { trunkAngleFromUpDeg: step.rawTrunk },
          facing: "right",
          timestampMs: t2,
        })
      );
    }

    expect(counterFail.getCompletedReps()).toHaveLength(1);
    expect(
      counterFail.getCompletedReps()[0].issues.map((i) => i.checkId)
    ).toContain("hip-lockout");
  });

  function runNoLeanBackScenario(facing: "right" | "left", topTrunkDeg: number) {
    resetViolationStreaks();
    const counter = new RepCounter(HINGE_RULESET, "bb-deadlift");
    let t = calibrateCounter(counter, 1000, facing);

    // Total waktu < upThreshold > 1100 ms agar memenuhi minRepMs = 1000 ms
    const descendAndAscend = [
      20, 35, 50, 62, 70, 75, 75, 75, 75, 75,
      75, 75, 75, 75, 75, 70, 64, 58, 52, 46,
      40, 34, 28, 24, 20, 18, 17, 16.5, topTrunkDeg,
    ];
    for (const deg of descendAndAscend) {
      t += FRAME_MS;
      counter.update(
        createSideHingePose({
          trunkAngleFromUpDeg: deg,
          facing,
          timestampMs: t,
        })
      );
    }
    return counter.getCompletedReps();
  }

  it("25a. no-lean-back menghadap kanan: condong belakang 15° memicu cue; tegak & condong depan 15° tidak memicu", () => {
    const leanBackReps = runNoLeanBackScenario("right", -15);
    expect(leanBackReps).toHaveLength(1);
    expect(leanBackReps[0].issues.map((i) => i.checkId)).toContain("no-lean-back");

    const uprightReps = runNoLeanBackScenario("right", 0);
    expect(uprightReps).toHaveLength(1);
    expect(uprightReps[0].issues.map((i) => i.checkId)).not.toContain(
      "no-lean-back"
    );

    const forwardReps = runNoLeanBackScenario("right", 15);
    expect(forwardReps).toHaveLength(1);
    expect(forwardReps[0].issues.map((i) => i.checkId)).not.toContain(
      "no-lean-back"
    );
  });

  it("25b. no-lean-back menghadap kiri: condong belakang 15° memicu cue; tegak & condong depan 15° tidak memicu", () => {
    const leanBackReps = runNoLeanBackScenario("left", -15);
    expect(leanBackReps).toHaveLength(1);
    expect(leanBackReps[0].issues.map((i) => i.checkId)).toContain("no-lean-back");

    const uprightReps = runNoLeanBackScenario("left", 0);
    expect(uprightReps).toHaveLength(1);
    expect(uprightReps[0].issues.map((i) => i.checkId)).not.toContain(
      "no-lean-back"
    );

    const forwardReps = runNoLeanBackScenario("left", 15);
    expect(forwardReps).toHaveLength(1);
    expect(forwardReps[0].issues.map((i) => i.checkId)).not.toContain(
      "no-lean-back"
    );
  });

  it("26. hinge-not-squat: sudut lutut 2D ~168° tidak menegur walau z membuat sudut 3D ~100°", () => {
    const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 0.95,
    }));
    const hip: Landmark = { x: 0.5, y: 0.45, z: 0, visibility: 0.95 };
    const knee: Landmark = { x: 0.526, y: 0.7, z: 0.258, visibility: 0.95 };
    const ankle: Landmark = { x: 0.5, y: 0.95, z: 0, visibility: 0.95 };
    landmarks[L_HIP] = hip;
    landmarks[L_KNEE] = knee;
    landmarks[L_ANKLE] = ankle;

    const deg2d = angleAt2D(hip, knee, ankle);
    const deg3d = angleAt(hip, knee, ankle);
    expect(deg2d).toBeGreaterThan(166);
    expect(deg2d).toBeLessThan(170);
    expect(deg3d).toBeLessThan(105);

    const ctx: RepContext = {
      bodyHeight: 0.7,
      torsoLength: 0.28,
      heelYBaseline: 0.95,
      isCalibrated: true,
      calibrationProgress: 1,
      currentPhase: "descending",
      repStartTimeMs: 1000,
      descentDurationMs: 0,
      minMetricValue: 110,
      maxMetricValue: 170,
      repIndex: 0,
      exerciseId: "bb-romanian-deadlift",
    };

    for (let i = 0; i < 5; i++) {
      const res = HINGE_NOT_SQUAT_CHECK.evaluate(
        { landmarks, timestampMs: 2000 + i * FRAME_MS, side: "left" },
        ctx
      );
      expect(res.ok).toBe(true);
    }
  });
});
