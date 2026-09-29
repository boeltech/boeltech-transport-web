import { History } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import type {
  BillingSaasInvoice,
  BillingSaasPaymentMethod,
} from "../../domain/entities";
import { billingCopy } from "../copy/billingCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/billingFormatters";

interface BillingSaasInvoiceHistoryCardProps {
  invoices: BillingSaasInvoice[];
  isLoading?: boolean;
  isError?: boolean;
}

function paymentMethodLabel(
  method: BillingSaasPaymentMethod | null | undefined,
): string {
  const copy = billingCopy.saasInvoiceHistory;
  if (!method) return copy.methodUnknown;
  return copy.methods[method] ?? copy.methodUnknown;
}

function collectedAtLabel(invoice: BillingSaasInvoice): string {
  return formatDate(invoice.lastPayment?.paidAt ?? invoice.paidAt);
}

export function BillingSaasInvoiceHistoryCard({
  invoices,
  isLoading = false,
  isError = false,
}: BillingSaasInvoiceHistoryCardProps) {
  const copy = billingCopy.saasInvoiceHistory;
  const rows = invoices.filter(
    (invoice) => invoice.status === "paid" || invoice.status === "void",
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="h-4 w-4" />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{copy.loading}</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">{copy.unavailable}</p>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<History className="h-10 w-10" />}
            title={copy.emptyTitle}
            description={copy.empty}
            size="sm"
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.columns.period}</TableHead>
                  <TableHead>{copy.columns.status}</TableHead>
                  <TableHead>{copy.columns.amount}</TableHead>
                  <TableHead>{copy.columns.collected}</TableHead>
                  <TableHead>{copy.columns.method}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      {formatBillingPeriodKey(invoice.periodKey)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        tone="soft"
                        variant={
                          invoice.status === "paid" ? "success" : "neutral"
                        }
                      >
                        {copy.status[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {formatBillingPriceCents(invoice.totalCents)}
                    </TableCell>
                    <TableCell>{collectedAtLabel(invoice)}</TableCell>
                    <TableCell>
                      {paymentMethodLabel(invoice.lastPayment?.method)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">{copy.footer}</p>
      </CardContent>
    </Card>
  );
}
