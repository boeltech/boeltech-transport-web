import { AlertTriangle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "../../copy";

export type TripTrackingIncidentStripProps = {
  /** Cuerpo concreto (p. ej. descripción del último incidente) o fallback genérico. */
  summary?: string | null;
  /** D35 / Q8 — `tel:` del operador cuando hay teléfono. */
  callPhone?: string | null;
  canClose?: boolean;
  onClose?: () => void;
  className?: string;
};

/**
 * F7.2 / D35: franja full-width de incidente abierto (entre ProgressStrip y riel).
 * Peso visual de excepción > itinerario. CTAs: Llamar + Cerrar.
 */
export function TripTrackingIncidentStrip({
  summary = null,
  callPhone = null,
  canClose = false,
  onClose,
  className,
}: TripTrackingIncidentStripProps) {
  const body =
    summary?.trim() || trackingCopy.hint.openIncident;
  const phone = callPhone?.trim() || null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-start gap-x-3 gap-y-2 rounded-md border-2 border-destructive/35 bg-destructive-soft px-3 py-2.5",
        className,
      )}
      role="status"
      data-tracking-section="incident-strip"
      aria-label={trackingCopy.hint.openIncidentTitle}
    >
      <AlertTriangle
        className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
        aria-hidden
      />
      <div className="min-w-0 flex-1 space-y-0.5">
        <span className="text-sm font-semibold text-foreground">
          {trackingCopy.hint.openIncidentTitle}
        </span>
        <p className="text-sm text-muted-foreground line-clamp-2">{body}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {phone ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2.5 text-xs"
            asChild
          >
            <a href={`tel:${phone}`}>{trackingCopy.action.callOperator}</a>
          </Button>
        ) : null}
        {canClose && onClose ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 border-destructive/40 px-2.5 text-xs"
            onClick={onClose}
          >
            {trackingCopy.action.closeIncident}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
