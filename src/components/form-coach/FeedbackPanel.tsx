"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, VolumeX, AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react";
import { IssueItem, RepResult, Severity } from "@/lib/pose/rules/types";

interface FeedbackPanelProps {
  mode: "reps" | "hold";
  repsCount: number;
  currentScore: number;
  activeIssues: IssueItem[];
  lastCompletedRep: RepResult | null;
  holdTimeSec?: number;
  cleanHoldSec?: number;
  phase?: "idle" | "descending" | "bottom" | "ascending";
  scored?: boolean;
}

interface DisplayCue {
  id: string;
  text: string;
  severity: Severity;
  expiresAt: number;
}

const SEVERITY_WEIGHT: Record<Severity, number> = {
  critical: 3,
  major: 2,
  minor: 1,
};

export default function FeedbackPanel({
  mode,
  repsCount,
  currentScore,
  activeIssues,
  lastCompletedRep,
  holdTimeSec = 0,
  cleanHoldSec = 0,
  phase = "idle",
  scored = true,
}: FeedbackPanelProps) {
  // 1. Suara (speechSynthesis id-ID), default MATI
  const [audioEnabled, setAudioEnabled] = useState(false);
  const lastSpokenTimeRef = useRef<number>(0);
  const lastSpokenTextRef = useRef<string>("");

  // 2. Buffer Cue: tahan tiap cue minimal 2500ms agar tidak berkedip
  const [activeCues, setActiveCues] = useState<DisplayCue[]>([]);

  // 3. Flash skor repetisi terakhir selama 1.5 detik
  const [repFlash, setRepFlash] = useState<{ score?: number; repNum: number } | null>(null);
  const lastRepIndexSeen = useRef<number>(0);

  // Update buffer cue saat activeIssues berubah
  useEffect(() => {
    const now = Date.now();

    setActiveCues((prev) => {
      // Pertahankan cue yang belum expired
      const validCues = prev.filter((c) => c.expiresAt > now);

      // Tambahkan atau perbarui cue dari activeIssues saat ini
      for (const issue of activeIssues) {
        if (!issue.cue) continue;
        const existingIdx = validCues.findIndex((c) => c.text === issue.cue);
        if (existingIdx >= 0) {
          validCues[existingIdx].expiresAt = now + 2500;
          validCues[existingIdx].severity = issue.severity;
        } else {
          validCues.push({
            id: `${issue.checkId}-${now}`,
            text: issue.cue,
            severity: issue.severity,
            expiresAt: now + 2500,
          });
        }
      }

      // Urutkan severity tertinggi lebih dulu (critical -> major -> minor)
      validCues.sort((a, b) => SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity]);

      // Batasi maksimal 2 cue sekaligus
      return validCues.slice(0, 2);
    });
  }, [activeIssues]);

  // Timer interval untuk membersihkan cue expired
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveCues((prev) => prev.filter((c) => c.expiresAt > now));
    }, 200);
    return () => clearInterval(timer);
  }, []);

  // Flash skor repetisi terakhir saat rep selesai (1.5 detik)
  useEffect(() => {
    if (lastCompletedRep && lastCompletedRep.index > lastRepIndexSeen.current) {
      lastRepIndexSeen.current = lastCompletedRep.index;
      setRepFlash({
        score: lastCompletedRep.score,
        repNum: lastCompletedRep.index,
      });

      const timer = setTimeout(() => {
        setRepFlash(null);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [lastCompletedRep]);

  // Audio feedback rate limited (maksimal 1 ucapan per 3 detik)
  useEffect(() => {
    if (!audioEnabled || activeCues.length === 0) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const topCue = activeCues[0];
    const now = Date.now();

    if (now - lastSpokenTimeRef.current >= 3000 && lastSpokenTextRef.current !== topCue.text) {
      lastSpokenTimeRef.current = now;
      lastSpokenTextRef.current = topCue.text;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(topCue.text);
      utterance.lang = "id-ID";
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  }, [audioEnabled, activeCues]);

  // Circular gauge score calculation
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  // Warna skor
  const scoreColor =
    currentScore >= 80 ? "#DFFF00" : currentScore >= 60 ? "#FACC15" : "#EF4444";

  return (
    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 bg-gradient-to-t from-black via-black/85 to-transparent pointer-events-none flex flex-col gap-3">
      {/* Flash Repetisi Selesai (1.5s popup) */}
      {repFlash && (
        <div className="self-center animate-bounce motion-reduce:animate-none duration-300 pointer-events-auto bg-[#DFFF00] text-black px-4 py-1.5 rounded-full font-black text-sm uppercase tracking-wider shadow-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-black" />
          <span>
            Rep {repFlash.repNum} Selesai{repFlash.score !== undefined ? ` • Skor ${repFlash.score}` : ""}
          </span>
        </div>
      )}

      {/* Baris Koreksi Form (Maksimal 2 Cue, ditahan >= 2500ms, Aksesibel aria-live) */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="flex flex-col gap-2 max-w-lg mx-auto w-full"
      >
        {activeCues.map((cue) => {
          const isCritical = cue.severity === "critical";
          const isMajor = cue.severity === "major";

          return (
            <div
              key={cue.id}
              className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl border backdrop-blur-md shadow-xl transition-all duration-300 motion-reduce:transition-none motion-reduce:animate-none animate-in fade-in slide-in-from-bottom-2 ${
                isCritical
                  ? "bg-red-950/80 border-red-500 text-red-100"
                  : isMajor
                  ? "bg-amber-950/80 border-amber-500 text-amber-100"
                  : "bg-neutral-900/90 border-neutral-700 text-neutral-200"
              }`}
            >
              {isCritical ? (
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0 animate-pulse motion-reduce:animate-none" />
              ) : isMajor ? (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              ) : (
                <Info className="w-5 h-5 text-neutral-400 shrink-0" />
              )}
              <span className="font-semibold text-sm tracking-wide flex-1">{cue.text}</span>
              <span
                className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-md ${
                  isCritical
                    ? "bg-red-500/20 text-red-300"
                    : isMajor
                    ? "bg-amber-500/20 text-amber-300"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {cue.severity}
              </span>
            </div>
          );
        })}
      </div>

      {/* Baris Metrik Utama & Kontrol */}
      <div className="flex items-center justify-between max-w-2xl mx-auto w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl p-3 sm:p-4 backdrop-blur-md pointer-events-auto shadow-2xl">
        {/* Angka Repetisi Besar / Waktu Tahan */}
        <div className="flex items-baseline gap-2">
          {mode === "reps" ? (
            <>
              <span className="font-metric text-4xl sm:text-5xl font-black text-[#DFFF00] tracking-tight">
                {String(repsCount).padStart(2, "0")}
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-400 uppercase tracking-widest">
                REPS
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                {phase}
              </span>
            </>
          ) : (
            <>
              <span className="font-metric text-4xl sm:text-5xl font-black text-[#DFFF00] tracking-tight">
                {String(cleanHoldSec).padStart(2, "0")}s
              </span>
              <span className="text-xs sm:text-sm font-bold text-neutral-400 uppercase tracking-widest">
                BERSIH / {holdTimeSec}s
              </span>
            </>
          )}
        </div>

        {/* Score Ring Gauge & Audio Toggle */}
        <div className="flex items-center gap-4">
          {/* Tombol Audio Toggle */}
          <button
            type="button"
            onClick={() => setAudioEnabled((prev) => !prev)}
            title={audioEnabled ? "Matikan panduan suara" : "Nyalakan panduan suara (Bahasa Indonesia)"}
            className={`p-2.5 rounded-xl border transition-all ${
              audioEnabled
                ? "bg-[#DFFF00]/15 border-[#DFFF00] text-[#DFFF00]"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Score Ring Gauge (SVG) */}
          {scored !== false && (
            <div className="relative flex items-center justify-center">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 64 64">
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  className="stroke-neutral-800"
                  strokeWidth="5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r={radius}
                  stroke={scoreColor}
                  strokeWidth="5"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-metric text-sm font-black text-white leading-none">
                  {currentScore}
                </span>
                <span className="text-[8px] text-neutral-400 uppercase font-semibold leading-none mt-0.5">
                  SKOR
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
