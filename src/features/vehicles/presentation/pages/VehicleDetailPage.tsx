/**
 * VehicleDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de vehículo con KPIs operativos, resumen, documentación y Carta Porte.
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
  DetailSection,
  DocumentRow,
  InfoRow,
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
  ClipboardList,
} from "lucide-react";
import { useVehicle } from "../../application";
import {
  VehicleStatus,
  VEHICLE_TYPE_LABELS,
  type Vehicle,
  type VehicleTypeValue,
} from "../../domain";
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { VehicleActions } from "../components/VehicleActions";
import { VehicleDetailHeaderSubtitle } from "../components/VehicleDetailHeaderSubtitle";
import { vehiclesCopy } from "../copy";
import {
  formatDate,
  getDaysUntilDateString,
  isExpired,
  isExpiringSoon,
} from "@shared/utils/dateUtils";

const copy = vehiclesCopy.detail;

function fmtOptional(s: string | null): string {
  return s?.trim() ? s : copy.hint.empty;
}

function fmtPeso(ton: number | null): string {
  if (ton === null) return copy.hint.empty;
  return copy.format.pesoBruto(ton);
}

function buildDocumentAlerts(vehicle: Vehicle) {
  const { documentation } = vehicle;
  const insuranceExpired = isExpired(documentation.insuranceExpiry);
  const insuranceExpiringSoon = isExpiringSoon(documentation.insuranceExpiry);
  const sctExpired = isExpired(documentation.sctPermitExpiry);
  const sctExpiringSoon = isExpiringSoon(documentation.sctPermitExpiry);

  const hasDocumentAlerts =
    insuranceExpired ||
    insuranceExpiringSoon ||
    sctExpired ||
    sctExpiringSoon;

  const documentAlertItems: { label: string; text: string }[] = [];
  if (insuranceExpired || insuranceExpiringSoon) {
    documentAlertItems.push({
      label: copy.alert.insuranceLabel,
      text: insuranceExpired
        ? copy.alert.expired
        : copy.alert.expiresIn(
            getDaysUntilDateString(documentation.insuranceExpiry) ?? 0,
          ),
    });
  }
  if (sctExpired || sctExpiringSoon) {
    documentAlertItems.push({
      label: copy.alert.sctLabel,
      text: sctExpired
        ? copy.alert.expired
        : copy.alert.expiresIn(
            getDaysUntilDateString(documentation.sctPermitExpiry) ?? 0,
          ),
    });
  }

  return {
    hasDocumentAlerts,
    documentAlertItems,
    insuranceExpired,
    sctExpired,
  };
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id || "";

  const {
    data: vehicle,
    isLoading,
    refetch: refetchVehicle,
  } = useVehicle(vehicleId);

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/vehicles",
          icon: <Truck className="h-6 w-6" />,
          title: copy.title.fallback,
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
          title: copy.state.notFoundTitle,
          description: copy.state.notFoundDescription,
          backHref: "/vehicles",
          backLabel: copy.state.backToList,
        }}
        header={{
          backHref: "/vehicles",
          icon: <Truck className="h-6 w-6" />,
          title: copy.title.fallback,
        }}
      />
    );
  }

  const { capacities, documentation, cartaPorte } = vehicle;
  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] || vehicle.type;
  const {
    hasDocumentAlerts,
    documentAlertItems,
    insuranceExpired,
    sctExpired,
  } = buildDocumentAlerts(vehicle);

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
          <VehicleDetailHeaderSubtitle
            typeLabel={typeLabel}
            licensePlate={vehicle.licensePlate}
            brand={vehicle.brand}
            model={vehicle.model}
            year={vehicle.year}
            isActive={vehicle.isActive}
          />
        ),
        statusBadge: (
          <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />
        ),
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
                    : "text-warning",
                )}
              />
            }
            title={
              insuranceExpired || sctExpired
                ? copy.alert.documentsExpiredTitle
                : copy.alert.documentsExpiringTitle
            }
            items={documentAlertItems}
          />
        ) : null
      }
      stats={[
        {
          title: copy.stat.mileage.title,
          value: copy.format.statMileage(vehicle.currentMileage),
          tone: "primary",
          icon: <Gauge className="h-5 w-5" />,
          description: copy.stat.mileage.description,
        },
        {
          title: copy.stat.load.title,
          value: capacities.loadCapacity
            ? copy.format.statLoad(capacities.loadCapacity)
            : copy.hint.empty,
          tone: "info",
          icon: <Package className="h-5 w-5" />,
          description: copy.stat.load.description(capacities.volumeCapacity),
        },
        {
          title: copy.stat.fuelTank.title,
          value: capacities.fuelTankCapacity
            ? copy.format.statFuel(capacities.fuelTankCapacity)
            : copy.hint.empty,
          tone: "warning",
          icon: <Fuel className="h-5 w-5" />,
          description: copy.stat.fuelTank.description,
        },
        {
          title: copy.stat.efficiency.title,
          value: capacities.expectedFuelEfficiency
            ? copy.format.statEfficiency(capacities.expectedFuelEfficiency)
            : copy.hint.empty,
          tone: "success",
          icon: <Route className="h-5 w-5" />,
          description: copy.stat.efficiency.description,
        },
      ]}
      tabs={{
        defaultValue: "summary",
        items: [
          {
            value: "summary",
            label: copy.tab.summary,
            content: (
              <div className="space-y-8">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Truck className="h-4 w-4 shrink-0 text-primary" />
                        {copy.section.unitData.title}
                      </CardTitle>
                      <CardDescription>
                        {copy.section.unitData.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.unitData.groupIdentification}
                        </p>
                        <InfoRow
                          variant="inline"
                          label={copy.label.unitNumber}
                          value={
                            <span className="font-mono font-medium">
                              {vehicle.unitNumber}
                            </span>
                          }
                          copyable
                          copyValue={vehicle.unitNumber}
                          mono
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.licensePlate}
                          value={vehicle.licensePlate}
                          copyable
                          copyValue={vehicle.licensePlate}
                          mono
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.vin}
                          value={vehicle.vin ?? copy.hint.empty}
                          copyable={Boolean(vehicle.vin)}
                          copyValue={vehicle.vin ?? undefined}
                          mono
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.vehicleType}
                          value={typeLabel}
                        />
                        {vehicle.color ? (
                          <InfoRow
                            variant="inline"
                            label={copy.label.color}
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
                      </div>

                      <Separator />

                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.unitData.groupSpecs}
                        </p>
                        <InfoRow
                          variant="inline"
                          label={copy.label.brand}
                          value={vehicle.brand}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.model}
                          value={vehicle.model}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.year}
                          value={vehicle.year}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.volumeCapacity}
                          value={
                            capacities.volumeCapacity
                              ? copy.format.volume(capacities.volumeCapacity)
                              : copy.hint.emptyOptional
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Calendar className="h-4 w-4 shrink-0 text-primary" />
                        {copy.section.registry.title}
                      </CardTitle>
                      <CardDescription>
                        {copy.section.registry.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow
                        variant="inline"
                        label={copy.label.operationalStatus}
                        value={
                          <VehicleStatusBadge
                            status={vehicle.status}
                            showIcon
                            size="sm"
                          />
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.registryStatus}
                        value={
                          <span className="inline-flex items-center gap-1.5">
                            {vehicle.isActive ? (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                            ) : (
                              <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                            )}
                            {vehicle.isActive
                              ? copy.format.active
                              : copy.format.inactive}
                          </span>
                        }
                      />
                      <Separator className="my-3" />
                      <InfoRow
                        variant="inline"
                        label={copy.label.createdAt}
                        value={formatDate(
                          vehicle.createdAt.toISOString().split("T")[0],
                        )}
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.updatedAt}
                        value={formatDate(
                          vehicle.updatedAt.toISOString().split("T")[0],
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>

                <DetailSection
                  icon={<FileText className="h-4 w-4" />}
                  title={
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {copy.section.cartaPorte.title}
                      <Badge
                        variant="outline"
                        className="px-1.5 py-0 text-[10px] font-medium"
                      >
                        SAT
                      </Badge>
                    </span>
                  }
                  description={copy.section.cartaPorte.description}
                >
                  <Card>
                    <CardContent className="space-y-6 pt-6">
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.cartaPorte.groupSat}
                        </p>
                        <div className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
                          <InfoRow
                            variant="inline"
                            label={
                              <SatFieldLabel
                                label="Tipo de permiso SCT"
                                satCode="PermSCT"
                              />
                            }
                            value={
                              cartaPorte.satTipoPermisoCode ? (
                                <span className="font-mono text-xs">
                                  {cartaPorte.satTipoPermisoCode}
                                </span>
                              ) : (
                                copy.hint.empty
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
                                copy.hint.empty
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
                        </div>
                      </div>

                      <Separator />

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.cartaPorte.groupTrailers}
                        </p>
                        {cartaPorte.remolques.length > 0 ? (
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {cartaPorte.remolques.map((remolque) => (
                              <div
                                key={`${remolque.position}-${remolque.licensePlate}`}
                                className="rounded-lg border bg-muted/30 p-3"
                              >
                                <p className="mb-2 text-sm font-medium">
                                  {copy.label.trailerPosition(remolque.position)}
                                </p>
                                <InfoRow
                                  variant="inline"
                                  label={
                                    <SatFieldLabel
                                      label="Subtipo"
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
                                      label="Placa"
                                      satCode="Placa"
                                    />
                                  }
                                  value={
                                    <span className="font-mono text-xs">
                                      {remolque.licensePlate}
                                    </span>
                                  }
                                  copyable
                                  copyValue={remolque.licensePlate}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            {copy.hint.noTrailers}
                          </p>
                        )}
                      </div>

                      <Separator />

                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.cartaPorte.groupInsurance}
                        </p>
                        <InfoRow
                          variant="inline"
                          label={
                            <SatFieldLabel
                              label="Aseguradora RC"
                              satCode="AseguraRespCivil"
                            />
                          }
                          value={fmtOptional(cartaPorte.insuranceCompany)}
                        />
                        <div className="my-4 rounded-lg border border-dashed bg-muted/20 px-3 py-3">
                          <p className="text-sm font-medium">
                            {copy.section.cartaPorte.optionalInsuranceTitle}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {copy.section.cartaPorte.optionalInsuranceHint}
                          </p>
                        </div>
                        <InfoRow
                          variant="inline"
                          label={
                            <SatFieldLabel
                              label="Aseguradora medio ambiente"
                              satCode="AseguraMedioAmbiente"
                            />
                          }
                          value={fmtOptional(cartaPorte.aseguraMedioAmbiente)}
                        />
                        <InfoRow
                          variant="inline"
                          label={
                            <SatFieldLabel
                              label="Póliza medio ambiente"
                              satCode="PolizaMedioAmbiente"
                            />
                          }
                          value={fmtOptional(cartaPorte.polizaMedioAmbiente)}
                        />
                        <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
                          {copy.section.cartaPorte.cargoInsuranceFootnote}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </DetailSection>
              </div>
            ),
          },
          {
            value: "documents",
            label: (
              <span className="inline-flex items-center">
                {copy.tab.documents}
                {hasDocumentAlerts ? (
                  <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-warning" />
                ) : null}
              </span>
            ),
            content: (
              <div className="space-y-8">
                <DetailSection
                  icon={<Shield className="h-4 w-4" />}
                  title={copy.section.documents.title}
                  description={copy.section.documents.description}
                >
                  <Card>
                    <CardContent className="pt-6">
                      <DocumentRow
                        label={
                          <SatFieldLabel
                            label="Póliza RC"
                            satCode="PolizaRespCivil"
                          />
                        }
                        documentNumber={documentation.insurancePolicy}
                        expirationDate={documentation.insuranceExpiry}
                      />
                      <DocumentRow
                        label={
                          <SatFieldLabel
                            label="Número de permiso SCT"
                            satCode="NumPermisoSCT"
                          />
                        }
                        documentNumber={documentation.sctPermitNumber}
                        expirationDate={documentation.sctPermitExpiry}
                      />
                    </CardContent>
                  </Card>
                </DetailSection>

                <DetailSection
                  icon={<ClipboardList className="h-4 w-4" />}
                  title={copy.section.attachments.title}
                  description={copy.section.attachments.description}
                >
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <Badge variant="outline" className="mt-5">
                        {copy.section.attachments.badge}
                      </Badge>
                    </CardContent>
                  </Card>
                </DetailSection>
              </div>
            ),
          },
          {
            value: "maintenance",
            label: copy.tab.maintenance,
            content: (
              <DetailSection
                icon={<Wrench className="h-4 w-4" />}
                title={copy.section.maintenance.title}
                description={copy.section.maintenance.description}
              >
                <Card className="border-dashed">
                  <CardContent className="py-10 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                      <Wrench className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Badge variant="outline" className="mt-5">
                      {copy.section.maintenance.badge}
                    </Badge>
                  </CardContent>
                </Card>
              </DetailSection>
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
