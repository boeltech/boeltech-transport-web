/**
 * VehicleDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de vehículo: capacidades, ficha operativa y documentación.
 */

import { Link, useParams } from "react-router-dom";
import { useMasterDetailWayfinding } from "@shared/utils/masterWayfinding";
import { cn } from "@shared/lib/utils/cn";
import { useTabParam } from "@shared/hooks";
import { DetailPageShell } from "@shared/ui/page-shells";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import {
  Truck,
  Gauge,
  AlertTriangle,
  Fuel,
  Package,
  Route,
} from "lucide-react";
import { useVehicle } from "../../application";
import {
  VehicleStatus,
  VEHICLE_TYPE_LABELS,
  assessVehicleTypeConfigCoherence,
  type Vehicle,
  type VehicleTypeValue,
} from "../../domain";
import {
  VehicleLifecycleBadge,
  VehicleStatusBadge,
} from "../config/vehicleStatusConfig";
import { VehicleActions } from "../components/VehicleActions";
import { VehicleDeactivatedAlert } from "../components/VehicleDeactivatedAlert";
import { VehicleDetailDocumentsTab } from "../components/VehicleDetailDocumentsTab";
import { VehicleDetailHeaderSubtitle } from "../components/VehicleDetailHeaderSubtitle";
import { VehicleDetailUnitTab } from "../components/VehicleDetailUnitTab";
import { VehicleTypeConfigCoherenceAlert } from "../components/VehicleTypeConfigCoherenceAlert";
import { vehiclesCopy } from "../copy";
import {
  getDaysUntilDateString,
  isExpired,
  isExpiringSoon,
} from "@shared/utils/dateUtils";
import { usePermissions } from "@shared/permissions";

const copy = vehiclesCopy.detail;

/** Tabs enlazables por `?tab=` (deep-link de alertas de documentación). */
const VEHICLE_DETAIL_TABS = ["unit", "documents"] as const;

/**
 * Estado de un documento operativo (seguro RC / permiso SCT) para la alerta del detalle.
 * Paridad conceptual con el clasificador de asignación (ADR-0066, `useVehicles`):
 * `missing` y `noExpiry` bloquean la asignación (hard); `expired` es liberable con permiso.
 */
type DocumentAlertStatus =
  | "missing"
  | "noExpiry"
  | "expired"
  | "expiringSoon"
  | "ok";

function hasText(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function classifyDocument(
  documentNumber: string | null,
  expirationDate: string | null,
): DocumentAlertStatus {
  if (!hasText(expirationDate)) {
    return hasText(documentNumber) ? "noExpiry" : "missing";
  }
  if (isExpired(expirationDate)) return "expired";
  if (isExpiringSoon(expirationDate)) return "expiringSoon";
  return "ok";
}

function documentAlertText(
  status: DocumentAlertStatus,
  expirationDate: string | null,
): string | null {
  switch (status) {
    case "missing":
      return copy.alert.notRegistered;
    case "noExpiry":
      return copy.alert.noExpiry;
    case "expired":
      return copy.alert.expired;
    case "expiringSoon":
      return copy.alert.expiresIn(getDaysUntilDateString(expirationDate) ?? 0);
    default:
      return null;
  }
}

function buildDocumentAlerts(vehicle: Vehicle) {
  const { documentation } = vehicle;
  const docs = [
    {
      label: copy.alert.insuranceLabel,
      status: classifyDocument(
        documentation.insurancePolicy,
        documentation.insuranceExpiry,
      ),
      expirationDate: documentation.insuranceExpiry,
    },
    {
      label: copy.alert.sctLabel,
      status: classifyDocument(
        documentation.sctPermitNumber,
        documentation.sctPermitExpiry,
      ),
      expirationDate: documentation.sctPermitExpiry,
    },
  ];

  const documentAlertItems: { label: string; text: string }[] = [];
  for (const doc of docs) {
    const text = documentAlertText(doc.status, doc.expirationDate);
    if (text) documentAlertItems.push({ label: doc.label, text });
  }

  const hasMissing = docs.some(
    (d) => d.status === "missing" || d.status === "noExpiry",
  );
  const hasExpired = docs.some((d) => d.status === "expired");
  const severity: "critical" | "warning" =
    hasMissing || hasExpired ? "critical" : "warning";
  const title = hasMissing
    ? copy.alert.documentsMissingTitle
    : hasExpired
      ? copy.alert.documentsExpiredTitle
      : copy.alert.documentsExpiringTitle;

  return {
    hasDocumentAlerts: documentAlertItems.length > 0,
    documentAlertItems,
    severity,
    title,
  };
}

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const vehicleId = id || "";
  const { backHref, backLabel } = useMasterDetailWayfinding(
    "/vehicles",
    copy.state.backToList,
  );
  const { activeTab, setActiveTab } = useTabParam(VEHICLE_DETAIL_TABS, "unit");
  const { hasPermission } = usePermissions();
  const canEdit = hasPermission("vehicles", "update");

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
          backHref,
          backLabel,
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
          backHref,
          backLabel,
          icon: <Truck className="h-6 w-6" />,
          title: copy.title.fallback,
        }}
      />
    );
  }

  const { capacities } = vehicle;
  const isDeactivated = !vehicle.isActive;
  const typeLabel =
    VEHICLE_TYPE_LABELS[vehicle.type as VehicleTypeValue] || vehicle.type;
  const documentAlerts = buildDocumentAlerts(vehicle);
  // Una unidad dada de baja no opera: sus vencimientos de documentos no exigen acción.
  const hasDocumentAlerts = !isDeactivated && documentAlerts.hasDocumentAlerts;
  const {
    documentAlertItems,
    severity: documentAlertSeverity,
    title: documentAlertTitle,
  } = documentAlerts;
  // Aviso soft tipo ↔ ConfigVehicular (PRD D4): debajo de docs; oculto en baja.
  const configCode = vehicle.cartaPorte.satConfigAutotransporteCode ?? "";
  const typeConfigCoherence = assessVehicleTypeConfigCoherence(
    vehicle.type,
    configCode,
  );
  const showTypeConfigAlert =
    !isDeactivated && typeConfigCoherence.status === "mismatch";

  const documentAlertCard = hasDocumentAlerts ? (
    <DetailAlertCard
      key="documents"
      severity={documentAlertSeverity}
      icon={
        <AlertTriangle
          className={cn(
            "h-5 w-5",
            documentAlertSeverity === "critical"
              ? "text-destructive"
              : "text-warning",
          )}
        />
      }
      title={documentAlertTitle}
      items={documentAlertItems}
      action={
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setActiveTab("documents")}
          >
            {copy.alert.goToDocuments}
          </Button>
          {canEdit ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <Link to={`/vehicles/${vehicle.id}/edit`}>
                {copy.alert.goToEdit}
              </Link>
            </Button>
          ) : null}
        </>
      }
    />
  ) : null;

  const typeConfigAlertCard =
    showTypeConfigAlert && typeConfigCoherence.status === "mismatch" ? (
      <VehicleTypeConfigCoherenceAlert
        key="type-config"
        vehicleId={vehicle.id}
        type={vehicle.type}
        configCode={configCode}
        configFamily={typeConfigCoherence.configFamily}
        canEdit={canEdit}
      />
    ) : null;

  const activeAlerts = isDeactivated ? (
    <VehicleDeactivatedAlert vehicle={vehicle} />
  ) : documentAlertCard || typeConfigAlertCard ? (
    <div className="space-y-3">
      {documentAlertCard}
      {typeConfigAlertCard}
    </div>
  ) : null;

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref,
        backLabel,
        icon: <Truck className="h-6 w-6" />,
        iconVariant:
          !vehicle.isActive || vehicle.status === VehicleStatus.OUT_OF_SERVICE
            ? "muted"
            : "primary",
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0">{vehicle.unitNumber}</span>
            {isDeactivated ? (
              <VehicleLifecycleBadge status="deactivated" showIcon size="sm" />
            ) : (
              <VehicleStatusBadge status={vehicle.status} showIcon size="sm" />
            )}
          </span>
        ),
        subtitle: (
          <VehicleDetailHeaderSubtitle
            typeLabel={typeLabel}
            licensePlate={vehicle.licensePlate}
            brand={vehicle.brand}
            model={vehicle.model}
            year={vehicle.year}
          />
        ),
        actions: (
          <VehicleActions
            vehicle={vehicle}
            variant="buttons"
            onActionComplete={refetchVehicle}
          />
        ),
      }}
      alerts={activeAlerts}
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
        defaultValue: "unit",
        value: activeTab,
        onValueChange: setActiveTab,
        items: [
          {
            value: "unit",
            label: copy.tab.unit,
            content: <VehicleDetailUnitTab vehicle={vehicle} />,
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
            content: <VehicleDetailDocumentsTab vehicle={vehicle} />,
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
