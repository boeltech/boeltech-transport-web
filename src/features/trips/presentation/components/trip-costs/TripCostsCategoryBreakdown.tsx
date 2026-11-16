import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { formatCurrency } from "@features/trips";
import type { ExpenseCategoryType } from "@features/trips/domain";
import { EXPENSE_CATEGORY_LABELS } from "@features/trips/domain";
import { cn } from "@shared/lib/utils/cn";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.costs;

/** Barras por categoría (tokens chart; no inventar tipos). */
const METER_TONES = [
  "bg-primary",
  "bg-chart-2",
  "bg-chart-3",
] as const;

export interface TripCostsCategoryBreakdownProps {
  entries: [string, number][];
  className?: string;
}

export function TripCostsCategoryBreakdown({
  entries,
  className,
}: TripCostsCategoryBreakdownProps) {
  if (entries.length === 0) return null;

  const totalAmount = entries.reduce((sum, [, amount]) => sum + amount, 0);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{copy.section.breakdown}</CardTitle>
          <CardDescription>{copy.hint.breakdown}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {entries.map(([category, amount], index) => {
          const pct =
            totalAmount > 0 ? (amount / totalAmount) * 100 : 0;
          const pctLabel =
            totalAmount > 0
              ? `${pct.toFixed(1)}%`
              : "0%";
          return (
            <div key={category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-foreground">
                  {EXPENSE_CATEGORY_LABELS[category as ExpenseCategoryType] ||
                    category}
                </span>
                <span className="shrink-0 font-medium tabular-nums text-muted-foreground">
                  {formatCurrency(amount)}
                  <span className="ml-1.5 text-xs font-normal">· {pctLabel}</span>
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width]",
                    METER_TONES[index % METER_TONES.length],
                  )}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
