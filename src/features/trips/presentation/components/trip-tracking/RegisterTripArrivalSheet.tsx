import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import type { TripCargo, TripStop } from "@features/trips/domain";
import { validateCargoBeforeDeparture } from "../../utils/trackingCargoGating";
import { useRegisterTrackingEvent } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  formatDateTime,
  localInputToUtcIso,
  utcIsoToLocalInput,
} from "@shared/utils/dateUtils";

import { formatStopActionShortLabel } from "../trackingActionLabels";
import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "../startTripMileage";
import { trackingCopy } from "../../copy";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import { TrackingOccurredAtField } from "./TrackingOccurredAtField";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";
import { createTrackingIdempotencyKey } from "./trackingIdempotency";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";

const copy = trackingCopy;

export type RegisterTripArrivalSheetProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  scheduledDeparture?: Date | string | null;
  actualDeparture?: Date | string | null;
  destinationStop?: TripStop | null;
  displayOrder?: number;
  cargos?: readonly TripCargo[];
  orderedStops?: readonly TripStop[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function formatDestinationContextLine(
  stop: TripStop,
  displayOrder: number | undefined,
): string {
  const place = stop.locationName?.trim();
  if (displayOrder != null) {
    const short = formatStopActionShortLabel(stop, displayOrder);
    if (place && !short.includes(place)) {
      return `${short} · ${place}`;
    }
    return short;
  }
  return place || "Destino";
}

function resolveEarliestClosureInstant(
  scheduledDeparture?: Date | string | null,
  actualDeparture?: Date | string | null,
): Date | null {
  if (actualDeparture) return new Date(actualDeparture);
  if (scheduledDeparture) return new Date(scheduledDeparture);
  return null;
}

type RegisterTripArrivalSheetBodyProps = Omit<
  RegisterTripArrivalSheetProps,
  "open" | "displayOrder"
> & {
  displayOrder?: number;
};

function RegisterTripArrivalSheetBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  scheduledDeparture,
  actualDeparture,
  destinationStop,
  displayOrder,
  cargos = [],
  orderedStops = [],
  onOpenChange,
  onSuccess,
}: RegisterTripArrivalSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState("");

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    vehicleId ?? "",
    { enabled: !!vehicleId },
  );

  const suggestedMileage = resolveSuggestedStartMileage(
    vehicle?.currentMileage,
    tripStartMileage,
  );
  const mileageField = useSuggestedMileageField(suggestedMileage);
  const earliestClosure = resolveEarliestClosureInstant(
    scheduledDeparture,
    actualDeparture,
  );

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({
        title: copy.toast.tripClosed,
        description: copy.toast.tripClosedDescription(tripCode),
        variant: "success",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.tripCloseFailed,
        description: error.message,
        variant: "error",
      });
    },
  });

  const handleConfirm = () => {
    let hasError = false;
    const parsed = mileageField.parseValue();
    if (parsed === null) {
      setMileageError(copy.toast.endMileageRequiredDescription);
      hasError = true;
    } else if (
      tripStartMileage != null &&
      Number.isFinite(tripStartMileage) &&
      parsed < tripStartMileage
    ) {
      setMileageError(
        copy.toast.endMileageBelowStart(tripStartMileage.toLocaleString("es-MX")),
      );
      hasError = true;
    } else {
      setMileageError(null);
    }

    if (!occurredAt.trim()) {
      setTimeError(copy.validation.arrivalAtDestinationRequired);
      hasError = true;
    } else {
      const occurredAtIso = localInputToUtcIso(occurredAt);
      if (earliestClosure && new Date(occurredAtIso) < earliestClosure) {
        const floorLabel = actualDeparture
          ? copy.validation.closureFloorActualDeparture
          : copy.validation.closureFloorScheduledDeparture;
        setTimeError(
          copy.validation.closureBeforeDeparture(
            floorLabel,
            formatDateTime(earliestClosure.toISOString()),
          ),
        );
        hasError = true;
      } else {
        setTimeError(null);
      }
    }

    if (destinationStop && cargos.length > 0 && orderedStops.length > 0) {
      const cargoError = validateCargoBeforeDeparture(
        destinationStop,
        cargos,
        orderedStops,
      );
      if (cargoError) {
        setFormError(cargoError);
        hasError = true;
      } else {
        setFormError(null);
      }
    } else {
      setFormError(null);
    }

    if (hasError || parsed === null) return;

    const occurredAtIso = localInputToUtcIso(occurredAt);
    const trimmedNotes = closureNotes.trim();
    registerMutation.mutate({
      tripId,
      event: {
        eventType: "trip_arrived",
        occurredAt: occurredAtIso,
        mileage: parsed,
        notes: trimmedNotes || undefined,
        idempotencyKey: createTrackingIdempotencyKey(),
        payload: trimmedNotes ? { closure_notes: trimmedNotes } : {},
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  const pending = registerMutation.isPending;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        {destinationStop ? (
          <p className="text-sm text-muted-foreground">
            {formatDestinationContextLine(destinationStop, displayOrder)}
          </p>
        ) : null}

        {formError ? (
          <p role="alert" className="text-xs text-destructive">
            {formError}
          </p>
        ) : null}

        <TrackingOccurredAtField
          id="trip-arrival-occurred-at"
          label={copy.label.occurredAtArrival}
          value={occurredAt}
          onChange={(next) => {
            setOccurredAt(next);
            if (timeError) setTimeError(null);
          }}
          disabled={pending}
          error={Boolean(timeError)}
          errorMessage={timeError}
        />

        <div className="space-y-2">
          <Label htmlFor="trip-arrival-mileage">{copy.label.endMileage}</Label>
          <Input
            id="trip-arrival-mileage"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={copy.sheet.startMileagePlaceholder}
            value={mileageField.value}
            onChange={(e) => {
              mileageField.onValueChange(e.target.value);
              if (mileageError) setMileageError(null);
            }}
            disabled={pending}
            error={Boolean(mileageError)}
            {...getFieldErrorAriaProps(
              "trip-arrival-mileage",
              mileageError ?? undefined,
            )}
          />
          <FieldInlineError
            fieldId="trip-arrival-mileage"
            message={mileageError ?? undefined}
          />
          {isLoadingVehicle ? (
            <p className="text-xs text-muted-foreground">
              {copy.sheet.loadingVehicle}
            </p>
          ) : suggestedMileage != null ? (
            <p className="text-xs text-muted-foreground">
              {copy.sheet.suggestedMileageHint(
                suggestedMileage.toLocaleString("es-MX"),
              )}
            </p>
          ) : null}
        </div>

        <TrackingGpsCaptureSection
          stop={destinationStop}
          value={gps}
          onChange={setGps}
          disabled={pending}
          variant="quiet"
        />

        <div className="space-y-2">
          <Label
            htmlFor="trip-arrival-notes"
            className="text-muted-foreground"
          >
            {copy.sheet.notesOptional}
          </Label>
          <Textarea
            id="trip-arrival-notes"
            placeholder={copy.sheet.closeNotesPlaceholder}
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            disabled={pending}
            rows={2}
            className="text-sm"
          />
        </div>
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
        <Button
          variant="outline"
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={pending}
        >
          {copy.action.cancel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={pending}
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-4 w-4" />
          )}
          {copy.action.close}
        </Button>
      </SheetFooter>
    </>
  );
}

export function RegisterTripArrivalSheet({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  scheduledDeparture,
  actualDeparture,
  destinationStop,
  displayOrder,
  cargos,
  orderedStops,
  open,
  onOpenChange,
  onSuccess,
}: RegisterTripArrivalSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{copy.action.close}</span>
          </SheetTitle>
          <SheetDescription>{copy.sheet.closeDescription}</SheetDescription>
        </SheetHeader>

        {open ? (
          <RegisterTripArrivalSheetBody
            key={`${tripId}-${destinationStop?.id ?? "trip"}`}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            scheduledDeparture={scheduledDeparture}
            actualDeparture={actualDeparture}
            destinationStop={destinationStop}
            displayOrder={displayOrder}
            cargos={cargos}
            orderedStops={orderedStops}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
