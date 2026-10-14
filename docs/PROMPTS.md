# Prompts del proyecto Aeróforo

## 1. Prompt maestro (aterrizado) para la web

> Úsalo para retomar o ampliar la web con cualquier asistente de IA.

```
Actúa como desarrollador web senior y diseñador UI/UX.

PROYECTO
Aeróforo: dispositivo de monitoreo de calidad del aire (Equipo 1, curso Investigación e Innovación
Tecnológica, Tecsup). Mide PM2.5, PM10, CO₂, CO, temperatura y humedad, y muestra el resultado en un
semáforo de 3 niveles: verde (Bueno, ICA 0–50), amarillo (Moderado, ICA 51–100) y rojo (Dañino, ICA > 100).
El semáforo toma el PEOR nivel entre los contaminantes.
Límites: PM2.5 15/50 µg/m³ · PM10 45/100 µg/m³ · CO₂ 800/1200 ppm · CO 4.4/9 ppm (verde ≤ 1.º, rojo > 2.º).
El prototipo físico es una maqueta de cartón: NO hay hardware conectado.

OBJETIVO
Una Home Page (no solo landing) que funcione como si leyera los sensores en tiempo real:
lo que se evalúa es que el sistema se vea y se comporte correctamente, con datos ficticios realistas.

SECCIONES
1. Hero: titular, estado actual del semáforo de la estación seleccionada, ICA y contaminante principal.
2. Monitor en vivo: selector de estación, semáforo + medidor ICA, 6 tarjetas de sensores con mini-gráfica
   y tendencia, gráfica (en vivo / 24 h) con líneas de límite, feed de alertas, botón "Simular pico".
3. Mapa de estaciones (6 en Lima) coloreadas por nivel.
4. Explicación del semáforo con límites por contaminante y recomendaciones.
5. Cómo funciona: sensores → ESP32 → nube (Supabase) → semáforo y web.
6. Equipo y curso.

DATOS
- Supabase: tablas stations, metrics, readings, alerts con RLS de solo lectura.
  pg_cron inserta una lectura simulada por estación cada 5 min.
- Frontend: carga 24 h de historial y simula nuevas lecturas cada 3 s (random walk con horas punta 8 h y 19 h
  y picos de contaminación ocasionales). Si Supabase no responde, genera los datos localmente.

STACK
Next.js (App Router) + TypeScript + Tailwind + Recharts + @supabase/supabase-js. Despliegue en Vercel.

DISEÑO
Tema oscuro tecnológico. Paleta: fondo #060A13, acento cian #22D3EE, verde #22C55E, ámbar #F59E0B,
rojo #EF4444. Tipografía Geist. Responsive (desde 375 px), accesible, sin scroll horizontal.
```

## 2. Prompt para ChatGPT conectado a Higgsfield

> Pega esto en ChatGPT con el conector o la app de Higgsfield activado. ChatGPT redactará y lanzará cada generación.

```
Eres el director de arte del proyecto Aeróforo, un dispositivo que mide la calidad del aire en Lima y la
muestra en un semáforo verde, amarillo y rojo. Usa Higgsfield para generar los assets de su página web.

Estilo obligatorio para todos los assets:
- Fotorrealista, look de comercial de tecnología, tema oscuro.
- Paleta: grafito #0F172A, cian #22D3EE y acentos del semáforo (#22C55E, #F59E0B, #EF4444).
- Sin texto, sin números, sin logos, sin marcas de agua (los datos los pone la web).
- Dejar el tercio izquierdo con espacio negativo para titulares.
- Escenarios de Lima: cielo gris costero, avenidas con tránsito, parques; nada genérico de EE. UU.

Genera, en este orden, y muéstrame cada resultado antes de seguir:
1. VIDEO HERO (16:9, 8–10 s, loop, sin audio): estación de monitoreo blanca y moderna con cabezal de
   semáforo en primer plano, avenida de Lima en hora azul con neblina y partículas visibles en la luz.
   Cámara: dolly out lento y estable. Lente 35 mm anamórfico.
2. VIDEO MACRO (16:9, 5–6 s): sensor láser de partículas sobre placa electrónica oscura; un haz cian
   cruza la cámara de aire y las partículas PM2.5 brillan al atravesarlo. Cámara: órbita lenta de 90°,
   lente macro 100 mm, rack focus.
3. IMAGEN SEMÁFORO (16:9 y 4:5): el dispositivo en un parque de Lima al atardecer con la luz ÁMBAR
   encendida y halo cálido. Lente 50 mm f/2, sujeto en el tercio derecho.
4. IMAGEN OG (1200×630): el semáforo de tres luces en fondo grafito con la luz VERDE encendida.

Si un resultado incluye texto, números o logos, vuelve a generarlo agregando
"no text, no numbers, no UI labels". Escribe los prompts para Higgsfield en inglés.
Al final dame una lista con cada archivo, su uso en la web y el nombre sugerido:
hero.mp4, sensor-macro.mp4, semaforo.jpg, og.jpg.
```

**Dónde poner los archivos:** cópialos a `public/media/`. El `hero.mp4` se activa solo como fondo del Hero (exporta en 1080p, MP4, menos de 4 MB, sin audio).
