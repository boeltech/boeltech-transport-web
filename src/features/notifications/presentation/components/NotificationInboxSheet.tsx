import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@shared/ui/button";
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
  const { data, isLoading, isError } = useNotificationsList(
    {
      status: "unread",
      page: 1,
      pageSize: 10,
    },
    { enabled: open },
  );

  const items = data?.items ?? [];

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
            <p className="px-4 py-6 text-sm text-destructive">
              {notificationsCopy.loadError}
            </p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {notificationsCopy.panelEmpty}
            </p>
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
