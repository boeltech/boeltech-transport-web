import { useMemo, useState } from "react";
import { Loader2, Navigation } from "lucide-react";

import type { TripCargo, TripStop } from "@features/trips/domain";
import { validateCargoBeforeDeparture } from "../../utils/trackingCargoGating";
import { useDepartOrigin } from "@features/trips/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
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
import { HintIcon } from "@shared/ui/hint-icon";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import { formatStopActionTooltip } from "../trackingActionLabels";
import { trackingCopy } from "../../copy";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
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

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export type DepartOriginSheetProps = {
  tripId: string;
  originStop: TripStop | null;
  displayOrder?: number;
  cargos?: readonly TripCargo[];
  orderedStops?: readonly TripStop[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type DepartOriginSheetBodyProps = Omit<DepartOriginSheetProps, "open"> & {
  originStop: TripStop;
};

function DepartOriginSheetBody({
  tripId,
  originStop,
  displayOrder,
  cargos = [],
  orderedStops = [],
  onOpenChange,
}: DepartOriginSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const idempotencyKey = useMemo(() => createTrackingIdempotencyKey(), []);

  const departMutation = useDepartOrigin({
    onSuccess: () => {
      toast({
        title: copy.toast.originDeparted,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.originDepartFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!occurredAt.trim()) {
      setFieldError(copy.validation.departureRequired);
      return;
    }

    if (cargos.length > 0 && orderedStops.length > 0) {
      const cargoError = validateCargoBeforeDeparture(
        originStop,
        cargos,
        orderedStops,
      );
      if (cargoError) {
        setFieldError(cargoError);
        return;
      }
    }

    setFieldError(null);

    const gpsFields = trackingGpsToEventFields(gps);
    departMutation.mutate({
      tripId,
      occurredAt: localInputToUtcIso(occurredAt),
      latitude: gpsFields.latitude,
      longitude: gpsFields.longitude,
      notes: notes.trim() || undefined,
      idempotencyKey,
    });
  };

  const isPending = departMutation.isPending;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <p className="text-sm text-muted-foreground">
          {formatStopActionTooltip(originStop, displayOrder ?? 1)}
        </p>

        <div className="space-y-2">
          <Label htmlFor="depart-origin-occurred-at">{copy.label.departureAt}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="depart-origin-occurred-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              disabled={isPending}
              aria-invalid={fieldError ? true : undefined}
              className="min-w-[220px] flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOccurredAt(defaultOccurredAtLocal())}
              disabled={isPending}
            >
              {copy.action.now}
            </Button>
          </div>
          {fieldError ? (
            <p className="text-xs text-destructive">{fieldError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {copy.validation.civilTimeHint}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="depart-origin-notes">Notas (opcional)</Label>
          <Textarea
            id="depart-origin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isPending}
            rows={2}
          />
        </div>

        <TrackingGpsCaptureSection
          stop={originStop}
          value={gps}
          onChange={setGps}
          disabled={isPending}
        />
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
        <Button
          variant="outline"
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {copy.action.cancel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isPending}
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="mr-2 h-4 w-4" />
          )}
          {copy.action.departOrigin}
        </Button>
      </SheetFooter>
    </>
  );
}

export function DepartOriginSheet({
  tripId,
  originStop,
  displayOrder,
  cargos,
  orderedStops,
  open,
  onOpenChange,
}: DepartOriginSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <Navigation className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="inline-flex items-center gap-1.5">
              {copy.action.departOrigin}
              <HintIcon label={copy.sheet.departOriginHintLabel}>
                {copy.sheet.departOriginDescription}
              </HintIcon>
            </span>
          </SheetTitle>
          <SheetDescription>{copy.sheet.departOriginDescription}</SheetDescription>
        </SheetHeader>

        {open && originStop ? (
          <DepartOriginSheetBody
            key={originStop.id}
            tripId={tripId}
            originStop={originStop}
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
