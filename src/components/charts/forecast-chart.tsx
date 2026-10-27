"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ForecastPoint, SeriesPoint } from "@/core/forecast";
import { fmtDate, num } from "@/lib/utils";

type Row = {
  date: string;
  actual: number | null;
  forecast: number | null;
  lower: number | null;
  band: number | null;
};

export function ForecastChart({
  history,
  points,
  historyDays = 45,
}: {
  history: SeriesPoint[];
  points: ForecastPoint[];
  historyDays?: number;
}) {
  const tail = history.slice(-historyDays);
  const rows: Row[] = [
    ...tail.map((h) => ({
      date: h.date,
      actual: h.value,
      forecast: null,
      lower: null,
      band: null,
    })),
    ...points.map((p) => ({
      date: p.date,
      actual: null,
      forecast: p.value,
      lower: p.lower,
      band: Math.max(0, p.upper - p.lower),
    })),
  ];

  if (tail.length > 0) {
    const last = tail[tail.length - 1];
    rows[tail.length - 1] = {
      ...rows[tail.length - 1],
      forecast: last.value,
      lower: last.value,
      band: 0,
    };
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-2))" stopOpacity={0.22} />
              <stop offset="100%" stopColor="hsl(var(--chart-2))" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => fmtDate(v).slice(0, 6)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            minTickGap={26}
          />
          <YAxis
            tickFormatter={(v: number) => num(v)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
            }}
            labelFormatter={(v: string) => fmtDate(v)}
            formatter={(value: number, name: string) => {
              if (name === "band" || name === "lower") return [null, null];
              return [num(value), name === "actual" ? "Boardings" : "Forecast"];
            }}
          />
          <Area
            type="monotone"
            dataKey="lower"
            stackId="band"
            stroke="none"
            fill="transparent"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="band"
            stackId="band"
            stroke="none"
            fill="url(#bandFill)"
            isAnimationActive={false}
          />
          <ReferenceLine
            x={points[0]?.date}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="3 3"
            label={{
              value: "Forecast",
              position: "insideTopRight",
              fontSize: 10,
              fill: "hsl(var(--muted-foreground))",
            }}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="hsl(var(--chart-2))"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
