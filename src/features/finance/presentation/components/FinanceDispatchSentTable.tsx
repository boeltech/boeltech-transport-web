import { Link } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { InvoiceListItem } from "@features/invoicing/domain";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { resolveDispatchSentOrigin } from "../utils/dispatchSentOrigin";
import { DispatchRunOriginBadge } from "./DispatchRunOriginBadge";

const copy = dispatchRunsCopy.workbench.sent;
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

function SentAtCell({ invoice }: { invoice: InvoiceListItem }) {
  if (!invoice.dispatchSentAt) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className="whitespace-nowrap text-sm">
      {formatDateTime(invoice.dispatchSentAt)}
    </span>
  );
}

function RowActions({
  invoice,
  canResend,
  onResend,
  onView,
}: {
  invoice: InvoiceListItem;
  canResend: boolean;
  onResend: (invoice: InvoiceListItem) => void;
  onView: (invoice: InvoiceListItem) => void;
}) {
  const folio = invoiceFolio(invoice);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label={copy.rowActionsAria(folio)}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={() => onView(invoice)}>
          {copy.actions.view}
        </DropdownMenuItem>
        {canResend ? (
          <DropdownMenuItem
            onSelect={() => {
              // Diferir apertura del dialog: evita cierre por foco del menú.
              setTimeout(() => onResend(invoice), 0);
            }}
          >
            {copy.actions.resend}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface FinanceDispatchSentTableProps {
  invoices: InvoiceListItem[];
  selected: Record<string, boolean>;
  /** Si false, tabla read-only sin checkboxes ni Reenviar (sin invoices.execute). */
  selectable?: boolean;
  isLoading?: boolean;
  onToggle: (invoice: InvoiceListItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  onResend: (invoice: InvoiceListItem) => void;
  onView: (invoice: InvoiceListItem) => void;
}

export function FinanceDispatchSentTable({
  invoices,
  selected,
  selectable = true,
  isLoading = false,
  onToggle,
  onTogglePage,
  onResend,
  onView,
}: FinanceDispatchSentTableProps) {
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
                <TableHead>{copy.columns.sentAt}</TableHead>
                <TableHead className="text-right">{copy.columns.total}</TableHead>
                <TableHead>{copy.columns.origin}</TableHead>
                <TableHead>{copy.columns.trips}</TableHead>
                <TableHead className="w-12" />
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
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="space-y-3 md:hidden">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
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
              <TableHead>{copy.columns.sentAt}</TableHead>
              <TableHead className="text-right">{copy.columns.total}</TableHead>
              <TableHead>{copy.columns.origin}</TableHead>
              <TableHead>{copy.columns.trips}</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">{copy.columns.actions}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const folio = invoiceFolio(invoice);
              const isChecked = Boolean(selected[invoice.id]);
              const origin = resolveDispatchSentOrigin(invoice);
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
                  <TableCell>
                    <SentAtCell invoice={invoice} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatMxCurrency(invoice.total)}
                  </TableCell>
                  <TableCell>
                    <DispatchRunOriginBadge origin={origin} className="text-xs" />
                  </TableCell>
                  <TableCell>
                    <TripCodes codes={invoice.tripCodes} />
                  </TableCell>
                  <TableCell>
                    <RowActions
                      invoice={invoice}
                      canResend={selectable}
                      onResend={onResend}
                      onView={onView}
                    />
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
          const origin = resolveDispatchSentOrigin(invoice);
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
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/invoices/${invoice.id}`}
                    className="font-mono font-medium text-primary hover:underline"
                  >
                    {folio}
                  </Link>
                  <RowActions
                    invoice={invoice}
                    canResend={selectable}
                    onResend={onResend}
                    onView={onView}
                  />
                </div>
                <ClientCell invoice={invoice} />
                <p className="text-xs text-muted-foreground">
                  {copy.columns.issuedAt}: {formatDate(invoice.issuedAt)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy.columns.sentAt}:{" "}
                  {invoice.dispatchSentAt
                    ? formatDateTime(invoice.dispatchSentAt)
                    : "—"}
                </p>
                <DispatchRunOriginBadge origin={origin} className="text-xs" />
                <TripCodes codes={invoice.tripCodes} />
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
