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
import type { InvoiceListItem } from "@features/invoicing/domain";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { resolveDispatchPendingNote } from "../utils/dispatchPendingNote";

const copy = dispatchRunsCopy.workbench.pending;
const SKELETON_ROWS = 8;

function invoiceFolio(invoice: InvoiceListItem): string {
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

function ClientCell({ invoice }: { invoice: InvoiceListItem }) {
  const name = invoice.receiverName?.trim();
  return (
    <div className="min-w-0">
      <p className="truncate text-sm">{name || invoice.receiverRfc}</p>
      {name ? (
        <p className="font-mono text-xs text-muted-foreground">
          {invoice.receiverRfc}
        </p>
      ) : null}
    </div>
  );
}

function NoteCell({ invoice }: { invoice: InvoiceListItem }) {
  const note = resolveDispatchPendingNote(invoice.autoDispatch);
  if (note === "failed") {
    return (
      <Badge variant="destructive" tone="soft" className="text-xs font-medium">
        {copy.badges.autoFail}
      </Badge>
    );
  }
  if (note === "auto_cutoff") {
    return (
      <Badge variant="neutral" tone="soft" className="text-xs font-medium">
        {copy.badges.autoCutoff}
      </Badge>
    );
  }
  return <span className="text-muted-foreground">—</span>;
}

interface FinanceDispatchPendingTableProps {
  invoices: InvoiceListItem[];
  selected: Record<string, boolean>;
  /** Si false, tabla read-only sin checkboxes (sin invoices.execute). */
  selectable?: boolean;
  isLoading?: boolean;
  onToggle: (invoice: InvoiceListItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}

export function FinanceDispatchPendingTable({
  invoices,
  selected,
  selectable = true,
  isLoading = false,
  onToggle,
  onTogglePage,
}: FinanceDispatchPendingTableProps) {
  const selectedOnPage = invoices.filter((invoice) => selected[invoice.id]);
  const allSelected =
    selectable &&
    invoices.length > 0 &&
    selectedOnPage.length === invoices.length;
  const someSelected =
    selectable && selectedOnPage.length > 0 && !allSelected;
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
                {selectable ? <TableHead className="w-10" /> : null}
                <TableHead>{copy.columns.invoice}</TableHead>
                <TableHead>{copy.columns.client}</TableHead>
                <TableHead>{copy.columns.issuedAt}</TableHead>
                <TableHead className="text-right">{copy.columns.total}</TableHead>
                <TableHead>{copy.columns.trips}</TableHead>
                <TableHead>{copy.columns.note}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
                <TableRow key={index}>
                  {selectable ? (
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                  ) : null}
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
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
              {selectable ? (
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectAllState}
                    onCheckedChange={(checked) =>
                      onTogglePage(checked === true)
                    }
                    aria-label={copy.selectAllAria}
                    disabled={invoices.length === 0}
                  />
                </TableHead>
              ) : null}
              <TableHead>{copy.columns.invoice}</TableHead>
              <TableHead>{copy.columns.client}</TableHead>
              <TableHead>{copy.columns.issuedAt}</TableHead>
              <TableHead className="text-right">{copy.columns.total}</TableHead>
              <TableHead>{copy.columns.trips}</TableHead>
              <TableHead>{copy.columns.note}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const folio = invoiceFolio(invoice);
              const isChecked = Boolean(selected[invoice.id]);
              return (
                <TableRow key={invoice.id}>
                  {selectable ? (
                    <TableCell>
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          onToggle(invoice, checked === true)
                        }
                        aria-label={copy.selectInvoice(folio)}
                      />
                    </TableCell>
                  ) : null}
                  <TableCell className="font-medium">
                    <Link
                      to={`/invoices/${invoice.id}`}
                      className="font-mono text-primary hover:underline"
                    >
                      {folio}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ClientCell invoice={invoice} />
                  </TableCell>
                  <TableCell>{formatDate(invoice.issuedAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMxCurrency(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <TripCodes codes={invoice.tripCodes} />
                  </TableCell>
                  <TableCell>
                    <NoteCell invoice={invoice} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="divide-y md:hidden">
        {selectable ? (
          <div className="flex items-center gap-3 py-3">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={(checked) => onTogglePage(checked === true)}
              aria-label={copy.selectAllAria}
              disabled={invoices.length === 0}
            />
            <span className="text-sm font-medium">{copy.selectAllAria}</span>
          </div>
        ) : null}
        {invoices.map((invoice) => {
          const folio = invoiceFolio(invoice);
          return (
            <div key={invoice.id} className="flex items-start gap-3 py-3">
              {selectable ? (
                <div className="pt-1">
                  <Checkbox
                    checked={Boolean(selected[invoice.id])}
                    onCheckedChange={(checked) =>
                      onToggle(invoice, checked === true)
                    }
                    aria-label={copy.selectInvoice(folio)}
                  />
                </div>
              ) : null}
              <div className="min-w-0 flex-1 space-y-1">
                <Link
                  to={`/invoices/${invoice.id}`}
                  className="font-mono font-medium text-primary hover:underline"
                >
                  {folio}
                </Link>
                <ClientCell invoice={invoice} />
                <p className="text-xs text-muted-foreground">
                  {copy.columns.issuedAt}: {formatDate(invoice.issuedAt)}
                </p>
                <TripCodes codes={invoice.tripCodes} />
                <NoteCell invoice={invoice} />
              </div>
              <div className="shrink-0 text-right">
                <p className="text-xs text-muted-foreground">
                  {copy.columns.total}
                </p>
                <p className="font-semibold tabular-nums">
                  {formatMxCurrency(invoice.total)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
