"use client";

import React, { useEffect } from "react";
import dynamic from "next/dynamic";
import { X, Video, ShieldAlert, Sparkles, Activity } from "lucide-react";
import { ExerciseDetail } from "@/data/exercises";
import { FormCoachSummary } from "./ResultSummary";

// Muat CameraStage via next/dynamic dengan { ssr: false } karena membutuhkan browser API (Canvas, WebAssembly, getUserMedia)
const CameraStage = dynamic(
  () => import("./CameraStage").then((mod) => mod.CameraStage),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] bg-[#080808] rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6 border border-zinc-800">
        <div className="w-9 h-9 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="font-metric text-xs font-bold uppercase text-zinc-300 tracking-wider">
          Menyiapkan Panggung AI Form Coach...
        </span>
      </div>
    ),
  }
);

interface FormCoachModalProps {
  exercise: ExerciseDetail | null;
  onClose: () => void;
  onComplete?: (summary: FormCoachSummary) => void;
}

export const FormCoachModal: React.FC<FormCoachModalProps> = ({
  exercise,
  onClose,
  onComplete,
}) => {
  // Cegah scroll latar belakang saat modal aktif & dukungan tombol Escape keyboard
  useEffect(() => {
    if (exercise) {
      document.body.style.overflow = "hidden";
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [exercise, onClose]);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 motion-reduce:animate-none">
      <div className="relative w-full max-w-4xl bg-[#0C0D12] border-2 border-zinc-800 rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[96vh] my-auto animate-in slide-in-from-bottom-4 duration-300 motion-reduce:animate-none">
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center justify-between bg-[#12131A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-lime-400 text-black flex items-center justify-center font-bold shadow-md shadow-lime-400/20">
              <Activity className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-metric text-lg sm:text-xl font-black uppercase tracking-tight text-white">
                  FORM COACH (AI REAL-TIME)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-lime-400 text-black font-metric">
                  BETA FASE 2
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="font-bold text-white">{exercise.name}</span>
                <span>•</span>
                <span className="text-lime-400 font-bold uppercase">{exercise.equipmentLabel}</span>
              </div>
            </div>
          </div>

          {/* Tombol Tutup Modal (Unmount dan Matikan Kamera) */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Form Coach"
            className="p-2.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY: Camera Stage */}
        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-center overflow-hidden bg-[#080808]">
          {exercise.formCoach?.cameraTip && (
            <div className="mb-2 px-3 py-1.5 rounded-xl bg-lime-400/10 border border-lime-400/30 text-lime-400 text-xs font-sans flex items-center gap-2">
              <span className="font-metric font-black uppercase text-[10px] px-1.5 py-0.5 rounded bg-lime-400 text-black">
                TIP KAMERA
              </span>
              <span className="truncate">{exercise.formCoach.cameraTip}</span>
            </div>
          )}
          <div className="w-full flex-1 min-h-[400px] flex items-center justify-center">
            <CameraStage
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              onClose={onClose}
              onComplete={onComplete}
            />
          </div>

          {/* Panduan Privasi & Keamanan Bawah */}
          <div className="mt-3 px-3 py-2 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between text-[11px] text-zinc-400 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Privasi Terjamin: Pemrosesan visual 100% lokal di browser, tanpa pengiriman video ke server.</span>
            </div>
            <span className="hidden sm:inline font-mono text-[10px] text-zinc-500">
              MediaPipe PoseLandmarker Lite
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
