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
  formatStopLocation,
  getEffectiveStopRfc,
  toFiscalStopDisplayOrder,
} from "./tripFiscalHelpers";

const copy = tripFiscalCopy.pickerSheet;

export type StopPickerListMode = "invalid-only" | "all-stops-fallback";

export interface StopPickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stops: readonly TripStop[];
  /** Cuando no hay paradas con RFC inválido por formato, listar todas las paradas. */
  listMode?: StopPickerListMode;
  onSelectStop: (stopId: string) => void;
}

export function StopPickerSheet({
  open,
  onOpenChange,
  stops,
  listMode = "invalid-only",
  onSelectStop,
}: StopPickerSheetProps) {
  const description =
    listMode === "all-stops-fallback" ? copy.allStopsDescription : copy.description;

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
            stops.map((stop) => (
              <div
                key={stop.id}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    Parada #{toFiscalStopDisplayOrder(stop.sequenceOrder)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatStopLocation(stop)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {getEffectiveStopRfc(stop) ?? "—"}
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
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
