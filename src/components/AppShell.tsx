import {
  CalendarDays,
  BookOpen,
  ChartNoAxesCombined,
  House,
  PersonStanding,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

export type AppPage = "home" | "plan" | "workout" | "exercises" | "history";

const navigation: { id: AppPage; label: string; icon: LucideIcon }[] = [
  { id: "home", label: "Inicio", icon: House },
  { id: "plan", label: "Semana", icon: CalendarDays },
  { id: "workout", label: "Entrenar", icon: PersonStanding },
  { id: "exercises", label: "Ejercicios", icon: BookOpen },
  { id: "history", label: "Historial", icon: ChartNoAxesCombined },
];

interface AppShellProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  children: ReactNode;
}

export function AppShell({
  activePage,
  onNavigate,
  children,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="side-rail" aria-label="Navegación principal">
        <a
          className="brand"
          href="#inicio"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("home");
          }}
        >
          <span className="brand-mark" aria-hidden="true">
            P
          </span>
          <span>
            <strong>PADEL</strong>
            <small>PERFORMANCE TRAINER</small>
          </span>
        </a>
        <Navigation
          activePage={activePage}
          onNavigate={onNavigate}
          className="side-navigation"
        />
        <div className="rail-note">
          <span className="status-dot" />
          Plan personal
          <small>Guardado en este dispositivo</small>
        </div>
      </aside>

      <div className="main-column">
        <header className="top-bar">
          <a
            className="mobile-brand"
            href="#inicio"
            onClick={(event) => {
              event.preventDefault();
              onNavigate("home");
            }}
          >
            <span className="brand-mark" aria-hidden="true">
              P
            </span>
            <strong>PADEL TRAINER</strong>
          </a>
          <span className="top-bar-label">TU RENDIMIENTO, SESIÓN A SESIÓN</span>
          <div className="athlete-avatar" aria-hidden="true">
            <UserRound size={16} aria-hidden="true" />
          </div>
        </header>

        <main className="page-content">{children}</main>

        <nav className="bottom-navigation" aria-label="Navegación principal">
          <Navigation activePage={activePage} onNavigate={onNavigate} />
        </nav>
      </div>
    </div>
  );
}

function Navigation({
  activePage,
  onNavigate,
  className = "",
}: {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {navigation.map(({ id, label, icon: Icon }) => (
        <button
          className={`navigation-link${activePage === id ? " is-active" : ""}`}
          key={id}
          type="button"
          aria-current={activePage === id ? "page" : undefined}
          onClick={() => onNavigate(id)}
        >
          <Icon aria-hidden="true" size={19} strokeWidth={1.8} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
