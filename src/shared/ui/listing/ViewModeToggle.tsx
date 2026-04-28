import { Button } from "@shared/ui/button";
import { LayoutGrid, LayoutList } from "lucide-react";

export type ListingViewMode = "table" | "cards";

interface ViewModeToggleProps {
  value: ListingViewMode;
  onChange: (mode: ListingViewMode) => void;
  className?: string;
}

export function ViewModeToggle({
  value,
  onChange,
  className,
}: ViewModeToggleProps) {
  return (
    <div className={`ml-auto flex rounded-md border ${className ?? ""}`}>
      <Button
        variant={value === "table" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onChange("table")}
        title="Vista de tabla"
      >
        <LayoutList className="h-4 w-4" />
      </Button>
      <Button
        variant={value === "cards" ? "secondary" : "ghost"}
        size="icon"
        onClick={() => onChange("cards")}
        title="Vista de tarjetas"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
