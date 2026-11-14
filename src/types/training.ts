export type ExerciseBlock = "warmup" | "plyometrics" | "strength" | "core";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  instructions: string[];
  equipment: string[];
  capacity: string;
  safetyTips: string[];
}

export interface WorkoutExercise {
  exerciseId: string;
  block: ExerciseBlock;
  sets: number;
  target: {
    kind: "repetitions" | "duration" | "instruction";
    repetitions?: number;
    minimumRepetitions?: number;
    maximumRepetitions?: number;
    durationSeconds?: number;
    perSide?: boolean;
    note?: string;
  };
  restSeconds: {
    minimum: number;
    maximum: number;
  };
}

export interface Workout {
  id: string;
  name: string;
  weekday: number;
  durationMinutes: {
    minimum: number;
    maximum: number;
  };
  focus: string;
  exercises: WorkoutExercise[];
}

export interface ExerciseProgress {
  completedSets: boolean[];
  loadKg?: number;
  notes: string;
}

export interface WorkoutSession {
  id: string;
  workoutId: string;
  status: "in-progress" | "completed";
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  notes: string;
  exerciseProgress: Record<string, ExerciseProgress>;
}

export interface ExerciseLog {
  exerciseId: string;
  completedSets: number;
  totalSets: number;
  loadKg?: number;
  notes: string;
}

export interface Assessment {
  date: string;
  test: string;
  value: number;
  unit: string;
  notes: string;
}

export interface PersistedAppState {
  version: 1;
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
}
