import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";
import { isTenantPortalRole } from "@shared/constants/roles";
import { useRole } from "@shared/permissions";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
} from "../../application";
import type { ListNotificationsFilters } from "../../domain";
import { NotificationFilters } from "../components/NotificationFilters";
import { NotificationRow } from "../components/NotificationRow";
import { notificationsCopy } from "../copy/notificationsCopy";
import { filterNotificationsForPortal } from "../helpers/portalNotificationVisibility";

const DEFAULT_FILTERS: ListNotificationsFilters = {
  status: "all",
  page: 1,
  pageSize: 25,
};

function countActivePanelFilters(filters: ListNotificationsFilters): number {
  let count = 0;
  if (filters.status != null && filters.status !== "all") count += 1;
  if (filters.source != null) count += 1;
  if (filters.severity != null) count += 1;
  if (filters.type != null) count += 1;
  return count;
}

export function NotificationsInboxPage() {
  const navigate = useNavigate();
  const role = useRole();
  const isPortal = isTenantPortalRole(role);
  const { success: toastSuccess, error: toastError } = useToast();
  const [filters, setFilters] = useState<ListNotificationsFilters>(DEFAULT_FILTERS);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useNotificationsList(filters);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = filterNotificationsForPortal(data?.items ?? [], isPortal);
  const activePanelFilterCount = countActivePanelFilters(filters);
  const hasFilters = activePanelFilterCount > 0;
  const showLoadError = isError && !isLoading;

  const pagination = useMemo(
    () =>
      showLoadError
        ? undefined
        : {
            page: data?.page ?? 1,
            totalPages: data?.totalPages ?? 1,
            total: isPortal ? items.length : (data?.total ?? 0),
            limit: data?.pageSize ?? 25,
          },
    [data, isPortal, items.length, showLoadError],
  );

  const handleClearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, [setFilters]);

  const handleItemClick = useCallback(
    (notification: { id: string; readAt: string | null; actionHref: string }) => {
      if (!notification.readAt) {
        markRead.mutate(notification.id);
      }
      navigate(notification.actionHref);
    },
    [markRead, navigate],
  );

  const handleMarkAllRead = useCallback(async () => {
    try {
      const updated = await markAllRead.mutateAsync({
        source: filters.source,
        type: filters.type,
      });
      toastSuccess(
        notificationsCopy.markAllReadSuccess,
        `${updated} actualizadas`,
      );
    } catch (err) {
      toastError(getErrorMessage(err));
    }
  }, [filters.source, filters.type, markAllRead, toastError, toastSuccess]);

  const unreadVisible = isPortal
    ? items.filter((item) => item.readAt == null).length
    : (data?.unreadCount ?? 0);

  return (
    <ListPageShell
      title={notificationsCopy.pageTitle}
      description={notificationsCopy.pageDescription}
      beforeToolbar={
        showLoadError ? (
          <DetailAlertCard
            severity="critical"
            title={notificationsCopy.loadError}
            items={[{ text: getErrorMessage(error) }]}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
              >
                {notificationsCopy.retry}
              </Button>
            }
          />
        ) : data ? (
          <p className="text-sm text-muted-foreground">
            {isPortal ? items.length : data.total} notificaciones ·{" "}
            {unreadVisible} no leídas
          </p>
        ) : null
      }
      toolbar={{
        filters: (
          <NotificationFilters
            key={hasFilters ? "filters-active" : "filters-idle"}
            filters={filters}
            onChange={setFilters}
            activePanelFilterCount={activePanelFilterCount}
          />
        ),
        onRefresh: () => {
          void refetch();
        },
        isRefreshing: isFetching && !isLoading,
        onClearFilters: handleClearFilters,
        hasFilters,
      }}
      primaryAction={{
        label: notificationsCopy.markAllRead,
        onClick: () => void handleMarkAllRead(),
        visible: !showLoadError && unreadVisible > 0,
        disabled: markAllRead.isPending,
      }}
      isLoading={isLoading || showLoadError}
      items={items}
      pagination={pagination}
      onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      entityLabelPlural="notificaciones"
      renderTable={() => {
        if (showLoadError) return null;
        return (
          <div className="overflow-hidden rounded-lg border bg-card">
            <div className="divide-y">
              {items.map((item) => (
                <NotificationRow
                  key={item.id}
                  notification={item}
                  onClick={handleItemClick}
                />
              ))}
            </div>
          </div>
        );
      }}
      emptyState={{
        icon: hasFilters ? (
          <Search className="h-8 w-8" />
        ) : (
          <Bell className="h-8 w-8" />
        ),
        title: hasFilters
          ? notificationsCopy.emptyFilteredTitle
          : notificationsCopy.emptyTitle,
        description: hasFilters
          ? notificationsCopy.emptyFilteredDescription
          : notificationsCopy.emptyDescription,
        secondaryCta: hasFilters
          ? {
              label: notificationsCopy.clearFilters,
              onClick: handleClearFilters,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
