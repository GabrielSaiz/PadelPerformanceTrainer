import { ArrowUpRight, Check, Clock3, Dumbbell } from "lucide-react";
import { exercises } from "../data/exercises";
import { workouts } from "../data/trainingPlan";
import type { WorkoutSession } from "../types/training";
import { formatDuration } from "../utils/format";

export function HistoryPage({ sessions }: { sessions: WorkoutSession[] }) {
  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU RECORRIDO</p>
          <h1>El progreso se construye.</h1>
          <p className="page-subtitle">
            Un registro de las sesiones que has completado en este dispositivo.
          </p>
        </div>
        <div className="history-total">
          <strong>{sessions.length}</strong>
          <span>SESIONES</span>
        </div>
      </div>

      {sessions.length === 0 ? (
        <section className="empty-state card-surface">
          <span className="empty-icon"><Dumbbell size={22} aria-hidden="true" /></span>
          <h2>Tu primera sesión empieza aquí</h2>
          <p>
            Cuando completes el entrenamiento del lunes, aparecerá aquí con su
            duración, ejercicios y notas.
          </p>
        </section>
      ) : (
        <section className="history-list" aria-label="Sesiones completadas">
          {sessions.map((session) => {
            const workout = workouts.find(({ id }) => id === session.workoutId);
            if (!workout) {
              throw new Error(`Workout data is missing for "${session.workoutId}".`);
            }
            const completedSets = Object.values(session.exerciseProgress).reduce(
              (total, progress) =>
                total + progress.completedSets.filter(Boolean).length,
              0,
            );
            const exercisesWithLoad = Object.entries(session.exerciseProgress)
              .filter(([, progress]) => progress.loadKg !== undefined)
              .map(([exerciseId, progress]) => {
                const exercise = exercises.find(({ id }) => id === exerciseId);
                if (!exercise) {
                  throw new Error(`Exercise data is missing for "${exerciseId}".`);
                }
                return { name: exercise.name, load: progress.loadKg };
              });

            return (
              <article className="history-card card-surface" key={session.id}>
                <div className="history-card-top">
                  <span className="history-check"><Check size={15} aria-hidden="true" /></span>
                  <div className="history-card-heading">
                    <p className="eyebrow">
                      {new Intl.DateTimeFormat("es", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(session.startedAt))}
                    </p>
                    <h2>{workout.name}</h2>
                  </div>
                  <ArrowUpRight size={18} className="history-arrow" aria-hidden="true" />
                </div>
                <div className="history-metrics">
                  <span><Clock3 size={15} aria-hidden="true" /> {formatDuration(session.durationSeconds)}</span>
                  <span><Check size={15} aria-hidden="true" /> {completedSets} series</span>
                </div>
                {exercisesWithLoad.length > 0 && (
                  <div className="history-loads">
                    {exercisesWithLoad.map(({ name, load }) => (
                      <span key={name}><Dumbbell size={13} aria-hidden="true" /> {name}: {load} kg</span>
                    ))}
                  </div>
                )}
                {session.notes && <p className="history-notes">“{session.notes}”</p>}
                <details className="history-details">
                  <summary>Ver registro por ejercicio</summary>
                  <ul>
                    {workout.exercises.map((item) => {
                      const exercise = exercises.find(({ id }) => id === item.exerciseId);
                      const progress = session.exerciseProgress[item.exerciseId];
                      if (!exercise || !progress) {
                        throw new Error(`Exercise log is missing for "${item.exerciseId}".`);
                      }
                      return (
                        <li key={item.exerciseId}>
                          <span>{exercise.name}</span>
                          <span>
                            {progress.completedSets.filter(Boolean).length}/{item.sets} series
                            {progress.loadKg !== undefined && ` · ${progress.loadKg} kg`}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
