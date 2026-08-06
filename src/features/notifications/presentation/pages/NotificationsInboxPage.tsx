import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { isTenantPortalRole } from "@shared/constants/roles";
import { useRole } from "@shared/permissions";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
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

export function NotificationsInboxPage() {
  const navigate = useNavigate();
  const role = useRole();
  const isPortal = isTenantPortalRole(role);
  const { success: toastSuccess, error: toastError } = useToast();
  const [filters, setFilters] = useState<ListNotificationsFilters>({
    status: "all",
    page: 1,
    pageSize: 25,
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useNotificationsList(filters);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = filterNotificationsForPortal(data?.items ?? [], isPortal);
  const pagination = useMemo(
    () => ({
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 1,
      total: isPortal ? items.length : (data?.total ?? 0),
      limit: data?.pageSize ?? 25,
    }),
    [data, isPortal, items.length],
  );

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
        isError ? (
          <DetailAlertCard severity="critical" title={notificationsCopy.loadError}>
            <p>{getErrorMessage(error)}</p>
          </DetailAlertCard>
        ) : data ? (
          <p className="text-sm text-muted-foreground">
            {isPortal ? items.length : data.total} notificaciones ·{" "}
            {unreadVisible} no leídas
          </p>
        ) : null
      }
      toolbar={{
        filters: <NotificationFilters filters={filters} onChange={setFilters} />,
        onRefresh: () => {
          void refetch();
        },
        isRefreshing: isFetching && !isLoading,
      }}
      primaryAction={{
        label: notificationsCopy.markAllRead,
        onClick: () => void handleMarkAllRead(),
        visible: unreadVisible > 0,
        disabled: markAllRead.isPending,
      }}
      isLoading={isLoading}
      items={items}
      pagination={pagination}
      onPageChange={(page) => setFilters((prev) => ({ ...prev, page }))}
      entityLabelPlural="notificaciones"
      renderTable={() => (
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
      )}
      emptyState={{
        icon: <Bell className="h-8 w-8" />,
        title: notificationsCopy.emptyTitle,
        description: notificationsCopy.emptyDescription,
      }}
    />
  );
}
