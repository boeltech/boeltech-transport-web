import { Badge } from "@shared/ui/badge";
import type { InvoiceBillingScope } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

export function InvoiceBillingScopeBadge({
  scope,
  className,
}: {
  scope: InvoiceBillingScope | null | undefined;
  className?: string;
}) {
  const resolved = scope === "accessory" ? "accessory" : "primary_transport";
  const label =
    resolved === "accessory"
      ? invoicingCopy.billingScope.accessory
      : invoicingCopy.billingScope.primary;

  return (
    <Badge variant={resolved === "accessory" ? "outline" : "secondary"} className={className}>
      {label}
    </Badge>
  );
}

export function resolveInvoiceBillingScope(
  trips: ReadonlyArray<{ billingScope?: InvoiceBillingScope }>,
): InvoiceBillingScope {
  return trips[0]?.billingScope === "accessory" ? "accessory" : "primary_transport";
}
