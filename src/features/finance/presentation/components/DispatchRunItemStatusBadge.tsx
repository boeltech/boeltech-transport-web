import { Badge } from "@shared/ui/badge";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";

export function DispatchRunItemStatusBadge({ status }: { status: string }) {
  if (status === "listed" || status === "queued" || status === "skipped") {
    return null;
  }
  const variant =
    status === "sent"
      ? "success"
      : status === "failed"
        ? "destructive"
        : "outline";
  const label =
    dispatchRunsCopy.itemStatus[
      status as keyof typeof dispatchRunsCopy.itemStatus
    ] ?? status;
  return (
    <Badge variant={variant} className="shrink-0">
      {label}
    </Badge>
  );
}
