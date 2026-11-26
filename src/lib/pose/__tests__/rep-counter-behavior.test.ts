import { describe, it, expect, beforeEach } from "vitest";
import { RepCounter, CounterUpdate } from "../rep-counter";
import { SQUAT_RULESET, resetViolationStreaks } from "../rules/config";
import { LandmarkSmoother } from "../smoothing";
import { PoseFrame, RepContext, RuleSet } from "../rules/types";
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

  it("10. JITTER KAKI BELAKANG + SMOOTHER: urutan sudut lutut kiri (derajat, 33 ms/frame) 94.9,110.9,119.6,135.7,150.4,158.2,168.6,132.0,103.4,119.9,141.9,153.9,156.8,159.4,170,172 yang melewati LandmarkSmoother(0.25) lalu RepCounter setelah satu squat penuh menghasilkan TEPAT 1 rep", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const smoother = new LandmarkSmoother(0.25);
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feed = (angleDeg: number) => {
      const raw = createSquatPoseFrame(angleDeg, ts);
      lastUpdate = counter.update({
        ...raw,
        landmarks: smoother.smooth(raw.landmarks),
      });
      ts += FRAME_INTERVAL_MS;
    };

    // Kalibrasi berdiri >= 1500 ms (~48 frame @ 33ms)
    for (let i = 0; i < 48; i++) {
      feed(STANDING_KNEE_DEG);
    }

    // Turun ke dasar satu squat penuh
    for (const angle of [165, 158, 149, 142, 134, 126, 118, 110, 102, 95]) {
      feed(angle);
    }

    // Urutan sudut lutut kiri berjitter pada kaki belakang
    const jitterSeq = [
      94.9, 110.9, 119.6, 135.7, 150.4, 158.2, 168.6, 132.0,
      103.4, 119.9, 141.9, 153.9, 156.8, 159.4, 170, 172,
    ];
    for (const angle of jitterSeq) {
      feed(angle);
      if (angle === 168.6) {
        expect(lastUpdate.repsCount).toBe(0);
      }
    }

    // Frame berdiri penutup agar EMA(0.25) melewati upThreshold 160° & konfirmasi 2 frame
    for (let i = 0; i < 5; i++) {
      feed(172);
    }

    expect(lastUpdate.repsCount).toBe(1);
  });

  it("11. Z BESAR TIDAK MENEGUR: squat dengan batang tubuh tegak (kemiringan 2D 15 derajat) dan z offset 0,35 -> tidak ada squat-trunk-lean", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const withLeanAndZ = (angleDeg: number, lean2dDeg: number, zOffset: number): PoseFrame => {
      const f = createSquatPoseFrame(angleDeg, ts);
      const dy = 0.3;
      const dx = dy * Math.tan((lean2dDeg * Math.PI) / 180);
      f.landmarks[L_HIP] = { ...f.landmarks[L_HIP], x: 0.5, y: 0.5, z: zOffset };
      f.landmarks[L_SHOULDER] = {
        ...f.landmarks[L_SHOULDER],
        x: 0.5 - dx,
        y: 0.5 - dy,
        z: 0,
      };
      return f;
    };

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(withLeanAndZ(STANDING_KNEE_DEG, 15, 0.35));
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 60);
    for (const angle of cycleAngles) {
      lastUpdate = counter.update(withLeanAndZ(angle, 15, 0.35));
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).not.toContain("squat-trunk-lean");
  });

  it("12. KEMIRINGAN NYATA TETAP DITEGUR: kemiringan 2D 60 derajat -> squat-trunk-lean muncul", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const withLean2D = (angleDeg: number, lean2dDeg: number): PoseFrame => {
      const f = createSquatPoseFrame(angleDeg, ts);
      const dy = 0.2;
      const dx = dy * Math.tan((lean2dDeg * Math.PI) / 180);
      f.landmarks[L_HIP] = { ...f.landmarks[L_HIP], x: 0.5, y: 0.5, z: 0 };
      f.landmarks[L_SHOULDER] = {
        ...f.landmarks[L_SHOULDER],
        x: 0.5 - dx,
        y: 0.5 - dy,
        z: 0,
      };
      return f;
    };

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(withLean2D(STANDING_KNEE_DEG, 5));
      ts += FRAME_INTERVAL_MS;
    }

    const cycleAngles = buildSmoothCycleAngles(STANDING_KNEE_DEG, 90, 60);
    for (const angle of cycleAngles) {
      const lean = angle < 130 ? 60 : 5;
      lastUpdate = counter.update(withLean2D(angle, lean));
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).toContain("squat-trunk-lean");
  });

  it("13. DEPTH DARI MENTAH: frame landmarks (dihaluskan) bottom 118 derajat, rawLandmarks bottom 100 derajat bertahan >= 3 frame -> tidak ada squat-depth", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feedPair = (smoothedDeg: number, rawDeg: number) => {
      const smoothedFrame = createSquatPoseFrame(smoothedDeg, ts);
      const rawFrame = createSquatPoseFrame(rawDeg, ts);
      lastUpdate = counter.update({
        ...smoothedFrame,
        rawLandmarks: rawFrame.landmarks,
      });
      ts += FRAME_INTERVAL_MS;
    };

    for (let i = 0; i < 48; i++) {
      feedPair(STANDING_KNEE_DEG, STANDING_KNEE_DEG);
    }

    const sequence: Array<[number, number]> = [
      [165, 160],
      [158, 148],
      [148, 138],
      [142, 128],
      [136, 118],
      [130, 110],
      [125, 100],
      [121, 100],
      [118, 100],
      [118, 104],
      [119, 112],
      [122, 120],
      [126, 128],
      [131, 136],
      [136, 144],
      [141, 152],
      [147, 158],
      [153, 164],
      [159, 170],
      [165, 170],
      [170, 170],
    ];
    for (const [smDeg, rDeg] of sequence) {
      feedPair(smDeg, rDeg);
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).not.toContain("squat-depth");
  });

  it("14. LONJAKAN MENTAH TIDAK MENUTUPI KEDALAMAN: raw bottom sebenarnya 125 derajat dengan satu frame raw 90 derajat -> squat-depth tetap muncul (median-3 menolak lonjakan)", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feedPair = (smoothedDeg: number, rawDeg: number) => {
      const smoothedFrame = createSquatPoseFrame(smoothedDeg, ts);
      const rawFrame = createSquatPoseFrame(rawDeg, ts);
      lastUpdate = counter.update({
        ...smoothedFrame,
        rawLandmarks: rawFrame.landmarks,
      });
      ts += FRAME_INTERVAL_MS;
    };

    for (let i = 0; i < 48; i++) {
      feedPair(STANDING_KNEE_DEG, STANDING_KNEE_DEG);
    }

    const sequence: Array<[number, number]> = [
      [165, 160],
      [158, 148],
      [148, 140],
      [143, 134],
      [138, 129],
      [133, 126],
      [129, 125],
      [126, 125],
      [125, 90],
      [125, 125],
      [126, 125],
      [129, 128],
      [134, 134],
      [140, 140],
      [146, 146],
      [152, 152],
      [156, 155],
      [159, 158],
      [163, 165],
      [168, 170],
      [170, 170],
      [170, 170],
    ];
    for (const [smDeg, rDeg] of sequence) {
      feedPair(smDeg, rDeg);
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).toContain("squat-depth");
  });

  it("15. TURUN 1 DETIK TIDAK DITEGUR: turun dari 170 ke 90 derajat dalam 1,0 s, bottom 0,3 s, naik normal -> tidak ada squat-descent-speed", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const smoother = new LandmarkSmoother(0.25);
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feed = (angleDeg: number) => {
      const raw = createSquatPoseFrame(angleDeg, ts);
      lastUpdate = counter.update({
        ...raw,
        landmarks: smoother.smooth(raw.landmarks),
        rawLandmarks: raw.landmarks,
      });
      ts += FRAME_INTERVAL_MS;
    };

    for (let i = 0; i < 48; i++) {
      feed(STANDING_KNEE_DEG);
    }

    // Turun 170 -> 90 dalam ~1,0 s (30 frame * 33 ms = 990 ms)
    for (let i = 1; i <= 30; i++) {
      feed(STANDING_KNEE_DEG - ((STANDING_KNEE_DEG - 90) * i) / 30);
    }

    // Tahan bottom 90 derajat ~0,3 s (9 frame * 33 ms = 297 ms)
    for (let i = 0; i < 9; i++) {
      feed(90);
    }

    // Naik normal 90 -> 170 dalam ~1,0 s + frame berdiri penutup untuk lag EMA
    for (let i = 1; i <= 30; i++) {
      feed(90 + ((STANDING_KNEE_DEG - 90) * i) / 30);
    }
    for (let i = 0; i < 6; i++) {
      feed(STANDING_KNEE_DEG);
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).not.toContain("squat-descent-speed");
  });

  it("16. JATUH 0,4 DETIK DITEGUR: turun 170 -> 90 derajat dalam 0,4 s -> squat-descent-speed muncul", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    const smoother = new LandmarkSmoother(0.25);
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feed = (angleDeg: number) => {
      const raw = createSquatPoseFrame(angleDeg, ts);
      lastUpdate = counter.update({
        ...raw,
        landmarks: smoother.smooth(raw.landmarks),
        rawLandmarks: raw.landmarks,
      });
      ts += FRAME_INTERVAL_MS;
    };

    for (let i = 0; i < 48; i++) {
      feed(STANDING_KNEE_DEG);
    }

    // Jatuh cepat 170 -> 90 dalam ~0,4 s (12 frame * 33 ms = 396 ms)
    for (let i = 1; i <= 12; i++) {
      feed(STANDING_KNEE_DEG - ((STANDING_KNEE_DEG - 90) * i) / 12);
    }

    // Naik terkontrol agar total durasi >= minRepMs (500 ms) dan rep selesai bersih
    for (let i = 1; i <= 20; i++) {
      feed(90 + ((STANDING_KNEE_DEG - 90) * i) / 20);
    }
    for (let i = 0; i < 6; i++) {
      feed(STANDING_KNEE_DEG);
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).toContain("squat-descent-speed");
  });

  it("17. JEDA 9 DETIK: jeda 9 detik lalu turun -> descentFromTopMs undefined, check memakai fallback descentDurationMs", () => {
    let observedDescentFromTopMs: number | undefined = -1;
    let observedDescentDurationMs = -1;
    const spyRuleSet: RuleSet = {
      ...SQUAT_RULESET,
      checks: SQUAT_RULESET.checks.map((c) =>
        c.id === "squat-descent-speed"
          ? {
              ...c,
              evaluate: (frame: PoseFrame, ctx: RepContext) => {
                observedDescentFromTopMs = ctx.descentFromTopMs;
                observedDescentDurationMs = ctx.descentDurationMs;
                return c.evaluate(frame, ctx);
              },
            }
          : c
      ),
    };

    const counter = new RepCounter(spyRuleSet, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 48; i++) {
      lastUpdate = counter.update(createSquatPoseFrame(STANDING_KNEE_DEG, ts));
      ts += FRAME_INTERVAL_MS;
    }

    // Jeda 9 detik (> 1000 ms), lalu langsung berada di bawah upThreshold dan jatuh cepat (< 600 ms)
    ts += 9000;
    const postGapSequence = [
      155, 145, 130, 115, 100, 90, 95, 100, 105, 110, 115, 120, 125, 130, 136,
      142, 148, 154, 159, 164, 170, 170,
    ];
    for (const angle of postGapSequence) {
      lastUpdate = counter.update(createSquatPoseFrame(angle, ts));
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    expect(observedDescentFromTopMs).toBeUndefined();
    expect(observedDescentDurationMs).toBeGreaterThan(0);
    expect(observedDescentDurationMs).toBeLessThan(600);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).toContain("squat-descent-speed");
  });

  const buildHipKneeFrame = (
    kneeDeg: number,
    hipYDiff: number,
    ts: number
  ): PoseFrame => {
    const f = createSquatPoseFrame(kneeDeg, ts);
    const kneeX = 0.55;
    const kneeY = 0.7;
    const thighLen = 0.2;
    const shinLen = 0.2;
    const clampedDiff = Math.max(-0.18, Math.min(0.18, hipYDiff));
    const dxHip = Math.sqrt(thighLen * thighLen - clampedDiff * clampedDiff);
    const hipX = kneeX - dxHip;
    const hipY = kneeY + clampedDiff;

    const ux = (hipX - kneeX) / thighLen;
    const uy = (hipY - kneeY) / thighLen;
    const rad = (kneeDeg * Math.PI) / 180;
    const vx = ux * Math.cos(rad) + uy * Math.sin(rad);
    const vy = -ux * Math.sin(rad) + uy * Math.cos(rad);

    f.landmarks[L_SHOULDER] = { x: hipX, y: hipY - 0.3, z: 0, visibility: 0.95 };
    f.landmarks[L_HIP] = { x: hipX, y: hipY, z: 0, visibility: 0.95 };
    f.landmarks[L_KNEE] = { x: kneeX, y: kneeY, z: 0, visibility: 0.95 };
    f.landmarks[L_ANKLE] = {
      x: kneeX + shinLen * vx,
      y: kneeY + shinLen * vy,
      z: 0,
      visibility: 0.95,
    };
    return f;
  };

  it("18. DEPTH PROXY SEJAJAR: sudut dasar 118 derajat tetapi hip.y >= knee.y -> tidak ada squat-depth", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    const feedStand = () => {
      const f = createSquatPoseFrame(STANDING_KNEE_DEG, ts);
      lastUpdate = counter.update({ ...f, rawLandmarks: f.landmarks });
      ts += FRAME_INTERVAL_MS;
    };

    for (let i = 0; i < 48; i++) feedStand();

    const steps: Array<[number, number]> = [
      [162, -0.15],
      [152, -0.12],
      [144, -0.09],
      [138, -0.07],
      [132, -0.05],
      [126, -0.03],
      [122, -0.01],
      [118, 0.0],
      [118, 0.01],
      [118, 0.01],
      [118, 0.0],
      [120, -0.01],
      [124, -0.03],
      [129, -0.05],
      [134, -0.07],
      [140, -0.09],
      [146, -0.11],
      [152, -0.13],
      [157, -0.15],
      [162, -0.16],
      [168, -0.18],
      [170, -0.19],
      [170, -0.19],
    ];
    for (const [deg, diff] of steps) {
      const f = buildHipKneeFrame(deg, diff, ts);
      lastUpdate = counter.update({ ...f, rawLandmarks: f.landmarks });
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).not.toContain("squat-depth");
  });

  it("19. KONTROL NEGATIF DEPTH PROXY: sudut dasar 135 derajat dan hip.y 0,08 di atas knee.y -> squat-depth tetap muncul", () => {
    const counter = new RepCounter(SQUAT_RULESET, "bw-air-squat");
    let ts = START_TS_MS;
    let lastUpdate!: CounterUpdate;

    for (let i = 0; i < 48; i++) {
      const f = createSquatPoseFrame(STANDING_KNEE_DEG, ts);
      lastUpdate = counter.update({ ...f, rawLandmarks: f.landmarks });
      ts += FRAME_INTERVAL_MS;
    }

    const steps: Array<[number, number]> = [
      [162, -0.16],
      [152, -0.14],
      [146, -0.12],
      [142, -0.11],
      [138, -0.095],
      [136, -0.085],
      [135, -0.08],
      [135, -0.08],
      [135, -0.08],
      [135, -0.08],
      [137, -0.088],
      [140, -0.1],
      [143, -0.11],
      [146, -0.122],
      [149, -0.134],
      [152, -0.142],
      [155, -0.15],
      [158, -0.158],
      [161, -0.165],
      [165, -0.172],
      [169, -0.18],
      [170, -0.19],
      [170, -0.19],
    ];
    for (const [deg, diff] of steps) {
      const f = buildHipKneeFrame(deg, diff, ts);
      lastUpdate = counter.update({ ...f, rawLandmarks: f.landmarks });
      ts += FRAME_INTERVAL_MS;
    }

    expect(lastUpdate.repsCount).toBe(1);
    const issueIds = (lastUpdate.lastCompletedRep?.issues ?? []).map((i) => i.checkId);
    expect(issueIds).toContain("squat-depth");
  });
});
