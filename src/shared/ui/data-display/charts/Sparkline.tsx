/**
 * Sparkline — mini-chart sin ejes para embeber en StatCard (prop trend).
 */

import { Area, AreaChart, Line, LineChart } from "recharts";
import { ChartContainer } from "./ChartContainer";
import { chartColor, type ChartToken } from "./chartTokens";

export interface SparklineProps {
  data: Record<string, string | number>[];
  dataKey?: string;
  token?: ChartToken;
  height?: number;
  variant?: "line" | "area";
  className?: string;
}

export function Sparkline({
  data,
  dataKey = "value",
  token = "chart-1",
  height = 32,
  variant = "area",
  className,
}: SparklineProps) {
  const color = chartColor(token);

  return (
    <ChartContainer height={height} className={className}>
      {variant === "line" ? (
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      ) : (
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            fill={color}
            fillOpacity={0.25}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      )}
    </ChartContainer>
  );
}
