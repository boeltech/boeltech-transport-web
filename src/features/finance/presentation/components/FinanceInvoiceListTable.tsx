/**
 * FinanceInvoiceListTable — listado de facturas del hub Finanzas.
 */

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { Badge } from "@shared/ui/badge";
import { Skeleton } from "@shared/ui/skeleton";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  FinanceInvoiceListItem,
  FinanceInvoiceStatus,
} from "@features/finance/domain";
import { getDisplayAmountsFromInvoiceFields } from "@features/invoicing/domain";
import { InvoiceBillingScopeBadge } from "@features/invoicing/presentation/components/InvoiceBillingScopeBadge";
import { InvoiceEmailDispatchBadge } from "@features/invoicing/presentation/components/InvoiceEmailDispatchBadge";
import { FINANCE_INVOICES_PAGE_SIZE } from "../config/financeInvoiceListConfig";
import { FinanceInvoiceStatusBadge } from "../config/financeInvoiceStatusConfig";
import { invoicingCopy } from "@features/invoicing/presentation/copy/invoicingCopy";
import { financeCopy } from "../copy";
import { formatFinancePaymentMethodLabel } from "../utils/formatFinancePaymentMethod";

const copy = financeCopy.invoices;
const splitShareCopy = invoicingCopy.splitShare;

/** Saldo mostrado vía dominio compartido (PUE stamped sin cobro ≠ liquidada). */
function getListDisplayAmounts(invoice: FinanceInvoiceListItem) {
  return getDisplayAmountsFromInvoiceFields({
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    total: invoice.total,
    totalPaid: invoice.totalPaid,
  });
}

interface FinanceInvoiceListTableProps {
  invoices: FinanceInvoiceListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  /** Portal client: oculta columna Cliente/RFC y usa labels de estado entendibles. */
  isClientPortal?: boolean;
}

function getHeaders(isClientPortal: boolean) {
  const headers: { key: string; label: string; className?: string }[] = [
    { key: "folio", label: copy.table.folio },
  ];
  if (!isClientPortal) {
    headers.push({ key: "client", label: copy.table.client });
  }
  headers.push(
    { key: "date", label: copy.table.date },
    { key: "method", label: copy.table.method },
    { key: "total", label: copy.table.total, className: "text-right" },
    { key: "balance", label: copy.table.balance, className: "text-right" },
    {
      key: "trips",
      label: isClientPortal ? copy.table.tripsClient : copy.table.trips,
    },
    { key: "dispatch", label: copy.table.dispatch },
    { key: "status", label: copy.table.status },
  );
  return headers;
}

function statusLabel(
  status: FinanceInvoiceStatus,
  isClientPortal: boolean,
): string {
  if (isClientPortal) return copy.statusLabelsClient[status];
  return copy.statusLabels[status];
}

export function FinanceInvoiceListTable({
  invoices,
  isLoading,
  onView,
  isClientPortal = false,
}: FinanceInvoiceListTableProps) {
  const headers = getHeaders(isClientPortal);

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header.key} className={header.className}>
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: FINANCE_INVOICES_PAGE_SIZE }).map(
              (_, index) => (
                <TableRow key={index}>
                  {headers.map((header) => (
                    <TableCell key={header.key}>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                  ))}
                </TableRow>
              ),
            )}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead key={header.key} className={header.className}>
                  {header.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell
                colSpan={headers.length}
                className="h-24 text-center"
              >
                {copy.table.empty}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map((header) => (
              <TableHead key={header.key} className={header.className}>
                {header.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(invoice.id)}
            >
              <TableCell className="font-medium font-mono">
                <div className="space-y-1">
                  <div>{`${invoice.serie}-${invoice.folio}`}</div>
                  {invoice.billingScope ? (
                    <div className="flex flex-wrap items-center gap-1.5 font-sans">
                      <InvoiceBillingScopeBadge scope={invoice.billingScope} />
                      {invoice.billingScope === "split_share" &&
                      invoice.sharePercent != null ? (
                        <span className="text-xs font-normal text-muted-foreground">
                          {splitShareCopy.sharePercentShort(invoice.sharePercent)}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </TableCell>
              {!isClientPortal ? (
                <TableCell>
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">
                      {invoice.receiverName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.receiverRfc}
                    </p>
                  </div>
                </TableCell>
              ) : null}
              <TableCell className="text-sm">
                {formatDate(invoice.issuedAt)}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {formatFinancePaymentMethodLabel(invoice.paymentMethod)}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMxCurrency(invoice.total)}
              </TableCell>
              <TableCell className="text-right">
                {(() => {
                  const { balanceDue } = getListDisplayAmounts(invoice);
                  if (balanceDue > 0) {
                    return (
                      <span className="font-medium text-destructive">
                        {formatMxCurrency(balanceDue)}
                      </span>
                    );
                  }
                  return (
                    <span className="text-sm text-success">{copy.table.paid}</span>
                  );
                })()}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {invoice.tripCodes.slice(0, 2).map((code) => (
                    <Badge key={code} variant="secondary" className="text-xs">
                      {code}
                    </Badge>
                  ))}
                  {invoice.tripCodes.length > 2 ? (
                    <Badge variant="secondary" className="text-xs">
                      +{invoice.tripCodes.length - 2}
                    </Badge>
                  ) : null}
                </div>
              </TableCell>
              <TableCell>
                <InvoiceEmailDispatchBadge
                  status={invoice.status}
                  dispatchSentAt={invoice.dispatchSentAt}
                  autoDispatchLastItemStatus={
                    invoice.autoDispatch?.lastItemStatus
                  }
                />
              </TableCell>
              <TableCell>
                {isClientPortal ? (
                  <Badge variant="secondary" className="text-xs font-normal">
                    {statusLabel(invoice.status, true)}
                  </Badge>
                ) : (
                  <FinanceInvoiceStatusBadge status={invoice.status} />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
