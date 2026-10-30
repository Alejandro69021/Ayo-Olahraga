"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
  Layers,
  Camera,
  LineChart,
  Crown,
  Bell
} from "lucide-react";
import { CableMachineIcon } from "@/components/icons/EquipmentIcons";

interface ProFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProFeatureModal: React.FC<ProFeatureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState("");

  if (!isOpen) return null;

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoined(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0C0C0E] border-2 border-amber-500/40 rounded-3xl shadow-2xl shadow-black overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in slide-in-from-bottom-6 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Tutup Modal"
          className="absolute top-4 right-4 z-20 p-2.5 rounded-full bg-[#18181C]/90 text-zinc-400 hover:text-white border border-zinc-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header: shrink-0 to prevent flex compression & text clipping */}
        <div className="shrink-0 pt-7 pb-6 px-5 sm:px-6 bg-gradient-to-b from-[#1E190F] via-[#12100A] to-[#0C0C0E] border-b border-amber-500/20 text-center relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/10 blur-3xl rounded-full pointer-events-none" />

          {/* Pro Crown Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-400 text-[11px] font-metric font-extrabold uppercase tracking-wider mb-3">
            <Crown className="w-3.5 h-3.5 fill-current" />
            <span>AYO-OLAHRAGA PRO SUITE</span>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-400 text-black flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/20 border border-amber-300">
            <CableMachineIcon className="w-8 h-8 stroke-[2.2]" />
          </div>

          <h2 className="font-metric text-2xl sm:text-3xl font-black uppercase text-white tracking-tight leading-tight">
            CABLE & GYM MACHINES
          </h2>
          <p className="text-xs sm:text-sm text-zinc-300 mt-2 max-w-md mx-auto leading-relaxed font-sans px-2">
            Katalog 24+ gerakan isolasi kabel, Smith machine, dan kurva resistensi konstan sedang dalam tahap akhir kalibrasi biomekanika.
          </p>
        </div>

        {/* Features Content: scrollable body */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">
            KEUNGGULAN FITUR PRO:
          </span>

          <div className="grid grid-cols-1 gap-3">
            {/* Feature 1 */}
            <div className="p-3.5 rounded-2xl bg-[#141418] border border-zinc-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Layers className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h4 className="font-metric text-sm font-bold uppercase text-white">
                  24+ Gerakan Katrol & Smith Machine
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Lat Pulldown, Cable Crossover, Seated Row, Tricep Pushdown, Cable Lateral Raise, dan Hack Squat dengan form 3D presisi tinggi.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-3.5 rounded-2xl bg-[#141418] border border-zinc-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <Camera className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h4 className="font-metric text-sm font-bold uppercase text-white">
                  AI Real-Time Pose Angle Detector
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Analisis sudut siku 90° dan kedalaman squat otomatis via kamera perangkat Anda secara offline tanpa komputasi cloud.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-3.5 rounded-2xl bg-[#141418] border border-zinc-800 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-lime-400/15 text-lime-400 border border-lime-400/30 flex items-center justify-center shrink-0 mt-0.5">
                <LineChart className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="flex-1">
                <h4 className="font-metric text-sm font-bold uppercase text-white">
                  Hypertrophy Periodization & Deload
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                  Target RPE harian dan penjadwalan minggu deload otomatis berdasarkan akumulasi kelelahan otot tubuh.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive VIP Waiting List */}
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
            {!joined ? (
              <form onSubmit={handleJoin} className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="font-metric text-xs font-black uppercase text-amber-300 tracking-wide">
                    Dapatkan Akses Awal VIP (Diskon 50%)
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan alamat email Anda..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090A0D] border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-metric font-extrabold text-xs uppercase tracking-wider shrink-0 transition-all active:scale-95"
                  >
                    GABUNG
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 py-1 text-emerald-400">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-metric text-xs font-bold uppercase">
                  Terima kasih! Anda telah terdaftar di Antrean VIP Pro Member.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer: shrink-0 */}
        <div className="shrink-0 p-4 sm:p-5 bg-[#090A0D] border-t border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-metric font-bold text-xs uppercase tracking-wider transition-colors"
          >
            TUTUP
          </button>
        </div>
      </div>
    </div>
  );
};
