import { useState } from "react";
import type { Exercise } from "../types/training";

export function ExerciseImage({ exercise }: { exercise: Exercise }) {
  const [hasError, setHasError] = useState(false);
  if (!exercise.imageFileName) return null;

  const src = `${import.meta.env.BASE_URL}images/exercises/${exercise.imageFileName}`;

  return (
    <figure className="exercise-image">
      {hasError ? (
        <p role="alert">No se pudo cargar la ilustración de {exercise.name}.</p>
      ) : (
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          aria-label={`Ampliar ilustración de ${exercise.name} (nueva pestaña)`}
        >
          <img
            src={src}
            alt={`Ilustración de ${exercise.name}. ${exercise.description}`}
            width={1024}
            height={765}
            loading="lazy"
            decoding="async"
            onError={() => setHasError(true)}
          />
        </a>
      )}
      <figcaption>
        {!hasError && <>Pulsa la imagen para ampliarla en otra pestaña. </>}
        Imagen orientativa. Sigue las series, repeticiones y descansos de la app,
        aunque la imagen indique otra dosis.
      </figcaption>
    </figure>
  );
}
