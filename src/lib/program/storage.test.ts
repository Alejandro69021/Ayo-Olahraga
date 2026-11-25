import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";
import {
  saveProfile,
  getProfile,
  savePlan,
  getActivePlan,
  listPlans,
  deletePlan,
  saveProgression,
  getProgression,
} from "./storage";
import type { UserProfile, ProgramPlan, ProgressionState } from "./program-types";

function clearProgramDb(): Promise<void> {
  return new Promise((resolve) => {
    const req = indexedDB.deleteDatabase("ayo_programs_db");
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

function makePlan(id: string, createdAt: number): ProgramPlan {
  return {
    id,
    createdAt,
    name: `Program ${id}`,
    goal: "otot",
    level: "Pemula",
    daysPerWeek: 3,
    mesocycleWeeks: 5,
    weeks: [],
    rationale: ["Rasio set awal pemula"],
    warnings: [],
  };
}

describe("program/storage (ayo_programs_db)", () => {
  beforeEach(async () => {
    await clearProgramDb();
  });

  it("simpan lalu baca profil", async () => {
    expect(await getProfile()).toBeNull();

    const profile: UserProfile = {
      id: "me",
      updatedAt: 1700000000000,
      adultConfirmed: true,
      goal: "otot",
      level: "Menengah",
      daysPerWeek: 4,
      sessionMinutes: 60,
      equipment: ["barbell", "dumbbell"],
      priorityMuscles: ["CHEST"],
      jointComplaints: ["knee"],
    };

    const saved = await saveProfile(profile);
    expect(saved).toEqual(profile);

    const loaded = await getProfile();
    expect(loaded).toEqual(profile);
  });

  it("simpan lalu baca rencana, getActivePlan pilih createdAt terbesar", async () => {
    expect(await getActivePlan()).toBeNull();
    expect(await listPlans()).toEqual([]);

    const olderPlan = makePlan("plan-1", 1000);
    const newerPlan = makePlan("plan-2", 2000);

    await savePlan(olderPlan);
    await savePlan(newerPlan);

    const plans = await listPlans();
    expect(plans).toHaveLength(2);
    expect(plans?.map((p) => p.id)).toEqual(["plan-2", "plan-1"]);

    const active = await getActivePlan();
    expect(active).toEqual(newerPlan);
  });

  it("hapus rencana menghapus entri dan memperbarui getActivePlan", async () => {
    const plan1 = makePlan("plan-1", 1000);
    const plan2 = makePlan("plan-2", 2000);
    await savePlan(plan1);
    await savePlan(plan2);

    const deleted = await deletePlan("plan-2");
    expect(deleted).toBe(true);

    const remaining = await listPlans();
    expect(remaining).toEqual([plan1]);
    expect(await getActivePlan()).toEqual(plan1);

    await deletePlan("plan-1");
    expect(await listPlans()).toEqual([]);
    expect(await getActivePlan()).toBeNull();
  });

  it("simpan lalu baca progresi gerakan", async () => {
    expect(await getProgression("bb-bench-press")).toBeNull();

    const state: ProgressionState = {
      exerciseId: "bb-bench-press",
      lastLoadKg: 60,
      lastRepsPerSet: [8, 8, 7],
      updatedAt: 1700000000000,
    };

    expect(await saveProgression(state)).toEqual(state);
    expect(await getProgression("bb-bench-press")).toEqual(state);
  });

  it("mengembalikan null dengan aman bila IndexedDB tidak tersedia", async () => {
    const originalIdb = globalThis.indexedDB;
    Object.defineProperty(globalThis, "indexedDB", {
      value: undefined,
      configurable: true,
      writable: true,
    });

    try {
      const profile: UserProfile = {
        id: "me",
        updatedAt: 1,
        adultConfirmed: true,
        goal: "umum",
        level: "Pemula",
        daysPerWeek: 2,
        sessionMinutes: 30,
        equipment: ["bodyweight"],
        priorityMuscles: [],
        jointComplaints: [],
      };
      const plan = makePlan("plan-offline", 1);
      const prog: ProgressionState = {
        exerciseId: "bw-pushup",
        lastLoadKg: 0,
        lastRepsPerSet: [10],
        updatedAt: 1,
      };

      expect(await saveProfile(profile)).toBeNull();
      expect(await getProfile()).toBeNull();
      expect(await savePlan(plan)).toBeNull();
      expect(await listPlans()).toBeNull();
      expect(await getActivePlan()).toBeNull();
      expect(await deletePlan("plan-offline")).toBeNull();
      expect(await saveProgression(prog)).toBeNull();
      expect(await getProgression("bw-pushup")).toBeNull();
    } finally {
      Object.defineProperty(globalThis, "indexedDB", {
        value: originalIdb,
        configurable: true,
        writable: true,
      });
    }
  });
});
