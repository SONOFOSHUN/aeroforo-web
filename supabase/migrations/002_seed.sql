-- Estaciones, métricas (con límites del semáforo) y 24 h de lecturas simuladas
insert into public.stations (id, code, name, district, lat, lng, pollution_profile, installed_at) values
 (1, 'AER-01', 'Tecsup', 'Santa Anita', -12.0453, -76.9712, 1.5, '2026-09-01'),
 (2, 'AER-02', 'Parque Kennedy', 'Miraflores', -12.1219, -77.0300, 0.9, '2026-09-03'),
 (3, 'AER-03', 'Plaza Dos de Mayo', 'Cercado de Lima', -12.0464, -77.0428, 2.1, '2026-09-05'),
 (4, 'AER-04', 'Carretera Central', 'Ate', -12.0262, -76.9180, 2.6, '2026-09-08'),
 (5, 'AER-05', 'Av. Próceres', 'San Juan de Lurigancho', -11.9930, -77.0060, 1.9, '2026-09-10'),
 (6, 'AER-06', 'Pentagonito', 'San Borja', -12.0990, -76.9990, 1.1, '2026-09-12');

insert into public.metrics (code, name, unit, sensor_model, description, good_max, moderate_max, affects_level, sort_order) values
 ('pm25', 'PM2.5', 'µg/m³', 'Plantower PMS5003', 'Partículas finas que llegan a los pulmones y al torrente sanguíneo.', 15, 50, true, 1),
 ('pm10', 'PM10', 'µg/m³', 'Plantower PMS5003', 'Polvo y partículas gruesas de construcción y tránsito.', 45, 100, true, 2),
 ('co2', 'CO₂', 'ppm', 'Sensirion SCD40', 'Dióxido de carbono: indica ventilación y combustión.', 800, 1200, true, 3),
 ('co', 'CO', 'ppm', 'Winsen MQ-7', 'Monóxido de carbono de los escapes de vehículos.', 4.4, 9, true, 4),
 ('temp', 'Temperatura', '°C', 'Bosch BME280', 'Temperatura ambiente del punto de medición.', null, null, false, 5),
 ('hum', 'Humedad', '%', 'Bosch BME280', 'Humedad relativa: influye en la lectura de partículas.', null, null, false, 6);

-- 24 h de lecturas cada 10 minutos por estación
with ticks as (
  select s.id as station_id, s.pollution_profile as p, t as recorded_at,
         extract(hour from t at time zone 'America/Lima') + extract(minute from t at time zone 'America/Lima')/60.0 as h
  from public.stations s,
       generate_series(date_trunc('minute', now()) - interval '24 hours', date_trunc('minute', now()), interval '10 minutes') t
), raw as (
  select station_id, recorded_at, h, p,
    -- picos de tránsito: 7–9 h y 18–20 h
    (exp(-power(h - 8, 2) / 2.0) + 0.9 * exp(-power(h - 19, 2) / 2.5)) as rush,
    random() as r1, random() as r2, random() as r3
  from ticks
), vals as (
  select station_id, recorded_at,
    greatest(2, (6 + 16 * rush) * p + (r1 - 0.5) * 6) as pm25,
    greatest(410, 430 + (180 + 420 * rush) * p * 0.6 + (r2 - 0.5) * 60) as co2,
    greatest(0.2, (0.8 + 3.2 * rush) * p * 0.8 + (r3 - 0.5) * 0.6) as co,
    17 + 4 * sin((h - 9) / 24 * 2 * pi()) + (r1 - 0.5) as temperature,
    78 - 9 * sin((h - 9) / 24 * 2 * pi()) + (r2 - 0.5) * 4 as humidity
  from raw
), scored as (
  select *,
    pm25 * (1.7 + (random() * 0.4)) as pm10v,
    least(300, case when pm25 <= 15 then pm25 / 15 * 50
                    when pm25 <= 50 then 50 + (pm25 - 15) / 35 * 50
                    else 100 + (pm25 - 50) / 75 * 50 end) as aqi
  from vals
)
insert into public.readings (station_id, recorded_at, pm25, pm10, co2, co, temperature, humidity, aqi, level)
select station_id, recorded_at, round(pm25::numeric, 1), round(pm10v::numeric, 1), round(co2::numeric), round(co::numeric, 2),
       round(temperature::numeric, 1), round(humidity::numeric, 1), round(aqi),
       case when pm25 > 50 or pm10v > 100 or co2 > 1200 or co > 9 then 'rojo'
            when pm25 > 15 or pm10v > 45 or co2 > 800 or co > 4.4 then 'amarillo'
            else 'verde' end
from scored;

-- Alertas: cada vez que una estación cambia de nivel
insert into public.alerts (station_id, created_at, level, metric, value, message)
select station_id, recorded_at, level, 'pm25', pm25,
  case level
    when 'rojo' then 'Calidad del aire dañina: evita actividades al aire libre.'
    when 'amarillo' then 'Calidad del aire moderada: grupos sensibles deben tomar precauciones.'
    else 'La calidad del aire volvió a niveles buenos.' end
from (
  select *, lag(level) over (partition by station_id order by recorded_at) as prev
  from public.readings
) x
where prev is not null and prev <> level;
