import type { PersistedAppState, WorkoutSession } from "../types/training";

const STORAGE_KEY = "padel-performance-trainer";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isWorkoutSession(value: unknown): value is WorkoutSession {
  if (!isRecord(value)) return false;
  if (
    typeof value.id !== "string" ||
    typeof value.workoutId !== "string" ||
    (value.status !== "in-progress" && value.status !== "completed") ||
    typeof value.startedAt !== "string" ||
    typeof value.durationSeconds !== "number" ||
    typeof value.notes !== "string" ||
    !isRecord(value.exerciseProgress)
  ) {
    return false;
  }

  return Object.values(value.exerciseProgress).every(
    (progress) =>
      isRecord(progress) &&
      Array.isArray(progress.completedSets) &&
      progress.completedSets.every((set) => typeof set === "boolean") &&
      typeof progress.notes === "string" &&
      (progress.loadKg === undefined || typeof progress.loadKg === "number"),
  );
}

function isPersistedAppState(value: unknown): value is PersistedAppState {
  return (
    isRecord(value) &&
    value.version === 1 &&
    Array.isArray(value.sessions) &&
    value.sessions.every(isWorkoutSession) &&
    (value.activeSession === null || isWorkoutSession(value.activeSession))
  );
}

export function loadAppState(): PersistedAppState {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === null) {
    return { version: 1, sessions: [], activeSession: null };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("Los datos locales están dañados y no se pudieron leer.");
    }
    throw error;
  }

  if (!isPersistedAppState(parsed)) {
    throw new Error(
      "Los datos guardados tienen un formato o versión no compatible.",
    );
  }

  return parsed;
}

export function saveAppState(state: PersistedAppState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
