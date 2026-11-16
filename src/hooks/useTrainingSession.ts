import { useEffect, useRef, useState } from "react";
import { workouts } from "../data/trainingPlan";
import type {
  ExerciseProgress,
  PersistedAppState,
  Workout,
  WorkoutSession,
} from "../types/training";
import { loadAppState, saveAppState } from "../services/storage";
import { mergeHistory, parseHistory, type HistoryImportResult } from "../services/historyTransfer";

function readInitialState(): { state: PersistedAppState | null; error: string | null } {
  try {
    return { state: loadAppState(), error: null };
  } catch (error) {
    return {
      state: null,
      error:
        error instanceof Error
          ? error.message
          : "No se pudieron leer los datos guardados.",
    };
  }
}

function createExerciseProgress(workout: Workout): Record<string, ExerciseProgress> {
  return Object.fromEntries(
    workout.exercises.map(({ exerciseId, sets }) => [
      exerciseId,
      { completedSets: Array.from({ length: sets }, () => false), notes: "" },
    ]),
  );
}

export function useTrainingSession() {
  const [initial] = useState(readInitialState);
  const [state, setState] = useState<PersistedAppState | null>(initial.state);
  const stateRef = useRef(initial.state);
  const [error, setError] = useState<string | null>(initial.error);

  function commit(nextState: PersistedAppState): boolean {
    try {
      saveAppState(nextState);
      stateRef.current = nextState;
      setState(nextState);
      setError(null);
      return true;
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `No se pudieron guardar los cambios: ${saveError.message}`
          : "No se pudieron guardar los cambios en este dispositivo.",
      );
      return false;
    }
  }

  useEffect(() => {
    const activeSessionId = state?.activeSession?.id;
    if (!activeSessionId) return;

    const intervalId = window.setInterval(() => {
      const current = stateRef.current;
      if (!current?.activeSession || current.activeSession.id !== activeSessionId) return;
      const nextState = {
        ...current,
        activeSession: {
          ...current.activeSession,
          durationSeconds: current.activeSession.durationSeconds + 1,
        },
      };
      try {
        saveAppState(nextState);
        stateRef.current = nextState;
        setState(nextState);
        setError(null);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? `No se pudo guardar la duración: ${saveError.message}`
            : "No se pudo guardar la duración de la sesión.",
        );
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [state?.activeSession?.id]);

  function startWorkout(workoutId: string): void {
    if (!state) return;
    if (state.activeSession) return;

    const workout = workouts.find((item) => item.id === workoutId);
    if (!workout) {
      setError("No se encontró la sesión seleccionada.");
      return;
    }

    const session: WorkoutSession = {
      id: crypto.randomUUID(),
      workoutId,
      status: "in-progress",
      startedAt: new Date().toISOString(),
      durationSeconds: 0,
      notes: "",
      exerciseProgress: createExerciseProgress(workout),
    };
    commit({ ...state, activeSession: session });
  }

  function updateActiveSession(
    update: (session: WorkoutSession) => WorkoutSession,
  ): void {
    if (!state?.activeSession) return;
    commit({
      ...state,
      activeSession: update(state.activeSession),
    });
  }

  function toggleSet(exerciseId: string, setIndex: number): void {
    updateActiveSession((session) => {
      const progress = session.exerciseProgress[exerciseId];
      if (!progress || setIndex < 0 || setIndex >= progress.completedSets.length) {
        return session;
      }
      const completedSets = [...progress.completedSets];
      completedSets[setIndex] = !completedSets[setIndex];
      return {
        ...session,
        exerciseProgress: {
          ...session.exerciseProgress,
          [exerciseId]: { ...progress, completedSets },
        },
      };
    });
  }

  function updateExerciseProgress(
    exerciseId: string,
    update: (progress: ExerciseProgress) => ExerciseProgress,
  ): void {
    updateActiveSession((session) => {
      const progress = session.exerciseProgress[exerciseId];
      if (!progress) return session;
      return {
        ...session,
        exerciseProgress: {
          ...session.exerciseProgress,
          [exerciseId]: update(progress),
        },
      };
    });
  }

  function updateSessionNotes(notes: string): void {
    updateActiveSession((session) => ({ ...session, notes }));
  }

  function finishWorkout(): void {
    if (!state?.activeSession) return;
    const completedSession: WorkoutSession = {
      ...state.activeSession,
      status: "completed",
      endedAt: new Date().toISOString(),
    };
    commit({
      version: 1,
      sessions: [completedSession, ...state.sessions],
      activeSession: null,
    });
  }

  function importHistory(text: string): HistoryImportResult {
    const incoming = parseHistory(text);
    const current = stateRef.current;
    if (!current) throw new Error("No se pudieron cargar los datos locales.");
    const merged = mergeHistory(current.sessions, incoming, current.activeSession?.id);
    if (merged.result.imported > 0 && !commit({ ...current, sessions: merged.sessions })) {
      throw new Error(
        "No se pudo guardar el historial en este dispositivo. Tus datos no se han modificado.",
      );
    }
    return merged.result;
  }

  return {
    state,
    error,
    clearError: () => setError(null),
    startWorkout,
    toggleSet,
    updateExerciseProgress,
    updateSessionNotes,
    finishWorkout,
    importHistory,
  };
}
