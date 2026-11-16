import { Check, ChevronDown, Circle, Clock3, ShieldCheck } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { exercises } from "../data/exercises";
import { ExerciseImage } from "./ExerciseImage";
import type {
  ExerciseProgress,
  WorkoutExercise,
} from "../types/training";

interface ExerciseCardProps {
  item: WorkoutExercise;
  progress: ExerciseProgress | undefined;
  onToggleSet: (setIndex: number) => void;
  onUpdate: (update: (progress: ExerciseProgress) => ExerciseProgress) => void;
  onStartRest: (seconds: number, name: string) => void;
}

export function ExerciseCard({
  item,
  progress,
  onToggleSet,
  onUpdate,
  onStartRest,
}: ExerciseCardProps) {
  const isComplete = progress?.completedSets.filter(Boolean).length === item.sets;
  const [isCollapsed, setIsCollapsed] = useState(isComplete);
  const headingRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  useEffect(() => {
    if (isComplete && contentRef.current?.contains(document.activeElement)) {
      headingRef.current?.focus();
    }
    setIsCollapsed(isComplete);
  }, [isComplete]);

  const exercise = exercises.find(({ id }) => id === item.exerciseId);
  if (!exercise || !progress) {
    throw new Error(`Exercise data is missing for "${item.exerciseId}".`);
  }

  const completedSets = progress.completedSets.filter(Boolean).length;
  const restSeconds =
    item.restSeconds.minimum === item.restSeconds.maximum
      ? item.restSeconds.minimum
      : Math.round((item.restSeconds.minimum + item.restSeconds.maximum) / 2);

  return (
    <article className={`runner-exercise${completedSets === item.sets ? " exercise-done" : ""}`}>
      <div className="runner-exercise-top">
        <div>
          <h3>
            <button
              ref={headingRef}
              className="exercise-collapse-toggle"
              type="button"
              aria-expanded={!isCollapsed}
              aria-controls={contentId}
              onClick={() => setIsCollapsed((current) => !current)}
            >
              {exercise.name}
              <ChevronDown size={16} aria-hidden="true" />
            </button>
          </h3>
          {!isCollapsed && <p>{getPrescription(item)}</p>}
        </div>
        {!isCollapsed && <span className="exercise-set-count">
          {completedSets}/{item.sets}
        </span>}
      </div>
      <div id={contentId} ref={contentRef} hidden={isCollapsed}>
      <ExerciseImage exercise={exercise} />
      {item.block === "strength" && (
        <label className="load-input">
          <span>Carga usada</span>
          <span className="load-field">
            <input
              aria-label={`Carga en kilogramos para ${exercise.name}`}
              type="number"
              min="0"
              step="0.5"
              inputMode="decimal"
              value={progress.loadKg ?? ""}
              onChange={(event) => {
                const rawValue = event.target.value;
                const loadKg = rawValue === "" ? undefined : Number(rawValue);
                onUpdate((current) => ({
                  ...current,
                  loadKg:
                    loadKg !== undefined && Number.isFinite(loadKg) && loadKg >= 0
                      ? loadKg
                      : undefined,
                }));
              }}
            />
            <span>kg</span>
          </span>
        </label>
      )}

      <div className="set-list" role="group" aria-label={`Series de ${exercise.name}`}>
        {progress.completedSets.map((isComplete, index) => (
          <button
            className={`set-toggle${isComplete ? " set-complete" : ""}`}
            key={index}
            type="button"
            aria-pressed={isComplete}
            onClick={() => onToggleSet(index)}
          >
            {isComplete ? (
              <Check size={16} aria-hidden="true" />
            ) : (
              <Circle size={16} aria-hidden="true" />
            )}
            <span>Serie {index + 1}</span>
            <span className="set-toggle-status">{isComplete ? "Hecha" : "Marcar"}</span>
          </button>
        ))}
      </div>

      {completedSets > 0 && item.restSeconds.maximum > 0 && (
        <button
          className="rest-start-button"
          type="button"
          onClick={() => onStartRest(restSeconds, exercise.name)}
        >
          <Clock3 size={14} aria-hidden="true" />
          Iniciar descanso · {item.restSeconds.minimum === item.restSeconds.maximum
            ? `${restSeconds} s`
            : `${item.restSeconds.minimum}–${item.restSeconds.maximum} s`}
        </button>
      )}

      <label className="exercise-notes">
        <span>Nota</span>
        <input
          type="text"
          value={progress.notes}
          onChange={(event) =>
            onUpdate((current) => ({ ...current, notes: event.target.value }))
          }
          placeholder="Opcional"
        />
      </label>

      <details className="exercise-instructions">
        <summary>
          <ShieldCheck size={15} aria-hidden="true" />
          Técnica y seguridad
          <ChevronDown size={15} aria-hidden="true" />
        </summary>
        <ul>
          {exercise.instructions.map((instruction) => (
            <li key={instruction}>{instruction}</li>
          ))}
          {exercise.safetyTips.map((tip) => (
            <li className="safety-tip" key={tip}>{tip}</li>
          ))}
        </ul>
      </details>
      </div>
    </article>
  );
}

function getPrescription(item: WorkoutExercise): string {
  if (item.target.kind === "instruction") {
    return item.target.note ?? "Calentamiento";
  }
  if (item.target.kind === "duration") {
    return `${item.sets} × ${item.target.durationSeconds} segundos`;
  }

  const repetitions =
    item.target.minimumRepetitions !== undefined &&
    item.target.maximumRepetitions !== undefined
      ? `${item.target.minimumRepetitions}–${item.target.maximumRepetitions}`
      : item.target.repetitions;
  const sideText = item.target.perSide ? " por lado" : "";
  const restText =
    item.restSeconds.maximum > 0
      ? ` · Descanso ${
          item.restSeconds.minimum === item.restSeconds.maximum
            ? `${item.restSeconds.minimum} s`
            : `${item.restSeconds.minimum}–${item.restSeconds.maximum} s`
        }`
      : "";
  return `${item.sets} × ${repetitions}${sideText}${restText}`;
}
