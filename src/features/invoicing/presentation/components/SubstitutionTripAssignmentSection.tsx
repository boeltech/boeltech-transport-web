import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { useDrivers } from "@features/drivers/application";
import { useAssignableVehicles } from "@features/vehicles/application";
import type { Invoice, InvoiceTripRef } from "@features/invoicing/domain";
import { useTrip } from "@features/trips/application/hooks/trip/useTrip";
import {
  buildAssignableDriversForTripWizard,
} from "@features/trips/presentation/pages/create/tripAssignmentDrivers";
import {
  applyBusyResourcesToVehicles,
} from "@features/trips/presentation/pages/create/tripAssignmentBusyResources";
import { usePermissions } from "@shared/permissions";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Button } from "@shared/ui/button";
import { FieldInlineError } from "@shared/ui/form/FieldInlineError";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import { invoicingCopy } from "../copy/invoicingCopy";
import type { TripCorrectionFormEntry } from "../validation/substitutionCorrectionsSchema";
import {
  DriverSelect,
  VehicleSelect,
} from "@features/trips/presentation/components/assignment/TripAssignmentSelects";
import {
  SUBSTITUTION_COLLAPSIBLE_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS,
  SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS,
  SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS,
} from "./substitutionSheetLayout";

const copy = invoicingCopy.detail.substitute.assignment;
const sheetCopy = invoicingCopy.detail.substitute;
const MIN_REASON_LENGTH = 5;
const MAX_REASON_LENGTH = 500;

interface Props {
  invoice: Invoice;
  tripCorrections: TripCorrectionFormEntry[];
  onSaveCorrection: (entry: TripCorrectionFormEntry) => void;
  sheetOpen: boolean;
}

function TripAssignmentEditor({
  tripRef,
  enabled,
  savedEntry,
  canExecute,
  onSaveCorrection,
}: {
  tripRef: InvoiceTripRef;
  enabled: boolean;
  savedEntry?: TripCorrectionFormEntry;
  canExecute: boolean;
  onSaveCorrection: (entry: TripCorrectionFormEntry) => void;
}) {
  const { data: trip, isLoading: isLoadingTrip } = useTrip(tripRef.tripId, {
    enabled,
  });
  const { data: driversPage, isLoading: isLoadingDrivers } = useDrivers(
    { page: 1, limit: 100 },
    { enabled, refetchOnMount: "always" },
  );
  const { data: vehicles = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles({ enabled, refetchOnMount: "always" });

  const drivers = useMemo(
    () =>
      buildAssignableDriversForTripWizard(driversPage?.data ?? [], new Set()),
    [driversPage?.data],
  );
  const assignableVehicles = useMemo(
    () => applyBusyResourcesToVehicles(vehicles, new Set()),
    [vehicles],
  );

  const [driverId, setDriverId] = useState(
    savedEntry?.driver_id ?? trip?.driverId ?? "",
  );
  const [vehicleId, setVehicleId] = useState(
    savedEntry?.vehicle_id ?? trip?.vehicleId ?? "",
  );
  const [reason, setReason] = useState(savedEntry?.reason ?? "");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  if (!enabled) {
    return null;
  }

  if (isLoadingTrip) {
    return (
      <p className="text-sm text-muted-foreground">
        {copy.loadingTrip(tripRef.tripCode)}
      </p>
    );
  }

  if (!trip) {
    return null;
  }

  const trimmedReasonLength = reason.trim().length;
  const reasonValid = trimmedReasonLength >= MIN_REASON_LENGTH;
  const driverChanged = Boolean(driverId) && driverId !== trip.driverId;
  const vehicleChanged = Boolean(vehicleId) && vehicleId !== trip.vehicleId;
  const hasChanges = driverChanged || vehicleChanged;

  const handleSave = () => {
    let hasError = false;

    if (!hasChanges) {
      setChangeError(copy.noAssignmentChange);
      hasError = true;
    } else {
      setChangeError(null);
    }

    if (!reasonValid) {
      setReasonError(copy.reasonTooShort);
      hasError = true;
    } else {
      setReasonError(null);
    }

    if (hasError) {
      return;
    }

    onSaveCorrection({
      trip_id: tripRef.tripId,
      ...(driverChanged ? { driver_id: driverId } : {}),
      ...(vehicleChanged ? { vehicle_id: vehicleId } : {}),
      reason: reason.trim(),
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm font-medium">
        {copy.tripHeading(tripRef.tripCode, tripRef.originCity, tripRef.destinationCity)}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <DriverSelect
          fieldId={`substitute-driver-${tripRef.tripId}`}
          label={copy.driverLabel}
          placeholder={copy.driverPlaceholder}
          value={driverId}
          onChange={(value) => {
            setDriverId(value);
            if (changeError) setChangeError(null);
          }}
          drivers={drivers}
          isLoading={isLoadingDrivers}
          disabled={!canExecute}
        />
        <VehicleSelect
          fieldId={`substitute-vehicle-${tripRef.tripId}`}
          label={copy.vehicleLabel}
          placeholder={copy.vehiclePlaceholder}
          value={vehicleId}
          onChange={(value) => {
            setVehicleId(value);
            if (changeError) setChangeError(null);
          }}
          vehicles={assignableVehicles}
          isLoading={isLoadingVehicles}
          disabled={!canExecute}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`substitute-assignment-reason-${tripRef.tripId}`}>
          {copy.reasonLabel}
        </Label>
        <Textarea
          id={`substitute-assignment-reason-${tripRef.tripId}`}
          value={reason}
          maxLength={MAX_REASON_LENGTH}
          aria-invalid={Boolean(reasonError)}
          onChange={(event) => {
            setReason(event.target.value.slice(0, MAX_REASON_LENGTH));
            if (reasonError) setReasonError(null);
          }}
        />
        {reasonError ? (
          <FieldInlineError
            fieldId={`substitute-assignment-reason-${tripRef.tripId}`}
            message={reasonError}
          />
        ) : null}
        {changeError ? (
          <FieldInlineError
            fieldId={`substitute-assignment-change-${tripRef.tripId}`}
            message={changeError}
          />
        ) : null}
      </div>
      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={!canExecute}>
          {savedEntry ? copy.editAgain : copy.saveCorrection}
        </Button>
      </div>
    </div>
  );
}

export function SubstitutionTripAssignmentSection({
  invoice,
  tripCorrections,
  onSaveCorrection,
  sheetOpen,
}: Props) {
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("trips_fiscal_edit", "execute");

  const savedByTripId = useMemo(() => {
    const map = new Map<string, TripCorrectionFormEntry>();
    for (const entry of tripCorrections) {
      if (entry.driver_id || entry.vehicle_id) {
        map.set(entry.trip_id, entry);
      }
    }
    return map;
  }, [tripCorrections]);

  if (invoice.trips.length === 0) {
    return null;
  }

  return (
    <Collapsible defaultOpen={false} className={SUBSTITUTION_COLLAPSIBLE_CLASS}>
      <CollapsibleTrigger className={SUBSTITUTION_COLLAPSIBLE_TRIGGER_CLASS}>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
          <span>{copy.sectionTitle}</span>
          <span className="text-xs font-normal text-muted-foreground">
            {sheetCopy.optionalBadge}
          </span>
        </span>
        <ChevronDown className={SUBSTITUTION_COLLAPSIBLE_CHEVRON_CLASS} />
      </CollapsibleTrigger>
      <CollapsibleContent className={SUBSTITUTION_COLLAPSIBLE_CONTENT_CLASS}>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {canExecute ? copy.sectionHint : copy.noPermission}
        </p>
        <div className="space-y-3">
        {invoice.trips.map((tripRef) => (
          <TripAssignmentEditor
            key={tripRef.tripId}
            tripRef={tripRef}
            enabled={sheetOpen}
            savedEntry={savedByTripId.get(tripRef.tripId)}
            canExecute={canExecute}
            onSaveCorrection={onSaveCorrection}
          />
        ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
