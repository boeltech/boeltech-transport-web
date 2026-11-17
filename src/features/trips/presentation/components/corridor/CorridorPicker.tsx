import { Loader2, Route } from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import type { ClientCorridor } from "@features/trips/domain";
import { canvasCopy } from "../../copy/canvasCopy";

const copy = canvasCopy.corridor;

export interface CorridorPickerProps {
  corridors: ClientCorridor[];
  isLoading?: boolean;
  selectedKey?: string | null;
  disabled?: boolean;
  onSelect: (corridor: ClientCorridor) => void;
  /** Corredor que dejó de aplicar tras cambiar un extremo (Q21 #5). */
  staleCorridor?: ClientCorridor | null;
  staleMessage?: string | null;
  onRestoreStale?: () => void;
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
  staleCorridor = null,
  staleMessage = null,
  onRestoreStale,
}: CorridorPickerProps) {
  if (isLoading) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {copy.loading}
      </p>
    );
  }

  if (corridors.length === 0 && !staleCorridor) {
    return <p className="text-xs text-muted-foreground">{copy.empty}</p>;
  }

  return (
    <fieldset className="space-y-2">
      <legend className="sr-only">{copy.label}</legend>
      <SectionHeadingWithHint
        title={copy.label}
        hintLabel={copy.label}
        hint={<>{copy.hintDetail}</>}
        titleClassName="text-sm font-medium"
      />
      <p className="text-xs text-muted-foreground">{copy.hint}</p>
      <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-0.5">
        {staleCorridor ? (
          <li>
            <div
              className="flex w-full items-start gap-2 rounded-md border border-dashed border-muted-foreground/40 bg-muted/30 px-3 py-2 text-left text-sm"
              data-testid="corridor-stale"
            >
              <Route
                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="block font-medium text-muted-foreground line-through">
                  {corridorLabel(staleCorridor)}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {staleMessage ?? copy.noLongerUsed("both")}
                </span>
              </span>
              {onRestoreStale ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  disabled={disabled}
                  onClick={onRestoreStale}
                >
                  {copy.restore}
                </Button>
              ) : null}
            </div>
          </li>
        ) : null}
        {corridors.map((corridor) => {
          const selected = corridor.corridorKey === selectedKey;
          const isStaleTwin =
            staleCorridor?.corridorKey === corridor.corridorKey;
          if (isStaleTwin) return null;
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
                  <span className="block font-medium">
                    {corridorLabel(corridor)}
                  </span>
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
