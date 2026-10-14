import { Cloud, Cpu, Gauge, MonitorSmartphone, Radio } from "lucide-react";
import { DEFAULT_METRICS, LEVELS, LEVEL_ORDER } from "@/lib/air";
import { Semaforo } from "./Semaforo";

export function Levels() {
  const pollutants = DEFAULT_METRICS.filter((m) => m.affects_level);
  return (
    <section id="niveles" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">El semáforo</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Tres colores, una decisión</h2>
      <p className="mt-3 max-w-2xl text-muted">
        El semáforo toma el peor nivel entre todos los contaminantes. Basta con que uno supere su límite para que cambie
        de color.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {LEVEL_ORDER.map((l, i) => (
          <article key={l} className="card p-6" style={{ borderColor: `${LEVELS[l].color}40` }}>
            <div className="flex items-center gap-4">
              <Semaforo level={l} size="sm" />
              <div>
                <p className="text-xl font-semibold" style={{ color: LEVELS[l].color }}>
                  {LEVELS[l].label}
                </p>
                <p className="font-mono text-xs text-muted">{LEVELS[l].range}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted">{LEVELS[l].detail}</p>
            <p className="mt-3 text-sm leading-relaxed">{LEVELS[l].advice}</p>
            <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-xs">
              {pollutants.map((m) => (
                <div key={m.code} className="flex justify-between gap-2">
                  <dt className="text-muted">{m.name}</dt>
                  <dd className="font-mono">
                    {i === 0 && `≤ ${m.good_max}`}
                    {i === 1 && `${m.good_max}–${m.moderate_max}`}
                    {i === 2 && `> ${m.moderate_max}`}
                  </dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted">
        Límites de referencia basados en las guías de la OMS y el Estándar de Calidad Ambiental (ECA) para aire del Perú.
        PM en µg/m³; CO₂ y CO en ppm.
      </p>
    </section>
  );
}

const STEPS = [
  { icon: Radio, title: "1. Sensores", text: "Un sensor láser cuenta las partículas PM2.5 y PM10. Otros sensores miden CO₂, CO, temperatura y humedad." },
  { icon: Cpu, title: "2. Microcontrolador", text: "Un ESP32 lee los sensores, calcula el índice de calidad del aire y decide el color del semáforo." },
  { icon: Cloud, title: "3. Nube", text: "Las lecturas se envían por Wi-Fi a una base de datos en Supabase y quedan en el historial." },
  { icon: MonitorSmartphone, title: "4. Semáforo y web", text: "El cabezal enciende la luz del nivel y esta web muestra los datos y las alertas en tiempo real." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="relative scroll-mt-20 border-y border-line bg-surface/40">
      <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-accent">Cómo funciona</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Del aire a tu pantalla</h2>
        <ol className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent">
                <Icon size={22} />
              </span>
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="card p-6">
            <h3 className="flex items-center gap-2 font-semibold">
              <Gauge size={18} className="text-accent" /> Sensores del dispositivo
            </h3>
            <ul className="mt-4 divide-y divide-line text-sm">
              {DEFAULT_METRICS.map((m) => (
                <li key={m.code} className="flex justify-between gap-4 py-2.5">
                  <span>{m.name}</span>
                  <span className="text-right text-muted">{m.sensor_model}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold">Estado del prototipo</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              En esta etapa, Aeróforo es una maqueta física (base, columna, cabezal con semáforo y módulo central) y esta
              plataforma web. Las lecturas en pantalla son <span className="text-text">simuladas</span>: siguen el ritmo
              real de Lima, con picos de tránsito a las 8 h y a las 19 h, para mostrar cómo respondería el sistema con
              sensores reales.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              La base de datos y la web ya tienen la estructura final. Para conectar el hardware, el ESP32 solo tendría
              que escribir sus lecturas en la tabla <code className="rounded bg-bg px-1.5 py-0.5 font-mono text-xs text-accent">readings</code>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const TEAM = [
  { name: "José Barzola Veliz", role: "Estructura y ensamble" },
  { name: "Grecia Huanco", role: "Planos, materiales y documentación" },
  { name: "Alexander Faustino", role: "Planificación y Gantt" },
  { name: "Willar", role: "Interfaz y semáforo" },
  { name: "Mijael Lino", role: "Prototipo interactivo y pruebas" },
];

export function Team() {
  return (
    <section id="equipo" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-widest text-accent">Equipo 1</p>
      <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Quiénes lo construyen</h2>
      <p className="mt-3 max-w-2xl text-muted">
        Curso Investigación e Innovación Tecnológica · Docente María Ángela Mejía León · Tecsup.
      </p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TEAM.map((m) => (
          <li key={m.name} className="card p-5">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-green/20 font-semibold">
              {m.name
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </span>
            <p className="mt-4 font-medium">{m.name}</p>
            <p className="mt-1 text-sm text-muted">{m.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 Aeróforo · Proyecto de innovación, Tecsup</p>
        <p>Prototipo con datos simulados con fines académicos.</p>
      </div>
    </footer>
  );
}
