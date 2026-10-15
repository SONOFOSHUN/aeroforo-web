"use client";

import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LEVELS, formatValue, timeFmt, timeSecFmt, valueOf } from "@/lib/air";
import { useTheme } from "@/lib/theme";
import type { Metric, Reading } from "@/lib/types";

const COLORS = {
  light: { line: "#0e1116", grid: "rgba(17,24,39,0.06)", axis: "#9aa0a9", cursor: "rgba(17,24,39,0.15)", tipBg: "#ffffff", tipBorder: "rgba(17,24,39,0.08)", amber: "#92400e", red: "#991b1b" },
  dark: { line: "#ecedee", grid: "rgba(255,255,255,0.06)", axis: "#676d76", cursor: "rgba(255,255,255,0.2)", tipBg: "#1b1f24", tipBorder: "rgba(255,255,255,0.1)", amber: "#fbbf24", red: "#f87171" },
};

export function TrendChart({ metric, readings, live }: { metric: Metric; readings: Reading[]; live: boolean }) {
  const data = readings.map((r) => ({ t: new Date(r.recorded_at).getTime(), v: valueOf(r, metric.code) }));
  const fmt = live ? timeSecFmt : timeFmt;
  const c = COLORS[useTheme()];
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="trend" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor={c.line} stopOpacity={0.12} />
              <stop offset="1" stopColor={c.line} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} vertical={false} />
          <XAxis
            dataKey="t"
            type="number"
            domain={["dataMin", "dataMax"]}
            scale="time"
            tickFormatter={(t) => fmt.format(new Date(t))}
            stroke={c.axis}
            fontSize={11}
            tickLine={false}
            axisLine={false}
            minTickGap={48}
          />
          <YAxis stroke={c.axis} fontSize={11} tickLine={false} axisLine={false} width={48} domain={["auto", "auto"]} />
          <Tooltip
            cursor={{ stroke: c.cursor }}
            contentStyle={{ background: c.tipBg, color: c.line, border: `1px solid ${c.tipBorder}`, borderRadius: 12, fontSize: 12, boxShadow: "0 12px 32px -8px rgba(17,24,39,0.18)" }}
            labelFormatter={(t) => timeSecFmt.format(new Date(Number(t)))}
            formatter={(v) => [`${formatValue(metric.code, Number(v))} ${metric.unit}`, metric.name]}
          />
          {metric.good_max != null && (
            <ReferenceLine y={metric.good_max} stroke={LEVELS.amarillo.color} strokeDasharray="4 4" ifOverflow="extendDomain"
              label={{ value: "Moderado", position: "insideTopRight", fill: c.amber, fontSize: 10 }} />
          )}
          {metric.moderate_max != null && (
            <ReferenceLine y={metric.moderate_max} stroke={LEVELS.rojo.color} strokeDasharray="4 4"
              label={{ value: "Dañino", position: "insideTopRight", fill: c.red, fontSize: 10 }} />
          )}
          <Area type="monotone" dataKey="v" stroke={c.line} strokeWidth={1.75} fill="url(#trend)" isAnimationActive={false} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
