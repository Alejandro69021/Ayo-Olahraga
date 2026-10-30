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
 * Ergonomic Gym Stepper
 * Compact, proportional number sizing, tactile touch targets, no harsh neon.
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
      } catch {}
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
    <div className="flex flex-col bg-[#111216] border border-zinc-800/80 rounded-xl p-2.5 relative select-none">
      {/* Header Label & Unit */}
      <div className="flex items-center justify-between px-0.5 mb-1">
        <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-400">
          {label}
        </span>
        {unit && (
          <span className="text-[10px] font-mono font-bold text-lime-400">
            {unit}
          </span>
        )}
      </div>

      {/* Main Stepper Controls: Compact & Ergonomic */}
      <div className="flex items-center justify-between gap-1 bg-[#090A0D] rounded-lg border border-zinc-800/80 p-1">
        {/* Decrement Button */}
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={handleDecrement}
          aria-label={`Kurangi ${label}`}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 active:bg-zinc-600 active:scale-95 text-zinc-200 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center border border-zinc-700/60 shrink-0"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Proportional Center Number */}
        <div className="flex-1 flex items-center justify-center py-0.5 px-1 overflow-hidden">
          <span className="font-mono text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums">
            {value}
          </span>
        </div>

        {/* Increment Button */}
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={handleIncrement}
          aria-label={`Tambah ${label}`}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-800/90 hover:bg-zinc-700 active:bg-lime-400 active:text-black active:scale-95 text-zinc-200 hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-all flex items-center justify-center border border-zinc-700/60 shrink-0"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick Add Pills */}
      {quickAddOptions && quickAddOptions.length > 0 && (
        <div className="flex items-center justify-center gap-1.5 mt-1.5 pt-1 border-t border-zinc-800/50">
          {quickAddOptions.map((delta) => (
            <button
              key={delta}
              type="button"
              disabled={disabled}
              onClick={() => handleQuickAdd(delta)}
              className="px-2 py-0.5 rounded bg-zinc-800/60 hover:bg-zinc-700/80 border border-zinc-700/50 text-[10px] font-mono font-bold text-zinc-400 hover:text-lime-300 transition-colors"
            >
              +{delta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
