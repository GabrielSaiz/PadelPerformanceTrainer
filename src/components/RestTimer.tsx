import { Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "../utils/format";

export function useRestTimer() {
  const [activeRest, setActiveRest] = useState<{
    seconds: number;
    exerciseName: string;
    key: number;
  } | null>(null);

  function begin(seconds: number, exerciseName: string): void {
    setActiveRest((current) => ({
      seconds,
      exerciseName,
      key: (current?.key ?? 0) + 1,
    }));
  }

  return { activeRest, begin };
}

export function ActiveRestTimer({
  seconds,
  exerciseName,
}: {
  seconds: number;
  exerciseName: string;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(seconds);
  const [endTime, setEndTime] = useState<number | null>(
    () => Date.now() + seconds * 1000,
  );

  useEffect(() => {
    if (endTime === null) return;

    const intervalId = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(intervalId);
        setEndTime(null);
      }
    }, 250);
    return () => window.clearInterval(intervalId);
  }, [endTime]);

  return (
    <div className="active-rest-panel" role="status" aria-live="polite">
      <Timer size={18} aria-hidden="true" />
      <div>
        <strong>
          {remainingSeconds > 0 ? "Recupera antes de la siguiente serie" : "Descanso completado"}
        </strong>
        <span>{exerciseName} · {formatDuration(remainingSeconds)}</span>
      </div>
    </div>
  );
}
