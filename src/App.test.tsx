import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { serializeHistory } from "./services/historyTransfer";

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
    vi.restoreAllMocks();
  });

  it("keeps rest and set state consistent when local storage fails", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    await user.click(screen.getByRole("button", { name: /Empezar entrenamiento/ }));
    const squat = screen.getByRole("heading", { name: "Sentadilla goblet" }).closest("article")!;
    const save = vi.spyOn(Storage.prototype, "setItem");
    save.mockImplementationOnce(() => { throw new Error("storage full"); });
    await user.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("storage full");
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("padel-performance-trainer")!).activeSession
      .exerciseProgress["goblet-squat"].completedSets[0]).toBe(false);
    await user.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    expect(within(squat).getByRole("timer")).toHaveTextContent("01:30");
    save.mockImplementationOnce(() => { throw new Error("storage full"); });
    await user.click(within(squat).getByRole("button", { name: "Serie 1 Hecha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("storage full");
    expect(within(squat).getByRole("timer")).toBeVisible();
    expect(JSON.parse(localStorage.getItem("padel-performance-trainer")!).activeSession
      .exerciseProgress["goblet-squat"].completedSets[0]).toBe(true);
    await user.click(within(squat).getByRole("button", { name: "Serie 1 Hecha" }));
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("padel-performance-trainer")!).activeSession
      .exerciseProgress["goblet-squat"].completedSets[0]).toBe(false);
    await user.click(within(squat).getByRole("button", { name: "Serie 1 Marcar" }));
    save.mockClear();
    await user.click(within(squat).getByRole("button", { name: "Continuar" }));
    expect(within(squat).queryByRole("timer")).not.toBeInTheDocument();
    expect(save).not.toHaveBeenCalled();
    expect(JSON.parse(localStorage.getItem("padel-performance-trainer")!).activeSession
      .exerciseProgress["goblet-squat"].completedSets[0]).toBe(true);
  });

  it("saves completed sets, resumes them, and adds a finished workout to history", async () => {
    const user = userEvent.setup();
    const firstView = render(<App />);

    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    expect(screen.getAllByRole("img")).toHaveLength(14);
    expect(screen.getByRole("img", { name: /Ilustración de Sentadilla goblet/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Empezar entrenamiento/ }));
    expect(screen.getAllByRole("img")).toHaveLength(14);
    expect(screen.getByRole("img", { name: /Ilustración de Sentadilla goblet/ })).toBeVisible();

    const firstSet = screen.getAllByRole("button", { name: /Serie 1/ })[0];
    await user.click(firstSet);
    expect(firstSet).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getAllByRole("button", { name: "Ejercicios" })[0]);
    expect(screen.getByRole("heading", { name: "Todos los ejercicios" })).toBeVisible();
    expect(screen.getAllByRole("img")).toHaveLength(25);
    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    expect(screen.getByRole("button", { name: "Movilidad dinámica de tobillo y cadera" }))
      .toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Movilidad dinámica de tobillo y cadera" }));
    expect(screen.getAllByRole("button", { name: /Serie 1/ })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    const savedActiveState = JSON.parse(
      window.localStorage.getItem("padel-performance-trainer") ?? "{}",
    );
    expect(
      savedActiveState.activeSession.exerciseProgress["dynamic-mobility"].completedSets[0],
    ).toBe(true);

    firstView.unmount();
    render(<App />);
    await user.click(screen.getAllByRole("button", { name: "Entrenar" })[0]);
    expect(screen.getByRole("button", { name: "Movilidad dinámica de tobillo y cadera" }))
      .toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("button", { name: "Movilidad dinámica de tobillo y cadera" }));
    expect(screen.getAllByRole("button", { name: /Serie 1/ })[0]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getAllByRole("img")).toHaveLength(14);
    expect(screen.getByRole("img", { name: /Ilustración de Sentadilla goblet/ })).toHaveAttribute(
      "src",
      "/images/exercises/sentadilla-goblet.webp",
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

    const backup = serializeHistory([
      savedState.sessions[0],
      { ...savedState.sessions[0], id: "imported-session", notes: "Imported workout" },
    ]);
    const file = new File([backup], "history.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(backup) });
    await user.upload(screen.getByLabelText("Archivo de historial JSON"), file);
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Sesiones importadas: 1. Omitidas por identificador existente: 1.",
    );
    expect(screen.getAllByRole("heading", { name: "Fuerza y potencia de piernas" }))
      .toHaveLength(2);
    expect(JSON.parse(window.localStorage.getItem("padel-performance-trainer") ?? "{}").sessions)
      .toHaveLength(2);
  });
});
