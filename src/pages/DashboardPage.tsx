import { ArrowRight, Check, Clock3, Dumbbell, Sparkles } from "lucide-react";
import type { WorkoutSession } from "../types/training";
import { mondayWorkout } from "../data/trainingPlan";
import { formatShortDate, getMondayOfWeek, getNextMonday } from "../utils/format";
import type { AppPage } from "../components/AppShell";

interface DashboardPageProps {
  sessions: WorkoutSession[];
  activeSession: WorkoutSession | null;
  onNavigate: (page: AppPage) => void;
}

export function DashboardPage({
  sessions,
  activeSession,
  onNavigate,
}: DashboardPageProps) {
  const now = new Date();
  const weekStart = getMondayOfWeek(now);
  const completedThisWeek = sessions.filter(
    (session) => new Date(session.startedAt) >= weekStart,
  ).length;
  const sessionIsActive = activeSession?.workoutId === mondayWorkout.id;
  const nextSessionDate = getNextMonday(now);
  if (!sessionIsActive && completedThisWeek > 0 && nextSessionDate.toDateString() === now.toDateString()) {
    nextSessionDate.setDate(nextSessionDate.getDate() + 7);
  }

  return (
    <div className="page-stack">
      <div className="page-heading dashboard-heading">
        <div>
          <p className="eyebrow">
            {new Intl.DateTimeFormat("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            }).format(now)}
          </p>
          <h1>Tu semana, en movimiento.</h1>
          <p className="page-subtitle">
            Entrena con intención. La calidad va antes que la carga.
          </p>
        </div>
        <div className="week-number">
          <span>SEMANA</span>
          <strong>{String(getWeekNumber(now)).padStart(2, "0")}</strong>
        </div>
      </div>

      <section className="dashboard-hero" aria-labelledby="next-session-title">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span className="hero-kicker-dot" />
            {sessionIsActive ? "SESIÓN EN CURSO" : "TU PRÓXIMA SESIÓN"}
          </span>
          <h2 id="next-session-title">{mondayWorkout.name}</h2>
          <p>
            Fuerza funcional y potencia para llegar a cada bola con más control.
          </p>
          <div className="hero-meta">
            <span>
              <Clock3 size={15} aria-hidden="true" />
              45–50 min
            </span>
            <span>
              <Dumbbell size={15} aria-hidden="true" />
              4 bloques
            </span>
          </div>
          <button
            className="button button-lime"
            type="button"
            onClick={() => onNavigate("workout")}
          >
            {sessionIsActive ? "Continuar sesión" : "Ver sesión"}
            <ArrowRight size={17} aria-hidden="true" />
          </button>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="court-line court-line-one" />
          <div className="court-line court-line-two" />
          <div className="court-circle" />
        </div>
      </section>

      <section className="dashboard-grid" aria-label="Resumen de entrenamiento">
        <article className="stat-card">
          <span className="stat-icon stat-icon-lime">
            <Check size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-label">Esta semana</p>
            <p className="stat-value">{completedThisWeek}<span> / 3</span></p>
            <p className="stat-caption">sesiones completadas</p>
          </div>
          <div
            className="stat-progress"
            role="progressbar"
            aria-label="Sesiones complementarias completadas esta semana"
            aria-valuemin={0}
            aria-valuemax={3}
            aria-valuenow={Math.min(completedThisWeek, 3)}
          >
            <span style={{ width: `${Math.min(completedThisWeek / 3, 1) * 100}%` }} />
          </div>
        </article>

        <article className="stat-card next-date-card">
          <span className="stat-icon stat-icon-peach">
            <Clock3 size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-label">Siguiente sesión</p>
            <p className="stat-date">{formatShortDate(nextSessionDate)}</p>
            <p className="stat-caption">Fuerza y potencia</p>
          </div>
        </article>

        <article className="stat-card progress-card">
          <span className="stat-icon stat-icon-sage">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <div>
            <p className="stat-label">Tu progreso</p>
            <p className="stat-date">
              {sessions.length === 0
                ? "Tu primera sesión te espera"
                : `${sessions.length} ${sessions.length === 1 ? "sesión registrada" : "sesiones registradas"}`}
            </p>
            <button
              className="text-button"
              type="button"
              onClick={() => onNavigate("history")}
            >
              Ver historial <ArrowRight size={14} aria-hidden="true" />
            </button>
          </div>
        </article>
      </section>

      <section className="week-preview" aria-labelledby="week-preview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">PLAN SEMANAL</p>
            <h2 id="week-preview-title">Ritmo con propósito</h2>
          </div>
          <button
            className="text-button"
            type="button"
            onClick={() => onNavigate("plan")}
          >
            Ver semana <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
        <div className="week-strip">
          {[
            { day: "LUN", label: "Fuerza", tone: "lime" },
            { day: "MAR", label: "Descanso", tone: "muted" },
            { day: "MIÉ", label: "Agilidad", tone: "peach" },
            { day: "JUE", label: "Pádel + core", tone: "sage" },
            { day: "VIE", label: "Pádel", tone: "court" },
            { day: "SÁB", label: "Libre", tone: "muted" },
            { day: "DOM", label: "Recuperar", tone: "muted" },
          ].map((item) => (
            <div className="week-day" key={item.day}>
              <span className="week-day-label">{item.day}</span>
              <span className={`week-day-mark mark-${item.tone}`} />
              <span className="week-day-activity">{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {activeSession && !sessionIsActive && (
        <div className="inline-notice" role="status">
          Tienes otra sesión en curso. Continúala desde Entrenar antes de empezar otra.
        </div>
      )}
    </div>
  );
}

function getWeekNumber(date: Date): number {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(current.getUTCFullYear(), 0, 1));
  return Math.ceil(((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
