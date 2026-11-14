import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("training flow", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.stubGlobal("crypto", {
      ...window.crypto,
      randomUUID: () => "session-test",
    });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("saves completed sets, resumes them, and adds a finished workout to history", async () => {
    const user = userEvent.setup();
    const firstView = render(<App />);

    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    await user.click(screen.getByRole("button", { name: /Empezar entrenamiento/ }));

    const firstSet = screen.getAllByRole("button", { name: /Serie 1/ })[0];
    await user.click(firstSet);
    expect(firstSet).toHaveAttribute("aria-pressed", "true");

    const savedActiveState = JSON.parse(
      window.localStorage.getItem("padel-performance-trainer") ?? "{}",
    );
    expect(
      savedActiveState.activeSession.exerciseProgress["dynamic-mobility"].completedSets[0],
    ).toBe(true);

    firstView.unmount();
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    expect(screen.getAllByRole("button", { name: /Serie 1/ })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await user.click(screen.getByRole("button", { name: "Finalizar sesión" }));
    await user.click(screen.getByRole("button", { name: /Guardar y finalizar sesión/ }));
    await user.click(screen.getAllByRole("button", { name: "Historial" })[0]);

    expect(screen.getByRole("heading", { name: "Fuerza y potencia de piernas" })).toBeVisible();
    expect(screen.getByText("1 series")).toBeVisible();
    const savedState = JSON.parse(
      window.localStorage.getItem("padel-performance-trainer") ?? "{}",
    );
    expect(savedState.sessions).toHaveLength(1);
    expect(savedState.activeSession).toBeNull();
  });
});
