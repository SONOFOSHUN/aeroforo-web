"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LEVELS, formatValue, timeFmt, timeSecFmt, valueOf } from "@/lib/air";
import type { Metric, Reading } from "@/lib/types";

const LINE = "#0e1116";

export function TrendChart({ metric, readings, live }: { metric: Metric; readings: Reading[]; live: boolean }) {
  const data = readings.map((r) => ({ t: new Date(r.recorded_at).getTime(), v: valueOf(r, metric.code) }));
  const fmt = live ? timeSecFmt : timeFmt;
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="trend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={LINE} stopOpacity={0.12} />
              <stop offset="1" stopColor={LINE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(17,24,39,0.06)" vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickFormatter={(t) => fmt.format(new Date(t))}
            stroke="#9aa0a9"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
          />
          <YAxis stroke="#9aa0a9" fontSize={11} tickLine={false} axisLine={false} width={48} domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: "rgba(17,24,39,0.15)" }}
            contentStyle={{ background: "#fff", border: "1px solid rgba(17,24,39,0.08)", borderRadius: 12, fontSize: 12, boxShadow: "0 12px 32px -8px rgba(17,24,39,0.18)" }}
            labelFormatter={(t) => timeSecFmt.format(new Date(Number(t)))}
            formatter={(v) => [`${formatValue(metric.code, Number(v))} ${metric.unit}`, metric.name]}
          />
          {metric.good_max != null && (
            <ReferenceLine y={metric.good_max} stroke={LEVELS.amarillo.color} strokeDasharray="4 4" ifOverflow="extendDomain"
              label={{ value: "Moderado", position: "insideTopRight", fill: LEVELS.amarillo.ink, fontSize: 10 }} />
          )}
          {metric.moderate_max != null && (
            <ReferenceLine y={metric.moderate_max} stroke={LEVELS.rojo.color} strokeDasharray="4 4"
              label={{ value: "Dañino", position: "insideTopRight", fill: LEVELS.rojo.ink, fontSize: 10 }} />
          )}
          <Area type="monotone" dataKey="v" stroke={LINE} strokeWidth={1.75} fill="url(#trend)" isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
