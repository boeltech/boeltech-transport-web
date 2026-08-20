import type { StopRfcPreflightResult } from "@boeltech/cfdi-domain";
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
import { toFiscalStopDisplayOrder } from "./tripFiscalHelpers";

const copy = tripFiscalCopy.preflightSheet;

export interface PreflightBlockerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preflight: StopRfcPreflightResult;
  stopsById: ReadonlyMap<string, TripStop>;
  onFixStop: (stopId: string) => void;
}

export function PreflightBlockerSheet({
  open,
  onOpenChange,
  preflight,
  stopsById,
  onFixStop,
}: PreflightBlockerSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-3 py-4">
          {preflight.invalidStops.map((item) => {
            const stop = stopsById.get(item.stopId);
            const reasonLabel =
              item.reason === "RFC_MISSING"
                ? copy.reasonMissing
                : copy.reasonInvalid;

            return (
              <div
                key={item.stopId}
                className="flex items-start justify-between gap-3 rounded-lg border p-3"
              >
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium">
                    Parada #{toFiscalStopDisplayOrder(item.stopOrder)}
                  </p>
                  <p className="text-xs text-muted-foreground">{reasonLabel}</p>
                  {item.rfc ? (
                    <p className="font-mono text-xs text-muted-foreground">
                      {item.rfc}
                    </p>
                  ) : null}
                  {stop ? (
                    <p className="text-xs text-muted-foreground">
                      {stop.city}
                      {stop.state ? `, ${stop.state}` : ""}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    onFixStop(item.stopId);
                    onOpenChange(false);
                  }}
                >
                  {copy.fixAction}
                </Button>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
