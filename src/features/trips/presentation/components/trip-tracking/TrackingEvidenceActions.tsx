import { AlertTriangle, StickyNote } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "../../copy";

export type TrackingEvidenceActionsProps = {
  onRegisterNote: () => void;
  onRegisterIncident: () => void;
  canRegisterNote?: boolean;
  canRegisterIncident?: boolean;
  className?: string;
};

/**
 * Acciones de evidencia del viaje (nota / incidente).
 * No mutan paradas ni cargas — abren sheets compartidos del tab.
 */
export function TrackingEvidenceActions({
  onRegisterNote,
  onRegisterIncident,
  canRegisterNote = false,
  canRegisterIncident = false,
  className,
}: TrackingEvidenceActionsProps) {
  const noteDisabledReason = canRegisterNote
    ? undefined
    : trackingCopy.error.registerRequiresInProgress;
  const incidentDisabledReason = canRegisterIncident
    ? undefined
    : trackingCopy.error.registerRequiresInProgress;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canRegisterNote}
        onClick={onRegisterNote}
        title={noteDisabledReason}
      >
        <StickyNote className="mr-2 h-4 w-4" />
        {trackingCopy.action.note}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!canRegisterIncident}
        onClick={onRegisterIncident}
        title={incidentDisabledReason}
      >
        <AlertTriangle className="mr-2 h-4 w-4" />
        {trackingCopy.action.incident}
      </Button>
    </div>
  );
}
