import { AlertTriangle, StickyNote } from "lucide-react";
import { useId } from "react";

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
  const noteReasonId = useId();
  const incidentReasonId = useId();
  const noteDisabledReason = canRegisterNote
    ? undefined
    : trackingCopy.error.registerRequiresInProgress;
  const incidentDisabledReason = canRegisterIncident
    ? undefined
    : trackingCopy.error.registerRequiresInProgress;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canRegisterNote}
          onClick={onRegisterNote}
          title={noteDisabledReason}
          aria-label={
            noteDisabledReason
              ? `${trackingCopy.action.note}. ${noteDisabledReason}`
              : undefined
          }
          aria-describedby={noteDisabledReason ? noteReasonId : undefined}
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
          aria-label={
            incidentDisabledReason
              ? `${trackingCopy.action.incident}. ${incidentDisabledReason}`
              : undefined
          }
          aria-describedby={
            incidentDisabledReason ? incidentReasonId : undefined
          }
        >
          <AlertTriangle className="mr-2 h-4 w-4" />
          {trackingCopy.action.incident}
        </Button>
      </div>
      {noteDisabledReason ? (
        <p
          id={noteReasonId}
          className="text-xs text-muted-foreground"
          role="status"
        >
          {noteDisabledReason}
        </p>
      ) : null}
      {incidentDisabledReason &&
      incidentDisabledReason !== noteDisabledReason ? (
        <p
          id={incidentReasonId}
          className="text-xs text-muted-foreground"
          role="status"
        >
          {incidentDisabledReason}
        </p>
      ) : null}
    </div>
  );
}
