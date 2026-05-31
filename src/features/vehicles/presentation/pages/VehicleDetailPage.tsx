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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
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

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/vehicles",
          icon: <Truck className="h-6 w-6" />,
          title: "Vehículo",
        }}
      />
    );
  }

  if (!vehicle) {
    return (
      <DetailPageShell
        isLoading={false}
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
      isLoading={false}
      header={{
        backHref: "/vehicles",
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          !vehicle.isActive || vehicle.status === VehicleStatus.OUT_OF_SERVICE
            ? "muted"
            : "primary",
        title: vehicle.unitNumber,
        subtitle: (
          <>
            <span className="font-mono">{vehicle.licensePlate}</span>
            <span className="text-muted-foreground"> · </span>
            <span>
              {vehicle.brand} {vehicle.model} ({vehicle.year})
            </span>
          </>
        ),
        statusBadge: <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />,
        actions: (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <VehicleActions
              vehicleId={vehicle.id}
              vehicleName={vehicle.unitNumber}
              status={vehicle.status}
              variant="buttons"
              onActionComplete={refetchVehicle}
            />
          </div>
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
                    : "text-warning",
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
          tone: "primary",
          icon: <Gauge className="h-5 w-5" />,
          description: "Odómetro actual del vehículo",
        },
        {
          title: "Capacidad de carga",
          value: capacities.loadCapacity ? `${capacities.loadCapacity} t` : "—",
          tone: "info",
          icon: <Package className="h-5 w-5" />,
          description:
            capacities.volumeCapacity != null
              ? `${capacities.volumeCapacity} m³ volumen útil`
              : undefined,
        },
        {
          title: "Tanque",
          value: capacities.fuelTankCapacity
            ? `${capacities.fuelTankCapacity} L`
            : "—",
          tone: "warning",
          icon: <Fuel className="h-5 w-5" />,
          description: "Capacidad del depósito",
        },
        {
          title: "Rendimiento",
          value: capacities.expectedFuelEfficiency
            ? `${capacities.expectedFuelEfficiency} km/L`
            : "—",
          tone: "success",
          icon: <Route className="h-5 w-5" />,
          description: "Consumo esperado (referencia)",
        },
      ]}
      tabs={{
        defaultValue: "info",
        items: [
          {
            value: "info",
            label: "General",
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Truck className="h-4 w-4 shrink-0 text-primary" />
                        Identificación
                      </CardTitle>
                      <CardDescription>
                        Unidad, placa, VIN y clasificación del vehículo.
                      </CardDescription>
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
                      <Separator className="my-3" />
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
                      <CardTitle className="text-base flex items-center gap-2">
                        <Gauge className="h-4 w-4 shrink-0 text-primary" />
                  Características
                      </CardTitle>
                      <CardDescription>
                        Marca, modelo, año y capacidad volumétrica.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow variant="inline" label="Marca" value={vehicle.brand} />
                      <InfoRow variant="inline" label="Modelo" value={vehicle.model} />
                      <InfoRow variant="inline" label="Año" value={vehicle.year} />
                      <Separator className="my-3" />
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

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        Estado en el sistema
                      </CardTitle>
                      <CardDescription>
                        Alta, actividad y vigencia del registro en el ERP.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <InfoRow
                        variant="inline"
                        label="Estado"
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            {vehicle.isActive ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
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
                        value={formatDate(
                          vehicle.createdAt.toISOString().split("T")[0],
                        )}
                      />
                      <InfoRow
                        variant="inline"
                        label="Última actualización"
                        value={formatDate(
                          vehicle.updatedAt.toISOString().split("T")[0],
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex flex-wrap items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-primary" />
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
                    <CardDescription>
                      Datos base del vehículo para el complemento de autotransporte;
                      la operación puede ajustar valores por viaje cuando aplique.
                    </CardDescription>
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
                    <Separator className="my-3" />
                    <p className="mb-2 text-sm font-medium">Remolques</p>
                    {cartaPorte.remolques.length > 0 ? (
                      <div className="space-y-2">
                        {cartaPorte.remolques.map((remolque) => (
                          <div
                            key={`${remolque.position}-${remolque.licensePlate}`}
                            className="rounded-lg border bg-muted/30 p-3"
                          >
                            <InfoRow
                              variant="inline"
                              label={
                                <SatFieldLabel
                                  label={`SubTipoRem #${remolque.position}`}
                                  satCode="SubTipoRem"
                                />
                              }
                              value={
                                <span className="font-mono text-xs">
                                  {remolque.satSubTipoRemCode}
                                </span>
                              }
                            />
                            <InfoRow
                              variant="inline"
                              label={
                                <SatFieldLabel
                                  label={`Placa remolque #${remolque.position}`}
                                  satCode="Placa"
                                />
                              }
                              value={
                                <span className="font-mono text-xs">
                                  {remolque.licensePlate}
                                </span>
                              }
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Sin remolques registrados.
                      </p>
                    )}
                    <Separator className="my-3" />
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
                    <div className="mb-3 rounded-lg border bg-muted/20 px-3 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Opcionales (valores predeterminados)
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Estos seguros se usan como base del vehículo para Carta
                        Porte; en la operación pueden cambiar por viaje/carga.
                      </p>
                    </div>
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
              </div>
            ),
          },
          {
            value: "documents",
            label: (
              <span className="inline-flex items-center">
                Documentos
                {hasDocumentAlerts ? (
                  <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-warning" />
                ) : null}
              </span>
            ),
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="h-4 w-4 shrink-0 text-primary" />
                      Documentación vigente
                    </CardTitle>
                    <CardDescription>
                      Póliza de responsabilidad civil y permiso SCT; vencimientos
                      se resaltan arriba cuando aplican.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
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

                <Card className="border-dashed">
                  <CardContent className="py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="mt-4 text-sm font-medium">
                      Archivos adjuntos y expediente digital
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      La carga y gestión centralizada de documentos llegará en una
                      versión posterior.
                    </p>
                    <Badge variant="outline" className="mt-5">
                      Próximamente
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ),
          },
          {
            value: "maintenance",
            label: "Mantenimiento",
            content: (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Wrench className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm font-medium">
                    Mantenimiento y historial de servicio
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                    Aquí podrás registrar órdenes de trabajo, kilometraje al
                    servicio y documentos del taller.
                  </p>
                  <Badge variant="outline" className="mt-5">
                    Próximamente
                  </Badge>
                </CardContent>
              </Card>
            ),
          },
        ],
      }}
      metadata={{
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
        createdBy:
          vehicle.createdByName?.trim() ||
          vehicle.createdBy?.trim() ||
          undefined,
        updatedBy: vehicle.updatedByName?.trim() || undefined,
      }}
    />
  );
}

export default VehicleDetailPage;
