import { Badge } from "@shared/ui/badge";
import { cn } from "@shared/lib/utils/cn";
import type { InvoiceStatus } from "@features/invoicing/domain";
import { invoiceStatusConfig } from "./invoiceStatusConfig";

interface Props {
  status: InvoiceStatus;
  className?: string;
}

export function InvoiceStatusBadge({ status, className }: Props) {
  const config = invoiceStatusConfig[status];
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
