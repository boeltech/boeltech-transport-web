import { useEffect, useState } from "react";
import { Loader2, Play } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { useToast } from "@shared/hooks";
import { useStartTrip } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import type { Trip, TripStop } from "@features/trips/domain";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";
import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "./startTripMileage";
import { TrackingGpsCaptureSection } from "./trip-tracking/TrackingGpsCaptureSection";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trip-tracking/trackingGpsCapture";

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export interface StartTripDialogProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  /** Kilometraje inicial ya persistido en el viaje (wizard / edición). */
  tripStartMileage?: number | null;
  /** Parada origen para ofrecer coords. guardadas al iniciar. */
  originStop?: Pick<TripStop, "latitude" | "longitude"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
}

interface StartTripDialogBodyProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  originStop?: Pick<TripStop, "latitude" | "longitude"> | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
}

function StartTripDialogBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  originStop,
  onOpenChange,
  onSuccess,
}: StartTripDialogBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);

  useEffect(() => {
    setOccurredAt(defaultOccurredAtLocal());
    setGps(null);
    setTimeError(null);
  }, [tripId]);

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId ?? "", {
    enabled: !!vehicleId,
  });

  const suggestedMileage = resolveSuggestedStartMileage(
    vehicle?.currentMileage,
    tripStartMileage,
  );
  const mileageField = useSuggestedMileageField(suggestedMileage);

  const startMutation = useStartTrip({
    onSuccess: (trip) => {
      toast({
        title: "Viaje iniciado",
        description: `${tripCode} está en curso`,
        variant: "success",
      });
      onSuccess?.(trip);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Error al iniciar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    const parsed = mileageField.parseValue();
    if (parsed === null) {
      toast({
        title: "Kilometraje requerido",
        description:
          "Ingresa el odómetro al iniciar el viaje. Se sugiere el kilometraje actual del vehículo cuando está disponible.",
        variant: "destructive",
      });
      return;
    }

    if (!occurredAt.trim()) {
      setTimeError("Indica la fecha y hora de salida.");
      return;
    }
    setTimeError(null);

    const gpsFields = trackingGpsToEventFields(gps);
    startMutation.mutate({
      id: tripId,
      mileage: parsed,
      occurredAt: localInputToUtcIso(occurredAt),
      latitude: gpsFields.latitude,
      longitude: gpsFields.longitude,
    });
  };

  const mileageSourceHint =
    vehicle?.currentMileage != null
      ? `Kilometraje actual del vehículo: ${vehicle.currentMileage.toLocaleString("es-MX")} km`
      : tripStartMileage != null
        ? `Kilometraje programado en el viaje: ${tripStartMileage.toLocaleString("es-MX")} km`
        : null;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          <SectionHeadingWithHint
            title="Iniciar Viaje"
            titleClassName="text-lg font-semibold leading-none tracking-tight"
            hintLabel="Iniciar viaje"
            hint={
              <>
                El viaje {tripCode} pasará a estado &quot;En Curso&quot;. Registra el
                kilometraje del odómetro al salir; se precarga desde el vehículo o el
                valor ya capturado en el viaje.
              </>
            }
          />
        </DialogTitle>
        <DialogDescription className="sr-only">
          El viaje pasará a en curso; registra el kilometraje inicial del odómetro.
        </DialogDescription>
      </DialogHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="start-occurred-at">Fecha y hora de salida</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="start-occurred-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              disabled={startMutation.isPending}
              aria-invalid={timeError ? true : undefined}
              className="min-w-[220px] flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOccurredAt(defaultOccurredAtLocal())}
              disabled={startMutation.isPending}
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
          <Label htmlFor="start-mileage">Kilometraje inicial</Label>
          <Input
            id="start-mileage"
            type="number"
            min={0}
            placeholder="Ej: 150000"
            value={mileageField.value}
            onChange={(e) => mileageField.onValueChange(e.target.value)}
            disabled={startMutation.isPending}
          />
          {isLoadingVehicle ? (
            <p className="text-xs text-muted-foreground">Cargando kilometraje del vehículo…</p>
          ) : mileageSourceHint ? (
            <p className="text-xs text-muted-foreground">{mileageSourceHint}</p>
          ) : null}
        </div>

        <TrackingGpsCaptureSection
          stop={originStop}
          value={gps}
          onChange={setGps}
          disabled={startMutation.isPending}
        />
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={startMutation.isPending}
        >
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={startMutation.isPending}>
          {startMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Iniciar Viaje
        </Button>
      </DialogFooter>
    </>
  );
}

export function StartTripDialog({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  originStop,
  open,
  onOpenChange,
  onSuccess,
}: StartTripDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {open ? (
          <StartTripDialogBody
            key={tripId}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            originStop={originStop}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
