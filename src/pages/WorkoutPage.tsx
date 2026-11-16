import { ArrowRight, Check, Clock3, Dumbbell, ShieldCheck } from "lucide-react";
import { exercises } from "../data/exercises";
import { mondayWorkout } from "../data/trainingPlan";
import type { ExerciseProgress, WorkoutSession } from "../types/training";
import { WorkoutRunner } from "../components/WorkoutRunner";
import { ExerciseImage } from "../components/ExerciseImage";

interface WorkoutPageProps {
  activeSession: WorkoutSession | null;
  onStart: () => void;
  onToggleSet: (exerciseId: string, setIndex: number) => boolean;
  onUpdateExercise: (
    exerciseId: string,
    update: (progress: ExerciseProgress) => ExerciseProgress,
  ) => void;
  onUpdateNotes: (notes: string) => void;
  onFinish: () => void;
  completedSessions: number;
}

export function WorkoutPage(props: WorkoutPageProps) {
  const {
    activeSession,
    onToggleSet,
    onUpdateExercise,
    onUpdateNotes,
    onFinish,
  } = props;
  if (activeSession?.workoutId === mondayWorkout.id) {
    return (
      <WorkoutRunner
        session={activeSession}
        onToggleSet={onToggleSet}
        onUpdateExercise={onUpdateExercise}
        onUpdateNotes={onUpdateNotes}
        onFinish={onFinish}
      />
    );
  }
  if (activeSession) {
    return (
      <div className="page-stack">
        <div className="page-heading">
          <div>
            <p className="eyebrow">SESIÓN EN CURSO</p>
            <h1>Termina tu sesión actual.</h1>
          </div>
        </div>
        <section className="empty-state card-surface">
          <span className="empty-icon"><Clock3 size={22} aria-hidden="true" /></span>
          <h2>Hay una sesión guardada en curso</h2>
          <p>Finalízala antes de iniciar otra para conservar tu registro.</p>
        </section>
      </div>
    );
  }

  const groups = [
    { block: "warmup", title: "Calentamiento", subtitle: "8 min · Prepara el cuerpo" },
    { block: "plyometrics", title: "A · Potencia", subtitle: "Saltos con aterrizajes de calidad" },
    { block: "strength", title: "B · Fuerza", subtitle: "Carga controlada, sin llegar al fallo" },
    { block: "core", title: "C · Core", subtitle: "Estabilidad y control" },
  ] as const;

  return (
    <div className="page-stack">
      <div className="page-heading workout-heading">
        <div>
          <p className="eyebrow">SESIÓN DEL LUNES · BLOQUE 01</p>
          <h1>{mondayWorkout.name}</h1>
          <p className="page-subtitle">{mondayWorkout.focus}</p>
        </div>
        <span className="workout-duration">
          <Clock3 size={16} aria-hidden="true" />
          45–50 min
        </span>
      </div>

      <div className="workout-intro-grid">
        <section className="workout-intro card-surface">
          <p className="eyebrow">OBJETIVO DE HOY</p>
          <h2>Muévete bien. Después, más rápido.</h2>
          <p>
            Aterrizajes estables, repeticiones limpias y suficiente descanso para
            mantener la calidad en cada esfuerzo.
          </p>
          <button className="button button-dark" type="button" onClick={props.onStart}>
            Empezar entrenamiento <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>
        <aside className="safety-card" aria-label="Recordatorio de seguridad">
          <span><ShieldCheck size={18} aria-hidden="true" /></span>
          <div>
            <strong>Calidad antes que carga</strong>
            <p>
              No entrenes al fallo. Para si aparece dolor o pierdes la técnica.
              Si es posible, entrena con supervisión profesional.
            </p>
          </div>
        </aside>
      </div>

      <section className="exercise-preview" aria-labelledby="exercise-preview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{mondayWorkout.exercises.length} EJERCICIOS</p>
            <h2 id="exercise-preview-title">Así será la sesión</h2>
          </div>
          <span className="preview-progress">
            <Check size={14} aria-hidden="true" /> {props.completedSessions} sesiones guardadas
          </span>
        </div>
        {groups.map((group) => {
          const groupExercises = mondayWorkout.exercises.filter(
            (item) => item.block === group.block,
          );
          return (
            <section className="exercise-group" key={group.block}>
              <div className="exercise-group-heading">
                <div>
                  <h3>{group.title}</h3>
                  <p>{group.subtitle}</p>
                </div>
                <span>{String(groupExercises.length).padStart(2, "0")}</span>
              </div>
              <div className="exercise-preview-list">
                {groupExercises.map((item, index) => {
                  const exercise = exercises.find(({ id }) => id === item.exerciseId);
                  if (!exercise) return null;
                  return (
                    <div key={item.exerciseId}>
                      <div className="exercise-preview-row">
                        <span className="exercise-index">{String(index + 1).padStart(2, "0")}</span>
                        <div className="exercise-preview-name">
                          <strong>{exercise.name}</strong>
                          <span>{exercise.equipment.length ? exercise.equipment.join(", ") : "Peso corporal"}</span>
                        </div>
                        <span className="exercise-prescription">{getTargetLabel(item)}</span>
                        {item.block === "strength" && (
                          <Dumbbell className="exercise-row-icon" size={16} aria-hidden="true" />
                        )}
                      </div>
                      <ExerciseImage exercise={exercise} />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </section>
    </div>
  );
}

function getTargetLabel(item: (typeof mondayWorkout.exercises)[number]): string {
  if (item.target.kind === "instruction") {
    return item.target.note ?? "Calentamiento";
  }
  if (item.target.kind === "duration") {
    return `${item.sets} × ${item.target.durationSeconds} s`;
  }
  const repetitions =
    item.target.minimumRepetitions !== undefined &&
    item.target.maximumRepetitions !== undefined
      ? `${item.target.minimumRepetitions}–${item.target.maximumRepetitions}`
      : item.target.repetitions;
  const sides = item.target.perSide ? " / lado" : "";
  return `${item.sets} × ${repetitions}${sides}`;
}
