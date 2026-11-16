import { Check, Clock3, Flag } from "lucide-react";
import { useState } from "react";
import { exercises } from "../data/exercises";
import { mondayWorkout } from "../data/trainingPlan";
import type {
  ExerciseProgress,
  WorkoutSession,
} from "../types/training";
import { formatDuration } from "../utils/format";
import { useCountdown } from "./RestTimer";
import { ExerciseCard } from "./ExerciseCard";

const blockDetails = [
  { id: "warmup", title: "Calentamiento", note: "8 min · Prepara el cuerpo" },
  { id: "plyometrics", title: "A · Potencia", note: "Aterrizajes silenciosos y estables" },
  { id: "strength", title: "B · Fuerza", note: "Técnica sólida, sin llegar al fallo" },
  { id: "core", title: "C · Core", note: "Control y estabilidad" },
] as const;

interface WorkoutRunnerProps {
  session: WorkoutSession;
  onToggleSet: (exerciseId: string, setIndex: number) => boolean;
  onUpdateExercise: (
    exerciseId: string,
    update: (progress: ExerciseProgress) => ExerciseProgress,
  ) => void;
  onUpdateNotes: (notes: string) => void;
  onFinish: () => void;
}

export function WorkoutRunner({
  session,
  onToggleSet,
  onUpdateExercise,
  onUpdateNotes,
  onFinish,
}: WorkoutRunnerProps) {
  const timer = useCountdown();
  const [showFinishMessage, setShowFinishMessage] = useState(false);
  const allSets = mondayWorkout.exercises.reduce((total, item) => total + item.sets, 0);
  const completedSets = mondayWorkout.exercises.reduce(
    (total, item) =>
      total +
      (session.exerciseProgress[item.exerciseId]?.completedSets.filter(Boolean).length ?? 0),
    0,
  );
  const progressPercent = Math.round((completedSets / allSets) * 100);
  const nextExercise = mondayWorkout.exercises.find((item) =>
    session.exerciseProgress[item.exerciseId]?.completedSets.some((done) => !done),
  );
  const nextExerciseName = nextExercise
    ? exercises.find(({ id }) => id === nextExercise.exerciseId)?.name
    : null;

  return (
    <div className="page-stack runner-page">
      <div className="runner-header">
        <div>
          <p className="eyebrow">SESIÓN DEL LUNES · EN CURSO</p>
          <h1>{mondayWorkout.name}</h1>
          <p className="page-subtitle">A tu ritmo, con buena técnica.</p>
        </div>
        <div
          className="elapsed-time"
          role="timer"
          aria-label={`Duración ${formatDuration(session.durationSeconds)}`}
        >
          <Clock3 size={16} aria-hidden="true" />
          <span>{formatDuration(session.durationSeconds)}</span>
        </div>
      </div>

      <div className="runner-progress">
        <div className="progress-label">
          <span>Progreso de la sesión</span>
          <strong>{completedSets} <span>/ {allSets}</span></strong>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-label="Series completadas"
          aria-valuemin={0}
          aria-valuemax={allSets}
          aria-valuenow={completedSets}
        >
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {nextExerciseName && (
        <div className="next-exercise">
          <span className="next-exercise-icon"><Flag size={16} aria-hidden="true" /></span>
          <div>
            <span>SIGUIENTE EN LA LISTA</span>
            <strong>{nextExerciseName}</strong>
          </div>
        </div>
      )}

      <div className="runner-blocks">
        {blockDetails.map((block) => {
          const items = mondayWorkout.exercises.filter((item) => item.block === block.id);
          return (
            <section className="runner-block" key={block.id}>
              <div className="runner-block-heading">
                <div>
                  <h2>{block.title}</h2>
                  <p>{block.note}</p>
                </div>
                <span>{items.length} {items.length === 1 ? "ejercicio" : "ejercicios"}</span>
              </div>
              <div className="runner-exercises">
                {items.map((item) => (
                  <ExerciseCard
                    key={item.exerciseId}
                    item={item}
                    progress={session.exerciseProgress[item.exerciseId]}
                    onToggleSet={(setIndex) => onToggleSet(item.exerciseId, setIndex)}
                    onUpdate={(update) => onUpdateExercise(item.exerciseId, update)}
                    timer={timer}
                  />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section className="session-notes card-surface">
        <label htmlFor="session-notes">Notas de la sesión</label>
        <p>Registra cómo te sentiste, tu técnica o cualquier molestia.</p>
        <textarea
          id="session-notes"
          rows={3}
          value={session.notes}
          onChange={(event) => onUpdateNotes(event.target.value)}
          placeholder="¿Cómo te sentiste hoy?"
        />
      </section>

      {showFinishMessage && (
        <div className="finish-notice" role="status">
          {completedSets < allSets
            ? `Has completado ${completedSets} de ${allSets} series. La sesión se guardará con este progreso.`
            : "Has completado todas las series. ¡Buen trabajo!"}
        </div>
      )}
      <button
        className="button button-finish"
        type="button"
        onClick={() => {
          if (!showFinishMessage) {
            setShowFinishMessage(true);
            return;
          }
          onFinish();
        }}
      >
        {showFinishMessage ? "Guardar y finalizar sesión" : "Finalizar sesión"}
        <Check size={17} aria-hidden="true" />
      </button>
    </div>
  );
}
