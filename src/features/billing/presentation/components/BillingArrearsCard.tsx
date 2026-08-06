import { Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import type { BillingArrears } from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/billingFormatters";

interface BillingArrearsCardProps {
  data: BillingArrears;
  isLoading?: boolean;
}

export function BillingArrearsCard({
  data,
  isLoading = false,
}: BillingArrearsCardProps) {
  const copy = billingCopy.arrears;

  return (
    <Card
      className={cn(
        "border-warning/40 bg-warning-soft text-warning-soft-foreground",
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wallet className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription className="text-warning-soft-foreground/80">
          {copy.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-warning-soft-foreground/80">
            {copy.loading}
          </p>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-sm text-warning-soft-foreground/80">
                {copy.totalLabel}
              </p>
              <p className="text-3xl font-semibold tabular-nums">
                {formatBillingPriceCents(data.totalOpenCents)}
              </p>
              <p className="text-xs text-warning-soft-foreground/80">
                {copy.openCount(data.openCount)}
              </p>
            </div>

            <ul className="divide-y divide-warning/25 rounded-lg border border-warning/30 bg-background/40">
              {data.invoices.map((invoice) => {
                const periodLabel = formatBillingPeriodKey(invoice.periodKey);
                const amountLabel = formatBillingPriceCents(
                  invoice.amountDueCents,
                );
                const dateLabel = invoice.dueDate
                  ? formatDate(invoice.dueDate)
                  : null;
                const isOverdue = invoice.daysOverdue > 0;
                const duePart = dateLabel
                  ? isOverdue
                    ? copy.overdueOn(dateLabel)
                    : copy.dueOn(dateLabel)
                  : null;
                const statusPart = isOverdue
                  ? copy.daysOverdue(invoice.daysOverdue)
                  : copy.pendingPayment;
                const statusLine = [duePart, statusPart]
                  .filter(Boolean)
                  .join(" · ");

                return (
                  <li
                    key={invoice.id}
                    className="flex flex-col gap-0.5 px-3 py-2.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{periodLabel}</p>
                      {statusLine ? (
                        <p className="text-sm text-warning-soft-foreground/80">
                          {statusLine}
                        </p>
                      ) : null}
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums">
                      {amountLabel}
                    </p>
                  </li>
                );
              })}
            </ul>

            <p className="text-xs text-warning-soft-foreground/80">
              {copy.footer}
            </p>
            <p className="text-sm">
              <a
                className="font-medium underline underline-offset-4"
                href={`mailto:${billingCopy.contact.email}`}
              >
                {copy.contactCta}
              </a>
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
