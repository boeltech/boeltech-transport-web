/**
 * chartTokens — fuente única token → color CSS para charts del DS.
 * Features consumen wrappers Boeltech*Chart; nunca importan recharts directo.
 */

export type ChartToken =
  | "chart-1"
  | "chart-2"
  | "chart-3"
  | "chart-4"
  | "chart-5"
  | "success"
  | "warning"
  | "info"
  | "destructive"
  | "neutral"
  | "primary";

export type ChartSeries = {
  dataKey: string;
  label: string;
  token: ChartToken;
};

/** Resuelve un token DS a var CSS consumible por Recharts (fill/stroke). */
export function chartColor(token: ChartToken): string {
  return `var(--${token})`;
}

/** Estilos de ejes — heredan dark mode vía tokens CSS. */
export const CHART_AXIS_TICK = {
  fill: "var(--muted-foreground)",
  fontSize: 12,
} as const;

export const CHART_AXIS_LINE = {
  stroke: "var(--border)",
} as const;

export const CHART_GRID = {
  stroke: "var(--border)",
  strokeDasharray: "3 3",
} as const;
