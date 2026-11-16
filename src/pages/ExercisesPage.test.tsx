import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "../data/exercises";
import { ExercisesPage } from "./ExercisesPage";

describe("ExercisesPage", () => {
  afterEach(cleanup);

  it("lists the whole catalog with an illustration for every current exercise", () => {
    render(<ExercisesPage />);
    expect(screen.getAllByRole("article")).toHaveLength(exercises.length);
    expect(screen.getAllByRole("img")).toHaveLength(25);
    expect(screen.queryByText("Ilustración pendiente")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("25 de 25 ejercicios");
    for (const exercise of exercises) {
      const heading = screen.getByRole("heading", { name: exercise.name });
      expect(heading).toBeVisible();
      if (exercise.imageFileName) {
        const article = heading.closest("article")!;
        expect(within(article).getByRole("img")).toHaveAttribute(
          "src",
          `/images/exercises/${exercise.imageFileName}`,
        );
      }
    }
  });

  it("searches names, capacity and equipment without requiring accents or exact case", async () => {
    const user = userEvent.setup();
    render(<ExercisesPage />);
    const search = screen.getByRole("searchbox");
    await user.type(search, "  BULGARA  ");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Sentadilla búlgara" })).toBeVisible();
    await user.clear(search);
    await user.type(search, "reaccion");
    expect(screen.getAllByRole("article")).toHaveLength(4);
    await user.clear(search);
    await user.type(search, "Banco");
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Sentadilla búlgara" })).toBeVisible();
  });

  it("provides an empty state and lets the user restore the list", async () => {
    const user = userEvent.setup();
    render(<ExercisesPage />);
    await user.type(screen.getByRole("searchbox"), "no-match");
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No hay ejercicios que coincidan" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Mostrar todos" }));
    expect(screen.getByRole("searchbox")).toHaveValue("");
    expect(screen.getAllByRole("article")).toHaveLength(exercises.length);
  });

  it("makes instructions and safety tips available for each exercise", async () => {
    const user = userEvent.setup();
    render(<ExercisesPage />);
    await user.type(screen.getByRole("searchbox"), "goblet");
    await user.click(screen.getByText("Técnica y seguridad"));
    const exercise = exercises.find(({ id }) => id === "goblet-squat")!;
    for (const text of [...exercise.instructions, ...exercise.safetyTips]) {
      expect(screen.getByText(text)).toBeVisible();
    }
  });
});
