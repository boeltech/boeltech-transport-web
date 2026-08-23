import { useState } from "react";
import { ChevronDown, PieChart } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Button } from "@shared/ui/button";
import { formatCurrency } from "@features/trips";
import type { ExpenseCategoryType } from "@features/trips/domain";
import { EXPENSE_CATEGORY_LABELS } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export interface TripCostsCategoryBreakdownProps {
  entries: [string, number][];
  className?: string;
  /** Abierto por defecto (false = colapsado — handoff D6). */
  defaultOpen?: boolean;
}

export function TripCostsCategoryBreakdown({
  entries,
  className,
  defaultOpen = false,
}: TripCostsCategoryBreakdownProps) {
  const [open, setOpen] = useState(defaultOpen);

  if (entries.length === 0) return null;

  const totalAmount = entries.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <Card className={className}>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="h-4 w-4 shrink-0 text-muted-foreground" />
                {copy.section.breakdown}
              </CardTitle>
              {open ? (
                <CardDescription>{copy.hint.breakdown}</CardDescription>
              ) : null}
            </div>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1 text-xs text-muted-foreground"
              >
                {open
                  ? copy.hint.breakdownToggleHide
                  : copy.hint.breakdownToggleShow}
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 transition-transform",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>
        <CollapsibleContent>
          <CardContent className="space-y-4 pt-0">
            {entries.map(([category, amount]) => {
              const pct =
                totalAmount > 0
                  ? Math.round((amount / totalAmount) * 100)
                  : 0;
              return (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-muted-foreground">
                      {EXPENSE_CATEGORY_LABELS[category as ExpenseCategoryType] ||
                        category}
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      {formatCurrency(amount)}
                      <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                        {pct}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary/75 transition-[width]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
