"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft, Camera, RefreshCw, Activity, Dumbbell } from "lucide-react";
import { FormCoachSummary } from "@/components/form-coach/ResultSummary";
import { EXERCISES_DATABASE } from "@/data/exercises";

// Dynamic import CameraStage with ssr: false
const CameraStage = dynamic(
  () => import("@/components/form-coach/CameraStage").then((mod) => mod.CameraStage),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[420px] bg-[#080808] rounded-2xl flex flex-col items-center justify-center gap-3 text-center p-6 border border-zinc-800">
        <div className="w-9 h-9 rounded-full border-2 border-lime-400 border-t-transparent animate-spin" />
        <span className="font-metric text-xs font-bold uppercase text-zinc-300 tracking-wider">
          Memuat Panggung AI Form Coach...
        </span>
      </div>
    ),
  }
);

interface DevExercise {
  id: string;
  name: string;
  category: string;
  view: "side" | "front";
  viewLabel: string;
  cameraTip: string;
}

const DEV_EXERCISES: DevExercise[] = EXERCISES_DATABASE.filter((ex) => ex.formCoach).map((ex) => ({
  id: ex.id,
  name: ex.name,
  category: `${ex.formCoach!.ruleSetId} (${ex.equipmentLabel})`,
  view: ex.formCoach!.view,
  viewLabel: ex.formCoach!.view === "front" ? "Depan" : "Samping",
  cameraTip: ex.formCoach!.cameraTip,
}));

export default function CoachDevPage() {
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("bw-air-squat");
  const [lastSummary, setLastSummary] = useState<FormCoachSummary | null>(null);
  const [stageKey, setStageKey] = useState<number>(0);

  const selectedExercise =
    DEV_EXERCISES.find((e) => e.id === selectedExerciseId) || DEV_EXERCISES[0];

  const handleSelectExercise = (id: string) => {
    setSelectedExerciseId(id);
    setLastSummary(null);
    setStageKey((prev) => prev + 1);
  };

  const handleRestart = () => {
    setLastSummary(null);
    setStageKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 sm:p-6 flex flex-col font-sans">
      {/* HEADER */}
      <header className="max-w-6xl mx-auto w-full flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Kembali ke Tracker Utama"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-metric text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                FORM COACH DEV BENCH
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-lime-400 text-black font-metric">
                {DEV_EXERCISES.length} GERAKAN
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Halaman pengujian aturan koreksi pose seluruh katalog gerakan &amp; verifikasi PoseGate/histeresis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleRestart}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reset Stage</span>
        </button>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-6xl mx-auto w-full flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* SIDEBAR: Pilihan Gerakan & Status */}
        <div className="flex flex-col gap-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-lime-400" />
              <span>Pilih Gerakan Uji</span>
            </h2>
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {DEV_EXERCISES.map((ex) => {
                const isSelected = ex.id === selectedExerciseId;
                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => handleSelectExercise(ex.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-lime-400/10 border-lime-400/50 text-white shadow-lg shadow-lime-400/10"
                        : "bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">{ex.name}</span>
                      <span className="text-[10px] font-metric uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {ex.viewLabel}
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">{ex.category}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panduan Kamera & Info Aturan */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Camera className="w-4 h-4 text-lime-400" />
              <span>Panduan Kamera</span>
            </h2>
            <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/80 p-3 rounded-xl border border-zinc-800">
              {selectedExercise.cameraTip}
            </p>

            <div className="text-[11px] text-zinc-500 leading-relaxed space-y-1">
              <div>• Kalibrasi baseline 1,5 detik pertama saat berdiri diam.</div>
              <div>• Metrik: histeresis up/down threshold mencegah false rep.</div>
              <div>• Nilai frame disimpan di ref untuk mencegah re-render loop.</div>
            </div>
          </div>

          {/* Ringkasan Selesai Terakhir */}
          {lastSummary && (
            <div className="bg-zinc-950 border border-lime-400/30 rounded-2xl p-4 flex flex-col gap-2 animate-in fade-in">
              <span className="text-[10px] font-bold uppercase tracking-wider text-lime-400">
                Hasil Latihan Terakhir
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-zinc-400">Repetisi Terdeteksi:</span>
                <span className="font-metric text-lg font-black text-white">
                  {lastSummary.repsAnalyzed}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-zinc-400">Skor Rata-Rata:</span>
                <span className="font-metric text-lg font-black text-lime-400">
                  {lastSummary.avgScore}
                </span>
              </div>
              {lastSummary.topIssues.length > 0 && (
                <div className="pt-2 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-400 block mb-1 uppercase font-bold">
                    Isu Terdeteksi:
                  </span>
                  <div className="flex flex-col gap-1">
                    {lastSummary.topIssues.map((iss, idx) => (
                      <div
                        key={idx}
                        className="text-xs text-zinc-300 flex justify-between bg-zinc-900 px-2 py-1 rounded"
                      >
                        <span className="truncate">{iss.checkId}</span>
                        <span className="text-lime-400 font-bold ml-2">{iss.count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CAMERA STAGE CONTAINER */}
        <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-3xl p-3 sm:p-4 flex flex-col min-h-[500px] shadow-2xl relative overflow-hidden">
          <CameraStage
            key={`${selectedExercise.id}-${stageKey}`}
            exerciseId={selectedExercise.id}
            exerciseName={selectedExercise.name}
            view={selectedExercise.view}
            cameraTip={selectedExercise.cameraTip}
            onClose={() => setStageKey((prev) => prev + 1)}
            onComplete={(summary) => setLastSummary(summary)}
          />
        </div>
      </main>
    </div>
  );
}
