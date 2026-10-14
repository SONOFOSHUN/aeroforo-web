-- Aeróforo: esquema de monitoreo de calidad del aire (datos simulados)
create table public.stations (
  id smallint primary key,
  code text not null unique,
  name text not null,
  district text not null,
  lat double precision not null,
  lng double precision not null,
  pollution_profile real not null default 1, -- 1 = limpio, 3 = muy contaminado (solo para simular)
  is_online boolean not null default true,
  installed_at date not null default current_date
);

create table public.metrics (
  code text primary key,          -- pm25, pm10, co2, co, temp, hum
  name text not null,
  unit text not null,
  sensor_model text not null,
  description text not null,
  good_max real,                  -- límite verde
  moderate_max real,              -- límite amarillo (por encima = rojo)
  affects_level boolean not null default true,
  sort_order smallint not null
);

create table public.readings (
  id bigint generated always as identity primary key,
  station_id smallint not null references public.stations(id) on delete cascade,
  recorded_at timestamptz not null,
  pm25 real not null,
  pm10 real not null,
  co2 real not null,
  co real not null,
  temperature real not null,
  humidity real not null,
  aqi smallint not null,
  level text not null check (level in ('verde','amarillo','rojo'))
);
create index readings_station_time_idx on public.readings (station_id, recorded_at desc);

create table public.alerts (
  id bigint generated always as identity primary key,
  station_id smallint not null references public.stations(id) on delete cascade,
  created_at timestamptz not null,
  level text not null check (level in ('verde','amarillo','rojo')),
  metric text not null references public.metrics(code),
  value real not null,
  message text not null
);
create index alerts_station_time_idx on public.alerts (station_id, created_at desc);

-- Solo lectura pública (el frontend usa la clave publicable)
alter table public.stations enable row level security;
alter table public.metrics enable row level security;
alter table public.readings enable row level security;
alter table public.alerts enable row level security;

create policy "lectura publica stations" on public.stations for select to anon, authenticated using (true);
create policy "lectura publica metrics" on public.metrics for select to anon, authenticated using (true);
create policy "lectura publica readings" on public.readings for select to anon, authenticated using (true);
create policy "lectura publica alerts" on public.alerts for select to anon, authenticated using (true);
