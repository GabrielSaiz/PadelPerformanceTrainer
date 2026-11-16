import { useState } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { mondayWorkout } from "../data/trainingPlan";
import { ExerciseCard } from "./ExerciseCard";
import { useCountdown } from "./RestTimer";
import type { ExerciseProgress } from "../types/training";

const item = mondayWorkout.exercises.find(({ exerciseId }) => exerciseId === "goblet-squat")!;

function Card({ completed = false }: { completed?: boolean }) {
  const timer = useCountdown();
  const [progress, setProgress] = useState<ExerciseProgress>({
    completedSets: Array.from({ length: item.sets }, () => completed),
    notes: "Keep this note",
    loadKg: 12,
  });
  return (
    <ExerciseCard
      item={item}
      progress={progress}
      onToggleSet={(index) => {
        setProgress((current) => ({
          ...current,
          completedSets: current.completedSets.map((done, setIndex) => setIndex === index ? !done : done),
        }));
        return true;
      }}
      onUpdate={setProgress}
      timer={timer}
    />
  );
}

describe("ExerciseCard folding", () => {
  afterEach(cleanup);

  it("folds only after the final set, moves focus to the title and allows corrections", async () => {
    const user = userEvent.setup();
    render(<Card />);
    const title = screen.getByRole("button", { name: "Sentadilla goblet" });
    await user.click(screen.getByRole("button", { name: "Serie 1 Marcar" }));
    await user.click(screen.getByRole("button", { name: "Serie 2 Marcar" }));
    expect(title).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Serie 3 Marcar" }));
    expect(title).toHaveAttribute("aria-expanded", "false");
    expect(title).toHaveFocus();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Serie/ })).not.toBeInTheDocument();
    expect(screen.queryByText("3/3")).not.toBeInTheDocument();

    await user.keyboard("{Enter}");
    expect(title).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("spinbutton")).toHaveValue(12);
    expect(screen.getByRole("textbox", { name: "Nota" })).toHaveValue("Keep this note");
    expect(screen.getByRole("button", { name: "Serie 3 Hecha" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Serie 3 Hecha" }));
    expect(title).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Serie 3 Marcar" }));
    expect(title).toHaveAttribute("aria-expanded", "false");
  });

  it("starts completed exercises folded but allows manual reopening and folding", async () => {
    const user = userEvent.setup();
    render(<Card completed />);
    const title = screen.getByRole("button", { name: "Sentadilla goblet" });
    expect(title).toHaveAttribute("aria-expanded", "false");
    await user.click(title);
    expect(screen.getAllByRole("button", { name: /Serie \d Hecha/ })).toHaveLength(item.sets);
    await user.click(title);
    expect(title).toHaveAttribute("aria-expanded", "false");
  });
});
