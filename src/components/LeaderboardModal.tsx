"use client";

import React, { useState } from "react";
import { Trophy, Flame, Shield, X, Medal, Sparkles, Dumbbell } from "lucide-react";

interface LeaderboardUser {
  rank: number;
  name: string;
  avatar: string;
  tier: "Elite Pro" | "Gold" | "Silver" | "Bronze";
  workoutsCount: number;
  totalVolumeKg: number;
  streakDays: number;
}

const SAMPLE_CHAMPIONS: LeaderboardUser[] = [
  { rank: 1, name: "Dimas Pratama", avatar: "DP", tier: "Elite Pro", workoutsCount: 26, totalVolumeKg: 48500, streakDays: 24 },
  { rank: 2, name: "Budi Santoso", avatar: "BS", tier: "Gold", workoutsCount: 22, totalVolumeKg: 41200, streakDays: 19 },
  { rank: 3, name: "Rian Hidayat", avatar: "RH", tier: "Gold", workoutsCount: 20, totalVolumeKg: 38900, streakDays: 14 },
  { rank: 4, name: "Andi Wijaya", avatar: "AW", tier: "Silver", workoutsCount: 18, totalVolumeKg: 29400, streakDays: 10 },
  { rank: 5, name: "Sarah Fitriani", avatar: "SF", tier: "Silver", workoutsCount: 16, totalVolumeKg: 25100, streakDays: 8 },
  { rank: 6, name: "Reza Maulana", avatar: "RM", tier: "Bronze", workoutsCount: 12, totalVolumeKg: 18700, streakDays: 5 },
];

export const LeaderboardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<"volume" | "streak">("volume");

  if (!isOpen) return null;

  const sorted = [...SAMPLE_CHAMPIONS].sort((a, b) =>
    filter === "volume" ? b.totalVolumeKg - a.totalVolumeKg : b.streakDays - a.streakDays
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0c0e14] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-800 bg-gray-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-black font-black shadow-lg shadow-orange-500/20">
              <Trophy className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Papan Juara (Champions Leaderboard)
              </h3>
              <p className="text-xs text-gray-400">Komunitas atlet Ayo-Olahraga minggu ini</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-gray-800/80 bg-gray-950">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Urutkan Berdasarkan:
          </span>
          <div className="flex items-center gap-1 bg-gray-900 p-1 rounded-xl text-xs font-bold border border-gray-800">
            <button
              onClick={() => setFilter("volume")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === "volume" ? "bg-orange-500 text-black shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Total Volume (kg)
            </button>
            <button
              onClick={() => setFilter("streak")}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === "streak" ? "bg-orange-500 text-black shadow" : "text-gray-400 hover:text-white"
              }`}
            >
              Streak (Hari)
            </button>
          </div>
        </div>

        {/* List of Champions */}
        <div className="p-5 space-y-2.5 overflow-y-auto flex-1 custom-scrollbar">
          {sorted.map((user, idx) => {
            const isTop3 = idx < 3;
            const medalColor =
              idx === 0
                ? "bg-amber-400 text-black border-amber-300"
                : idx === 1
                ? "bg-slate-300 text-black border-slate-200"
                : idx === 2
                ? "bg-amber-700 text-white border-amber-600"
                : "bg-gray-800 text-gray-400 border-gray-700";

            return (
              <div
                key={user.name}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                  isTop3
                    ? "bg-gray-900/80 border-gray-700 hover:border-orange-500/40"
                    : "bg-gray-900/30 border-gray-800/80"
                }`}
              >
                {/* Rank & Avatar */}
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${medalColor}`}
                  >
                    {idx + 1}
                  </span>
                  <div className="w-9 h-9 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center text-xs font-bold text-gray-200">
                    {user.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white">{user.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-orange-500/10 text-orange-400 border border-orange-500/20">
                        {user.tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                      <span>{user.workoutsCount} Sesi Selesai</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 text-orange-400">
                        <Flame className="w-3 h-3 fill-current" /> {user.streakDays} hari streak
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="font-mono text-sm font-black text-white">
                    {filter === "volume"
                      ? `${user.totalVolumeKg.toLocaleString()} kg`
                      : `${user.streakDays} Hari`}
                  </div>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {filter === "volume" ? "Volume Angkat" : "Konsistensi"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

