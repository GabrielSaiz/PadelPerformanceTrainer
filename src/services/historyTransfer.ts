import { exercises } from "../data/exercises";
import { workouts } from "../data/trainingPlan";
import type { WorkoutSession } from "../types/training";
import { isWorkoutSession } from "./storage";

interface HistoryBackup {
  format: "padel-performance-trainer-history";
  version: 1;
  exportedAt: string;
  sessions: WorkoutSession[];
}

export interface HistoryImportResult {
  imported: number;
  skipped: number;
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value))) return false;
  return new Date(value).toISOString() === value;
}

function isCompatibleSession(value: unknown): value is WorkoutSession {
  if (!isWorkoutSession(value)) return false;
  if (
    !value.id.trim() ||
    value.status !== "completed" ||
    !isTimestamp(value.startedAt) ||
    !isTimestamp(value.endedAt) ||
    Date.parse(value.endedAt) < Date.parse(value.startedAt) ||
    !Number.isSafeInteger(value.durationSeconds) ||
    value.durationSeconds < 0 ||
    Array.isArray(value.exerciseProgress)
  ) return false;

  const workout = workouts.find(({ id }) => id === value.workoutId);
  if (!workout) return false;
  if (!workout.exercises.every(({ exerciseId }) =>
    Object.prototype.hasOwnProperty.call(value.exerciseProgress, exerciseId),
  )) return false;

  return Object.entries(value.exerciseProgress).every(([id, progress]) =>
    exercises.some((exercise) => exercise.id === id) &&
    !Array.isArray(progress) &&
    progress.completedSets.length > 0 &&
    (progress.loadKg === undefined ||
      (Number.isFinite(progress.loadKg) && progress.loadKg >= 0)),
  );
}

export function serializeHistory(sessions: WorkoutSession[]): string {
  const backup: HistoryBackup = {
    format: "padel-performance-trainer-history",
    version: 1,
    exportedAt: new Date().toISOString(),
    sessions,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseHistory(text: string): WorkoutSession[] {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error("El archivo no contiene un JSON válido.");
    }
    throw error;
  }
  if (
    typeof value !== "object" || value === null ||
    !("format" in value) || value.format !== "padel-performance-trainer-history" ||
    !("version" in value) || value.version !== 1 ||
    !("exportedAt" in value) || !isTimestamp(value.exportedAt) ||
    !("sessions" in value) || !Array.isArray(value.sessions)
  ) {
    throw new Error("El archivo no es una copia de historial compatible (versión 1).");
  }
  if (!value.sessions.every(isCompatibleSession)) {
    throw new Error(
      "El historial contiene sesiones inválidas o entrenamientos no compatibles. No se ha importado ninguna sesión.",
    );
  }
  return value.sessions;
}

export function mergeHistory(
  local: WorkoutSession[],
  incoming: WorkoutSession[],
  activeSessionId?: string,
): { sessions: WorkoutSession[]; result: HistoryImportResult } {
  const ids = new Set(local.map(({ id }) => id));
  if (activeSessionId) ids.add(activeSessionId);
  const added = incoming.filter(({ id }) => {
    if (ids.has(id)) return false;
    ids.add(id);
    return true;
  });
  return {
    sessions: [...local, ...added].sort(
      (first, second) => Date.parse(second.startedAt) - Date.parse(first.startedAt),
    ),
    result: { imported: added.length, skipped: incoming.length - added.length },
  };
}
