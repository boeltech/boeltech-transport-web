import { useState } from "react";
import { Loader2, MapPin, Navigation } from "lucide-react";

import type { TripCargo, TripStop } from "@features/trips/domain";
import { validateCargoBeforeDeparture } from "../../utils/trackingCargoGating";
import { useRegisterTrackingEvent } from "@features/trips/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { trackingCopy } from "../../copy";
import { formatStopActionShortLabel } from "../trackingActionLabels";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import { TrackingOccurredAtField } from "./TrackingOccurredAtField";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";

export type StopTrackingEventMode = "arrival" | "departure";

type RegisterStopTrackingEventSheetProps = {
  tripId: string;
  mode: StopTrackingEventMode;
  stop: TripStop | null;
  displayOrder: number | undefined;
  cargos?: readonly TripCargo[];
  orderedStops?: readonly TripStop[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function randomIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : undefined;
}

function stopToastLabel(
  stop: TripStop,
  displayOrder: number | undefined,
): string {
  if (stop.locationName?.trim()) return stop.locationName.trim();
  if (displayOrder != null) return `Parada ${displayOrder}`;
  return "parada";
}

/** Contexto lean: Parada N · Tipo · lugar (sin duplicar el título del sheet). */
function formatStopContextLine(
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
  return place || "Parada";
}

type RegisterStopTrackingEventSheetBodyProps = {
  tripId: string;
  mode: StopTrackingEventMode;
  stop: TripStop;
  displayOrder: number | undefined;
  cargos?: readonly TripCargo[];
  orderedStops?: readonly TripStop[];
  onOpenChange: (open: boolean) => void;
};

function RegisterStopTrackingEventSheetBody({
  tripId,
  mode,
  stop,
  displayOrder,
  cargos = [],
  orderedStops = [],
  onOpenChange,
}: RegisterStopTrackingEventSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [occurredAtError, setOccurredAtError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const copy = trackingCopy;

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      const label = stopToastLabel(stop, displayOrder);
      toast({
        title:
          mode === "arrival"
            ? copy.toast.arrivalRegistered(label)
            : copy.toast.departureRegistered(label),
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.registerFailed,
        description: error.message,
        variant: "error",
      });
    },
  });

  const handleSubmit = () => {
    let hasError = false;
    if (!occurredAt.trim()) {
      setOccurredAtError(copy.validation.occurredAtRequired);
      hasError = true;
    } else {
      setOccurredAtError(null);
    }

    if (mode === "departure" && cargos.length > 0 && orderedStops.length > 0) {
      const cargoError = validateCargoBeforeDeparture(
        stop,
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

    if (hasError) return;
    registerMutation.mutate({
      tripId,
      event: {
        eventType: mode === "arrival" ? "stop_arrived" : "stop_departed",
        stopId: stop.id,
        occurredAt: localInputToUtcIso(occurredAt),
        notes: notes.trim() || undefined,
        idempotencyKey: randomIdempotencyKey(),
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  const occurredAtLabel =
    mode === "arrival"
      ? copy.label.occurredAtArrival
      : copy.label.occurredAtDeparture;

  const confirmLabel =
    mode === "arrival"
      ? copy.action.confirmArrival
      : copy.action.confirmDeparture;

  const pending = registerMutation.isPending;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <p className="text-sm text-muted-foreground">
          {formatStopContextLine(stop, displayOrder)}
        </p>

        {formError ? (
          <p role="alert" className="text-xs text-destructive">
            {formError}
          </p>
        ) : null}

        <TrackingOccurredAtField
          id="tracking-event-occurred-at"
          label={occurredAtLabel}
          value={occurredAt}
          onChange={(next) => {
            setOccurredAt(next);
            if (occurredAtError) setOccurredAtError(null);
          }}
          disabled={pending}
          error={Boolean(occurredAtError)}
          errorMessage={occurredAtError}
        />

        <TrackingGpsCaptureSection
          stop={stop}
          value={gps}
          onChange={setGps}
          disabled={pending}
          variant="quiet"
        />

        <div className="space-y-2">
          <Label
            htmlFor="tracking-event-notes"
            className="text-muted-foreground"
          >
            {copy.sheet.notesOptional}
          </Label>
          <Textarea
            id="tracking-event-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={pending}
            rows={2}
            placeholder={copy.sheet.notesPlaceholder}
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
          onClick={handleSubmit}
          disabled={pending}
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
        >
          {pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {confirmLabel}
        </Button>
      </SheetFooter>
    </>
  );
}

export function RegisterStopTrackingEventSheet({
  tripId,
  mode,
  stop,
  displayOrder,
  cargos,
  orderedStops,
  open,
  onOpenChange,
}: RegisterStopTrackingEventSheetProps) {
  const copy = trackingCopy;
  const title =
    mode === "arrival" ? copy.action.arrive : copy.action.depart;
  const description =
    mode === "arrival"
      ? copy.sheet.arrivalDescription
      : copy.sheet.departureDescription;
  const Icon = mode === "arrival" ? MapPin : Navigation;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span>{title}</span>
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        {open && stop ? (
          <RegisterStopTrackingEventSheetBody
            key={`${mode}-${stop.id}`}
            tripId={tripId}
            mode={mode}
            stop={stop}
            displayOrder={displayOrder}
            cargos={cargos}
            orderedStops={orderedStops}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
