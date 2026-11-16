import { useState } from "react";
import { ExerciseImage } from "../components/ExerciseImage";
import { exercises } from "../data/exercises";

const sortedExercises = [...exercises].sort((first, second) =>
  first.name.localeCompare(second.name, "es"),
);

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
}

export function ExercisesPage() {
  const [query, setQuery] = useState("");
  const search = normalizeSearch(query.trim());
  const visibleExercises = sortedExercises.filter((exercise) =>
    normalizeSearch([exercise.name, exercise.capacity, ...exercise.equipment].join(" "))
      .includes(search),
  );

  return (
    <div className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">BIBLIOTECA DE MOVIMIENTO</p>
          <h1>Todos los ejercicios</h1>
          <p className="page-subtitle">
            Consulta las ilustraciones y la técnica, sin empezar una sesión.
            El catálogo también incluye ejercicios para futuros entrenamientos.
          </p>
        </div>
      </div>

      <div className="exercise-catalog-search">
        <label htmlFor="exercise-search">Buscar por nombre, capacidad o material</label>
        <input
          id="exercise-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ej. sentadilla, reacción, pelota…"
        />
        <p role="status">{visibleExercises.length} de {exercises.length} ejercicios</p>
      </div>

      {visibleExercises.length === 0 ? (
        <section className="empty-state card-surface">
          <h2>No hay ejercicios que coincidan</h2>
          <p>Prueba otro nombre, capacidad o material.</p>
          <button className="button button-dark" type="button" onClick={() => setQuery("")}>
            Mostrar todos
          </button>
        </section>
      ) : (
        <section className="exercise-catalog" aria-label="Catálogo de ejercicios">
          {visibleExercises.map((exercise) => (
            <article className="exercise-catalog-card card-surface" key={exercise.id}>
              <p className="eyebrow">{exercise.capacity}</p>
              <h2>{exercise.name}</h2>
              <p className="exercise-catalog-description">{exercise.description}</p>
              <p className="exercise-catalog-equipment">
                <strong>Material:</strong>{" "}
                {exercise.equipment.length ? exercise.equipment.join(", ") : "Sin material"}
              </p>
              {exercise.imageFileName ? (
                <ExerciseImage exercise={exercise} />
              ) : (
                <p className="exercise-catalog-no-image">Ilustración pendiente</p>
              )}
              <details className="exercise-catalog-technique">
                <summary>Técnica y seguridad</summary>
                <ol>
                  {exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
                </ol>
                <ul>
                  {exercise.safetyTips.map((tip) => <li key={tip}>{tip}</li>)}
                </ul>
              </details>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
