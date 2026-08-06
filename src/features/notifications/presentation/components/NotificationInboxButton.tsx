import { memo, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { isTenantPortalRole } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import { useRole } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@shared/ui/popover";
import {
  useMarkNotificationRead,
  useUnreadNotificationsCount,
} from "../../application";
import type { UserNotification } from "../../domain";
import { notificationsCopy } from "../copy/notificationsCopy";
import { NotificationInboxPanel } from "./NotificationInboxPanel";
import { NotificationInboxSheet } from "./NotificationInboxSheet";

export const NotificationInboxButton = memo(function NotificationInboxButton() {
  const navigate = useNavigate();
  const role = useRole();
  const isPortal = isTenantPortalRole(role);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Portal: force sync so prior staff-ops drafts are dismissed and badge clears.
  const { data: unreadCount = 0 } = useUnreadNotificationsCount({
    force: isPortal,
  });
  const markRead = useMarkNotificationRead();

  const handleItemClick = useCallback(
    (notification: UserNotification) => {
      if (!notification.readAt) {
        markRead.mutate(notification.id);
      }
      setDesktopOpen(false);
      setMobileOpen(false);
      navigate(notification.actionHref);
    },
    [markRead, navigate],
  );

  const badgeLabel =
    unreadCount > 9 ? "9+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      <div className="hidden md:block">
        <Popover open={desktopOpen} onOpenChange={setDesktopOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={notificationsCopy.ariaOpenInbox}
            >
              <Bell className="h-5 w-5" />
              {badgeLabel && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
                  {badgeLabel}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
            <NotificationInboxPanel
              onItemClick={handleItemClick}
              onClose={() => setDesktopOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="md:hidden">
        <Button
          variant="ghost"
          size="icon"
          className={cn("relative")}
          aria-label={notificationsCopy.ariaOpenInbox}
          onClick={() => setMobileOpen(true)}
        >
          <Bell className="h-5 w-5" />
          {badgeLabel && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
              {badgeLabel}
            </span>
          )}
        </Button>
        <NotificationInboxSheet
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          onItemClick={handleItemClick}
        />
      </div>
    </>
  );
});
