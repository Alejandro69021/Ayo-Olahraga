"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Play,
  Lightbulb,
  Wind,
  ShieldAlert,
  Dumbbell,
  Check,
  Sparkles,
  BookOpen,
  ChevronDown,
  Layers,
  Activity,
  Camera,
  WifiOff,
} from "lucide-react";
import { ExerciseDetail } from "@/data/exercises";
import { getYouTubeEmbedUrl } from "@/lib/youtube";

interface TutorialModalProps {
  exercise: ExerciseDetail | null;
  onClose: () => void;
  onSelectForWorkout?: (exercise: ExerciseDetail) => void;
  onStartFormCoach?: (exercise: ExerciseDetail) => void;
  isSelected?: boolean;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  exercise,
  onClose,
  onSelectForWorkout,
  onStartFormCoach,
  isSelected = false,
}) => {
  // Accordion state: default open steps
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    steps: true,
    safety: false,
    science: false,
  });

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? !navigator.onLine : false;
  });

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!exercise) return null;

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const embedUrl = exercise.videoUrl
    ? getYouTubeEmbedUrl(exercise.videoUrl, true)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0c0e14] border border-gray-800/90 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-gray-800/80 flex items-start justify-between bg-gray-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30">
                {exercise.equipmentLabel}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400 border border-blue-500/30">
                {exercise.primaryMuscleName}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                {exercise.difficulty}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
              {exercise.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Video First, Accordion Below */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          {/* Primary Focal Point: 16:9 Looped 3D Video Demo / Offline Notice */}
          {!embedUrl ? (
            <p className="text-xs text-gray-400 bg-gray-900/40 px-3 py-2 rounded-xl border border-gray-800/50">
              Video belum tersedia
            </p>
          ) : (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-800 shadow-xl group">
              {isOffline ? (
                <div className="w-full h-full bg-neutral-950 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                    <WifiOff className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="font-metric text-base sm:text-lg font-bold uppercase tracking-wide text-white mb-1">
                    Video butuh koneksi internet
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    Mode offline aktif. Anda tetap dapat mengikuti instruksi teknik lengkap pada panduan langkah di bawah.
                  </p>
                </div>
              ) : (
                <iframe
                  src={embedUrl}
                  title={exercise.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>
          )}

          {/* Muscle Summary Snippet */}
          <p className="text-xs text-gray-400 leading-relaxed bg-gray-900/40 p-3 rounded-xl border border-gray-800/50">
            <strong className="text-gray-200">Fokus Target: </strong>
            Mengaktifkan secara intensif{" "}
            <span className="text-blue-400 font-semibold">{exercise.primaryMuscleName}</span>
            {exercise.secondaryMuscleNames.length > 0 && (
              <>
                {" "}dan otot pendukung{" "}
                <span className="text-gray-300">
                  {exercise.secondaryMuscleNames.join(", ")}
                </span>
              </>
            )}
            . {exercise.summary}
          </p>

          {/* Sleek Accordions for Instructions */}
          <div className="space-y-2.5 pt-1">
            {/* Accordion 1: Form & Movement Steps */}
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
              <button
                type="button"
                onClick={() => toggleSection("steps")}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-200 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-white">
                  <Layers className="w-4 h-4 text-orange-400" />
                  <span>1. Panduan Langkah Eksekusi (Form & Steps)</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    openSections.steps ? "rotate-180 text-orange-400" : ""
                  }`}
                />
              </button>

              {openSections.steps && (
                <div className="p-4 pt-1 border-t border-gray-800/60 space-y-2.5 text-xs text-gray-300">
                  <div className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider pt-1">
                    Setup & Posisi:
                  </div>
                  {exercise.tutorial.setup.map((s, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{s}</span>
                    </div>
                  ))}

                  <div className="font-semibold text-gray-400 text-[11px] uppercase tracking-wider pt-2">
                    Gerakan Inti:
                  </div>
                  {exercise.tutorial.movement.map((m, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        {exercise.tutorial.setup.length + i + 1}
                      </span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Accordion 2: Breathing & Safety */}
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
              <button
                type="button"
                onClick={() => toggleSection("safety")}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-200 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-white">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>2. Pola Pernapasan & Peringatan Kesalahan</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    openSections.safety ? "rotate-180 text-rose-400" : ""
                  }`}
                />
              </button>

              {openSections.safety && (
                <div className="p-4 pt-1 border-t border-gray-800/60 space-y-3 text-xs">
                  <div>
                    <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[11px] uppercase tracking-wider mb-1">
                      <Wind className="w-3.5 h-3.5" /> Ritme Pernapasan
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {exercise.tutorial.breathing}
                    </p>
                  </div>

                  <div>
                    <div className="text-rose-400 font-bold text-[11px] uppercase tracking-wider mb-1.5">
                      Kesalahan Fatal yang Wajib Dihindari:
                    </div>
                    <ul className="space-y-1.5">
                      {exercise.tutorial.mistakes.map((mis, i) => (
                        <li key={i} className="flex items-start gap-2 text-gray-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                          <span>{mis}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Accordion 3: Pro Tips & Scientific Validation */}
            <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-900/30">
              <button
                type="button"
                onClick={() => toggleSection("science")}
                className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-gray-200 hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-white">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>3. Kiat Pelatih & Referensi Riset Ilmiah</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                    openSections.science ? "rotate-180 text-emerald-400" : ""
                  }`}
                />
              </button>

              {openSections.science && (
                <div className="p-4 pt-1 border-t border-gray-800/60 space-y-3 text-xs">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mb-1">
                      <Lightbulb className="w-3.5 h-3.5" /> Kiat Pelatih (Mind-Muscle Cue)
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {exercise.tutorial.proTip}
                    </p>
                  </div>

                  {exercise.researchCitation?.verified === true && (
                    <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5 text-blue-400 font-bold text-[11px]">
                          <BookOpen className="w-3.5 h-3.5" /> Jurnal & Biomekanika
                        </div>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          Peer-Reviewed
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-white">
                        {exercise.researchCitation.study} ({exercise.researchCitation.journal})
                      </div>
                      <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                        {exercise.researchCitation.findings}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-900/60 flex items-center justify-between">
          <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            <span>Format video pendek demonstrasi presisi</span>
          </div>

          <div className="flex items-center gap-2">
            {onStartFormCoach && exercise.formCoach && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartFormCoach(exercise);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-lime-400 hover:bg-lime-300 text-black font-metric uppercase tracking-wider transition-colors shadow-lg shadow-lime-400/20"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>Cek Form dengan Kamera</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-gray-800/80 hover:bg-gray-700 transition-colors"
            >
              Tutup
            </button>
            {onSelectForWorkout && (
              <button
                onClick={() => {
                  onSelectForWorkout(exercise);
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg ${
                  isSelected
                    ? "bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/20"
                    : "bg-orange-500 text-white hover:bg-orange-400 shadow-orange-500/20"
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" /> Terpilih
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
