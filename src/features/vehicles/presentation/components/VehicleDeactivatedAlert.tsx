import { Archive } from "lucide-react";
import { DetailAlertCard } from "@shared/ui/data-display";
import { formatDate } from "@shared/utils/dateUtils";
import {
  VEHICLE_DEACTIVATION_REASON_LABELS,
  type Vehicle,
} from "../../domain";
import { vehiclesCopy } from "../copy";

const copy = vehiclesCopy.detail.deactivated;

interface VehicleDeactivatedAlertProps {
  vehicle: Pick<
    Vehicle,
    | "deactivatedAt"
    | "deactivatedByName"
    | "deactivationReasonCode"
    | "deactivationNote"
  >;
}

/** PRD D4 — tarjeta informativa al inicio del detalle de una unidad dada de baja. */
export function VehicleDeactivatedAlert({ vehicle }: VehicleDeactivatedAlertProps) {
  const reasonLabel = vehicle.deactivationReasonCode
    ? (VEHICLE_DEACTIVATION_REASON_LABELS[vehicle.deactivationReasonCode] ??
      vehicle.deactivationReasonCode)
    : copy.reasonNotRecorded;
  const note = vehicle.deactivationNote?.trim() || null;
  const author = vehicle.deactivatedByName?.trim() || null;

  return (
    <DetailAlertCard
      severity="info"
      icon={<Archive className="h-5 w-5" />}
      title={copy.title}
    >
      <div className="space-y-1" data-testid="vehicle-deactivated-alert">
        {vehicle.deactivatedAt ? (
          <p>{copy.when(formatDate(vehicle.deactivatedAt), author)}</p>
        ) : null}
        <p>{copy.reason(reasonLabel, note)}</p>
        <p>{copy.impact}</p>
      </div>
    </DetailAlertCard>
  );
}
