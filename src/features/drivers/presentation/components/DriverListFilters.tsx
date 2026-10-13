import { cn } from "@shared/lib/utils/cn";
import { Label } from "@shared/ui/label";
import { ListingFilterPanel } from "@shared/ui/listing";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";

import {
  DriverStatus,
  DRIVER_STATUS_LABELS,
} from "../../domain";
import { driversCopy } from "../copy/driversCopy";

const filterCopy = driversCopy.list.filter;
const branchCopy = driversCopy.list.filters;

export interface DriverListBranchOption {
  value: string;
  label: string;
}

export interface DriverListFiltersProps {
  status: string;
  branchId: string;
  branchOptions: DriverListBranchOption[];
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onBranchChange: (value: string) => void;
}

/**
 * Recortes del padrón de conductores (estado / sucursal).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search;
 * las licencias por vencer, en el riel.
 */
export function DriverListFilters({
  status,
  branchId,
  branchOptions,
  activePanelFilterCount,
  onStatusChange,
  onBranchChange,
}: DriverListFiltersProps) {
  const showBranch = branchOptions.length > 0;

  return (
    <ListingFilterPanel
      triggerLabel={filterCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName={cn(!showBranch && "sm:grid-cols-1")}
    >
      <div className="space-y-1.5">
        <Label htmlFor="drivers-filter-status">{filterCopy.statusLabel}</Label>
        <Select value={status || "all"} onValueChange={onStatusChange}>
          <SelectTrigger
            id="drivers-filter-status"
            className="w-full"
            aria-label={filterCopy.statusLabel}
          >
            <SelectValue placeholder={filterCopy.statusLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterCopy.statusAll}</SelectItem>
            {Object.values(DriverStatus).map((statusValue) => (
              <SelectItem key={statusValue} value={statusValue}>
                {DRIVER_STATUS_LABELS[statusValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showBranch ? (
        <div className="space-y-1.5">
          <Label htmlFor="drivers-filter-branch">{branchCopy.branch}</Label>
          <Select value={branchId || "all"} onValueChange={onBranchChange}>
            <SelectTrigger
              id="drivers-filter-branch"
              className="w-full"
              aria-label={branchCopy.branch}
            >
              <SelectValue placeholder={branchCopy.branch} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{branchCopy.allBranches}</SelectItem>
              {branchOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}
    </ListingFilterPanel>
  );
}
