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
  VehicleStatus,
  VehicleType,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "../../domain";
import { vehiclesCopy } from "../copy/vehiclesCopy";

const filterCopy = vehiclesCopy.list.filter;
const branchCopy = vehiclesCopy.list.filters;

export interface VehicleListBranchOption {
  value: string;
  label: string;
}

export interface VehicleListFiltersProps {
  status: string;
  type: string;
  branchId: string;
  branchOptions: VehicleListBranchOption[];
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onBranchChange: (value: string) => void;
  /** En la vista «Dadas de baja» el estado operativo no aplica. */
  showStatus?: boolean;
}

/**
 * Recortes del padrón de vehículos (estado / tipo / sucursal).
 * Shell canónico: `ListingFilterPanel`. El lookup vive en el search.
 */
export function VehicleListFilters({
  status,
  type,
  branchId,
  branchOptions,
  activePanelFilterCount,
  onStatusChange,
  onTypeChange,
  onBranchChange,
  showStatus = true,
}: VehicleListFiltersProps) {
  const showBranch = branchOptions.length > 0;

  return (
    <ListingFilterPanel
      triggerLabel={filterCopy.showFilters}
      activeCount={activePanelFilterCount}
      contentClassName={cn(
        showBranch && showStatus && "lg:grid-cols-3",
        !showStatus && !showBranch && "sm:grid-cols-1",
      )}
    >
      {showStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="vehicles-filter-status">{filterCopy.statusLabel}</Label>
          <Select value={status || "all"} onValueChange={onStatusChange}>
            <SelectTrigger
              id="vehicles-filter-status"
              className="w-full"
              aria-label={filterCopy.statusLabel}
            >
              <SelectValue placeholder={filterCopy.statusLabel} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filterCopy.statusAll}</SelectItem>
              {Object.values(VehicleStatus).map((statusValue) => (
                <SelectItem key={statusValue} value={statusValue}>
                  {VEHICLE_STATUS_LABELS[statusValue]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="vehicles-filter-type">{filterCopy.typeLabel}</Label>
        <Select value={type || "all"} onValueChange={onTypeChange}>
          <SelectTrigger
            id="vehicles-filter-type"
            className="w-full"
            aria-label={filterCopy.typeLabel}
          >
            <SelectValue placeholder={filterCopy.typeLabel} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{filterCopy.typeAll}</SelectItem>
            {Object.values(VehicleType).map((typeValue) => (
              <SelectItem key={typeValue} value={typeValue}>
                {VEHICLE_TYPE_LABELS[typeValue]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showBranch ? (
        <div className="space-y-1.5">
          <Label htmlFor="vehicles-filter-branch">{branchCopy.branch}</Label>
          <Select value={branchId || "all"} onValueChange={onBranchChange}>
            <SelectTrigger
              id="vehicles-filter-branch"
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
