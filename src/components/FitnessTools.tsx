"use client";

import React, { useEffect, useState } from "react";
import {
  Scale,
  Utensils,
  Plus,
  Download,
  Upload,
  Trash2,
  History,
  CheckCircle2,
  AlertCircle,
  Dumbbell,
  Clock,
  HardDrive,
} from "lucide-react";
import {
  getAllSessionsOffline,
  saveWorkoutSessionOffline,
  deleteWorkoutSessionOffline,
  clearAllWorkoutSessionsOffline,
  type WorkoutSessionPayload,
} from "@/lib/offline-storage";
import {
  getProfile,
  saveProfile,
  listPlans,
  savePlan,
} from "@/lib/program/storage";
import type { ProgramPlan, UserProfile } from "@/lib/program/program-types";

interface MealPreset {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  portion: string;
}

interface BackupBundleV1 {
  app: "ayo-olahraga";
  version: 1;
  exportedAt: number;
  sessions: WorkoutSessionPayload[];
  profile: UserProfile | null;
  plans: ProgramPlan[];
}

const INDONESIAN_MEALS: MealPreset[] = [
  { id: "padang-rendang", name: "Nasi Padang + Rendang Daging", calories: 680, protein: 32, carbs: 75, fat: 28, portion: "1 porsi komplit" },
  { id: "ayam-geprek", name: "Ayam Geprek Sambal Bawang + Nasi", calories: 620, protein: 35, carbs: 68, fat: 24, portion: "1 porsi" },
  { id: "sate-ayam", name: "Sate Ayam Madura + Lontong", calories: 480, protein: 28, carbs: 52, fat: 18, portion: "10 tusuk + lontong" },
  { id: "gado-gado", name: "Gado-Gado Telur Bumbu Kacang", calories: 380, protein: 16, carbs: 44, fat: 16, portion: "1 porsi" },
  { id: "soto-ayam", name: "Soto Ayam Bening + Nasi", calories: 410, protein: 24, carbs: 58, fat: 9, portion: "1 mangkuk + nasi" },
  { id: "telur-balado", name: "Nasi + 2 Telur Balado + Sayur", calories: 450, protein: 20, carbs: 62, fat: 14, portion: "1 piring" },
  { id: "tempe-tahu", name: "Tempe Orek + Tahu Bacem", calories: 240, protein: 15, carbs: 22, fat: 10, portion: "1 porsi pendamping" },
  { id: "bubur-ayam", name: "Bubur Ayam Komplit Cakwe", calories: 360, protein: 18, carbs: 54, fat: 8, portion: "1 mangkuk" },
];

export const FitnessTools: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"bmi" | "tdee" | "indo-meals" | "history-backup">("bmi");

  // BMI State
  const [weightKg, setWeightKg] = useState<number>(70);
  const [heightCm, setHeightCm] = useState<number>(172);

  // TDEE State
  const [gender, setGender] = useState<"male" | "female">("male");
  const [age, setAge] = useState<number>(24);
  const [activity, setActivity] = useState<number>(1.375); // 1.2: Sedentary, 1.375: Light, 1.55: Moderate, 1.725: Heavy
  const [goal, setGoal] = useState<"cut" | "maintain" | "bulk">("maintain");

  // Selected Meals tracker
  const [loggedMeals, setLoggedMeals] = useState<MealPreset[]>([]);

  // Local History & Backup State
  const [sessions, setSessions] = useState<WorkoutSessionPayload[]>([]);
  const [plansCount, setPlansCount] = useState<number>(0);
  const [statusNotice, setStatusNotice] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const refreshLocalRecords = async () => {
    try {
      const [loadedSessions, loadedPlans] = await Promise.all([
        getAllSessionsOffline(),
        listPlans(),
      ]);
      setSessions(loadedSessions);
      setPlansCount(loadedPlans?.length ?? 0);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    refreshLocalRecords();
  }, [activeTab]);

  const handleExportBackup = async () => {
    try {
      const [allSessions, profile, plans] = await Promise.all([
        getAllSessionsOffline(),
        getProfile(),
        listPlans(),
      ]);
      const payload: BackupBundleV1 = {
        app: "ayo-olahraga",
        version: 1,
        exportedAt: Date.now(),
        sessions: allSessions,
        profile: profile ?? null,
        plans: plans ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `ayo-olahraga-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatusNotice({
        type: "ok",
        text: `Backup berhasil diunduh (${allSessions.length} sesi latihan, ${(plans ?? []).length} program).`,
      });
    } catch {
      setStatusNotice({
        type: "err",
        text: "Gagal membuat file backup JSON.",
      });
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as Partial<BackupBundleV1>;
      if (!parsed || typeof parsed !== "object") {
        throw new Error("Format file tidak valid.");
      }

      let importedSessions = 0;
      let importedPlans = 0;

      if (Array.isArray(parsed.sessions)) {
        for (const s of parsed.sessions) {
          if (s && typeof s.id === "string" && Array.isArray(s.exercises)) {
            await saveWorkoutSessionOffline(s);
            importedSessions++;
          }
        }
      }

      if (parsed.profile && typeof parsed.profile === "object") {
        await saveProfile(parsed.profile as UserProfile);
      }

      if (Array.isArray(parsed.plans)) {
        for (const p of parsed.plans) {
          if (p && typeof p.id === "string" && Array.isArray(p.weeks)) {
            await savePlan(p);
            importedPlans++;
          }
        }
      }

      await refreshLocalRecords();
      setStatusNotice({
        type: "ok",
        text: `Data berhasil dipulihkan: ${importedSessions} sesi latihan & ${importedPlans} jadwal program.`,
      });
    } catch {
      setStatusNotice({
        type: "err",
        text: "File JSON tidak dikenali. Pastikan menggunakan file backup resmi Ayo-Olahraga.",
      });
    }
  };

  const handleDeleteSingleSession = async (sessionId: string) => {
    await deleteWorkoutSessionOffline(sessionId);
    await refreshLocalRecords();
    setStatusNotice({ type: "ok", text: "Sesi latihan berhasil dihapus dari perangkat." });
  };

  const handleClearAllSessions = async () => {
    await clearAllWorkoutSessionsOffline();
    await refreshLocalRecords();
    setConfirmClearAll(false);
    setStatusNotice({ type: "ok", text: "Seluruh riwayat sesi latihan berhasil dikosongkan." });
  };

  // Calculate BMI
  const heightInMeters = heightCm / 100;
  const bmiValue = Number((weightKg / (heightInMeters * heightInMeters)).toFixed(1));
  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: "Kekurangan Berat Badan", color: "text-amber-400", desc: "Perbanyak surplus kalori dan latihan beban." };
    if (bmi < 24.9) return { label: "Berat Badan Ideal (Normal)", color: "text-emerald-400", desc: "Pertahankan massa otot dan performa Anda!" };
    if (bmi < 29.9) return { label: "Kelebihan Berat (Overweight)", color: "text-orange-400", desc: "Prioritaskan defisit kalori moderat dan progressive overload." };
    return { label: "Obesitas", color: "text-rose-400", desc: "Konsultasikan pola makan dan tingkatkan aktivitas harian." };
  };
  const bmiCategory = getBmiCategory(bmiValue);

  // Calculate TDEE (Mifflin-St Jeor)
  const bmr =
    gender === "male"
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = Math.round(bmr * activity);
  const targetCalories =
    goal === "cut" ? tdee - 400 : goal === "bulk" ? tdee + 300 : tdee;

  const proteinGrams = Math.round(weightKg * (goal === "cut" ? 2.2 : 2.0));
  const fatGrams = Math.round((targetCalories * 0.25) / 9);
  const carbsGrams = Math.round((targetCalories - (proteinGrams * 4 + fatGrams * 9)) / 4);

  // Meal totals
  const totalMealCalories = loggedMeals.reduce((acc, m) => acc + m.calories, 0);
  const totalMealProtein = loggedMeals.reduce((acc, m) => acc + m.protein, 0);

  return (
    <div className="w-full bg-[#0c0e14] border border-gray-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <h3 className="text-lg font-black text-white tracking-tight">
              Alat Kebugaran, Nutrisi &amp; Data Lokal
            </h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Kalkulator BMI, estimasi TDEE makro, kalori makanan Indonesia, serta riwayat &amp; backup offline.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("bmi")}
            className={`px-3 py-2 rounded-lg transition-all min-h-[38px] ${
              activeTab === "bmi"
                ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            BMI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tdee")}
            className={`px-3 py-2 rounded-lg transition-all min-h-[38px] ${
              activeTab === "tdee"
                ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            TDEE &amp; Kalori
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("indo-meals")}
            className={`px-3 py-2 rounded-lg transition-all min-h-[38px] ${
              activeTab === "indo-meals"
                ? "bg-orange-500 text-black shadow-md shadow-orange-500/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Makanan Lokal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("history-backup")}
            className={`px-3 py-2 rounded-lg transition-all inline-flex items-center gap-1.5 min-h-[38px] ${
              activeTab === "history-backup"
                ? "bg-lime-400 text-black shadow-md shadow-lime-400/20"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat &amp; Backup</span>
          </button>
        </div>
      </div>

      {/* TAB 1: BMI CALCULATOR */}
      {activeTab === "bmi" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-150">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Tinggi Badan (cm)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="130"
                  max="210"
                  value={heightCm}
                  onChange={(e) => setHeightCm(Number(e.target.value))}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <span className="w-16 font-mono font-bold text-sm text-right text-white">
                  {heightCm} cm
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1.5">
                Berat Badan (kg)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="40"
                  max="150"
                  value={weightKg}
                  onChange={(e) => setWeightKg(Number(e.target.value))}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <span className="w-16 font-mono font-bold text-sm text-right text-white">
                  {weightKg} kg
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-gray-900/60 border border-gray-800 flex flex-col justify-center text-center sm:text-left">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              Skor Indeks Massa Tubuh (BMI)
            </span>
            <div className="text-4xl font-black text-white font-mono mt-1 mb-2">
              {bmiValue}
            </div>
            <div className={`text-sm font-bold ${bmiCategory.color}`}>
              {bmiCategory.label}
            </div>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              {bmiCategory.desc}
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TDEE & MACROS */}
      {activeTab === "tdee" && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Gender</label>
              <div className="grid grid-cols-2 gap-1 bg-gray-900 p-1 rounded-xl border border-gray-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setGender("male")}
                  className={`py-1.5 rounded-lg ${gender === "male" ? "bg-orange-500 text-black" : "text-gray-400"}`}
                >
                  Pria
                </button>
                <button
                  type="button"
                  onClick={() => setGender("female")}
                  className={`py-1.5 rounded-lg ${gender === "female" ? "bg-orange-500 text-black" : "text-gray-400"}`}
                >
                  Wanita
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Usia (Tahun)</label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Aktivitas Mingguan</label>
              <select
                value={activity}
                onChange={(e) => setActivity(Number(e.target.value))}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
              >
                <option value={1.2}>Jarang Latihan (Sedentary)</option>
                <option value={1.375}>Latihan 1-3x / minggu</option>
                <option value={1.55}>Latihan 3-5x / minggu</option>
                <option value={1.725}>Latihan 6-7x / minggu</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">Target Tubuh</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as any)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-2.5 py-2 text-xs font-medium text-white focus:outline-none focus:border-orange-500"
              >
                <option value="cut">Fat Loss (Defisit)</option>
                <option value="maintain">Maintenance</option>
                <option value="bulk">Otot / Bulking (Surplus)</option>
              </select>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <span className="text-[10px] uppercase font-bold text-orange-400 tracking-wider">
                Target Harian
              </span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {targetCalories.toLocaleString()} <span className="text-xs text-gray-400 font-sans">kkal</span>
              </div>
              <span className="text-[10px] text-gray-400">Maintenance: {tdee} kkal</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                Protein
              </span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {proteinGrams} <span className="text-xs text-gray-400 font-sans">gram</span>
              </div>
              <span className="text-[10px] text-gray-400">{(proteinGrams * 4)} kkal (pemulihan)</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
                Karbohidrat
              </span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {carbsGrams} <span className="text-xs text-gray-400 font-sans">gram</span>
              </div>
              <span className="text-[10px] text-gray-400">{(carbsGrams * 4)} kkal (bahan bakar)</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                Lemak Sehat
              </span>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {fatGrams} <span className="text-xs text-gray-400 font-sans">gram</span>
              </div>
              <span className="text-[10px] text-gray-400">{(fatGrams * 9)} kkal (hormon)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INDONESIAN MEALS PRESETS */}
      {activeTab === "indo-meals" && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-gray-900/60 border border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white">Log Makanan Hari Ini:</span>
                <div className="text-xs text-gray-400">
                  Total: <strong className="text-orange-400 font-mono">{totalMealCalories} kkal</strong> | Protein: <strong className="text-emerald-400 font-mono">{totalMealProtein}g</strong>
                </div>
              </div>
            </div>

            {loggedMeals.length > 0 && (
              <button
                type="button"
                onClick={() => setLoggedMeals([])}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 self-end sm:self-auto"
              >
                Reset Log
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INDONESIAN_MEALS.map((meal) => (
              <div
                key={meal.id}
                className="p-3.5 rounded-2xl bg-gray-900/40 border border-gray-800 hover:border-gray-700 flex items-center justify-between gap-3 transition-colors"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{meal.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">{meal.portion}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono">
                    <span className="text-orange-400 font-bold">{meal.calories} kkal</span>
                    <span className="text-gray-600">•</span>
                    <span className="text-emerald-400 font-semibold">{meal.protein}g Protein</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setLoggedMeals((prev) => [...prev, meal])}
                  className="p-2.5 rounded-xl bg-gray-800 hover:bg-orange-500 hover:text-black text-gray-300 transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Tambah ke Log"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: RIWAYAT LATIHAN & BACKUP LOKAL JSON */}
      {activeTab === "history-backup" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Backup & Restore Card */}
          <div className="p-4 rounded-2xl bg-gray-900/70 border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-400/10 border border-lime-400/30 flex items-center justify-center text-lime-400 shrink-0 mt-0.5">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white">
                  Cadangkan &amp; Pulihkan Data Perangkat (Offline JSON)
                </h4>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                  Tersimpan di perangkat ini:{" "}
                  <strong className="text-white">{sessions.length} sesi latihan</strong> dan{" "}
                  <strong className="text-white">{plansCount} program</strong>. Ekspor ke file JSON sebelum ganti HP atau hapus cache browser.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleExportBackup}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-metric font-bold text-xs uppercase tracking-wider transition-colors min-h-[42px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Ekspor JSON</span>
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-metric font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors min-h-[42px]">
                <Upload className="w-3.5 h-3.5 text-lime-400" />
                <span>Impor JSON</span>
                <input
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {statusNotice && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                statusNotice.type === "ok"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-300"
              }`}
            >
              {statusNotice.type === "ok" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{statusNotice.text}</span>
            </div>
          )}

          {/* Sessions History List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Riwayat Sesi Latihan ({sessions.length})
              </span>

              {sessions.length > 0 && (
                <div>
                  {confirmClearAll ? (
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleClearAllSessions}
                        className="px-2.5 py-1 rounded-lg bg-rose-500 text-black text-xs font-bold"
                      >
                        Yakin Kosongkan Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmClearAll(false)}
                        className="px-2.5 py-1 rounded-lg bg-gray-800 text-gray-300 text-xs font-semibold"
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmClearAll(true)}
                      className="text-xs font-semibold text-rose-400 hover:text-rose-300"
                    >
                      Kosongkan Semua
                    </button>
                  )}
                </div>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="p-6 rounded-2xl bg-gray-900/40 border border-gray-800 text-center space-y-1.5">
                <Dumbbell className="w-6 h-6 text-gray-500 mx-auto" />
                <p className="text-xs sm:text-sm font-semibold text-gray-300">
                  Belum ada riwayat sesi latihan tersimpan
                </p>
                <p className="text-xs text-gray-500">
                  Selesaikan sesi di Tracker atau impor file backup JSON Anda.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {sessions.slice(0, 20).map((session) => {
                  const dateLabel = new Date(session.startedAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });
                  const mins = Math.max(1, Math.round(session.durationSeconds / 60));
                  const completedSets = session.exercises.reduce(
                    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
                    0
                  );

                  return (
                    <div
                      key={session.id}
                      className="p-3.5 rounded-2xl bg-gray-900/50 border border-gray-800 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-white truncate">
                            {session.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">
                            {dateLabel}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-mono">
                          <span className="text-lime-400 font-bold">
                            {session.totalVolumeKg.toLocaleString()} KG
                          </span>
                          <span>•</span>
                          <span>{completedSets} set</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {mins} mnt
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteSingleSession(session.id)}
                        className="p-2 rounded-xl bg-gray-900 hover:bg-rose-500/15 border border-gray-800 hover:border-rose-500/40 text-gray-400 hover:text-rose-300 transition-colors shrink-0 min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title="Hapus sesi ini"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
