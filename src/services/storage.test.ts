import { beforeEach, describe, expect, it } from "vitest";
import { loadAppState, saveAppState } from "./storage";
import type { PersistedAppState } from "../types/training";

const activeState: PersistedAppState = {
  version: 1,
  sessions: [],
  activeSession: {
    id: "session-1",
    workoutId: "monday-strength-power",
    status: "in-progress",
    startedAt: "2026-11-14T10:00:00.000Z",
    durationSeconds: 120,
    notes: "Buena técnica",
    exerciseProgress: {
      "vertical-jump": {
        completedSets: [true, false, false],
        notes: "Aterrizaje estable",
      },
    },
  },
};

describe("local training storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty state when this device has no saved data", () => {
    expect(loadAppState()).toEqual({
      version: 1,
      sessions: [],
      activeSession: null,
    });
  });

  it("restores active sessions and their completed sets after a reload", () => {
    saveAppState(activeState);

    expect(loadAppState()).toEqual(activeState);
  });

  it("reports corrupted data instead of silently replacing it", () => {
    window.localStorage.setItem("padel-performance-trainer", "{");

    expect(() => loadAppState()).toThrow("Los datos locales están dañados");
  });

  it("rejects an unsupported saved-state version", () => {
    window.localStorage.setItem(
      "padel-performance-trainer",
      JSON.stringify({ ...activeState, version: 2 }),
    );

    expect(() => loadAppState()).toThrow("versión no compatible");
  });
});
