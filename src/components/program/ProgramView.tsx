"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Flame,
  Play,
  Plus,
} from "lucide-react";
import { EXERCISES_DATABASE, type ExerciseDetail } from "@/data/exercises";
import { EXERCISE_META } from "@/data/exercise-meta";
import {
  getAllSessionsOffline,
  type WorkoutSessionPayload,
} from "@/lib/offline-storage";
import {
  evaluateExerciseProgression,
  extractExerciseHistoryFromSessions,
  type ExerciseSessionEntry,
} from "@/lib/program/progression";
import {
  GOAL_LABEL_ID,
  type PlannedExercise,
  type PlannedWeek,
  type ProgramPlan,
} from "@/lib/program/program-types";
import { getActivePlan } from "@/lib/program/storage";
import {
  buildSessionTrackerHref,
  formatPlannedTarget,
} from "@/components/program/session-link";

const EXERCISE_BY_ID = new Map<string, ExerciseDetail>(
  EXERCISES_DATABASE.map((exercise) => [exercise.id, exercise])
);

export const ProgramView: React.FC = () => {
  const router = useRouter();
  const [plan, setPlan] = useState<ProgramPlan | null>(null);
  const [offlineSessions, setOfflineSessions] = useState<WorkoutSessionPayload[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(1);
  const [showRationale, setShowRationale] = useState<boolean>(false);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getActivePlan(),
      getAllSessionsOffline().catch(() => [] as WorkoutSessionPayload[]),
    ])
      .then(([loadedPlan, sessions]) => {
        if (cancelled) return;
        setPlan(loadedPlan);
        setOfflineSessions(sessions);
        if (loadedPlan && loadedPlan.weeks.length > 0) {
          setSelectedWeekIndex(loadedPlan.weeks[0].weekIndex);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const historyByExercise = useMemo(() => {
    const cache = new Map<string, ExerciseSessionEntry[]>();
    if (!plan) return cache;
    for (const week of plan.weeks) {
      for (const session of week.sessions) {
        for (const item of session.exercises) {
          if (!cache.has(item.exerciseId)) {
            cache.set(
              item.exerciseId,
              extractExerciseHistoryFromSessions(item.exerciseId, offlineSessions)
            );
          }
        }
      }
    }
    return cache;
  }, [plan, offlineSessions]);

  const activeWeek: PlannedWeek | null = useMemo(() => {
    if (!plan || plan.weeks.length === 0) return null;
    return (
      plan.weeks.find((week) => week.weekIndex === selectedWeekIndex) ?? plan.weeks[0]
    );
  }, [plan, selectedWeekIndex]);

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (!plan || plan.weeks.length === 0) return;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % plan.weeks.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + plan.weeks.length) % plan.weeks.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = plan.weeks.length - 1;
    }
    if (nextIndex === null) return;

    event.preventDefault();
    const targetWeek = plan.weeks[nextIndex];
    setSelectedWeekIndex(targetWeek.weekIndex);
    tabRefs.current[nextIndex]?.focus();
  };

  const handleStartSession = (exercises: PlannedExercise[]) => {
    if (exercises.length === 0) return;
    router.push(buildSessionTrackerHref(exercises));
  };

  if (isLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-400">
        Memuat program latihan...
      </div>
    );
  }

  if (!plan) {
    return (
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Dumbbell className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Belum ada program latihan aktif
          </h2>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Susun jadwal latihan mingguan sesuai tujuan, alat yang Anda miliki, dan kondisi sendi.
          </p>
        </div>
        <div className="pt-1">
          <Link
            href="/program/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm transition-colors min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Buat Program
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Ringkasan Program Aktif */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">{plan.name}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 font-medium">
                {GOAL_LABEL_ID[plan.goal]}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                {plan.level}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700">
                <CalendarDays className="w-3.5 h-3.5 text-emerald-400" />
                {plan.daysPerWeek} hari/minggu • {plan.mesocycleWeeks} minggu
              </span>
            </div>
          </div>

          <Link
            href="/program/new"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-zinc-200 transition-colors min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" />
            Buat Program Baru
          </Link>
        </div>

        {plan.warnings.length > 0 && (
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Catatan Program
            </div>
            <ul className="list-disc pl-5 space-y-1 text-xs text-amber-100/90">
              {plan.warnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {plan.rationale.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setShowRationale((prev) => !prev)}
              aria-expanded={showRationale}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors min-h-[36px]"
            >
              {showRationale ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
              Dasar penyusunan ({plan.rationale.length})
            </button>
            {showRationale && (
              <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-zinc-400">
                {plan.rationale.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {/* Pemilih Minggu (Tab satu baris sesuai panduan aksesibilitas) */}
      <div
        role="tablist"
        aria-label="Pilih minggu program"
        className="flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-zinc-800"
      >
        {plan.weeks.map((week, idx) => {
          const isSelected = activeWeek?.weekIndex === week.weekIndex;
          return (
            <button
              key={week.weekIndex}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              id={`week-tab-${week.weekIndex}`}
              type="button"
              role="tab"
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedWeekIndex(week.weekIndex)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
              className={`shrink-0 inline-flex items-center gap-2 px-3.5 py-2.5 text-sm border-b-2 transition-colors min-h-[44px] whitespace-nowrap ${
                isSelected
                  ? "border-emerald-400 text-white font-bold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200 font-medium"
              }`}
            >
              <span>Minggu {week.weekIndex}</span>
              {week.isDeload && (
                <span className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/40 text-[10px] font-bold uppercase tracking-wider text-sky-300">
                  Deload
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Konten Minggu Aktif */}
      {activeWeek && (
        <div
          role="tabpanel"
          aria-labelledby={`week-tab-${activeWeek.weekIndex}`}
          className="space-y-4"
        >
          {activeWeek.isDeload && (
            <div className="rounded-xl bg-sky-500/10 border border-sky-500/30 p-3.5 text-xs sm:text-sm text-sky-100">
              <span className="font-bold text-sky-300">Minggu Deload:</span> Volume dan
              intensitas diturunkan agar tubuh pulih sebelum siklus berikutnya.
            </div>
          )}

          {activeWeek.sessions.map((session, sessionIdx) => (
            <article
              key={`${activeWeek.weekIndex}-${session.label}-${sessionIdx}`}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {session.label}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {session.exercises.length} gerakan terjadwal
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartSession(session.exercises)}
                  disabled={session.exercises.length === 0}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-bold text-sm transition-colors min-h-[44px]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Mulai sesi
                </button>
              </div>

              {session.exercises.length === 0 ? (
                <p className="text-xs text-zinc-500">Tidak ada gerakan pada sesi ini.</p>
              ) : (
                <ul className="divide-y divide-zinc-800/80">
                  {session.exercises.map((item, exIdx) => {
                    const detail = EXERCISE_BY_ID.get(item.exerciseId);
                    const advice = evaluateExerciseProgression({
                      exerciseId: item.exerciseId,
                      repMin: item.repMin,
                      repMax: item.repMax,
                      isDeload: activeWeek.isDeload,
                      sessions: historyByExercise.get(item.exerciseId) ?? [],
                    });
                    const unit =
                      EXERCISE_META[item.exerciseId]?.loadType === "time"
                        ? "detik"
                        : "rep";

                    return (
                      <li
                        key={`${item.exerciseId}-${exIdx}`}
                        className="py-3 first:pt-0 last:pb-0 space-y-2"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {detail?.name ?? item.exerciseId}
                            </p>
                            {detail && (
                              <p className="text-xs text-zinc-400">
                                {detail.equipmentLabel} • {detail.primaryMuscleName}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs shrink-0">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 font-semibold text-emerald-300">
                              {formatPlannedTarget(item.exerciseId, item.sets, item.repMin, item.repMax)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200">
                              <Flame className="w-3.5 h-3.5 text-amber-400" />
                              RIR {item.targetRIR}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300">
                              <Clock className="w-3.5 h-3.5 text-zinc-400" />
                              {item.restSeconds} dtk
                            </span>
                          </div>
                        </div>

                        {advice.hasHistory && (
                          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/70 px-2.5 py-1.5 text-xs text-zinc-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <span className="font-semibold text-emerald-300">
                              Saran:{" "}
                              {advice.nextLoadKg > 0 ? `${advice.nextLoadKg} kg × ` : ""}
                              {advice.nextRepTarget} {unit}
                            </span>
                            <span className="text-zinc-400">{advice.reason}</span>
                          </div>
                        )}

                        {advice.formWarning && (
                          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1.5 text-xs text-amber-200 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span>{advice.formWarning}</span>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
