import { Button } from "@shared/ui/button";

import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

export type TripRouteUnsavedBarProps = {
  summary: string;
  canSave: boolean;
  isPending?: boolean;
  onDiscard: () => void;
  onSave: () => void;
};

/**
 * D43 — barra «Cambios sin guardar» (Descartar / Guardar cambios).
 */
export function TripRouteUnsavedBar({
  summary,
  canSave,
  isPending = false,
  onDiscard,
  onSave,
}: TripRouteUnsavedBarProps) {
  return (
    <div
      className="flex flex-col gap-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
      data-testid="trip-route-unsaved-bar"
      role="status"
    >
      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-semibold text-foreground">
          {copy.unsaved.title}
        </p>
        <p className="text-xs text-muted-foreground">{summary}</p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={onDiscard}
        >
          {copy.action.discardChanges}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={!canSave || isPending}
          onClick={onSave}
        >
          {copy.action.saveChanges}
        </Button>
      </div>
    </div>
  );
}
