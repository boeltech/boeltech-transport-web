/**
 * VehicleDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de vehículo: capacidades, ficha operativa y documentación.
 */

import { useParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { useTabParam } from "@shared/hooks";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { DetailAlertCard } from "@shared/ui/data-display";
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
  type Vehicle,
  type VehicleTypeValue,
} from "../../domain";
import { VehicleStatusBadge } from "../config/vehicleStatusConfig";
import { VehicleActions } from "../components/VehicleActions";
import { VehicleDetailDocumentsTab } from "../components/VehicleDetailDocumentsTab";
import { VehicleDetailHeaderSubtitle } from "../components/VehicleDetailHeaderSubtitle";
import { VehicleDetailUnitTab } from "../components/VehicleDetailUnitTab";
import { vehiclesCopy } from "../copy";
import {
  getDaysUntilDateString,
  isExpired,
  isExpiringSoon,
} from "@shared/utils/dateUtils";

const copy = vehiclesCopy.detail;

/** Tabs enlazables por `?tab=` (deep-link de alertas de documentación). */
const VEHICLE_DETAIL_TABS = ["unit", "documents"] as const;

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
  const { activeTab, setActiveTab } = useTabParam(VEHICLE_DETAIL_TABS, "unit");

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

  const { capacities } = vehicle;
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
