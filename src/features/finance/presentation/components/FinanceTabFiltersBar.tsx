import { Button } from "@shared/ui/button";
import { ActiveFilterChips, type ActiveFilterChip } from "@shared/ui/listing";
import { financeCopy } from "../copy";

interface FinanceTabFiltersBarProps {
  chips: ActiveFilterChip[];
  hasFilters: boolean;
  onClearFilters: () => void;
}

export function FinanceTabFiltersBar({
  chips,
  hasFilters,
  onClearFilters,
}: FinanceTabFiltersBarProps) {
  if (!hasFilters) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ActiveFilterChips chips={chips} />
      <Button variant="ghost" size="sm" onClick={onClearFilters}>
        {financeCopy.page.clearFilters}
      </Button>
    </div>
  );
}
