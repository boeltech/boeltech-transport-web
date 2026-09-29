import { useState } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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
}

/**
 * Recortes del padrón de vehículos (estado / tipo / sucursal).
 * El lookup vive en el search; importar y la vista no son recortes.
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
}: VehicleListFiltersProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activePanelFilterCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;
  const showBranch = branchOptions.length > 0;

  const handleOpenChange = (next: boolean) => {
    if (hasActiveFilters) {
      setUserCollapsedWhileActive(!next);
      return;
    }
    setUserExpandedWhileIdle(next);
  };

  return (
    <Collapsible
      open={open}
      onOpenChange={handleOpenChange}
      className="contents"
    >
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          aria-expanded={open}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {filterCopy.showFilters}
          {activePanelFilterCount > 0 ? (
            <Badge variant="secondary" className="h-5 min-w-5 px-1.5 tabular-nums">
              {activePanelFilterCount}
            </Badge>
          ) : null}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="order-last w-full basis-full">
        <Card className="bg-muted/30">
          <CardContent
            className={cn(
              "grid gap-3 p-4 sm:grid-cols-2",
              showBranch && "lg:grid-cols-3",
            )}
          >
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
                <Select
                  value={branchId || "all"}
                  onValueChange={onBranchChange}
                >
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
