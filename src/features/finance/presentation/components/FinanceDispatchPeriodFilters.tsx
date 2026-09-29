import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
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

import {
  DISPATCH_RUN_STATUSES,
  type DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

const copy = dispatchRunsCopy.tab.filters;
const ALL_OPTION = "all";

export interface FinanceDispatchPeriodSchemeOption {
  id: string;
  name: string;
}

export interface FinanceDispatchPeriodFiltersProps {
  status: string;
  billingSchemeId: string;
  schemes: readonly FinanceDispatchPeriodSchemeOption[];
  activePanelFilterCount: number;
  onStatusChange: (value: string) => void;
  onSchemeChange: (value: string) => void;
}

/**
 * Recortes del listado de envíos del periodo (estado / frecuencia).
 * Armar y Nueva frecuencia no son recortes; no hay lookup.
 */
export function FinanceDispatchPeriodFilters({
  status,
  billingSchemeId,
  schemes,
  activePanelFilterCount,
  onStatusChange,
  onSchemeChange,
}: FinanceDispatchPeriodFiltersProps) {
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
          <CardContent className="grid gap-3 p-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="dispatch-period-status">{copy.statusLabel}</Label>
              <Select
                value={status || ALL_OPTION}
                onValueChange={onStatusChange}
              >
                <SelectTrigger
                  id="dispatch-period-status"
                  className="w-full"
                  aria-label={copy.statusLabel}
                >
                  <SelectValue placeholder={copy.statusLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>{copy.statusAll}</SelectItem>
                  {DISPATCH_RUN_STATUSES.map((item: DispatchRunStatus) => (
                    <SelectItem key={item} value={item}>
                      {dispatchRunsCopy.status[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dispatch-period-scheme">{copy.schemeLabel}</Label>
              <Select
                value={billingSchemeId || ALL_OPTION}
                onValueChange={onSchemeChange}
              >
                <SelectTrigger
                  id="dispatch-period-scheme"
                  className="w-full"
                  aria-label={copy.schemeLabel}
                >
                  <SelectValue placeholder={copy.schemeLabel} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_OPTION}>{copy.schemeAll}</SelectItem>
                  {schemes.map((scheme) => (
                    <SelectItem key={scheme.id} value={scheme.id}>
                      {scheme.name}
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
