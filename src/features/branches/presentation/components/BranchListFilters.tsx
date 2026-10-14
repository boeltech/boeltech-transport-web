import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import { BranchStatus, BRANCH_STATUS_LABELS } from "../../domain";
import { branchesCopy } from "../copy/branchesCopy";

const filterCopy = branchesCopy.list.filter;

export interface BranchListFiltersProps {
  status: string;
  isMain: string;
  createdFrom: string;
  createdTo: string;
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onCreatedFromChange: (value: string) => void;
  onCreatedToChange: (value: string) => void;
}

/**
 * Recortes del padrón de sucursales (estado / tipo / fecha de alta).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search.
 */
export function BranchListFilters({
  status,
  isMain,
  createdFrom,
  createdTo,
  activePanelFilterCount,
  onStatusChange,
  onTypeChange,
  onCreatedFromChange,
  onCreatedToChange,
}: BranchListFiltersProps) {
  return (
    <ListingFilterPanel
      triggerLabel={filterCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName="sm:grid-cols-2"
    >
      <div className="space-y-1.5">
        <Label htmlFor="branches-filter-status">{filterCopy.statusLabel}</Label>
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger
            id="branches-filter-status"
            className="w-full"
            aria-label={filterCopy.statusLabel}
          >
            <SelectValue placeholder={filterCopy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterCopy.statusAll}</SelectItem>
            <SelectItem value={BranchStatus.ACTIVE}>
              {BRANCH_STATUS_LABELS[BranchStatus.ACTIVE]}
            </SelectItem>
            <SelectItem value={BranchStatus.INACTIVE}>
              {BRANCH_STATUS_LABELS[BranchStatus.INACTIVE]}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="branches-filter-type">{filterCopy.typeLabel}</Label>
        <Select value={isMain || "all"} onValueChange={onTypeChange}>
          <SelectTrigger
            id="branches-filter-type"
            className="w-full"
            aria-label={filterCopy.typeLabel}
          >
            <SelectValue placeholder={filterCopy.typeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterCopy.typeAll}</SelectItem>
            <SelectItem value="true">{filterCopy.typeMain}</SelectItem>
            <SelectItem value="false">{filterCopy.typeSecondary}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5 sm:col-span-2">
        <p className="text-sm font-medium leading-none">
          {filterCopy.createdHeading}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="branches-created-from">{filterCopy.from}</Label>
            <Input
              id="branches-created-from"
              type="date"
              value={createdFrom}
              max={createdTo || undefined}
              onChange={(event) => onCreatedFromChange(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="branches-created-to">{filterCopy.to}</Label>
            <Input
              id="branches-created-to"
              type="date"
              value={createdTo}
              min={createdFrom || undefined}
              onChange={(event) => onCreatedToChange(event.target.value)}
            />
          </div>
        </div>
      </div>
    </ListingFilterPanel>
  );
}
