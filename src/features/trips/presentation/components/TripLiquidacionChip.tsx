/**
 * Chip / control Liquidación en detalle de viaje (ADR-0096).
 */

import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { defaultCfdiEmissionIntentFromProfile } from "@boeltech/cfdi-domain/reglas/cfdi-emission-intent";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { useToast } from "@shared/hooks";

import { useUpdateTrip } from "@features/trips/application";
import type { CfdiEmissionIntent, Trip } from "@features/trips/domain";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";

const copy = cfdiEmissionIntentCopy;

interface TripLiquidacionChipProps {
  trip: Trip;
  canEdit?: boolean;
}

export function TripLiquidacionChip({
  trip,
  canEdit = false,
}: TripLiquidacionChipProps) {
  const { toast } = useToast();
  const updateTrip = useUpdateTrip();
  const intent = trip.cfdiEmissionIntent ?? "emitir_cfdi";
  const isComercialOnly = trip.client?.cfdiReceptorProfile === "comercial_only";

  const [pendingIntent, setPendingIntent] = useState<CfdiEmissionIntent | null>(
    null,
  );
  const [blockEmitirOpen, setBlockEmitirOpen] = useState(false);

  const persistIntent = useCallback(
    async (next: CfdiEmissionIntent) => {
      try {
        await updateTrip.mutateAsync({
          id: trip.id,
          data: { cfdiEmissionIntent: next },
        });
        toast({
          title:
            next === "sin_cfdi_efectivo"
              ? copy.chip.sinCfdi
              : copy.chip.conCfdi,
          description:
            next === "sin_cfdi_efectivo" ? copy.complianceNotice : undefined,
          variant: "success",
        });
      } catch (error) {
        toast({
          title: "No se pudo actualizar la liquidación",
          description:
            error instanceof Error ? error.message : "Intenta de nuevo",
          variant: "destructive",
        });
      }
    },
    [toast, trip.id, updateTrip],
  );

  const handleChange = useCallback(
    (next: string) => {
      if (next !== "emitir_cfdi" && next !== "sin_cfdi_efectivo") return;
      if (next === intent) return;
      if (next === "emitir_cfdi" && isComercialOnly) {
        setBlockEmitirOpen(true);
        return;
      }
      if (next === "sin_cfdi_efectivo" && intent === "emitir_cfdi") {
        setPendingIntent(next);
        return;
      }
      void persistIntent(next);
    },
    [intent, isComercialOnly, persistIntent],
  );

  const dialogs = (
    <>
      <AlertDialog
        open={pendingIntent != null}
        onOpenChange={(open) => {
          if (!open) setPendingIntent(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.overrideConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">{copy.overrideConfirm.description}</span>
              <span className="block text-foreground">
                {copy.complianceNotice}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.overrideConfirm.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingIntent) void persistIntent(pendingIntent);
                setPendingIntent(null);
              }}
            >
              {copy.overrideConfirm.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={blockEmitirOpen} onOpenChange={setBlockEmitirOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.blockEmitir.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.blockEmitir.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            {trip.clientId ? (
              <Button asChild>
                <Link
                  to={`/clients/${trip.clientId}`}
                  onClick={() => setBlockEmitirOpen(false)}
                >
                  {copy.blockEmitir.goToClient}
                </Link>
              </Button>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  if (!canEdit) {
    if (intent !== "sin_cfdi_efectivo") return null;
    return (
      <Badge variant="warning" tone="soft" className="text-xs">
        {copy.chip.sinCfdi}
      </Badge>
    );
  }

  return (
    <>
      <Select
        value={intent}
        onValueChange={handleChange}
        disabled={updateTrip.isPending}
      >
        <SelectTrigger
          aria-label={copy.field.label}
          className="h-8 w-[min(100%,11.5rem)] text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="emitir_cfdi">{copy.options.emitir_cfdi}</SelectItem>
          <SelectItem value="sin_cfdi_efectivo">
            {copy.options.sin_cfdi_efectivo}
          </SelectItem>
        </SelectContent>
      </Select>
      {dialogs}
    </>
  );
}

export function defaultLiquidacionForClientProfile(
  profile: "receptor_cfdi" | "comercial_only" | undefined,
): CfdiEmissionIntent {
  return defaultCfdiEmissionIntentFromProfile(
    profile === "comercial_only" ? "comercial_only" : "receptor_cfdi",
  );
}
