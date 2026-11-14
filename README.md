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

Las sesiones activas, cargas, notas e historial se guardan en LocalStorage en el navegador actual. No se sincronizan entre dispositivos. El plan deportivo está separado de los componentes en `src/data/`; las referencias multimedia se omiten hasta disponer de recursos verificados.
