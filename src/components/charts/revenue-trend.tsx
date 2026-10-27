"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmtDate, inr } from "@/lib/utils";

export function RevenueTrend({ data }: { data: { date: string; impact: number }[] }) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-label text-muted-foreground">
        No leakage detected in this window.
      </p>
    );
  }

  return (
    <div className="h-[210px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="impactFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.28} />
              <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="2 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(v: string) => fmtDate(v).slice(0, 6)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(v: number) => inr(v)}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            width={64}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 6,
              border: "1px solid hsl(var(--border))",
              background: "hsl(var(--popover))",
              fontSize: 12,
              color: "hsl(var(--popover-foreground))",
              boxShadow: "0 4px 12px -2px rgb(15 23 42 / 0.10)",
            }}
            labelFormatter={(v: string) => fmtDate(v)}
            formatter={(value: number) => [inr(value), "Leakage detected"]}
          />
          <Area
            type="monotone"
            dataKey="impact"
            stroke="hsl(var(--chart-1))"
            strokeWidth={1.75}
            fill="url(#impactFill)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
