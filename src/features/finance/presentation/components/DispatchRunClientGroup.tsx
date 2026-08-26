import { useState, type ReactNode } from "react";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { cn } from "@shared/lib/utils/cn";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { DISPATCH_FOLIO_PREVIEW_LIMIT } from "../utils/dispatchRunPreviewBuckets";

const copy = dispatchRunsCopy.detail.buckets;

export function DispatchRunClientGroup({
  title,
  invoiceCount,
  recipientSelected,
  recipientTotal,
  hasZeroRecipients,
  defaultOpen,
  headerExtra,
  children,
}: {
  title: string;
  invoiceCount: number;
  recipientSelected?: number;
  recipientTotal?: number;
  hasZeroRecipients?: boolean;
  defaultOpen: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-md border">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 min-w-0 flex-1 justify-start gap-2 px-1 font-medium"
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                open ? "rotate-0" : "-rotate-90",
              )}
            />
            <span className="truncate text-left">
              {copy.clientGroup(title, invoiceCount)}
            </span>
          </Button>
        </CollapsibleTrigger>
        <div className="flex flex-wrap items-center gap-2">
          {typeof recipientSelected === "number" &&
          typeof recipientTotal === "number" ? (
            <Badge
              variant={hasZeroRecipients ? "destructive" : "outline"}
              className="font-normal"
            >
              {hasZeroRecipients
                ? copy.zeroRecipientsBadge
                : copy.recipientsSelected(recipientSelected, recipientTotal)}
            </Badge>
          ) : null}
          {hasZeroRecipients ? (
            <AlertTriangle
              className="h-4 w-4 text-destructive"
              aria-hidden
            />
          ) : null}
          {headerExtra}
        </div>
      </div>
      <CollapsibleContent className="space-y-3 border-t px-3 py-3">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function DispatchRunFolioList<T extends { id: string }>({
  items,
  renderItem,
}: {
  items: T[];
  renderItem: (item: T) => ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  const limit = DISPATCH_FOLIO_PREVIEW_LIMIT;
  const visible = expanded ? items : items.slice(0, limit);
  const hiddenCount = Math.max(0, items.length - limit);

  return (
    <div className="space-y-1">
      <ul className="space-y-1">
        {visible.map((item) => (
          <li key={item.id}>{renderItem(item)}</li>
        ))}
      </ul>
      {hiddenCount > 0 ? (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0 text-xs"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded
            ? copy.showFewerFolios
            : copy.showMoreFolios(hiddenCount)}
        </Button>
      ) : null}
    </div>
  );
}
