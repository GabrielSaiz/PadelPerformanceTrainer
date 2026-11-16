import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CountdownPanel, useCountdown } from "./RestTimer";

function TimerExample() {
  const timer = useCountdown();
  return (
    <>
      <button onClick={() => timer.begin("exercise", "plank", "Plancha", 3)}>Start exercise</button>
      <button onClick={() => timer.begin("rest", "squat", "Sentadilla", 2)}>Start rest</button>
      <CountdownPanel timer={timer} onCancel={timer.cancel} />
    </>
  );
}

describe("countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T10:00:00.000Z"));
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("counts down, pauses accurately, resumes and reports completion", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start exercise"));
    expect(screen.getByRole("group", { name: "Ejercicio: Plancha" })).toBeVisible();
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");
    act(() => vi.advanceTimersByTime(1100));
    fireEvent.click(screen.getByRole("button", { name: "Pausar" }));
    expect(screen.getByRole("status")).toHaveTextContent("Ejercicio pausado");
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    act(() => vi.advanceTimersByTime(10000));
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("status")).toHaveTextContent("Ejercicio completado");
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
  });

  it("restarts a rest from the original duration whether paused or finished", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start rest"));
    act(() => vi.advanceTimersByTime(1000));
    fireEvent.click(screen.getByText("Pausar"));
    fireEvent.click(screen.getByText("Reiniciar"));
    expect(screen.getByRole("status")).toHaveTextContent("Descanso en curso");
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("status")).toHaveTextContent("Descanso completado");
    fireEvent.click(screen.getByText("Reiniciar"));
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    fireEvent.click(screen.getByText("Continuar"));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("distinguishes resuming a paused rest from continuing the workout", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start rest"));
    fireEvent.click(screen.getByText("Pausar"));
    expect(screen.queryByText("Cancelar")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Reanudar"));
    expect(screen.getByRole("status")).toHaveTextContent("Descanso en curso");
    fireEvent.click(screen.getByText("Pausar"));
    fireEvent.click(screen.getByText("Continuar"));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("still cancels an exercise countdown before completion", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start exercise"));
    fireEvent.click(screen.getByText("Cancelar"));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  });

  it("uses Continue to dismiss a finished countdown without affecting a new one", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start rest"));
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.queryByRole("timer")).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Start exercise"));
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");
  });

  it("replaces a running or paused countdown when another starts", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start exercise"));
    fireEvent.click(screen.getByText("Pausar"));
    fireEvent.click(screen.getByText("Start rest"));
    expect(screen.getByRole("timer")).toHaveTextContent("00:02");
    expect(screen.getByRole("status")).toHaveTextContent("Descanso en curso");
    fireEvent.click(screen.getByText("Start exercise"));
    expect(screen.getByRole("timer")).toHaveTextContent("00:03");
    expect(screen.getByRole("status")).toHaveTextContent("Ejercicio en curso");
  });

  it("uses elapsed wall time after the page was suspended", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start exercise"));
    act(() => {
      vi.setSystemTime(new Date("2026-11-14T10:00:10.000Z"));
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByRole("timer")).toHaveTextContent("00:00");
    expect(screen.getByRole("status")).toHaveTextContent("Ejercicio completado");
  });

  it("keeps the focused control available at completion and stops intervals on unmount", () => {
    const clearInterval = vi.spyOn(window, "clearInterval");
    const view = render(<TimerExample />);
    fireEvent.click(screen.getByText("Start rest"));
    screen.getByText("Pausar").focus();
    act(() => vi.advanceTimersByTime(2000));
    const finishedControl = screen.getByRole("button", { name: "Continuar" });
    expect(finishedControl).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Tiempo finalizado" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Reiniciar"));
    clearInterval.mockClear();
    view.unmount();
    expect(clearInterval).toHaveBeenCalledOnce();
    clearInterval.mockRestore();
  });

  it("does not move focus when it is outside the finishing countdown", () => {
    render(<TimerExample />);
    fireEvent.click(screen.getByText("Start rest"));
    screen.getByText("Start exercise").focus();
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.getByText("Start exercise")).toHaveFocus();
  });
});
