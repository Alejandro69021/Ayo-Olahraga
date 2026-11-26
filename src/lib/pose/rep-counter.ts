import {
  RuleSet,
  PoseFrame,
  RepContext,
  RepResult,
  HoldResult,
  IssueItem,
} from "./rules/types";
import { Landmark } from "./landmarks";
import {
  getSideJoints,
  resetHingeTracking,
  resetViolationStreaks,
} from "./rules/config";
import { calculateRepScore, calculateHoldScore } from "./scoring";

export interface CounterUpdate {
  phase: "idle" | "descending" | "bottom" | "ascending";
  repsCount: number;
  currentScore: number;
  activeCues: string[];
  activeIssues: IssueItem[];
  lastCompletedRep: RepResult | null;
  holdTimeSec: number;
  cleanHoldSec: number;
  isCalibrated: boolean;
}

export class RepCounter {
  private ruleSet: RuleSet;
  private exerciseId: string;

  private phase: "idle" | "descending" | "bottom" | "ascending" = "idle";
  private repStartTimeMs: number = 0;
  private descentDurationMs: number = 0;
  private lastTopTimestampMs: number | undefined = undefined;
  private descentFromTopMs: number | undefined = undefined;
  private minMetricValue: number = 180;
  private minRawMetricValue: number | undefined = undefined;
  private maxRawMetricValue: number | undefined = undefined;
  private rawMetricWindow: number[] = [];
  private maxDepthProxy: number | undefined = undefined;
  private rawDepthProxyWindow: number[] = [];
  private bottomLandmarks: Landmark[] | undefined = undefined;
  private maxMetricValue: number = 0;
  private repIndex: number = 0;

  // Kalibrasi baseline (1500 ms pertama)
  private firstTimestampMs: number = 0;
  private isCalibrated: boolean = false;
  private heelYBaseline: number = 0;
  private bodyHeight: number = 1.0;
  private bodyLength: number | undefined = undefined;
  private torsoLength: number = 0.5;

  // Isu pada repetisi saat ini & riwayat repetisi selesai
  private currentRepIssues: IssueItem[] = [];
  private completedReps: RepResult[] = [];
  private lastCompletedRep: RepResult | null = null;
  private activeCues: string[] = [];

  // Variabel untuk mode hold (Plank)
  private totalHoldMs: number = 0;
  private cleanHoldMs: number = 0;
  private lastFrameTimestampMs: number = 0;
  private holdIssues: IssueItem[] = [];

  constructor(ruleSet: RuleSet, exerciseId: string) {
    this.ruleSet = ruleSet;
    this.exerciseId = exerciseId;
    resetHingeTracking();
    resetViolationStreaks();
  }

  /**
   * Memperbarui penghitungan repetisi atau durasi hold dengan frame pose baru.
   */
  public update(frame: PoseFrame): CounterUpdate {
    const gapDt = this.lastFrameTimestampMs > 0 ? Math.max(0, frame.timestampMs - this.lastFrameTimestampMs) : 0;
    const isInitialOrRecalib = this.firstTimestampMs === 0;

    if (isInitialOrRecalib) {
      this.firstTimestampMs = frame.timestampMs;
      this.lastFrameTimestampMs = frame.timestampMs;
      this.lastTopTimestampMs = undefined;
    }

    const elapsedTotal = frame.timestampMs - this.firstTimestampMs;
    const dt = isInitialOrRecalib ? 0 : gapDt;
    this.lastFrameTimestampMs = frame.timestampMs;
    if (gapDt > 1000) {
      this.lastTopTimestampMs = undefined;
    }

    // 1. Kalibrasi Baseline (1500 ms pertama saat pengguna berdiri/posisi awal)
    if (!this.isCalibrated) {
      this.calibrateBaseline(frame);
      if (elapsedTotal >= 1500) {
        this.isCalibrated = true;
      }
    }

    const ctx = this.createRepContext(frame);

    // MODE HOLD (Contoh: Plank)
    if (this.ruleSet.mode === "hold") {
      return this.updateHold(frame, ctx, dt);
    }

    // MODE REPS (Contoh: Squat, Push-up)
    return this.updateReps(frame, ctx);
  }

  private updateRawMetric(frame: PoseFrame, recordMin: boolean, recordMax = false): void {
    if (!frame.rawLandmarks || frame.rawLandmarks.length === 0) return;

    const rawVal = this.ruleSet.counter.metric({
      ...frame,
      landmarks: frame.rawLandmarks,
    });
    this.rawMetricWindow.push(rawVal);
    if (this.rawMetricWindow.length > 3) {
      this.rawMetricWindow.shift();
    }

    if (this.rawMetricWindow.length === 3) {
      const sorted = [...this.rawMetricWindow].sort((a, b) => a - b);
      const median = sorted[1];
      if (recordMin) {
        this.minRawMetricValue =
          this.minRawMetricValue === undefined
            ? median
            : Math.min(this.minRawMetricValue, median);
      }
      if (recordMax) {
        this.maxRawMetricValue =
          this.maxRawMetricValue === undefined
            ? median
            : Math.max(this.maxRawMetricValue, median);
      }
    }
  }

  private updateRawDepthProxy(frame: PoseFrame, recordMax: boolean): void {
    if (!this.ruleSet.counter.depthProxy || !frame.rawLandmarks || frame.rawLandmarks.length === 0) {
      return;
    }

    const rawProxy = this.ruleSet.counter.depthProxy(frame.rawLandmarks, frame.side);
    this.rawDepthProxyWindow.push(rawProxy);
    if (this.rawDepthProxyWindow.length > 3) {
      this.rawDepthProxyWindow.shift();
    }

    if (recordMax && this.rawDepthProxyWindow.length === 3) {
      const sorted = [...this.rawDepthProxyWindow].sort((a, b) => a - b);
      const median = sorted[1];
      this.maxDepthProxy =
        this.maxDepthProxy === undefined ? median : Math.max(this.maxDepthProxy, median);
    }
  }

  private updateReps(frame: PoseFrame, ctx: RepContext): CounterUpdate {
    const metricVal = this.ruleSet.counter.metric(frame);
    const { upThreshold, downThreshold, minRepMs } = this.ruleSet.counter;

    // Evaluasi aturan continuous setiap frame
    const activeFrameIssues: IssueItem[] = [];
    const activeFrameCues: string[] = [];

    for (const check of this.ruleSet.checks) {
      if (check.when === "continuous") {
        const res = check.evaluate(frame, ctx);
        if (!res.ok) {
          const item: IssueItem = {
            checkId: check.id,
            severity: check.severity,
            value: res.value,
            cue: res.cue,
          };
          activeFrameIssues.push(item);
          activeFrameCues.push(res.cue);
          this.recordIssue(item);
        }
      }
    }

    // STATE MACHINE REPETISI
    // IDLE -> DESCENDING -> BOTTOM -> ASCENDING -> IDLE (Selesai 1 Rep)
    switch (this.phase) {
      case "idle":
        if (metricVal >= upThreshold) {
          this.lastTopTimestampMs = frame.timestampMs;
        }
        if (metricVal < downThreshold) {
          this.phase = "descending";
          this.repStartTimeMs = frame.timestampMs;
          this.minMetricValue = metricVal;
          this.bottomLandmarks = frame.landmarks.map((p) => ({ ...p }));
          this.minRawMetricValue = undefined;
          this.maxRawMetricValue = undefined;
          this.maxDepthProxy = undefined;
          this.descentFromTopMs = undefined;
          this.maxMetricValue = metricVal;
          this.currentRepIssues = [...activeFrameIssues];
          this.updateRawMetric(frame, true);
          this.updateRawDepthProxy(frame, true);
        } else {
          this.updateRawMetric(frame, false);
          this.updateRawDepthProxy(frame, false);
        }
        break;

      case "descending":
        if (metricVal < this.minMetricValue) {
          this.minMetricValue = metricVal;
          this.bottomLandmarks = frame.landmarks.map((p) => ({ ...p }));
        }
        this.updateRawMetric(frame, true);
        this.updateRawDepthProxy(frame, true);

        // Ketika metrik mulai berbalik naik (naik > 2° dari titik minimum atau sudah mencapai upThreshold)
        if (metricVal > this.minMetricValue + 2 || metricVal >= upThreshold) {
          this.phase = "bottom";
          this.descentDurationMs = frame.timestampMs - this.repStartTimeMs;
          this.descentFromTopMs =
            this.lastTopTimestampMs !== undefined
              ? frame.timestampMs - this.lastTopTimestampMs
              : undefined;

          // Evaluasi aturan fase bottom (misal kedalaman squat / push-up)
          const bottomCtx = this.createRepContext(frame);
          for (const check of this.ruleSet.checks) {
            if (check.when === "bottom") {
              const res = check.evaluate(frame, bottomCtx);
              if (!res.ok) {
                const item: IssueItem = {
                  checkId: check.id,
                  severity: check.severity,
                  value: res.value,
                  cue: res.cue,
                };
                activeFrameIssues.push(item);
                activeFrameCues.push(res.cue);
                this.recordIssue(item);
              }
            }
          }

          this.phase = "ascending";
          if (metricVal >= upThreshold) {
            if (this.rawMetricWindow.length === 3) {
              const median = [...this.rawMetricWindow].sort((a, b) => a - b)[1];
              this.maxRawMetricValue =
                this.maxRawMetricValue === undefined
                  ? median
                  : Math.max(this.maxRawMetricValue, median);
            }
            this.handleRepComplete(frame, activeFrameIssues, activeFrameCues);
          }
        }
        break;

      case "bottom":
      case "ascending":
        if (metricVal > this.maxMetricValue) {
          this.maxMetricValue = metricVal;
        }
        this.updateRawMetric(frame, false, true);
        this.updateRawDepthProxy(frame, true);

        // Repetisi selesai saat metrik kembali melewati upThreshold
        if (metricVal >= upThreshold) {
          this.handleRepComplete(frame, activeFrameIssues, activeFrameCues);
        }
        break;
    }

    this.activeCues = activeFrameCues;

    const scoredReps = this.completedReps.filter((r) => typeof r.score === "number");
    const currentScore =
      this.ruleSet.tier === "C"
        ? 0
        : scoredReps.length > 0
        ? Math.round(
            scoredReps.reduce((sum, r) => sum + (r.score ?? 0), 0) /
              scoredReps.length
          )
        : 100;

    return {
      phase: this.phase,
      repsCount: this.repIndex,
      currentScore,
      activeCues: this.activeCues,
      activeIssues: activeFrameIssues,
      lastCompletedRep: this.lastCompletedRep,
      holdTimeSec: 0,
      cleanHoldSec: 0,
      isCalibrated: this.isCalibrated,
    };
  }

  private handleRepComplete(
    frame: PoseFrame,
    _activeFrameIssues: IssueItem[],
    _activeFrameCues: string[]
  ) {
    const { minRepMs } = this.ruleSet.counter;
    const duration = frame.timestampMs - this.repStartTimeMs;
    const repDurationForFilter =
      this.lastTopTimestampMs !== undefined
        ? frame.timestampMs - this.lastTopTimestampMs
        : duration;

    // Histeresis filter: ukur dari posisi atas terakhir (>= upThreshold), fallback ke downThreshold
    if (repDurationForFilter >= minRepMs) {
      // Evaluasi aturan fase top (misal ekstensi siku)
      const topCtx = this.createRepContext(frame);
      for (const check of this.ruleSet.checks) {
        if (check.when === "top") {
          const res = check.evaluate(frame, topCtx);
          if (!res.ok) {
            const item: IssueItem = {
              checkId: check.id,
              severity: check.severity,
              value: res.value,
              cue: res.cue,
            };
            this.recordIssue(item);
          }
        }
      }

      const isTierC = this.ruleSet.tier === "C";
      const repResult: RepResult = {
        index: this.repIndex + 1,
        durationMs: duration,
        issues: [...this.currentRepIssues],
      };
      if (!isTierC) {
        repResult.score = calculateRepScore(this.currentRepIssues);
      }

      this.completedReps.push(repResult);
      this.lastCompletedRep = repResult;
      this.repIndex++;
    }

    // Reset untuk siklus repetisi berikutnya
    this.phase = "idle";
    this.minMetricValue = 180;
    this.minRawMetricValue = undefined;
    this.maxRawMetricValue = undefined;
    this.rawMetricWindow = [];
    this.maxDepthProxy = undefined;
    this.rawDepthProxyWindow = [];
    this.bottomLandmarks = undefined;
    this.descentFromTopMs = undefined;
    this.lastTopTimestampMs =
      this.ruleSet.counter.metric(frame) >= this.ruleSet.counter.upThreshold
        ? frame.timestampMs
        : undefined;
    this.maxMetricValue = 0;
    this.currentRepIssues = [];
  }

  private updateHold(frame: PoseFrame, ctx: RepContext, dt: number): CounterUpdate {
    this.totalHoldMs += dt;

    const activeFrameIssues: IssueItem[] = [];
    const activeFrameCues: string[] = [];

    let isClean = true;
    for (const check of this.ruleSet.checks) {
      if (check.when === "continuous") {
        const res = check.evaluate(frame, ctx);
        if (!res.ok) {
          isClean = false;
          const item: IssueItem = {
            checkId: check.id,
            severity: check.severity,
            value: res.value,
            cue: res.cue,
          };
          activeFrameIssues.push(item);
          activeFrameCues.push(res.cue);
          this.recordIssue(item);
        }
      }
    }

    if (isClean && dt > 0) {
      this.cleanHoldMs += dt;
    }

    this.activeCues = activeFrameCues;
    const score = calculateHoldScore(this.cleanHoldMs, this.totalHoldMs);

    return {
      phase: "bottom",
      repsCount: 0,
      currentScore: score,
      activeCues: this.activeCues,
      activeIssues: activeFrameIssues,
      lastCompletedRep: null,
      holdTimeSec: Math.round(this.totalHoldMs / 1000),
      cleanHoldSec: Math.round(this.cleanHoldMs / 1000),
      isCalibrated: this.isCalibrated,
    };
  }

  private recordIssue(issue: IssueItem) {
    if (this.ruleSet.mode === "hold") {
      this.holdIssues.push(issue);
      return;
    }

    const alreadyLogged = this.currentRepIssues.some(
      (i) => i.checkId === issue.checkId
    );
    if (!alreadyLogged) {
      this.currentRepIssues.push(issue);
    }
  }

  private calibrateBaseline(frame: PoseFrame) {
    const joints = getSideJoints(frame.landmarks, frame.side);
    if (!joints.shoulder) return;

    if (joints.heel) {
      this.heelYBaseline = joints.heel.y;
    }

    // Estimasi panjang tubuh 2D (jarak Euclidean bahu ke mata kaki, fallback tumit bila mata kaki tidak ada)
    const isVisibleJoint = (lm?: { visibility?: number }) =>
      Boolean(lm && (lm.visibility === undefined || lm.visibility >= 0.5));
    const endPoint = isVisibleJoint(joints.ankle)
      ? joints.ankle
      : isVisibleJoint(joints.heel)
      ? joints.heel
      : joints.ankle ?? joints.heel;
    if (endPoint) {
      const length = Math.hypot(
        endPoint.x - joints.shoulder.x,
        endPoint.y - joints.shoulder.y
      );
      if (length > 0.1) {
        this.bodyLength = length;
      }
    }

    if (joints.heel && joints.ankle && joints.hip) {
      // Estimasi tinggi badan (jarak vertikal bahu ke mata kaki)
      const height = Math.abs(joints.ankle.y - joints.shoulder.y);
      if (height > 0.1) {
        this.bodyHeight = height;
      }

      // Estimasi panjang batang tubuh (bahu ke pinggul)
      const torso = Math.abs(joints.hip.y - joints.shoulder.y);
      if (torso > 0.05) {
        this.torsoLength = torso;
      }
    }
  }

  private createRepContext(frame: PoseFrame): RepContext {
    const elapsedTotal = frame.timestampMs - this.firstTimestampMs;
    const progress = Math.min(1, elapsedTotal / 1500);

    return {
      bodyHeight: this.bodyHeight,
      ...(this.bodyLength !== undefined ? { bodyLength: this.bodyLength } : {}),
      torsoLength: this.torsoLength,
      heelYBaseline: this.heelYBaseline,
      isCalibrated: this.isCalibrated,
      calibrationProgress: progress,
      currentPhase: this.phase,
      repStartTimeMs: this.repStartTimeMs,
      descentDurationMs: this.descentDurationMs,
      ...(this.descentFromTopMs !== undefined
        ? { descentFromTopMs: this.descentFromTopMs }
        : {}),
      minMetricValue: this.minMetricValue,
      ...(this.minRawMetricValue !== undefined
        ? { minRawMetricValue: this.minRawMetricValue }
        : {}),
      ...(this.maxRawMetricValue !== undefined
        ? { maxRawMetricValue: this.maxRawMetricValue }
        : {}),
      ...(this.maxDepthProxy !== undefined
        ? { maxDepthProxy: this.maxDepthProxy }
        : {}),
      ...(this.bottomLandmarks !== undefined
        ? { bottomLandmarks: this.bottomLandmarks }
        : {}),
      maxMetricValue: this.maxMetricValue,
      repIndex: this.repIndex,
      exerciseId: this.exerciseId,
    };
  }

  public getCompletedReps(): RepResult[] {
    return this.completedReps;
  }

  public getHoldResult(): HoldResult {
    return {
      totalHoldMs: this.totalHoldMs,
      cleanHoldMs: this.cleanHoldMs,
      cleanPercentage: calculateHoldScore(this.cleanHoldMs, this.totalHoldMs),
      score: calculateHoldScore(this.cleanHoldMs, this.totalHoldMs),
      issues: this.holdIssues,
    };
  }

  public reset(): void {
    this.phase = "idle";
    this.repStartTimeMs = 0;
    this.descentDurationMs = 0;
    this.lastTopTimestampMs = undefined;
    this.descentFromTopMs = undefined;
    this.minMetricValue = 180;
    this.minRawMetricValue = undefined;
    this.maxRawMetricValue = undefined;
    this.rawMetricWindow = [];
    this.maxDepthProxy = undefined;
    this.rawDepthProxyWindow = [];
    this.bottomLandmarks = undefined;
    this.maxMetricValue = 0;
    this.repIndex = 0;
    this.currentRepIssues = [];
    this.completedReps = [];
    this.lastCompletedRep = null;
    this.activeCues = [];
    this.totalHoldMs = 0;
    this.cleanHoldMs = 0;
    this.holdIssues = [];
    this.bodyLength = undefined;
    this.firstTimestampMs = 0;
    this.isCalibrated = false;
    resetHingeTracking();
    resetViolationStreaks();
  }
}
