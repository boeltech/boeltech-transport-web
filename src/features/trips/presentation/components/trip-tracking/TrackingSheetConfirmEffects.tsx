import { cn } from "@shared/lib/utils/cn";

import { trackingCopy } from "../../copy";

export type TrackingSheetConfirmEffectsProps = {
  items: readonly string[];
  /** Default: «Al confirmar» (D36 / Q9). */
  title?: string;
  className?: string;
};

/**
 * Bloque de consecuencias del verbo (anatomía D36).
 * Reusa el patrón visual de DeclareFalseTripSheet.
 */
export function TrackingSheetConfirmEffects({
  items,
  title = trackingCopy.sheet.confirmEffectsTitle,
  className,
}: TrackingSheetConfirmEffectsProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "space-y-2 rounded-md border bg-muted/30 px-3 py-2.5",
        className,
      )}
      data-tracking-section="confirm-effects"
    >
      <p className="text-sm font-medium">{title}</p>
      <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
