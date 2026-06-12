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
import { getDisplayAmountsFromInvoiceFields } from "@features/invoicing/domain";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
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
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell colSpan={TABLE_HEADERS.length}>
                  <Skeleton className="h-6 w-full" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeaderRow />
          <TableBody>
            <TableRow>
              <TableCell colSpan={TABLE_HEADERS.length} className="h-24 text-center">
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
                {(() => {
                  const { balanceDue } = getDisplayAmountsFromInvoiceFields({
                    status: invoice.status,
                    paymentMethod: invoice.paymentMethod,
                    total: invoice.total,
                    totalPaid: invoice.total - invoice.balanceDue,
                  });
                  return balanceDue > 0 ? (
                    <span className="font-medium text-destructive">
                      {formatMxCurrency(balanceDue)}
                    </span>
                  ) : (
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
                <Badge variant="secondary" className="text-xs font-normal">
                  {copy.statusLabels[invoice.status]}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
