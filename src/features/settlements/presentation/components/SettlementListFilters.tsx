import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.workbench.filter;

export interface SettlementListBranchOption {
  id: string;
  name: string;
}

export interface SettlementListFiltersProps {
  branchId: string;
  branches: SettlementListBranchOption[];
  activePanelFilterCount: number;
  onBranchChange: (value: string) => void;
}

/**
 * Recorte de sucursal del workbench Por pagar.
 * Shell canónico: `ListingFilterPanel`. Contratistas y search viven fuera.
 */
export function SettlementListFilters({
  branchId,
  branches,
  activePanelFilterCount,
  onBranchChange,
}: SettlementListFiltersProps) {
  if (branches.length === 0) return null;

  return (
    <ListingFilterPanel
      triggerLabel={copy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-1 sm:max-w-sm"
    >
      <div className="space-y-1.5">
        <Label htmlFor="settlements-filter-branch">{copy.branchLabel}</Label>
        <Select value={branchId || "all"} onValueChange={onBranchChange}>
          <SelectTrigger
            id="settlements-filter-branch"
            className="w-full"
            aria-label={copy.branchLabel}
          >
            <SelectValue placeholder={copy.branchPlaceholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{copy.branchAll}</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.id}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </ListingFilterPanel>
  );
}
