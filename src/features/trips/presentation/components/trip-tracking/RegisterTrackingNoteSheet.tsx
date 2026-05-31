import { useEffect, useState } from "react";
import { StickyNote } from "lucide-react";

import { useRegisterTrackingEvent } from "@features/trips/application";
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
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import type { TripStop } from "@features/trips/domain";

import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";

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

export function RegisterTrackingNoteSheet({
  tripId,
  referenceStop,
  open,
  onOpenChange,
}: RegisterTrackingNoteSheetProps) {
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

  useEffect(() => {
    if (!open) return;
    setOccurredAt(defaultOccurredAtLocal());
    setNote("");
    setGps(null);
    setFieldError(null);
  }, [open]);

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5 text-primary" />
            Nota operativa
          </SheetTitle>
          <SheetDescription>
            Añade una anotación al timeline del viaje sin impacto fiscal directo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tracking-note-occurred-at">Fecha y hora</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="tracking-note-occurred-at"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                disabled={registerMutation.isPending}
                aria-invalid={fieldError?.includes("fecha") ? true : undefined}
                className="min-w-[220px] flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOccurredAt(defaultOccurredAtLocal())}
                disabled={registerMutation.isPending}
              >
                Ahora
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Hora civil México.</p>
          </div>

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

        <SheetFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={registerMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={registerMutation.isPending}>
            Guardar nota
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
