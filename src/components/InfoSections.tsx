import { BellRing, Cloud, Cpu, MonitorSmartphone, Radio } from "lucide-react";
import { DEFAULT_METRICS, LEVELS, LEVEL_ORDER, RECOMMENDATIONS } from "@/lib/air";
import { Semaforo } from "./Semaforo";

export function Levels() {
  const pollutants = DEFAULT_METRICS.filter((m) => m.affects_level);
  return (
    <section id="niveles" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="eyebrow">El semáforo</p>
      <h2 className="heading mt-3 text-3xl font-semibold sm:text-[40px]">Tres colores, una decisión</h2>
      <p className="mt-3 max-w-xl text-muted">
        El semáforo toma el peor nivel entre todos los contaminantes: basta con que uno supere su límite para que cambie de
        color. Cada cambio llega con un aviso y estas recomendaciones.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {LEVEL_ORDER.map((l, i) => (
          <article key={l} className="card flex flex-col overflow-hidden">
            <div className="flex items-center gap-4 p-6 pb-5" style={{ background: LEVELS[l].soft }}>
              <Semaforo level={l} size="sm" />
              <div>
                <p className="text-xl font-semibold tracking-tight" style={{ color: LEVELS[l].ink }}>
                  {LEVELS[l].label}
                </p>
                <p className="text-[13px] text-muted tabular">{LEVELS[l].range}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6 pt-5">
              <p className="text-sm leading-relaxed text-muted">{LEVELS[l].detail}</p>
              <p className="eyebrow mt-5">Qué hacer</p>
              <ul className="mt-2 space-y-2 text-sm">
                {RECOMMENDATIONS[l].map((t) => (
                  <li key={t} className="flex gap-2.5 leading-snug">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: LEVELS[l].color }} />
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-5" />
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-line pt-4 text-[12px]">
                {pollutants.map((m) => (
                  <div key={m.code} className="flex justify-between gap-2">
                    <dt className="text-muted">{m.name}</dt>
                    <dd className="font-medium tabular">
                      {i === 0 && `≤ ${m.good_max}`}
                      {i === 1 && `${m.good_max}–${m.moderate_max}`}
                      {i === 2 && `> ${m.moderate_max}`}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-4 text-xs text-faint">
        Límites de referencia basados en las guías de la OMS y el Estándar de Calidad Ambiental (ECA) para aire del Perú. PM en
        µg/m³; CO₂ y CO en ppm.
      </p>
    </section>
  );
}

const STEPS = [
  { icon: Radio, title: "Sensores", text: "Un sensor láser cuenta las partículas PM2.5 y PM10. Otros miden CO₂, CO, temperatura y humedad." },
  { icon: Cpu, title: "Microcontrolador", text: "Un ESP32 lee los sensores, calcula el índice de calidad del aire y decide el color del semáforo." },
  { icon: Cloud, title: "Nube", text: "Las lecturas viajan por Wi-Fi a una base de datos en Supabase y quedan en el historial." },
  { icon: MonitorSmartphone, title: "Semáforo y web", text: "El cabezal enciende la luz del nivel y esta web muestra los datos en tiempo real." },
  { icon: BellRing, title: "Aviso", text: "Si el color cambia, la web avisa al instante con recomendaciones para cuidar tu salud." },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-20 border-y border-line bg-surface">
      <div className="mx-auto w-full max-w-6xl px-4 py-20 sm:px-6">
        <p className="eyebrow">Cómo funciona</p>
        <h2 className="heading mt-3 text-3xl font-semibold sm:text-[40px]">Del aire a tu pantalla</h2>
        <ol className="mt-10 grid gap-px overflow-hidden rounded-[20px] border border-line bg-line sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="bg-surface p-6">
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-bg text-text">
                  <Icon size={19} strokeWidth={1.75} />
                </span>
                <span className="text-xs text-faint tabular">0{i + 1}</span>
              </div>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ol>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="rounded-[20px] border border-line bg-bg p-6">
            <h3 className="font-semibold">Sensores del dispositivo</h3>
            <ul className="mt-3 divide-y divide-line text-sm">
              {DEFAULT_METRICS.map((m) => (
                <li key={m.code} className="flex justify-between gap-4 py-2.5">
                  <span>{m.name}</span>
                  <span className="text-right text-muted">{m.sensor_model}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[20px] border border-line bg-bg p-6">
            <h3 className="font-semibold">Estado del prototipo</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              En esta etapa, Aeróforo es una maqueta física (base, columna, cabezal con semáforo y módulo central) y esta
              plataforma web. Las lecturas son <span className="font-medium text-text">simuladas</span>: siguen el ritmo
              real de Lima Metropolitana, con picos de tránsito a las 8 h y a las 19 h, para mostrar cómo respondería el
              sistema con sensores reales.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              La base de datos y la web ya tienen la estructura final: para conectar el hardware, el ESP32 solo tendría que
              escribir sus lecturas en la tabla <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs text-text">readings</code>.
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
  { name: "Guillermo Willard", role: "Interfaz y semáforo" },
  { name: "Mijael Lino", role: "Prototipo interactivo y pruebas" },
];

export function Team() {
  return (
    <section id="equipo" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="eyebrow">Equipo 1</p>
      <h2 className="heading mt-3 text-3xl font-semibold sm:text-[40px]">Quiénes lo construyen</h2>
      <p className="mt-3 max-w-xl text-muted">
        Curso Investigación e Innovación Tecnológica · Docente María Ángela Mejía León · Tecsup.
      </p>
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {TEAM.map((m) => (
          <li key={m.name} className="card p-5">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-ink text-sm font-semibold text-white">
              {m.name
                .split(" ")
                .slice(0, 2)
                .map((p) => p[0])
                .join("")}
            </span>
            <p className="mt-4 font-medium">{m.name}</p>
            <p className="mt-0.5 text-sm text-muted">{m.role}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© 2026 Aeróforo · Proyecto de innovación, Tecsup</p>
        <p>Prototipo académico con datos simulados · Lima Metropolitana</p>
      </div>
    </footer>
  );
}
