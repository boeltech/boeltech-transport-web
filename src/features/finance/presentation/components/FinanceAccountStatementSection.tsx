import { Receipt } from "lucide-react";
import { Badge } from "@shared/ui/badge";
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

interface FinanceAccountStatementSectionProps {
  rows: AccountStatementItem[];
  isLoading?: boolean;
}

export function FinanceAccountStatementSection({
  rows,
  isLoading = false,
}: FinanceAccountStatementSectionProps) {
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
                      {formatMxCurrency(row.totalPaid)}
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
