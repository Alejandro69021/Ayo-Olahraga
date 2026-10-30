"use client";

import React from "react";
import { Minus, Plus } from "lucide-react";

interface ChunkyStepperProps {
  label: string;
  value: number;
  unit?: string;
  step?: number;
  min?: number;
  max?: number;
  onChange: (val: number) => void;
  quickAddOptions?: number[];
  disabled?: boolean;
}

/**
 * Fat-Finger Friendly Gym Stepper
 * Designed for sweaty, shaky hands in noisy gym environments.
 * Big touch targets (min 48px), high contrast, zero tiny inputs.
 */
export const ChunkyStepper: React.FC<ChunkyStepperProps> = ({
  label,
  value,
  unit,
  step = 1,
  min = 0,
  max = 999,
  onChange,
  quickAddOptions,
  disabled = false,
}) => {
  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // Ignored
      }
    }
  };

  const handleDecrement = () => {
    if (disabled) return;
    triggerHaptic();
    const next = Math.max(min, Math.round((value - step) * 10) / 10);
    onChange(next);
  };

  const handleIncrement = () => {
    if (disabled) return;
    triggerHaptic();
    const next = Math.min(max, Math.round((value + step) * 10) / 10);
    onChange(next);
  };

  const handleQuickAdd = (delta: number) => {
    if (disabled) return;
    triggerHaptic();
    const next = Math.min(max, Math.max(min, Math.round((value + delta) * 10) / 10));
    onChange(next);
  };

  return (
    <div className="flex flex-col bg-[#0A0A0A] border border-[#222222] rounded-2xl p-2.5 sm:p-3 relative select-none">
      {/* Header Label & Unit */}
      <div className="flex items-center justify-between px-1 mb-1.5">
        <span className="text-[10px] font-black tracking-widest uppercase text-gray-400">
          {label}
        </span>
        {unit && (
          <span className="text-[10px] font-black uppercase text-[#DFFF00] font-metric tracking-wider">
            {unit}
          </span>
        )}
      </div>

      {/* Main Stepper Controls */}
      <div className="grid grid-cols-[48px_1fr_48px] sm:grid-cols-[54px_1fr_54px] items-center gap-1.5 bg-[#141414] rounded-xl border border-[#262626] p-1">
        {/* Decrement Button */}
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={handleDecrement}
          aria-label={`Kurangi ${label}`}
          className="h-12 sm:h-13 w-full rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] active:bg-[#333333] active:scale-95 text-gray-200 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center border border-[#303030]"
        >
          <Minus className="w-5 h-5 stroke-[3]" />
        </button>

        {/* Big Number Center Metric */}
        <div className="flex items-baseline justify-center gap-1 py-1 px-2 overflow-hidden">
          <span className="font-metric text-3xl sm:text-4xl font-extrabold text-white tracking-tight tabular-nums leading-none">
            {value}
          </span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={handleIncrement}
          aria-label={`Tambah ${label}`}
          className="h-12 sm:h-13 w-full rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] active:bg-[#DFFF00] active:text-black active:scale-95 text-gray-200 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center border border-[#303030]"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* Optional Quick Add Tags */}
      {quickAddOptions && quickAddOptions.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-2 pt-1 border-t border-[#1C1C1C]">
          {quickAddOptions.map((delta) => (
            <button
              key={delta}
              type="button"
              disabled={disabled}
              onClick={() => handleQuickAdd(delta)}
              className="px-2 py-0.5 rounded-md bg-[#161616] hover:bg-[#222222] border border-[#2A2A2A] text-[10px] font-metric font-bold text-gray-300 hover:text-[#DFFF00] transition-colors"
            >
              +{delta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
