import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { useRegisterTrackingEvent } from "@features/trips/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select/select";
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

type RegisterTrackingIncidentSheetProps = {
  tripId: string;
  /** Parada de referencia para ofrecer coords. guardadas (opcional). */
  referenceStop?: Pick<TripStop, "latitude" | "longitude"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type IncidentSeverity = "low" | "medium" | "high";

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string }[] = [
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function randomIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : undefined;
}

export function RegisterTrackingIncidentSheet({
  tripId,
  referenceStop,
  open,
  onOpenChange,
}: RegisterTrackingIncidentSheetProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity>("medium");
  const [requiresAssistance, setRequiresAssistance] = useState(false);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({ title: "Incidente registrado", variant: "success" });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "No se pudo registrar el incidente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!open) return;
    setOccurredAt(defaultOccurredAtLocal());
    setDescription("");
    setSeverity("medium");
    setRequiresAssistance(false);
    setGps(null);
    setFieldError(null);
  }, [open]);

  const handleSubmit = () => {
    if (!description.trim()) {
      setFieldError("Describe el incidente.");
      return;
    }
    if (!occurredAt.trim()) {
      setFieldError("Indica la fecha y hora del incidente.");
      return;
    }

    setFieldError(null);
    registerMutation.mutate({
      tripId,
      event: {
        eventType: "incident",
        occurredAt: localInputToUtcIso(occurredAt),
        idempotencyKey: randomIdempotencyKey(),
        payload: {
          incident_type: "other",
          severity,
          description: description.trim(),
          requires_assistance: requiresAssistance,
        },
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Registrar incidente
          </SheetTitle>
          <SheetDescription>
            Documenta un evento adverso en el timeline. Marca si requiere asistencia
            inmediata.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="tracking-incident-occurred-at">Fecha y hora</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="tracking-incident-occurred-at"
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
            <Label htmlFor="tracking-incident-severity">Severidad</Label>
            <Select
              value={severity}
              onValueChange={(value) => setSeverity(value as IncidentSeverity)}
              disabled={registerMutation.isPending}
            >
              <SelectTrigger id="tracking-incident-severity">
                <SelectValue placeholder="Selecciona severidad" />
              </SelectTrigger>
              <SelectContent>
                {SEVERITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tracking-incident-description">Descripción</Label>
            <Textarea
              id="tracking-incident-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={registerMutation.isPending}
              rows={4}
              placeholder="Qué ocurrió, dónde y acciones tomadas…"
              aria-invalid={fieldError ? true : undefined}
            />
            {fieldError ? (
              <p className="text-xs text-destructive">{fieldError}</p>
            ) : null}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1"
              checked={requiresAssistance}
              onChange={(e) => setRequiresAssistance(e.target.checked)}
              disabled={registerMutation.isPending}
            />
            <span>Requiere asistencia o escalamiento inmediato</span>
          </label>
        </div>

        <SheetFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={registerMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={registerMutation.isPending}
          >
            Registrar incidente
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
