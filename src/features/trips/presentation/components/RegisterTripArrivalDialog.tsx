import { CheckCircle2, Loader2 } from "lucide-react";
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
import { useRegisterTrackingEvent } from "@features/trips/application";
import { useVehicle } from "@features/vehicles/application";
import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "./startTripMileage";

export interface RegisterTripArrivalDialogProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

interface RegisterTripArrivalDialogBodyProps {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  tripStartMileage?: number | null;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function RegisterTripArrivalDialogBody({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  onOpenChange,
  onSuccess,
}: RegisterTripArrivalDialogBodyProps) {
  const { toast } = useToast();

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
        title: "Viaje cerrado en destino",
        description: `${tripCode} quedó completado`,
        variant: "success",
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "No se pudo cerrar en destino",
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
        description: "Ingresa el kilometraje al cerrar el viaje en destino.",
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

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : undefined;

    registerMutation.mutate({
      tripId,
      event: {
        eventType: "trip_arrived",
        occurredAt: new Date().toISOString(),
        mileage: parsed,
        idempotencyKey,
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
      <DialogHeader>
        <DialogTitle>
          <SectionHeadingWithHint
            title="Cerrar viaje en destino"
            hintLabel="Cerrar en destino"
            hint={
              <>
                Registra el evento fiscal de llegada final, marca la parada
                destino como completada y cambia el viaje a estado completado.
                Requiere odómetro final.
              </>
            }
          />
        </DialogTitle>
        <DialogDescription className="sr-only">
          Captura el odómetro final para cerrar el viaje en destino.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
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
      </div>

      <DialogFooter>
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
          Confirmar cierre
        </Button>
      </DialogFooter>
    </>
  );
}

export function RegisterTripArrivalDialog({
  tripId,
  tripCode,
  vehicleId,
  tripStartMileage,
  open,
  onOpenChange,
  onSuccess,
}: RegisterTripArrivalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? (
          <RegisterTripArrivalDialogBody
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
