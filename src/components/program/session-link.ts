import type { ExerciseDetail } from "@/data/exercises";
import { EXERCISE_META } from "@/data/exercise-meta";

/** Build the tracker route carrying planned exercise IDs for a session. */
export function buildSessionTrackerHref(exerciseIds: string[]): string {
  const uniqueIds: string[] = [];
  const seen = new Set<string>();
  for (const rawId of exerciseIds) {
    const id = rawId.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);
  }
  if (uniqueIds.length === 0) return "/";
  const params = new URLSearchParams({ exercises: uniqueIds.join(",") });
  return `/?${params.toString()}`;
}

/** Resolve unique valid exercises from a URL search string (e.g. "?exercises=a,b"). */
export function resolveExercisesFromQuery(
  search: string,
  database: ExerciseDetail[]
): ExerciseDetail[] {
  const raw = new URLSearchParams(search).get("exercises");
  if (!raw) return [];

  const byId = new Map<string, ExerciseDetail>(
    database.map((exercise) => [exercise.id, exercise])
  );
  const resolved: ExerciseDetail[] = [];
  const seen = new Set<string>();

  for (const part of raw.split(",")) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    const match = byId.get(id);
    if (match) resolved.push(match);
  }
  return resolved;
}

/** Format sets × reps (or seconds for timed movements) using exercise metadata. */
export function formatPlannedTarget(
  exerciseId: string,
  sets: number,
  repMin: number,
  repMax: number
): string {
  const unit = EXERCISE_META[exerciseId]?.loadType === "time" ? "detik" : "rep";
  const range = repMin === repMax ? `${repMin}` : `${repMin}-${repMax}`;
  return `${sets} × ${range} ${unit}`;
}
