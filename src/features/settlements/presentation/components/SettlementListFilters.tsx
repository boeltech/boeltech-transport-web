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
 * Recortes del workbench de pagos (hoy: sucursal).
 * La etapa vive en el scorecard; el lookup, en el search.
 */
export function SettlementListFilters({
  branchId,
  branches,
  activePanelFilterCount,
  onBranchChange,
}: SettlementListFiltersProps) {
  const [userCollapsedWhileActive, setUserCollapsedWhileActive] = useState(false);
  const [userExpandedWhileIdle, setUserExpandedWhileIdle] = useState(false);

  if (branches.length === 0) return null;

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
          {copy.showFilters}
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
          <CardContent className="grid gap-3 p-4 sm:max-w-sm">
            <div className="space-y-1.5">
              <Label htmlFor="settlements-filter-branch">{copy.branchLabel}</Label>
              <Select
                value={branchId || "all"}
                onValueChange={onBranchChange}
              >
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
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
}
