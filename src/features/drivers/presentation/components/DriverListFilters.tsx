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
 * El lookup vive en el search; las licencias por vencer, en el riel.
 */
export function DriverListFilters({
  status,
  branchId,
  branchOptions,
  activePanelFilterCount,
  onStatusChange,
  onBranchChange,
}: DriverListFiltersProps) {
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
              "grid gap-3 p-4",
              showBranch && "sm:grid-cols-2",
            )}
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
                <Select
                  value={branchId || "all"}
                  onValueChange={onBranchChange}
                >
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
