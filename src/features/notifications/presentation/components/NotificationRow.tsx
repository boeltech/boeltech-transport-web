import { memo } from "react";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import type { UserNotification } from "../../domain";
import {
  getNotificationFallbackIconForSeverity,
  NOTIFICATION_TYPE_CONFIG,
} from "../config/notificationTypeConfig";

interface NotificationRowProps {
  notification: UserNotification;
  onClick?: (notification: UserNotification) => void;
  compact?: boolean;
  className?: string;
}

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const NotificationRow = memo(function NotificationRow({
  notification,
  onClick,
  compact = false,
  className,
}: NotificationRowProps) {
  const config = NOTIFICATION_TYPE_CONFIG[notification.type];
  const Icon =
    config?.icon ??
    getNotificationFallbackIconForSeverity(notification.severity);
  const isUnread = notification.readAt == null;

  return (
    <button
      type="button"
      onClick={() => onClick?.(notification)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border border-transparent px-3 py-2.5 text-left transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isUnread && "bg-muted/30",
        className,
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
          isUnread ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              isUnread ? "font-semibold text-foreground" : "font-medium",
            )}
          >
            {notification.title}
          </p>
          {isUnread && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>

        {notification.body && (
          <p
            className={cn(
              "text-muted-foreground",
              compact ? "line-clamp-2 text-xs" : "line-clamp-3 text-sm",
            )}
          >
            {notification.body}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {formatWhen(notification.createdAt)}
          </span>
          {!compact && (
            <Badge variant="neutral" tone="soft" className="text-[10px]">
              {notification.source}
            </Badge>
          )}
        </div>
      </div>
    </button>
  );
});
