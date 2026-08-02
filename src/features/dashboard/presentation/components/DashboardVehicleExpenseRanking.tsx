import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { BoeltechBarList, ChartCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ExpensesByDimensionItem } from "@features/finance";
import { dashboardCopy } from "../copy/dashboardCopy";

interface DashboardVehicleExpenseRankingProps {
  rows?: ExpensesByDimensionItem[];
  isLoading: boolean;
  onViewAnalysis: () => void;
  onViewVehicle: (vehicleId: string) => void;
}

export function DashboardVehicleExpenseRanking({
  rows,
  isLoading,
  onViewAnalysis,
  onViewVehicle,
}: DashboardVehicleExpenseRankingProps) {
  const items = useMemo(
    () =>
      (rows ?? []).slice(0, 5).map((row) => ({
        key: row.key,
        label: row.label,
        value: row.totalExpenses,
        token: "chart-3" as const,
      })),
    [rows],
  );

  return (
    <ChartCard
      title={dashboardCopy.vehicleExpenses.title}
      description={dashboardCopy.vehicleExpenses.description}
      isLoading={isLoading}
      aria-label={dashboardCopy.vehicleExpenses.ariaLabel}
      tools={
        <Button type="button" variant="link" size="sm" onClick={onViewAnalysis}>
          {dashboardCopy.vehicleExpenses.viewAnalysis}
        </Button>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          size="sm"
          icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
          title={dashboardCopy.vehicleExpenses.emptyTitle}
          description={dashboardCopy.vehicleExpenses.emptyDescription}
        />
      ) : (
        <BoeltechBarList
          items={items}
          valueFormatter={formatMxCurrency}
          onItemClick={onViewVehicle}
          aria-label={dashboardCopy.vehicleExpenses.ariaLabel}
        />
      )}
    </ChartCard>
  );
}

