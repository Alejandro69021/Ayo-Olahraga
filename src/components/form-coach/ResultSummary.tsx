"use client";

import React from "react";
import { Trophy, RotateCcw, Check, AlertTriangle, ShieldAlert } from "lucide-react";
import { IssueItem, RepResult, HoldResult } from "@/lib/pose/rules/types";

export interface FormCoachSummary {
  repsAnalyzed: number;
  avgScore: number;
  topIssues: { checkId: string; count: number }[];
}

interface ResultSummaryProps {
  exerciseName: string;
  mode: "reps" | "hold";
  reps: RepResult[];
  holdResult?: HoldResult | null;
  banner?: string;
  scored?: boolean;
  onRestart: () => void;
  onFinish: () => void;
  onApplyReps?: (summary: FormCoachSummary) => void;
}

export default function ResultSummary({
  exerciseName,
  mode,
  reps,
  holdResult,
  banner,
  scored,
  onRestart,
  onFinish,
  onApplyReps,
}: ResultSummaryProps) {
  // Hitung metrik ringkasan
  const totalReps = reps.length;
  const isTierC = scored === false || (reps.length > 0 ? reps.every((r) => r.score === undefined) : false);
  const scoredReps = reps.filter((r) => typeof r.score === "number");
  const avgScore =
    mode === "reps"
      ? isTierC
        ? 0
        : scoredReps.length > 0
        ? Math.round(scoredReps.reduce((sum, r) => sum + (r.score ?? 0), 0) / scoredReps.length)
        : 0
      : holdResult
      ? holdResult.score
      : 0;

  // Kumpulkan semua issue untuk mencari top 3 masalah paling sering
  const issueCounts = new Map<string, { checkId: string; label: string; count: number; severity: string }>();

  if (mode === "reps") {
    for (const r of reps) {
      for (const iss of r.issues) {
        const key = iss.checkId;
        const existing = issueCounts.get(key);
        if (existing) {
          existing.count += 1;
        } else {
          issueCounts.set(key, {
            checkId: iss.checkId,
            label: iss.cue || iss.checkId,
            count: 1,
            severity: iss.severity,
          });
        }
      }
    }
  } else if (holdResult) {
    for (const iss of holdResult.issues) {
      const key = iss.checkId;
      const existing = issueCounts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        issueCounts.set(key, {
          checkId: iss.checkId,
          label: iss.cue || iss.checkId,
          count: 1,
          severity: iss.severity,
        });
      }
    }
  }

  // Ambil 3 masalah paling sering
  const topIssues = Array.from(issueCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const summaryData: FormCoachSummary = {
    repsAnalyzed: totalReps,
    avgScore,
    topIssues: topIssues.map((ti) => ({ checkId: ti.checkId, count: ti.count })),
  };

  const scoreColor =
    avgScore >= 80 ? "text-[#DFFF00]" : avgScore >= 60 ? "text-amber-400" : "text-red-400";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4 sm:gap-5">
        {/* Header Ringkasan */}
        <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
          <div className="p-3 bg-[#DFFF00]/10 border border-[#DFFF00]/30 rounded-xl text-[#DFFF00]">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Ringkasan Sesi Latihan
            </span>
            <h2 className="text-xl font-black text-white uppercase tracking-wide">
              {exerciseName}
            </h2>
          </div>
        </div>

        {/* Banner Khusus Tier C / Custom Banner */}
        {(isTierC || banner) && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2 text-xs text-amber-300 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{banner || "Akurasi terbatas untuk gerakan ini"}</span>
          </div>
        )}

        {/* Metrik Kartu: Repetisi & Skor Rata-Rata */}
        <div className={isTierC ? "flex flex-col" : "grid grid-cols-2 gap-3"}>
          <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
              {mode === "reps" ? "Total Repetisi" : "Waktu Bersih"}
            </span>
            <span className="font-metric text-4xl font-black text-white">
              {mode === "reps" ? totalReps : `${Math.round((holdResult?.cleanHoldMs || 0) / 1000)}s`}
            </span>
            {mode === "hold" && (
              <span className="text-[10px] text-neutral-400">
                dari {Math.round((holdResult?.totalHoldMs || 0) / 1000)}s total
              </span>
            )}
          </div>

          {!isTierC && (
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                Skor Rata-Rata
              </span>
              <span className={`font-metric text-4xl font-black ${scoreColor}`}>
                {avgScore}
              </span>
              <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                {avgScore >= 80 ? "Bagus Sekali" : avgScore >= 60 ? "Perlu Perbaikan" : "Form Kurang"}
              </span>
            </div>
          )}
        </div>

        {/* Masalah Paling Sering / Daftar Peringatan */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
            {isTierC ? "Daftar Peringatan Form" : "Koreksi Paling Sering Terjadi"}
          </span>
          {topIssues.length === 0 ? (
            <div className="p-3 rounded-xl bg-neutral-900/50 border border-neutral-800 text-sm text-neutral-300 flex items-center gap-2">
              <Check className="w-4 h-4 text-[#DFFF00]" />
              <span>Form sangat baik! Tidak ada koreksi berulang.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {topIssues.map((issue, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-neutral-900/80 border border-neutral-800 text-sm"
                >
                  <div className="flex items-center gap-2 text-neutral-200">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-medium text-xs sm:text-sm">{issue.label}</span>
                  </div>
                  <span className="text-xs font-metric font-black px-2 py-0.5 rounded bg-neutral-800 text-[#DFFF00]">
                    {issue.count}x
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Disclaimer Medis & Kamera */}
        <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl flex flex-col gap-1.5 text-xs text-neutral-400 leading-relaxed">
          <div className="flex items-start gap-2 text-neutral-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Panduan latihan, bukan diagnosis medis. Hentikan latihan jika terasa nyeri.
            </span>
          </div>
          <div className="text-[11px] text-neutral-400 pl-6">
            Estimasi pose dari satu kamera bisa meleset belasan derajat. Gunakan sebagai panduan, bukan pengganti pelatih atau tenaga medis.
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex flex-col gap-2.5 pt-2">
          {mode === "reps" && totalReps > 0 && onApplyReps && (
            <button
              type="button"
              onClick={() => onApplyReps(summaryData)}
              className="w-full py-3.5 px-4 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-metric font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-lime-400/20 transition-all active:scale-98"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Pakai {totalReps} repetisi untuk set berikutnya</span>
            </button>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-sm uppercase tracking-wider transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Latih Lagi</span>
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm uppercase tracking-wider transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
