"use client";

import React, { useMemo, useState } from "react";
import { Utensils } from "lucide-react";
import {
  GOAL_LABEL_ID,
  type Goal,
} from "@/lib/program/program-types";
import {
  getNutritionGuidance,
  proteinGramRange,
} from "@/lib/program/nutrition";

interface NutritionNoteProps {
  goal: Goal;
}

export const NutritionNote: React.FC<NutritionNoteProps> = ({ goal }) => {
  const [weightInput, setWeightInput] = useState<string>("");
  const guidance = useMemo(() => getNutritionGuidance(goal), [goal]);

  const trimmedWeight = weightInput.trim();
  const parsedWeight =
    trimmedWeight.length > 0 ? Number(trimmedWeight.replace(",", ".")) : null;
  const computedRange =
    parsedWeight !== null ? proteinGramRange(parsedWeight, goal) : null;
  const isInvalidWeight = trimmedWeight.length > 0 && computedRange === null;

  return (
    <section
      aria-labelledby="nutrition-note-heading"
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-emerald-400 shrink-0" />
          <h2
            id="nutrition-note-heading"
            className="text-base sm:text-lg font-bold text-white"
          >
            Catatan nutrisi
          </h2>
        </div>
        <span className="text-xs text-zinc-400">{GOAL_LABEL_ID[goal]}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
        <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 p-3 space-y-0.5">
          <p className="text-zinc-400">Kisaran protein harian</p>
          <p className="text-sm font-bold text-emerald-300">
            {guidance.proteinPerKgRange[0].toFixed(1)}–{guidance.proteinPerKgRange[1].toFixed(1)} g/kg berat badan
          </p>
        </div>

        <div className="rounded-xl bg-zinc-800/50 border border-zinc-800 p-3 space-y-0.5">
          <p className="text-zinc-400">Arah energi</p>
          <p className="text-sm font-bold text-white capitalize">
            {guidance.energyDirection}
          </p>
        </div>
      </div>

      {guidance.extraNote && (
        <p className="rounded-xl bg-zinc-800/40 border border-zinc-800 px-3 py-2 text-xs text-zinc-300 leading-relaxed">
          {guidance.extraNote}
        </p>
      )}

      {/* Kalkulator opsional sementara di state React saja (tidak disimpan) */}
      <div className="rounded-xl bg-zinc-800/30 border border-zinc-800 p-3 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <label
            htmlFor="nutrition-weight-input"
            className="text-xs font-medium text-zinc-300 shrink-0"
          >
            Hitung kisaran gram (opsional):
          </label>
          <div className="flex items-center gap-2 flex-1">
            <input
              id="nutrition-weight-input"
              type="text"
              inputMode="decimal"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder="Berat badan (30-250 kg)"
              className="w-full sm:max-w-[180px] rounded-lg bg-zinc-900 border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 min-h-[38px]"
            />
            <span className="text-xs text-zinc-400">kg</span>
          </div>
        </div>

        {computedRange && (
          <p className="text-xs font-semibold text-emerald-300">
            Perkiraan untuk {parsedWeight} kg: {computedRange.min}–{computedRange.max} gram/hari
          </p>
        )}

        {isInvalidWeight && (
          <p className="text-xs text-amber-300">
            Masukkan angka berat badan antara 30 sampai 250 kg.
          </p>
        )}
      </div>

      <div className="space-y-1 text-[11px] text-zinc-400 leading-relaxed pt-1 border-t border-zinc-800/80">
        <p className="font-semibold text-zinc-300">
          Perkiraan umum, bukan saran gizi atau medis.
        </p>
        <p>
          Bila Anda punya kondisi kesehatan (mis. penyakit ginjal), sedang hamil atau menyusui, atau punya riwayat gangguan makan, bicarakan dengan tenaga kesehatan.
        </p>
      </div>
    </section>
  );
};
