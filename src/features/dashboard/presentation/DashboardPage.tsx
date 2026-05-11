/**
 * DashboardPage
 *
 * Panel de control principal — operación + finanzas integradas.
 *
 * Fuentes de datos:
 *   - useDashboard()       → stats operativos, alertas, viajes recientes
 *   - useFinanceSummary()  → KPIs financieros (en caché si ya se visitó Finanzas)
 *
 * Ubicación: src/features/dashboard/presentation/DashboardPage.tsx
 */

import { useNavigate } from "react-router-dom";
import {
  Truck,
  Users,
  Route,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Loader2,
  ShieldAlert,
  FileWarning,
  IdCard,
  Stethoscope,
  TrendingUp,
  Wrench,
  MapPin,
  User,
  BadgeCheck,
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { usePermissions, canAccessFinanceSummaryRoute } from "@shared/permissions";
import { getGreeting } from "@/shared/lib/userHelpers";
import { cn } from "@shared/lib/utils/cn";
import { useDashboard } from "../application/hooks/useDashboard";
import { useFinanceSummary } from "@features/invoicing/application";

import type {
  DashboardAlert,
  RecentTrip,
  AlertSeverity,
  AlertType,
} from "../domain/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { Separator } from "@/shared/ui/separator";
import { TripStatus, type TripStatusType } from "@features/trips";
import { TripStatusBadge } from "@features/trips/presentation";

// ============================================================================
// HELPERS
// ============================================================================

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function handleAlertClick(
  alert: DashboardAlert,
  navigate: ReturnType<typeof useNavigate>,
) {
  switch (alert.type) {
    case "overdue_trip":
      navigate(`/trips/${alert.entity_id}`);
      break;
    case "license_expiring":
    case "medical_certificate_expiring":
      navigate(`/drivers/${alert.entity_id}`);
      break;
    case "insurance_expiring":
    case "sct_permit_expiring":
      navigate(`/vehicles/${alert.entity_id}`);
      break;
    default:
      if (
        alert.entity_code?.startsWith("VH-") ||
        alert.entity_code?.startsWith("U-")
      ) {
        navigate(`/vehicles/${alert.entity_id}`);
      } else if (alert.entity_code?.startsWith("EMP")) {
        navigate(`/drivers/${alert.entity_id}`);
      } else {
        navigate(`/trips/${alert.entity_id}`);
      }
  }
}

// ============================================================================
// KPI CARD — base reutilizable
// ============================================================================

interface KpiCardProps {
  title: string;
  value: string | number | undefined;
  description?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
  indicator?: { label: string; variant: string };
  isLoading: boolean;
  onClick?: () => void;
}

const INDICATOR_CLASSES: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  yellow: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  muted: "bg-muted text-muted-foreground",
};

function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  valueColor,
  indicator,
  isLoading,
  onClick,
}: KpiCardProps) {
  return (
    <Card
      className={cn(
        "transition-shadow",
        onClick && "cursor-pointer hover:shadow-md",
      )}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
              iconBg,
            )}
          >
            <Icon className={cn("h-4 w-4", iconColor)} />
          </div>
        </div>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-3 w-36 mb-3" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </>
        ) : (
          <>
            <p className={cn("text-2xl font-bold", valueColor ?? "")}>
              {value ?? "—"}
            </p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1 mb-3">
                {description}
              </p>
            )}
            {indicator && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1",
                  INDICATOR_CLASSES[indicator.variant] ?? INDICATOR_CLASSES.muted,
                )}
              >
                {indicator.label}
              </span>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION: KPIs de operación
// ============================================================================

function OperationKpis({
  data,
  isLoading,
  navigate,
}: {
  data: ReturnType<typeof useDashboard>["data"];
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const stats = data?.stats;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title="Flota activa"
        value={stats ? `${stats.vehicles.on_trip} / ${stats.vehicles.total}` : undefined}
        description={
          stats
            ? `${stats.vehicles.available} disponibles · ${stats.vehicles.in_maintenance} en mantenimiento`
            : undefined
        }
        icon={Truck}
        iconBg="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
        valueColor="text-blue-600 dark:text-blue-400"
        indicator={
          stats
            ? stats.vehicles.on_trip > 0
              ? { label: `${stats.vehicles.on_trip} en viaje`, variant: "blue" }
              : { label: "Sin unidades en ruta", variant: "muted" }
            : undefined
        }
        isLoading={isLoading}
        onClick={() => navigate("/vehicles")}
      />

      <KpiCard
        title="Conductores"
        value={stats?.drivers.available}
        description={
          stats
            ? `${stats.drivers.on_trip} en viaje · ${stats.drivers.on_vacation + stats.drivers.on_leave} ausentes`
            : undefined
        }
        icon={Users}
        iconBg="bg-green-100 dark:bg-green-900/30"
        iconColor="text-green-600 dark:text-green-400"
        valueColor="text-green-600 dark:text-green-400"
        indicator={
          stats
            ? { label: "Disponibles ahora", variant: "green" }
            : undefined
        }
        isLoading={isLoading}
        onClick={() => navigate("/drivers")}
      />

      <KpiCard
        title="Viajes en curso"
        value={stats?.trips.in_progress}
        description={
          stats
            ? `${stats.trips.completed_this_month} completados · ${stats.trips.cancelled_this_month} cancelados este mes`
            : undefined
        }
        icon={Route}
        iconBg="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600 dark:text-purple-400"
        valueColor="text-purple-600 dark:text-purple-400"
        indicator={
          stats
            ? stats.trips.in_progress > 0
              ? { label: "En progreso", variant: "blue" }
              : { label: "Sin viajes activos", variant: "muted" }
            : undefined
        }
        isLoading={isLoading}
        onClick={() => navigate("/trips")}
      />

      <KpiCard
        title="Tarifa base (mes)"
        value={stats ? formatMXN(stats.billing.total_base_rate_this_month) : undefined}
        description={
          stats
            ? `Costo operativo: ${formatMXN(stats.billing.total_cost_this_month)}`
            : undefined
        }
        icon={DollarSign}
        iconBg="bg-orange-100 dark:bg-orange-900/30"
        iconColor="text-orange-600 dark:text-orange-400"
        valueColor="text-orange-600 dark:text-orange-400"
        indicator={
          stats
            ? stats.billing.total_base_rate_this_month > 0
              ? { label: "Ingresos del período", variant: "orange" }
              : { label: "Sin facturación este mes", variant: "muted" }
            : undefined
        }
        isLoading={isLoading}
      />
    </div>
  );
}

// ============================================================================
// SECTION: KPIs financieros
// ============================================================================

function FinanceKpis({
  isLoading,
  navigate,
}: {
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const { data: summary, isLoading: summaryLoading } = useFinanceSummary({
    enabled: true,
  });
  const loading = isLoading || summaryLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Finanzas</h2>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-7 text-xs"
          onClick={() => navigate("/finance?tab=invoices")}
        >
          Ver detalle
          <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <KpiCard
          title="Por cobrar"
          value={summary ? formatMXN(summary.totalReceivable) : undefined}
          description="Facturas timbradas sin pago completo"
          icon={DollarSign}
          iconBg="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          valueColor="text-blue-600 dark:text-blue-400"
          indicator={
            summary
              ? summary.totalReceivable > 0
                ? { label: "Pendiente de cobro", variant: "blue" }
                : { label: "Sin saldo pendiente", variant: "green" }
              : undefined
          }
          isLoading={loading}
          onClick={() => navigate("/finance?tab=invoices")}
        />

        <KpiCard
          title="Cobrado este mes"
          value={summary ? formatMXN(summary.collectedThisMonth) : undefined}
          description="Pagos registrados en el período actual"
          icon={TrendingUp}
          iconBg="bg-green-100 dark:bg-green-900/30"
          iconColor="text-green-600 dark:text-green-400"
          valueColor="text-green-600 dark:text-green-400"
          indicator={
            summary
              ? summary.collectedThisMonth > 0
                ? { label: "Ingresos recibidos", variant: "green" }
                : { label: "Sin cobros este mes", variant: "muted" }
              : undefined
          }
          isLoading={loading}
          onClick={() => navigate("/finance")}
        />

        <KpiCard
          title="Vencido"
          value={summary ? formatMXN(summary.totalOverdue) : undefined}
          description="Facturas PPD con pago pendiente vencido"
          icon={AlertTriangle}
          iconBg={
            summary && summary.totalOverdue > 0
              ? "bg-red-100 dark:bg-red-900/30"
              : "bg-muted"
          }
          iconColor={
            summary && summary.totalOverdue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }
          valueColor={
            summary && summary.totalOverdue > 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }
          indicator={
            summary
              ? summary.totalOverdue > 0
                ? { label: "Requiere atención", variant: "red" }
                : { label: "Sin vencidos", variant: "green" }
              : undefined
          }
          isLoading={loading}
          onClick={() => navigate("/finance?tab=invoices&status=stamped")}
        />
      </div>
    </div>
  );
}

// ============================================================================
// SECTION: Alertas operativas
// ============================================================================

const ALERT_ICON_MAP: Record<AlertType, React.ElementType> = {
  overdue_trip: Clock,
  license_expiring: IdCard,
  medical_certificate_expiring: Stethoscope,
  insurance_expiring: ShieldAlert,
  sct_permit_expiring: FileWarning,
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  error: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  warning: "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
  info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
};

const SEVERITY_ICON_STYLES: Record<AlertSeverity, string> = {
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  warning: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
};

const SEVERITY_ORDER: AlertSeverity[] = ["error", "warning", "info"];

function AlertItem({
  alert,
  onClick,
}: {
  alert: DashboardAlert;
  onClick?: () => void;
}) {
  const Icon = ALERT_ICON_MAP[alert.type] ?? AlertCircle;
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3 transition-colors",
        SEVERITY_STYLES[alert.severity],
        onClick && "cursor-pointer hover:opacity-80",
      )}
      onClick={onClick}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          SEVERITY_ICON_STYLES[alert.severity],
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="text-xs text-muted-foreground">{alert.description}</p>
      </div>
      {onClick && (
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}

function AlertsCard({
  alerts,
  isLoading,
  navigate,
}: {
  alerts: DashboardAlert[] | undefined;
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  const errorCount = alerts?.filter((a) => a.severity === "error").length ?? 0;
  const warningCount = alerts?.filter((a) => a.severity === "warning").length ?? 0;

  // Ordenar por severidad: error → warning → info
  const sorted = alerts
    ? [...alerts].sort(
        (a, b) =>
          SEVERITY_ORDER.indexOf(a.severity) -
          SEVERITY_ORDER.indexOf(b.severity),
      )
    : [];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Alertas operativas
          </CardTitle>
          {!isLoading && (alerts?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1.5">
              {errorCount > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    SEVERITY_BADGE.error,
                  )}
                >
                  {errorCount} urgente{errorCount > 1 ? "s" : ""}
                </span>
              )}
              {warningCount > 0 && (
                <span
                  className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    SEVERITY_BADGE.warning,
                  )}
                >
                  {warningCount} aviso{warningCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        <CardDescription>
          {isLoading
            ? "Cargando..."
            : (alerts?.length ?? 0) === 0
              ? "Sin alertas pendientes"
              : `${alerts!.length} alerta${alerts!.length > 1 ? "s" : ""} que requieren atención`}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
                <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <p className="text-sm font-medium">Todo en orden</p>
            <p className="text-xs">No hay alertas operativas pendientes</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-90 overflow-y-auto pr-1">
            {sorted.map((alert, i) => (
              <AlertItem
                key={`${alert.type}-${alert.entity_id}-${i}`}
                alert={alert}
                onClick={() => handleAlertClick(alert, navigate)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SECTION: Viajes recientes
// ============================================================================

function RecentTripItem({
  trip,
  onClick,
}: {
  trip: RecentTrip;
  onClick?: () => void;
}) {
  const isEnumValue = (value: string): value is TripStatusType =>
    Object.values(TripStatus).includes(value as TripStatusType);

  const tripStatus: TripStatusType = isEnumValue(trip.status)
    ? trip.status
    : TripStatus.DRAFT;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-colors",
        onClick && "cursor-pointer hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* Código + estado */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-semibold text-sm">{trip.trip_code}</span>
            <TripStatusBadge status={tripStatus} size="sm" showIcon />
          </div>
          {/* Ruta */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {trip.origin_city}
            </span>
            <ArrowRight className="h-3 w-3 shrink-0" />
            <span className="truncate">
              {trip.destination_city}
            </span>
          </div>
          {/* Conductor y unidad */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {trip.driver_full_name}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3 w-3" />
              {trip.vehicle_unit_number}
            </span>
          </div>
        </div>
        {onClick && (
          <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
        )}
      </div>
    </div>
  );
}

function RecentTripsCard({
  trips,
  isLoading,
  navigate,
}: {
  trips: RecentTrip[] | undefined;
  isLoading: boolean;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Route className="h-4 w-4" />
              Viajes recientes
            </CardTitle>
            <CardDescription>Últimos viajes registrados</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => navigate("/trips")}
          >
            Ver todos
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="h-3 w-48 mb-1" />
                <Skeleton className="h-3 w-36" />
              </div>
            ))}
          </div>
        ) : (trips?.length ?? 0) === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
            <Route className="h-10 w-10" />
            <p className="text-sm font-medium">Sin viajes registrados</p>
            <p className="text-xs">Los viajes aparecerán aquí</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trips!.map((trip) => (
              <RecentTripItem
                key={trip.id}
                trip={trip}
                onClick={() => navigate(`/trips/${trip.id}`)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BadgeCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {getGreeting(user)}
            </h1>
            <p className="text-muted-foreground text-sm">
              Resumen de operación y finanzas
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Error */}
      {isError && (
        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-400">
              No se pudieron cargar los datos del dashboard.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPIs — Operación */}
      {hasPermission("trips", "read") && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wrench className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Operación</h2>
          </div>
          <OperationKpis data={data} isLoading={isLoading} navigate={navigate} />
        </div>
      )}

      <Separator />

      {/* KPIs financieros — mismo alcance que GET /finance/summary en API */}
      {canAccessFinanceSummaryRoute(user?.role) && (
        <FinanceKpis isLoading={isLoading} navigate={navigate} />
      )}

      <Separator />

      {/* Grid inferior */}
      {hasPermission("trips", "read") && (
        <div className="grid gap-6 lg:grid-cols-2">
          <AlertsCard
            alerts={data?.alerts}
            isLoading={isLoading}
            navigate={navigate}
          />
          <RecentTripsCard
            trips={data?.recent_trips}
            isLoading={isLoading}
            navigate={navigate}
          />
        </div>
      )}
    </div>
  );
}

export default DashboardPage;
