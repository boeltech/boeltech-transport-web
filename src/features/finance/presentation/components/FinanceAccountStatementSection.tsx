import { Receipt } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
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
import { financeCopy } from "../copy";
import { getAccountStatementDisplayPaid } from "../utils/accountStatementDisplayPaid";

interface FinanceAccountStatementSectionProps {
  rows: AccountStatementItem[];
  isLoading?: boolean;
  /** Navega a Cobros con RFC precargado (D2). */
  onCollectClient?: (clientRfc: string) => void;
}

export function FinanceAccountStatementSection({
  rows,
  isLoading = false,
  onCollectClient,
}: FinanceAccountStatementSectionProps) {
  const showCollect = typeof onCollectClient === "function";

  return (
    <Card>
      <CardHeader>
        <CardTitle>{financeCopy.summary.sections.accountStatement}</CardTitle>
        <CardDescription>
          {financeCopy.summary.accountStatement.description}
        </CardDescription>
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
                  {showCollect ? (
                    <TableHead className="text-right">
                      {financeCopy.summary.table.actions}
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.clientRfc}>
                    <TableCell className="font-medium">{row.clientName}</TableCell>
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
                      <Badge variant="secondary">{row.invoiceCount}</Badge>
                    </TableCell>
                    {showCollect ? (
                      <TableCell className="text-right">
                        {row.balanceDue > 0 ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            aria-label={financeCopy.summary.accountStatement.collectActionAria(
                              row.clientName,
                            )}
                            onClick={() => onCollectClient(row.clientRfc)}
                          >
                            {financeCopy.summary.accountStatement.collectAction}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
