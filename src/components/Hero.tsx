"use client";

import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, formatValue, overallLevel, timeSecFmt, valueOf } from "@/lib/air";
import { ParticleField } from "./ParticleField";
import { Semaforo } from "./Semaforo";

export function Hero() {
  const { stations, metrics, selectedId, latest, ready } = useAir();
  const [videoOk, setVideoOk] = useState(false);
  const station = stations.find((s) => s.id === selectedId) ?? stations[0];
  const r = latest(station.id);
  const level = r?.level ?? null;
  const color = level ? LEVELS[level].color : "#22d3ee";
  const driver = r ? overallLevel(r, metrics).driver : "pm25";
  const driverMetric = metrics.find((m) => m.code === driver);

  return (
    <section id="inicio" className="relative overflow-hidden pt-16">
      {/* Video de fondo opcional: coloca public/media/hero.mp4 (generado en Higgsfield) */}
      <video
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoOk ? "opacity-35" : "opacity-0"}`}
        src="/media/hero.mp4"
        autoPlay
        muted
        loop
        playsInline
        onLoadedData={() => setVideoOk(true)}
        aria-hidden
      />
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div
        className="absolute inset-0 transition-[background] duration-1000"
        style={{ background: `radial-gradient(60% 60% at 75% 40%, ${color}22, transparent 70%)` }}
      />
      <ParticleField color={color} />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-bg" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 sm:px-6 md:py-28 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-surface/70 px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Proyecto de innovación · Tecsup 2026
          </p>
          <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            El aire que respiras,
            <br />
            <span className="bg-gradient-to-r from-green via-amber to-red bg-clip-text text-transparent">
              en un semáforo.
            </span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Aeróforo mide PM2.5, PM10, CO₂ y monóxido de carbono cada pocos segundos y lo traduce en verde, amarillo o
            rojo. Así cualquier persona sabe, de un vistazo, si es seguro estar al aire libre.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#monitor"
              className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 font-medium text-bg transition hover:brightness-110"
            >
              Ver monitor en vivo <ArrowRight size={18} />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface/60 px-5 py-3 font-medium transition hover:border-accent/40"
            >
              Cómo funciona
            </a>
          </div>
          <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-line pt-6">
            {[
              [String(stations.length), "estaciones en Lima"],
              ["4", "contaminantes medidos"],
              ["3 s", "entre lecturas"],
            ].map(([n, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-mono text-2xl font-semibold">{n}</dd>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="card relative mx-auto w-full max-w-sm p-6 backdrop-blur">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">Estación {station.code}</p>
              <p className="mt-1 flex items-center gap-1.5 font-medium">
                <MapPin size={14} className="text-accent" />
                {station.name}, {station.district}
              </p>
            </div>
            <span className="font-mono text-xs text-muted">{r ? timeSecFmt.format(new Date(r.recorded_at)) : "--:--"}</span>
          </div>
          <div className="mt-6 flex items-center gap-8">
            <Semaforo level={level} size="lg" />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted">ICA</p>
              <p className="font-mono text-6xl font-semibold tabular-nums" style={{ color }}>
                {ready && r ? r.aqi : "—"}
              </p>
              <p className="mt-1 text-lg font-medium" style={{ color }}>
                {level ? LEVELS[level].label : "Conectando…"}
              </p>
              {r && driverMetric && (
                <p className="mt-3 text-sm text-muted">
                  Principal: <span className="text-text">{driverMetric.name}</span>{" "}
                  <span className="font-mono">
                    {formatValue(driver, valueOf(r, driver))} {driverMetric.unit}
                  </span>
                </p>
              )}
            </div>
          </div>
          {level && <p className="mt-6 rounded-xl p-3 text-sm" style={{ background: LEVELS[level].soft }}>{LEVELS[level].advice}</p>}
        </div>
      </div>
    </section>
  );
}
