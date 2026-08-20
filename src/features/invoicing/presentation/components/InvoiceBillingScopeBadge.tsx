/* eslint-disable react-refresh/only-export-components */
import { Badge } from "@shared/ui/badge";
import {
  parseInvoiceBillingScope,
  type InvoiceBillingScope,
} from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";

export function InvoiceBillingScopeBadge({
  scope,
  className,
}: {
  scope: InvoiceBillingScope | null | undefined;
  className?: string;
}) {
  const resolved = parseInvoiceBillingScope(scope);
  const label =
    resolved === "accessory"
      ? invoicingCopy.billingScope.accessory
      : resolved === "false_trip"
        ? invoicingCopy.billingScope.falseTrip
        : invoicingCopy.billingScope.primary;

  const variant =
    resolved === "false_trip"
      ? "warning"
      : resolved === "primary_transport"
        ? "secondary"
        : "outline";

  return (
    <Badge
      variant={variant}
      tone={resolved === "false_trip" ? "soft" : undefined}
      className={className}
    >
      {label}
    </Badge>
  );
}

export function resolveInvoiceBillingScope(
  trips: ReadonlyArray<{ billingScope?: InvoiceBillingScope }>,
): InvoiceBillingScope {
  return parseInvoiceBillingScope(trips[0]?.billingScope);
}
