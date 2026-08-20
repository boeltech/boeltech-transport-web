import { Loader2, Route } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import type { ClientCorridor } from "@features/trips/domain";
import { canvasCopy } from "../../copy/canvasCopy";

const copy = canvasCopy.corridor;

export interface CorridorPickerProps {
  corridors: ClientCorridor[];
  isLoading?: boolean;
  selectedKey?: string | null;
  disabled?: boolean;
  onSelect: (corridor: ClientCorridor) => void;
}

function corridorLabel(corridor: ClientCorridor): string {
  const origin = [corridor.originCity, corridor.originState]
    .filter(Boolean)
    .join(", ");
  const destination = [corridor.destinationCity, corridor.destinationState]
    .filter(Boolean)
    .join(", ");
  return `${origin} → ${destination}`;
}

export function CorridorPicker({
  corridors,
  isLoading = false,
  selectedKey,
  disabled = false,
  onSelect,
}: CorridorPickerProps) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {copy.loading}
      </p>
    );
  }

  if (corridors.length === 0) {
    return <p className="text-xs text-muted-foreground">{copy.empty}</p>;
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{copy.label}</legend>
      <p className="text-xs text-muted-foreground">{copy.hint}</p>
      <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
        {corridors.map((corridor) => {
          const selected = corridor.corridorKey === selectedKey;
          return (
            <li key={corridor.corridorKey}>
              <button
                type="button"
                onClick={() => onSelect(corridor)}
                disabled={disabled}
                aria-pressed={selected}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border hover:bg-muted/60",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <Route
                  className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{corridorLabel(corridor)}</span>
                  <span className="block text-xs text-muted-foreground">
                    {copy.stopCount(corridor.stopCount)} ·{" "}
                    {copy.tripCount(corridor.tripCount)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
