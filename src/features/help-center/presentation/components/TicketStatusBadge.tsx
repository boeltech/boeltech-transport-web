import { Badge } from "@shared/ui/badge";
import { helpCenterCopy } from "../copy/helpCenterCopy";

const STATUS_CONFIG: Record<
  string,
  { label: string; variant: "neutral" | "info" | "success" | "secondary" }
> = {
  open: { label: helpCenterCopy.status.open, variant: "neutral" },
  in_progress: {
    label: helpCenterCopy.status.in_progress,
    variant: "info",
  },
  resolved: { label: helpCenterCopy.status.resolved, variant: "success" },
};

interface TicketStatusBadgeProps {
  status: string;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    variant: "secondary" as const,
  };

  return (
    <Badge variant={cfg.variant} tone="soft">
      {cfg.label}
    </Badge>
  );
}
