"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { useAir } from "@/hooks/useAirData";
import { LEVELS, timeFmt } from "@/lib/air";

export function AlertFeed() {
  const { alerts, stations, selectedId } = useAir();
  const [onlyStation, setOnlyStation] = useState(false);
  const list = (onlyStation ? alerts.filter((a) => a.station_id === selectedId) : alerts).slice(0, 25);
  const name = (id: number) => stations.find((s) => s.id === id)?.district ?? `Estación ${id}`;

  return (
    <div className="card flex max-h-[420px] flex-col p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-medium">
          <Bell size={16} className="text-accent" /> Alertas
        </h3>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
          <input type="checkbox" checked={onlyStation} onChange={(e) => setOnlyStation(e.target.checked)} className="accent-[var(--accent)]" />
          Solo esta estación
        </label>
      </div>
      <ul className="-mr-2 flex-1 space-y-2 overflow-y-auto pr-2" aria-live="polite">
        {list.length === 0 && <li className="py-8 text-center text-sm text-muted">Sin alertas por ahora.</li>}
        {list.map((a) => (
          <li key={a.id} className="flex gap-3 rounded-xl border border-line bg-bg/40 p-3">
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: LEVELS[a.level].color, boxShadow: `0 0 10px ${LEVELS[a.level].color}` }} />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs text-muted">
                <span className="font-medium text-text">{name(a.station_id)}</span>
                <span>·</span>
                <span className="font-mono">{timeFmt.format(new Date(a.created_at))}</span>
                <span className="ml-auto font-semibold" style={{ color: LEVELS[a.level].color }}>
                  {LEVELS[a.level].label}
                </span>
              </p>
              <p className="mt-1 text-sm leading-snug">{a.message}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
