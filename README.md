# Aeróforo · Web

Home page con monitor en vivo del **Aeróforo**, el dispositivo de monitoreo de calidad del aire del Equipo 1 (Investigación e Innovación Tecnológica, Tecsup).

La web se comporta como si estuviera conectada a los sensores reales: semáforo verde/amarillo/rojo, índice de calidad del aire (ICA), lecturas de PM2.5, PM10, CO₂, CO, temperatura y humedad, gráficas, alertas y mapa de estaciones. **Los datos son simulados.**

## Cómo funcionan los datos

```
Supabase (Postgres)                         Navegador
┌───────────────────────────┐               ┌──────────────────────────────┐
│ stations · metrics        │  carga 24 h   │ AirProvider (useAirData.tsx) │
│ readings · alerts         │ ────────────▶ │  · historial desde Supabase  │
│ pg_cron cada 5 min:       │               │  · simulador cada 3 s        │
│   simulate_sensor_tick()  │               │  · alertas al cambiar nivel  │
└───────────────────────────┘               └──────────────────────────────┘
```

- **Supabase** guarda las estaciones, los límites del semáforo, el historial y las alertas. Un `pg_cron` hace de "sensor" e inserta una lectura por estación cada 5 minutos.
- **El navegador** continúa la serie cada 3 s con `src/lib/simulator.ts` (misma curva de horas punta: 8 h y 19 h). El botón **"Simular pico de contaminación"** sirve para la demo.
- Si faltan las variables de Supabase, la web genera todo localmente y sigue funcionando.
- **Con hardware real**, el ESP32 solo tendría que insertar filas en `readings`. Habría que quitar el cron y el simulador del navegador.

## Estructura

```
src/
  app/            layout, page (Home) y estilos globales
  components/     Hero, LiveMonitor, MetricCard, TrendChart, AlertFeed, StationsMap, Semaforo, AqiGauge…
  hooks/          useAirData.tsx: carga de Supabase + simulación en vivo
  lib/            air.ts (niveles, ICA), simulator.ts, supabase.ts, types.ts
supabase/migrations/   esquema, seed y cron del simulador
public/media/          hero.mp4 opcional (video de fondo generado con Higgsfield)
docs/PROMPTS.md        prompts para ChatGPT + Higgsfield
```

## Desarrollo

```bash
cp .env.example .env.local   # completar con la URL y la clave publicable de Supabase
npm install
npm run dev
```

## Despliegue

Proyecto Next.js listo para Vercel. Variables de entorno necesarias:

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (solo lectura por RLS) |
