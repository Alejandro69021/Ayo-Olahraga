import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter, CounterUpdate } from "../rep-counter";
import { SQUAT_RULESET, resetViolationStreaks } from "../rules/config";
import { PoseFrame } from "../rules/types";
import {
  Landmark,
  L_SHOULDER,
  L_HIP,
  L_KNEE,
  L_ANKLE,
  L_HEEL,
} from "../landmarks";

const START_TS_MS = 10_000;
const FRAME_INTERVAL_MS = 33;
const STANDING_KNEE_DEG = 170;

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

/**
 * Membuat frame pose squat berdasarkan geometri sudut lutut di rules.test.ts,
 * dengan opsi noise acak seragam +-noiseAmplitude pada koordinat landmark aktif.
 */
function createSquatPoseFrame(
  kneeAngleDeg: number,
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

  landmarks[L_SHOULDER] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_KNEE] = { x: 0.5, y: 0.7, z: 0, visibility: 0.95 };

  const rad = (kneeAngleDeg * Math.PI) / 180;
  landmarks[L_ANKLE] = {
    x: 0.5 + 0.2 * Math.sin(Math.PI - rad),
    y: 0.7 + 0.2 * Math.cos(Math.PI - rad),
    z: 0,
    visibility: 0.95,
  };
  landmarks[L_HEEL] = { x: 0.48, y: 0.9, z: 0, visibility: 0.95 };

  if (noiseAmplitude > 0 && rand) {
    for (const idx of [L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_HEEL]) {
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

describe("RepCounter SQUAT_RULESET behavior", () => {
  beforeEach(() => {
    resetViolationStreaks();
  });

  it("1. DIAM: 600 frame pose berdiri dengan noise kecil (+-0.002) tidak menghitung repetisi", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const rand = createPrng(101);
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 600; i++) {
      const ts = START_TS_MS + i * FRAME_INTERVAL_MS;
      lastUpdate = counter.update(
        createSquatPoseFrame(STANDING_KNEE_DEG, ts, 0.002, rand)
      );
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("2. NOISE BESAR: 600 frame berdiri dengan jitter +-0.01 tidak menghitung repetisi", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const rand = createPrng(202);
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 600; i++) {
      const ts = START_TS_MS + i * FRAME_INTERVAL_MS;
      lastUpdate = counter.update(
        createSquatPoseFrame(STANDING_KNEE_DEG, ts, 0.01, rand)
      );
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("3. REP BAGUS: 5 siklus squat penuh (2 detik per siklus) dihitung tepat 5 repetisi", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    // Kalibrasi berdiri >= 1500 ms (~48 frame @ 33ms)
    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
      ts += FRAME_INTERVAL_MS;
    }

    // 5 siklus penuh @ ~2 detik (60 frame * 33ms = 1980ms)
    const cycleAngles = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 60);
    for (let rep = 0; rep < 5; rep++) {
      for (const angle of cycleAngles) {
        lastUpdate = counter.update(createSquatPoseFrame(angle, ts));
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(5);
  });

  it("4. TERLALU CEPAT: siklus lebih singkat dari counter.minRepMs tidak dihitung", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    // Kalibrasi berdiri >= 1500 ms
    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
      ts += FRAME_INTERVAL_MS;
    }

    // Siklus sangat cepat: 10 frame * 33ms = 330 ms (< minRepMs 500 ms)
    expect(10 * FRAME_INTERVAL_MS).toBeLessThan(SQUAT_RULESET.counter.minRepMs);
    const fastCycle = buildSmoothCycleAngles(STANDING_KNEE_DEG, 115, 10);

    for (let rep = 0; rep < 3; rep++) {
      for (const angle of fastCycle) {
        lastUpdate = counter.update(createSquatPoseFrame(angle, ts));
        ts += FRAME_INTERVAL_MS;
      }
      for (let idle = 0; idle < 10; idle++) {
        lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(0);
  });

  it("5. TIDAK CEREWET: pada 5 rep bagus, activeIssues kosong tiap frame dan lastCompletedRep.score >= 90", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;
    const allFrameIssues: Array<{ frameIndex: number; checkIds: string[] }> = [];

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
      if (lastUpdate.activeIssues.length > 0) {
        allFrameIssues.push({
          frameIndex: i,
          checkIds: lastUpdate.activeIssues.map((x) => x.checkId),
        });
      }
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 60);
    let frameCounter = 48;
    for (let rep = 0; rep < 5; rep++) {
      for (const angle of cycleAngles) {
        lastUpdate = counter.update(createSquatPoseFrame(angle, ts));
        if (lastUpdate.activeIssues.length > 0) {
          allFrameIssues.push({
            frameIndex: frameCounter,
            checkIds: lastUpdate.activeIssues.map((x) => x.checkId),
          });
        }
        frameCounter += 1;
        ts += FRAME_INTERVAL_MS;
      }
    }

    expect(lastUpdate.repsCount).toBe(5);
    expect(allFrameIssues).toEqual([]);
    expect(lastUpdate.lastCompletedRep?.score).toBeGreaterThanOrEqual(90);
  });

  it("6. TURUN TERLALU CEPAT: siklus squat ~0,8 detik memicu squat-descent-speed", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;
    const triggeredCheckIds: string[] = [];

    // Kalibrasi berdiri >= 1500 ms (~48 frame @ 33ms)
    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
      ts += FRAME_INTERVAL_MS;
    }

    // Siklus penuh ~0,8 detik (24 interval * 33ms = 792 ms; durasi rep > minRepMs 500 ms, turun < 600 ms)
    const fastDescentCycle = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 24);
    for (const angle of fastDescentCycle) {
      lastUpdate = counter.update(createSquatPoseFrame(angle, ts));
      for (const issue of lastUpdate.activeIssues) {
        triggeredCheckIds.push(issue.checkId);
      }
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    expect(triggeredCheckIds).toContain("squat-descent-speed");
  });

  it("7. Z BERISIK: squat tetap terhitung tepat 5 dan berdiri tetap 0 rep walau z landmark diberi offset acak besar (+-0,3)", () => {
    const withNoisyZ = (frame: PoseFrame, rand: () => number): PoseFrame => {
      const landmarks = frame.landmarks.map((lm, idx) =>
        [L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_HEEL].includes(idx)
          ? { ...lm, z: lm.z + (rand() * 2 - 1) * 0.3 }
          : lm
      );
      return { ...frame, landmarks };
    };

    // 1. Berdiri dengan offset z +-0.3 -> tetap 0 rep
    const standCounter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const randStand = createPrng(701);
    let standUpdate!: CounterUpdate;
    for (let i = 0; i < 600; i++) {
      const ts = START_TS_MS + i * FRAME_INTERVAL_MS;
      standUpdate = standCounter.update(
        withNoisyZ(createSquatPoseFrame(STANDING_KNEE_DEG, ts), randStand)
      );
    }
    expect(standUpdate.repsCount).toBe(0);

    // 2. 5 siklus squat penuh dengan offset z +-0.3 -> tepat 5 rep
    const squatCounter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const randSquat = createPrng(702);
    let ts = START_TS_MS;
    let squatUpdate!: CounterUpdate;
    for (let i = 0; i < 48; i++) {
      squatUpdate = squatCounter.update(
        withNoisyZ(createSquatPoseFrame(STANDING_KNEE_DEG, ts), randSquat)
      );
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 60);
    for (let rep = 0; rep < 5; rep++) {
      for (const angle of cycleAngles) {
        squatUpdate = squatCounter.update(
          withNoisyZ(createSquatPoseFrame(angle, ts), randSquat)
        );
        ts += FRAME_INTERVAL_MS;
      }
    }
    expect(squatUpdate.repsCount).toBe(5);
  });
});
