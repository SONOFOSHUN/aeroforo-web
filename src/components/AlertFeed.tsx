"use client";

import { useState } from "react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, timeFmt } from "@/lib/air";

export function AlertFeed() {
  const { alerts, stations, selectedId } = useAir();
  const [onlyStation, setOnlyStation] = useState(false);
  const list = (onlyStation ? alerts.filter((a) => a.station_id === selectedId) : alerts).slice(0, 25);
  const name = (id: number) => stations.find((s) => s.id === id)?.district ?? `Estación ${id}`;

  return (
    <div className="card flex max-h-[420px] flex-col p-5 sm:p-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="font-semibold">Historial de alertas</h3>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={onlyStation} onChange={(e) => setOnlyStation(e.target.checked)} className="h-3.5 w-3.5 accent-[var(--ink)]" />
          Solo esta estación
        </label>
      </div>
      <ul className="-mx-2 flex-1 overflow-y-auto" aria-live="polite">
        {list.length === 0 && <li className="py-10 text-center text-sm text-muted">Sin alertas por ahora.</li>}
        {list.map((a) => (
          <li key={a.id} className="flex gap-3 rounded-xl px-2 py-2.5 hover:bg-black/[0.03]">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: LEVELS[a.level].color }} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2 text-[13px]">
                <span className="truncate font-medium">{name(a.station_id)}</span>
                <span className="ml-auto shrink-0 text-faint tabular">{timeFmt.format(new Date(a.created_at))}</span>
              </p>
              <p className="mt-0.5 text-[13px] leading-snug text-muted">{a.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
