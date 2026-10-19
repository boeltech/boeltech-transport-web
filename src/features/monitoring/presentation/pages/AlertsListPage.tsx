import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Settings } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Switch } from "@shared/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useGpsAlerts, useMarkAlertRead } from "../../application";
import {
  ALERT_SETTINGS_PATH,
  ALERTS_WINDOW_DAYS,
  GPS_ALERT_TYPES,
  type GpsAlert,
  type GpsAlertTypeCode,
} from "../../domain";
import { AlertListItem } from "../components/AlertListItem";
import { monitoringCopy } from "../copy/monitoringCopy";

function windowRangeIso(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(
    to.getTime() - ALERTS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
  );
  return { from: from.toISOString(), to: to.toISOString() };
}

export function AlertsListPage() {
  const copy = monitoringCopy.alerts;
  const { hasPermission } = usePermissions();
  const canAdmin = hasPermission("gps_tracking", "admin");

  const [alertType, setAlertType] = useState<GpsAlertTypeCode | "all">("all");
  const [vehicleId, setVehicleId] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const range = useMemo(() => windowRangeIso(), []);

  const query = useGpsAlerts({
    from: range.from,
    to: range.to,
    alertType: alertType === "all" ? undefined : alertType,
    vehicleId: vehicleId === "all" ? undefined : vehicleId,
    unreadOnly: unreadOnly || undefined,
    page,
    pageSize: 50,
  });

  const markRead = useMarkAlertRead();

  const items = useMemo(() => query.data?.items ?? [], [query.data?.items]);
  const pagination = query.data?.pagination;

  const vehicleOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const alert of items) {
      if (!map.has(alert.vehicleId)) {
        map.set(
          alert.vehicleId,
          [alert.vehicleEconomicNumber, alert.vehiclePlate]
            .filter(Boolean)
            .join(" · "),
        );
      }
    }
    if (vehicleId !== "all" && !map.has(vehicleId)) {
      map.set(vehicleId, vehicleId.slice(0, 8));
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  }, [items, vehicleId]);

  const handleActivate = (alert: GpsAlert) => {
    if (alert.readAt == null) {
      markRead.mutate(alert.id);
    }
  };

  return (
    <ListPageShell
      title={copy.title}
      description={copy.description}
      entityLabelPlural="alertas"
      toolbar={{
        filters: (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="alert-filter-type">{copy.filters.type}</Label>
              <Select
                value={alertType}
                onValueChange={(v) => {
                  setAlertType(v as GpsAlertTypeCode | "all");
                  setPage(1);
                }}
              >
                <SelectTrigger id="alert-filter-type" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allTypes}</SelectItem>
                  {GPS_ALERT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {copy.types[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alert-filter-vehicle">
                {copy.filters.vehicle}
              </Label>
              <Select
                value={vehicleId}
                onValueChange={(v) => {
                  setVehicleId(v);
                  setPage(1);
                }}
              >
                <SelectTrigger id="alert-filter-vehicle" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filters.allVehicles}</SelectItem>
                  {vehicleOptions.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>{copy.filters.period}</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                {copy.filters.last7d}
              </div>
            </div>

            <div className="flex h-9 items-center gap-2">
              <Switch
                id="alert-filter-unread"
                checked={unreadOnly}
                onCheckedChange={(v) => {
                  setUnreadOnly(v);
                  setPage(1);
                }}
              />
              <Label htmlFor="alert-filter-unread">
                {copy.filters.unreadOnly}
              </Label>
            </div>
          </div>
        ),
        extraActions: canAdmin ? (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link to={ALERT_SETTINGS_PATH}>
              <Settings className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.settingsLink}
            </Link>
          </Button>
        ) : null,
        onRefresh: () => void query.refetch(),
        isRefreshing: query.isFetching,
      }}
      beforeToolbar={
        query.isError ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.errorTitle}</AlertTitle>
            <AlertDescription>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void query.refetch()}
              >
                {copy.retry}
              </Button>
            </AlertDescription>
          </Alert>
        ) : null
      }
      items={items}
      isLoading={query.isLoading}
      emptyState={{
        icon: <AlertTriangle className="h-8 w-8" />,
        title: copy.emptyTitle,
        description: copy.emptyDescription,
      }}
      pagination={
        pagination
          ? {
              page: pagination.page,
              totalPages: pagination.totalPages,
              total: pagination.total,
              limit: pagination.pageSize,
            }
          : undefined
      }
      onPageChange={setPage}
      renderTable={() => (
        <div className="space-y-3" data-testid="alerts-list">
          {items.map((alert) => (
            <AlertListItem
              key={alert.id}
              alert={alert}
              onActivate={handleActivate}
            />
          ))}
        </div>
      )}
    />
  );
}

export default AlertsListPage;
