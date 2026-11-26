import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter } from "../rep-counter";
import {
  PLANK_RULESET,
  BRIDGE_RULESET,
  PRESS_HORIZONTAL_RULESET,
  resetViolationStreaks,
} from "../rules/config";
import { PoseFrame } from "../rules/types";
import {
  Landmark,
  L_SHOULDER,
  L_ELBOW,
  L_WRIST,
  L_HIP,
  L_KNEE,
  L_ANKLE,
  L_HEEL,
} from "../landmarks";

function baseLandmarks(): Landmark[] {
  return Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));
}

/**
 * Tubuh mendatar horizontal dengan rentang y kecil:
 * shoulder=(0.2, 0.50), ankle=(0.8, 0.61) -> bodyHeight=0.11, bodyLength=hypot(0.6, 0.11)≈0.6100.
 */
const BODY_LENGTH = Math.hypot(0.6, 0.11);

function makeHorizontalPlankFrame(
  hipOffsetAboveLine: number,
  elbowXOffsetFromShoulder: number,
  timestampMs: number
): PoseFrame {
  const landmarks = baseLandmarks();
  landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.8, y: 0.61, z: 0, visibility: 0.95 };
  landmarks[L_HEEL] = { x: 0.8, y: 0.62, z: 0, visibility: 0.95 };
  // Midpoint line Y di x=0.5 adalah 0.555
  landmarks[L_HIP] = {
    x: 0.5,
    y: 0.555 - hipOffsetAboveLine,
    z: 0,
    visibility: 0.95,
  };
  landmarks[L_ELBOW] = {
    x: 0.2 + elbowXOffsetFromShoulder,
    y: 0.65,
    z: 0,
    visibility: 0.95,
  };
  landmarks[L_WRIST] = {
    x: 0.2 + elbowXOffsetFromShoulder,
    y: 0.78,
    z: 0,
    visibility: 0.95,
  };
  return { landmarks, side: "left", timestampMs };
}

function makeHorizontalBridgeFrame(
  hipAngleDeg: number,
  heelRaise: number,
  timestampMs: number
): PoseFrame {
  const landmarks = baseLandmarks();
  landmarks[L_SHOULDER] = { x: 0.2, y: 0.7, z: 0, visibility: 0.95 };
  landmarks[L_KNEE] = { x: 0.75, y: 0.7, z: 0, visibility: 0.95 };
  const rad = (hipAngleDeg * Math.PI) / 180;
  const hipY = 0.7 + 0.275 * Math.cos(rad / 2);
  landmarks[L_HIP] = { x: 0.475, y: hipY, z: 0, visibility: 0.95 };
  // Rentang Y bahu->mata kaki = 0.11 (> 0.1 sehingga bodyHeight = 0.11, bodyLength = hypot(0.6, 0.11) ≈ 0.61)
  landmarks[L_ANKLE] = { x: 0.8, y: 0.81, z: 0, visibility: 0.95 };
  landmarks[L_HEEL] = { x: 0.8, y: 0.82 - heelRaise, z: 0, visibility: 0.95 };
  return { landmarks, side: "left", timestampMs };
}

function makeHorizontalBenchFrame(
  elbowAngleDeg: number,
  hipLift: number,
  timestampMs: number
): PoseFrame {
  const landmarks = baseLandmarks();
  landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
  // Rentang Y bahu->mata kaki = 0.11 -> bodyHeight = 0.11, bodyLength ≈ 0.61
  landmarks[L_ANKLE] = { x: 0.8, y: 0.61, z: 0, visibility: 0.95 };
  landmarks[L_HEEL] = { x: 0.8, y: 0.62, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: 0.5 - hipLift, z: 0, visibility: 0.95 };
  landmarks[L_ELBOW] = { x: 0.2, y: 0.65, z: 0, visibility: 0.95 };
  const rad = (elbowAngleDeg * Math.PI) / 180;
  landmarks[L_WRIST] = {
    x: 0.2 + 0.15 * Math.sin(Math.PI - rad),
    y: 0.65 + 0.15 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };
  return { landmarks, side: "left", timestampMs };
}

describe("bodyLength pada cek rule set horizontal (rentang Y kecil)", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });

  it("PLANK_HIP_PIKE_CHECK (ambang 8%): 50% (4%) tidak menegur; 150% (12%) menegur", () => {
    const cClean = new RepCounter(PLANK_RULESET, "bw-plank");
    const cFail = new RepCounter(PLANK_RULESET, "bw-plank");
    const dev50 = 0.04 * BODY_LENGTH;
    const dev150 = 0.12 * BODY_LENGTH;

    const cleanIssues: string[] = [];
    const failIssues: string[] = [];
    for (let i = 0; i < 25; i++) {
      const t = 100 + i * 100;
      const u1 = cClean.update(makeHorizontalPlankFrame(dev50, 0, t));
      const u2 = cFail.update(makeHorizontalPlankFrame(dev150, 0, t));
      cleanIssues.push(...u1.activeIssues.map((x) => x.checkId));
      failIssues.push(...u2.activeIssues.map((x) => x.checkId));
    }

    expect(cleanIssues).not.toContain("plank-hip-pike");
    expect(failIssues).toContain("plank-hip-pike");
  });

  it("PLANK_ELBOW_UNDER_SHOULDER_CHECK (ambang 10%): 50% (5%) tidak menegur; 150% (15%) menegur", () => {
    const cClean = new RepCounter(PLANK_RULESET, "bw-plank");
    const cFail = new RepCounter(PLANK_RULESET, "bw-plank");
    const dev50 = 0.05 * BODY_LENGTH;
    const dev150 = 0.15 * BODY_LENGTH;

    const cleanIssues: string[] = [];
    const failIssues: string[] = [];
    for (let i = 0; i < 25; i++) {
      const t = 100 + i * 100;
      const u1 = cClean.update(makeHorizontalPlankFrame(0, dev50, t));
      const u2 = cFail.update(makeHorizontalPlankFrame(0, dev150, t));
      cleanIssues.push(...u1.activeIssues.map((x) => x.checkId));
      failIssues.push(...u2.activeIssues.map((x) => x.checkId));
    }

    expect(cleanIssues).not.toContain("plank-elbow-alignment");
    expect(failIssues).toContain("plank-elbow-alignment");
  });

  it("HEEL_PRESS_CHECK bridge (ambang 3%): 50% (1.5%) tidak menegur; 150% (4.5%) menegur", () => {
    const runBridgeCase = (heelRaise: number) => {
      resetViolationStreaks();
      const counter = new RepCounter(BRIDGE_RULESET, "bw-glute-bridge");
      for (let t = 100; t <= 1700; t += 200) {
        counter.update(makeHorizontalBridgeFrame(175, 0, t));
      }
      let time = 1800;
      for (const a of [155, 138, 130, 130, 138, 155, 175]) {
        time += 150;
        counter.update(makeHorizontalBridgeFrame(a, heelRaise, time));
      }
      return counter.getCompletedReps();
    };

    const reps50 = runBridgeCase(0.015 * BODY_LENGTH);
    expect(reps50.length).toBe(1);
    expect(reps50[0].issues.map((i) => i.checkId)).not.toContain("heel-press");

    const reps150 = runBridgeCase(0.045 * BODY_LENGTH);
    expect(reps150.length).toBe(1);
    expect(reps150[0].issues.map((i) => i.checkId)).toContain("heel-press");
  });

  it("BUTT_LIFT_CHECK press-horizontal (ambang 5%): 50% (2.5%) tidak menegur; 150% (7.5%) menegur", () => {
    const runBenchCase = (hipLift: number) => {
      resetViolationStreaks();
      const counter = new RepCounter(PRESS_HORIZONTAL_RULESET, "bb-bench-press");
      for (let t = 100; t <= 1700; t += 200) {
        counter.update(makeHorizontalBenchFrame(170, 0, t));
      }
      let time = 1800;
      for (const a of [150, 120, 95, 85, 95, 120, 150, 170]) {
        time += 250;
        const liftNow = a <= 95 ? hipLift : 0;
        counter.update(makeHorizontalBenchFrame(a, liftNow, time));
      }
      return counter.getCompletedReps();
    };

    const reps50 = runBenchCase(0.025 * BODY_LENGTH);
    expect(reps50.length).toBe(1);
    expect(reps50[0].issues.map((i) => i.checkId)).not.toContain("butt-lift");

    const reps150 = runBenchCase(0.075 * BODY_LENGTH);
    expect(reps150.length).toBe(1);
    expect(reps150[0].issues.map((i) => i.checkId)).toContain("butt-lift");
  });
});
