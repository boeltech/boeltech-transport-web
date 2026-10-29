import type { FleetAvailabilityConflict } from "@shared/api/errors/fleetAvailabilityConflictError";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";

import { tripDetailCopy } from "../../copy";
import { formatFleetAvailabilityConflictLine } from "../../helpers/formatFleetAvailabilityConflict";

const copy = tripDetailCopy.shell.fleetAvailability;

export type FleetAvailabilityConflictAlertProps = {
  conflicts: readonly FleetAvailabilityConflict[];
  /** Título del Alert (confirm / save / create). */
  title: string;
  /** CTA secundario opcional (p. ej. abrir sheet de flota). */
  onReassignFleet?: () => void;
  reassignLabel?: string;
};

export function FleetAvailabilityConflictAlert({
  conflicts,
  title,
  onReassignFleet,
  reassignLabel = copy.reassignCta,
}: FleetAvailabilityConflictAlertProps) {
  return (
    <Alert variant="destructive" data-testid="fleet-availability-conflict-alert">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {conflicts.length > 0 ? (
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {conflicts.map((conflict) => (
              <li
                key={`${conflict.resourceType}-${conflict.resourceId}-${conflict.conflictingTripCode}`}
              >
                {formatFleetAvailabilityConflictLine(conflict)}
              </li>
            ))}
          </ul>
        ) : null}
        {onReassignFleet ? (
          <div className="mt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onReassignFleet}
            >
              {reassignLabel}
            </Button>
          </div>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
