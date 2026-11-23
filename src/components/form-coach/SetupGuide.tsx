"use client";

import React from "react";
import { Smartphone, Eye, Maximize, Sun, ArrowRight, Info } from "lucide-react";

interface SetupGuideProps {
  exerciseName: string;
  cameraTip?: string;
  view?: "side" | "front";
  onStart: () => void;
}

export default function SetupGuide({
  exerciseName,
  cameraTip,
  view = "side",
  onStart,
}: SetupGuideProps) {
  const steps = [
    {
      icon: <Smartphone className="w-5 h-5 text-[#DFFF00]" />,
      title: "Posisi Ponsel",
      desc:
        cameraTip ||
        (view === "front"
          ? "Letakkan HP setinggi dada, 2–3 meter di depan Anda dengan stabil."
          : "Letakkan HP setinggi pinggul, 2–3 meter di samping Anda dengan stabil."),
    },
    {
      icon: <Eye className="w-5 h-5 text-[#DFFF00]" />,
      title: view === "front" ? "Sudut Pandang Depan" : "Sudut Pandang Samping",
      desc:
        view === "front"
          ? "Berdiri atau bersiap dengan hadap lurus ke kamera."
          : "Berdiri atau bersiap dengan sisi kiri/kanan tubuh menghadap langsung ke kamera.",
    },
    {
      icon: <Maximize className="w-5 h-5 text-[#DFFF00]" />,
      title: "Visibilitas Penuh",
      desc: "Pastikan seluruh tubuh dari puncak kepala hingga ujung kaki tampak di dalam layar.",
    },
    {
      icon: <Sun className="w-5 h-5 text-[#DFFF00]" />,
      title: "Pencahayaan & Pakaian",
      desc: "Gunakan ruangan cukup terang dan kenakan pakaian yang pas (tidak terlalu kedodoran).",
    },
  ];

  return (
    <div className="absolute inset-0 z-30 bg-[#080808]/95 backdrop-blur-md p-3 sm:p-6 flex flex-col justify-between overflow-y-auto">
      {/* Header Panduan */}
      <div className="text-center max-w-md mx-auto pt-1">
        <span className="text-[10px] font-metric font-extrabold uppercase tracking-widest text-[#DFFF00] px-2 py-0.5 rounded-full bg-[#DFFF00]/10 border border-[#DFFF00]/30 inline-block mb-1.5">
          PANDUAN POSISI KAMERA
        </span>
        <h3 className="font-metric text-lg sm:text-2xl font-black uppercase text-white tracking-tight">
          SIAPKAN RUANG LATIHAN ({exerciseName})
        </h3>
        <p className="text-xs text-neutral-400 mt-1 font-sans leading-relaxed">
          Ikuti 4 langkah ini agar AI dapat membaca form dan sudut sendi Anda dengan akurat:
        </p>
        {cameraTip && (
          <div className="mt-2.5 p-2.5 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center gap-2 text-xs text-lime-300">
            <Info className="w-4 h-4 text-lime-400 shrink-0" />
            <span className="leading-snug font-medium">{cameraTip}</span>
          </div>
        )}
      </div>

      {/* 4 Kartu Langkah */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-xl mx-auto w-full my-2.5 sm:my-4">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex items-start gap-2.5 shadow-md"
          >
            <div className="w-8 h-8 rounded-xl bg-[#DFFF00]/10 border border-[#DFFF00]/25 flex items-center justify-center shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-metric font-black text-[#DFFF00]">0{idx + 1}.</span>
                <h4 className="font-metric text-xs sm:text-sm font-bold uppercase text-white truncate">
                  {step.title}
                </h4>
              </div>
              <p className="text-[11px] sm:text-xs text-neutral-400 font-sans leading-relaxed">
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer & Tombol Mulai */}
      <div className="max-w-md mx-auto w-full pb-1">
        <button
          type="button"
          onClick={onStart}
          className="w-full py-3 sm:py-3.5 rounded-xl bg-[#DFFF00] hover:bg-[#cbe600] text-black font-metric font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#DFFF00]/20 transition-all active:scale-98"
        >
          <span>MULAI FORM COACH</span>
          <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
        </button>
        <p className="text-[10px] text-center text-neutral-500 mt-1.5 font-sans">
          Setelah menekan Mulai, Anda memiliki 5 detik hitung mundur untuk mengambil posisi.
        </p>
      </div>
    </div>
  );
}
