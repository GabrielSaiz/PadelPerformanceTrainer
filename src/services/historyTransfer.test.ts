import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mondayWorkout } from "../data/trainingPlan";
import { useTrainingSession } from "../hooks/useTrainingSession";
import type { WorkoutSession } from "../types/training";
import { loadAppState, saveAppState } from "./storage";
import { mergeHistory, parseHistory, serializeHistory } from "./historyTransfer";

function session(id = "session-1"): WorkoutSession {
  return {
    id,
    workoutId: mondayWorkout.id,
    status: "completed",
    startedAt: "2026-11-14T10:00:00.000Z",
    endedAt: "2026-11-14T10:45:00.000Z",
    durationSeconds: 2700,
    notes: "Buena sesión",
    exerciseProgress: Object.fromEntries(mondayWorkout.exercises.map(({ exerciseId, sets }) => [
      exerciseId,
      { completedSets: Array.from({ length: sets }, () => true), notes: "Con control", loadKg: 8 },
    ])),
  };
}

describe("history transfer", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("round-trips completed sessions including all sets, loads and notes", () => {
    const sessions = [session()];
    const backup = serializeHistory(sessions);
    expect(JSON.parse(backup)).toMatchObject({
      format: "padel-performance-trainer-history",
      version: 1,
      sessions,
    });
    expect(parseHistory(backup)).toEqual(sessions);
    expect(parseHistory(serializeHistory([]))).toEqual([]);
  });

  it("reports invalid JSON and unsupported envelopes", () => {
    expect(() => parseHistory("{")).toThrow("JSON válido");
    for (const value of [
      null, [], {}, { sessions: [] },
      { ...JSON.parse(serializeHistory([])), version: 2 },
      { ...JSON.parse(serializeHistory([])), format: "another-app" },
      { ...JSON.parse(serializeHistory([])), exportedAt: "not-a-date" },
      { ...JSON.parse(serializeHistory([])), sessions: {} },
    ]) {
      expect(() => parseHistory(JSON.stringify(value))).toThrow("copia de historial compatible");
    }
  });

  it.each([
    ["empty id", { id: "" }],
    ["unknown workout", { workoutId: "unknown" }],
    ["active session", { status: "in-progress" }],
    ["invalid start", { startedAt: "not-a-date" }],
    ["invalid end", { endedAt: 123 }],
    ["missing end", { endedAt: undefined }],
    ["end before start", { endedAt: "2026-11-13T10:00:00.000Z" }],
    ["negative duration", { durationSeconds: -1 }],
    ["fractional duration", { durationSeconds: 1.5 }],
    ["missing progress", { exerciseProgress: {} }],
    ["array progress", { exerciseProgress: [] }],
    ["invalid notes", { notes: 12 }],
  ])("rejects %s without importing a valid prefix", (_name, update) => {
    const text = JSON.stringify({
      ...JSON.parse(serializeHistory([])),
      sessions: [session("valid"), { ...session(), ...update }],
    });
    expect(() => parseHistory(text)).toThrow("No se ha importado ninguna sesión");
  });

  it.each([
    { completedSets: [1], notes: "" },
    { completedSets: [], notes: "" },
    { completedSets: [true], notes: 42 },
    { completedSets: [true], notes: "", loadKg: -1 },
    { completedSets: [true], notes: "", loadKg: "8" },
  ])("rejects invalid exercise progress %#", (progress) => {
    const value = session();
    const text = JSON.stringify({
      ...JSON.parse(serializeHistory([value])),
      sessions: [{ ...value, exerciseProgress: { ...value.exerciseProgress, "vertical-jump": progress } }],
    });
    expect(() => parseHistory(text)).toThrow("sesiones inválidas");
  });

  it("rejects unknown exercises even when the workout has all required progress", () => {
    const value = session();
    value.exerciseProgress.unknown = { completedSets: [true], notes: "" };
    expect(() => parseHistory(serializeHistory([value]))).toThrow("no compatibles");
  });

  it("preserves local sessions, skips repeated and active ids, and sorts newest first", () => {
    const local = session("local");
    const newer = { ...session("new"), startedAt: "2026-11-14T10:30:00.000Z" };
    const result = mergeHistory(
      [local],
      [{ ...local, notes: "Do not replace" }, newer, session("new"), session("active")],
      "active",
    );
    expect(result.result).toEqual({ imported: 1, skipped: 3 });
    expect(result.sessions).toEqual([newer, local]);
    expect(local.notes).toBe("Buena sesión");
    expect(mergeHistory(result.sessions, [newer]).result).toEqual({ imported: 0, skipped: 1 });
  });

  it("persists imports while preserving active progress and local conflicts across reloads", () => {
    const local = session("local");
    const active: WorkoutSession = { ...session("active"), status: "in-progress", endedAt: undefined };
    saveAppState({ version: 1, sessions: [local], activeSession: active });
    const hook = renderHook(() => useTrainingSession());
    act(() => {
      expect(hook.result.current.importHistory(serializeHistory([
        { ...local, notes: "Ignored" }, session("new"), session("active"),
      ]))).toEqual({ imported: 1, skipped: 2 });
    });
    expect(hook.result.current.state?.activeSession).toEqual(active);
    expect(hook.result.current.state?.sessions).toHaveLength(2);
    expect(loadAppState().sessions.find(({ id }) => id === "local")).toEqual(local);
    hook.unmount();
    const reloaded = renderHook(() => useTrainingSession());
    expect(reloaded.result.current.state).toEqual(loadAppState());
  });

  it("leaves stored and displayed data unchanged on invalid imports or storage errors", () => {
    saveAppState({ version: 1, sessions: [session()], activeSession: null });
    const hook = renderHook(() => useTrainingSession());
    const previous = loadAppState();
    expect(() => hook.result.current.importHistory("{")).toThrow("JSON válido");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    });
    act(() => {
      expect(() => hook.result.current.importHistory(serializeHistory([session("new")])))
        .toThrow("Tus datos no se han modificado");
    });
    expect(loadAppState()).toEqual(previous);
    expect(hook.result.current.state).toEqual(previous);
    expect(hook.result.current.error).toContain("No se pudieron guardar");
  });

  it("does not write to storage when every imported session already exists", () => {
    saveAppState({ version: 1, sessions: [session()], activeSession: null });
    const hook = renderHook(() => useTrainingSession());
    const save = vi.spyOn(Storage.prototype, "setItem");
    act(() => {
      expect(hook.result.current.importHistory(serializeHistory([session()])))
        .toEqual({ imported: 0, skipped: 1 });
    });
    expect(save).not.toHaveBeenCalled();
  });
});
