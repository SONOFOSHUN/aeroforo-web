"use client";

import { ChevronDown, MapPin } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { ZONES } from "@/lib/air";
import { useFavorites } from "@/lib/favorites";

/** Selector nativo agrupado por zona de Lima Metropolitana (accesible y cómodo en móvil). */
export function StationSelect({ className = "" }: { className?: string }) {
  const { stations, selectedId, select } = useAir();
  const favorites = useFavorites();
  const favStations = stations.filter((s) => favorites.includes(s.id));
  return (
    <label className={`pressable relative inline-flex h-10 items-center rounded-full border border-line-strong bg-surface pl-3.5 pr-9 text-sm font-medium hover:bg-surface-2 ${className}`}>
      <MapPin size={15} className="mr-2 shrink-0 text-muted" />
      <span className="sr-only">Estación</span>
      <select
        value={selectedId}
        onChange={(e) => select(Number(e.target.value))}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {favStations.length > 0 && (
          <optgroup label="★ Mis distritos">
            {favStations.map((s) => (
              <option key={`fav-${s.id}`} value={s.id}>
                ★ {s.district} · {s.name}
              </option>
            ))}
          </optgroup>
        )}
        {ZONES.map((z) => (
          <optgroup key={z} label={z}>
            {stations
              .filter((s) => s.zone === z)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.district} · {s.name}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      <span className="truncate">{stations.find((s) => s.id === selectedId)?.district}</span>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 text-muted" />
    </label>
  );
}
