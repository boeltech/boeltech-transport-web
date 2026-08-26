import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import {
  getCurrentMonthExpenseRange,
  useAgingByClient,
  useExpensesByDimension,
  useProfitabilityTrips,
} from "@features/finance";
import { DEFAULT_PROFITABILITY_SCOPE } from "@features/finance/application";
import { TripStatus, TRIP_STATUS_LABELS, type TripStatusType } from "@features/trips";
import { useToast } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { DateField } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { financeCopy } from "@features/finance/presentation/copy/financeCopy";
import {
  exportAgingByClientCsv,
  exportExpensesByDimensionCsv,
  exportProfitabilityTripsCsv,
} from "@features/finance/presentation/utils/financeExportHelpers";
import { reportsCopy } from "../copy/reportsCopy";
import { useExportTrips } from "../hooks/useExportTrips";
import type { TripExportFilters } from "../hooks/tripExportHelpers";

interface ReportsExportsSectionProps {
  canExportTrips: boolean;
  canFinanceAnalytics: boolean;
}

export function ReportsExportsSection({
  canExportTrips,
  canFinanceAnalytics,
}: ReportsExportsSectionProps) {
  const { toast } = useToast();
  const { exportTrips, isExporting } = useExportTrips();

  const [status, setStatus] = useState<TripStatusType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const monthRange = useMemo(() => getCurrentMonthExpenseRange(), []);

  const { data: agingByClient } = useAgingByClient({
    enabled: canFinanceAnalytics,
  });

  const profitabilityFilters = useMemo(
    () => ({
      limit: 100,
      page: 1,
      scope: DEFAULT_PROFITABILITY_SCOPE,
      sortBy: "grossMarginPct" as const,
      sortOrder: "desc" as const,
    }),
    [],
  );

  const { data: profitabilityTrips, isLoading: profitabilityLoading } =
    useProfitabilityTrips(profitabilityFilters, {
      enabled: canFinanceAnalytics,
    });

  const expensesFilters = useMemo(
    () => ({
      dimension: "vehicle" as const,
      from: monthRange.from,
      to: monthRange.to,
      sortBy: "total" as const,
      sortOrder: "desc" as const,
    }),
    [monthRange.from, monthRange.to],
  );

  const { data: expensesByDimension, isLoading: expensesLoading } =
    useExpensesByDimension(expensesFilters, {
      enabled: canFinanceAnalytics,
    });

  const buildTripFilters = useCallback(
    (): TripExportFilters => ({
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search.trim() || undefined,
    }),
    [dateFrom, dateTo, search, status],
  );

  const handleClearTripFilters = useCallback(() => {
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }, []);

  const handleExportTrips = useCallback(async () => {
    if (!canExportTrips) {
      toast({
        title: reportsCopy.permissions.noExport,
        variant: "destructive",
      });
      return;
    }
    await exportTrips(buildTripFilters());
  }, [buildTripFilters, canExportTrips, exportTrips, toast]);

  const handleExportAging = useCallback(() => {
    const rows = agingByClient ?? [];
    if (rows.length === 0) {
      toast({
        title: reportsCopy.exports.finance.emptyTitle,
        description: reportsCopy.exports.finance.agingEmpty,
        variant: "destructive",
      });
      return;
    }
    exportAgingByClientCsv(rows);
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description: financeCopy.exports.toasts.aging,
    });
  }, [agingByClient, toast]);

  const handleExportProfitability = useCallback(() => {
    const rows = profitabilityTrips?.data ?? [];
    if (rows.length === 0) {
      toast({
        title: reportsCopy.exports.finance.emptyTitle,
        description: reportsCopy.exports.finance.marginEmpty,
        variant: "destructive",
      });
      return;
    }
    exportProfitabilityTripsCsv(rows);
    const total = profitabilityTrips?.pagination.total ?? rows.length;
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description:
        total > rows.length
          ? financeCopy.exports.toasts.profitabilityTruncated(rows.length, total)
          : financeCopy.exports.toasts.profitability,
    });
  }, [profitabilityTrips, toast]);

  const handleExportExpenses = useCallback(() => {
    const rows = expensesByDimension ?? [];
    if (rows.length === 0) {
      toast({
        title: reportsCopy.exports.finance.emptyTitle,
        description: reportsCopy.exports.finance.expensesEmpty,
        variant: "destructive",
      });
      return;
    }
    exportExpensesByDimensionCsv(rows, "vehicle");
    toast({
      title: financeCopy.exports.toasts.exportedTitle,
      description: financeCopy.exports.toasts.expenses("Unidad"),
    });
  }, [expensesByDimension, toast]);

  const hasTripFilters = Boolean(status || dateFrom || dateTo || search.trim());
  const showSection = canExportTrips || canFinanceAnalytics;

  if (!showSection) {
    return (
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-tight">
            {reportsCopy.exports.sectionTitle}
          </h2>
          <p className="text-sm text-muted-foreground">
            {reportsCopy.exports.sectionDescription}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {reportsCopy.permissions.noExport}
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="reports-exports-heading">
      <div className="space-y-1">
        <h2
          id="reports-exports-heading"
          className="text-lg font-semibold tracking-tight"
        >
          {reportsCopy.exports.sectionTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          {reportsCopy.exports.sectionDescription}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {canExportTrips ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {reportsCopy.exports.trips.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {reportsCopy.exports.trips.description}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="trip-export-search">
                    {reportsCopy.trips.filters.search}
                  </Label>
                  <Input
                    id="trip-export-search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={reportsCopy.trips.filters.search}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip-export-status">
                    {reportsCopy.trips.filters.status}
                  </Label>
                  <Select
                    value={status || "all"}
                    onValueChange={(value) =>
                      setStatus(value === "all" ? "" : (value as TripStatusType))
                    }
                  >
                    <SelectTrigger id="trip-export-status">
                      <SelectValue placeholder={reportsCopy.trips.filters.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        {reportsCopy.trips.filters.statusAll}
                      </SelectItem>
                      {Object.values(TripStatus).map((statusValue) => (
                        <SelectItem key={statusValue} value={statusValue}>
                          {TRIP_STATUS_LABELS[statusValue]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip-export-date-from">
                    {reportsCopy.trips.filters.dateFrom}
                  </Label>
                  <DateField
                    id="trip-export-date-from"
                    value={dateFrom}
                    onChange={setDateFrom}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trip-export-date-to">
                    {reportsCopy.trips.filters.dateTo}
                  </Label>
                  <DateField
                    id="trip-export-date-to"
                    value={dateTo}
                    onChange={setDateTo}
                  />
                </div>
              </div>

              {hasTripFilters ? (
                <Button variant="outline" size="sm" onClick={handleClearTripFilters}>
                  {reportsCopy.trips.filters.clearFilters}
                </Button>
              ) : null}

              <Button
                className="w-full"
                disabled={isExporting}
                onClick={() => void handleExportTrips()}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {reportsCopy.trips.exporting}
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {reportsCopy.trips.export}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {canFinanceAnalytics ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {reportsCopy.exports.finance.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {reportsCopy.exports.finance.description}
              </p>

              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  onClick={handleExportAging}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {reportsCopy.exports.finance.aging}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  disabled={profitabilityLoading}
                  onClick={handleExportProfitability}
                >
                  {profitabilityLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {reportsCopy.exports.finance.margin}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="justify-start"
                  disabled={expensesLoading}
                  onClick={handleExportExpenses}
                >
                  {expensesLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  {reportsCopy.exports.finance.expenses}
                </Button>
              </div>

              <Button variant="link" size="sm" className="h-auto px-0" asChild>
                <Link to="/finance/analysis">
                  {reportsCopy.exports.finance.advancedFiltersLink}
                  <ExternalLink className="ml-1 h-3.5 w-3.5" aria-hidden />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </section>
  );
}
