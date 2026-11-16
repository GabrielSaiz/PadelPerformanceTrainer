# Padel Performance Trainer

Aplicación web mobile-first para planificar y registrar el entrenamiento complementario de pádel. El primer incremento implementa el recorrido completo de la sesión del lunes y guarda el progreso localmente, sin cuenta ni backend.

## Requisitos

- Node.js 20+ o 22.12+
- npm

## Desarrollo

```bash
npm install
npm run dev
```

## Comprobaciones

```bash
npm test
npm run build
```

Las sesiones activas, cargas, notas e historial se guardan en LocalStorage en el navegador actual. No se sincronizan entre dispositivos. El plan deportivo está separado de los componentes en `src/data/`.

Durante el entrenamiento, completar la última serie pliega automáticamente el ejercicio y deja visible su título. Pulsa el título para desplegarlo y revisar o corregir series, cargas y notas. Los ejercicios completados también aparecen plegados al reanudar la sesión; el progreso no se modifica al plegar o desplegar.

En **Historial → Exportar historial** puedes descargar las sesiones completadas, incluidas sus series, cargas y notas, como JSON. **Importar historial** permite trasladarlas a otro navegador o recuperar una copia: combina por `id`, conserva las sesiones locales en caso de conflicto y omite identificadores repetidos en el archivo. También omite una sesión cuyo identificador coincida con la sesión en curso; esta nunca se modifica ni se exporta. Tras importar, el historial se ordena de más reciente a más antiguo.

El archivo usa `format: "padel-performance-trainer-history"`, `version: 1`, `exportedAt` (fecha ISO UTC) y `sessions` (lista de `WorkoutSession` completadas). Se valida el archivo completo antes de guardar: JSON o versiones inválidas, fechas o registros incompletos y entrenamientos o ejercicios desconocidos se rechazan sin modificar los datos locales. Si falla el guardado, se muestra un error y se conserva el historial previo. La copia contiene datos personales de entrenamiento: guárdala en un lugar de confianza.

Las ilustraciones aportadas cubren los 25 ejercicios del catálogo, incluidos los cinco del calentamiento. Los 14 ejercicios del lunes muestran su imagen tanto antes de empezar como durante una sesión en curso. Pulsa una imagen para verla completa en otra pestaña. Las imágenes son orientativas, no una validación profesional de la técnica: si su texto indica otra dosis, prevalecen las series, repeticiones y descansos de la app.

La sección **Ejercicios** permite consultar el catálogo completo, buscar por nombre, capacidad o material y desplegar la técnica y las recomendaciones de seguridad. Incluye los 14 ejercicios del lunes y los 11 adicionales con ilustración para futuros entrenamientos; esto no activa las sesiones de otros días. Los ejercicios sin imagen se muestran como «Ilustración pendiente». Para ampliar la biblioteca, añade un registro en `src/data/exercises.ts` y, si tiene ilustración, indica su `imageFileName` y guarda el WebP en `public/images/exercises/`; aparecerá automáticamente en el catálogo. Las dosis se definen por separado en `src/data/trainingPlan.ts`.
