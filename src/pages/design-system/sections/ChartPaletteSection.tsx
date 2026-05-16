/**
 * ChartPaletteSection
 *
 * Muestra los 5 colores de chart alineados a la marca.
 * Render simple: barras horizontales con valores ficticios para
 * que se vea el balance cromático sin depender de una librería de charts.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";

const CHART_SERIES = [
  { token: "chart-1", label: "Azul primary", value: 84, note: "Serie principal" },
  { token: "chart-2", label: "Teal", value: 62, note: "Complemento frío" },
  { token: "chart-3", label: "Ámbar", value: 47, note: "Contraste cálido" },
  {
    token: "chart-4",
    label: "Magenta",
    value: 38,
    note: "Split-complementary",
  },
  {
    token: "chart-5",
    label: "Verde bosque",
    value: 27,
    note: "Estabilidad",
  },
] as const;

export function ChartPaletteSection() {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Chart palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CHART_SERIES.map((s) => (
              <div key={s.token} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-4 w-4 rounded-sm"
                      style={{ backgroundColor: `var(--${s.token})` }}
                    />
                    <span className="text-sm font-medium">{s.label}</span>
                    <code className="font-mono text-[11px] text-muted-foreground">
                      --{s.token}
                    </code>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {s.note}
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${s.value}%`,
                      backgroundColor: `var(--${s.token})`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            La paleta empieza con el azul primary (
            <code className="font-mono text-xs">--chart-1</code>) y va girando
            la rueda cromática para mantener contraste mutuo entre series
            adyacentes. En dark mode la lightness sube ~0.1 para legibilidad
            sin perder identidad.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
