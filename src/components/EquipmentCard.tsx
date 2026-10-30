"use client";

import React from "react";
import { Check, Lock } from "lucide-react";

interface EquipmentCardProps {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onToggle: () => void;
  locked?: boolean;
  onLockedClick?: () => void;
}

/**
 * Clean Athletic Equipment Card
 * Matte dark design, crisp lime accent for active cards, and sleek amber for locked Pro features.
 */
export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  name,
  subtitle,
  desc,
  IconComponent,
  selected,
  onToggle,
  locked = false,
  onLockedClick,
}) => {
  const handleClick = () => {
    if (locked) {
      onLockedClick?.();
    } else {
      onToggle();
    }
  };

  return (
    <div
      onClick={handleClick}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`relative cursor-pointer p-4 sm:p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between group outline-none select-none ${
        locked
          ? "bg-gradient-to-b from-[#15130E] to-[#0E0C09] border-2 border-amber-500/40 hover:border-amber-400 shadow-md shadow-amber-500/5 hover:-translate-y-0.5"
          : selected
          ? "bg-[#16181F] border-2 border-lime-400 shadow-md shadow-lime-500/10 -translate-y-0.5"
          : "bg-[#101115] border border-zinc-800 hover:border-zinc-700 hover:bg-[#13151B]"
      }`}
    >
      {/* Top Row: Vector Icon + Indicator Badge */}
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
            locked
              ? "bg-amber-400/15 text-amber-400 border border-amber-400/30 group-hover:bg-amber-400 group-hover:text-black"
              : selected
              ? "bg-lime-400 text-black shadow-sm"
              : "bg-zinc-800/80 text-zinc-400 group-hover:text-zinc-200 group-hover:bg-zinc-800"
          }`}
        >
          <IconComponent className="w-6 h-6 stroke-[2.2]" />
        </div>

        {/* Selected Check or Lock Indicator */}
        {locked ? (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center border border-amber-500/40 bg-amber-950/40 text-amber-400">
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        ) : (
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
              selected
                ? "bg-lime-400 border-lime-400 text-black"
                : "border-zinc-700 bg-zinc-900 text-transparent"
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${selected ? "opacity-100" : "opacity-0"}`} />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between gap-1">
          <h3 className="font-metric text-lg sm:text-xl font-bold uppercase tracking-tight text-white">
            {name}
          </h3>
          <span
            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono ${
              locked
                ? "bg-amber-400 text-black font-extrabold font-metric"
                : selected
                ? "bg-lime-400/15 text-lime-400 border border-lime-400/30"
                : "bg-zinc-800/60 text-zinc-500"
            }`}
          >
            {locked ? "PRO LOCKED" : selected ? "AKTIF" : "OFF"}
          </span>
        </div>

        <p
          className={`text-[11px] font-semibold mt-0.5 tracking-wide ${
            locked ? "text-amber-400/90" : "text-lime-400/90"
          }`}
        >
          {subtitle}
        </p>
        <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed font-sans">
          {desc}
        </p>

        {locked && (
          <div className="mt-2.5 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] font-metric font-bold text-amber-400">
            <span>KATALOG MESIN PRO</span>
            <span className="text-[10px] uppercase tracking-wider group-hover:translate-x-0.5 transition-transform">
              Lihat Detail →
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
