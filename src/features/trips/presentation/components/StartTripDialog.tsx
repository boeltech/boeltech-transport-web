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
import type { Trip } from "@features/trips/domain";
import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "./startTripMileage";

export interface StartTripDialogProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  /** Kilometraje inicial ya persistido en el viaje (wizard / edición). */
  tripStartMileage?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
}

interface StartTripDialogBodyProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
}

function StartTripDialogBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  onOpenChange,
  onSuccess,
}: StartTripDialogBodyProps) {
  const { toast } = useToast();

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

    startMutation.mutate({
      id: tripId,
      mileage: parsed,
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
      <div className="py-4 space-y-2">
        <Label htmlFor="start-mileage">Kilometraje inicial</Label>
        <Input
          id="start-mileage"
          type="number"
          min={0}
          placeholder="Ej: 150000"
          value={mileageField.value}
          onChange={(e) => mileageField.onValueChange(e.target.value)}
          className="mt-2"
          disabled={startMutation.isPending}
        />
        {isLoadingVehicle ? (
          <p className="text-xs text-muted-foreground">Cargando kilometraje del vehículo…</p>
        ) : mileageSourceHint ? (
          <p className="text-xs text-muted-foreground">{mileageSourceHint}</p>
        ) : null}
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
  open,
  onOpenChange,
  onSuccess,
}: StartTripDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <StartTripDialogBody
            key={tripId}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            tripStartMileage={tripStartMileage}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
