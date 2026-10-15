-- Red exclusivamente en Lima Metropolitana (sin Callao), agrupada por zonas
alter table public.stations add column zone text not null default 'Lima Centro'
  check (zone in ('Lima Norte','Lima Este','Lima Centro','Lima Moderna','Lima Sur'));

update public.stations set zone = 'Lima Este' where id in (1, 4, 5);
update public.stations set zone = 'Lima Moderna' where id in (2, 6);
update public.stations set zone = 'Lima Centro' where id = 3;

insert into public.stations (id, code, name, district, zone, lat, lng, pollution_profile, installed_at) values
 (7, 'AER-07', 'Av. Túpac Amaru', 'Comas', 'Lima Norte', -11.9372, -77.0596, 2.0, '2026-09-15'),
 (8, 'AER-08', 'Plaza de Armas', 'Los Olivos', 'Lima Norte', -11.9920, -77.0705, 1.6, '2026-09-15'),
 (9, 'AER-09', 'Parque Industrial', 'Villa El Salvador', 'Lima Sur', -12.2130, -76.9370, 1.8, '2026-09-18'),
 (10, 'AER-10', 'Av. Los Héroes', 'San Juan de Miraflores', 'Lima Sur', -12.1570, -76.9720, 1.7, '2026-09-18'),
 (11, 'AER-11', 'Campo de Marte', 'Jesús María', 'Lima Centro', -12.0700, -77.0440, 1.3, '2026-09-20'),
 (12, 'AER-12', 'Av. La Molina', 'La Molina', 'Lima Este', -12.0790, -76.9420, 0.8, '2026-09-20');

-- 24 h de historial para las estaciones nuevas (misma curva que 002_seed.sql)
with ticks as (
  select s.id as station_id, s.pollution_profile as p, t as recorded_at,
         extract(hour from t at time zone 'America/Lima') + extract(minute from t at time zone 'America/Lima')/60.0 as h
  from public.stations s,
       generate_series(date_trunc('minute', now()) - interval '24 hours', date_trunc('minute', now()) - interval '5 minutes', interval '10 minutes') t
  where s.id >= 7
), raw as (
  select station_id, recorded_at, h, p,
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
  select *, pm25 * (1.7 + (random() * 0.4)) as pm10v,
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
