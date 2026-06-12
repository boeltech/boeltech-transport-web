import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
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

export function NotificationsInboxPage() {
  const navigate = useNavigate();
  const { toastSuccess, toastError } = useToast();
  const [filters, setFilters] = useState<ListNotificationsFilters>({
    status: "all",
    page: 1,
    pageSize: 25,
  });

  const { data, isLoading, isError, error, refetch, isFetching } =
    useNotificationsList(filters);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const items = data?.items ?? [];
  const pagination = useMemo(
    () => ({
      page: data?.page ?? 1,
      totalPages: data?.totalPages ?? 1,
      total: data?.total ?? 0,
      limit: data?.pageSize ?? 25,
    }),
    [data],
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
            {data.total} notificaciones · {data.unreadCount} no leídas
          </p>
        ) : null
      }
      toolbar={{
        filters: <NotificationFilters filters={filters} onChange={setFilters} />,
        onRefresh: () => refetch(),
        isRefreshing: isFetching && !isLoading,
      }}
      primaryAction={{
        label: notificationsCopy.markAllRead,
        onClick: () => void handleMarkAllRead(),
        visible: (data?.unreadCount ?? 0) > 0,
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
