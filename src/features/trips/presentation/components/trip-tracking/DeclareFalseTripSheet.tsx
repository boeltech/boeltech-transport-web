import { useId, useState } from "react";
import { Link } from "react-router-dom";
import { Ban, Loader2 } from "lucide-react";

import { useRegisterTrackingEvent } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Textarea } from "@shared/ui/text-area";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "../startTripMileage";
import { trackingCopy } from "../../copy";
import { STOP_TRANSITION_COPY } from "./transitionCopy";
import { TrackingOccurredAtField } from "./TrackingOccurredAtField";
import { createTrackingIdempotencyKey } from "./trackingIdempotency";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONFIRM_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_STACKED_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";

const copy = trackingCopy;
const CAUSE_MIN_LENGTH = 10;

export type DeclareFalseTripSheetProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

type DeclareFalseTripSheetBodyProps = Omit<
  DeclareFalseTripSheetProps,
  "open"
>;

function DeclareFalseTripSheetBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  onOpenChange,
  onSuccess,
}: DeclareFalseTripSheetBodyProps) {
  const { toast } = useToast();
  const occurredAtId = "false-trip-occurred-at";
  const mileageId = "false-trip-end-mileage";
  const causeId = "false-trip-cause";
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [cause, setCause] = useState("");
  const [occurredAtError, setOccurredAtError] = useState<string | null>(null);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [causeError, setCauseError] = useState<string | null>(null);
  const costsHintId = useId();

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    vehicleId ?? "",
    { enabled: !!vehicleId },
  );

  const suggestedMileage = resolveSuggestedStartMileage(
    vehicle?.currentMileage,
    tripStartMileage,
  );
  const mileageField = useSuggestedMileageField(suggestedMileage);

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({
        title: copy.toast.falseTripDeclared,
        description: copy.toast.falseTripDeclaredDescription(tripCode),
        variant: "success",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.falseTripDeclareFailed,
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
      setOccurredAtError(copy.validation.occurredAtRequired);
      hasError = true;
    } else {
      setOccurredAtError(null);
    }

    const trimmedCause = cause.trim();
    if (trimmedCause.length < CAUSE_MIN_LENGTH) {
      setCauseError(copy.sheet.declareFalseTripCauseRequired);
      hasError = true;
    } else {
      setCauseError(null);
    }

    if (hasError || parsed === null) return;

    registerMutation.mutate({
      tripId,
      event: {
        eventType: "false_trip_declared",
        occurredAt: localInputToUtcIso(occurredAt),
        mileage: parsed,
        notes: trimmedCause,
        idempotencyKey: createTrackingIdempotencyKey(),
      },
    });
  };

  const pending = registerMutation.isPending;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <AlertWithIcon variant="warning" title={copy.sheet.declareFalseTripExpensesTitle}>
          <p id={costsHintId}>{copy.sheet.declareFalseTripExpensesBody}</p>
          <Link
            to={`/trips/${tripId}?tab=costs`}
            className="mt-2 inline-flex text-sm font-medium text-primary hover:underline"
            onClick={() => onOpenChange(false)}
          >
            {copy.sheet.declareFalseTripExpensesCta}
          </Link>
        </AlertWithIcon>

        <div className="space-y-2 rounded-md border bg-muted/30 px-3 py-2.5">
          <p className="text-sm font-medium">{copy.sheet.declareFalseTripEffectsTitle}</p>
          <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
            <li>{copy.sheet.declareFalseTripEffectCompleted}</li>
            <li>{copy.sheet.declareFalseTripEffectDestination}</li>
            <li>{copy.sheet.declareFalseTripEffectCargos}</li>
            <li>{copy.sheet.declareFalseTripEffectInvoice}</li>
          </ul>
        </div>

        <TrackingOccurredAtField
          id={occurredAtId}
          label={copy.label.occurredAtDeclare}
          value={occurredAt}
          onChange={(next) => {
            setOccurredAt(next);
            if (occurredAtError) setOccurredAtError(null);
          }}
          disabled={pending}
          error={Boolean(occurredAtError)}
          errorMessage={occurredAtError}
        />

        <div className="space-y-2">
          <Label htmlFor={mileageId}>{copy.label.endMileage}</Label>
          <Input
            id={mileageId}
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
            {...getFieldErrorAriaProps(mileageId, mileageError ?? undefined)}
          />
          <FieldInlineError fieldId={mileageId} message={mileageError ?? undefined} />
          {isLoadingVehicle ? (
            <p className="text-xs text-muted-foreground">{copy.sheet.loadingVehicle}</p>
          ) : suggestedMileage != null ? (
            <p className="text-xs text-muted-foreground">
              {copy.sheet.suggestedMileageHint(
                suggestedMileage.toLocaleString("es-MX"),
              )}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={causeId}>{copy.sheet.declareFalseTripCauseLabel}</Label>
          <Textarea
            id={causeId}
            placeholder={copy.sheet.declareFalseTripCausePlaceholder}
            value={cause}
            onChange={(e) => {
              setCause(e.target.value);
              if (causeError) setCauseError(null);
            }}
            disabled={pending}
            rows={3}
            className="text-sm"
            error={Boolean(causeError)}
            {...getFieldErrorAriaProps(causeId, causeError ?? undefined)}
          />
          <FieldInlineError fieldId={causeId} message={causeError ?? undefined} />
        </div>
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_STACKED_CLASS}>
        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:justify-end">
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
            className={cn(
              TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
              "h-auto min-h-9 min-w-0 whitespace-normal py-2",
            )}
            aria-describedby="false-trip-confirm-transition"
          >
            {pending ? (
              <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4 shrink-0" />
            )}
            {copy.action.declareFalseTrip}
          </Button>
        </div>
        <p
          id="false-trip-confirm-transition"
          className="w-full min-w-0 text-pretty text-xs leading-relaxed text-muted-foreground"
        >
          {STOP_TRANSITION_COPY.declareFalseTrip}
        </p>
      </SheetFooter>
    </>
  );
}

export function DeclareFalseTripSheet({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  open,
  onOpenChange,
  onSuccess,
}: DeclareFalseTripSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONFIRM_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <Ban className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <span>{copy.sheet.declareFalseTripTitle}</span>
          </SheetTitle>
          <SheetDescription>{copy.sheet.declareFalseTripDescription}</SheetDescription>
        </SheetHeader>

        {open ? (
          <DeclareFalseTripSheetBody
            key={tripId}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
