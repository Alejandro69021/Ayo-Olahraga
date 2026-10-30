"use client";

import React from "react";
import { Check } from "lucide-react";

interface EquipmentCardProps {
  id: string;
  name: string;
  subtitle: string;
  desc: string;
  IconComponent: React.ComponentType<{ className?: string }>;
  selected: boolean;
  onToggle: () => void;
}

/**
 * Industrial Sporty Equipment Card
 * Sleek flat vector iconography with aggressive Volt Yellow active glow.
 */
export const EquipmentCard: React.FC<EquipmentCardProps> = ({
  name,
  subtitle,
  desc,
  IconComponent,
  selected,
  onToggle,
}) => {
  return (
    <div
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`relative cursor-pointer p-5 rounded-2xl transition-all duration-200 flex flex-col justify-between group outline-none select-none ${
        selected
          ? "bg-[#141414] border-2 border-[#DFFF00] shadow-[0_0_25px_rgba(223,255,0,0.2)] ring-1 ring-[#DFFF00]/40 -translate-y-0.5"
          : "bg-[#0E0E0E] border border-[#222222] hover:border-[#383838] hover:bg-[#121212]"
      }`}
    >
      {/* Top Row: Monochrome Vector Icon + Industrial Active Badge */}
      <div className="flex items-start justify-between">
        <div
          className={`w-13 h-13 rounded-xl flex items-center justify-center transition-all ${
            selected
              ? "bg-[#DFFF00] text-black shadow-md shadow-[#DFFF00]/30"
              : "bg-[#1A1A1A] text-gray-400 group-hover:text-gray-200 group-hover:bg-[#222222]"
          }`}
        >
          <IconComponent className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Selected Check Indicator */}
        <div
          className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
            selected
              ? "bg-[#DFFF00] border-[#DFFF00] text-black shadow-sm"
              : "border-[#2A2A2A] bg-[#141414] text-transparent"
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3.5] ${selected ? "opacity-100" : "opacity-0"}`} />
        </div>
      </div>

      {/* Content Section */}
      <div className="mt-4">
        <div className="flex items-baseline justify-between">
          <h3 className="font-metric text-xl font-bold uppercase tracking-tight text-white group-hover:text-gray-100">
            {name}
          </h3>
          <span
            className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
              selected
                ? "bg-[#DFFF00]/20 text-[#DFFF00] border border-[#DFFF00]/40"
                : "bg-[#1C1C1C] text-gray-500"
            }`}
          >
            {selected ? "AKTIF" : "OFF"}
          </span>
        </div>

        <p className="text-[11px] font-bold text-[#DFFF00] mt-0.5 tracking-wide">
          {subtitle}
        </p>
        <p className="text-xs text-gray-400 mt-1.5 leading-relaxed font-sans">
          {desc}
        </p>
      </div>
    </div>
  );
};
