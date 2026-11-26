import { describe, expect, it } from "vitest";
import { EXERCISES_DATABASE } from "@/data/exercises";
import {
  buildSessionTrackerHref,
  formatPlannedTarget,
  formatTrackerTargetLine,
  parseTargets,
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

  it("a. round trip build -> parseTargets untuk 2 gerakan", () => {
    const [ex1, ex2] = EXERCISES_DATABASE;
    const href = buildSessionTrackerHref([
      { exerciseId: ex1.id, sets: 4, repMin: 6, repMax: 10, targetRIR: 2 },
      { exerciseId: ex2.id, sets: 3, repMin: 8, repMax: 12, targetRIR: 1 },
    ]);

    const query = href.slice(href.indexOf("?"));
    expect(resolveExercisesFromQuery(query, EXERCISES_DATABASE).map((e) => e.id)).toEqual([
      ex1.id,
      ex2.id,
    ]);
    expect(parseTargets(query)).toEqual({
      [ex1.id]: { sets: 4, repMin: 6, repMax: 10, rir: 2 },
      [ex2.id]: { sets: 3, repMin: 8, repMax: 12, rir: 1 },
    });
  });

  it("b. query lama tanpa targets tetap menghasilkan daftar gerakan yang sama", () => {
    const [ex1, ex2] = EXERCISES_DATABASE;
    const legacyQuery = `?exercises=${ex1.id},${ex2.id}`;
    expect(resolveExercisesFromQuery(legacyQuery, EXERCISES_DATABASE).map((e) => e.id)).toEqual([
      ex1.id,
      ex2.id,
    ]);
    expect(parseTargets(legacyQuery)).toEqual({});
  });

  it("c. entri targets tidak valid (sets 0, sets 11, rir 9, repMax < repMin, id tak dikenal) dibuang", () => {
    const [validEx, otherEx] = EXERCISES_DATABASE;
    const query =
      `?targets=` +
      `${validEx.id}:0:8:12:2,` +
      `${validEx.id}:11:8:12:2,` +
      `${validEx.id}:3:8:12:9,` +
      `${validEx.id}:3:12:8:2,` +
      `id-tak-dikenal:3:8:12:2,` +
      `${otherEx.id}:3:8:12:2`;

    expect(parseTargets(query)).toEqual({
      [otherEx.id]: { sets: 3, repMin: 8, repMax: 12, rir: 2 },
    });
  });

  it("d. targets untuk id yang tidak ada di ?exercises= diabaikan", () => {
    const [scheduledEx, unscheduledEx] = EXERCISES_DATABASE;
    const query =
      `?exercises=${scheduledEx.id}` +
      `&targets=${scheduledEx.id}:4:6:10:2,${unscheduledEx.id}:3:8:12:1`;

    expect(parseTargets(query)).toEqual({
      [scheduledEx.id]: { sets: 4, repMin: 6, repMax: 10, rir: 2 },
    });
  });

  it("formats active tracker target line with detik for loadType time", () => {
    const timedId = EXERCISES_DATABASE.find((e) => e.id === "bw-plank")?.id ?? "bw-plank";
    const repId = EXERCISES_DATABASE[0].id;
    expect(formatTrackerTargetLine(repId, { sets: 3, repMin: 8, repMax: 12, rir: 2 })).toBe(
      "Target: 3 x 8-12 - RIR 2"
    );
    expect(formatTrackerTargetLine(timedId, { sets: 3, repMin: 20, repMax: 60, rir: 3 })).toBe(
      "Target: 3 x 20-60 detik - RIR 3"
    );
  });

  it("e. menyertakan dan mem-parse konteks program (from, week, session) serta buildProgramBackHref", async () => {
    const { parseProgramSessionContext, buildProgramBackHref } = await import("./session-link");
    const [exA] = EXERCISES_DATABASE;
    const href = buildSessionTrackerHref([exA.id], { weekIndex: 2, sessionLabel: "Full Body B" });
    const query = href.slice(href.indexOf("?"));
    const ctx = parseProgramSessionContext(query);

    expect(ctx).toEqual({
      fromProgram: true,
      weekIndex: 2,
      sessionLabel: "Full Body B",
    });
    expect(buildProgramBackHref(ctx)).toBe("/program?week=2");
    expect(buildProgramBackHref({ fromProgram: true })).toBe("/program");
  });
});
