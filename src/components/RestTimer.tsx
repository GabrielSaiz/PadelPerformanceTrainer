import { Timer } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { formatDuration } from "../utils/format";

type TimerKind = "exercise" | "rest";
type TimerStatus = "running" | "paused" | "finished";

interface Countdown {
  kind: TimerKind;
  exerciseId: string;
  exerciseName: string;
  durationSeconds: number;
  remainingMs: number;
  deadline: number | null;
  status: TimerStatus;
  setIndex?: number;
}

export function useCountdown() {
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    if (countdown?.status !== "running" || countdown.deadline === null) return;
    const deadline = countdown.deadline;
    const update = () => {
      setCountdown((current) => {
        if (!current || current.status !== "running" || current.deadline !== deadline) return current;
        const remainingMs = Math.max(0, deadline - Date.now());
        return {
          ...current,
          remainingMs,
          deadline: remainingMs === 0 ? null : deadline,
          status: remainingMs === 0 ? "finished" : "running",
        };
      });
    };
    const intervalId = window.setInterval(update, 250);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") update();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [countdown?.status, countdown?.deadline]);

  function begin(kind: TimerKind, exerciseId: string, exerciseName: string, seconds: number, setIndex?: number) {
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error("Countdown duration must be greater than zero.");
    }
    setCountdown({
      kind,
      exerciseId,
      exerciseName,
      durationSeconds: seconds,
      remainingMs: seconds * 1000,
      deadline: Date.now() + seconds * 1000,
      status: "running",
      setIndex,
    });
  }

  function pause() {
    setCountdown((current) => {
      if (!current || current.status !== "running" || current.deadline === null) return current;
      const remainingMs = Math.max(0, current.deadline - Date.now());
      return {
        ...current,
        remainingMs,
        deadline: null,
        status: remainingMs === 0 ? "finished" : "paused",
      };
    });
  }

  function resume() {
    setCountdown((current) =>
      current?.status === "paused"
        ? { ...current, deadline: Date.now() + current.remainingMs, status: "running" }
        : current,
    );
  }

  function restart() {
    setCountdown((current) => current && {
      ...current,
      remainingMs: current.durationSeconds * 1000,
      deadline: Date.now() + current.durationSeconds * 1000,
      status: "running",
    });
  }

  return { countdown, begin, pause, resume, restart, cancel: () => setCountdown(null) };
}

export type CountdownController = ReturnType<typeof useCountdown>;

export function CountdownPanel({ timer, onCancel }: {
  timer: CountdownController;
  onCancel: () => void;
}) {
  const { countdown } = timer;
  const continueRef = useRef<HTMLButtonElement>(null);
  const pauseWasFocused = useRef(false);
  useLayoutEffect(() => {
    if (countdown?.status === "finished" && pauseWasFocused.current) {
      continueRef.current?.focus();
      pauseWasFocused.current = false;
    }
  }, [countdown?.status]);
  if (!countdown) return null;
  const title = countdown.kind === "rest" ? "Descanso" : "Ejercicio";
  const stateText = countdown.status === "finished"
    ? `${title} completado`
    : countdown.status === "paused" ? `${title} pausado` : `${title} en curso`;

  return (
    <div className="active-rest-panel" role="group" aria-label={`${title}: ${countdown.exerciseName}`}>
      <div className="countdown-heading">
        <Timer size={18} aria-hidden="true" />
        <strong role="status">{stateText}</strong>
        <span className="countdown-time" role="timer" aria-label={`Tiempo restante: ${formatDuration(Math.ceil(countdown.remainingMs / 1000))}`}>
          {formatDuration(Math.ceil(countdown.remainingMs / 1000))}
        </span>
      </div>
      <div className="countdown-actions">
        {countdown.status !== "finished" && (
          <button type="button"
            onFocus={() => { pauseWasFocused.current = true; }}
            onBlur={() => { pauseWasFocused.current = false; }}
            onClick={countdown.status === "running" ? timer.pause : timer.resume}>
            {countdown.status === "running" ? "Pausar" : countdown.kind === "rest" ? "Reanudar" : "Continuar"}
          </button>
        )}
        <button type="button" onClick={timer.restart}>Reiniciar</button>
        <button ref={continueRef} type="button" onClick={onCancel}>
          {countdown.kind === "rest" || countdown.status === "finished" ? "Continuar" : "Cancelar"}
        </button>
      </div>
    </div>
  );
}
