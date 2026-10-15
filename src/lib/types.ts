export type Level = "verde" | "amarillo" | "rojo";

export type Zone = "Lima Norte" | "Lima Este" | "Lima Centro" | "Lima Moderna" | "Lima Sur";

export type MetricCode = "pm25" | "pm10" | "co2" | "co" | "temp" | "hum";

export interface Station {
  id: number;
  code: string;
  name: string;
  district: string;
  zone: Zone;
  lat: number;
  lng: number;
  pollution_profile: number;
  is_online: boolean;
  installed_at: string;
}

export interface Metric {
  code: MetricCode;
  name: string;
  unit: string;
  sensor_model: string;
  description: string;
  good_max: number | null;
  moderate_max: number | null;
  affects_level: boolean;
  sort_order: number;
}

export interface Reading {
  station_id: number;
  recorded_at: string;
  pm25: number;
  pm10: number;
  co2: number;
  co: number;
  temperature: number;
  humidity: number;
  aqi: number;
  level: Level;
}

export interface Alert {
  id: number | string;
  station_id: number;
  created_at: string;
  level: Level;
  metric: MetricCode;
  value: number;
  message: string;
}

export type DataSource = "supabase" | "local";
