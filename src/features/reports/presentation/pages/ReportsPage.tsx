import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart3, Download, LayoutDashboard, Loader2 } from "lucide-react";
import { TripStatus, TRIP_STATUS_LABELS, type TripStatusType } from "@features/trips";
import { usePermissions } from "@shared/permissions";
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
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { reportsCopy } from "../copy/reportsCopy";
import { useExportTrips } from "../hooks/useExportTrips";
import type { TripExportFilters } from "../hooks/tripExportHelpers";

export function ReportsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { exportTrips, isExporting } = useExportTrips();

  const canExport = hasPermission("reports", "export");

  const [status, setStatus] = useState<TripStatusType | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const buildFilters = useCallback(
    (): TripExportFilters => ({
      status: status || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search.trim() || undefined,
    }),
    [dateFrom, dateTo, search, status],
  );

  const handleClearFilters = useCallback(() => {
    setStatus("");
    setDateFrom("");
    setDateTo("");
    setSearch("");
  }, []);

  const handleExport = useCallback(async () => {
    if (!canExport) {
      toast({
        title: reportsCopy.permissions.noExport,
        variant: "destructive",
      });
      return;
    }
    await exportTrips(buildFilters());
  }, [buildFilters, canExport, exportTrips, toast]);

  const hasFilters = Boolean(status || dateFrom || dateTo || search.trim());

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        icon: <BarChart3 className="h-5 w-5" />,
        title: reportsCopy.page.title,
        subtitle: reportsCopy.page.description,
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{reportsCopy.trips.card.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reportsCopy.trips.card.description}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="trip-export-search">{reportsCopy.trips.filters.search}</Label>
                <Input
                  id="trip-export-search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={reportsCopy.trips.filters.search}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-export-status">{reportsCopy.trips.filters.status}</Label>
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
                    <SelectItem value="all">{reportsCopy.trips.filters.statusAll}</SelectItem>
                    {Object.values(TripStatus).map((statusValue) => (
                      <SelectItem key={statusValue} value={statusValue}>
                        {TRIP_STATUS_LABELS[statusValue]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-export-date-from">{reportsCopy.trips.filters.dateFrom}</Label>
                <DateField
                  id="trip-export-date-from"
                  value={dateFrom}
                  onChange={setDateFrom}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trip-export-date-to">{reportsCopy.trips.filters.dateTo}</Label>
                <DateField
                  id="trip-export-date-to"
                  value={dateTo}
                  onChange={setDateTo}
                />
              </div>
            </div>

            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                {reportsCopy.trips.filters.clearFilters}
              </Button>
            ) : null}

            {canExport ? (
              <Button className="w-full" disabled={isExporting} onClick={() => void handleExport()}>
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
            ) : (
              <p className="text-sm text-muted-foreground">
                {reportsCopy.permissions.noExport}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{reportsCopy.dashboard.card.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {reportsCopy.dashboard.card.description}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/dashboard")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {reportsCopy.dashboard.cta}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DetailPageShell>
  );
}
