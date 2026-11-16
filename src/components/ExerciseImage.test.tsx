import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { exercises } from "../data/exercises";
import { ExerciseImage } from "./ExerciseImage";

describe("ExerciseImage", () => {
  afterEach(cleanup);

  it("maps every supplied illustration to the corresponding exercise", () => {
    const illustratedExercises = exercises.filter((exercise) => exercise.imageFileName);
    expect(Object.fromEntries(illustratedExercises.map(({ id, imageFileName }) => [id, imageFileName])))
      .toEqual({
        "dynamic-mobility": "movilidad-dinamica-de-tobillo-y-cadera.webp",
        "bodyweight-squat": "sentadillas-sin-peso.webp",
        "alternating-lunge": "zancadas-alternas.webp",
        "light-skipping": "skipping.webp",
        "progressive-acceleration": "aceleraciones-progresivas-cortas.webp",
        "vertical-jump": "salto-vertical-aterrizaje-controlado.webp",
        "skater-jump": "salto-lateral-tipo-skater.webp",
        "broad-jump": "salto-horizontal-con-estabilizacion.webp",
        "goblet-squat": "sentadilla-goblet.webp",
        "dumbbell-romanian-deadlift": "peso-rumano-con-marcuernas.webp",
        "bulgarian-split-squat": "sentadilla-bulgara.webp",
        "calf-raise": "elevacion-gemelos.webp",
        "front-plank": "plancha-frontal.webp",
        "dead-bug": "dead-bug.webp",
        "agility-ladder": "escalera-agilidad.webp",
        "quick-lateral-steps": "pasos-laterales-rapidos.webp",
        "lateral-movement-return": "desplazamiento-lateral-y-vuelta-al-centro.webp",
        "split-step-lateral-start": "split-step-y-salida-lateral.webp",
        "drop-catch-tennis-ball": "soltar-y-atrapar-pelota.webp",
        "visual-cue-left-right": "senial-visual-izquierda-derecha.webp",
        "auditory-cue-movement": "senial-auditiva-y-desplazamiento.webp",
        "irregular-ball-reaction": "reaccion-con-pelota-irregular.webp",
        "lateral-movement-short": "desplazamiento-lateral-2-3-metros.webp",
        "advance-brake-retreat": "avanzar-frenar-retroceder.webp",
        "diagonal-movement-recovery": "desplazamiento-diagonal-y-recuperacion.webp",
      });
  });

  it("shows the supplied image, an enlargement link, and the plan precedence warning", () => {
    const exercise = exercises.find(({ id }) => id === "goblet-squat")!;
    render(<ExerciseImage exercise={exercise} />);
    const image = screen.getByRole("img");
    expect(image).toHaveAttribute("src", "/images/exercises/sentadilla-goblet.webp");
    expect(image).toHaveAttribute("loading", "lazy");
    expect(screen.getByRole("link", { name: /Ampliar ilustración de Sentadilla goblet/ }))
      .toHaveAttribute("target", "_blank");
    expect(screen.getByText(/aunque la imagen indique otra dosis/)).toBeVisible();
  });

  it("does not invent an image for exercises without supplied artwork", () => {
    render(<ExerciseImage exercise={{ ...exercises[0], imageFileName: undefined }} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("reports an image load failure instead of silently hiding it", () => {
    const exercise = exercises.find(({ id }) => id === "dead-bug")!;
    render(<ExerciseImage exercise={exercise} />);
    fireEvent.error(screen.getByRole("img"));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "No se pudo cargar la ilustración de Dead bug.",
    );
  });
});
