"use client";

import React, { useState } from "react";
import {
  X,
  Play,
  Lightbulb,
  Wind,
  CheckCircle2,
  ShieldAlert,
  BarChart3,
  Dumbbell,
  Check,
  Sparkles,
  BookOpen
} from "lucide-react";
import { ExerciseDetail } from "@/data/exercises";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface TutorialModalProps {
  exercise: ExerciseDetail | null;
  onClose: () => void;
  onSelectForWorkout?: (exercise: ExerciseDetail) => void;
  isSelected?: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  exercise,
  onClose,
  onSelectForWorkout,
  isSelected = false
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "guide">("video");

  if (!exercise) return null;

  const embedUrl = getYouTubeEmbedUrl(exercise.videoUrl, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0f121a] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-gray-800 flex items-start justify-between bg-gray-900/60">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight mb-2">
              {exercise.name}
            </h2>
            {/* Badges like workout.cool */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-violet-900/40 text-violet-300 border border-violet-700/50">
                Kekuatan
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-blue-900/40 text-blue-300 border border-blue-700/50">
                {exercise.primaryMuscleName}
              </span>
              {exercise.secondaryMuscleNames.map((sec, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-sky-950/60 text-sky-300 border border-sky-800/40"
                >
                  +{sec}
                </span>
              ))}
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase bg-orange-950/60 text-orange-400 border border-orange-800/40">
                {exercise.equipmentLabel}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                {exercise.difficulty}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Tabs matching workout.cool */}
        <div className="grid grid-cols-2 bg-gray-950 border-b border-gray-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab("video")}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === "video"
                ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/5"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Play className="w-4 h-4 fill-current" /> Video 3D Anatomi
          </button>
          <button
            onClick={() => setActiveTab("guide")}
            className={`py-3 flex items-center justify-center gap-2 transition-all ${
              activeTab === "guide"
                ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/5"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Panduan & Keamanan
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* TAB 1: VIDEO 3D ANATOMICAL DEMONSTRATION (WORKOUT-COOL STYLE) */}
          {activeTab === "video" && (
            <div className="space-y-4">
              {/* Introduction paragraph with muscle highlights (like workout-cool) */}
              <div className="text-sm text-gray-300 leading-relaxed bg-gray-900/30 p-3.5 rounded-xl border border-gray-800/60">
                Latihan <strong className="text-white font-bold">{exercise.name}</strong> sangat efektif untuk mengaktifkan otot{" "}
                <strong className="text-blue-400 underline decoration-blue-500/30">{exercise.primaryMuscleName}</strong>
                {exercise.secondaryMuscleNames.length > 0 && (
                  <>
                    , serta melibatkan otot pendukung{" "}
                    <span className="text-sky-300 font-medium">
                      {exercise.secondaryMuscleNames.join(", ")}
                    </span>
                  </>
                )}
                . {exercise.summary}
              </div>

              {/* Seamless 16:9 Looped 3D Player */}
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-800 shadow-2xl">
                <iframe
                  src={embedUrl}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              </div>

              {/* Numbered Steps directly below the video */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Langkah Gerakan (Step-by-Step Form)
                </h4>
                <div className="space-y-2">
                  {exercise.tutorial.setup.concat(exercise.tutorial.movement).map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-900/40 border border-gray-800/40 text-xs">
                      <span className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-[11px] shrink-0 border border-blue-500/30">
                        {idx + 1}
                      </span>
                      <span className="text-gray-300 leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BIOMECHANICS & BEGINNER SAFETY */}
          {activeTab === "guide" && (
            <div className="space-y-4">
              {/* Pernapasan */}
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30">
                <div className="flex items-center gap-2 mb-2 text-cyan-400 font-bold text-xs">
                  <Wind className="w-4 h-4" /> Pola Pernapasan
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {exercise.tutorial.breathing}
                </p>
              </div>

              {/* Kesalahan Umum yang Harus Dihindari */}
              <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-800/30">
                <div className="flex items-center gap-2 mb-2.5 text-rose-400 font-bold text-xs">
                  <ShieldAlert className="w-4 h-4" /> Kesalahan Fatal Pemula (Risiko Cedera)
                </div>
                <ul className="space-y-2">
                  {exercise.tutorial.mistakes.map((mistake, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Kiat Pro */}
              <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30">
                <div className="flex items-center gap-2 mb-1.5 text-amber-400 font-bold text-xs">
                  <Lightbulb className="w-4 h-4" /> Kiat Pelatih (Cues Mental)
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {exercise.tutorial.proTip}
                </p>
              </div>

              {/* Bukti Jurnal Ilmiah & Biomekanika */}
              {exercise.researchCitation && (
                <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-700/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                      <BookOpen className="w-4 h-4 text-blue-400" /> Referensi Jurnal & Biomekanika
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Peer-Reviewed
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-gray-200">
                    {exercise.researchCitation.study} —{" "}
                    <span className="text-blue-400/90 italic">
                      {exercise.researchCitation.journal}
                    </span>
                  </div>
                  <p className="text-xs text-gray-300/90 leading-relaxed">
                    {exercise.researchCitation.findings}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Format demonstrasi 3D anatomi berulang</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
            {onSelectForWorkout && (
              <button
                onClick={() => {
                  onSelectForWorkout(exercise);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? "bg-emerald-600 text-white hover:bg-emerald-500"
                    : "bg-blue-600 text-white hover:bg-blue-500"
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4" /> Terpilih
                  </>
                ) : (
                  <>
                    <Dumbbell className="w-4 h-4" /> Masukkan ke Latihan
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
