import { EXERCISES_DATABASE, type ExerciseDetail } from "@/data/exercises";
import { EXERCISE_META } from "@/data/exercise-meta";

export interface ExerciseTargetSpec {
  sets: number;
  repMin: number;
  repMax: number;
  rir: number;
}

export interface PlannedTargetInput {
  exerciseId: string;
  sets: number;
  repMin: number;
  repMax: number;
  targetRIR?: number;
  rir?: number;
}

export interface ProgramSessionContext {
  fromProgram: boolean;
  weekIndex?: number;
  sessionLabel?: string;
}

function parseStrictInt(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) ? value : null;
}

function isValidTargetSpec(spec: ExerciseTargetSpec): boolean {
  return (
    Number.isInteger(spec.sets) &&
    spec.sets >= 1 &&
    spec.sets <= 10 &&
    Number.isInteger(spec.repMin) &&
    spec.repMin >= 1 &&
    Number.isInteger(spec.repMax) &&
    spec.repMax >= spec.repMin &&
    Number.isInteger(spec.rir) &&
    spec.rir >= 0 &&
    spec.rir <= 4
  );
}

/** Build the tracker route carrying planned exercise IDs, optional targets, and optional program context. */
export function buildSessionTrackerHref(
  exercises: readonly (string | PlannedTargetInput)[],
  context?: { weekIndex?: number; sessionLabel?: string }
): string {
  const uniqueIds: string[] = [];
  const targetTokens: string[] = [];
  const seen = new Set<string>();

  for (const item of exercises) {
    const rawId = typeof item === "string" ? item : item.exerciseId;
    const id = rawId.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    uniqueIds.push(id);

    if (typeof item !== "string") {
      const rir = item.targetRIR ?? item.rir;
      if (typeof rir === "number") {
        const spec: ExerciseTargetSpec = {
          sets: item.sets,
          repMin: item.repMin,
          repMax: item.repMax,
          rir,
        };
        if (isValidTargetSpec(spec)) {
          targetTokens.push(`${id}:${spec.sets}:${spec.repMin}:${spec.repMax}:${spec.rir}`);
        }
      }
    }
  }

  if (uniqueIds.length === 0) return "/tracker";
  const params = new URLSearchParams({ exercises: uniqueIds.join(",") });
  if (targetTokens.length > 0) {
    params.set("targets", targetTokens.join(","));
  }
  if (context) {
    params.set("from", "program");
    if (typeof context.weekIndex === "number" && Number.isInteger(context.weekIndex) && context.weekIndex >= 1) {
      params.set("week", String(context.weekIndex));
    }
    if (context.sessionLabel && context.sessionLabel.trim().length > 0) {
      params.set("session", context.sessionLabel.trim());
    }
  }
  return `/tracker?${params.toString()}`;
}

/** Parse program origin context from tracker URL query string. */
export function parseProgramSessionContext(search: string): ProgramSessionContext {
  const params = new URLSearchParams(search);
  const fromParam = params.get("from");
  const hasTargets = Boolean(params.get("targets"));
  const rawWeek = params.get("week");
  const parsedWeek = rawWeek ? parseStrictInt(rawWeek) : null;
  const rawSession = params.get("session")?.trim();

  const fromProgram = fromParam === "program" || hasTargets;
  if (!fromProgram) {
    return { fromProgram: false };
  }

  return {
    fromProgram: true,
    ...(parsedWeek !== null && parsedWeek >= 1 ? { weekIndex: parsedWeek } : {}),
    ...(rawSession ? { sessionLabel: rawSession } : {}),
  };
}

/** Build the return URL back to the program schedule page (preserving active week if known). */
export function buildProgramBackHref(context?: ProgramSessionContext | null): string {
  if (context?.weekIndex && context.weekIndex >= 1) {
    return `/program?week=${context.weekIndex}`;
  }
  return "/program";
}

/** Resolve unique valid exercises from a URL search string (e.g. "?exercises=a,b"). */
export function resolveExercisesFromQuery(
  search: string,
  database: readonly ExerciseDetail[] = EXERCISES_DATABASE
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

/** Parse and validate ?targets=id:sets:repMin:repMax:rir entries, discarding invalid or unscheduled items. */
export function parseTargets(
  query: string,
  database: readonly ExerciseDetail[] = EXERCISES_DATABASE
): Record<string, ExerciseTargetSpec> {
  const params = new URLSearchParams(query);
  const rawTargets = params.get("targets");
  if (!rawTargets) return {};

  const validDbIds = new Set<string>(database.map((exercise) => exercise.id));
  const scheduledIds = params.has("exercises")
    ? new Set<string>(resolveExercisesFromQuery(query, database).map((ex) => ex.id))
    : null;

  const result: Record<string, ExerciseTargetSpec> = {};

  for (const entry of rawTargets.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const parts = trimmed.split(":");
    if (parts.length !== 5) continue;

    const id = parts[0].trim();
    if (!id || !validDbIds.has(id)) continue;
    if (scheduledIds !== null && !scheduledIds.has(id)) continue;
    if (Object.prototype.hasOwnProperty.call(result, id)) continue;

    const sets = parseStrictInt(parts[1].trim());
    const repMin = parseStrictInt(parts[2].trim());
    const repMax = parseStrictInt(parts[3].trim());
    const rir = parseStrictInt(parts[4].trim());
    if (sets === null || repMin === null || repMax === null || rir === null) continue;

    const spec: ExerciseTargetSpec = { sets, repMin, repMax, rir };
    if (!isValidTargetSpec(spec)) continue;

    result[id] = spec;
  }

  return result;
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

/** Format compact single-line target label for the active exercise header in tracker. */
export function formatTrackerTargetLine(
  exerciseId: string,
  target: ExerciseTargetSpec
): string {
  const unitSuffix = EXERCISE_META[exerciseId]?.loadType === "time" ? " detik" : "";
  return `Target: ${target.sets} x ${target.repMin}-${target.repMax}${unitSuffix} - RIR ${target.rir}`;
}
