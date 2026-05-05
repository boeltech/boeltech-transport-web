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

import { useParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Separator } from "@shared/ui/separator";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import {
  DetailAlertCard,
  InfoRow,
  DocumentRow,
  SatFieldLabel,
} from "@shared/ui/data-display";
import {
  Truck,
  Gauge,
  FileText,
  Calendar,
  AlertTriangle,
  Fuel,
  Package,
  Shield,
  Route,
  Wrench,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Application Layer
import { useVehicle } from "../../application";

// Domain
import {
  VehicleStatus,
  VEHICLE_TYPE_LABELS,
  type VehicleTypeValue,
} from "../../domain";

// Presentation
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { VehicleActions } from "../components/VehicleActions";
import {
  formatDate,
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
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

  if (!vehicle) {
    return (
      <DetailPageShell
        isLoading={isLoading}
        notFound
        notFoundConfig={{
          icon: <Truck />,
          title: "Vehículo no encontrado",
          description: "El vehículo que buscas no existe o fue eliminado.",
          backHref: "/vehicles",
          backLabel: "Volver a Vehículos",
        }}
        header={{
          backHref: "/vehicles",
          icon: <Truck className="h-6 w-6" />,
          title: "Vehículo",
        }}
      />
    );
  }

  const { capacities, documentation, cartaPorte } = vehicle;

  function fmtOptional(s: string | null): string {
    return s?.trim() ? s : "—";
  }

  function fmtPeso(ton: number | null): string {
    if (ton === null) return "—";
    return `${new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    }).format(ton)} t`;
  }

  const insuranceExpired = isExpired(documentation.insuranceExpiry);
  const insuranceExpiringSoon = isExpiringSoon(documentation.insuranceExpiry);
  const sctExpired = isExpired(documentation.sctPermitExpiry);
  const sctExpiringSoon = isExpiringSoon(documentation.sctPermitExpiry);

  const hasDocumentAlerts =
    insuranceExpired || insuranceExpiringSoon || sctExpired || sctExpiringSoon;

  const documentAlertItems: { label: string; text: string }[] = [];
  if (insuranceExpired || insuranceExpiringSoon) {
    documentAlertItems.push({
      label: "Seguro",
      text: insuranceExpired
        ? "Vencido"
        : `Vence en ${getDaysUntilDateString(documentation.insuranceExpiry)} días`,
    });
  }
  if (sctExpired || sctExpiringSoon) {
    documentAlertItems.push({
      label: "Permiso SCT",
      text: sctExpired
        ? "Vencido"
        : `Vence en ${getDaysUntilDateString(documentation.sctPermitExpiry)} días`,
    });
  }

  return (
    <DetailPageShell
      isLoading={isLoading}
      header={{
        backHref: "/vehicles",
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          !vehicle.isActive || vehicle.status === VehicleStatus.OUT_OF_SERVICE
            ? "muted"
            : "primary",
        title: vehicle.unitNumber,
        subtitle: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        statusBadge: <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />,
        actions: (
          <VehicleActions
            vehicleId={vehicle.id}
            vehicleName={vehicle.unitNumber}
            status={vehicle.status}
            variant="buttons"
            onActionComplete={refetchVehicle}
          />
        ),
      }}
      alerts={
        hasDocumentAlerts ? (
          <DetailAlertCard
            severity={insuranceExpired || sctExpired ? "critical" : "warning"}
            icon={
              <AlertTriangle
                className={cn(
                  "h-5 w-5",
                  insuranceExpired || sctExpired
                    ? "text-destructive"
                    : "text-amber-500",
                )}
              />
            }
            title={
              insuranceExpired || sctExpired
                ? "Documentos vencidos"
                : "Documentos próximos a vencer"
            }
            items={documentAlertItems}
          />
        ) : null
      }
      stats={[
        {
          title: "Kilometraje",
          value: `${formatNumber(vehicle.currentMileage)} km`,
          icon: <Gauge className="h-5 w-5 text-primary" />,
        },
        {
          title: "Capacidad de Carga",
          value:
            capacities.loadCapacity ? `${capacities.loadCapacity} ton` : "—"
          ,
          icon: <Package className="h-5 w-5 text-blue-500" />,
        },
        {
          title: "Tanque",
          value:
            capacities.fuelTankCapacity
              ? `${capacities.fuelTankCapacity} L`
              : "—"
          ,
          icon: <Fuel className="h-5 w-5 text-amber-500" />,
        },
        {
          title: "Rendimiento",
          value:
            capacities.expectedFuelEfficiency
              ? `${capacities.expectedFuelEfficiency} km/L`
              : "—"
          ,
          icon: <Route className="h-5 w-5 text-green-500" />,
        },
      ]}
      tabs={{
        defaultValue: "info",
        items: [
          {
            value: "info",
            label: "Información",
            content: (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="h-4 w-4" /> Identificación
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow
                        variant="inline"
                        label="Número de unidad"
                        value={<span className="font-mono">{vehicle.unitNumber}</span>}
                      />
                      <InfoRow
                        variant="inline"
                        label="Placa"
                        value={<span className="font-mono">{vehicle.licensePlate}</span>}
                      />
                      <InfoRow
                        variant="inline"
                        label="VIN"
                        value={
                          vehicle.vin ? (
                            <span className="font-mono text-xs">{vehicle.vin}</span>
                          ) : (
                            "No registrado"
                          )
                        }
                      />
                      <Separator className="my-2" />
                      <InfoRow
                        variant="inline"
                        label="Tipo de vehículo"
                        value={
                          VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] ||
                          vehicle.type
                        }
                      />
                      {vehicle.color ? (
                        <InfoRow
                          variant="inline"
                          label="Color"
                          value={
                            <span className="inline-flex items-center gap-2">
                              <span
                                className="h-3 w-3 shrink-0 rounded-full bg-muted ring-1 ring-border"
                                aria-hidden
                              />
                              {vehicle.color}
                            </span>
                          }
                        />
                      ) : null}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Gauge className="h-4 w-4" /> Características
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow variant="inline" label="Marca" value={vehicle.brand} />
                      <InfoRow variant="inline" label="Modelo" value={vehicle.model} />
                      <InfoRow variant="inline" label="Año" value={vehicle.year} />
                      <Separator className="my-2" />
                      <InfoRow
                        variant="inline"
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

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="inline-flex flex-wrap items-center gap-2">
                        Carta Porte 3.1 — Autotransporte
                        <Badge
                          variant="outline"
                          className="px-1.5 py-0 text-[10px] font-medium"
                        >
                          SAT
                        </Badge>
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Tipo de Permiso SCT"
                          satCode="PermSCT"
                        />
                      }
                      value={
                        cartaPorte.satTipoPermisoCode ? (
                          <span className="font-mono text-xs">
                            {cartaPorte.satTipoPermisoCode}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Configuración vehicular"
                          satCode="ConfigVehicular"
                        />
                      }
                      value={
                        cartaPorte.satConfigAutotransporteCode ? (
                          <span className="font-mono text-xs">
                            {cartaPorte.satConfigAutotransporteCode}
                          </span>
                        ) : (
                          "—"
                        )
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Peso bruto vehicular"
                          satCode="PesoBrutoVehicular"
                        />
                      }
                      value={fmtPeso(cartaPorte.pesoBrutoVehicular)}
                    />
                    <Separator className="my-2" />
                    <p className="mb-3 text-sm font-medium">
                      Seguros (Carta Porte)
                    </p>
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Aseguradora Resp. Civil"
                          satCode="AseguraRespCivil"
                        />
                      }
                      value={fmtOptional(cartaPorte.insuranceCompany)}
                    />
                    <p className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Opcionales (valores predeterminados)
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Estos seguros se usan como base del vehículo para Carta
                      Porte; en la operación pueden cambiar por viaje/carga.
                    </p>
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Aseguradora Medio Ambiente"
                          satCode="AseguraMedioAmbiente"
                        />
                      }
                      value={fmtOptional(cartaPorte.aseguraMedioAmbiente)}
                    />
                    <InfoRow
                      variant="inline"
                      label={
                        <SatFieldLabel
                          label="Póliza Medio Ambiente"
                          satCode="PolizaMedioAmbiente"
                        />
                      }
                      value={fmtOptional(cartaPorte.polizaMedioAmbiente)}
                    />
                    <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
                      El seguro de la mercancía (aseguradora y póliza de carga) se
                      registra por carga en el viaje, no en el vehículo.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calendar className="h-4 w-4" /> Estado del sistema
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 gap-0 sm:grid-cols-3">
                      <InfoRow
                        variant="inline"
                        label="Estado"
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            {vehicle.isActive ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                            )}
                            {vehicle.isActive ? "Activo" : "Inactivo"}
                          </span>
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label="Fecha de registro"
                        value={formatDate(vehicle.createdAt.toISOString().split("T")[0])}
                      />
                      <InfoRow
                        variant="inline"
                        label="Última actualización"
                        value={formatDate(vehicle.updatedAt.toISOString().split("T")[0])}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "documents",
            label: (
              <span className="inline-flex items-center">
                Documentos
                {hasDocumentAlerts ? (
                  <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
                ) : null}
              </span>
            ),
            content: (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4" /> Documentación Vigente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentRow
                      label={
                        <SatFieldLabel
                          label="Póliza Resp. Civil"
                          satCode="PolizaRespCivil"
                        />
                      }
                      documentNumber={documentation.insurancePolicy}
                      expirationDate={documentation.insuranceExpiry}
                    />
                    <DocumentRow
                      label={
                        <SatFieldLabel
                          label="Número de Permiso SCT"
                          satCode="NumPermisoSCT"
                        />
                      }
                      documentNumber={documentation.sctPermitNumber}
                      expirationDate={documentation.sctPermitExpiry}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Gestión de documentos próximamente
                    </p>
                    <Badge variant="outline">Módulo en construcción</Badge>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "maintenance",
            label: "Mantenimiento",
            content: (
              <Card>
                <CardContent className="py-12 text-center">
                  <Wrench className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Historial de mantenimiento próximamente
                  </p>
                  <Badge variant="outline">Módulo en construcción</Badge>
                </CardContent>
              </Card>
            ),
          },
        ],
      }}
      metadata={{
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        createdBy: vehicle.createdBy ?? undefined,
      }}
    />
  );
}

export default VehicleDetailPage;
