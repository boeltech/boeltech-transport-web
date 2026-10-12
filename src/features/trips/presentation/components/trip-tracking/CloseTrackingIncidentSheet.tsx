import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";

import { useCloseTrackingIncident } from "@features/trips/application";
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

import { TrackingOccurredAtField } from "./TrackingOccurredAtField";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";
import { createTrackingIdempotencyKey } from "./trackingIdempotency";
import { trackingCopy } from "../../copy";

type CloseTrackingIncidentSheetProps = {
  tripId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function CloseTrackingIncidentSheetBody({
  tripId,
  onOpenChange,
}: Omit<CloseTrackingIncidentSheetProps, "open">) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [notes, setNotes] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const idempotencyKey = useMemo(() => createTrackingIdempotencyKey(), []);

  const closeMutation = useCloseTrackingIncident({
    onSuccess: () => {
      toast({
        title: trackingCopy.toast.incidentClosed,
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: trackingCopy.toast.incidentCloseFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    const trimmed = notes.trim();
    if (!trimmed) {
      setFieldError(trackingCopy.sheet.closeIncidentNotesRequired);
      return;
    }
    if (trimmed.length > 1000) {
      setFieldError(trackingCopy.sheet.closeIncidentNotesMax);
      return;
    }
    if (!occurredAt.trim()) {
      setFieldError(trackingCopy.validation.occurredAtRequired);
      return;
    }

    setFieldError(null);
    closeMutation.mutate({
      tripId,
      input: {
        notes: trimmed,
        occurredAt: localInputToUtcIso(occurredAt),
        idempotencyKey,
      },
    });
  };

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <TrackingOccurredAtField
          id="tracking-close-incident-occurred-at"
          label="Fecha y hora"
          value={occurredAt}
          onChange={setOccurredAt}
          disabled={closeMutation.isPending}
          error={Boolean(fieldError?.includes("fecha"))}
        />

        <div className="space-y-2">
          <Label htmlFor="tracking-close-incident-notes">
            {trackingCopy.sheet.closeIncidentNotesLabel}
          </Label>
          <Textarea
            id="tracking-close-incident-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={closeMutation.isPending}
            rows={4}
            placeholder={trackingCopy.sheet.closeIncidentNotesPlaceholder}
            aria-invalid={fieldError ? true : undefined}
          />
          {fieldError ? (
            <p className="text-xs text-destructive">{fieldError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {trackingCopy.sheet.closeIncidentNotesHint}
            </p>
          )}
        </div>
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
        <Button
          variant="outline"
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={closeMutation.isPending}
        >
          {trackingCopy.action.cancel}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={closeMutation.isPending}
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
        >
          {trackingCopy.action.closeIncident}
        </Button>
      </SheetFooter>
    </>
  );
}

export function CloseTrackingIncidentSheet({
  tripId,
  open,
  onOpenChange,
}: CloseTrackingIncidentSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {trackingCopy.sheet.closeIncidentTitle}
          </SheetTitle>
          <SheetDescription>
            {trackingCopy.sheet.closeIncidentDescription}
          </SheetDescription>
        </SheetHeader>

        {open ? (
          <CloseTrackingIncidentSheetBody
            key="tracking-close-incident"
            tripId={tripId}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
