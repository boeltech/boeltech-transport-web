import { useState } from "react";
import { StickyNote } from "lucide-react";

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
import type { TripStop } from "@features/trips/domain";

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

type RegisterTrackingNoteSheetProps = {
  tripId: string;
  /** Parada de referencia para ofrecer coords. guardadas (opcional). */
  referenceStop?: Pick<TripStop, "latitude" | "longitude"> | null;
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

function RegisterTrackingNoteSheetBody({
  tripId,
  referenceStop,
  onOpenChange,
}: Omit<RegisterTrackingNoteSheetProps, "open">) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [note, setNote] = useState("");
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({ title: "Nota registrada", variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "No se pudo registrar la nota",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!note.trim()) {
      setFieldError("Escribe el contenido de la nota.");
      return;
    }
    if (!occurredAt.trim()) {
      setFieldError("Indica la fecha y hora de la nota.");
      return;
    }

    setFieldError(null);
    registerMutation.mutate({
      tripId,
      event: {
        eventType: "note",
        notes: note.trim(),
        occurredAt: localInputToUtcIso(occurredAt),
        idempotencyKey: randomIdempotencyKey(),
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
          <TrackingOccurredAtField
            id="tracking-note-occurred-at"
            label="Fecha y hora"
            value={occurredAt}
            onChange={setOccurredAt}
            disabled={registerMutation.isPending}
            error={Boolean(fieldError?.includes("fecha"))}
          />

          <TrackingGpsCaptureSection
            stop={referenceStop}
            value={gps}
            onChange={setGps}
            disabled={registerMutation.isPending}
          />

          <div className="space-y-2">
            <Label htmlFor="tracking-note-body">Nota</Label>
            <Textarea
              id="tracking-note-body"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={registerMutation.isPending}
              rows={4}
              placeholder="Detalle operativo, instrucciones, contexto…"
              aria-invalid={fieldError ? true : undefined}
            />
            {fieldError ? (
              <p className="text-xs text-destructive">{fieldError}</p>
            ) : null}
          </div>
        </div>

        <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
          <Button
            variant="outline"
            className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
            onClick={() => onOpenChange(false)}
            disabled={registerMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={registerMutation.isPending}
            className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
          >
            Guardar nota
          </Button>
        </SheetFooter>
    </>
  );
}

export function RegisterTrackingNoteSheet({
  tripId,
  referenceStop,
  open,
  onOpenChange,
}: RegisterTrackingNoteSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Nota operativa
          </SheetTitle>
          <SheetDescription>
            Añade una anotación al timeline del viaje sin impacto fiscal directo.
          </SheetDescription>
        </SheetHeader>

        {open ? (
          <RegisterTrackingNoteSheetBody
            key="tracking-note"
            tripId={tripId}
            referenceStop={referenceStop}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
