import { Landmark } from "../landmarks";

export type Severity = "minor" | "major" | "critical";

export interface CheckResult {
  ok: boolean;
  value: number;
  cue: string; // Kalimat koreksi ringkas Bahasa Indonesia (<= 8 kata)
}

export interface PoseFrame {
  landmarks: Landmark[];
  rawLandmarks?: Landmark[];
  worldLandmarks?: Landmark[];
  timestampMs: number;
  side: "left" | "right";
}

export interface RepContext {
  bodyHeight: number;
  bodyLength?: number;
  torsoLength: number;
  heelYBaseline: number;
  isCalibrated: boolean;
  calibrationProgress: number; // 0..1 (1.5 detik pertama)
  currentPhase: "idle" | "descending" | "bottom" | "ascending";
  repStartTimeMs: number;
  descentDurationMs: number;
  descentFromTopMs?: number;
  minMetricValue: number;
  minRawMetricValue?: number;
  maxRawMetricValue?: number;
  maxDepthProxy?: number;
  maxMetricValue: number;
  repIndex: number;
  exerciseId: string;
}

export interface FormCheck {
  id: string;
  label: string;
  severity: Severity;
  when: "bottom" | "top" | "continuous";
  evaluate: (frame: PoseFrame, ctx: RepContext) => CheckResult;
}

export interface CounterConfig {
  metric: (frame: PoseFrame) => number;
  depthProxy?: (landmarks: Landmark[], side?: "left" | "right") => number;
  upThreshold: number;
  downThreshold: number;
  minRepMs: number;
}

export interface RuleSet {
  id: string;
  exerciseIds: string[];
  view: "side" | "front" | "any";
  tier?: "A" | "B" | "C";
  scored?: boolean;
  banner?: string;
  requiredLandmarks: number[];
  mode: "reps" | "hold";
  counter: CounterConfig;
  checks: FormCheck[];
}

export interface IssueItem {
  checkId: string;
  severity: Severity;
  value: number;
  cue: string;
}

export interface RepResult {
  index: number;
  durationMs: number;
  score?: number;
  issues: IssueItem[];
}

export interface HoldResult {
  totalHoldMs: number;
  cleanHoldMs: number;
  cleanPercentage: number;
  score: number;
  issues: IssueItem[];
}
