import { useMemo, useState } from "react";
import { Flag, Loader2 } from "lucide-react";

import type { TripStop } from "@features/trips/domain";
import { useRegisterTrackingEvent } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { DetailAlertCard } from "@shared/ui/data-display";
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

export type QuickCloseTripSheetProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  scheduledDeparture?: Date | string | null;
  actualDeparture?: Date | string | null;
  destinationStop?: TripStop | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function resolveEarliestClosureInstant(
  scheduledDeparture?: Date | string | null,
  actualDeparture?: Date | string | null,
): Date | null {
  if (actualDeparture) return new Date(actualDeparture);
  if (scheduledDeparture) return new Date(scheduledDeparture);
  return null;
}

type QuickCloseTripSheetBodyProps = Omit<QuickCloseTripSheetProps, "open">;

function QuickCloseTripSheetBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  scheduledDeparture,
  actualDeparture,
  destinationStop,
  onOpenChange,
  onSuccess,
}: QuickCloseTripSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState("");
  const idempotencyKey = useMemo(() => createTrackingIdempotencyKey(), []);

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
        title: copy.toast.quickCloseFailed,
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
      setTimeError(copy.validation.quickCloseOccurredAtRequired);
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
        idempotencyKey,
        payload: {
          quick_close: true,
          ...(trimmedNotes ? { closure_notes: trimmedNotes } : {}),
        },
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  const pending = registerMutation.isPending;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <DetailAlertCard
          severity="warning"
          title={copy.sheet.quickCloseWarningTitle}
          items={[
            { text: copy.sheet.quickCloseWarningStops },
            { text: copy.sheet.quickCloseWarningCargos },
          ]}
        />

        <TrackingOccurredAtField
          id="quick-close-occurred-at"
          label={copy.sheet.quickCloseOccurredAtLabel}
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
          <Label htmlFor="quick-close-mileage">{copy.label.endMileage}</Label>
          <Input
            id="quick-close-mileage"
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
              "quick-close-mileage",
              mileageError ?? undefined,
            )}
          />
          <FieldInlineError
            fieldId="quick-close-mileage"
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
          <Label htmlFor="quick-close-notes">{copy.sheet.quickCloseNotesLabel}</Label>
          <Textarea
            id="quick-close-notes"
            placeholder={copy.sheet.quickCloseNotesPlaceholder}
            value={closureNotes}
            onChange={(e) => setClosureNotes(e.target.value)}
            disabled={pending}
            rows={2}
            className="text-sm"
          />
          <p className="text-xs text-muted-foreground">
            {copy.sheet.quickCloseNotesHint}
          </p>
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
            <Flag className="mr-2 h-4 w-4" />
          )}
          {copy.action.quickClose}
        </Button>
      </SheetFooter>
    </>
  );
}

export function QuickCloseTripSheet({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  scheduledDeparture,
  actualDeparture,
  destinationStop,
  open,
  onOpenChange,
  onSuccess,
}: QuickCloseTripSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <Flag className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{copy.action.quickClose}</span>
          </SheetTitle>
          <SheetDescription>{copy.sheet.quickCloseDescription}</SheetDescription>
        </SheetHeader>

        {open ? (
          <QuickCloseTripSheetBody
            key={tripId}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            scheduledDeparture={scheduledDeparture}
            actualDeparture={actualDeparture}
            destinationStop={destinationStop}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
