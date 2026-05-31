import { PieChart } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { formatCurrency } from "@features/trips";
import type { ExpenseCategoryType } from "@features/trips/domain";
import { EXPENSE_CATEGORY_LABELS } from "@features/trips/domain";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

export interface TripCostsCategoryBreakdownProps {
  entries: [string, number][];
  className?: string;
}

export function TripCostsCategoryBreakdown({
  entries,
  className,
}: TripCostsCategoryBreakdownProps) {
  if (entries.length === 0) return null;

  const maxAmount = entries.reduce((max, [, amount]) => Math.max(max, amount), 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PieChart className="h-4 w-4 shrink-0 text-muted-foreground" />
          {copy.section.breakdown}
        </CardTitle>
        <CardDescription>{copy.hint.breakdown}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.map(([category, amount]) => {
          const pct =
            maxAmount > 0 ? Math.round((amount / maxAmount) * 100) : 0;
          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-muted-foreground">
                  {EXPENSE_CATEGORY_LABELS[category as ExpenseCategoryType] ||
                    category}
                </span>
                <span className="shrink-0 font-medium tabular-nums">
                  {formatCurrency(amount)}
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
    </Card>
  );
}
