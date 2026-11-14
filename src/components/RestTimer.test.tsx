import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ActiveRestTimer } from "./RestTimer";

describe("rest timer", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("counts down and announces when the rest period ends", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-14T10:00:00.000Z"));
    render(<ActiveRestTimer seconds={2} exerciseName="Salto vertical" />);

    expect(screen.getByRole("status")).toHaveTextContent("00:02");

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByRole("status")).toHaveTextContent("Descanso completado");
    expect(screen.getByRole("status")).toHaveTextContent("00:00");
  });
});
