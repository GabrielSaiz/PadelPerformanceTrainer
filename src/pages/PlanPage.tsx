import { ArrowRight, Check, Circle } from "lucide-react";
import type { AppPage } from "../components/AppShell";
import type { WorkoutSession } from "../types/training";
import { getMondayOfWeek } from "../utils/format";

interface PlanPageProps {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  onNavigate: (page: AppPage) => void;
}

const weekPlan = [
  { day: 1, title: "Fuerza y potencia de piernas", type: "Complementario", detail: "45–50 min", status: "available" },
  { day: 2, title: "Recuperación", type: "Descanso", detail: "Día libre", status: "rest" },
  { day: 3, title: "Agilidad y reacción", type: "Complementario", detail: "35–40 min", status: "coming" },
  { day: 4, title: "Pádel técnico + activación", type: "Pádel + complementario", detail: "20–25 min opcionales", status: "coming" },
  { day: 5, title: "Entrenamiento de pádel", type: "Pádel", detail: "Sesión exigente", status: "padel" },
  { day: 6, title: "Recuperación activa", type: "Libre", detail: "Actividad recreativa", status: "rest" },
  { day: 0, title: "Descanso", type: "Recuperación", detail: "Recarga para la semana", status: "rest" },
] as const;

const dayLabels = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function PlanPage({
  sessions,
  activeSession,
  onNavigate,
}: PlanPageProps) {
  const monday = getMondayOfWeek(new Date());
  const completedIds = new Set(
    sessions
      .filter((session) => new Date(session.startedAt) >= monday)
      .map((session) => session.workoutId),
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU PLAN DE ENTRENAMIENTO</p>
          <h1>Una semana equilibrada.</h1>
          <p className="page-subtitle">
            Tres sesiones complementarias, colocadas alrededor del pádel.
          </p>
        </div>
        <span className="plan-week-label">
          Semana del{" "}
          {new Intl.DateTimeFormat("es", { day: "numeric", month: "short" }).format(monday)}
        </span>
      </div>

      <section className="calendar-list" aria-label="Calendario semanal">
        {weekPlan.map((item, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          const isCompleted =
            item.status === "available" && completedIds.has("monday-strength-power");
          const isActive =
            item.status === "available" &&
            activeSession?.workoutId === "monday-strength-power";
          const label = dayLabels[item.day];

          return (
            <article
              className={`calendar-item calendar-${item.status}${isCompleted ? " calendar-completed" : ""}`}
              key={item.day}
            >
              <div className="calendar-date">
                <span>{label.slice(0, 3)}</span>
                <strong>{date.getDate()}</strong>
              </div>
              <div className="calendar-item-main">
                <div className="calendar-title-row">
                  <h2>{item.title}</h2>
                  {isCompleted ? (
                    <span className="calendar-status status-done">
                      <Check size={13} aria-hidden="true" /> Completada
                    </span>
                  ) : isActive ? (
                    <span className="calendar-status status-active">En curso</span>
                  ) : item.status === "coming" ? (
                    <span className="calendar-status status-soon">Próximamente</span>
                  ) : null}
                </div>
                <p>{item.type} <span aria-hidden="true">·</span> {item.detail}</p>
              </div>
              {item.status === "available" ? (
                <button
                  className="calendar-action"
                  type="button"
                  aria-label="Abrir sesión de fuerza y potencia"
                  onClick={() => onNavigate("workout")}
                >
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              ) : (
                <span className="calendar-rest-icon" aria-hidden="true">
                  <Circle size={16} />
                </span>
              )}
            </article>
          );
        })}
      </section>
      <p className="calendar-footnote">
        Ajusta o reduce la sesión si notas fatiga, molestias o una semana de pádel más exigente.
      </p>
    </div>
  );
}
