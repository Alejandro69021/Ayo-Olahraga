import { checkFraming, FramingResult } from "./framing";
import { RepCounter, CounterUpdate } from "./rep-counter";
import { RuleSet, PoseFrame, IssueItem, Severity } from "./rules/types";
import { Landmark } from "./landmarks";
import { getSideJoints } from "./rules/config";
import {
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
} from "./landmarks";

export const DEFAULT_REQUIRED_JOINTS = [
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
];

export type SessionState = "WAITING" | "READY" | "ACTIVE";
export type ExerciseFamily = "horizontal" | "vertical" | "none";

/**
 * Klasifikasi keluarga latihan untuk validasi posisi awal.
 */
export const RULESET_FAMILY_MAP: Record<string, ExerciseFamily> = {
  // 1. Tumpuan tangan (horizontal): sudut badan dari vertikal > 60°
  "pushup": "horizontal",
  "pike-pushup": "horizontal",
  "plank": "horizontal",
  "dip": "horizontal",

  // 2. Badan tegak (vertical): sudut badan dari vertikal < 25°
  "squat": "vertical",
  "squat-overhead": "vertical",
  "hinge": "vertical",
  "hinge-ballistic": "vertical",
  "calf": "vertical",
  "split": "vertical",
  "curl": "vertical",
  "raise": "vertical",
  "carry": "vertical",
  "kettlebell-other": "vertical",
  "press-vertical": "vertical",
  "pull-vertical": "vertical",
  "ground-to-overhead": "vertical",

  // 3. Tanpa syarat sudut (hanya framing ok)
  "bridge": "none",
  "press-horizontal": "none",
  "prone-extension": "none",
  "hanging-core": "none",
  "row": "none",
  "triceps-ext": "none",
  "rotation": "none",
};

/**
 * Menghitung sudut kemiringan ruas garis (p1 -> p2) terhadap garis vertikal (0° = tegak lurus ke bawah).
 */
export function angleFromVertical(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = Math.abs(p2.x - p1.x);
  const dy = Math.abs(p2.y - p1.y);
  return (Math.atan2(dx, dy) * 180) / Math.PI;
}

/**
 * Memeriksa apakah posisi awal pengguna valid sesuai keluarga gerakan.
 */
export function checkStartPosition(
  landmarks: Landmark[] | null | undefined,
  side: "left" | "right",
  family: ExerciseFamily,
  requiredLandmarks: number[],
  view?: RuleSet["view"]
): { ok: boolean; angle: number; reason?: string } {
  const framing = checkFraming(landmarks, requiredLandmarks, view);
  if (!framing.ok) {
    return {
      ok: false,
      angle: 0,
      reason: framing.message.includes("Tubuh tidak terdeteksi")
        ? "Tubuh tidak terdeteksi"
        : "Mundur sedikit",
    };
  }

  // 2. Jika family === "none", tidak ada syarat sudut
  if (family === "none") {
    return { ok: true, angle: 0 };
  }

  const joints = getSideJoints(landmarks!, side);
  const shoulder = joints.shoulder;
  const ankle = joints.ankle;

  if (!shoulder || !ankle) {
    return { ok: false, angle: 0, reason: "Mundur sedikit" };
  }

  const angle = angleFromVertical(shoulder, ankle);

  if (family === "horizontal") {
    // push-up, pike-pushup, plank, dip: badan hampir horizontal, sudut dari vertikal > 60°
    if (angle <= 60) {
      return {
        ok: false,
        angle,
        reason: "Ambil posisi push-up (badan lurus, tampak samping)",
      };
    }
    return { ok: true, angle };
  }

  if (family === "vertical") {
    // squat, hinge, calf, dll: badan tegak, sudut dari vertikal < 25°
    if (angle >= 25) {
      return {
        ok: false,
        angle,
        reason: "Berdiri tegak menghadap kamera/samping sesuai petunjuk",
      };
    }
    return { ok: true, angle };
  }

  return { ok: true, angle };
}

export interface TrackedCue {
  checkId: string;
  cue: string;
  severity: Severity;
  firstSeenMs: number;
  lastSeenMs: number;
  issue: IssueItem;
}

/**
 * Memeriksa apakah sebuah koreksi (cue) telah kedaluwarsa.
 * Aturan:
 * 1. Pelanggaran tidak terdeteksi >= 1000 ms, ATAU
 * 2. Sudah tampil >= 2500 ms tanpa terpicu lagi.
 */
export function shouldExpireCue(
  cue: TrackedCue,
  now: number,
  isCurrentlyDetected: boolean
): boolean {
  if (isCurrentlyDetected) {
    return false;
  }
  const notDetectedDuration = now - cue.lastSeenMs;
  const displayedDuration = now - cue.firstSeenMs;

  return notDetectedDuration >= 1000 || (displayedDuration >= 2500 && notDetectedDuration > 0);
}

/**
 * Mereset status repetisi yang sedang berlangsung ke IDLE tanpa menghapus riwayat hitungan selesai.
 */
export function resetRepCounterToIdle(counter: RepCounter): void {
  (counter as any).phase = "idle";
  (counter as any).repStartTimeMs = 0;
  (counter as any).descentDurationMs = 0;
  (counter as any).minMetricValue = 180;
  (counter as any).minRawMetricValue = undefined;
  (counter as any).maxRawMetricValue = undefined;
  (counter as any).rawMetricWindow = [];
  (counter as any).maxMetricValue = 0;
  (counter as any).currentRepIssues = [];
  (counter as any).activeCues = [];
}

/**
 * Menandai counter agar melakukan kalibrasi ulang baseline tinggi tubuh.
 */
export function markCounterForRecalibration(counter: RepCounter): void {
  (counter as any).isCalibrated = false;
  (counter as any).firstTimestampMs = 0;
}

export interface GateProcessOptions {
  cameraConnected?: boolean;
  stage?: "guide" | "countdown" | "calibrating" | "active";
}

export interface GateResult {
  canProcess: boolean;
  framing: FramingResult;
  poseDetected: boolean;
  statusMessage: string;
  counterUpdate: CounterUpdate;
  sessionState: SessionState;
  positionOk: boolean;
}

export class PoseGate {
  private ruleSet: RuleSet;
  private exerciseId: string;
  private counter: RepCounter;
  private requiredLandmarks: number[];
  private family: ExerciseFamily;

  // Keadaan Sesi
  private sessionState: SessionState = "WAITING";
  private readyStartTime: number | null = null;
  private invalidStartTime: number | null = null;
  private poseLostStartTime: number | null = null;

  // Active cues map: checkId -> TrackedCue
  private trackedCues: Map<string, TrackedCue> = new Map();

  constructor(ruleSet: RuleSet, exerciseId: string, counter?: RepCounter) {
    this.ruleSet = ruleSet;
    this.exerciseId = exerciseId;
    this.counter = counter ?? new RepCounter(ruleSet, exerciseId);
    this.requiredLandmarks = ruleSet.requiredLandmarks || DEFAULT_REQUIRED_JOINTS;
    this.family = RULESET_FAMILY_MAP[ruleSet.id] || "none";
  }

  public getSessionState(): SessionState {
    return this.sessionState;
  }

  public getFamily(): ExerciseFamily {
    return this.family;
  }

  public getCounter(): RepCounter {
    return this.counter;
  }

  public getTrackedCues(): TrackedCue[] {
    return Array.from(this.trackedCues.values());
  }

  public reset(): void {
    this.sessionState = "WAITING";
    this.readyStartTime = null;
    this.invalidStartTime = null;
    this.poseLostStartTime = null;
    this.trackedCues.clear();
    this.counter.reset();
  }

  public processFrame(frame: PoseFrame | null, options?: GateProcessOptions): GateResult {
    const now = frame ? frame.timestampMs : Date.now();
    const cameraConnected = options?.cameraConnected ?? true;

    // 1. KAMERA TERPUTUS
    if (!cameraConnected) {
      this.sessionState = "WAITING";
      this.readyStartTime = null;
      this.invalidStartTime = null;
      this.poseLostStartTime = null;
      this.trackedCues.clear();
      const framing: FramingResult = {
        ok: false,
        missing: [...this.requiredLandmarks],
        message: "Kamera terputus",
      };
      return {
        canProcess: false,
        framing,
        poseDetected: false,
        statusMessage: "Tubuh tidak terdeteksi",
        counterUpdate: this.createIdleCounterUpdate(),
        sessionState: "WAITING",
        positionOk: false,
      };
    }

    const hasPoses = Boolean(frame && frame.landmarks && frame.landmarks.length > 0);

    // 2. POSE HILANG
    if (!hasPoses) {
      this.readyStartTime = null;
      if (this.poseLostStartTime === null) {
        this.poseLostStartTime = now;
      }
      const lostDuration = now - this.poseLostStartTime;
      if (lostDuration > 500) {
        this.sessionState = "WAITING";
        this.trackedCues.clear();
        const framing: FramingResult = {
          ok: false,
          missing: [...this.requiredLandmarks],
          message: "Tubuh tidak terdeteksi",
        };
        return {
          canProcess: false,
          framing,
          poseDetected: false,
          statusMessage: "Tubuh tidak terdeteksi",
          counterUpdate: this.createIdleCounterUpdate(),
          sessionState: "WAITING",
          positionOk: false,
        };
      }

      return {
        canProcess: false,
        framing: {
          ok: false,
          missing: [...this.requiredLandmarks],
          message: "Mencari tubuh...",
        },
        poseDetected: false,
        statusMessage: "Tubuh tidak terdeteksi",
        counterUpdate: this.createIdleCounterUpdate(),
        sessionState: this.sessionState,
        positionOk: false,
      };
    }

    // Pose terdeteksi
    this.poseLostStartTime = null;

    // 3. EVALUASI FRAMING & POSISI AWAL
    const framing = checkFraming(frame!.landmarks, this.requiredLandmarks, this.ruleSet.view);
    const posResult = checkStartPosition(
      frame!.landmarks,
      frame!.side,
      this.family,
      this.requiredLandmarks,
      this.ruleSet.view
    );
    const isValid = framing.ok && posResult.ok;

    // 4. MESIN KEADAAN SESI (WAITING -> READY -> ACTIVE)
    if (this.sessionState === "WAITING") {
      this.trackedCues.clear();

      if (!isValid) {
        this.readyStartTime = null;
        let statusMessage: string;
        if (!framing.ok) {
          statusMessage = framing.message.includes("Tubuh tidak terdeteksi")
            ? "Tubuh tidak terdeteksi"
            : "Mundur sedikit";
        } else {
          statusMessage = posResult.reason || "Atur posisi tubuh";
        }

        return {
          canProcess: false,
          framing,
          poseDetected: true,
          statusMessage,
          counterUpdate: this.createIdleCounterUpdate(),
          sessionState: "WAITING",
          positionOk: posResult.ok,
        };
      }

      // isValid === true: mulai fase READY
      this.sessionState = "READY";
      this.readyStartTime = now;
      // Feed kalibrasi baseline saat posisi awal mulai tertahan
      (this.counter as any).calibrateBaseline?.(frame!);

      return {
        canProcess: false,
        framing,
        poseDetected: true,
        statusMessage: "Tahan posisi...",
        counterUpdate: this.createIdleCounterUpdate(),
        sessionState: "READY",
        positionOk: true,
      };
    }

    if (this.sessionState === "READY") {
      this.trackedCues.clear();

      if (!isValid) {
        // Batal dari READY kembali ke WAITING
        this.sessionState = "WAITING";
        this.readyStartTime = null;
        let statusMessage: string;
        if (!framing.ok) {
          statusMessage = framing.message.includes("Tubuh tidak terdeteksi")
            ? "Tubuh tidak terdeteksi"
            : "Mundur sedikit";
        } else {
          statusMessage = posResult.reason || "Atur posisi tubuh";
        }

        return {
          canProcess: false,
          framing,
          poseDetected: true,
          statusMessage,
          counterUpdate: this.createIdleCounterUpdate(),
          sessionState: "WAITING",
          positionOk: posResult.ok,
        };
      }

      // Masih valid di fase READY: kalibrasi baseline
      (this.counter as any).calibrateBaseline?.(frame!);
      const readyDuration = now - (this.readyStartTime ?? now);

      if (readyDuration < 1500) {
        return {
          canProcess: false,
          framing,
          poseDetected: true,
          statusMessage: "Tahan posisi...",
          counterUpdate: this.createIdleCounterUpdate(),
          sessionState: "READY",
          positionOk: true,
        };
      }

      // readyDuration >= 1500 ms: Kalibrasi selesai! Masuk ke ACTIVE!
      this.sessionState = "ACTIVE";
      this.invalidStartTime = null;
      (this.counter as any).isCalibrated = true;
      // Lanjut pemrosesan ACTIVE di bawah
    }

    // 5. KEADAAN ACTIVE: hanya di sini RepCounter dan cek aturan berjalan
    if (this.sessionState === "ACTIVE") {
      if (!isValid) {
        if (this.invalidStartTime === null) {
          this.invalidStartTime = now;
        }

        const invalidDuration = now - this.invalidStartTime;
        if (invalidDuration > 2000) {
          // Framing / posisi awal tidak valid terus-menerus > 2000 ms -> kembali ke WAITING
          this.sessionState = "WAITING";
          this.readyStartTime = null;
          this.invalidStartTime = null;
          resetRepCounterToIdle(this.counter);
          markCounterForRecalibration(this.counter);
          this.trackedCues.clear();

          let statusMessage: string;
          if (!framing.ok) {
            statusMessage = framing.message.includes("Tubuh tidak terdeteksi")
              ? "Tubuh tidak terdeteksi"
              : "Mundur sedikit";
          } else {
            statusMessage = posResult.reason || "Atur posisi tubuh";
          }

          return {
            canProcess: false,
            framing,
            poseDetected: true,
            statusMessage,
            counterUpdate: this.createIdleCounterUpdate(),
            sessionState: "WAITING",
            positionOk: posResult.ok,
          };
        }

        // Gangguan singkat (<= 2000 ms): jangan proses frame ini ke counter
        return {
          canProcess: false,
          framing,
          poseDetected: true,
          statusMessage: "",
          counterUpdate: this.createIdleCounterUpdate(),
          sessionState: "ACTIVE",
          positionOk: posResult.ok,
        };
      }

      // Valid di fase ACTIVE
      this.invalidStartTime = null;

      // PROSES FRAME KE REP COUNTER
      const update = this.counter.update(frame!);

      // KELOLA UMUR KOREKSI
      const detectedCheckIds = new Set<string>();
      for (const issue of update.activeIssues) {
        if (!issue.cue) continue;
        detectedCheckIds.add(issue.checkId);
        const existing = this.trackedCues.get(issue.checkId);
        if (existing) {
          existing.lastSeenMs = now;
          existing.issue = issue;
        } else {
          this.trackedCues.set(issue.checkId, {
            checkId: issue.checkId,
            cue: issue.cue,
            severity: issue.severity,
            firstSeenMs: now,
            lastSeenMs: now,
            issue,
          });
        }
      }

      for (const [checkId, cue] of this.trackedCues.entries()) {
        const isDetected = detectedCheckIds.has(checkId);
        if (shouldExpireCue(cue, now, isDetected)) {
          this.trackedCues.delete(checkId);
        }
      }

      const activeIssues = Array.from(this.trackedCues.values()).map((c) => c.issue);
      const activeCues = Array.from(this.trackedCues.values()).map((c) => c.cue);

      return {
        canProcess: true,
        framing,
        poseDetected: true,
        statusMessage: "", // ACTIVE -> tidak ada pil status
        counterUpdate: {
          ...update,
          activeIssues,
          activeCues,
        },
        sessionState: "ACTIVE",
        positionOk: true,
      };
    }

    return {
      canProcess: false,
      framing,
      poseDetected: true,
      statusMessage: "Atur posisi",
      counterUpdate: this.createIdleCounterUpdate(),
      sessionState: "WAITING",
      positionOk: false,
    };
  }

  private createIdleCounterUpdate(): CounterUpdate {
    const isTierC = this.ruleSet.tier === "C";
    const scoredReps = this.counter.getCompletedReps().filter((r) => typeof r.score === "number");
    const currentScore =
      isTierC
        ? 0
        : scoredReps.length > 0
        ? Math.round(
            scoredReps.reduce((sum, r) => sum + (r.score ?? 0), 0) /
              scoredReps.length
          )
        : 100;

    const holdResult = this.ruleSet.mode === "hold" ? this.counter.getHoldResult() : null;

    return {
      phase: "idle",
      repsCount: this.ruleSet.mode === "hold" ? 0 : this.counter.getCompletedReps().length,
      currentScore: this.ruleSet.mode === "hold" ? (holdResult?.score ?? 100) : currentScore,
      activeCues: [],
      activeIssues: [],
      lastCompletedRep: (this.counter as any).lastCompletedRep ?? null,
      holdTimeSec: holdResult ? Math.round(holdResult.totalHoldMs / 1000) : 0,
      cleanHoldSec: holdResult ? Math.round(holdResult.cleanHoldMs / 1000) : 0,
      isCalibrated: (this.counter as any).isCalibrated ?? false,
    };
  }
}
