"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, Flag } from "lucide-react";
import { IssueItem, RepResult } from "@/lib/pose/rules/types";

export interface FeedbackPanelProps {
  mode: "reps" | "hold";
  repsCount: number;
  currentScore: number;
  activeIssues?: IssueItem[];
  activeCue?: string | null;
  lastCompletedRep?: RepResult | null;
  holdTimeSec?: number;
  cleanHoldSec?: number;
  phase?: "idle" | "descending" | "bottom" | "ascending";
  scored?: boolean;
  banner?: string;
  onFinish?: () => void;
}

export default function FeedbackPanel({
  mode,
  repsCount,
  currentScore,
  activeIssues = [],
  activeCue,
  holdTimeSec = 0,
  cleanHoldSec = 0,
  phase = "idle",
  scored = true,
  banner,
  onFinish,
}: FeedbackPanelProps) {
  // 1. Suara panduan (speechSynthesis id-ID), default MATI
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>("");

  // Audio feedback tersinkronisasi dengan pil koreksi aktif
  useEffect(() => {
    if (!activeCue) {
      lastSpokenTextRef.current = "";
      return;
    }
    if (!audioEnabled) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const now = Date.now();
    if (now - lastSpokenTimeRef.current >= 2000 && lastSpokenTextRef.current !== activeCue) {
      lastSpokenTimeRef.current = now;
      lastSpokenTextRef.current = activeCue;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeCue);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, [audioEnabled, activeCue]);

  // Cincin skor kecil (diameter 36px <= 40px)
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const scoreColor =
    currentScore >= 80 ? "#DFFF00" : currentScore >= 60 ? "#FACC15" : "#EF4444";

  return (
    <div className="w-full bg-[#0C0D14] border-t border-zinc-800/80 px-3 py-2 flex flex-col gap-1 shrink-0 select-none">
      {/* BARIS UTAMA: Metrik & Kontrol */}
      <div className="flex items-center justify-between gap-3">
        {/* Metrik Repetisi atau Durasi Hold */}
        <div className="flex items-baseline gap-1.5 min-w-0">
          {mode === "reps" ? (
            <>
              <span className="font-metric text-2xl sm:text-3xl font-black text-[#DFFF00] tracking-tight leading-none">
                {String(repsCount).padStart(2, "0")}
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                REPS
              </span>
              <span className="ml-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {phase}
              </span>
            </>
          ) : (
            <>
              <span className="font-metric text-2xl sm:text-3xl font-black text-[#DFFF00] tracking-tight leading-none">
                {String(cleanHoldSec).padStart(2, "0")}s
              </span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                BERSIH / {holdTimeSec}s
              </span>
            </>
          )}
        </div>

        {/* Cincin Skor (<= 40px), Suara, & Selesai */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Cincin Skor Kecil 36px */}
          {scored !== false && (
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="stroke-neutral-800"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  stroke={scoreColor}
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-metric text-[11px] font-black text-white leading-none">
                  {currentScore}
                </span>
              </div>
            </div>
          )}

          {/* Tombol Suara */}
          <button
            type="button"
            onClick={() => setAudioEnabled((prev) => !prev)}
            title={audioEnabled ? "Matikan panduan suara" : "Nyalakan panduan suara"}
            className={`p-1.5 rounded-lg border transition-colors ${
              audioEnabled
                ? "bg-[#DFFF00]/15 border-[#DFFF00] text-[#DFFF00]"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Tombol Selesai Sesi */}
          {onFinish && (
            <button
              type="button"
              onClick={onFinish}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white text-[11px] font-metric font-bold uppercase tracking-wider transition-colors shadow-sm"
            >
              <Flag className="w-3 h-3 text-[#DFFF00]" />
              <span>Selesai</span>
            </button>
          )}
        </div>
      </div>

      {/* BARIS KEDUA: Privasi (satu baris kecil di bawah, per Requirement 8) */}
      <div className="text-[9px] text-zinc-500 font-sans flex items-center justify-between border-t border-zinc-800/50 pt-1 leading-none">
        <span className="truncate">
          Privasi: Pemrosesan visual 100% lokal di browser, tanpa video dikirim ke server.
        </span>
        {banner && (
          <span className="text-amber-400/90 font-medium ml-2 shrink-0">{banner}</span>
        )}
      </div>
    </div>
  );
}
