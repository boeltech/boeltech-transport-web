import { useMemo } from "react";
import { Download, FileSpreadsheet } from "lucide-react";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { useToast } from "@shared/hooks";
import {
  useAgingByClient,
  useExpensesByDimension,
  useProfitabilityTrips,
} from "@features/finance/application";
import { downloadCsv } from "@shared/utils/exportCsv";
import { financeCopy } from "../copy";

interface ReportsTabProps {
  queriesEnabled: boolean;
}

function nowDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function ReportsTab({ queriesEnabled }: ReportsTabProps) {
  const { toast } = useToast();
  const { data: profitability } = useProfitabilityTrips(
    { page: 1, limit: 100, sortBy: "grossMarginPct", sortOrder: "desc" },
    { enabled: queriesEnabled },
  );
  const { data: agingByClient } = useAgingByClient({ enabled: queriesEnabled });
  const { data: expensesByDimension } = useExpensesByDimension(
    {
      dimension: "client",
      sortBy: "total",
      sortOrder: "desc",
    },
    { enabled: queriesEnabled },
  );

  const totalRows = useMemo(
    () =>
      (profitability?.data.length ?? 0) +
      (agingByClient?.length ?? 0) +
      (expensesByDimension?.length ?? 0),
    [profitability, agingByClient, expensesByDimension],
  );

  const exportProfitability = () => {
    const rows = (profitability?.data ?? []).map((row) => [
      row.tripCode,
      row.clientName ?? "",
      row.revenue,
      row.actualTotal,
      row.grossMargin,
      row.grossMarginPct,
      row.profitabilityStatus,
    ]);
    downloadCsv(
      `${financeCopy.reports.files.profitability}-${nowDateKey()}.csv`,
      [
        "trip_code",
        "client_name",
        "revenue",
        "actual_total",
        "gross_margin",
        "gross_margin_pct",
        "profitability_status",
      ],
      rows,
    );
    toast({
      title: financeCopy.reports.toasts.exportedTitle,
      description: financeCopy.reports.toasts.profitability,
    });
  };

  const exportAging = () => {
    const rows = (agingByClient ?? []).map((row) => [
      row.clientRfc,
      row.clientName,
      row.totalBalance,
      row.invoiceCount,
      row.bucket030,
      row.bucket3160,
      row.bucket6190,
      row.bucket90Plus,
    ]);
    downloadCsv(
      `${financeCopy.reports.files.aging}-${nowDateKey()}.csv`,
      [
        "client_rfc",
        "client_name",
        "total_balance",
        "invoice_count",
        "bucket_0_30",
        "bucket_31_60",
        "bucket_61_90",
        "bucket_90_plus",
      ],
      rows,
    );
    toast({
      title: financeCopy.reports.toasts.exportedTitle,
      description: financeCopy.reports.toasts.aging,
    });
  };

  const exportExpenses = () => {
    const rows = (expensesByDimension ?? []).map((row) => [
      row.key,
      row.label,
      row.tripCount,
      row.totalExpenses,
      row.avgExpensePerTrip,
    ]);
    downloadCsv(
      `${financeCopy.reports.files.expensesByClient}-${nowDateKey()}.csv`,
      ["key", "label", "trip_count", "total_expenses", "avg_expense_per_trip"],
      rows,
    );
    toast({
      title: financeCopy.reports.toasts.exportedTitle,
      description: financeCopy.reports.toasts.expenses,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {financeCopy.reports.cards.profitability.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {financeCopy.reports.cards.profitability.description}
          </p>
          <Button className="w-full" onClick={exportProfitability}>
            <Download className="h-4 w-4 mr-2" />
            {financeCopy.reports.actions.exportCsv}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{financeCopy.reports.cards.aging.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {financeCopy.reports.cards.aging.description}
          </p>
          <Button className="w-full" onClick={exportAging}>
            <Download className="h-4 w-4 mr-2" />
            {financeCopy.reports.actions.exportCsv}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{financeCopy.reports.cards.expenses.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {financeCopy.reports.cards.expenses.description}
          </p>
          <Button className="w-full" onClick={exportExpenses}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            {financeCopy.reports.actions.exportCsv}
          </Button>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">{financeCopy.reports.cards.coverage.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {financeCopy.reports.cards.coverage.descriptionPrefix}{" "}
            <span className="font-semibold text-foreground">{totalRows}</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
