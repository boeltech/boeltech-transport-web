import type { TripStop } from "@features/trips/domain";
import { Button } from "@shared/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { tripFiscalCopy } from "../../copy/tripFiscalCopy";
import {
  formatFiscalStopPlaceLine,
  getEffectiveStopRfc,
  toFiscalStopDisplayOrder,
} from "./tripFiscalHelpers";

const copy = tripFiscalCopy.pickerSheet;

export type StopPickerListMode =
  | "invalid-only"
  | "all-stops-fallback"
  | "candidates";

export type StopPickerCandidateRow = {
  stopId: string;
  stopOrder: number;
  tipoUbicacion: "Origen" | "Destino" | null;
  currentRfc: string | null;
};

export interface StopPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stops: readonly TripStop[];
  /** Cuando no hay paradas con RFC inválido por formato, listar todas las paradas. */
  listMode?: StopPickerListMode;
  /** Meta API para filas en modo candidatos (rol Origen/Destino + RFC). */
  candidates?: readonly StopPickerCandidateRow[];
  onSelectStop: (stopId: string) => void;
}

function formatCandidateTitle(
  displayOrder: number,
  tipoUbicacion: "Origen" | "Destino" | null,
): string {
  return tipoUbicacion
    ? `#${displayOrder} · ${tipoUbicacion}`
    : `#${displayOrder}`;
}

export function StopPickerSheet({
  open,
  onOpenChange,
  stops,
  listMode = "invalid-only",
  candidates = [],
  onSelectStop,
}: StopPickerSheetProps) {
  const description =
    listMode === "invalid-only" ? copy.description : copy.allStopsDescription;

  const candidateByStopId = new Map(
    candidates.map((candidate) => [candidate.stopId, candidate]),
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-4">
          {stops.length === 0 ? (
            <p className="text-sm text-muted-foreground">{copy.empty}</p>
          ) : (
            stops.map((stop) => {
              const candidate = candidateByStopId.get(stop.id);
              const displayOrder = toFiscalStopDisplayOrder(
                candidate?.stopOrder ?? stop.sequenceOrder,
              );
              const title =
                listMode === "candidates"
                  ? formatCandidateTitle(
                      displayOrder,
                      candidate?.tipoUbicacion ?? null,
                    )
                  : `Parada #${displayOrder}`;
              const rfc =
                listMode === "candidates"
                  ? (candidate?.currentRfc ?? getEffectiveStopRfc(stop) ?? "—")
                  : (getEffectiveStopRfc(stop) ?? "—");
              const place = formatFiscalStopPlaceLine(stop);

              return (
                <div
                  key={stop.id}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{place}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {rfc}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      onSelectStop(stop.id);
                      onOpenChange(false);
                    }}
                  >
                    {copy.fixAction}
                  </Button>
                </div>
              );
            })
          )}
          {listMode === "all-stops-fallback" ? (
            <p className="text-xs text-muted-foreground">{copy.fallbackTip}</p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
