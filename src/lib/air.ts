import type { Level, Metric, MetricCode, Reading, Station } from "./types";

export const LEVELS: Record<
  Level,
  { label: string; short: string; color: string; soft: string; range: string; advice: string; detail: string }
> = {
  verde: {
    label: "Bueno",
    short: "Aire limpio",
    color: "#22C55E",
    soft: "rgba(34,197,94,0.14)",
    range: "ICA 0 – 50",
    advice: "Disfruta las actividades al aire libre.",
    detail: "La calidad del aire es satisfactoria y no representa riesgo para la salud.",
  },
  amarillo: {
    label: "Moderado",
    short: "Precaución",
    color: "#F59E0B",
    soft: "rgba(245,158,11,0.14)",
    range: "ICA 51 – 100",
    advice: "Niños, adultos mayores y personas con asma deben reducir el esfuerzo prolongado al aire libre.",
    detail: "Aceptable, pero algunos contaminantes pueden afectar a grupos sensibles.",
  },
  rojo: {
    label: "Dañino",
    short: "Alerta",
    color: "#EF4444",
    soft: "rgba(239,68,68,0.14)",
    range: "ICA > 100",
    advice: "Evita actividades al aire libre, cierra ventanas y usa mascarilla si debes salir.",
    detail: "Toda la población puede sentir efectos en la salud. Se activa la alerta del semáforo.",
  },
};

export const LEVEL_ORDER: Level[] = ["verde", "amarillo", "rojo"];

// Respaldo local: igual a la tabla `metrics` de Supabase.
export const DEFAULT_METRICS: Metric[] = [
  { code: "pm25", name: "PM2.5", unit: "µg/m³", sensor_model: "Plantower PMS5003", description: "Partículas finas que llegan a los pulmones y al torrente sanguíneo.", good_max: 15, moderate_max: 50, affects_level: true, sort_order: 1 },
  { code: "pm10", name: "PM10", unit: "µg/m³", sensor_model: "Plantower PMS5003", description: "Polvo y partículas gruesas de construcción y tránsito.", good_max: 45, moderate_max: 100, affects_level: true, sort_order: 2 },
  { code: "co2", name: "CO₂", unit: "ppm", sensor_model: "Sensirion SCD40", description: "Dióxido de carbono: indica ventilación y combustión.", good_max: 800, moderate_max: 1200, affects_level: true, sort_order: 3 },
  { code: "co", name: "CO", unit: "ppm", sensor_model: "Winsen MQ-7", description: "Monóxido de carbono de los escapes de vehículos.", good_max: 4.4, moderate_max: 9, affects_level: true, sort_order: 4 },
  { code: "temp", name: "Temperatura", unit: "°C", sensor_model: "Bosch BME280", description: "Temperatura ambiente del punto de medición.", good_max: null, moderate_max: null, affects_level: false, sort_order: 5 },
  { code: "hum", name: "Humedad", unit: "%", sensor_model: "Bosch BME280", description: "Humedad relativa: influye en la lectura de partículas.", good_max: null, moderate_max: null, affects_level: false, sort_order: 6 },
];

// Respaldo local: igual a la tabla `stations` de Supabase.
export const DEFAULT_STATIONS: Station[] = [
  { id: 1, code: "AER-01", name: "Tecsup", district: "Santa Anita", lat: -12.0453, lng: -76.9712, pollution_profile: 1.5, is_online: true, installed_at: "2026-09-01" },
  { id: 2, code: "AER-02", name: "Parque Kennedy", district: "Miraflores", lat: -12.1219, lng: -77.03, pollution_profile: 0.9, is_online: true, installed_at: "2026-09-03" },
  { id: 3, code: "AER-03", name: "Plaza Dos de Mayo", district: "Cercado de Lima", lat: -12.0464, lng: -77.0428, pollution_profile: 2.1, is_online: true, installed_at: "2026-09-05" },
  { id: 4, code: "AER-04", name: "Carretera Central", district: "Ate", lat: -12.0262, lng: -76.918, pollution_profile: 2.6, is_online: true, installed_at: "2026-09-08" },
  { id: 5, code: "AER-05", name: "Av. Próceres", district: "San Juan de Lurigancho", lat: -11.993, lng: -77.006, pollution_profile: 1.9, is_online: true, installed_at: "2026-09-10" },
  { id: 6, code: "AER-06", name: "Pentagonito", district: "San Borja", lat: -12.099, lng: -76.999, pollution_profile: 1.1, is_online: true, installed_at: "2026-09-12" },
];

const FIELD: Record<MetricCode, keyof Reading> = {
  pm25: "pm25",
  pm10: "pm10",
  co2: "co2",
  co: "co",
  temp: "temperature",
  hum: "humidity",
};

export function valueOf(reading: Reading, code: MetricCode): number {
  return reading[FIELD[code]] as number;
}

/** Índice de Calidad del Aire (0–300) a partir de PM2.5, con los mismos cortes del semáforo. */
export function aqiFromPm25(pm25: number): number {
  let aqi: number;
  if (pm25 <= 15) aqi = (pm25 / 15) * 50;
  else if (pm25 <= 50) aqi = 50 + ((pm25 - 15) / 35) * 50;
  else aqi = 100 + ((pm25 - 50) / 75) * 50;
  return Math.min(300, Math.round(aqi));
}

export function levelFor(metric: Metric, value: number): Level | null {
  if (!metric.affects_level || metric.good_max == null || metric.moderate_max == null) return null;
  if (value > metric.moderate_max) return "rojo";
  if (value > metric.good_max) return "amarillo";
  return "verde";
}

export function worst(a: Level, b: Level): Level {
  return LEVEL_ORDER.indexOf(a) >= LEVEL_ORDER.indexOf(b) ? a : b;
}

/** Nivel del semáforo = el peor nivel entre los contaminantes. */
export function overallLevel(reading: Omit<Reading, "level" | "aqi">, metrics: Metric[]): { level: Level; driver: MetricCode } {
  let level: Level = "verde";
  let driver: MetricCode = "pm25";
  let maxRatio = -1;
  for (const m of metrics) {
    const v = valueOf(reading as Reading, m.code);
    const l = levelFor(m, v);
    if (!l || m.good_max == null) continue;
    const ratio = v / m.good_max;
    if (LEVEL_ORDER.indexOf(l) > LEVEL_ORDER.indexOf(level) || (l === level && ratio > maxRatio)) {
      level = worst(level, l);
      driver = m.code;
      maxRatio = ratio;
    }
  }
  return { level, driver };
}

export function formatValue(code: MetricCode, v: number): string {
  if (code === "co") return v.toFixed(2);
  if (code === "co2") return Math.round(v).toString();
  return v.toFixed(1);
}

export const timeFmt = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Lima",
});

export const timeSecFmt = new Intl.DateTimeFormat("es-PE", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  timeZone: "America/Lima",
});
