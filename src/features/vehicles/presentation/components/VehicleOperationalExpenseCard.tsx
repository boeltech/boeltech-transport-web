import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ReceiptText } from "lucide-react";
import { useAuth } from "@features/auth";
import {
  getCurrentMonthExpenseRange,
  useExpensesByDimension,
} from "@features/finance";
import { canAccessFinanceSummaryRoute } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { vehiclesCopy } from "../copy";

interface VehicleOperationalExpenseCardProps {
  vehicleId: string;
}

export function VehicleOperationalExpenseCard({
  vehicleId,
}: VehicleOperationalExpenseCardProps) {
  const { user } = useAuth();
  const canViewFinance = canAccessFinanceSummaryRoute(user?.role);
  const period = useMemo(() => getCurrentMonthExpenseRange(), []);
  const { data, isLoading } = useExpensesByDimension(
    {
      dimension: "vehicle",
      vehicleId,
      ...period,
      sortBy: "total",
      sortOrder: "desc",
    },
    { enabled: canViewFinance && Boolean(vehicleId) },
  );

  if (!canViewFinance) return null;

  const row = data?.[0];
  const copy = vehiclesCopy.detail.section.operationalExpenses;
  const financeHref =
    `/finance?tab=analysis&view=expenses&vehicleId=${encodeURIComponent(vehicleId)}` +
    `&from=${period.from}&to=${period.to}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ReceiptText className="h-4 w-4 shrink-0 text-primary" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-0 sm:flex-row sm:items-end sm:justify-between">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div>
            <p className="text-2xl font-semibold tabular-nums">
              {formatMxCurrency(row?.totalExpenses ?? 0)}
            </p>
            <p className="text-sm text-muted-foreground">
              {row ? copy.trips(row.tripCount) : copy.empty}
            </p>
          </div>
        )}
        <Button asChild variant="outline" size="sm">
          <Link to={financeHref}>{copy.viewAnalysis}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

