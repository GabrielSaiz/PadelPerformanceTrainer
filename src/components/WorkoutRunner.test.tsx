import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mondayWorkout } from "../data/trainingPlan";
import type { WorkoutSession } from "../types/training";
import { WorkoutRunner } from "./WorkoutRunner";

function createSession(): WorkoutSession {
  return {
    id: "session",
    workoutId: mondayWorkout.id,
    status: "in-progress",
    startedAt: "2026-11-14T10:00:00.000Z",
    durationSeconds: 0,
    notes: "",
    exerciseProgress: Object.fromEntries(mondayWorkout.exercises.map(({ exerciseId, sets }) => [
      exerciseId,
      { completedSets: Array.from({ length: sets }, () => false), notes: "" },
    ])),
  };
}

function Runner({ onSave = () => true }: { onSave?: () => boolean }) {
  const [session, setSession] = useState(createSession);
  return <WorkoutRunner session={session} onToggleSet={(exerciseId, index) => {
    if (!onSave()) return false;
    setSession((current) => {
      const progress = current.exerciseProgress[exerciseId];
      return {
        ...current,
        exerciseProgress: {
          ...current.exerciseProgress,
          [exerciseId]: {
            ...progress,
            completedSets: progress.completedSets.map((done, i) => i === index ? !done : done),
          },
        },
      };
    });
    return true;
  }} onUpdateExercise={vi.fn()} onUpdateNotes={vi.fn()} onFinish={vi.fn()} />;
}

describe("workout countdown integration", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows a countdown only for timed exercises and leaves the set manual at zero", () => {
    const onToggleSet = vi.fn(() => true);
    render(<WorkoutRunner session={createSession()} onToggleSet={onToggleSet}
      onUpdateExercise={vi.fn()} onUpdateNotes={vi.fn()} onFinish={vi.fn()} />);
    const plank = screen.getByRole("heading", { name: "Plancha frontal" }).closest("article")!;
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    expect(within(squat).queryByRole("button", { name: /Empezar/ })).not.toBeInTheDocument();
    const image = within(plank).getByRole("img");
    const start = within(plank).getByRole("button", { name: "Empezar · 30 s" });
    expect(image.compareDocumentPosition(start) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(within(plank).getByRole("button", { name: "Empezar · 30 s" }));
    expect(within(plank).getByRole("timer")).toHaveTextContent("00:30");
    expect(image.compareDocumentPosition(within(plank).getByRole("timer")) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    act(() => vi.advanceTimersByTime(30000));
    expect(within(plank).getByRole("status")).toHaveTextContent("Ejercicio completado");
    fireEvent.click(within(plank).getByRole("button", { name: "Continuar" }));
    expect(within(plank).queryByRole("timer")).not.toBeInTheDocument();
    expect(onToggleSet).not.toHaveBeenCalled();
    fireEvent.click(within(plank).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(onToggleSet).toHaveBeenCalledWith("front-plank", 0);
  });

  it("replaces an exercise countdown with a rest countdown in the relevant card", () => {
    render(<Runner />);
    const plank = screen.getByRole("heading", { name: "Plancha frontal" }).closest("article")!;
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    fireEvent.click(within(plank).getByRole("button", { name: "Empezar · 30 s" }));
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(within(plank).queryByRole("timer")).not.toBeInTheDocument();
    expect(within(squat).getByRole("timer")).toHaveTextContent("01:30");
    expect(within(squat).getByRole("img").compareDocumentPosition(within(squat).getByRole("timer")) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy();
    fireEvent.click(within(squat).getByRole("button", { name: "Pausar" }));
    expect(within(squat).getByRole("status")).toHaveTextContent("Descanso pausado");
    fireEvent.click(within(squat).getByRole("button", { name: "Continuar" }));
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    expect(within(squat).getByRole("button", { name: "Serie 1 Hecha" })).toHaveAttribute("aria-pressed", "true");
  });

  it("continues the last rest while keeping the card folded and the set completed", () => {
    render(<Runner />);
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    for (let i = 1; i <= 3; i++) fireEvent.click(within(squat).getByRole("button", { name: `Serie ${i} Marcar` }));
    expect(within(squat).getByRole("button", { name: "Sentadilla goblet" })).toHaveAttribute("aria-expanded", "false");
    expect(within(squat).getByRole("timer")).toHaveTextContent("01:30");
    fireEvent.click(within(squat).getByRole("button", { name: "Continuar" }));
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    expect(within(squat).getByRole("button", { name: "Sentadilla goblet" })).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(within(squat).getByRole("button", { name: "Sentadilla goblet" }));
    expect(within(squat).getByRole("button", { name: "Serie 3 Hecha" })).toBeVisible();
    expect(within(squat).getByRole("button", { name: "Serie 2 Hecha" })).toBeVisible();
  });

  it("keeps completed sets after continuing finished and restarted rests", () => {
    render(<Runner />);
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    act(() => vi.advanceTimersByTime(90000));
    fireEvent.click(within(squat).getByRole("button", { name: "Continuar" }));
    expect(within(squat).getByRole("button", { name: "Serie 1 Hecha" })).toBeVisible();
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 2 Marcar" }));
    act(() => vi.advanceTimersByTime(90000));
    fireEvent.click(within(squat).getByRole("button", { name: "Reiniciar" }));
    fireEvent.click(within(squat).getByRole("button", { name: "Continuar" }));
    expect(within(squat).getByRole("button", { name: "Serie 1 Hecha" })).toBeVisible();
    expect(within(squat).getByRole("button", { name: "Serie 2 Hecha" })).toBeVisible();
  });

  it("preserves replaced sets and closes the timer when its set is manually unmarked", () => {
    render(<Runner />);
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    const calf = screen.getByRole("heading", { name: "Elevación de gemelos" }).closest("article")!;
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 2 Marcar" }));
    fireEvent.click(within(calf).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(within(calf).getByRole("timer")).toHaveTextContent("01:00");
    expect(within(squat).getByRole("button", { name: "Serie 1 Hecha" })).toBeVisible();
    expect(within(squat).getByRole("button", { name: "Serie 2 Hecha" })).toBeVisible();
    fireEvent.click(within(calf).getByRole("button", { name: "Serie 1 Hecha" }));
    expect(within(calf).queryByRole("timer")).not.toBeInTheDocument();
  });

  it("does not start or stop a rest if saving a manual set change fails", () => {
    const onSave = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true).mockReturnValueOnce(false);
    render(<Runner onSave={onSave} />);
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    fireEvent.click(within(squat).getByRole("button", { name: "Serie 1 Hecha" }));
    expect(within(squat).getByRole("timer")).toBeVisible();
    expect(within(squat).getByRole("button", { name: "Serie 1 Hecha" })).toBeVisible();
  });
});
