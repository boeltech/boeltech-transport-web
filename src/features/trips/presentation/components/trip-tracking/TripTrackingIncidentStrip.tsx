import { Route } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "./trackingCopy";

export type TripTrackingIncidentStripProps = {
  /** Cuerpo concreto (p. ej. descripción del último incidente) o fallback genérico. */
  summary?: string | null;
  canClose?: boolean;
  onClose?: () => void;
  className?: string;
};

/**
 * F7.2: franja full-width compacta de incidente abierto (entre ProgressStrip y riel).
 */
export function TripTrackingIncidentStrip({
  summary = null,
  canClose = false,
  onClose,
  className,
}: TripTrackingIncidentStripProps) {
  const body =
    summary?.trim() || trackingCopy.hint.openIncident;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-warning/40 bg-warning-soft px-3 py-2",
        className,
      )}
      role="status"
      data-tracking-section="incident-strip"
      aria-label={trackingCopy.hint.openIncidentTitle}
    >
      <Route
        className="h-3.5 w-3.5 shrink-0 text-warning-soft-foreground"
        aria-hidden
      />
      <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-xs font-semibold text-foreground">
          {trackingCopy.hint.openIncidentTitle}
        </span>
        <span className="text-xs text-muted-foreground line-clamp-1">
          {body}
        </span>
      </div>
      {canClose && onClose ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 shrink-0 px-2.5 text-xs"
          onClick={onClose}
        >
          {trackingCopy.action.closeIncident}
        </Button>
      ) : null}
    </div>
  );
}
