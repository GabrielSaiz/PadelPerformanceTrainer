import { describe, expect, it } from "vitest";
import { exercises } from "./exercises";
import { mondayWorkout } from "./trainingPlan";

describe("Monday workout", () => {
  it("preserves the exercises, doses, and recovery ranges from the MVP plan", () => {
    expect(mondayWorkout.durationMinutes).toEqual({ minimum: 45, maximum: 50 });
    expect(mondayWorkout.exercises).toHaveLength(14);

    expect(
      mondayWorkout.exercises.map(({ exerciseId, sets, target, restSeconds }) => ({
        exerciseId,
        sets,
        target:
          target.kind === "duration"
            ? `${target.durationSeconds} seconds`
            : target.kind === "instruction"
              ? "instruction"
              : target.minimumRepetitions !== undefined
                ? `${target.minimumRepetitions}-${target.maximumRepetitions} repetitions`
                : `${target.repetitions} repetitions${target.perSide ? " per side" : ""}`,
        restSeconds,
      })),
    ).toEqual([
      { exerciseId: "dynamic-mobility", sets: 1, target: "instruction", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "bodyweight-squat", sets: 1, target: "15 repetitions", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "alternating-lunge", sets: 1, target: "10 repetitions", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "light-skipping", sets: 1, target: "20 seconds", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "progressive-acceleration", sets: 1, target: "2 repetitions", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "vertical-jump", sets: 3, target: "5 repetitions", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "skater-jump", sets: 3, target: "4 repetitions per side", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "broad-jump", sets: 2, target: "4 repetitions", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "goblet-squat", sets: 3, target: "8-10 repetitions", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "dumbbell-romanian-deadlift", sets: 3, target: "10 repetitions", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "bulgarian-split-squat", sets: 3, target: "8 repetitions per side", restSeconds: { minimum: 60, maximum: 90 } },
      { exerciseId: "calf-raise", sets: 3, target: "15 repetitions", restSeconds: { minimum: 60, maximum: 60 } },
      { exerciseId: "front-plank", sets: 3, target: "30 seconds", restSeconds: { minimum: 0, maximum: 0 } },
      { exerciseId: "dead-bug", sets: 2, target: "10 repetitions per side", restSeconds: { minimum: 0, maximum: 0 } },
    ]);
  });

  it("references an existing exercise for every workout item", () => {
    const exerciseIds = new Set(exercises.map(({ id }) => id));
    expect(
      mondayWorkout.exercises.every(({ exerciseId }) => exerciseIds.has(exerciseId)),
    ).toBe(true);
  });
});
