/**
 * ChartPaletteSection
 *
 * Paleta de tokens + demos vivas de ChartCard y Boeltech*Chart.
 * Validar en /design-system → Charts (light + dark).
 */

import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  BoeltechAreaChart,
  BoeltechBarChart,
  BoeltechDonutChart,
  BoeltechLineChart,
  ChartCard,
  Sparkline,
  StatCard,
  type ChartSeries,
} from "@shared/ui/data-display";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

const CHART_PALETTE = [
  { token: "chart-1", label: "Azul primary", value: 84, note: "Serie principal" },
  { token: "chart-2", label: "Teal", value: 62, note: "Complemento frío" },
  { token: "chart-3", label: "Ámbar", value: 47, note: "Contraste cálido" },
  { token: "chart-4", label: "Magenta", value: 38, note: "Split-complementary" },
  { token: "chart-5", label: "Verde bosque", value: 27, note: "Estabilidad" },
] as const;

const MONTHLY_REVENUE = [
  { label: "Ene", ingresos: 420000, gastos: 280000 },
  { label: "Feb", ingresos: 380000, gastos: 265000 },
  { label: "Mar", ingresos: 510000, gastos: 310000 },
  { label: "Abr", ingresos: 470000, gastos: 295000 },
  { label: "May", ingresos: 560000, gastos: 320000 },
  { label: "Jun", ingresos: 530000, gastos: 305000 },
];

const REVENUE_SERIES: ChartSeries[] = [
  { dataKey: "ingresos", label: "Ingresos", token: "chart-1" },
  { dataKey: "gastos", label: "Gastos", token: "chart-3" },
];

const PLAN_VS_REAL_MONTH = [
  {
    label: "Ingresos",
    budgeted: 35_000,
    actual: 35_000,
  },
  {
    label: "Costos",
    budgeted: 8_000,
    actual: 7_600,
  },
];

const PLAN_VS_REAL_SERIES: ChartSeries[] = [
  { dataKey: "budgeted", label: "Presupuestado", token: "chart-2" },
  { dataKey: "actual", label: "Real", token: "chart-1" },
];

const TRIP_STATUS = [
  { label: "Completados", value: 142 },
  { label: "En tránsito", value: 38 },
  { label: "Pendientes", value: 24 },
  { label: "Cancelados", value: 9 },
];

const TRIP_STATUS_SERIES: ChartSeries[] = [
  { dataKey: "value", label: "Completados", token: "success" },
  { dataKey: "value", label: "En tránsito", token: "info" },
  { dataKey: "value", label: "Pendientes", token: "warning" },
  { dataKey: "value", label: "Cancelados", token: "destructive" },
];

const SPARKLINE_DATA = [
  { value: 12 },
  { value: 18 },
  { value: 15 },
  { value: 22 },
  { value: 19 },
  { value: 28 },
  { value: 25 },
];

const currencyFormatter = (value: number | string | (number | string)[]) => {
  const numeric = Array.isArray(value) ? Number(value[0]) : Number(value);
  return formatMxCurrency(numeric);
};

export function ChartPaletteSection() {
  return (
    <div className="space-y-8">
      {/* Paleta estática (conservada) */}
      <Card>
        <CardHeader>
          <CardTitle>Chart palette</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {CHART_PALETTE.map((s) => (
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

      {/* StatCard + Sparkline */}
      <Card>
        <CardHeader>
          <CardTitle>Sparkline en StatCard</CardTitle>
        </CardHeader>
        <CardContent>
          <StatCard
            title="Viajes esta semana"
            value={213}
            tone="success"
            icon={<TrendingUp className="h-5 w-5" />}
            description="+12% vs semana anterior"
            trend={
              <Sparkline
                data={SPARKLINE_DATA}
                token="success"
                height={36}
                className="max-w-[140px]"
              />
            }
          />
        </CardContent>
      </Card>

      {/* Line chart */}
      <ChartCard
        title="Ingresos vs gastos"
        description="Tendencia mensual — demo con datos ficticios"
        isLoading={false}
        aria-label="Gráfico de líneas: ingresos vs gastos por mes"
        footer={
          <p className="text-xs text-muted-foreground">
            Fuente: datos de demostración del design system
          </p>
        }
      >
        <BoeltechLineChart
          data={MONTHLY_REVENUE}
          series={REVENUE_SERIES}
          valueFormatter={currencyFormatter}
        />
      </ChartCard>

      {/* Plan vs real — patrón Dashboard */}
      <ChartCard
        title="Ingresos y costos: plan vs real"
        description="Ingresos $35,000 → $35,000 · Costos $8,000 → $7,600 · Margen real $27,400 (mes)"
        isLoading={false}
        aria-label="Gráfico de barras: ingresos y costos presupuestados vs reales"
      >
        <BoeltechBarChart
          data={PLAN_VS_REAL_MONTH}
          series={PLAN_VS_REAL_SERIES}
          valueFormatter={currencyFormatter}
        />
      </ChartCard>

      {/* Bar charts — grouped + stacked */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Barras agrupadas"
          description="Comparación lado a lado"
          isLoading={false}
          aria-label="Gráfico de barras agrupadas: ingresos vs gastos"
        >
          <BoeltechBarChart
            data={MONTHLY_REVENUE}
            series={REVENUE_SERIES}
            valueFormatter={currencyFormatter}
          />
        </ChartCard>

        <ChartCard
          title="Barras apiladas"
          description="Composición acumulada"
          isLoading={false}
          aria-label="Gráfico de barras apiladas: ingresos y gastos"
        >
          <BoeltechBarChart
            data={MONTHLY_REVENUE}
            series={REVENUE_SERIES}
            stacked
            valueFormatter={currencyFormatter}
          />
        </ChartCard>
      </div>

      {/* Area chart */}
      <ChartCard
        title="Área — ingresos"
        description="Serie única con fill suave"
        isLoading={false}
        aria-label="Gráfico de área: ingresos mensuales"
      >
        <BoeltechAreaChart
          data={MONTHLY_REVENUE}
          series={[REVENUE_SERIES[0]!]}
          valueFormatter={currencyFormatter}
        />
      </ChartCard>

      {/* Donut chart */}
      <ChartCard
        title="Estado de viajes"
        description="Distribución por estatus operativo"
        isLoading={false}
        aria-label="Gráfico de dona: distribución de viajes por estatus"
      >
        <BoeltechDonutChart
          data={TRIP_STATUS}
          series={TRIP_STATUS_SERIES}
          centerLabel={
            <div>
              <p className="text-2xl font-bold tabular-nums">213</p>
              <p className="text-xs text-muted-foreground">Total viajes</p>
            </div>
          }
        />
      </ChartCard>

      {/* Loading + error states */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard
          title="Estado: cargando"
          description="Skeleton del área de chart"
          isLoading
          aria-label="Gráfico en carga"
        >
          <BoeltechLineChart data={[]} series={REVENUE_SERIES} />
        </ChartCard>

        <ChartCard
          title="Estado: error"
          description="Mensaje accesible cuando falla la carga"
          isLoading={false}
          error="No pudimos obtener los datos del servidor. Intenta de nuevo más tarde."
          aria-label="Gráfico con error de carga"
        >
          <BoeltechLineChart data={[]} series={REVENUE_SERIES} />
        </ChartCard>
      </div>
    </div>
  );
}
