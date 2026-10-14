"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LEVELS, formatValue, timeFmt, timeSecFmt, valueOf } from "@/lib/air";
import type { Metric, Reading } from "@/lib/types";

export function TrendChart({ metric, readings, live }: { metric: Metric; readings: Reading[]; live: boolean }) {
  const data = readings.map((r) => ({ t: new Date(r.recorded_at).getTime(), v: valueOf(r, metric.code) }));
  const fmt = live ? timeSecFmt : timeFmt;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="trend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#22d3ee" stopOpacity={0.35} />
              <stop offset="1" stopColor="#22d3ee" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickFormatter={(t) => fmt.format(new Date(t))}
            stroke="#8b9ab3"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={40}
          />
          <YAxis stroke="#8b9ab3" fontSize={11} tickLine={false} axisLine={false} width={48} domain={["auto", "auto"]} />
          <Tooltip
            contentStyle={{ background: "#0c1322", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 12, fontSize: 12 }}
            labelFormatter={(t) => timeSecFmt.format(new Date(Number(t)))}
            formatter={(v) => [`${formatValue(metric.code, Number(v))} ${metric.unit}`, metric.name]}
          />
          {metric.good_max != null && (
            <ReferenceLine y={metric.good_max} stroke={LEVELS.amarillo.color} strokeDasharray="4 4" ifOverflow="extendDomain"
              label={{ value: "Moderado", position: "insideTopRight", fill: LEVELS.amarillo.color, fontSize: 10 }} />
          )}
          {metric.moderate_max != null && (
            <ReferenceLine y={metric.moderate_max} stroke={LEVELS.rojo.color} strokeDasharray="4 4"
              label={{ value: "Dañino", position: "insideTopRight", fill: LEVELS.rojo.color, fontSize: 10 }} />
          )}
          <Area type="monotone" dataKey="v" stroke="#22d3ee" strokeWidth={2} fill="url(#trend)" isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
