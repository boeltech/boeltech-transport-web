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
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { FINANCE_INVOICES_PAGE_SIZE } from "../config/financeInvoiceListConfig";
import { FinanceInvoiceStatusBadge } from "../config/financeInvoiceStatusConfig";
import { financeCopy } from "../copy";

const copy = financeCopy.invoices;

interface FinanceInvoiceListTableProps {
  invoices: FinanceInvoiceListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
}

const TABLE_HEADERS = [
  { key: "folio", label: copy.table.folio },
  { key: "client", label: copy.table.client },
  { key: "date", label: copy.table.date },
  { key: "method", label: copy.table.method },
  { key: "total", label: copy.table.total, className: "text-right" },
  { key: "balance", label: copy.table.balance, className: "text-right" },
  { key: "trips", label: copy.table.trips },
  { key: "status", label: copy.table.status },
];

function TableHeaderRow() {
  return (
    <TableHeader>
      <TableRow>
        {TABLE_HEADERS.map((header) => (
          <TableHead key={header.key} className={header.className}>
            {header.label}
          </TableHead>
        ))}
      </TableRow>
    </TableHeader>
  );
}

function LoadingSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: FINANCE_INVOICES_PAGE_SIZE }).map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-4 w-16" />
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-28" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-12" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-4 w-20" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function EmptyState() {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center">
          {copy.table.empty}
        </TableCell>
      </TableRow>
    </TableBody>
  );
}

export function FinanceInvoiceListTable({
  invoices,
  isLoading,
  onView,
}: FinanceInvoiceListTableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <LoadingSkeleton />
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <EmptyState />
        </Table>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeaderRow />
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow
              key={invoice.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onView(invoice.id)}
            >
              <TableCell className="font-medium font-mono">
                {invoice.serie}-{invoice.folio}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{invoice.receiverName}</p>
                  <p className="text-xs text-muted-foreground">{invoice.receiverRfc}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm">
                {formatDate(invoice.issuedAt.split("T")[0])}
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="text-xs">
                  {invoice.paymentMethod}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatMxCurrency(invoice.total)}
              </TableCell>
              <TableCell className="text-right">
                {invoice.balanceDue > 0 ? (
                  <span className="font-medium text-destructive">
                    {formatMxCurrency(invoice.balanceDue)}
                  </span>
                ) : (
                  <span className="text-sm text-success">{copy.table.paid}</span>
                )}
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
                <FinanceInvoiceStatusBadge status={invoice.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
