"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, CalendarDays, Dumbbell, Play } from "lucide-react";
import { buildSessionTrackerHref } from "@/components/program/session-link";
import {
  getAllSessionsOffline,
  type WorkoutSessionPayload,
} from "@/lib/offline-storage";
import { PROGRAM_CONFIG, type ProgramPlan } from "@/lib/program/program-types";
import { getActivePlan } from "@/lib/program/storage";
import { compareWeeklyMuscleVolume } from "@/lib/program/volume";

export const VolumeChart: React.FC = () => {
  const [plan, setPlan] = useState<ProgramPlan | null>(null);
  const [sessions, setSessions] = useState<WorkoutSessionPayload[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getActivePlan(),
      getAllSessionsOffline().catch(() => [] as WorkoutSessionPayload[]),
    ])
      .then(([loadedPlan, loadedSessions]) => {
        if (cancelled) return;
        setPlan(loadedPlan);
        setSessions(loadedSessions);
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

  const activeWeek = useMemo(() => {
    if (!plan || plan.weeks.length === 0) return null;
    return (
      plan.weeks.find((week) => week.weekIndex === selectedWeekIndex) ??
      plan.weeks[0]
    );
  }, [plan, selectedWeekIndex]);

  const firstScheduledSession = useMemo(() => {
    if (!activeWeek) return null;
    return activeWeek.sessions.find((session) => session.exercises.length > 0) ?? null;
  }, [activeWeek]);

  const startSessionHref = useMemo(() => {
    if (!firstScheduledSession) return "/";
    return buildSessionTrackerHref(firstScheduledSession.exercises, {
      weekIndex: activeWeek?.weekIndex,
      sessionLabel: firstScheduledSession.label,
    });
  }, [firstScheduledSession, activeWeek]);

  const summary = useMemo(
    () =>
      compareWeeklyMuscleVolume({
        sessions,
        week: activeWeek,
      }),
    [sessions, activeWeek]
  );

  const scaleMax = useMemo(() => {
    let maxVal = 1;
    for (const row of summary.rows) {
      if (row.actualSets > maxVal) maxVal = row.actualSets;
      if (row.targetSets > maxVal) maxVal = row.targetSets;
    }
    return maxVal;
  }, [summary.rows]);

  if (isLoading) {
    return (
      <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center text-sm text-zinc-400">
        Memuat ringkasan volume otot mingguan...
      </section>
    );
  }

  return (
    <section
      aria-labelledby="volume-heading"
      className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-800 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2
              id="volume-heading"
              className="text-base sm:text-lg font-bold text-white"
            >
              Set Mingguan per Otot
            </h2>
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 border border-zinc-700 text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
              perkiraan
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Log nyata 7 hari terakhir (utama 1 set, pendukung {PROGRAM_CONFIG.secondaryMuscleWeight} set) dibanding target rencana.
          </p>
        </div>

        {plan && plan.weeks.length > 0 && summary.hasLogsInWindow && (
          <label className="inline-flex items-center gap-2 text-xs text-zinc-300">
            <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
            <span className="sr-only">Pilih minggu target</span>
            <select
              value={activeWeek?.weekIndex ?? 1}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white min-h-[36px]"
            >
              {plan.weeks.map((week) => (
                <option key={week.weekIndex} value={week.weekIndex}>
                  Target Minggu {week.weekIndex}
                  {week.isDeload ? " (Deload)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {!summary.hasAnyLogs ? (
        <div className="py-6 text-center space-y-3">
          <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-200">
              Belum ada log latihan nyata
            </p>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Selesaikan minimal satu set di pelacak agar set efektif mingguan per otot dapat dihitung.
            </p>
          </div>
          {firstScheduledSession ? (
            <Link
              href={startSessionHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-colors min-h-[40px]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Mulai Sesi: {firstScheduledSession.label}</span>
            </Link>
          ) : (
            <Link
              href="/tracker"
              className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-xs font-semibold text-white transition-colors min-h-[40px]"
            >
              Mulai Latihan Bebas
            </Link>
          )}
        </div>
      ) : !summary.hasLogsInWindow ? (
        <div className="py-6 text-center space-y-2">
          <p className="text-sm font-semibold text-zinc-200">
            Belum ada log latihan dalam 7 hari terakhir
          </p>
          <p className="text-xs text-zinc-400">
            Catatan sesi lebih lama tidak dihitung ke dalam volume minggu berjalan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
            <span>
              {summary.sessionsInWindowCount} sesi • {summary.completedSetsInWindow} set selesai (7 hari terakhir)
            </span>
            {!plan && (
              <span className="text-zinc-500">
                Belum ada rencana aktif — target seluruh otot bernilai 0.
              </span>
            )}
          </div>

          <ul className="space-y-2.5">
            {summary.rows.map((row) => {
              const actualPct = Math.min(100, (row.actualSets / scaleMax) * 100);
              const targetPct = Math.min(100, (row.targetSets / scaleMax) * 100);

              return (
                <li
                  key={row.muscle}
                  className={`rounded-xl border px-3 py-2.5 space-y-1.5 ${
                    row.isZeroTarget
                      ? "bg-zinc-900/40 border-zinc-800/70 text-zinc-500"
                      : "bg-zinc-800/40 border-zinc-800 text-zinc-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-semibold truncate ${
                        row.isZeroTarget ? "text-zinc-500" : "text-white"
                      }`}
                    >
                      {row.label}
                    </span>
                    <span
                      className={`shrink-0 font-mono ${
                        row.isZeroTarget ? "text-zinc-500" : "text-zinc-300"
                      }`}
                    >
                      {row.actualSets} / {row.targetSets} set
                    </span>
                  </div>

                  <div
                    className={`relative h-2 rounded-full overflow-hidden ${
                      row.isZeroTarget ? "bg-zinc-800/60" : "bg-zinc-800"
                    }`}
                    aria-hidden="true"
                  >
                    {row.targetSets > 0 && (
                      <div
                        className="absolute inset-y-0 left-0 bg-zinc-600/50 rounded-full"
                        style={{ width: `${targetPct}%` }}
                      />
                    )}
                    {row.actualSets > 0 && (
                      <div
                        className={`relative h-full rounded-full ${
                          row.isZeroTarget ? "bg-zinc-500" : "bg-emerald-400"
                        }`}
                        style={{ width: `${actualPct}%` }}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};
