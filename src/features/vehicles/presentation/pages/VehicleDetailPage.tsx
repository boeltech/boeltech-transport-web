/**
 * VehicleDetailPage
 *
 * Página de detalle de un vehículo. Muestra toda la información
 * con alertas de documentos vencidos/por vencer.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleDetailPage.tsx
 */

import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Pencil,
  Truck,
  Gauge,
  FileText,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";
import { usePermissions } from "@shared/permissions";
import { useVehicle } from "@features/vehicles/application";
import { VehicleStatusBadge } from "../components/VehicleStatusBadge";
import { VehicleActions } from "../components/VehicleActions";
import { VEHICLE_TYPE_LABELS } from "@features/vehicles/domain";

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Formatea Date | null a string legible en español.
 */
function formatDate(date: Date | null): string {
  if (!date) return "—";
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Revisa si una fecha ya expiró.
 */
function isExpired(date: Date | null): boolean {
  if (!date) return false;
  return date < new Date();
}

/**
 * Revisa si una fecha está próxima a vencer (dentro de N días).
 */
function isExpiringSoon(date: Date | null, days: number = 30): boolean {
  if (!date) return false;
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 && diffDays <= days;
}

/**
 * Determina el tipo de alerta para una fecha de vencimiento.
 */
function getDateAlert(date: Date | null): "expired" | "warning" | undefined {
  if (isExpired(date)) return "expired";
  if (isExpiringSoon(date)) return "warning";
  return undefined;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("vehicles", "update");
  const { data, isLoading } = useVehicle(id!);

  const vehicle = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Vehículo no encontrado</p>
      </div>
    );
  }

  const { capacities, documentation } = vehicle;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/vehicles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">
                {vehicle.unitNumber}
              </h1>
              <VehicleStatusBadge status={vehicle.status} />
            </div>
            <p className="text-muted-foreground">
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canUpdate && vehicle.status !== "out_of_service" && (
            <Button
              variant="outline"
              onClick={() => navigate(`/vehicles/${vehicle.id}/edit`)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
          )}
          <VehicleActions vehicle={vehicle} />
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Identification */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Truck className="h-5 w-5" />
              Identificación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow label="Número de Unidad" value={vehicle.unitNumber} />
            <DetailRow label="Placa" value={vehicle.licensePlate} />
            <DetailRow label="VIN" value={vehicle.vin || "—"} />
            <DetailRow label="Tipo" value={VEHICLE_TYPE_LABELS[vehicle.type]} />
            <Separator />
            <DetailRow label="Marca" value={vehicle.brand} />
            <DetailRow label="Modelo" value={vehicle.model} />
            <DetailRow label="Año" value={String(vehicle.year)} />
            <DetailRow label="Color" value={vehicle.color || "—"} />
          </CardContent>
        </Card>

        {/* Capacities & Mileage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gauge className="h-5 w-5" />
              Capacidades y Operación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Kilometraje Actual"
              value={`${vehicle.currentMileage.toLocaleString("es-MX")} km`}
            />
            <Separator />
            <DetailRow
              label="Capacidad de Carga"
              value={
                capacities.loadCapacity ? `${capacities.loadCapacity} ton` : "—"
              }
            />
            <DetailRow
              label="Capacidad de Volumen"
              value={
                capacities.volumeCapacity
                  ? `${capacities.volumeCapacity} m³`
                  : "—"
              }
            />
            <DetailRow
              label="Tanque de Combustible"
              value={
                capacities.fuelTankCapacity
                  ? `${capacities.fuelTankCapacity} L`
                  : "—"
              }
            />
            <DetailRow
              label="Rendimiento Esperado"
              value={
                capacities.expectedFuelEfficiency
                  ? `${capacities.expectedFuelEfficiency} Km/L`
                  : "—"
              }
            />
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5" />
              Documentación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Póliza de Seguro"
              value={documentation.insurancePolicy || "—"}
            />
            <DetailRow
              label="Vigencia del Seguro"
              value={formatDate(documentation.insuranceExpiry)}
              alert={getDateAlert(documentation.insuranceExpiry)}
            />
            <Separator />
            <DetailRow
              label="Permiso SCT"
              value={documentation.sctPermitNumber || "—"}
            />
            <DetailRow
              label="Vigencia Permiso SCT"
              value={formatDate(documentation.sctPermitExpiry)}
              alert={getDateAlert(documentation.sctPermitExpiry)}
            />
          </CardContent>
        </Card>

        {/* System Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Información del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <DetailRow
              label="Fecha de Registro"
              value={formatDate(vehicle.createdAt)}
            />
            <DetailRow
              label="Última Actualización"
              value={formatDate(vehicle.updatedAt)}
            />
            <DetailRow label="Activo" value={vehicle.isActive ? "Sí" : "No"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER COMPONENT
// ============================================================================

function DetailRow({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: "expired" | "warning";
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm font-medium flex items-center gap-1.5 ${
          alert === "expired"
            ? "text-red-600"
            : alert === "warning"
              ? "text-yellow-600"
              : ""
        }`}
      >
        {alert && <AlertTriangle className="h-3.5 w-3.5" />}
        {value}
      </span>
    </div>
  );
}
