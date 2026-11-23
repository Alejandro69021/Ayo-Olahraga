"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { PoseLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";
import { useCamera } from "@/hooks/useCamera";
import { usePoseLandmarker } from "@/hooks/usePoseLandmarker";
import { checkFraming, FramingResult } from "@/lib/pose/framing";
import { pickVisibleSide } from "@/lib/pose/geometry";
import { RepCounter, CounterUpdate } from "@/lib/pose/rep-counter";
import {
  SQUAT_RULESET,
  getRuleSetForExercise,
  setBallisticFps,
} from "@/lib/pose/rules/config";
import { PoseFrame } from "@/lib/pose/rules/types";
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
import { RefreshCw, Upload, AlertCircle, CheckCircle2, Flag, AlertTriangle, ShieldCheck } from "lucide-react";

interface CameraStageProps {
  exerciseId?: string;
  exerciseName?: string;
  view?: "side" | "front";
  cameraTip?: string;
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

// Batas deteksi sekitar 24 FPS untuk efisiensi CPU, GPU & baterai
const TARGET_FPS = 24;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;

export const CameraStage: React.FC<CameraStageProps> = ({
  exerciseId = "bw-air-squat",
  exerciseName = "Air Squat",
  view,
  cameraTip,
  onPoseDetected,
  onClose,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestAnimationIdRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const lastInferenceTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef({ frames: 0, lastTime: performance.now(), activeSeconds: 0 });

  // Status tahapan: guide -> countdown (5s) -> calibrating (1.5s) -> active
  const [stage, setStage] = useState<"guide" | "countdown" | "calibrating" | "active">("guide");
  const [countdown, setCountdown] = useState<number>(5);

  const [isFileSource, setIsFileSource] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(0);
  const [lowFpsWarning, setLowFpsWarning] = useState<boolean>(false);
  const [showSummary, setShowSummary] = useState<boolean>(false);
  const [framing, setFraming] = useState<FramingResult>({
    ok: false,
    missing: DEFAULT_REQUIRED_JOINTS,
    message: "Menyiapkan sensor dan kamera...",
  });

  // RuleSet dan RepCounter
  const ruleSet = getRuleSetForExercise(exerciseId) || SQUAT_RULESET;
  const currentView: "side" | "front" =
    view || (ruleSet.view === "front" ? "front" : "side");
  const counterRef = useRef<RepCounter>(new RepCounter(ruleSet, exerciseId));

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

  // Re-inisialisasi counter saat exerciseId berubah
  useEffect(() => {
    counterRef.current = new RepCounter(ruleSet, exerciseId);
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

  const { landmarker, isReady: landmarkerReady, error: landmarkerError } = usePoseLandmarker();

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
    message: "Menyiapkan sensor dan kamera...",
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

  // SELALU matikan kamera saat komponen ditutup / unmount
  useEffect(() => {
    return () => {
      stopCamera();
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [stopCamera]);

  // Mode uji file lokal HANYA aktif saat non-production
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("coachSource") === "file") {
        setIsFileSource(true);
        setStage("active"); // Langsung aktif bila mode video file
      }
    }
  }, []);

  // Mulai kamera saat pengguna menekan MULAI pada SetupGuide
  const handleStartFromGuide = () => {
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

  // Fase kalibrasi baseline 1.5 detik dengan pesan "Berdiri diam sebentar"
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
    if (!isFileSource && videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [isFileSource, stream]);

  // Handle upload video file lokal untuk dev testing non-production
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

    if (
      video &&
      canvas &&
      currentLandmarker &&
      video.readyState >= 2 &&
      !video.paused &&
      !video.ended
    ) {
      const now = performance.now();

      // Batasi eksekusi deteksi sekitar 24 FPS (interval ~41.6ms)
      if (now - lastInferenceTimeRef.current >= FRAME_INTERVAL_MS) {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          lastInferenceTimeRef.current = now;

          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
          }

          const result = currentLandmarker.detectForVideo(video, now);

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (result && result.landmarks && result.landmarks.length > 0) {
              const currentLandmarks = result.landmarks[0];
              const worldLandmarks = result.worldLandmarks?.[0] || [];

              // Simpan data landmark terakhir di ref (tanpa re-render)
              latestLandmarksRef.current = currentLandmarks;
              latestWorldLandmarksRef.current = worldLandmarks;

              // Gambar kerangka sendi MediaPipe
              const drawingUtils = new DrawingUtils(ctx);
              drawingUtils.drawConnectors(currentLandmarks, PoseLandmarker.POSE_CONNECTIONS, {
                color: "#DFFF00",
                lineWidth: 3.5,
              });
              drawingUtils.drawLandmarks(currentLandmarks, {
                color: "#FFFFFF",
                fillColor: "#DFFF00",
                lineWidth: 1.5,
                radius: 4,
              });

              // Evaluasi framing posisi tubuh pengguna
              const currentRuleSet = ruleSetRef.current;
              const requiredJoints = currentRuleSet.requiredLandmarks || DEFAULT_REQUIRED_JOINTS;
              const check = checkFraming(currentLandmarks, requiredJoints);

              // Update framing HANYA saat status ok atau teks pesan berubah
              const prevFraming = lastFramingRef.current;
              if (check.ok !== prevFraming.ok || check.message !== prevFraming.message) {
                lastFramingRef.current = check;
                setFraming(check);
              }

              // Jalankan RepCounter & Form Evaluator HANYA jika sudah melewati hitung mundur
              const currentStage = stageRef.current;
              if (currentStage === "calibrating" || currentStage === "active") {
                const side = pickVisibleSide(currentLandmarks);
                const frame: PoseFrame = {
                  landmarks: currentLandmarks,
                  worldLandmarks,
                  timestampMs: now,
                  side,
                };

                const update = counterRef.current.update(frame);
                const prev = lastCounterStateRef.current;

                // Bandingkan apakah ada nilai UI yang berubah sebelum memanggil setState
                const cuesChanged =
                  update.activeCues.length !== prev.activeCues.length ||
                  update.activeCues.some((c, i) => c !== prev.activeCues[i]);

                const issuesChanged = update.activeIssues.length !== prev.activeIssues.length;

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
              }

              if (onPoseDetectedRef.current) {
                onPoseDetectedRef.current(currentLandmarks, worldLandmarks);
              }
            } else {
              latestLandmarksRef.current = null;
              latestWorldLandmarksRef.current = null;

              const noBodyCheck: FramingResult = {
                ok: false,
                missing: DEFAULT_REQUIRED_JOINTS,
                message: "Tubuh tidak terdeteksi — silakan berdiri di depan kamera.",
              };
              const prevFraming = lastFramingRef.current;
              if (noBodyCheck.ok !== prevFraming.ok || noBodyCheck.message !== prevFraming.message) {
                lastFramingRef.current = noBodyCheck;
                setFraming(noBodyCheck);
              }
            }
            ctx.restore();
          }

          // Perhitungan FPS di ref & publikasi ke state paling sering 1 kali per detik
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

            if (fpsCounterRef.current.activeSeconds >= 3 && currentFps < 12) {
              setLowFpsWarning((prev) => (prev ? prev : true));
            } else if (currentFps >= 12) {
              setLowFpsWarning((prev) => (!prev ? prev : false));
            }
          }
        }
      }
    }
  }, []);

  // Manajemen lifecycle RAF tunggal & event visibilitychange tab
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
    setCounterState({
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

  return (
    <div className="relative w-full h-full min-h-[460px] bg-[#080808] rounded-2xl overflow-hidden flex items-center justify-center select-none border border-zinc-800">
      {/* 1. LAYAR PANDUAN AWAL (Sebelum kamera menyala) */}
      {stage === "guide" && (
        <SetupGuide
          exerciseName={exerciseName}
          view={currentView}
          cameraTip={cameraTip}
          onStart={handleStartFromGuide}
        />
      )}

      {/* Video & Canvas Stacking Container */}
      <div className="relative w-full h-full flex items-center justify-center">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`w-full h-full object-cover max-h-[80vh] ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none ${
            isMirrored ? "-scale-x-100" : ""
          }`}
        />
      </div>

      {/* 2. OVERLAY HITUNG MUNDUR (5 Detik) */}
      {stage === "countdown" && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
          <div className="w-24 h-24 rounded-full bg-[#DFFF00] text-black font-metric font-black text-6xl flex items-center justify-center shadow-2xl animate-ping duration-1000 motion-reduce:animate-none">
            {countdown}
          </div>
          <span className="font-metric text-lg font-bold uppercase tracking-wider text-white mt-4">
            {currentView === "front" ? "Hadap Lurus ke Kamera..." : "Ambil Posisi Samping..."}
          </span>
        </div>
      )}

      {/* 3. OVERLAY KALIBRASI (1.5 Detik) */}
      {stage === "calibrating" && (
        <div className="absolute top-16 inset-x-4 z-30 flex justify-center pointer-events-none">
          <div className="bg-lime-400 text-black px-4 py-2 rounded-2xl font-metric font-black text-sm uppercase tracking-wider shadow-2xl flex items-center gap-2 animate-pulse motion-reduce:animate-none border border-lime-500">
            <ShieldCheck className="w-5 h-5 text-black" />
            <span>Berdiri diam sebentar — AI sedang mengalibrasi tinggi badan</span>
          </div>
        </div>
      )}

      {/* PERINGATAN FPS RENDAH (< 12 FPS) */}
      {lowFpsWarning && (
        <div className="absolute top-16 inset-x-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-amber-950/90 border border-amber-500/80 text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-sans flex items-center gap-2 shadow-xl backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Performa rendah ({fps} FPS). Tutup aplikasi lain atau gunakan ruangan lebih terang.</span>
          </div>
        </div>
      )}

      {/* PERINGATAN FPS BALLISTIC (< 24 FPS) */}
      {ruleSet.id === "hinge-ballistic" && fps > 0 && fps < 24 && (
        <div className="absolute top-16 inset-x-4 z-20 flex justify-center pointer-events-none">
          <div className="bg-amber-950/90 border border-amber-500/80 text-amber-200 px-3.5 py-1.5 rounded-xl text-xs font-sans flex items-center gap-2 shadow-xl backdrop-blur-md">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Gerakan cepat butuh kamera ≥ 30 fps; hasil kurang akurat</span>
          </div>
        </div>
      )}

      {/* TOP OVERLAY: Banner Framing & Switcher & Selesaikan Sesi & FPS */}
      {stage !== "guide" && (
        <div className="absolute top-3 inset-x-3 flex flex-col gap-2 z-20 pointer-events-none">
          <div className="flex items-center justify-between gap-2">
            {/* Status Framing Banner */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-metric font-bold uppercase tracking-wider backdrop-blur-md shadow-lg border transition-all ${
                framing.ok
                  ? "bg-black/80 text-lime-400 border-lime-400/40"
                  : "bg-black/85 text-amber-400 border-amber-400/50"
              }`}
            >
              {framing.ok ? (
                <CheckCircle2 className="w-4 h-4 stroke-[2.5] text-lime-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 stroke-[2.5] text-amber-400 shrink-0" />
              )}
              <span className="truncate">{framing.message}</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              {/* Tombol Selesaikan Sesi */}
              <button
                type="button"
                onClick={() => setShowSummary(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700 text-white text-xs font-metric font-bold uppercase tracking-wider transition-all shadow-md"
              >
                <Flag className="w-3.5 h-3.5 text-[#DFFF00]" />
                <span className="hidden sm:inline">Selesai Sesi</span>
              </button>

              {/* FPS Indicator (Dev Mode) */}
              <div className="px-2.5 py-1 rounded-lg bg-black/80 border border-zinc-700/80 text-[11px] font-mono font-bold text-zinc-300">
                {fps} FPS
              </div>

              {/* Toggle Camera Facing (User / Environment) bila bukan mode file */}
              {!isFileSource && (
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 transition-colors"
                  title="Ganti Kamera Depan/Belakang"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Banner Akurasi Terbatas untuk RuleSet scored === false atau custom banner */}
          {(ruleSet.scored === false || ruleSet.banner) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[11px] font-sans font-semibold backdrop-blur-md shadow-md w-fit">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{ruleSet.banner || "Akurasi terbatas untuk gerakan ini"}</span>
            </div>
          )}
        </div>
      )}

      {/* FEEDBACK PANEL: Tampil saat fase aktif */}
      {stage === "active" && (
        <FeedbackPanel
          mode={ruleSet.mode}
          repsCount={counterState.repsCount}
          currentScore={counterState.currentScore}
          activeIssues={counterState.activeIssues}
          lastCompletedRep={counterState.lastCompletedRep}
          holdTimeSec={counterState.holdTimeSec}
          cleanHoldSec={counterState.cleanHoldSec}
          phase={counterState.phase}
          scored={ruleSet.scored}
        />
      )}

      {/* RESULT SUMMARY MODAL OVERLAY */}
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

      {/* MODE PENGUJIAN FILE TANPA WEBCAM (?coachSource=file) HANYA DI NON-PRODUCTION */}
      {process.env.NODE_ENV !== "production" && isFileSource && (
        <div className="absolute top-16 left-3 z-20">
          <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-lime-400/50 text-white text-xs font-metric font-bold uppercase tracking-wider cursor-pointer shadow-xl transition-all">
            <Upload className="w-4 h-4 text-lime-400" />
            <span>Pilih Video Uji (.mp4 / .webm)</span>
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {/* ERROR OVERLAY: Izin Ditolak / Kamera Tidak Tersedia */}
      {cameraError && !isFileSource && (
        <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-3">
            <AlertCircle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <h4 className="font-metric text-lg font-bold uppercase text-white mb-1">
            Kendala Akses Kamera
          </h4>
          <p className="text-xs text-zinc-300 max-w-sm mb-4 leading-relaxed font-sans">
            {cameraError}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-4 py-2 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Coba Lagi
            </button>
            {process.env.NODE_ENV !== "production" && (
              <button
                type="button"
                onClick={() => setIsFileSource(true)}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-metric font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Mode Uji File Video
              </button>
            )}
          </div>
        </div>
      )}

      {/* MODEL LOADING OVERLAY */}
      {!landmarkerReady && !landmarkerError && stage !== "guide" && (
        <div className="absolute inset-0 z-20 bg-black/80 flex flex-col items-center justify-center gap-2 text-center p-4">
          <div className="w-8 h-8 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
          <span className="font-metric text-xs font-bold uppercase text-zinc-300 tracking-wider">
            Memuat Model AI Pose Landmarker...
          </span>
        </div>
      )}

      {/* MODEL ERROR OVERLAY */}
      {landmarkerError && (
        <div className="absolute inset-0 z-30 bg-black/90 p-6 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-8 h-8 text-rose-400 mb-2" />
          <h4 className="font-metric text-base font-bold text-white mb-1">
            Gagal Memuat Model AI
          </h4>
          <p className="text-xs text-zinc-400 max-w-xs">{landmarkerError}</p>
        </div>
      )}
    </div>
  );
};
export default CameraStage;
