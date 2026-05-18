/**
 * StatusSection
 *
 * Muestra:
 *   - StatusBadge en ambos tonos (soft + solid) por variante semántica
 *   - StatCard con todas sus tone variants
 *   - Status badges reales de dominio (Trip, Driver, Vehicle, Invoice)
 *
 * Refleja en vivo cómo los `xxxStatusConfig.ts` de cada feature renderizan
 * post-refactor de STATUS_COLORS a tokens del DS (Fase 2).
 */

import {
  CheckCircle2,
  Calendar,
  Truck,
  XCircle,
  FileEdit,
  AlertTriangle,
  Info,
  TrendingUp,
  Receipt,
  Users,
  Wallet,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { StatusBadge } from "@shared/components/StatusBadge";
import { StatCard } from "@shared/ui/data-display/StatCard";
import {
  createStatusConfig,
  type StatusConfig,
} from "@shared/config/status/types";

// Demo configs locales — replican el patrón de los features sin acoplar
// el showcase a un módulo en particular.

type DemoStatus =
  | "completed"
  | "scheduled"
  | "inProgress"
  | "pending"
  | "cancelled"
  | "draft";

const SOFT_DEMO: Record<DemoStatus, StatusConfig> = {
  completed: createStatusConfig("success", {
    label: "Completado",
    icon: CheckCircle2,
    description: "Operación finalizada exitosamente",
  }),
  scheduled: createStatusConfig("info", {
    label: "Programado",
    icon: Calendar,
    description: "Listo para iniciar",
  }),
  inProgress: createStatusConfig("info", {
    label: "En Ruta",
    icon: Truck,
    description: "Operación activa",
    tone: "solid",
  }),
  pending: createStatusConfig("warning", {
    label: "Por vencer",
    icon: AlertTriangle,
    description: "Requiere atención",
  }),
  cancelled: createStatusConfig("destructive", {
    label: "Cancelado",
    icon: XCircle,
    description: "Operación abortada",
  }),
  draft: createStatusConfig("neutral", {
    label: "Borrador",
    icon: FileEdit,
    description: "Sin programar todavía",
  }),
};

const SOLID_DEMO: Record<DemoStatus, StatusConfig> = {
  completed: createStatusConfig("success", {
    label: "Completado",
    icon: CheckCircle2,
    description: "Operación finalizada exitosamente",
    tone: "solid",
  }),
  scheduled: createStatusConfig("info", {
    label: "Programado",
    icon: Calendar,
    description: "Listo para iniciar",
    tone: "solid",
  }),
  inProgress: createStatusConfig("info", {
    label: "En Ruta",
    icon: Truck,
    description: "Operación activa",
    tone: "solid",
  }),
  pending: createStatusConfig("warning", {
    label: "Por vencer",
    icon: AlertTriangle,
    description: "Requiere atención",
    tone: "solid",
  }),
  cancelled: createStatusConfig("destructive", {
    label: "Cancelado",
    icon: XCircle,
    description: "Operación abortada",
    tone: "solid",
  }),
  draft: createStatusConfig("neutral", {
    label: "Borrador",
    icon: FileEdit,
    description: "Sin programar todavía",
    tone: "solid",
  }),
};

const DEMO_STATUSES: DemoStatus[] = [
  "completed",
  "scheduled",
  "inProgress",
  "pending",
  "cancelled",
  "draft",
];

export function StatusSection() {
  return (
    <div className="space-y-8">
      {/* StatusBadge — soft + solid */}
      <Card>
        <CardHeader>
          <CardTitle>StatusBadge — tonos soft + solid</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Row label='Soft (default) — recomendado para listas densas'>
            {DEMO_STATUSES.map((s) => (
              <StatusBadge
                key={s}
                status={s}
                config={SOFT_DEMO}
                showIcon
              />
            ))}
          </Row>
          <Row label='Solid — para estados que requieren atención visual'>
            {DEMO_STATUSES.map((s) => (
              <StatusBadge
                key={s}
                status={s}
                config={SOLID_DEMO}
                showIcon
              />
            ))}
          </Row>
          <Row label="Tamaños">
            <StatusBadge status="completed" config={SOFT_DEMO} size="sm" />
            <StatusBadge status="completed" config={SOFT_DEMO} size="md" />
            <StatusBadge status="completed" config={SOFT_DEMO} size="lg" />
            <StatusBadge
              status="completed"
              config={SOFT_DEMO}
              size="lg"
              showIcon
            />
          </Row>
          <p className="text-sm text-muted-foreground">
            Los presets de color leen <strong>tokens semánticos</strong> del
            DS: <code className="font-mono text-xs">bg-success-soft</code>,{" "}
            <code className="font-mono text-xs">text-warning-soft-foreground</code>
            , etc. Una recalibración futura en{" "}
            <code className="font-mono text-xs">index.css</code> propaga
            automáticamente a todos los módulos.
          </p>
        </CardContent>
      </Card>

      {/* StatCard tone variants */}
      <Card>
        <CardHeader>
          <CardTitle>StatCard — variantes de tono</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Viajes totales"
              value="1,247"
              icon={<Truck className="h-5 w-5" />}
              description="Últimos 30 días"
              tone="primary"
            />
            <StatCard
              title="Completados"
              value="1,089"
              icon={<CheckCircle2 className="h-5 w-5" />}
              description="87% del total"
              tone="success"
            />
            <StatCard
              title="Por vencer"
              value="14"
              icon={<AlertTriangle className="h-5 w-5" />}
              description="Licencias en 30 días"
              tone="warning"
            />
            <StatCard
              title="En tránsito"
              value="38"
              icon={<Info className="h-5 w-5" />}
              description="Ahora mismo"
              tone="info"
            />
            <StatCard
              title="Cancelados"
              value="22"
              icon={<XCircle className="h-5 w-5" />}
              description="Últimos 30 días"
              tone="destructive"
            />
            <StatCard
              title="Borradores"
              value="9"
              icon={<FileEdit className="h-5 w-5" />}
              description="Sin programar"
              tone="neutral"
            />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Default <code className="font-mono text-xs">tone="primary"</code>{" "}
            (azul-tinta). Mantén la consistencia: KPIs positivos en{" "}
            <code className="font-mono text-xs">success</code>, negativos en{" "}
            <code className="font-mono text-xs">destructive</code>, sin
            mezclarlos arbitrariamente.
          </p>
        </CardContent>
      </Card>

      {/* StatCard sample dashboard */}
      <Card>
        <CardHeader>
          <CardTitle>Composición: dashboard de cabecera</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Ingresos del mes"
              value="$ 487,250"
              icon={<Wallet className="h-5 w-5" />}
              description="+12% vs. mes anterior"
              tone="success"
            />
            <StatCard
              title="Facturas emitidas"
              value="142"
              icon={<Receipt className="h-5 w-5" />}
              description="Mayo 2026"
              tone="primary"
            />
            <StatCard
              title="Conductores activos"
              value="38"
              icon={<Users className="h-5 w-5" />}
              description="De 45 totales"
              tone="info"
            />
            <StatCard
              title="Crecimiento YoY"
              value="+24%"
              icon={<TrendingUp className="h-5 w-5" />}
              description="Acumulado 2026"
              tone="success"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface RowProps {
  label: string;
  children: React.ReactNode;
}

function Row({ label, children }: RowProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
