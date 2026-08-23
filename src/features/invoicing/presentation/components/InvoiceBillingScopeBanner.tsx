import {
  parseInvoiceBillingScope,
  type InvoiceBillingScope,
} from "@features/invoicing/domain";
import { AlertWithIcon } from "@shared/ui/alert";
import { cn } from "@shared/lib/utils/cn";
import { invoicingCopy } from "../copy/invoicingCopy";
import { InvoiceBillingScopeBadge } from "./InvoiceBillingScopeBadge";

const bannerCopy = invoicingCopy.scopeBanner;

export function InvoiceBillingScopeBanner({
  scope,
  className,
  /** Solo el aviso «no es…» para pantallas bloqueadas (D2). */
  notThisOnly = false,
}: {
  scope: InvoiceBillingScope | null | undefined;
  className?: string;
  notThisOnly?: boolean;
}) {
  const resolved = parseInvoiceBillingScope(scope);
  const content =
    resolved === "accessory"
      ? bannerCopy.accessory
      : resolved === "false_trip"
        ? bannerCopy.falseTrip
        : resolved === "split_share"
          ? bannerCopy.splitShare
          : bannerCopy.primary;

  if (notThisOnly) {
    return (
      <AlertWithIcon variant="info" className={cn(className)} title={content.title}>
        <p className="text-muted-foreground">{content.notThis}</p>
      </AlertWithIcon>
    );
  }

  return (
    <AlertWithIcon
      variant="info"
      className={cn(className)}
      title={content.title}
    >
      <div className="mb-2">
        <InvoiceBillingScopeBadge scope={resolved} />
      </div>
      <p>{content.body}</p>
      <p className="mt-1 text-muted-foreground">{content.notThis}</p>
    </AlertWithIcon>
  );
}
