"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, ZONES } from "@/lib/air";

// Límites de Lima Metropolitana (de Ancón a Pucusana, del litoral a Chaclacayo)
const LIMA_BOUNDS: [[number, number], [number, number]] = [
  [-12.53, -77.2],
  [-11.56, -76.62],
];

export function StationsMap() {
  const { stations, latest, selectedId, select } = useAir();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<number, Marker>());
  const selectRef = useRef(select);

  useEffect(() => {
    selectRef.current = select;
  }, [select]);

  // Crear el mapa una sola vez (Leaflet solo funciona en el navegador)
  useEffect(() => {
    let cancelled = false;
    const markerMap = markers.current;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || map.current) return;
      const m = L.map(el.current, {
        maxBounds: LIMA_BOUNDS,
        maxBoundsViscosity: 0.8,
        minZoom: 10,
        maxZoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });
      L.control.zoom({ position: "bottomright" }).addTo(m);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m);
      m.fitBounds(
        L.latLngBounds(stations.map((s) => [s.lat, s.lng] as [number, number])),
        { padding: [28, 28] },
      );
      for (const s of stations) {
        const marker = L.marker([s.lat, s.lng], {
          icon: L.divIcon({ className: "aer-marker", html: "<span></span>", iconSize: [26, 26] }),
          keyboard: true,
          title: `${s.district} · ${s.name}`,
        })
          .bindTooltip(s.district, { direction: "top", offset: [0, -12], className: "aer-tip" })
          .on("click", () => selectRef.current(s.id))
          .addTo(m);
        markerMap.set(s.id, marker);
      }
      map.current = m;
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      markerMap.clear();
    };
    // Las estaciones se cargan una vez; solo cambia su color.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations.length]);

  // Pintar cada marcador con el color de su semáforo
  useEffect(() => {
    for (const s of stations) {
      const node = markers.current.get(s.id)?.getElement();
      if (!node) continue;
      const l = latest(s.id)?.level;
      node.dataset.active = String(s.id === selectedId);
      const dot = node.querySelector("span");
      if (dot) dot.style.backgroundColor = l ? LEVELS[l].color : "#9aa0a9";
    }
  });

  return (
    <section id="estaciones" className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-20 sm:px-6">
      <p className="eyebrow">Red de estaciones</p>
      <h2 className="heading mt-3 text-3xl font-semibold sm:text-[40px]">Lima Metropolitana, punto por punto</h2>
      <p className="mt-3 max-w-xl text-muted">
        {stations.length} Aeróforos repartidos en las cinco zonas de Lima Metropolitana. Toca uno en el mapa o en la lista para verlo en el
        monitor.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="card relative overflow-hidden p-0">
          <div ref={el} className="h-[420px] w-full sm:h-[560px]" role="region" aria-label="Mapa de estaciones en Lima Metropolitana" />
          <div className="pointer-events-none absolute left-3 top-3 z-[400] flex flex-wrap gap-1.5">
            {(["verde", "amarillo", "rojo"] as const).map((l) => (
              <span key={l} className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium shadow-sm backdrop-blur">
                <span className="h-2 w-2 rounded-full" style={{ background: LEVELS[l].color }} />
                {LEVELS[l].label}
              </span>
            ))}
          </div>
        </div>

        <div className="card max-h-[560px] overflow-y-auto p-2">
          {ZONES.map((z) => (
            <div key={z} className="py-1">
              <p className="eyebrow px-3 pb-1 pt-2">{z}</p>
              <ul>
                {stations
                  .filter((s) => s.zone === z)
                  .map((s) => {
                    const r = latest(s.id);
                    const on = s.id === selectedId;
                    return (
                      <li key={s.id}>
                        <button
                          onClick={() => select(s.id)}
                          aria-pressed={on}
                          className={`pressable flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left ${on ? "bg-black/[0.05]" : "hover:bg-black/[0.03]"}`}
                        >
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: r ? LEVELS[r.level].color : "var(--faint)" }} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium">{s.district}</span>
                            <span className="block truncate text-[12px] text-muted">{s.name}</span>
                          </span>
                          <span className="text-right">
                            <span className="block text-[17px] font-semibold tabular">{r?.aqi ?? "—"}</span>
                            <span className="block text-[10px] text-faint">ICA</span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
