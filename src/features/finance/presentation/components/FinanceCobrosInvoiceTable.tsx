import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
import { financeCopy } from "../copy";

const copy = financeCopy.cobros;
const SKELETON_ROWS = 8;

function invoiceFolio(invoice: FinanceInvoiceListItem): string {
  return `${invoice.serie}-${invoice.folio}`;
}

function TripCodes({ codes }: { codes: string[] }) {
  if (codes.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {codes.slice(0, 2).map((code) => (
        <Badge key={code} variant="secondary" className="text-xs">
          {code}
        </Badge>
      ))}
      {codes.length > 2 ? (
        <Badge variant="secondary" className="text-xs">
          +{codes.length - 2}
        </Badge>
      ) : null}
    </div>
  );
}

interface FinanceCobrosInvoiceTableProps {
  invoices: FinanceInvoiceListItem[];
  selected: Record<string, boolean>;
  isLoading?: boolean;
  onToggle: (invoice: FinanceInvoiceListItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}

export function FinanceCobrosInvoiceTable({
  invoices,
  selected,
  isLoading = false,
  onToggle,
  onTogglePage,
}: FinanceCobrosInvoiceTableProps) {
  const selectedOnPage = invoices.filter((invoice) => selected[invoice.id]);
  const allSelected =
    invoices.length > 0 && selectedOnPage.length === invoices.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;
  const selectAllState = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;

  if (isLoading) {
    return (
      <>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>{copy.columns.invoice}</TableHead>
                <TableHead>{copy.columns.issuedAt}</TableHead>
                <TableHead>{copy.columns.trips}</TableHead>
                <TableHead className="text-right">{copy.columns.total}</TableHead>
                <TableHead className="text-right">{copy.columns.balance}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-4 w-4" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={selectAllState}
                  onCheckedChange={(checked) => onTogglePage(checked === true)}
                  aria-label={copy.selectAllAria}
                />
              </TableHead>
              <TableHead>{copy.columns.invoice}</TableHead>
              <TableHead>{copy.columns.issuedAt}</TableHead>
              <TableHead>{copy.columns.trips}</TableHead>
              <TableHead className="text-right">{copy.columns.total}</TableHead>
              <TableHead className="text-right">{copy.columns.balance}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const folio = invoiceFolio(invoice);
              const isChecked = Boolean(selected[invoice.id]);
              return (
                <TableRow key={invoice.id}>
                  <TableCell>
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={(checked) =>
                        onToggle(invoice, checked === true)
                      }
                      aria-label={copy.selectInvoice(folio)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="text-primary hover:underline"
                    >
                      {folio}
                    </Link>
                  </TableCell>
                  <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                  <TableCell>
                    <TripCodes codes={invoice.tripCodes} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMxCurrency(invoice.total)}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatMxCurrency(invoice.balanceDue)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        <div className="flex items-center gap-3 py-3">
          <Checkbox
            checked={selectAllState}
            onCheckedChange={(checked) => onTogglePage(checked === true)}
            aria-label={copy.selectAllAria}
          />
          <span className="text-sm font-medium">{copy.selectAllAria}</span>
        </div>
        {invoices.map((invoice) => {
          const folio = invoiceFolio(invoice);
          return (
            <div key={invoice.id} className="flex items-start gap-3 py-3">
              <div className="pt-1">
                <Checkbox
                  checked={Boolean(selected[invoice.id])}
                  onCheckedChange={(checked) =>
                    onToggle(invoice, checked === true)
                  }
                  aria-label={copy.selectInvoice(folio)}
                />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  to={`/invoices/${invoice.id}`}
                  className="font-medium text-primary hover:underline"
                >
                  {folio}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {copy.columns.issuedAt}: {formatDate(invoice.issuedAt)}
                </p>
                <TripCodes codes={invoice.tripCodes} />
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">{copy.columns.balance}</p>
                <p className="font-semibold tabular-nums">
                  {formatMxCurrency(invoice.balanceDue)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
