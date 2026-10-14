create extension if not exists pg_cron;

-- Simula que cada Aeróforo envía una lectura (como lo haría el ESP32).
-- Con hardware real, este cron se elimina y el ESP32 inserta en `readings`.
create or replace function public.simulate_sensor_tick()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s record;
  prev record;
  h double precision;
  rush double precision;
  daily double precision;
  v_pm25 real; v_pm10 real; v_co2 real; v_co real; v_temp real; v_hum real;
  v_aqi smallint; v_level text;
begin
  h := extract(hour from now() at time zone 'America/Lima') + extract(minute from now() at time zone 'America/Lima') / 60.0;
  rush := exp(-power(h - 8, 2) / 2.0) + 0.9 * exp(-power(h - 19, 2) / 2.5);
  daily := sin((h - 9) / 24 * 2 * pi());

  for s in select * from stations where is_online loop
    select * into prev from readings where station_id = s.id order by recorded_at desc limit 1;

    v_pm25 := greatest(2, (6 + 16 * rush) * s.pollution_profile + (random() - 0.5) * 6
               + case when random() < 0.04 * s.pollution_profile then random() * 30 * s.pollution_profile else 0 end);
    v_pm10 := greatest(4, v_pm25 * (1.7 + random() * 0.4));
    v_co2 := greatest(410, 430 + (180 + 420 * rush) * s.pollution_profile * 0.6 + (random() - 0.5) * 60);
    v_co := greatest(0.2, (0.8 + 3.2 * rush) * s.pollution_profile * 0.8 + (random() - 0.5) * 0.6);
    v_temp := 17 + 4 * daily + (random() - 0.5);
    v_hum := least(99, greatest(30, 78 - 9 * daily + (random() - 0.5) * 4));

    v_aqi := least(300, round(case when v_pm25 <= 15 then v_pm25 / 15 * 50
                                   when v_pm25 <= 50 then 50 + (v_pm25 - 15) / 35 * 50
                                   else 100 + (v_pm25 - 50) / 75 * 50 end));
    v_level := case when v_pm25 > 50 or v_pm10 > 100 or v_co2 > 1200 or v_co > 9 then 'rojo'
                    when v_pm25 > 15 or v_pm10 > 45 or v_co2 > 800 or v_co > 4.4 then 'amarillo'
                    else 'verde' end;

    insert into readings (station_id, recorded_at, pm25, pm10, co2, co, temperature, humidity, aqi, level)
    values (s.id, now(), round(v_pm25::numeric, 1), round(v_pm10::numeric, 1), round(v_co2::numeric), round(v_co::numeric, 2),
            round(v_temp::numeric, 1), round(v_hum::numeric, 1), v_aqi, v_level);

    if prev is not null and prev.level <> v_level then
      insert into alerts (station_id, created_at, level, metric, value, message)
      values (s.id, now(), v_level, 'pm25', round(v_pm25::numeric, 1),
        case v_level
          when 'rojo' then 'Calidad del aire dañina: evita actividades al aire libre.'
          when 'amarillo' then 'Calidad del aire moderada: grupos sensibles deben tomar precauciones.'
          else 'La calidad del aire volvió a niveles buenos.' end);
    end if;
  end loop;

  -- Mantener solo 3 días de historial
  delete from readings where recorded_at < now() - interval '3 days';
  delete from alerts where created_at < now() - interval '3 days';
end;
$$;

revoke all on function public.simulate_sensor_tick() from public, anon, authenticated;

-- Cada 5 minutos
select cron.schedule('aeroforo-sensor-tick', '*/5 * * * *', $$select public.simulate_sensor_tick()$$);
