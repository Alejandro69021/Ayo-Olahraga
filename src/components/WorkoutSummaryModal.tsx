"use client";

import React, { useRef, useState } from "react";
import {
  Trophy,
  Share2,
  Download,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  X,
  Sparkles,
  Zap
} from "lucide-react";
import { WorkoutSessionPayload } from "@/lib/offline-storage";

interface WorkoutSummaryModalProps {
  session: WorkoutSessionPayload | null;
  onClose: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  session,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Lock background scroll when modal is active & reset viewport to top
  React.useEffect(() => {
    if (session) {
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [session]);

  if (!session) return null;

  const minutes = Math.floor(session.durationSeconds / 60);
  const seconds = session.durationSeconds % 60;

  const handleShareStory = async () => {
    const shareText = `🔥 Sesi Latihan Selesai di Ayo-Olahraga!\n💪 Total Volume: ${session.totalVolumeKg.toLocaleString()} kg\n⏱️ Durasi: ${minutes}m ${seconds}s\n🎯 Latihan: ${session.exercises.length} gerakan\n\nYuk konsisten latihan di Ayo-Olahraga!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ayo-Olahraga Workout Summary",
          text: shareText,
        });
        return;
      } catch (err) {
        console.log("Native share dismissed");
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0a0c10] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-gray-900/80 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shareable Card Canvas Container (IG Story 9:16 Vibe) */}
        <div
          ref={cardRef}
          className="p-5 sm:p-6 bg-gradient-to-b from-[#161a24] via-[#0d1017] to-[#07080b] border-b border-gray-800 text-center relative overflow-y-auto custom-scrollbar flex-1"
        >
          {/* Subtle Energetic Background Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/15 blur-3xl pointer-events-none rounded-full" />

          {/* Trophy Header Badge */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-black shadow-lg shadow-orange-500/25 mb-3">
            <Trophy className="w-8 h-8 stroke-[2.2]" />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-orange-400 text-xs font-black uppercase tracking-widest mb-1">
            <Zap className="w-3.5 h-3.5 fill-current" /> Sesi Selesai (Workout Crushed)
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Kerja Keras Terbayar!
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
            Setiap repetisi mendekatkan Anda ke bentuk fisik dan kekuatan terbaik.
          </p>

          {/* Key Metrics Grid - Sporty High Contrast */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 text-left">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Dumbbell className="w-3.5 h-3.5 text-orange-400" /> Total Beban
              </div>
              <div className="text-2xl font-black text-white tracking-tight font-mono">
                {session.totalVolumeKg.toLocaleString()} <span className="text-xs text-gray-400 font-sans">kg</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 text-left">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Total Waktu
              </div>
              <div className="text-2xl font-black text-white tracking-tight font-mono">
                {minutes}<span className="text-xs text-gray-400 font-sans">m </span>
                {seconds}<span className="text-xs text-gray-400 font-sans">s</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 text-left">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Flame className="w-3.5 h-3.5 text-rose-400" /> Reps Total
              </div>
              <div className="text-2xl font-black text-white tracking-tight font-mono">
                {session.totalReps} <span className="text-xs text-gray-400 font-sans">reps</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-900/80 border border-gray-800 text-left">
              <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> PR Terpecahkan
              </div>
              <div className="text-2xl font-black text-blue-400 tracking-tight font-mono">
                {session.prsBroken > 0 ? `+${session.prsBroken}` : "Solid"}
              </div>
            </div>
          </div>

          {/* Exercise Log Checklist */}
          <div className="mt-4 pt-4 border-t border-gray-800/80 text-left space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              Daftar Gerakan Diselesaikan:
            </span>
            {session.exercises.length > 0 ? (
              session.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-900/60 last:border-0">
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-gray-200 font-medium truncate">{ex.name}</span>
                  </div>
                  <span className="text-gray-400 font-mono text-[11px] shrink-0">
                    {ex.sets.filter((s) => s.completed).length} Set
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-gray-500 italic py-1 text-center">
                Sesi singkat tercatat (latihan aktif tersimpan).
              </div>
            )}
          </div>

          {/* Brand Watermark on Card */}
          <div className="mt-4 pt-3 text-[10px] text-gray-400 font-semibold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <span>Ayo-Olahraga</span> • <span>Next-Gen Fitness Engine</span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-gray-950 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleShareStory}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:brightness-110 transition-all shadow-lg shadow-orange-500/20"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            {copied ? "Teks Tersalin!" : "Bagikan ke IG Story"}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-xs text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

