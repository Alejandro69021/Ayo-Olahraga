"use client";

import React, { useRef, useState } from "react";
import {
  Trophy,
  Share2,
  Clock,
  Dumbbell,
  CheckCircle2,
  X,
  Zap,
  Flame,
  Layers
} from "lucide-react";
import { WorkoutSessionPayload } from "@/lib/offline-storage";

interface WorkoutSummaryModalProps {
  session: WorkoutSessionPayload | null;
  onClose: () => void;
}

/**
 * Industrial Sporty Workout Summary Modal (Trophy Card)
 * High-impact brutalist metrics, zero browser alerts, shareable IG Story canvas.
 */
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

  // Calculate total completed sets
  const totalCompletedSets = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
    0
  );

  const handleShareStory = async () => {
    const shareText = `⚡ SESI LATIHAN SELESAI — AYO-OLAHRAGA\n\n🔥 Total Beban: ${session.totalVolumeKg.toLocaleString()} KG\n⏱️ Durasi: ${minutes}m ${seconds}s\n🧱 Set Selesai: ${totalCompletedSets} Sets\n🎯 Gerakan: ${session.exercises.length} Latihan\n\nSiap progressive overload di Ayo-Olahraga!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ayo-Olahraga Workout Trophy Card",
          text: shareText,
        });
        return;
      } catch {
        // Ignored dismissal
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Ignored
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/95 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm sm:max-w-md bg-[#0A0A0A] border-2 border-[#242424] rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in slide-in-from-bottom-6 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup Ringkasan"
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#161616]/90 text-gray-400 hover:text-white border border-[#2A2A2A] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Shareable Trophy Card Canvas */}
        <div
          ref={cardRef}
          className="p-5 sm:p-6 bg-gradient-to-b from-[#141414] via-[#0A0A0A] to-[#050505] text-center relative overflow-y-auto custom-scrollbar flex-1 border-b border-[#1E1E1E]"
        >
          {/* Subtle Industrial Neon Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-56 bg-[#DFFF00]/10 blur-3xl pointer-events-none rounded-full" />

          {/* Heavy Athletic Trophy Header */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#DFFF00] text-black shadow-lg shadow-[#DFFF00]/30 mb-3 border-2 border-[#EAFF4D]">
            <Trophy className="w-9 h-9 stroke-[2.5]" />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[#DFFF00] text-xs font-black uppercase tracking-widest mb-1 font-metric">
            <Zap className="w-3.5 h-3.5 fill-current" /> WORKOUT COMPLETED
          </div>

          <h2 className="font-metric text-3xl sm:text-4xl font-extrabold uppercase text-white tracking-tight leading-none">
            KERJA KERAS TERBAYAR!
          </h2>
          <p className="text-xs text-gray-400 mt-1.5 max-w-xs mx-auto font-sans leading-relaxed">
            Data repetisi dan progressive overload berhasil disimpan ke penyimpanan lokal perangkat Anda.
          </p>

          {/* 3 MASSIVE METRIC BLOCKS (Brutalist Condensed Typography) */}
          <div className="grid grid-cols-1 gap-2.5 mt-5">
            {/* Block 1: Massive Total Volume */}
            <div className="p-4 rounded-2xl bg-[#121212] border border-[#222222] text-left relative overflow-hidden flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-black uppercase tracking-wider mb-0.5">
                  <Dumbbell className="w-3.5 h-3.5 text-[#DFFF00]" /> TOTAL VOLUME ANGKATAN
                </div>
                <div className="font-metric text-4xl sm:text-5xl font-black text-white tracking-tight tabular-nums leading-none">
                  {session.totalVolumeKg.toLocaleString()}{" "}
                  <span className="text-base sm:text-lg font-bold text-[#DFFF00]">KG</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] border border-[#2C2C2C] flex items-center justify-center text-[#DFFF00]">
                <Flame className="w-5 h-5 fill-current" />
              </div>
            </div>

            {/* Block 2 & 3: Duration & Sets Completed Side-by-Side */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Duration Block */}
              <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#222222] text-left">
                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" /> TOTAL WAKTU
                </div>
                <div className="font-metric text-3xl font-black text-white tracking-tight tabular-nums leading-none">
                  {minutes}<span className="text-sm font-bold text-gray-400">M </span>
                  {seconds}<span className="text-sm font-bold text-gray-400">S</span>
                </div>
              </div>

              {/* Sets Completed Block */}
              <div className="p-3.5 rounded-2xl bg-[#121212] border border-[#222222] text-left">
                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-black uppercase tracking-wider mb-1">
                  <Layers className="w-3.5 h-3.5 text-[#DFFF00]" /> SET SELESAI
                </div>
                <div className="font-metric text-3xl font-black text-white tracking-tight tabular-nums leading-none">
                  {totalCompletedSets}{" "}
                  <span className="text-sm font-bold text-[#DFFF00]">SETS</span>
                </div>
              </div>
            </div>
          </div>

          {/* Exercise Log Checklist */}
          <div className="mt-4 pt-4 border-t border-[#1F1F1F] text-left space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">
              Daftar Gerakan Diselesaikan:
            </span>
            {session.exercises.length > 0 ? (
              session.exercises.map((ex, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-[#1A1A1A] last:border-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#DFFF00] shrink-0" />
                    <span className="text-gray-200 font-bold truncate">{ex.name}</span>
                  </div>
                  <span className="text-gray-400 font-metric font-bold text-xs shrink-0 tracking-wide">
                    {ex.sets.filter((s) => s.completed).length} SETS
                  </span>
                </div>
              ))
            ) : (
              <div className="text-[11px] text-gray-500 italic py-1 text-center font-sans">
                Sesi singkat tercatat (latihan aktif tersimpan).
              </div>
            )}
          </div>

          {/* Brand Watermark on Card */}
          <div className="mt-4 pt-3 text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center justify-center gap-1.5 font-metric">
            <span>AYO-OLAHRAGA</span> • <span>INDUSTRIAL FITNESS ENGINE</span>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 sm:p-5 bg-[#080808] flex flex-col sm:flex-row items-center gap-2.5 border-t border-[#1C1C1C]">
          <button
            onClick={handleShareStory}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl font-metric font-extrabold text-sm uppercase tracking-wide flex items-center justify-center gap-2 bg-[#DFFF00] hover:bg-[#EAFF4D] text-black active:scale-98 transition-all shadow-lg shadow-[#DFFF00]/25"
          >
            <Share2 className="w-4 h-4 stroke-[2.5]" />
            {copied ? "TEKS TERSALIN!" : "BAGIKAN KE IG STORY"}
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto py-3.5 px-6 rounded-xl font-metric font-bold text-xs uppercase tracking-wider text-gray-300 hover:text-white bg-[#141414] hover:bg-[#202020] border border-[#282828] transition-colors"
          >
            SELESAI
          </button>
        </div>
      </div>
    </div>
  );
};
