import { Link } from "react-router-dom";
import { Bell, Loader2 } from "lucide-react";
import { isTenantPortalRole } from "@shared/constants/roles";
import { useRole } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { ScrollArea } from "@shared/ui/scroll-area";
import { useNotificationsList } from "../../application";
import type { UserNotification } from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { filterNotificationsForPortal } from "../helpers/portalNotificationVisibility";
import { NotificationRow } from "./NotificationRow";

interface NotificationInboxSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemClick: (notification: UserNotification) => void;
}

export function NotificationInboxSheet({
  open,
  onOpenChange,
  onItemClick,
}: NotificationInboxSheetProps) {
  const role = useRole();
  const isPortal = isTenantPortalRole(role);
  const { data, isLoading, isError, refetch } = useNotificationsList(
    {
      status: "unread",
      page: 1,
      pageSize: 10,
    },
    { enabled: open },
  );

  const items = filterNotificationsForPortal(data?.items ?? [], isPortal);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl px-0">
        <SheetHeader className="border-b px-4 pb-4 text-left">
          <SheetTitle>{notificationsCopy.panelTitle}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
              <p className="text-sm text-destructive">
                {notificationsCopy.loadError}
              </p>
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
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Bell />}
              title={notificationsCopy.panelEmpty}
              size="sm"
              className="px-4"
            />
          ) : (
            <ScrollArea className="flex-1 px-2 py-2">
              <div className="space-y-1">
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

          <div className="border-t p-4">
            <Button variant="outline" className="w-full" asChild>
              <Link to="/notifications" onClick={() => onOpenChange(false)}>
                {notificationsCopy.viewAll}
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
