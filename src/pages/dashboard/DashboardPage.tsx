/**
 * DashboardPage
 *
 * Panel de control principal con datos reales:
 * - Stats cards (vehículos, conductores, viajes, facturación)
 * - Alertas operativas (viajes vencidos, licencias, seguros, permisos SCT)
 * - Viajes recientes
 *
 * Ubicación: src/pages/dashboard/DashboardPage.tsx
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
} from "lucide-react";

import { useAuth } from "@/features/auth";
import { usePermissions } from "@shared/permissions";
import { getGreeting } from "@/shared/lib/userHelpers";
import { useDashboard } from "@features/dashboard/application/hooks/useDashboard";

import type {
  DashboardAlert,
  RecentTrip,
  AlertSeverity,
} from "@/features/dashboard/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import {
  TripStatus,
  TripStatusBadge,
  type TripStatusType,
} from "@features/trips";

// ============================================
// Main Component
// ============================================

function DashboardPage() {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useDashboard();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {getGreeting(user)}
          </h1>
          <p className="text-muted-foreground">Resumen de tu operación</p>
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

      {/* Error State */}
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

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {hasPermission("vehicles", "read") && (
          <StatCard
            title="Vehículos"
            value={data?.stats.vehicles.total}
            subtitle={
              data
                ? `${data.stats.vehicles.available} disponibles · ${data.stats.vehicles.on_trip} en viaje`
                : undefined
            }
            icon={Truck}
            isLoading={isLoading}
            onClick={() => navigate("/vehicles")}
          />
        )}
        {hasPermission("drivers", "read") && (
          <StatCard
            title="Conductores"
            value={data?.stats.drivers.total}
            subtitle={
              data
                ? `${data.stats.drivers.available} disponibles · ${data.stats.drivers.on_trip} en viaje`
                : undefined
            }
            icon={Users}
            isLoading={isLoading}
            onClick={() => navigate("/drivers")}
          />
        )}
        {hasPermission("trips", "read") && (
          <StatCard
            title="Viajes del Mes"
            value={data?.stats.trips.total_this_month}
            subtitle={
              data
                ? `${data.stats.trips.in_progress} en curso · ${data.stats.trips.completed_this_month} completados`
                : undefined
            }
            icon={Route}
            isLoading={isLoading}
            onClick={() => navigate("/trips")}
          />
        )}
        {hasPermission("trips", "read") && (
          <StatCard
            title="Facturado (Mes)"
            value={
              data
                ? `$${data.stats.billing.total_base_rate_this_month.toLocaleString("es-MX")}`
                : undefined
            }
            subtitle={
              data
                ? `Costo operativo: $${data.stats.billing.total_cost_this_month.toLocaleString("es-MX")}`
                : undefined
            }
            icon={DollarSign}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alertas */}
        {hasPermission("trips", "read") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Alertas Operativas
              </CardTitle>
              <CardDescription>
                {isLoading
                  ? "Cargando..."
                  : data?.alerts.length === 0
                    ? "Sin alertas pendientes"
                    : `${data?.alerts.length} alerta${(data?.alerts.length ?? 0) > 1 ? "s" : ""} que requieren atención`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <AlertsSkeleton />
              ) : data?.alerts.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <CheckCircle className="h-10 w-10 text-green-500" />
                  <p className="text-sm">Todo en orden</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {data?.alerts.map((alert, i) => (
                    <AlertItem
                      key={`${alert.type}-${alert.entity_id}-${i}`}
                      alert={alert}
                      onClick={() => {
                        if (alert.type === "overdue_trip") {
                          navigate(`/trips/${alert.entity_id}`);
                        } else if (alert.type === "license_expiring") {
                          navigate(`/drivers/${alert.entity_id}`);
                        } else {
                          navigate(`/vehicles/${alert.entity_id}`);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Viajes Recientes */}
        {hasPermission("trips", "read") && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Route className="h-5 w-5" />
                    Viajes Recientes
                  </CardTitle>
                  <CardDescription>Últimos viajes registrados</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/trips")}
                >
                  Ver todos
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <RecentTripsSkeleton />
              ) : data?.recent_trips.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                  <Route className="h-10 w-10" />
                  <p className="text-sm">No hay viajes registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data?.recent_trips.map((trip) => (
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
        )}
      </div>
    </div>
  );
}

// ============================================
// StatCard
// ============================================

interface StatCardProps {
  title: string;
  value?: string | number;
  subtitle?: string;
  icon: React.ElementType;
  isLoading: boolean;
  onClick?: () => void;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  isLoading,
  onClick,
}: StatCardProps) {
  return (
    <Card
      className={
        onClick ? "cursor-pointer transition-shadow hover:shadow-md" : ""
      }
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="mb-1 h-8 w-20" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value ?? "—"}</div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// AlertItem
// ============================================

const ALERT_ICON_MAP: Record<string, React.ElementType> = {
  overdue_trip: Clock,
  license_expiring: IdCard,
  insurance_expiring: ShieldAlert,
  sct_permit_expiring: FileWarning,
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  error: "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
  warning:
    "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950",
  info: "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950",
};

const SEVERITY_ICON_STYLES: Record<AlertSeverity, string> = {
  error: "text-red-600 dark:text-red-400",
  warning: "text-yellow-600 dark:text-yellow-400",
  info: "text-blue-600 dark:text-blue-400",
};

interface AlertItemProps {
  alert: DashboardAlert;
  onClick?: () => void;
}

function AlertItem({ alert, onClick }: AlertItemProps) {
  const Icon = ALERT_ICON_MAP[alert.type] || AlertCircle;

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${SEVERITY_STYLES[alert.severity]} ${onClick ? "cursor-pointer hover:opacity-80" : ""}`}
      onClick={onClick}
    >
      <Icon
        className={`mt-0.5 h-4 w-4 shrink-0 ${SEVERITY_ICON_STYLES[alert.severity]}`}
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

// ============================================
// RecentTripItem
// ============================================

interface RecentTripItemProps {
  trip: RecentTrip;
  onClick?: () => void;
}

function RecentTripItem({ trip, onClick }: RecentTripItemProps) {
  const isEnumValue = (value: string): value is TripStatusType => {
    return Object.values(TripStatus).includes(value as TripStatusType);
  };

  let tripStatus: TripStatusType = TripStatus.DRAFT;

  if (isEnumValue(trip.status)) {
    tripStatus = trip.status;
  }

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${onClick ? "cursor-pointer hover:bg-muted/50" : ""}`}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{trip.trip_code}</p>
          <TripStatusBadge status={tripStatus} size="sm" />
        </div>
        <p className="text-sm text-muted-foreground">
          {trip.origin_city} → {trip.destination_city}
        </p>
        <p className="text-xs text-muted-foreground">
          {trip.driver_full_name} · {trip.vehicle_unit_number}
        </p>
      </div>
      {onClick && (
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </div>
  );
}

// ============================================
// Skeletons
// ============================================

function AlertsSkeleton() {
  return (
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
  );
}

function RecentTripsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      ))}
    </div>
  );
}

export default DashboardPage;
