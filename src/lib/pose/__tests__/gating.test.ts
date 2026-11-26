import { describe, it, expect } from "vitest";
import {
  PoseGate,
  shouldExpireCue,
  TrackedCue,
} from "../gating";
import {
  SQUAT_RULESET,
  PUSHUP_RULESET,
  DIP_RULESET,
  CURL_RULESET,
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
  R_ANKLE,
  L_HEEL,
} from "../landmarks";

/**
 * Membuat frame squat sintetis yang valid dengan sudut lutut spesifik.
 * Posisi berdiri tegak (vertical family).
 */
function createValidSquatFrame(kneeAngleDeg: number, timestampMs: number): PoseFrame {
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
  const ankleX = 0.5 + 0.2 * Math.sin(Math.PI - rad);
  const ankleY = 0.7 + 0.2 * Math.cos(Math.PI - rad);

  landmarks[L_ANKLE] = { x: ankleX, y: ankleY, z: 0, visibility: 0.95 };
  landmarks[L_HEEL] = { x: 0.48, y: 0.9, z: 0, visibility: 0.95 };

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

/**
 * Membuat frame sintetis push-up dengan posisi badan horizontal (horizontal family).
 */
function createValidPushupFrame(elbowAngleDeg: number, timestampMs: number): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  // Badan horizontal: bahu di (0.2, 0.5), ankle di (0.8, 0.5) -> angleFromVertical = 90° (> 60°)
  landmarks[L_SHOULDER] = { x: 0.2, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_KNEE] = { x: 0.65, y: 0.5, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.8, y: 0.5, z: 0, visibility: 0.95 };

  // Siku sebagai vertex
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

/**
 * Membuat frame orang duduk tegak (angleFromVertical < 25°).
 */
function createUprightSittingFrame(timestampMs: number): PoseFrame {
  const landmarks: Landmark[] = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.95,
  }));

  landmarks[L_SHOULDER] = { x: 0.5, y: 0.2, z: 0, visibility: 0.95 };
  landmarks[L_ELBOW] = { x: 0.5, y: 0.4, z: 0, visibility: 0.95 };
  landmarks[L_WRIST] = { x: 0.5, y: 0.55, z: 0, visibility: 0.95 };
  landmarks[L_HIP] = { x: 0.5, y: 0.6, z: 0, visibility: 0.95 };
  landmarks[L_KNEE] = { x: 0.5, y: 0.75, z: 0, visibility: 0.95 };
  landmarks[L_ANKLE] = { x: 0.5, y: 0.9, z: 0, visibility: 0.95 };

  return {
    landmarks,
    side: "left",
    timestampMs,
  };
}

/**
 * Membuat frame push-up dengan landmark pergelangan kaki tidak terlihat / di luar frame.
 */
function createInvalidFramingPushupFrame(elbowAngleDeg: number, timestampMs: number): PoseFrame {
  const frame = createValidPushupFrame(elbowAngleDeg, timestampMs);
  // Sembunyikan L_ANKLE dan R_ANKLE agar aturan framing satu-sisi untuk view "side" gagal
  frame.landmarks[L_ANKLE] = { x: 0.8, y: 1.6, z: 0, visibility: 0.2 };
  frame.landmarks[R_ANKLE] = { x: 0.8, y: 1.6, z: 0, visibility: 0.2 };
  return frame;
}

describe("Logika Gerbang Pose & Umur Koreksi (gating.ts)", () => {
  describe("Unit: shouldExpireCue", () => {
    it("tidak kedaluwarsa jika pelanggaran sedang terdeteksi di frame saat ini", () => {
      const cue: TrackedCue = {
        checkId: "test-check",
        cue: "Turun lebih dalam",
        severity: "major",
        firstSeenMs: 0,
        lastSeenMs: 1000,
        issue: { checkId: "test-check", severity: "major", value: 120, cue: "Turun lebih dalam" },
      };

      expect(shouldExpireCue(cue, 3000, true)).toBe(false);
    });

    it("kedaluwarsa jika pelanggaran tidak terdeteksi >= 1000 ms", () => {
      const cue: TrackedCue = {
        checkId: "test-check",
        cue: "Turun lebih dalam",
        severity: "major",
        firstSeenMs: 0,
        lastSeenMs: 1000,
        issue: { checkId: "test-check", severity: "major", value: 120, cue: "Turun lebih dalam" },
      };

      expect(shouldExpireCue(cue, 1999, false)).toBe(false);
      expect(shouldExpireCue(cue, 2000, false)).toBe(true);
      expect(shouldExpireCue(cue, 2500, false)).toBe(true);
    });

    it("kedaluwarsa jika sudah tampil >= 2500 ms tanpa terpicu lagi", () => {
      const cue: TrackedCue = {
        checkId: "test-check",
        cue: "Turun lebih dalam",
        severity: "major",
        firstSeenMs: 1000,
        lastSeenMs: 1000,
        issue: { checkId: "test-check", severity: "major", value: 120, cue: "Turun lebih dalam" },
      };

      expect(shouldExpireCue(cue, 3500, false)).toBe(true);
    });
  });

  describe("(a) Pose Setengah Badan (Kaki Tidak Terlihat)", () => {
    it("tidak menambah repetisi dan tidak menghasilkan koreksi", () => {
      const gate = new PoseGate(PUSHUP_RULESET, "bw-pushup");

      let t = 0;
      let lastResult: any;

      // Siklus siku pushup 170 -> 90 -> 170 tetapi framing invalid (kaki out of bounds)
      for (let angle = 170; angle >= 90; angle -= 10) {
        t += 100;
        lastResult = gate.processFrame(createInvalidFramingPushupFrame(angle, t));
        expect(lastResult.canProcess).toBe(false);
        expect(lastResult.framing.ok).toBe(false);
        expect(lastResult.sessionState).toBe("WAITING");
        expect(lastResult.counterUpdate.repsCount).toBe(0);
        expect(lastResult.counterUpdate.activeCues).toEqual([]);
        expect(lastResult.counterUpdate.activeIssues).toEqual([]);
      }

      for (let angle = 90; angle <= 170; angle += 10) {
        t += 100;
        lastResult = gate.processFrame(createInvalidFramingPushupFrame(angle, t));
        expect(lastResult.canProcess).toBe(false);
        expect(lastResult.sessionState).toBe("WAITING");
        expect(lastResult.counterUpdate.repsCount).toBe(0);
        expect(lastResult.counterUpdate.activeCues).toEqual([]);
        expect(lastResult.counterUpdate.activeIssues).toEqual([]);
      }

      expect(gate.getCounter().getCompletedReps().length).toBe(0);
      expect(lastResult.counterUpdate.repsCount).toBe(0);
      expect(lastResult.counterUpdate.activeCues).toHaveLength(0);
    });
  });

  describe("(b) Orang Duduk Tegak untuk RuleSet Pushup", () => {
    it("tetap berada di WAITING dan tidak menghitung repetisi", () => {
      const gate = new PoseGate(PUSHUP_RULESET, "bw-pushup");

      let t = 1000;
      let lastResult: any;

      // Pengguna duduk tegak selama 3 detik (30 frame x 100 ms)
      for (let i = 0; i < 30; i++) {
        t += 100;
        lastResult = gate.processFrame(createUprightSittingFrame(t));
        expect(lastResult.canProcess).toBe(false);
        expect(lastResult.sessionState).toBe("WAITING");
        expect(lastResult.positionOk).toBe(false);
        expect(lastResult.statusMessage).toBe(
          "Ambil posisi push-up (badan lurus, tampak samping)"
        );
        expect(lastResult.counterUpdate.repsCount).toBe(0);
        expect(lastResult.counterUpdate.activeCues).toEqual([]);
      }

      expect(gate.getSessionState()).toBe("WAITING");
      expect(gate.getCounter().getCompletedReps().length).toBe(0);
    });
  });

  describe("(c) Badan Horizontal Terlihat Penuh >= 1500 ms -> ACTIVE", () => {
    it("berpindah ke ACTIVE dan siklus siku 170->90->170 menghasilkan tepat 1 repetisi", () => {
      const gate = new PoseGate(PUSHUP_RULESET, "bw-pushup");

      let t = 1000;
      // 1. Frame pertama posisi push-up valid -> masuk READY
      let res = gate.processFrame(createValidPushupFrame(170, t));
      expect(res.sessionState).toBe("READY");
      expect(res.statusMessage).toBe("Tahan posisi...");
      expect(res.canProcess).toBe(false);
      expect(res.counterUpdate.repsCount).toBe(0);

      // 2. Tahan selama 1000 ms (t = 2000 ms, durasi 1000 ms < 1500 ms) -> masih READY
      t = 2000;
      res = gate.processFrame(createValidPushupFrame(170, t));
      expect(res.sessionState).toBe("READY");
      expect(res.statusMessage).toBe("Tahan posisi...");
      expect(res.canProcess).toBe(false);

      // 3. Tahan mencapai >= 1500 ms (t = 2600 ms, durasi 1600 ms >= 1500 ms) -> ACTIVE
      t = 2600;
      res = gate.processFrame(createValidPushupFrame(170, t));
      expect(res.sessionState).toBe("ACTIVE");
      expect(res.statusMessage).toBe(""); // ACTIVE -> tidak ada pil status
      expect(res.canProcess).toBe(true);

      // 4. Lakukan siklus siku 170 -> 90 -> 170 (minRepMs pushup = 600 ms)
      // Turun ke 90° (descending)
      for (const angle of [160, 140, 120, 100, 90]) {
        t += 150;
        res = gate.processFrame(createValidPushupFrame(angle, t));
        expect(res.sessionState).toBe("ACTIVE");
        expect(res.canProcess).toBe(true);
      }

      // Naik ke 170° (ascending lalu rep complete)
      for (const angle of [100, 120, 140, 160, 170]) {
        t += 150;
        res = gate.processFrame(createValidPushupFrame(angle, t));
        expect(res.sessionState).toBe("ACTIVE");
      }

      // Tepat 1 repetisi selesai tercatat
      expect(res.counterUpdate.repsCount).toBe(1);
      expect(gate.getCounter().getCompletedReps().length).toBe(1);
    });
  });

  describe("(d) Kembali ke WAITING setelah > 2000 ms Tidak Valid", () => {
    it("kembali ke WAITING setelah > 2000 ms invalid tanpa menghapus hitungan", () => {
      const gate = new PoseGate(PUSHUP_RULESET, "bw-pushup");

      let t = 1000;
      // 1. Capai ACTIVE (tahan >= 1500 ms)
      gate.processFrame(createValidPushupFrame(170, t));
      t += 1600;
      gate.processFrame(createValidPushupFrame(170, t));
      expect(gate.getSessionState()).toBe("ACTIVE");

      // 2. Lakukan 1 repetisi penuh
      for (const angle of [150, 120, 90]) {
        t += 200;
        gate.processFrame(createValidPushupFrame(angle, t));
      }
      for (const angle of [120, 155, 170]) {
        t += 200;
        gate.processFrame(createValidPushupFrame(angle, t));
      }
      expect(gate.getCounter().getCompletedReps().length).toBe(1);

      // 3. Frame menjadi tidak valid (kaki keluar kamera)
      t += 200;
      let res = gate.processFrame(createInvalidFramingPushupFrame(170, t));
      expect(res.canProcess).toBe(false);
      // Gangguan singkat (0 ms <= 2000 ms): masih ACTIVE
      expect(res.sessionState).toBe("ACTIVE");
      expect(res.counterUpdate.repsCount).toBe(1);

      // Gangguan berlanjut selama 1500 ms (total 1500 ms <= 2000 ms): masih ACTIVE
      t += 1500;
      res = gate.processFrame(createInvalidFramingPushupFrame(170, t));
      expect(res.canProcess).toBe(false);
      expect(res.sessionState).toBe("ACTIVE");
      expect(res.counterUpdate.repsCount).toBe(1);

      // Gangguan melampaui 2000 ms (total 2200 ms > 2000 ms): kembali ke WAITING!
      t += 700;
      res = gate.processFrame(createInvalidFramingPushupFrame(170, t));
      expect(res.canProcess).toBe(false);
      expect(res.sessionState).toBe("WAITING");
      expect(res.counterUpdate.phase).toBe("idle");
      // Hitungan selesai TIDAK terhapus!
      expect(res.counterUpdate.repsCount).toBe(1);
      expect(gate.getCounter().getCompletedReps().length).toBe(1);
    });
  });

  describe("Umur Koreksi & Kedaluwarsa", () => {
    it("koreksi hilang bila pelanggaran tidak terdeteksi >= 1000 ms", () => {
      const gate = new PoseGate(SQUAT_RULESET, "bw-air-squat");

      let t = 1000;
      // Capai ACTIVE (READY >= 1500 ms)
      gate.processFrame(createValidSquatFrame(170, t));
      t += 1600;
      gate.processFrame(createValidSquatFrame(170, t));
      expect(gate.getSessionState()).toBe("ACTIVE");

      // Kalibrasi baseline
      for (let i = 0; i < 16; i++) {
        t += 100;
        gate.processFrame(createValidSquatFrame(170, t));
      }

      // Picu pelanggaran continuous konsisten (heel naik > 3% body height selama >= 3 frame)
      let violatedFrame = createValidSquatFrame(170, t);
      for (let i = 0; i < 4; i++) {
        t += 100;
        violatedFrame = createValidSquatFrame(170, t);
        violatedFrame.landmarks[L_HEEL].y = 0.85; // baseline 0.9, naik 0.05
        gate.processFrame(violatedFrame);
      }

      const resWithCue = gate.processFrame(violatedFrame);
      expect(resWithCue.counterUpdate.activeCues.length).toBeGreaterThan(0);
      expect(resWithCue.counterUpdate.activeCues[0]).toBe("Tumit tetap menapak");

      // Sekarang pulihkan posisi (tumit menapak normal di y = 0.9)
      const cleanFrame = createValidSquatFrame(170, t);

      // 500 ms setelah bersih: cue belum kedaluwarsa (< 1000 ms)
      t += 500;
      cleanFrame.timestampMs = t;
      let checkMid = gate.processFrame(cleanFrame);
      expect(checkMid.counterUpdate.activeCues.length).toBeGreaterThan(0);

      // 1000 ms setelah bersih: cue HARUS kedaluwarsa dan hilang
      t += 600; // total 1100 ms sejak terakhir terdeteksi
      cleanFrame.timestampMs = t;
      let checkExpired = gate.processFrame(cleanFrame);
      expect(checkExpired.counterUpdate.activeCues).toHaveLength(0);
      expect(checkExpired.counterUpdate.activeIssues).toHaveLength(0);
    });

    it("koreksi hilang bila sudah tampil >= 2500 ms tanpa terpicu lagi", () => {
      const gate = new PoseGate(SQUAT_RULESET, "bw-air-squat");

      let t = 1000;
      gate.processFrame(createValidSquatFrame(170, t));
      t += 1600;
      gate.processFrame(createValidSquatFrame(170, t));
      expect(gate.getSessionState()).toBe("ACTIVE");

      for (let i = 0; i < 16; i++) {
        t += 100;
        gate.processFrame(createValidSquatFrame(170, t));
      }

      // Picu cue
      for (let i = 0; i < 4; i++) {
        t += 100;
        const frame = createValidSquatFrame(170, t);
        frame.landmarks[L_HEEL].y = 0.85;
        gate.processFrame(frame);
      }

      // Maju 2600 ms dengan frame bersih
      t += 2600;
      const cleanFrame = createValidSquatFrame(170, t);
      const res = gate.processFrame(cleanFrame);
      expect(res.counterUpdate.activeCues).toHaveLength(0);
    });
  });

  describe("Pose Hilang & Kamera Terputus", () => {
    it("pose hilang > 500 ms mengosongkan koreksi dan menampilkan status Tubuh tidak terdeteksi", () => {
      const gate = new PoseGate(SQUAT_RULESET, "bw-air-squat");

      let t = 1000;
      gate.processFrame(createValidSquatFrame(170, t));
      t += 1600;
      gate.processFrame(createValidSquatFrame(170, t));

      // Pose hilang (landmarks kosong / null)
      t += 200;
      let res = gate.processFrame(null, { cameraConnected: true });
      expect(res.canProcess).toBe(false);

      // Setelah > 500 ms hilang
      t += 600;
      res = gate.processFrame(null, { cameraConnected: true });
      expect(res.canProcess).toBe(false);
      expect(res.statusMessage).toBe("Tubuh tidak terdeteksi");
      expect(res.counterUpdate.activeCues).toEqual([]);
      expect(res.counterUpdate.activeIssues).toEqual([]);
      expect(res.counterUpdate.phase).toBe("idle");
    });

    it("kamera terputus segera menghentikan pemrosesan dan mengosongkan koreksi", () => {
      const gate = new PoseGate(SQUAT_RULESET, "bw-air-squat");

      const t = 1000;
      const res = gate.processFrame(createValidSquatFrame(170, t), { cameraConnected: false });

      expect(res.canProcess).toBe(false);
      expect(res.statusMessage).toBe("Tubuh tidak terdeteksi");
      expect(res.framing.message).toBe("Kamera terputus");
      expect(res.counterUpdate.activeCues).toEqual([]);
      expect(res.counterUpdate.activeIssues).toEqual([]);
      expect(res.counterUpdate.phase).toBe("idle");
    });
  });

  describe("Regresi Stage, Dip, Upper-Body Vertical, & Monotonic Timestamp", () => {
    it("tidak masuk READY/ACTIVE dan tidak menghitung rep saat stage === 'countdown'", () => {
      const gate = new PoseGate(PUSHUP_RULESET, "bw-pushup");

      let t = 1000;
      for (const angle of [170, 170, 140, 90, 140, 170]) {
        t += 600;
        const res = gate.processFrame(createValidPushupFrame(angle, t), {
          cameraConnected: true,
          stage: "countdown",
          timestampMs: t,
        });
        expect(res.canProcess).toBe(false);
        expect(res.sessionState).toBe("WAITING");
        expect(res.counterUpdate.repsCount).toBe(0);
      }

      expect(gate.getCounter().getCompletedReps().length).toBe(0);
    });

    it("DIP_RULESET tidak mensyaratkan posisi horizontal push-up atau ankle terlihat", () => {
      const gate = new PoseGate(DIP_RULESET, "bw-dips");
      expect(gate.getFamily()).toBe("none");

      const frame = createUprightSittingFrame(1000);
      // Sembunyikan ankle karena DIP_RULESET hanya memantau tubuh atas
      frame.landmarks[L_ANKLE] = { x: 0.5, y: 1.4, z: 0, visibility: 0.1 };
      frame.landmarks[R_ANKLE] = { x: 0.5, y: 1.4, z: 0, visibility: 0.1 };

      const r1 = gate.processFrame(frame, { stage: "active", timestampMs: 1000 });
      expect(r1.sessionState).toBe("READY");
      expect(r1.positionOk).toBe(true);

      const frame2 = { ...frame, timestampMs: 2600 };
      const r2 = gate.processFrame(frame2, { stage: "active", timestampMs: 2600 });
      expect(r2.sessionState).toBe("ACTIVE");
      expect(r2.canProcess).toBe(true);
    });

    it("CURL_RULESET (vertical tubuh atas) memakai bahu->pinggul bila ankle di luar frame", () => {
      const gate = new PoseGate(CURL_RULESET, "db-bicep-curl");
      const frame = createUprightSittingFrame(1000);
      // Ankle off-screen dengan koordinat x horizontal ekstrem yang sebelumnya merusak sudut
      frame.landmarks[L_ANKLE] = { x: 1.8, y: 0.5, z: 0, visibility: 0.1 };
      frame.landmarks[R_ANKLE] = { x: 1.8, y: 0.5, z: 0, visibility: 0.1 };

      const r1 = gate.processFrame(frame, { stage: "active", timestampMs: 1000 });
      expect(r1.sessionState).toBe("READY");
      expect(r1.positionOk).toBe(true);
    });

    it("pose hilang menggunakan timestampMs monotonik secara konsisten (<=500ms vs >500ms)", () => {
      const gate = new PoseGate(SQUAT_RULESET, "bw-air-squat");

      gate.processFrame(createValidSquatFrame(170, 1000), { stage: "active", timestampMs: 1000 });
      gate.processFrame(createValidSquatFrame(170, 2600), { stage: "active", timestampMs: 2600 });
      expect(gate.getSessionState()).toBe("ACTIVE");

      // Hilang 300ms: masih ACTIVE
      const rShort = gate.processFrame(null, { cameraConnected: true, stage: "active", timestampMs: 2900 });
      expect(rShort.sessionState).toBe("ACTIVE");

      // Hilang > 500ms (total 600ms sejak 2900): kembali ke WAITING
      const rLong = gate.processFrame(null, { cameraConnected: true, stage: "active", timestampMs: 3500 });
      expect(rLong.sessionState).toBe("WAITING");
      expect(rLong.statusMessage).toBe("Tubuh tidak terdeteksi");
    });
  });
});
