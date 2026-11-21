import { useMemo, useState } from "react";
import { MoreHorizontal, Receipt, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { Input } from "@shared/ui/input";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { EmptyState } from "@shared/ui/feedback-states";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AccountStatementItem } from "@features/finance/domain";
import {
  buildRegisterCollectionPath,
  FINANCE_HUB_PATH,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import {
  accountStatementHasInvoiceChannel,
  accountStatementHasOperationalChannel,
  getAccountStatementInvoicedBalance,
  getAccountStatementOperationalBalance,
} from "../utils/accountStatementChannels";
import { AccountStatementSheet } from "./AccountStatementSheet";

type StatementFilter = "all" | "overdue" | "withInvoice" | "withoutInvoice";

interface FinanceAccountStatementSectionProps {
  rows: AccountStatementItem[];
  isLoading?: boolean;
  /** Menú ⋯ → Registrar cobro / Ver cliente. */
  showCollectAction?: boolean;
  /** Abre hoja Estado de cuenta (finance.read). */
  canDownloadStatement?: boolean;
}

function matchesClientFilter(
  row: AccountStatementItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.clientName.toLowerCase().includes(q) ||
    row.clientRfc.toLowerCase().includes(q)
  );
}

function matchesChannelFilter(
  row: AccountStatementItem,
  filter: StatementFilter,
): boolean {
  if (filter === "all") return true;
  if (filter === "overdue") return row.overdueAmount > 0.009;
  if (filter === "withInvoice") return accountStatementHasInvoiceChannel(row);
  return accountStatementHasOperationalChannel(row);
}

function registerHref(row: AccountStatementItem): string {
  const hasInvoice = accountStatementHasInvoiceChannel(row);
  const hasOperational = accountStatementHasOperationalChannel(row);
  const channel =
    hasInvoice && !hasOperational
      ? "with_invoice"
      : !hasInvoice && hasOperational
        ? "without_invoice"
        : "with_invoice";
  return buildRegisterCollectionPath({
    channel,
    clientId: row.clientId,
    receiverRfc: row.clientRfc || null,
    from: FINANCE_HUB_PATH,
  });
}

export function FinanceAccountStatementSection({
  rows,
  isLoading = false,
  showCollectAction = false,
  canDownloadStatement = false,
}: FinanceAccountStatementSectionProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState<StatementFilter>("all");
  const [selectedRow, setSelectedRow] = useState<AccountStatementItem | null>(
    null,
  );
  const copy = financeCopy.summary.accountStatement;
  const showActions = showCollectAction || canDownloadStatement;

  const filterCounts = useMemo(() => {
    const searched = rows.filter((row) => matchesClientFilter(row, filterQuery));
    return {
      all: searched.length,
      overdue: searched.filter((r) => r.overdueAmount > 0.009).length,
      withInvoice: searched.filter((r) =>
        accountStatementHasInvoiceChannel(r),
      ).length,
      withoutInvoice: searched.filter((r) =>
        accountStatementHasOperationalChannel(r),
      ).length,
    };
  }, [rows, filterQuery]);

  const filteredRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          matchesClientFilter(row, filterQuery) &&
          matchesChannelFilter(row, channelFilter),
      ),
    [rows, filterQuery, channelFilter],
  );

  const filterChips: Array<{ id: StatementFilter; label: string; count: number }> =
    [
      { id: "all", label: copy.filters.all, count: filterCounts.all },
      {
        id: "overdue",
        label: copy.filters.overdue,
        count: filterCounts.overdue,
      },
      {
        id: "withInvoice",
        label: copy.filters.withInvoice,
        count: filterCounts.withInvoice,
      },
      {
        id: "withoutInvoice",
        label: copy.filters.withoutInvoice,
        count: filterCounts.withoutInvoice,
      },
    ];

  return (
    <>
      <Card>
        <CardHeader className="space-y-3">
          <div className="space-y-1.5">
            <CardTitle>
              {financeCopy.summary.sections.accountStatement}
            </CardTitle>
            <CardDescription>{copy.description}</CardDescription>
          </div>
          {!isLoading && rows.length > 0 ? (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative max-w-sm flex-1">
                <Search
                  className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={filterQuery}
                  onChange={(event) => setFilterQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  aria-label={copy.searchAriaLabel}
                  className="pl-8"
                />
              </div>
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Filtros de canal"
              >
                {filterChips.map((chip) => (
                  <Button
                    key={chip.id}
                    type="button"
                    size="sm"
                    variant={channelFilter === chip.id ? "default" : "outline"}
                    onClick={() => setChannelFilter(chip.id)}
                  >
                    {chip.label}
                    <span className="ml-1.5 tabular-nums text-xs opacity-80">
                      {chip.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-10 w-10 text-muted-foreground" />}
              title={financeCopy.summary.empty.title}
              description={financeCopy.summary.empty.description}
            />
          ) : filteredRows.length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10 text-muted-foreground" />}
              title={copy.filterEmpty.title}
              description={copy.filterEmpty.description}
            />
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{financeCopy.summary.table.client}</TableHead>
                    <TableHead className="text-right">
                      {financeCopy.summary.table.withInvoice}
                    </TableHead>
                    <TableHead className="text-right">
                      {financeCopy.summary.table.withoutInvoice}
                    </TableHead>
                    <TableHead className="text-right">
                      {financeCopy.summary.table.balance}
                    </TableHead>
                    <TableHead className="text-right">
                      {financeCopy.summary.table.overdue}
                    </TableHead>
                    <TableHead>
                      {financeCopy.summary.table.lastCollection}
                    </TableHead>
                    {showActions ? (
                      <TableHead className="text-right">
                        {financeCopy.summary.table.actions}
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row) => {
                    const invoiced = getAccountStatementInvoicedBalance(row);
                    const operational =
                      getAccountStatementOperationalBalance(row);
                    const rowKey =
                      row.clientRfc ||
                      row.clientId ||
                      `${row.clientName}-${row.balanceDue}`;
                    const canOpenStatement =
                      canDownloadStatement &&
                      Boolean(row.clientRfc.trim()) &&
                      row.balanceDue > 0.009;
                    const showCollect =
                      showCollectAction &&
                      (accountStatementHasInvoiceChannel(row) ||
                        accountStatementHasOperationalChannel(row));
                    const showViewClient = Boolean(row.clientId);

                    return (
                      <TableRow key={rowKey}>
                        <TableCell>
                          <div className="min-w-0 space-y-0.5">
                            {row.clientId ? (
                              <Link
                                to={`/clients/${row.clientId}`}
                                state={{
                                  from: FINANCE_HUB_PATH,
                                  fromLabel: "Cartera",
                                }}
                                className="font-medium text-foreground hover:underline"
                              >
                                {row.clientName}
                              </Link>
                            ) : (
                              <span className="font-medium">
                                {row.clientName}
                              </span>
                            )}
                            <p className="font-mono text-xs text-muted-foreground">
                              {row.clientRfc || copy.noRfcHint}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {invoiced > 0.009 ? (
                            <div>
                              <p>{formatMxCurrency(invoiced)}</p>
                              <p className="text-xs text-muted-foreground">
                                {copy.invoiceCountUnder(row.openInvoiceCount)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {operational > 0.009 ? (
                            <div>
                              <p>{formatMxCurrency(operational)}</p>
                              <p className="text-xs text-muted-foreground">
                                {copy.tripCountUnder(row.operationalTripCount)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatMxCurrency(row.balanceDue)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.overdueAmount > 0.009 ? (
                            <span className="font-medium text-warning">
                              {formatMxCurrency(row.overdueAmount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.lastCollectionAt ? (
                            <div className="space-y-0.5">
                              <p>{formatDate(row.lastCollectionAt)}</p>
                              {row.lastCollectionChannel ? (
                                <p className="text-xs text-muted-foreground">
                                  {
                                    copy.lastCollectionChannel[
                                      row.lastCollectionChannel
                                    ]
                                  }
                                </p>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        {showActions ? (
                          <TableCell className="text-right">
                            <div className="flex flex-nowrap items-center justify-end gap-1">
                              {canOpenStatement ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  aria-label={copy.downloadActionAria(
                                    row.clientName,
                                  )}
                                  onClick={() => setSelectedRow(row)}
                                >
                                  {copy.downloadAction}
                                </Button>
                              ) : null}
                              {showCollect || showViewClient ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      className="h-8 w-8"
                                      aria-label={copy.moreActionsAria(
                                        row.clientName,
                                      )}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {showCollect ? (
                                      <DropdownMenuItem asChild>
                                        <Link
                                          to={registerHref(row)}
                                          aria-label={copy.collectActionAria(
                                            row.clientName,
                                          )}
                                        >
                                          {copy.collectAction}
                                        </Link>
                                      </DropdownMenuItem>
                                    ) : null}
                                    {showViewClient && row.clientId ? (
                                      <DropdownMenuItem asChild>
                                        <Link
                                          to={`/clients/${row.clientId}`}
                                          state={{
                                            from: FINANCE_HUB_PATH,
                                            fromLabel: "Cartera",
                                          }}
                                          aria-label={copy.viewClientActionAria(
                                            row.clientName,
                                          )}
                                        >
                                          {copy.viewClientAction}
                                        </Link>
                                      </DropdownMenuItem>
                                    ) : null}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : null}
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!isLoading && filteredRows.length > 0 ? (
            <div
              className={cn(
                "flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground",
              )}
            >
              <span>{copy.footerNote(filteredRows.length)}</span>
              <span>{copy.footerActionsHint}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>
      {selectedRow ? (
        <AccountStatementSheet
          key={selectedRow.clientRfc || selectedRow.clientId || "row"}
          open
          row={selectedRow}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setSelectedRow(null);
          }}
        />
      ) : null}
    </>
  );
}
