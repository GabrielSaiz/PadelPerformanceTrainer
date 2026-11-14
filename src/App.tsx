import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { AppShell, type AppPage } from "./components/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { PlanPage } from "./pages/PlanPage";
import { WorkoutPage } from "./pages/WorkoutPage";
import { useTrainingSession } from "./hooks/useTrainingSession";

export default function App() {
  const [activePage, setActivePage] = useState<AppPage>("home");
  const {
    state,
    error,
    clearError,
    startWorkout,
    toggleSet,
    updateExerciseProgress,
    updateSessionNotes,
    finishWorkout,
  } = useTrainingSession();

  if (!state) {
    return (
      <div className="storage-error">
        <AlertTriangle size={25} aria-hidden="true" />
        <h1>No se pudieron cargar tus datos</h1>
        <p>{error}</p>
        <p>
          No hemos sobrescrito la información guardada. Comprueba el almacenamiento
          del navegador e inténtalo de nuevo.
        </p>
        <button className="button button-dark" type="button" onClick={() => window.location.reload()}>
          Volver a intentar
        </button>
      </div>
    );
  }

  return (
    <AppShell activePage={activePage} onNavigate={setActivePage}>
      {error && (
        <div className="error-banner" role="alert">
          <AlertTriangle size={17} aria-hidden="true" />
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Cerrar aviso">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      {activePage === "home" && (
        <DashboardPage
          sessions={state.sessions}
          activeSession={state.activeSession}
          onNavigate={setActivePage}
        />
      )}
      {activePage === "plan" && (
        <PlanPage
          sessions={state.sessions}
          activeSession={state.activeSession}
          onNavigate={setActivePage}
        />
      )}
      {activePage === "workout" && (
        <WorkoutPage
          activeSession={state.activeSession}
          onStart={() => startWorkout("monday-strength-power")}
          onToggleSet={toggleSet}
          onUpdateExercise={updateExerciseProgress}
          onUpdateNotes={updateSessionNotes}
          onFinish={finishWorkout}
          completedSessions={state.sessions.length}
        />
      )}
      {activePage === "history" && <HistoryPage sessions={state.sessions} />}
    </AppShell>
  );
}
