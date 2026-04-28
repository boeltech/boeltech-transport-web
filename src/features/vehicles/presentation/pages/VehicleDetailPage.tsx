/**
 * VehicleDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página de detalle de un vehículo.
 * Muestra información completa con alertas de documentos vencidos/por vencer.
 * Homologado con TripDetailPage y DriverDetailPage.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleDetailPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";
import {
  ArrowLeft,
  Truck,
  Gauge,
  FileText,
  Calendar,
  AlertTriangle,
  Fuel,
  Package,
  CreditCard,
  Shield,
  Route,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Application Layer
import { useVehicle } from "../../application";

// Domain
import { VEHICLE_TYPE_LABELS, type VehicleTypeValue } from "../../domain";

// Presentation
// import { useToast } from "@shared/hooks";
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { VehicleActions } from "../components/VehicleActions";
import {
  formatDate,
  formatDateTime,
  getDaysUntilDateString,
  isExpired,
  isExpiringSoon,
} from "@shared/utils/dateUtils";

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(num: number | null): string {
  if (num === null) return "—";
  return new Intl.NumberFormat("es-MX").format(num);
}

function getExpirationVariant(
  date: string | null,
): "destructive" | "outline" | "secondary" | "default" {
  const days = getDaysUntilDateString(date);
  if (days === null) return "secondary";
  if (days <= 0) return "destructive";
  if (days <= 30) return "outline";
  if (days <= 90) return "secondary";
  return "default";
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  alert?: "expired" | "warning";
  className?: string;
}

function InfoRow({ icon, label, value, alert, className }: InfoRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div
          className={cn(
            "text-sm font-medium flex items-center gap-1.5",
            alert === "expired" && "text-destructive",
            alert === "warning" && "text-amber-600 dark:text-amber-500",
          )}
        >
          {alert && <AlertTriangle className="h-3.5 w-3.5" />}
          {value}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface DocumentRowProps {
  label: string;
  documentNumber: string | null;
  expirationDate: string | null;
}

function DocumentRow({
  label,
  documentNumber,
  expirationDate,
}: DocumentRowProps) {
  const expired = isExpired(expirationDate);
  const expiringSoon = isExpiringSoon(expirationDate);
  const daysUntil = getDaysUntilDateString(expirationDate);
  const variant = getExpirationVariant(expirationDate);

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-b-0">
      <div className="space-y-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-sm text-muted-foreground font-mono">
          {documentNumber || "No registrado"}
        </p>
      </div>
      <div className="text-right space-y-1">
        <p
          className={cn(
            "text-sm",
            expired && "text-destructive",
            expiringSoon && "text-amber-600 dark:text-amber-500",
          )}
        >
          {formatDate(expirationDate)}
        </p>
        {expirationDate && (
          <Badge
            variant={variant}
            className={cn(
              "text-xs",
              variant === "outline" &&
                "border-amber-500 text-amber-800 dark:text-amber-200",
            )}
          >
            {expired
              ? "Vencido"
              : expiringSoon
                ? `${daysUntil} días`
                : "Vigente"}
          </Badge>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  // const { toast } = useToast();
  const vehicleId = id || "";

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  const {
    data: vehicleResponse,
    isLoading,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId);

  const vehicle = vehicleResponse;

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoading) {
    return <VehicleDetailSkeleton />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOT FOUND STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Truck className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Vehículo no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El vehículo que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate("/vehicles")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Vehículos
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const { capacities, documentation } = vehicle;

  const insuranceExpired = isExpired(documentation.insuranceExpiry);
  const insuranceExpiringSoon = isExpiringSoon(documentation.insuranceExpiry);
  const sctExpired = isExpired(documentation.sctPermitExpiry);
  const sctExpiringSoon = isExpiringSoon(documentation.sctPermitExpiry);

  const hasDocumentAlerts =
    insuranceExpired || insuranceExpiringSoon || sctExpired || sctExpiringSoon;

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/vehicles")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{vehicle.unitNumber}</h1>
              <p className="text-sm text-muted-foreground">
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </p>
            </div>
            <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />
          </div>
        </div>

        <VehicleActions
          vehicleId={vehicle.id}
          vehicleName={vehicle.unitNumber}
          status={vehicle.status}
          variant="buttons"
          onActionComplete={() => refetchVehicle()}
        />
      </div>

      {/* ================================================================== */}
      {/* ALERT: DOCUMENTS EXPIRING/EXPIRED                                  */}
      {/* ================================================================== */}
      {hasDocumentAlerts && (
        <Card
          className={cn(
            "border-l-4",
            insuranceExpired || sctExpired
              ? "border-l-destructive bg-destructive/5"
              : "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
          )}
        >
          <CardContent className="flex items-start gap-3 py-3">
            <AlertTriangle
              className={cn(
                "h-5 w-5 mt-0.5",
                insuranceExpired || sctExpired
                  ? "text-destructive"
                  : "text-amber-500",
              )}
            />
            <div className="space-y-1">
              <p className="font-medium">
                {insuranceExpired || sctExpired
                  ? "Documentos vencidos"
                  : "Documentos próximos a vencer"}
              </p>
              <ul className="text-sm text-muted-foreground space-y-0.5">
                {(insuranceExpired || insuranceExpiringSoon) && (
                  <li>
                    • Seguro:{" "}
                    {insuranceExpired
                      ? "Vencido"
                      : `Vence en ${getDaysUntilDateString(documentation.insuranceExpiry)} días`}
                  </li>
                )}
                {(sctExpired || sctExpiringSoon) && (
                  <li>
                    • Permiso SCT:{" "}
                    {sctExpired
                      ? "Vencido"
                      : `Vence en ${getDaysUntilDateString(documentation.sctPermitExpiry)} días`}
                  </li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================== */}
      {/* STATS CARDS                                                        */}
      {/* ================================================================== */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Kilometraje"
          value={`${formatNumber(vehicle.currentMileage)} km`}
          icon={<Gauge className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Capacidad de Carga"
          value={
            capacities.loadCapacity ? `${capacities.loadCapacity} ton` : "—"
          }
          icon={<Package className="h-5 w-5 text-blue-500" />}
        />
        <StatCard
          title="Tanque"
          value={
            capacities.fuelTankCapacity
              ? `${capacities.fuelTankCapacity} L`
              : "—"
          }
          icon={<Fuel className="h-5 w-5 text-amber-500" />}
        />
        <StatCard
          title="Rendimiento"
          value={
            capacities.expectedFuelEfficiency
              ? `${capacities.expectedFuelEfficiency} km/L`
              : "—"
          }
          icon={<Route className="h-5 w-5 text-green-500" />}
        />
      </div>

      {/* ================================================================== */}
      {/* TABS                                                               */}
      {/* ================================================================== */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="documents">
            Documentos
            {hasDocumentAlerts && (
              <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
        </TabsList>

        {/* TAB: INFORMACIÓN GENERAL */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Identificación */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" /> Identificación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Número de unidad"
                  value={
                    <span className="font-mono">{vehicle.unitNumber}</span>
                  }
                />
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Placa"
                  value={
                    <span className="font-mono">{vehicle.licensePlate}</span>
                  }
                />
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="VIN"
                  value={
                    vehicle.vin ? (
                      <span className="font-mono text-xs">{vehicle.vin}</span>
                    ) : (
                      "No registrado"
                    )
                  }
                />
                <Separator />
                <InfoRow
                  icon={<Truck className="h-4 w-4" />}
                  label="Tipo de vehículo"
                  value={
                    VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] ||
                    vehicle.type
                  }
                />
                {vehicle.color && (
                  <InfoRow
                    icon={<div className="h-4 w-4 rounded-full bg-muted" />}
                    label="Color"
                    value={vehicle.color}
                  />
                )}
              </CardContent>
            </Card>

            {/* Características */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> Características
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Truck className="h-4 w-4" />}
                  label="Marca"
                  value={vehicle.brand}
                />
                <InfoRow
                  icon={<Truck className="h-4 w-4" />}
                  label="Modelo"
                  value={vehicle.model}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Año"
                  value={vehicle.year}
                />
                <Separator />
                <InfoRow
                  icon={<Package className="h-4 w-4" />}
                  label="Capacidad de volumen"
                  value={
                    capacities.volumeCapacity
                      ? `${capacities.volumeCapacity} m³`
                      : "No especificada"
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Estado del sistema */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Estado del Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <InfoRow
                  icon={
                    vehicle.isActive ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )
                  }
                  label="Estado"
                  value={vehicle.isActive ? "Activo" : "Inactivo"}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha de registro"
                  value={formatDate(
                    vehicle.createdAt.toISOString().split("T")[0],
                  )}
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Última actualización"
                  value={formatDate(
                    vehicle.updatedAt.toISOString().split("T")[0],
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: DOCUMENTOS */}
        <TabsContent value="documents" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" /> Documentación Vigente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentRow
                label="Póliza de Seguro"
                documentNumber={documentation.insurancePolicy}
                expirationDate={documentation.insuranceExpiry}
              />
              <DocumentRow
                label="Permiso SCT"
                documentNumber={documentation.sctPermitNumber}
                expirationDate={documentation.sctPermitExpiry}
              />
            </CardContent>
          </Card>

          {/* Placeholder para lista de documentos */}
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Gestión de documentos próximamente
              </p>
              <Button variant="outline" size="sm" disabled>
                Subir documento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: MANTENIMIENTO */}
        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">
                Historial de mantenimiento próximamente
              </p>
              <Button variant="outline" size="sm" disabled>
                Registrar mantenimiento
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* METADATA                                                           */}
      {/* ================================================================== */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              Creado: {formatDateTime(vehicle.createdAt.toISOString())}
            </span>
            <span>
              Actualizado: {formatDateTime(vehicle.updatedAt.toISOString())}
            </span>
            {vehicle.createdBy && <span>Por: {vehicle.createdBy}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function VehicleDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-80" />

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default VehicleDetailPage;
