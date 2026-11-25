import { describe, expect, it } from "vitest";
import { EXERCISES_DATABASE } from "@/data/exercises";
import {
  buildSessionTrackerHref,
  formatPlannedTarget,
  resolveExercisesFromQuery,
} from "./session-link";

describe("session-link helpers", () => {
  it("builds tracker href with deduplicated exercise IDs and round-trips through query parser", () => {
    const firstThree = EXERCISES_DATABASE.slice(0, 3).map((e) => e.id);
    const href = buildSessionTrackerHref([...firstThree, firstThree[0], "  "]);
    expect(href.startsWith("/?exercises=")).toBe(true);

    const query = href.slice(href.indexOf("?"));
    const resolved = resolveExercisesFromQuery(query, EXERCISES_DATABASE);
    expect(resolved.map((e) => e.id)).toEqual(firstThree);
  });

  it("ignores unknown IDs and returns empty array when query missing", () => {
    expect(resolveExercisesFromQuery("", EXERCISES_DATABASE)).toEqual([]);
    expect(resolveExercisesFromQuery("?exercises=unknown-id-123", EXERCISES_DATABASE)).toEqual([]);
    expect(buildSessionTrackerHref([])).toBe("/");
  });

  it("formats timed vs rep-based targets using exercise metadata", () => {
    const timedId = EXERCISES_DATABASE.find((e) => e.id.includes("plank"))?.id ?? "plank";
    const repId = EXERCISES_DATABASE[0].id;
    expect(formatPlannedTarget(timedId, 3, 30, 45)).toContain("detik");
    expect(formatPlannedTarget(repId, 3, 8, 12)).toBe("3 × 8-12 rep");
    expect(formatPlannedTarget(repId, 2, 10, 10)).toBe("2 × 10 rep");
  });
});
