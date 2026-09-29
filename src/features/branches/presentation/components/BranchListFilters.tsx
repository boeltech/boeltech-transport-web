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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

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
 * El lookup vive en el search; Eliminadas y Exportar no son recortes.
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
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  const hasActiveFilters = activePanelFilterCount > 0;
  const open = hasActiveFilters
    ? !userCollapsedWhileActive
    : userExpandedWhileIdle;

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
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
