import { X } from "lucide-react";

export interface ActiveFilterChip {
  id: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: ActiveFilterChip[];
  prefixLabel?: string;
}

export function ActiveFilterChips({
  chips,
  prefixLabel = "Filtros activos:",
}: ActiveFilterChipsProps) {
  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground">{prefixLabel}</span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1"
        >
          {chip.label}
          <button
            onClick={chip.onRemove}
            className="hover:text-destructive"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
