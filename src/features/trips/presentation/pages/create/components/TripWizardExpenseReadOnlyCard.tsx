import { CircleDollarSign, Receipt } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Badge } from "@shared/ui/badge";
import { EmptyState } from "@shared/ui/feedback-states";

import {
  EXPENSE_CATEGORY_MAP,
  formatMxCurrency,
  type TripWizardExpenseLine,
} from "../../../components/trip-financial";
import type { TripExpenseFormValues } from "./validation";

export interface TripWizardExpenseReadOnlyCardProps {
  kind: "cost" | "expense";
  items: TripWizardExpenseLine[];
  maxVisible?: number;
}

export function TripWizardExpenseReadOnlyCard({
  kind,
  items,
  maxVisible = 8,
}: TripWizardExpenseReadOnlyCardProps) {
  const isCost = kind === "cost";
  const title = isCost ? "Costos operativos" : "Gastos indirectos";
  const Icon = isCost ? CircleDollarSign : Receipt;
  const emptyTitle = isCost ? "Sin costos registrados" : "Sin gastos registrados";
  const visible = items.slice(0, maxVisible);
  const hiddenCount = Math.max(0, items.length - maxVisible);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 shrink-0" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {items.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <EmptyState icon={<Icon />} size="sm" title={emptyTitle} />
        ) : (
          <div className="space-y-2">
            {visible.map((item, index) => {
              const category = EXPENSE_CATEGORY_MAP.get(
                item.category as TripExpenseFormValues["category"],
              );
              return (
                <div
                  key={item.id ?? `${kind}-${index}`}
                  className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <div className="shrink-0 rounded-md bg-muted p-1.5">
                    {category ? (
                      <category.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {category?.label ?? "Sin categoría"}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold">
                    -{formatMxCurrency(item.amount)}
                  </span>
                </div>
              );
            })}
            {hiddenCount > 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                +{hiddenCount} concepto{hiddenCount !== 1 ? "s" : ""} más
              </p>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
