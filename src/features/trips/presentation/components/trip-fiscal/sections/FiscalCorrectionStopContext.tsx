import { MapPin } from "lucide-react";
import type { TripStop } from "@features/trips/domain";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { tripFiscalCopy } from "../../../copy/tripFiscalCopy";
import {
  formatStopLocation,
  getEffectiveStopRfc,
} from "../tripFiscalHelpers";

const copy = tripFiscalCopy.correctionSheet;

interface Props {
  stop: TripStop;
}

export function FiscalCorrectionStopContext({ stop }: Props) {
  const effectiveRfc = getEffectiveStopRfc(stop)?.trim();
  const addressLine = formatStopLocation(stop);
  const hasAddress =
    addressLine.trim() !== "" && addressLine !== "Sin dirección";

  return (
    <Alert>
      <MapPin className="h-4 w-4" />
      <AlertTitle>{copy.contextTitle}</AlertTitle>
      <AlertDescription>
        <dl className="grid gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">{copy.contextRfc}</dt>
            <dd className="font-mono">
              {effectiveRfc || copy.contextEmpty}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{copy.contextAddress}</dt>
            <dd>
              {hasAddress ? (
                <span className="break-words text-sm text-foreground">{addressLine}</span>
              ) : (
                <span className="text-muted-foreground">{copy.contextEmpty}</span>
              )}
            </dd>
          </div>
        </dl>
      </AlertDescription>
    </Alert>
  );
}
