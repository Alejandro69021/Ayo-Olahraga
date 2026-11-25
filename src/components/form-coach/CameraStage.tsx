"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { useCamera } from "@/hooks/useCamera";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import { FramingResult } from "@/lib/pose/framing";
import { pickVisibleSide } from "@/lib/pose/geometry";
import { RepCounter, CounterUpdate } from "@/lib/pose/rep-counter";
import { PoseGate } from "@/lib/pose/gating";
import {
  SQUAT_RULESET,
  getRuleSetForExercise,
  setBallisticFps,
} from "@/lib/pose/rules/config";
import { PoseFrame } from "@/lib/pose/rules/types";
import { LandmarkSmoother } from "@/lib/pose/smoothing";
import FeedbackPanel from "./FeedbackPanel";
import ResultSummary, { FormCoachSummary } from "./ResultSummary";
import SetupGuide from "./SetupGuide";
import {
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
} from "@/lib/pose/landmarks";
import {
  RefreshCw,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Info,
  Check,
} from "lucide-react";

interface CameraStageProps {
  exerciseId?: string;
  exerciseName?: string;
  view?: "side" | "front";
  cameraTip?: string;
  equipmentLabel?: string;
  onPoseDetected?: (landmarks: any[], worldLandmarks: any[]) => void;
  onClose?: () => void;
  onComplete?: (summary: FormCoachSummary) => void;
}

const DEFAULT_REQUIRED_JOINTS = [
  L_SHOULDER,
  R_SHOULDER,
  L_HIP,
  R_HIP,
  L_KNEE,
  R_KNEE,
  L_ANKLE,
  R_ANKLE,
];

const TARGET_FPS = 24;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const POSE_SMOOTHING_ALPHA = 0.25;

export const CameraStage: React.FC<CameraStageProps> = ({
  exerciseId = "bw-air-squat",
  exerciseName = "Air Squat",
  view,
  cameraTip,
  equipmentLabel,
  onPoseDetected,
  onClose,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastInferenceTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({
    frames: 0,
    lastTime: performance.now(),
    activeSeconds: 0,
    consecutiveLowFpsSeconds: 0,
  });

  // Tahapan: guide -> countdown (5s) -> calibrating (1.5s) -> active
  const [stage, setStage] = useState<"guide" | "countdown" | "calibrating" | "active">("guide");
  const [countdown, setCountdown] = useState<number>(5);

  const [isFileSource, setIsFileSource] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [lowFpsWarning, setLowFpsWarning] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [showTipPopover, setShowTipPopover] = useState<boolean>(false);

  // Toast repetisi singkat (1.2 detik)
  const [repToast, setRepToast] = useState<{ repNum: number; score?: number } | null>(null);
  const lastRepIndexRef = useRef<number>(0);

  const [framing, setFraming] = useState<FramingResult>({
    ok: false,
    missing: DEFAULT_REQUIRED_JOINTS,
    message: "Menyiapkan sensor...",
  });

  const [sessionStatus, setSessionStatus] = useState<{
    sessionState: "WAITING" | "READY" | "ACTIVE";
    statusMessage: string;
    framingOk: boolean;
    positionOk: boolean;
  }>({
    sessionState: "WAITING",
    statusMessage: "Mundur sedikit",
    framingOk: false,
    positionOk: false,
  });
  const lastSessionStatusRef = useRef(sessionStatus);

  // RuleSet, RepCounter, dan PoseGate
  const ruleSet = getRuleSetForExercise(exerciseId) || SQUAT_RULESET;
  const currentView: "side" | "front" =
    view || (ruleSet.view === "front" ? "front" : "side");
  const counterRef = useRef<RepCounter>(new RepCounter(ruleSet, exerciseId));
  const gateRef = useRef<PoseGate>(new PoseGate(ruleSet, exerciseId, counterRef.current));
  const smootherRef = useRef<LandmarkSmoother>(new LandmarkSmoother(POSE_SMOOTHING_ALPHA));

  const [counterState, setCounterState] = useState<CounterUpdate>({
    phase: "idle",
    repsCount: 0,
    currentScore: 100,
    activeCues: [],
    activeIssues: [],
    lastCompletedRep: null,
    holdTimeSec: 0,
    cleanHoldSec: 0,
    isCalibrated: false,
  });

  // Re-inisialisasi counter & gate saat exerciseId berubah
  useEffect(() => {
    counterRef.current = new RepCounter(ruleSet, exerciseId);
    gateRef.current = new PoseGate(ruleSet, exerciseId, counterRef.current);
    smootherRef.current.reset();
    const initialCounter: CounterUpdate = {
      phase: "idle",
      repsCount: 0,
      currentScore: 100,
      activeCues: [],
      activeIssues: [],
      lastCompletedRep: null,
      holdTimeSec: 0,
      cleanHoldSec: 0,
      isCalibrated: false,
    };
    lastCounterStateRef.current = initialCounter;
    setCounterState(initialCounter);
  }, [exerciseId, ruleSet]);

  const {
    stream,
    status: cameraStatus,
    error: cameraError,
    facingMode,
    startCamera,
    stopCamera,
    toggleFacingMode,
  } = useCamera("user");

  const streamRef = useRef(stream);
  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  const {
    landmarker,
    isReady: landmarkerReady,
    error: landmarkerError,
    delegate: landmarkerDelegate,
  } = usePoseLandmarker();

  const landmarkerDelegateRef = useRef(landmarkerDelegate);
  useEffect(() => {
    landmarkerDelegateRef.current = landmarkerDelegate;
  }, [landmarkerDelegate]);

  const hasLoggedDevInfoRef = useRef(false);

  // Trigger toast repetisi saat ada repetisi baru selesai (tampil 1.2 detik)
  useEffect(() => {
    const lastRep = counterState.lastCompletedRep;
    if (lastRep && lastRep.index > lastRepIndexRef.current) {
      lastRepIndexRef.current = lastRep.index;
      setRepToast({ repNum: lastRep.index, score: lastRep.score });
      const timer = setTimeout(() => {
        setRepToast(null);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [counterState.lastCompletedRep]);

  // Sinkronisasi nilai-nilai dinamis ke useRef agar processFrame stabil dengan dependensi kosong []
  const landmarkerRef = useRef(landmarker);
  useEffect(() => {
    landmarkerRef.current = landmarker;
  }, [landmarker]);

  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  const onPoseDetectedRef = useRef(onPoseDetected);
  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
  }, [onPoseDetected]);

  const ruleSetRef = useRef(ruleSet);
  useEffect(() => {
    ruleSetRef.current = ruleSet;
  }, [ruleSet]);

  const isFileSourceRef = useRef(isFileSource);
  useEffect(() => {
    isFileSourceRef.current = isFileSource;
  }, [isFileSource]);

  const latestLandmarksRef = useRef<any[] | null>(null);
  const latestWorldLandmarksRef = useRef<any[] | null>(null);

  const lastFramingRef = useRef<FramingResult>({
    ok: false,
    missing: DEFAULT_REQUIRED_JOINTS,
    message: "Menyiapkan sensor...",
  });

  const lastCounterStateRef = useRef<CounterUpdate>({
    phase: "idle",
    repsCount: 0,
    currentScore: 100,
    activeCues: [],
    activeIssues: [],
    lastCompletedRep: null,
    holdTimeSec: 0,
    cleanHoldSec: 0,
    isCalibrated: false,
  });

  // Hentikan kamera saat unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stopCamera]);

  // Mode uji file video non-production
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("coachSource") === "file") {
        setIsFileSource(true);
        setStage("active");
      }
    }
  }, []);

  const handleStartFromGuide = () => {
    smootherRef.current.reset();
    if (!isFileSource) {
      startCamera();
    }
    setStage("countdown");
    setCountdown(5);
  };

  // Timer hitung mundur 5 detik
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (stage === "countdown") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setStage("calibrating");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [stage]);

  // Fase kalibrasi baseline 1.5 detik
  useEffect(() => {
    let calibTimer: NodeJS.Timeout;
    if (stage === "calibrating") {
      calibTimer = setTimeout(() => {
        setStage("active");
      }, 1500);
    }
    return () => clearTimeout(calibTimer);
  }, [stage]);

  // Pasang stream kamera ke video element
  useEffect(() => {
    smootherRef.current.reset();
    if (!isFileSource && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [isFileSource, stream]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && videoRef.current) {
      const url = URL.createObjectURL(file);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.loop = true;
      videoRef.current.play().catch(() => {});
    }
  };

  // Loop deteksi frame: STABIL dengan dependensi kosong [], data frame disimpan di ref
  const processFrame = useCallback(() => {
    if (typeof document !== "undefined" && document.hidden) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const currentLandmarker = landmarkerRef.current;
    const isFile = isFileSourceRef.current;

    // Evaluasi koneksi kamera (track live & tidak muted)
    const videoTrack = streamRef.current ? streamRef.current.getVideoTracks()[0] : null;
    const isCameraConnected = isFile || (videoTrack ? (videoTrack.readyState === "live" && !videoTrack.muted) : false);
    if (!isCameraConnected) {
      smootherRef.current.reset();
    }

    if (
      video &&
      canvas &&
      currentLandmarker &&
      video.readyState >= 2 &&
      !video.paused &&
      !video.ended
    ) {
      const now = performance.now();

      // Batasi eksekusi deteksi sekitar 24 FPS
      if (now - lastInferenceTimeRef.current >= FRAME_INTERVAL_MS) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          lastInferenceTimeRef.current = now;

          // (d) Canvas tidak diubah ukurannya tiap frame
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (vw > 0 && vh > 0 && (canvas.width !== vw || canvas.height !== vh)) {
            canvas.width = vw;
            canvas.height = vh;
          }

          // (a) Catat sekali di mode development: delegate dan resolusi aktual
          if (
            process.env.NODE_ENV !== "production" &&
            !hasLoggedDevInfoRef.current &&
            vw > 0 &&
            vh > 0 &&
            landmarkerDelegateRef.current
          ) {
            hasLoggedDevInfoRef.current = true;
            console.log(
              `[FormCoach] Delegate: ${landmarkerDelegateRef.current}, Resolution: ${vw}x${vh}`
            );
          }

          const result = currentLandmarker.detectForVideo(video, now);
          const hasPoses = Boolean(result && result.landmarks && result.landmarks.length > 0);
          const currentLandmarks = hasPoses ? result.landmarks[0] : null;
          const worldLandmarks = hasPoses ? (result.worldLandmarks?.[0] || []) : [];

          // (c) Gambar kerangka HANYA bila ada pose, tanpa memanggil setState per frame
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (currentLandmarks && currentLandmarks.length > 0) {
              const drawingUtils = new DrawingUtils(ctx);
              drawingUtils.drawConnectors(currentLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: "#DFFF00",
                lineWidth: 3,
              });
              drawingUtils.drawLandmarks(currentLandmarks, {
                color: "#FFFFFF",
                fillColor: "#DFFF00",
                lineWidth: 1.5,
                radius: 3.5,
              });
            }
            ctx.restore();
          }

          latestLandmarksRef.current = currentLandmarks;
          latestWorldLandmarksRef.current = worldLandmarks;

          // Evaluasi melalui Gerbang Pose
          const hasValidLandmarks = Boolean(
            isCameraConnected && currentLandmarks && currentLandmarks.length > 0
          );
          if (!hasValidLandmarks) {
            smootherRef.current.reset();
          }
          const smoothedLandmarks = hasValidLandmarks
            ? smootherRef.current.smooth(currentLandmarks!)
            : null;
          const side = smoothedLandmarks ? pickVisibleSide(smoothedLandmarks) : "left";
          const frame: PoseFrame | null = smoothedLandmarks
            ? {
                landmarks: smoothedLandmarks,
                worldLandmarks,
                timestampMs: now,
                side,
              }
            : null;

          const gateResult = gateRef.current.processFrame(frame, {
            cameraConnected: isCameraConnected,
            stage: stageRef.current,
          });

          // Update framing HANYA saat status ok atau teks pesan berubah
          const prevFraming = lastFramingRef.current;
          if (
            gateResult.framing.ok !== prevFraming.ok ||
            gateResult.framing.message !== prevFraming.message
          ) {
            lastFramingRef.current = gateResult.framing;
            setFraming(gateResult.framing);
          }

          // Update sessionStatus (WAITING / READY / ACTIVE)
          const prevSession = lastSessionStatusRef.current;
          if (
            gateResult.sessionState !== prevSession.sessionState ||
            gateResult.statusMessage !== prevSession.statusMessage ||
            gateResult.framing.ok !== prevSession.framingOk ||
            gateResult.positionOk !== prevSession.positionOk
          ) {
            const nextSession = {
              sessionState: gateResult.sessionState,
              statusMessage: gateResult.statusMessage,
              framingOk: gateResult.framing.ok,
              positionOk: gateResult.positionOk,
            };
            lastSessionStatusRef.current = nextSession;
            setSessionStatus(nextSession);
          }

          // Update counterState HANYA saat ada nilai yang berubah
          const update = gateResult.counterUpdate;
          const prev = lastCounterStateRef.current;

          const cuesChanged =
            update.activeCues.length !== prev.activeCues.length ||
            update.activeCues.some((c, i) => c !== prev.activeCues[i]);
          const issuesChanged =
            update.activeIssues.length !== prev.activeIssues.length ||
            update.activeIssues.some((issue, i) => issue.checkId !== prev.activeIssues[i]?.checkId);

          const hasChanged =
            update.repsCount !== prev.repsCount ||
            update.phase !== prev.phase ||
            update.currentScore !== prev.currentScore ||
            update.holdTimeSec !== prev.holdTimeSec ||
            update.cleanHoldSec !== prev.cleanHoldSec ||
            update.isCalibrated !== prev.isCalibrated ||
            update.lastCompletedRep !== prev.lastCompletedRep ||
            cuesChanged ||
            issuesChanged;

          if (hasChanged) {
            lastCounterStateRef.current = update;
            setCounterState(update);
          }

          if (currentLandmarks && onPoseDetectedRef.current) {
            onPoseDetectedRef.current(currentLandmarks, worldLandmarks);
          }

          // (e) Perhitungan FPS di ref & publikasi ke state paling sering 1 kali per detik
          fpsCounterRef.current.frames++;
          if (now - fpsCounterRef.current.lastTime >= 1000) {
            const currentFps = Math.round(
              (fpsCounterRef.current.frames * 1000) / (now - fpsCounterRef.current.lastTime)
            );
            setFps(currentFps);
            setBallisticFps(currentFps);
            fpsCounterRef.current.frames = 0;
            fpsCounterRef.current.lastTime = now;
            fpsCounterRef.current.activeSeconds++;

            if (currentFps < 12) {
              fpsCounterRef.current.consecutiveLowFpsSeconds++;
            } else {
              fpsCounterRef.current.consecutiveLowFpsSeconds = 0;
            }

            // Peringatan FPS rendah (<12) hanya bila rata-rata < 12 selama >= 5 detik berturut-turut,
            // dan tidak muncul dalam 10 detik pertama. Hilang bila membaik.
            if (
              fpsCounterRef.current.activeSeconds >= 10 &&
              fpsCounterRef.current.consecutiveLowFpsSeconds >= 5
            ) {
              setLowFpsWarning(true);
            } else if (currentFps >= 12 || fpsCounterRef.current.consecutiveLowFpsSeconds === 0) {
              setLowFpsWarning(false);
            }
          }
        }
      }
    }
  }, []);

  // Manajemen lifecycle RAF tunggal
  useEffect(() => {
    let animId: number | null = null;
    let isCancelled = false;

    const loop = () => {
      if (isCancelled) return;
      processFrame();
      animId = requestAnimationFrame(loop);
      requestAnimationIdRef.current = animId;
    };

    if (landmarkerReady && stage !== "guide") {
      animId = requestAnimationFrame(loop);
      requestAnimationIdRef.current = animId;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (requestAnimationIdRef.current) {
          cancelAnimationFrame(requestAnimationIdRef.current);
          requestAnimationIdRef.current = null;
        }
        if (animId) {
          cancelAnimationFrame(animId);
          animId = null;
        }
      } else {
        if (!isCancelled && landmarkerReady && stageRef.current !== "guide" && !requestAnimationIdRef.current) {
          animId = requestAnimationFrame(loop);
          requestAnimationIdRef.current = animId;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isCancelled = true;
      if (animId) {
        cancelAnimationFrame(animId);
      }
      if (requestAnimationIdRef.current) {
        cancelAnimationFrame(requestAnimationIdRef.current);
        requestAnimationIdRef.current = null;
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [landmarkerReady, processFrame, stage]);

  const isMirrored = !isFileSource && facingMode === "user";

  const handleRestart = () => {
    counterRef.current = new RepCounter(ruleSet, exerciseId);
    gateRef.current = new PoseGate(ruleSet, exerciseId, counterRef.current);
    smootherRef.current.reset();
    const initialCounter: CounterUpdate = {
      phase: "idle",
      repsCount: 0,
      currentScore: 100,
      activeCues: [],
      activeIssues: [],
      lastCompletedRep: null,
      holdTimeSec: 0,
      cleanHoldSec: 0,
      isCalibrated: false,
    };
    lastCounterStateRef.current = initialCounter;
    setCounterState(initialCounter);
    setSessionStatus({
      sessionState: "WAITING",
      statusMessage: "Mundur sedikit",
      framingOk: false,
      positionOk: false,
    });
    lastHandledRepIndexRef.current = 0;
    continuousTrackingRef.current.clear();
    if (correctionTimerRef.current) {
      clearTimeout(correctionTimerRef.current);
    }
    setVisibleCorrection(null);
    setStage("countdown");
    setCountdown(5);
    setShowSummary(false);
  };

  const handleApplyReps = (summary: FormCoachSummary) => {
    setShowSummary(false);
    onComplete?.(summary);
    onClose?.();
  };

  const handleFinish = () => {
    setShowSummary(false);
    onClose?.();
  };

  // ==========================================================================
  // KEBIJAKAN KOREKSI:
  // 1. Tampilkan satu pil koreksi HANYA bila:
  //    (a) sebuah repetisi baru selesai dan punya issue: tampilkan 1 issue dengan severity tertinggi selama 2 detik; atau
  //    (b) pelanggaran continuous bertahan >= 1000 ms pada keadaan ACTIVE: tampilkan sekali, lalu cue yang sama tidak boleh muncul lagi dalam 6 detik.
  // 2. Tidak ada koreksi saat keadaan sesi bukan ACTIVE.
  // ==========================================================================
  interface ActiveCorrection {
    cue: string;
    severity: "critical" | "major" | "minor";
  }

  const [visibleCorrection, setVisibleCorrection] = useState<ActiveCorrection | null>(null);
  const correctionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastHandledRepIndexRef = useRef<number>(0);
  const continuousTrackingRef = useRef<
    Map<string, { firstSeenMs: number; lastShownMs: number }>
  >(new Map());

  const showCorrection = useCallback((correction: ActiveCorrection, durationMs: number = 2000) => {
    if (correctionTimerRef.current) {
      clearTimeout(correctionTimerRef.current);
    }
    setVisibleCorrection(correction);
    correctionTimerRef.current = setTimeout(() => {
      setVisibleCorrection(null);
    }, durationMs);
  }, []);

  // Bersihkan timer saat unmount
  useEffect(() => {
    return () => {
      if (correctionTimerRef.current) {
        clearTimeout(correctionTimerRef.current);
      }
    };
  }, []);

  // Tidak ada koreksi saat sesi bukan ACTIVE
  useEffect(() => {
    if (sessionStatus.sessionState !== "ACTIVE") {
      if (correctionTimerRef.current) {
        clearTimeout(correctionTimerRef.current);
      }
      setVisibleCorrection(null);
    }
  }, [sessionStatus.sessionState]);

  // (a) Repetisi baru selesai dan punya issue: tampilkan 1 issue severity tertinggi selama 2 detik
  useEffect(() => {
    const lastRep = counterState.lastCompletedRep;
    if (!lastRep || lastRep.index <= lastHandledRepIndexRef.current) {
      return;
    }
    lastHandledRepIndexRef.current = lastRep.index;

    if (sessionStatus.sessionState !== "ACTIVE") {
      return;
    }

    if (lastRep.issues && lastRep.issues.length > 0) {
      const issuesWithCue = lastRep.issues.filter((iss) => Boolean(iss.cue));
      if (issuesWithCue.length > 0) {
        const severityWeight: Record<string, number> = { critical: 3, major: 2, minor: 1 };
        const sorted = [...issuesWithCue].sort(
          (a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0)
        );
        const topIssue = sorted[0];
        if (topIssue?.cue) {
          showCorrection(
            {
              cue: topIssue.cue,
              severity: topIssue.severity,
            },
            2000
          );
        }
      }
    }
  }, [counterState.lastCompletedRep, sessionStatus.sessionState, showCorrection]);

  // (b) Pelanggaran continuous bertahan >= 1000 ms pada keadaan ACTIVE:
  // tampilkan sekali, lalu cue yang sama tidak boleh muncul lagi dalam 6 detik.
  useEffect(() => {
    if (sessionStatus.sessionState !== "ACTIVE") {
      return;
    }

    const now = Date.now();
    const currentIssues = counterState.activeIssues || [];
    const currentCues = new Set<string>();

    for (const issue of currentIssues) {
      if (!issue.cue) continue;
      currentCues.add(issue.cue);

      let tracker = continuousTrackingRef.current.get(issue.cue);
      if (!tracker) {
        tracker = { firstSeenMs: now, lastShownMs: 0 };
        continuousTrackingRef.current.set(issue.cue, tracker);
      } else if (tracker.firstSeenMs === 0) {
        tracker.firstSeenMs = now;
      }

      const duration = now - tracker.firstSeenMs;
      const cooldownPassed = now - tracker.lastShownMs >= 6000;

      if (duration >= 1000 && cooldownPassed) {
        tracker.lastShownMs = now;
        showCorrection(
          {
            cue: issue.cue,
            severity: issue.severity,
          },
          2000
        );
        break; // Tampilkan maksimal 1 koreksi
      }
    }

    // Reset firstSeenMs jika cue sudah tidak aktif di frame saat ini
    for (const [cue, tracker] of continuousTrackingRef.current.entries()) {
      if (!currentCues.has(cue)) {
        tracker.firstSeenMs = 0;
      }
    }
  }, [counterState.activeIssues, sessionStatus.sessionState, showCorrection]);

  // Teks singkat framing (tanpa kalimat panjang)
  const shortFramingText = useMemo(() => {
    const msg = framing.message;
    if (msg.includes("Tubuh tidak terdeteksi") || msg.includes("Mencari tubuh")) {
      return "Tubuh tidak terdeteksi";
    }
    if (msg.includes("Kamera terputus")) {
      return "Kamera terputus";
    }
    if (msg.includes("Mundur")) {
      return "Mundur sedikit";
    }
    if (msg.includes("Maju")) {
      return "Maju sedikit";
    }
    if (msg.includes("Menstabilkan")) {
      return "Menstabilkan...";
    }
    if (framing.ok) {
      return "Posisi siap";
    }
    return "Atur posisi";
  }, [framing.message, framing.ok]);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#080808] overflow-hidden select-none">
      {/* 1. HEADER TIPIS (Judul + Info Tip + Chip FPS + Switch Kamera + Tutup) */}
      <div className="relative px-3 py-2 bg-[#0E0F16] border-b border-zinc-800 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-metric text-sm sm:text-base font-black uppercase text-white tracking-tight truncate">
            {exerciseName}
          </span>
          {equipmentLabel && (
            <span className="hidden sm:inline-block text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-lime-400/10 text-lime-400 border border-lime-400/30">
              {equipmentLabel}
            </span>
          )}
          {cameraTip && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTipPopover((prev) => !prev)}
                className={`p-1 rounded-md border transition-colors ${
                  showTipPopover
                    ? "bg-lime-400/20 border-lime-400 text-lime-300"
                    : "bg-zinc-800/80 border-zinc-700 text-zinc-300 hover:text-white"
                }`}
                title="Petunjuk Kamera"
                aria-label="Petunjuk Posisi Kamera"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showTipPopover && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-64 p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 shadow-2xl backdrop-blur-md">
                  <div className="flex items-center justify-between font-bold text-[10px] uppercase text-lime-400 mb-1">
                    <span>Petunjuk Kamera</span>
                    <button
                      type="button"
                      onClick={() => setShowTipPopover(false)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed text-zinc-300">{cameraTip}</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Dev Chip v3 (Hanya di mode development) */}
          {process.env.NODE_ENV !== "production" && (
            <div className="px-1.5 py-0.5 rounded bg-zinc-800/90 border border-zinc-700 text-[10px] font-mono text-zinc-300">
              v3 • {sessionStatus.sessionState} • framing:{sessionStatus.framingOk ? "ok" : "!ok"} • pos:{sessionStatus.positionOk ? "ok" : "!ok"}
            </div>
          )}

          {/* Chip FPS Kecil & Ikon Peringatan (bukan banner) */}
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/60 border border-zinc-700/80 text-[11px] font-mono font-bold text-zinc-300"
            title={
              lowFpsWarning
                ? `Performa rendah (${fps} FPS). Tutup aplikasi lain atau gunakan ruangan lebih terang.`
                : `${fps} FPS`
            }
          >
            <span>{fps} FPS</span>
            {lowFpsWarning && (
              <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
            )}
            {ruleSet.id === "hinge-ballistic" && fps > 0 && fps < 24 && !lowFpsWarning && (
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            )}
          </div>

          {/* Toggle Kamera (User / Environment) */}
          {!isFileSource && (
            <button
              type="button"
              onClick={toggleFacingMode}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 transition-colors"
              title="Ganti Kamera Depan/Belakang"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Tombol Tutup */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white transition-colors"
              aria-label="Tutup Form Coach"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. AREA KAMERA (Mengisi sisa tinggi layar, video object-contain, canvas menumpuk) */}
      <div className="relative flex-1 min-h-0 w-full bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-contain ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />

        {/* PESAN STATUS: Pil kecil tunggal di pojok kiri atas area kamera (hilang saat ACTIVE) */}
        {stage !== "guide" && sessionStatus.sessionState !== "ACTIVE" && sessionStatus.statusMessage && (
          <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-metric font-bold tracking-wide backdrop-blur-sm shadow-md border ${
                sessionStatus.sessionState === "READY"
                  ? "bg-black/70 text-lime-400 border-lime-400/30"
                  : "bg-black/75 text-amber-400 border-amber-400/40"
              }`}
            >
              {sessionStatus.sessionState === "READY" ? (
                <CheckCircle2 className="w-3 h-3 text-lime-400 shrink-0 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0 stroke-[2.5]" />
              )}
              <span>{sessionStatus.statusMessage}</span>
            </div>
          </div>
        )}

        {/* TOAST REPETISI: Pil kecil di pojok kanan atas area kamera (1.2 detik) */}
        {repToast && (
          <div className="absolute top-2.5 right-2.5 z-20 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#DFFF00] text-black px-2.5 py-1 rounded-full font-metric font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>
                Rep {repToast.repNum}{repToast.score !== undefined ? ` • ${repToast.score}` : ""}
              </span>
            </div>
          </div>
        )}

        {/* PIL KOREKSI: Maksimal 1, latar hitam ~70%, tinggi <= 32 px, teks 1 baris, tanpa label severity (cukup titik merah/kuning), di tepi bawah area kamera, pointer-events-none */}
        {visibleCorrection && sessionStatus.sessionState === "ACTIVE" && (
          <div className="absolute bottom-2.5 inset-x-0 z-20 flex justify-center pointer-events-none px-3">
            <div className="h-8 max-w-[90%] px-3 py-1 bg-black/70 backdrop-blur-sm border border-neutral-700/60 rounded-full flex items-center gap-2 shadow-lg pointer-events-none animate-in fade-in slide-in-from-bottom-1 duration-150">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  visibleCorrection.severity === "critical"
                    ? "bg-red-500 animate-pulse"
                    : "bg-amber-400"
                }`}
              />
              <span className="text-xs font-semibold text-white truncate leading-none">
                {visibleCorrection.cue}
              </span>
            </div>
          </div>
        )}

        {/* OVERLAY: Setup Guide (Sebelum kamera aktif) */}
        {stage === "guide" && (
          <SetupGuide
            exerciseName={exerciseName}
            view={currentView}
            cameraTip={cameraTip}
            onStart={handleStartFromGuide}
          />
        )}

        {/* OVERLAY: Hitung Mundur 5s */}
        {stage === "countdown" && (
          <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#DFFF00] text-black font-metric font-black text-4xl flex items-center justify-center shadow-2xl">
              {countdown}
            </div>
            <span className="font-metric text-xs font-bold uppercase tracking-wider text-white mt-3">
              {currentView === "front" ? "Hadap Lurus ke Kamera..." : "Ambil Posisi Samping..."}
            </span>
          </div>
        )}

        {/* OVERLAY: Kalibrasi Baseline 1.5s */}
        {stage === "calibrating" && (
          <div className="absolute top-10 inset-x-4 z-30 flex justify-center pointer-events-none">
            <div className="bg-lime-400/95 text-black px-3 py-1 rounded-full font-metric font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-lime-500">
              <ShieldCheck className="w-3.5 h-3.5 text-black" />
              <span>Kalibrasi tinggi badan...</span>
            </div>
          </div>
        )}

        {/* OVERLAY: Loading Model */}
        {!landmarkerReady && !landmarkerError && stage !== "guide" && (
          <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center gap-2 text-center p-4">
            <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
            <span className="font-metric text-xs font-bold uppercase text-zinc-300 tracking-wider">
              Memuat AI Model...
            </span>
          </div>
        )}

        {/* OVERLAY: Error Kamera */}
        {cameraError && !isFileSource && (
          <div className="absolute inset-0 z-30 bg-black/90 p-4 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 stroke-[2.5]" />
            </div>
            <h4 className="font-metric text-sm font-bold uppercase text-white mb-1">
              Kendala Kamera
            </h4>
            <p className="text-xs text-zinc-300 max-w-xs mb-3 leading-relaxed">
              {cameraError}
            </p>
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-3.5 py-1.5 rounded-lg bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* OVERLAY: Error Model */}
        {landmarkerError && (
          <div className="absolute inset-0 z-30 bg-black/90 p-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-7 h-7 text-rose-400 mb-1.5" />
            <h4 className="font-metric text-sm font-bold text-white mb-1">
              Gagal Memuat Model
            </h4>
            <p className="text-xs text-zinc-400 max-w-xs">{landmarkerError}</p>
          </div>
        )}

        {/* File video source selector non-production */}
        {process.env.NODE_ENV !== "production" && isFileSource && (
          <div className="absolute top-2 left-2 z-20">
            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-lime-400/50 text-white text-[11px] font-metric font-bold uppercase cursor-pointer shadow-lg">
              <Upload className="w-3 h-3 text-lime-400" />
              <span>Video Uji</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* 3. BILAH BAWAH TIPIS (SEBAGAI BARIS TERPISAH DI BAWAH VIDEO) */}
      <FeedbackPanel
        mode={ruleSet.mode}
        repsCount={counterState.repsCount}
        currentScore={counterState.currentScore}
        activeIssues={counterState.activeIssues}
        activeCue={visibleCorrection?.cue}
        lastCompletedRep={counterState.lastCompletedRep}
        holdTimeSec={counterState.holdTimeSec}
        cleanHoldSec={counterState.cleanHoldSec}
        phase={counterState.phase}
        scored={ruleSet.scored}
        banner={ruleSet.banner}
        onFinish={() => setShowSummary(true)}
      />

      {/* RESULT SUMMARY MODAL */}
      {showSummary && (
        <ResultSummary
          exerciseName={exerciseName}
          mode={ruleSet.mode}
          reps={counterRef.current.getCompletedReps()}
          holdResult={ruleSet.mode === "hold" ? counterRef.current.getHoldResult() : null}
          banner={ruleSet.banner}
          scored={ruleSet.scored}
          onRestart={handleRestart}
          onFinish={handleFinish}
          onApplyReps={handleApplyReps}
        />
      )}
    </div>
  );
};
export default CameraStage;
