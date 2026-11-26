import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter, CounterUpdate } from "../rep-counter";
import { LandmarkSmoother } from "../smoothing";
import { PoseGate, GateResult } from "../gating";
import {
  PUSHUP_RULESET,
  PLANK_RULESET,
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

const START_TS_MS = 10_000;
const FRAME_INTERVAL_MS = 33;
const PLANK_TOP_ELBOW_DEG = 170;

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Membuat frame pose push-up/plank tampak samping berdasarkan geometri sudut siku
 * dan posisi pinggul di rules.test.ts, dengan opsi noise +-noiseAmplitude.
 */
function createPushupPoseFrame(
  elbowAngleDeg: number,
  hipY: number,
  timestampMs: number,
  noiseAmplitude = 0,
  rand?: () => number
): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: hipY, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.8, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_ELBOW] = { x: 0.2, y: 0.65, z: 0, visibility: 0.95 };

  const rad = (elbowAngleDeg * Math.PI) / 180;
  landmarks[L_WRIST] = {
    x: 0.2 + 0.15 * Math.sin(Math.PI - rad),
    y: 0.65 + 0.15 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };

  if (noiseAmplitude > 0 && rand) {
    for (const idx of [L_SHOULDER, L_ELBOW, L_WRIST, L_HIP, L_ANKLE]) {
      landmarks[idx] = {
        ...landmarks[idx],
        x: landmarks[idx].x + (rand() * 2 - 1) * noiseAmplitude,
        y: landmarks[idx].y + (rand() * 2 - 1) * noiseAmplitude,
      };
    }
  }

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

/** Membuat frame berdiri tegak tampak samping dengan lengan di sisi tubuh. */
function createStandingPoseFrame(timestampMs: number): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  landmarks[L_SHOULDER] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
  landmarks[L_ELBOW] = { x: 0.5, y: 0.36, z: 0, visibility: 0.95 };
  landmarks[L_WRIST] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.5, y: 0.9, z: 0, visibility: 0.95 };
  landmarks[L_HEEL] = { x: 0.48, y: 0.9, z: 0, visibility: 0.95 };

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

/** Menghasilkan deret sudut halus turun-bawah-naik memakai kurva kosinus. */
function buildSmoothCycleAngles(
  topDeg: number,
  bottomDeg: number,
  framesCount: number
): number[] {
  const angles: number[] = [];
  for (let i = 0; i <= framesCount; i++) {
    const t = i / framesCount;
    const progress = (1 - Math.cos(Math.PI * 2 * t)) / 2;
    angles.push(topDeg - (topDeg - bottomDeg) * progress);
  }
  return angles;
}

describe("RepCounter PUSHUP_RULESET behavior", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });

  it("1. DIAM: 600 frame plank atas dengan noise kecil (+-0.002) tidak menghitung repetisi", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    const rand = createPrng(301);
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 600; i++) {
      const ts = START_TS_MS + i * FRAME_INTERVAL_MS;
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts, 0.002, rand)
      );
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("2. NOISE BESAR: 600 frame plank atas dengan jitter +-0.01 tidak menghitung repetisi", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    const rand = createPrng(402);
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 600; i++) {
      const ts = START_TS_MS + i * FRAME_INTERVAL_MS;
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts, 0.01, rand)
      );
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("3. REP BAGUS: 5 siklus push-up penuh (2 detik per siklus) dihitung tepat 5 repetisi", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    // Kalibrasi posisi awal >= 1500 ms (~48 frame @ 33ms)
    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
      );
      ts += FRAME_INTERVAL_MS;
    }

    // 5 siklus penuh @ ~2 detik (60 interval * 33ms = 1980ms)
    const cycleAngles = buildSmoothCycleAngles(PLANK_TOP_ELBOW_DEG, 90, 60);
    for (let rep = 0; rep < 5; rep++) {
      for (const angle of cycleAngles) {
        lastUpdate = counter.update(createPushupPoseFrame(angle, 0.5, ts));
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(5);
  });

  it("4. TIDAK CEREWET: pada 5 rep bagus, activeIssues kosong di semua frame dan lastCompletedRep.score >= 90", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;
    const allFrameIssues: CounterUpdate["activeIssues"] = [];

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
      );
      allFrameIssues.push(...lastUpdate.activeIssues);
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = buildSmoothCycleAngles(PLANK_TOP_ELBOW_DEG, 90, 60);
    for (let rep = 0; rep < 5; rep++) {
      for (const angle of cycleAngles) {
        lastUpdate = counter.update(createPushupPoseFrame(angle, 0.5, ts));
        allFrameIssues.push(...lastUpdate.activeIssues);
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(5);
    expect(allFrameIssues).toEqual([]);
    expect(lastUpdate.lastCompletedRep?.score).toBeGreaterThanOrEqual(90);
  });

  it("5. TERLALU CEPAT: siklus lebih singkat dari minRepMs (600 ms) tidak dihitung", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
      );
      ts += FRAME_INTERVAL_MS;
    }

    // 14 interval * 33ms = 462 ms (< minRepMs 600 ms)
    expect(14 * FRAME_INTERVAL_MS).toBeLessThan(
      PUSHUP_RULESET.counter.minRepMs
    );
    const fastCycle = buildSmoothCycleAngles(PLANK_TOP_ELBOW_DEG, 90, 14);

    for (let rep = 0; rep < 3; rep++) {
      for (const angle of fastCycle) {
        lastUpdate = counter.update(createPushupPoseFrame(angle, 0.5, ts));
        ts += FRAME_INTERVAL_MS;
      }
      for (let idle = 0; idle < 10; idle++) {
        lastUpdate = counter.update(
          createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
        );
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("20. PUSH-UP Z OFFSET: siku memiliki z offset 0,3 -> rep tetap terhitung, tanpa pushup-depth / pushup-lockout", () => {
    const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
    const smoother = new LandmarkSmoother(0.25);
    let ts = START_TS_MS;

    const pushWithElbowZ = (deg: number, t: number) => {
      const raw = createPushupPoseFrame(deg, 0.5, t);
      raw.landmarks[L_ELBOW] = { ...raw.landmarks[L_ELBOW], z: 0.3 };
      const smoothed = smoother.smooth(raw.landmarks);
      counter.update({
        landmarks: smoothed,
        rawLandmarks: raw.landmarks,
        side: "left",
        timestampMs: t,
      });
    };

    for (let i = 0; i < 48; i++) {
      pushWithElbowZ(PLANK_TOP_ELBOW_DEG, ts);
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = [
      ...buildSmoothCycleAngles(PLANK_TOP_ELBOW_DEG, 90, 50),
      ...Array.from({ length: 15 }, () => PLANK_TOP_ELBOW_DEG),
    ];
    for (const angle of cycleAngles) {
      pushWithElbowZ(angle, ts);
      ts += FRAME_INTERVAL_MS;
    }

    const reps = counter.getCompletedReps();
    expect(reps.length).toBe(1);
    expect(reps[0].issues.map((i) => i.checkId)).not.toContain("pushup-depth");
    expect(reps[0].issues.map((i) => i.checkId)).not.toContain("pushup-lockout");
    expect(reps[0].score).toBe(100);
  });

  it("21. LOCKOUT DARI MENTAH: EMA 156 dengan puncak mentah 170 tanpa cue; puncak mentah 150 memicu pushup-lockout", () => {
    const runLockoutScenario = (peakRawDeg: number) => {
      resetViolationStreaks();
      const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
      let ts = START_TS_MS;
      for (let i = 0; i < 20; i++) {
        const top = createPushupPoseFrame(170, 0.5, ts);
        top.rawLandmarks = top.landmarks.map((p) => ({ ...p }));
        counter.update(top);
        ts += 100;
      }
      // Turun dan dasar (> 600 ms total sebelum naik melewati 155)
      for (const a of [145, 115, 100, 88, 92, 110, 128, 142]) {
        const f = createPushupPoseFrame(a, 0.5, ts);
        f.rawLandmarks = f.landmarks.map((p) => ({ ...p }));
        counter.update(f);
        ts += 100;
      }
      // Simulasi EMA melintasi 156 sementara mentah bertahan di peakRawDeg
      for (const smDeg of [148, 152, 156]) {
        const sm = createPushupPoseFrame(smDeg, 0.5, ts);
        const raw = createPushupPoseFrame(peakRawDeg, 0.5, ts);
        counter.update({
          ...sm,
          rawLandmarks: raw.landmarks,
        });
        ts += 100;
      }
      return counter.getCompletedReps();
    };

    const reps170 = runLockoutScenario(170);
    expect(reps170.length).toBe(1);
    expect(reps170[0].issues.map((i) => i.checkId)).not.toContain("pushup-lockout");

    const reps150 = runLockoutScenario(150);
    expect(reps150.length).toBe(1);
    expect(reps150[0].issues.map((i) => i.checkId)).toContain("pushup-lockout");
  });

  it("22. PIKE MEMAKAI PANJANG TUBUH: pinggul naik 4% panjang tubuh tidak memicu cue; 12% memicu pushup-hip-pike", () => {
    // Dalam createPushupPoseFrame, bahu (0.2, 0.5) -> ankle (0.8, 0.5): bodyLength = 0.60, bodyHeight = 0 (clamp 0.1).
    const runPikeCase = (hipRaiseRatioOfBodyLength: number) => {
      resetViolationStreaks();
      const counter = new RepCounter(PUSHUP_RULESET, "bw-pushup");
      const hipY = 0.5 - hipRaiseRatioOfBodyLength * 0.6;
      let ts = START_TS_MS;
      for (let i = 0; i < 48; i++) {
        counter.update(createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts));
        ts += FRAME_INTERVAL_MS;
      }
      const cycleAngles = buildSmoothCycleAngles(PLANK_TOP_ELBOW_DEG, 90, 60);
      for (const angle of cycleAngles) {
        counter.update(createPushupPoseFrame(angle, hipY, ts));
        ts += FRAME_INTERVAL_MS;
      }
      return counter.getCompletedReps();
    };

    const reps4Pct = runPikeCase(0.04);
    expect(reps4Pct.length).toBe(1);
    expect(reps4Pct[0].issues.map((i) => i.checkId)).not.toContain("pushup-hip-pike");

    const reps12Pct = runPikeCase(0.12);
    expect(reps12Pct.length).toBe(1);
    expect(reps12Pct[0].issues.map((i) => i.checkId)).toContain("pushup-hip-pike");
  });
});

describe("RepCounter PLANK_RULESET behavior", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });

  it("6. TAHAN BAGUS: 10 detik plank lurus -> holdTimeSec ~10 dan cleanHoldSec >= 8", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    // 304 frame @ 33ms -> 303 interval = 9999 ms (~10 detik)
    for (let i = 0; i < 304; i++) {
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
      );
      ts += FRAME_INTERVAL_MS;
    }

    expect(Math.abs(lastUpdate.holdTimeSec - 10)).toBeLessThanOrEqual(1);
    expect(lastUpdate.cleanHoldSec).toBeGreaterThanOrEqual(8);
  });

  it("7. PINGGUL TURUN: 10 detik pinggul melorot -> cleanHoldSec << holdTimeSec dan minimal 1 activeIssues", () => {
    const counter = new RepCounter(PLANK_RULESET, "bw-plank");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;
    const observedCheckIds = new Set<string>();

    // hipY = 0.65 (garis lurus y=0.5) -> sudut badan ~127 deg (< 165 deg) & hip.y > expectedY + 0.01
    for (let i = 0; i < 304; i++) {
      lastUpdate = counter.update(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.65, ts)
      );
      for (const issue of lastUpdate.activeIssues) {
        observedCheckIds.add(issue.checkId);
      }
      ts += FRAME_INTERVAL_MS;
    }

    expect(Math.abs(lastUpdate.holdTimeSec - 10)).toBeLessThanOrEqual(1);
    expect(lastUpdate.cleanHoldSec).toBeLessThan(lastUpdate.holdTimeSec / 2);
    expect(observedCheckIds.size).toBeGreaterThanOrEqual(1);
    expect(observedCheckIds.has("plank-hip-sag")).toBe(true);
  });

  it("8. TIDAK ADA PLANK (via PoseGate): berdiri tegak 10 detik tidak menambah holdTimeSec", () => {
    const gate = new PoseGate(PLANK_RULESET, "bw-plank");
    let ts = START_TS_MS;
    let lastResult!: GateResult;
    const allCues: string[] = [];

    for (let i = 0; i < 304; i++) {
      lastResult = gate.processFrame(createStandingPoseFrame(ts));
      expect(lastResult.sessionState).toBe("WAITING");
      allCues.push(...lastResult.counterUpdate.activeCues);
      ts += FRAME_INTERVAL_MS;
    }

    expect(gate.getSessionState()).toBe("WAITING");
    expect(lastResult.sessionState).toBe("WAITING");
    expect(lastResult.counterUpdate.holdTimeSec).toBe(0);
    expect(lastResult.counterUpdate.activeCues).toEqual([]);
    expect(allCues).toEqual([]);
    expect(gate.getTrackedCues()).toEqual([]);
  });

  it("9. PLANK VALID (via PoseGate) -> ACTIVE dan hold berjalan", () => {
    const gate = new PoseGate(PLANK_RULESET, "bw-plank");
    let ts = START_TS_MS;
    let lastResult!: GateResult;

    for (let i = 0; i < 304; i++) {
      lastResult = gate.processFrame(
        createPushupPoseFrame(PLANK_TOP_ELBOW_DEG, 0.5, ts)
      );
      if (ts - START_TS_MS >= 1500) {
        expect(lastResult.sessionState).toBe("ACTIVE");
      }
      ts += FRAME_INTERVAL_MS;
    }

    expect(gate.getSessionState()).toBe("ACTIVE");
    expect(lastResult.sessionState).toBe("ACTIVE");
    expect(lastResult.counterUpdate.holdTimeSec).toBeGreaterThanOrEqual(6);
    expect(lastResult.counterUpdate.holdTimeSec).toBeLessThanOrEqual(9);
  });
});
