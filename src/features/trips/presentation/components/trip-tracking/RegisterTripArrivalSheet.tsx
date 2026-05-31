import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

import type { TripStop } from "@features/trips/domain";
import { useRegisterTrackingEvent } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { HintIcon } from "@shared/ui/hint-icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import {
  formatStopActionTooltip,
  formatTripArrivalButtonLabel,
} from "../trackingActionLabels";
import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "../startTripMileage";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";

export type RegisterTripArrivalSheetProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  destinationStop?: TripStop | null;
  displayOrder?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

function randomIdempotencyKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : undefined;
}

type RegisterTripArrivalSheetBodyProps = Omit<RegisterTripArrivalSheetProps, "open" | "displayOrder"> & {
  title: string;
  tooltip?: string;
};

function RegisterTripArrivalSheetBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  destinationStop,
  onOpenChange,
  onSuccess,
  tooltip,
}: RegisterTripArrivalSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [closureNotes, setClosureNotes] = useState("");

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId ?? "", {
    enabled: !!vehicleId,
  });

  const suggestedMileage = resolveSuggestedStartMileage(
    vehicle?.currentMileage,
    tripStartMileage,
  );
  const mileageField = useSuggestedMileageField(suggestedMileage);

  const registerMutation = useRegisterTrackingEvent({
    onSuccess: () => {
      toast({
        title: "Viaje finalizado",
        description: `${tripCode} quedó completado`,
        variant: "success",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "No se pudo finalizar el viaje",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    const parsed = mileageField.parseValue();
    if (parsed === null) {
      toast({
        title: "Odómetro final requerido",
        description: "Ingresa el odómetro final para completar el viaje.",
        variant: "destructive",
      });
      return;
    }

    if (
      tripStartMileage != null &&
      Number.isFinite(tripStartMileage) &&
      parsed < tripStartMileage
    ) {
      toast({
        title: "Odómetro inválido",
        description: `Debe ser mayor o igual al kilometraje inicial (${tripStartMileage.toLocaleString("es-MX")} km).`,
        variant: "destructive",
      });
      return;
    }

    if (!occurredAt.trim()) {
      setTimeError("Indica la fecha y hora de llegada al destino.");
      return;
    }

    setTimeError(null);

    const trimmedNotes = closureNotes.trim();
    registerMutation.mutate({
      tripId,
      event: {
        eventType: "trip_arrived",
        occurredAt: localInputToUtcIso(occurredAt),
        mileage: parsed,
        notes: trimmedNotes || undefined,
        idempotencyKey: randomIdempotencyKey(),
        payload: trimmedNotes ? { closure_notes: trimmedNotes } : {},
        ...trackingGpsToEventFields(gps),
      },
    });
  };

  const mileageSourceHint =
    vehicle?.currentMileage != null
      ? `Kilometraje actual del vehículo: ${vehicle.currentMileage.toLocaleString("es-MX")} km`
      : tripStartMileage != null
        ? `Kilometraje inicial del viaje: ${tripStartMileage.toLocaleString("es-MX")} km`
        : null;

  return (
    <>
      {tooltip ? (
        <p className="text-xs text-muted-foreground whitespace-pre-line">{tooltip}</p>
      ) : null}

      <div className="flex-1 space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="trip-arrival-occurred-at">Fecha y hora de llegada</Label>
            <div className="flex flex-wrap gap-2">
              <Input
                id="trip-arrival-occurred-at"
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                disabled={registerMutation.isPending}
                aria-invalid={timeError ? true : undefined}
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
            {timeError ? (
              <p className="text-xs text-destructive">{timeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Hora civil México.</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip-arrival-mileage">Odómetro final (km)</Label>
            <Input
              id="trip-arrival-mileage"
              type="number"
              min={0}
              inputMode="numeric"
              value={mileageField.value}
              onChange={(e) => mileageField.onValueChange(e.target.value)}
              disabled={registerMutation.isPending}
            />
            {mileageSourceHint ? (
              <p className="text-xs text-muted-foreground">{mileageSourceHint}</p>
            ) : null}
            {isLoadingVehicle ? (
              <p className="text-xs text-muted-foreground">Cargando vehículo…</p>
            ) : null}
          </div>

          <TrackingGpsCaptureSection
            stop={destinationStop}
            value={gps}
            onChange={setGps}
            disabled={registerMutation.isPending}
          />

          <div className="space-y-2">
            <Label htmlFor="trip-arrival-notes">Notas de cierre (opcional)</Label>
            <Textarea
              id="trip-arrival-notes"
              placeholder="Observaciones al finalizar el viaje…"
              value={closureNotes}
              onChange={(e) => setClosureNotes(e.target.value)}
              disabled={registerMutation.isPending}
              rows={3}
            />
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
          <Button onClick={handleConfirm} disabled={registerMutation.isPending}>
            {registerMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 h-4 w-4" />
            )}
            Finalizar viaje
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
  destinationStop,
  displayOrder,
  open,
  onOpenChange,
  onSuccess,
}: RegisterTripArrivalSheetProps) {
  const title = formatTripArrivalButtonLabel(
    destinationStop ?? undefined,
    displayOrder,
  );
  const tooltip =
    destinationStop && displayOrder != null
      ? formatStopActionTooltip(destinationStop, displayOrder)
      : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="inline-flex items-center gap-1.5">
              {title}
              <HintIcon label="Finalizar viaje">
                Registra el evento fiscal de llegada final, cierra cargas y costos
                operativos, libera unidad y conductor, y marca el viaje como completado.
                Requiere odómetro final.
              </HintIcon>
            </span>
          </SheetTitle>
          <SheetDescription>
            Captura la hora de cierre, el odómetro final y, si aplica, la ubicación
            del evento.
          </SheetDescription>
        </SheetHeader>

        {open ? (
          <RegisterTripArrivalSheetBody
            key={`${tripId}-${destinationStop?.id ?? "trip"}`}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            destinationStop={destinationStop}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
            title={title}
            tooltip={tooltip}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
