import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { isTenantPortalRole } from "@shared/constants/roles";
import { useRole } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { ScrollArea } from "@shared/ui/scroll-area";
import { useNotificationsList } from "../../application";
import type { UserNotification } from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { filterNotificationsForPortal } from "../helpers/portalNotificationVisibility";
import { NotificationRow } from "./NotificationRow";

interface NotificationInboxPanelProps {
  onItemClick: (notification: UserNotification) => void;
  onClose?: () => void;
  limit?: number;
}

export function NotificationInboxPanel({
  onItemClick,
  onClose,
  limit = 8,
}: NotificationInboxPanelProps) {
  const role = useRole();
  const isPortal = isTenantPortalRole(role);
  const { data, isLoading, isError } = useNotificationsList({
    status: "unread",
    page: 1,
    pageSize: limit,
  });

  const items = filterNotificationsForPortal(data?.items ?? [], isPortal);

  return (
    <div className="flex w-[360px] flex-col">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">{notificationsCopy.panelTitle}</h3>
        <Button variant="link" size="sm" className="h-auto px-0" asChild>
          <Link to="/notifications" onClick={onClose}>
            {notificationsCopy.viewAll}
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : isError ? (
        <p className="px-4 py-6 text-sm text-destructive">
          {notificationsCopy.loadError}
        </p>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">
          {notificationsCopy.panelEmpty}
        </p>
      ) : (
        <ScrollArea className="max-h-[420px]">
          <div className="space-y-1 p-2">
            {items.map((item) => (
              <NotificationRow
                key={item.id}
                notification={item}
                compact
                onClick={onItemClick}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
