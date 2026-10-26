import { useMemo, useState } from "react";
import { Download, Loader2, Receipt, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { AccountStatementItem } from "@features/finance/domain";
import { buildFinanceCobrosPath } from "@features/finance/application";
import { financeCopy } from "../copy";
import { getAccountStatementDisplayPaid } from "../utils/accountStatementDisplayPaid";

interface FinanceAccountStatementSectionProps {
  rows: AccountStatementItem[];
  isLoading?: boolean;
  /** CTA Cobrar → /finance/cobros?rfc= (deep-link observable). */
  showCollectAction?: boolean;
  /** Descarga PDF estado de cuenta (finance.read). */
  onDownloadPdf?: (clientRfc: string) => void;
  /** RFC en descarga activa (loading por fila). */
  downloadingRfc?: string | null;
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

export function FinanceAccountStatementSection({
  rows,
  isLoading = false,
  showCollectAction = false,
  onDownloadPdf,
  downloadingRfc = null,
}: FinanceAccountStatementSectionProps) {
  const [filterQuery, setFilterQuery] = useState("");
  const showDownload = typeof onDownloadPdf === "function";
  const showActions = showCollectAction || showDownload;
  const copy = financeCopy.summary.accountStatement;

  const filteredRows = useMemo(
    () => rows.filter((row) => matchesClientFilter(row, filterQuery)),
    [rows, filterQuery],
  );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="space-y-1.5">
          <CardTitle>{financeCopy.summary.sections.accountStatement}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        {!isLoading && rows.length > 0 ? (
          <div className="relative max-w-sm">
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
        ) : null}
      </CardHeader>
      <CardContent>
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
                  <TableHead>{financeCopy.summary.table.rfc}</TableHead>
                  <TableHead className="text-right">
                    {financeCopy.summary.table.invoiced}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.summary.table.paid}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.summary.table.balance}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.summary.table.overdue}
                  </TableHead>
                  <TableHead className="text-right">
                    {financeCopy.summary.table.invoices}
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
                  const isDownloading = downloadingRfc === row.clientRfc;
                  const cobrosHref = buildFinanceCobrosPath(row.clientRfc);
                  const showCollect =
                    showCollectAction && row.openInvoiceCount > 0;

                  return (
                    <TableRow key={row.clientRfc}>
                      <TableCell className="font-medium">
                        {row.clientName}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {row.clientRfc}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMxCurrency(row.totalInvoiced)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-success">
                        {formatMxCurrency(getAccountStatementDisplayPaid(row))}
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {row.balanceDue > 0 ? (
                          <span className="text-destructive">
                            {formatMxCurrency(row.balanceDue)}
                          </span>
                        ) : (
                          <span className="text-success">
                            {formatMxCurrency(0)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {row.overdueAmount > 0 ? (
                          <span className="font-medium text-destructive">
                            {formatMxCurrency(row.overdueAmount)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary">
                          {row.openInvoiceCount}
                        </Badge>
                      </TableCell>
                      {showActions ? (
                        <TableCell className="text-right">
                          {showDownload || showCollect ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              {showDownload ? (
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  disabled={isDownloading}
                                  aria-label={copy.downloadPdfActionAria(
                                    row.clientName,
                                  )}
                                  onClick={() => onDownloadPdf(row.clientRfc)}
                                >
                                  {isDownloading ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Download className="mr-2 h-4 w-4" />
                                  )}
                                  {copy.downloadPdfAction}
                                </Button>
                              ) : null}
                              {showCollect ? (
                                <Button
                                  asChild
                                  size="sm"
                                  variant="outline"
                                >
                                  <Link
                                    to={cobrosHref}
                                    aria-label={copy.collectActionAria(
                                      row.clientName,
                                    )}
                                  >
                                    {copy.collectAction}
                                  </Link>
                                </Button>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
