"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import {
  ALL_MUSCLES,
  GOAL_LABEL_ID,
  JOINT_LABEL_ID,
  PROGRAM_CONFIG,
  type EquipmentId,
  type Goal,
  type JointAreaKey,
  type Level,
  type MuscleKey,
  type UserProfile,
} from "@/lib/program/program-types";
import { generatePlan } from "@/lib/program/generator";
import { savePlan, saveProfile } from "@/lib/program/storage";

const TOTAL_STEPS = 7;

const GOALS: Goal[] = ["otot", "diet", "kekuatan", "umum"];
const LEVELS: Level[] = ["Pemula", "Menengah", "Lanjutan"];
const DAYS_OPTIONS: Array<2 | 3 | 4 | 5 | 6> = [2, 3, 4, 5, 6];
const DURATION_OPTIONS: Array<30 | 45 | 60 | 75 | 90> = [30, 45, 60, 75, 90];

const EQUIPMENT_OPTIONS: Array<{ id: EquipmentId; label: string; hint: string }> = [
  { id: "barbell", label: "Barbell", hint: "Tongkat & pelat beban" },
  { id: "dumbbell", label: "Dumbbell", hint: "Beban bebas sepasang" },
  { id: "kettlebell", label: "Kettlebell", hint: "Ayunan & balistik" },
  { id: "plate", label: "Weight Plate", hint: "Pelat beban pegangan" },
  { id: "bodyweight", label: "Berat Badan", hint: "Selalu tersedia tanpa alat" },
];

const MUSCLE_LABEL_ID: Record<MuscleKey, string> = {
  CHEST: "Dada",
  BACK: "Punggung (Lats)",
  SHOULDERS: "Bahu",
  BICEPS: "Lengan Depan (Biceps)",
  TRICEPS: "Lengan Belakang (Triceps)",
  QUADRICEPS: "Paha Depan (Quads)",
  HAMSTRINGS: "Paha Belakang",
  GLUTES: "Pantat / Pinggul (Glutes)",
  CALVES: "Betis (Calves)",
  ABDOMINALS: "Perut (Abs)",
  OBLIQUES: "Pinggang Samping",
  FOREARMS: "Lengan Bawah",
  TRAPS: "Pundak Atas (Traps)",
};

const JOINT_KEYS: JointAreaKey[] = [
  "shoulder",
  "elbow",
  "wrist",
  "lowerBack",
  "knee",
  "ankle",
];

const STEP_TITLES: Record<number, string> = {
  1: "Konfirmasi Usia",
  2: "Tujuan Latihan",
  3: "Level & Jadwal",
  4: "Peralatan Tersedia",
  5: "Otot Prioritas",
  6: "Keluhan Sendi",
  7: "Ringkasan Program",
};

export const ProfileWizard: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [adultConfirmed, setAdultConfirmed] = useState<boolean>(false);
  const [goal, setGoal] = useState<Goal>("otot");
  const [level, setLevel] = useState<Level>("Pemula");
  const [daysPerWeek, setDaysPerWeek] = useState<2 | 3 | 4 | 5 | 6>(3);
  const [sessionMinutes, setSessionMinutes] = useState<30 | 45 | 60 | 75 | 90>(45);
  const [equipment, setEquipment] = useState<EquipmentId[]>(["bodyweight"]);
  const [priorityMuscles, setPriorityMuscles] = useState<MuscleKey[]>([]);
  const [jointComplaints, setJointComplaints] = useState<JointAreaKey[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const adultInputRef = useRef<HTMLInputElement | null>(null);
  const firstEquipmentRef = useRef<HTMLInputElement | null>(null);
  const isFirstRenderRef = useRef<boolean>(true);
  const timestampRef = useRef<number>(Date.now());

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step]);

  const currentProfile: UserProfile = useMemo(
    () => ({
      id: "me",
      updatedAt: timestampRef.current,
      adultConfirmed,
      goal,
      level,
      daysPerWeek,
      sessionMinutes,
      equipment,
      priorityMuscles,
      jointComplaints,
    }),
    [
      adultConfirmed,
      goal,
      level,
      daysPerWeek,
      sessionMinutes,
      equipment,
      priorityMuscles,
      jointComplaints,
    ]
  );

  // Pratinjau rencana & warnings[] di langkah ringkasan sebelum menyimpan
  const previewPlan = useMemo(() => {
    if (step !== TOTAL_STEPS) return null;
    return generatePlan(currentProfile);
  }, [step, currentProfile]);

  const toggleEquipment = (id: EquipmentId) => {
    setErrorMsg("");
    setEquipment((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const togglePriorityMuscle = (muscle: MuscleKey) => {
    setErrorMsg("");
    setPriorityMuscles((prev) => {
      if (prev.includes(muscle)) {
        return prev.filter((m) => m !== muscle);
      }
      if (prev.length >= PROGRAM_CONFIG.priority.maxPriorityMuscles) {
        return prev;
      }
      return [...prev, muscle];
    });
  };

  const toggleJointComplaint = (joint: JointAreaKey) => {
    setJointComplaints((prev) =>
      prev.includes(joint) ? prev.filter((j) => j !== joint) : [...prev, joint]
    );
  };

  const validateCurrentStep = (): boolean => {
    if (step === 1 && !adultConfirmed) {
      setErrorMsg("Centang konfirmasi usia 18 tahun atau lebih untuk melanjutkan.");
      adultInputRef.current?.focus();
      return false;
    }
    if (step === 4 && equipment.length === 0) {
      setErrorMsg("Pilih minimal 1 alat (berat badan selalu tersedia).");
      firstEquipmentRef.current?.focus();
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleBack = () => {
    setErrorMsg("");
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    if (step < TOTAL_STEPS) {
      setStep((prev) => prev + 1);
      return;
    }

    if (isSaving) return;
    setIsSaving(true);
    setErrorMsg("");

    try {
      const profileToSave: UserProfile = {
        ...currentProfile,
        updatedAt: Date.now(),
      };
      const plan = generatePlan(profileToSave);
      await saveProfile(profileToSave);
      await savePlan(plan);
      router.push("/program");
    } catch {
      setErrorMsg("Gagal menyimpan rencana ke penyimpanan lokal.");
      setIsSaving(false);
    }
  };

  const progressPct = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="w-full max-w-lg mx-auto bg-[#0E1015] border border-zinc-800 rounded-2xl p-4 sm:p-6 shadow-2xl space-y-5">
      {/* Progress Bar & Step Counter */}
      <nav aria-label="Progres Penyusunan Program" className="space-y-2">
        <div className="flex items-center justify-between text-xs font-metric uppercase tracking-wider">
          <span className="text-lime-400 font-bold" aria-current="step">
            Langkah {step} dari {TOTAL_STEPS}
          </span>
          <span className="text-zinc-400">{STEP_TITLES[step]}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-lime-400 transition-all duration-200"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </nav>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {/* LANGKAH 1: Konfirmasi Usia 18+ */}
        {step === 1 && (
          <div className="space-y-4">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none"
            >
              Konfirmasi Usia
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Program ini disusun untuk pengguna dewasa. Kami hanya menyimpan konfirmasi ini, bukan umur atau tanggal lahir Anda.
            </p>

            <label
              htmlFor="adult-confirm"
              className={`flex items-center gap-3 p-4 rounded-xl border min-h-[52px] cursor-pointer transition-colors ${
                adultConfirmed
                  ? "bg-lime-400/10 border-lime-400 text-white"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-200 hover:border-zinc-500"
              }`}
            >
              <input
                ref={adultInputRef}
                id="adult-confirm"
                name="adultConfirmed"
                type="checkbox"
                checked={adultConfirmed}
                aria-invalid={Boolean(errorMsg)}
                aria-describedby={errorMsg ? "wizard-error" : undefined}
                onChange={(e) => {
                  setAdultConfirmed(e.target.checked);
                  if (e.target.checked) setErrorMsg("");
                }}
                className="w-5 h-5 accent-lime-400 shrink-0 cursor-pointer"
              />
              <span className="text-sm font-semibold">
                Saya berusia 18 tahun atau lebih
              </span>
            </label>
          </div>
        )}

        {/* LANGKAH 2: Tujuan */}
        {step === 2 && (
          <fieldset className="space-y-3">
            <legend
              ref={headingRef as React.Ref<HTMLLegendElement>}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none mb-2"
            >
              Apa Tujuan Utama Anda?
            </legend>
            <div className="space-y-2.5">
              {GOALS.map((g) => (
                <label
                  key={g}
                  htmlFor={`goal-${g}`}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border min-h-[52px] cursor-pointer transition-colors ${
                    goal === g
                      ? "bg-lime-400/10 border-lime-400 text-white"
                      : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  <input
                    id={`goal-${g}`}
                    type="radio"
                    name="goal"
                    value={g}
                    checked={goal === g}
                    onChange={() => setGoal(g)}
                    className="w-4 h-4 accent-lime-400 shrink-0 cursor-pointer"
                  />
                  <span className="text-sm font-semibold">{GOAL_LABEL_ID[g]}</span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {/* LANGKAH 3: Level, Hari per Minggu, Durasi Sesi */}
        {step === 3 && (
          <div className="space-y-5">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none"
            >
              Level &amp; Jadwal Latihan
            </h2>

            <fieldset className="space-y-2">
              <legend className="text-xs font-metric font-bold uppercase tracking-wider text-zinc-400">
                Pengalaman Latihan
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {LEVELS.map((lv) => (
                  <label
                    key={lv}
                    htmlFor={`level-${lv}`}
                    className={`flex items-center justify-center gap-1.5 px-2 py-3 rounded-xl border min-h-[48px] text-xs font-bold cursor-pointer transition-colors ${
                      level === lv
                        ? "bg-lime-400/15 border-lime-400 text-lime-300"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      id={`level-${lv}`}
                      type="radio"
                      name="level"
                      value={lv}
                      checked={level === lv}
                      onChange={() => setLevel(lv)}
                      className="w-3.5 h-3.5 accent-lime-400 cursor-pointer"
                    />
                    <span>{lv}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-metric font-bold uppercase tracking-wider text-zinc-400">
                Hari Latihan per Minggu
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {DAYS_OPTIONS.map((d) => (
                  <label
                    key={d}
                    htmlFor={`days-${d}`}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border min-h-[48px] text-xs font-bold cursor-pointer transition-colors ${
                      daysPerWeek === d
                        ? "bg-lime-400/15 border-lime-400 text-lime-300"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      id={`days-${d}`}
                      type="radio"
                      name="daysPerWeek"
                      value={d}
                      checked={daysPerWeek === d}
                      onChange={() => setDaysPerWeek(d)}
                      className="sr-only"
                    />
                    <span className="font-metric text-base">{d}x</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-metric font-bold uppercase tracking-wider text-zinc-400">
                Durasi Maksimal per Sesi
              </legend>
              <div className="grid grid-cols-5 gap-2">
                {DURATION_OPTIONS.map((m) => (
                  <label
                    key={m}
                    htmlFor={`dur-${m}`}
                    className={`flex flex-col items-center justify-center py-2.5 rounded-xl border min-h-[48px] text-xs font-bold cursor-pointer transition-colors ${
                      sessionMinutes === m
                        ? "bg-lime-400/15 border-lime-400 text-lime-300"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      id={`dur-${m}`}
                      type="radio"
                      name="sessionMinutes"
                      value={m}
                      checked={sessionMinutes === m}
                      onChange={() => setSessionMinutes(m)}
                      className="sr-only"
                    />
                    <span className="font-metric text-sm">{m}m</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {/* LANGKAH 4: Alat yang Dimiliki */}
        {step === 4 && (
          <fieldset className="space-y-3">
            <legend
              ref={headingRef as React.Ref<HTMLLegendElement>}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none mb-1"
            >
              Alat yang Anda Miliki
            </legend>
            <p className="text-xs text-zinc-400">
              Pilih minimal 1. Gerakan berat badan (bodyweight) selalu tersedia sebagai cadangan.
            </p>
            <div className="space-y-2">
              {EQUIPMENT_OPTIONS.map((eq, eqIdx) => {
                const checked = equipment.includes(eq.id);
                return (
                  <label
                    key={eq.id}
                    htmlFor={`eq-${eq.id}`}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl border min-h-[52px] cursor-pointer transition-colors ${
                      checked
                        ? "bg-lime-400/10 border-lime-400 text-white"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        ref={eqIdx === 0 ? firstEquipmentRef : undefined}
                        id={`eq-${eq.id}`}
                        type="checkbox"
                        name="equipment"
                        value={eq.id}
                        checked={checked}
                        onChange={() => toggleEquipment(eq.id)}
                        className="w-4 h-4 accent-lime-400 shrink-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-sm font-semibold">{eq.label}</div>
                        <div className="text-[11px] text-zinc-400">{eq.hint}</div>
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* LANGKAH 5: Otot Prioritas (Opsional, maks 2) */}
        {step === 5 && (
          <fieldset className="space-y-3">
            <legend
              ref={headingRef as React.Ref<HTMLLegendElement>}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none mb-1"
            >
              Otot Prioritas (Opsional)
            </legend>
            <p className="text-xs text-zinc-400">
              Pilih maksimal {PROGRAM_CONFIG.priority.maxPriorityMuscles} otot yang ingin difokuskan ({priorityMuscles.length}/{PROGRAM_CONFIG.priority.maxPriorityMuscles} dipilih).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[340px] overflow-y-auto pr-1">
              {ALL_MUSCLES.map((muscle) => {
                const checked = priorityMuscles.includes(muscle);
                const disabled =
                  !checked &&
                  priorityMuscles.length >= PROGRAM_CONFIG.priority.maxPriorityMuscles;
                return (
                  <label
                    key={muscle}
                    htmlFor={`prio-${muscle}`}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border min-h-[48px] transition-colors ${
                      disabled
                        ? "bg-zinc-900/30 border-zinc-800/50 text-zinc-500 cursor-not-allowed opacity-60"
                        : checked
                        ? "bg-lime-400/10 border-lime-400 text-white cursor-pointer"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600 cursor-pointer"
                    }`}
                  >
                    <input
                      id={`prio-${muscle}`}
                      type="checkbox"
                      name="priorityMuscles"
                      value={muscle}
                      checked={checked}
                      disabled={disabled}
                      onChange={() => togglePriorityMuscle(muscle)}
                      className="w-4 h-4 accent-lime-400 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <span className="text-xs font-semibold truncate">
                      {MUSCLE_LABEL_ID[muscle]}
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* LANGKAH 6: Keluhan Sendi (Opsional) */}
        {step === 6 && (
          <fieldset className="space-y-3">
            <legend
              ref={headingRef as React.Ref<HTMLLegendElement>}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none mb-1"
            >
              Keluhan Sendi (Opsional)
            </legend>
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-200 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Ini hanya untuk menghindari gerakan tertentu, bukan penilaian medis.
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {JOINT_KEYS.map((joint) => {
                const checked = jointComplaints.includes(joint);
                return (
                  <label
                    key={joint}
                    htmlFor={`joint-${joint}`}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border min-h-[48px] cursor-pointer transition-colors ${
                      checked
                        ? "bg-amber-400/10 border-amber-400 text-white"
                        : "bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    <input
                      id={`joint-${joint}`}
                      type="checkbox"
                      name="jointComplaints"
                      value={joint}
                      checked={checked}
                      onChange={() => toggleJointComplaint(joint)}
                      className="w-4 h-4 accent-amber-400 shrink-0 cursor-pointer"
                    />
                    <span className="text-xs font-semibold">{JOINT_LABEL_ID[joint]}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}

        {/* LANGKAH 7: Ringkasan + Peringatan Sebelum Menyimpan */}
        {step === 7 && previewPlan && (
          <div className="space-y-4">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="font-metric text-xl sm:text-2xl font-extrabold uppercase text-white outline-none"
            >
              Ringkasan Program
            </h2>

            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Tujuan</span>
                <span className="font-semibold text-white text-right">
                  {GOAL_LABEL_ID[goal]}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Level &amp; Jadwal</span>
                <span className="font-semibold text-white text-right">
                  {level} • {daysPerWeek} hari/minggu • {sessionMinutes} menit
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Alat</span>
                <span className="font-semibold text-white text-right">
                  {equipment.join(", ")} (bodyweight tersedia)
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Otot Prioritas</span>
                <span className="font-semibold text-white text-right">
                  {priorityMuscles.length > 0
                    ? priorityMuscles.map((m) => MUSCLE_LABEL_ID[m]).join(", ")
                    : "Tidak ada"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Keluhan Sendi</span>
                <span className="font-semibold text-white text-right">
                  {jointComplaints.length > 0
                    ? jointComplaints.map((j) => JOINT_LABEL_ID[j]).join(", ")
                    : "Tidak ada"}
                </span>
              </div>
            </div>

            {previewPlan.warnings.length > 0 && (
              <div
                role="status"
                className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 space-y-1.5 text-xs text-amber-200"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-400 uppercase font-metric">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Peringatan Keterbatasan Program</span>
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  {previewPlan.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-400 space-y-1">
              <div className="font-semibold text-zinc-300">
                {previewPlan.name} ({previewPlan.mesocycleWeeks} minggu)
              </div>
              <p>{previewPlan.rationale[0]}</p>
            </div>
          </div>
        )}

        {/* Pesan Validasi / Error */}
        {errorMsg && (
          <div
            id="wizard-error"
            role="alert"
            aria-live="polite"
            className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs font-semibold text-rose-300"
          >
            {errorMsg}
          </div>
        )}

        {/* Tombol Navigasi Bawah */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-zinc-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSaving}
              className="px-4 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 font-metric font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 min-h-[48px] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali</span>
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 text-black font-metric font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 min-h-[48px] transition-colors ml-auto"
            >
              <span>Lanjut</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 disabled:opacity-60 text-black font-metric font-extrabold text-sm uppercase tracking-wider flex items-center gap-1.5 min-h-[48px] transition-colors ml-auto"
            >
              <Sparkles className="w-4 h-4 stroke-[2.5]" />
              <span>{isSaving ? "Menyimpan..." : "Buat program"}</span>
              {!isSaving && <Check className="w-4 h-4 stroke-[3]" />}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};
