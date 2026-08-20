import { useState } from "react";
import { Link } from "react-router-dom";
import { FileWarning } from "lucide-react";
import { useRepExceptions } from "@features/finance/application";
import type {
  FinanceRepDeadlineStatus,
  FinanceRepExceptionItem,
  FinanceRepExceptionStatus,
} from "@features/finance/domain";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { EmptyState } from "@shared/ui/feedback-states";
import { ListingPagination, ListingResultsSummary } from "@shared/ui/listing";
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
import { financeCopy } from "../copy";

const copy = financeCopy.cobros.exceptions;
const PAGE_SIZE = 10;

function folio(serie: string, folioNumber: number): string {
  return `${serie}-${folioNumber}`;
}

function statusBadgeVariant(
  status: FinanceRepExceptionStatus,
): "warning" | "destructive" | "neutral" {
  if (status === "failed") return "destructive";
  if (status === "pending" || status === "restamp_pending" || status === "cancelling") {
    return "warning";
  }
  return "neutral";
}

function deadlineBadgeVariant(
  status: FinanceRepDeadlineStatus,
): "success" | "warning" | "destructive" {
  if (status === "overdue") return "destructive";
  if (status === "approaching") return "warning";
  return "success";
}

function deadlineLabel(item: FinanceRepExceptionItem): string {
  if (item.deadlineStatus === "overdue") {
    return `${copy.deadlineOverdue} · ${copy.daysOverdue(Math.abs(item.daysUntilDeadline))}`;
  }
  if (item.deadlineStatus === "approaching") {
    return `${copy.deadlineApproaching} · ${copy.daysUntil(item.daysUntilDeadline)}`;
  }
  return copy.deadlineOk;
}

interface FinanceRepExceptionsSectionProps {
  receiverRfc: string | null;
}

export function FinanceRepExceptionsSection({
  receiverRfc,
}: FinanceRepExceptionsSectionProps) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useRepExceptions({
    page,
    limit: PAGE_SIZE,
    receiverRfc,
  });
  const items = data?.data ?? [];
  const pagination = data?.pagination;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileWarning className="h-4 w-4" aria-hidden />
          {copy.title}
        </CardTitle>
        <CardDescription>{copy.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isError ? (
          <AlertWithIcon variant="destructive" title={copy.loadErrorTitle}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>{copy.loadError}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
                {copy.retry}
              </Button>
            </div>
          </AlertWithIcon>
        ) : null}

        {isLoading && items.length === 0 ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <EmptyState
            icon={<FileWarning className="h-8 w-8 text-muted-foreground" />}
            title={copy.emptyTitle}
            description={copy.empty}
            size="sm"
          />
        ) : null}

        {items.length > 0 ? (
          <>
            {pagination && pagination.total > 0 ? (
              <ListingResultsSummary
                entityLabelPlural={copy.entityLabelPlural}
                total={pagination.total}
                page={pagination.page}
                limit={pagination.limit}
              />
            ) : null}
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.client}</TableHead>
                    <TableHead className="text-right">{copy.amount}</TableHead>
                    <TableHead>{copy.date}</TableHead>
                    <TableHead>{copy.status}</TableHead>
                    <TableHead>{copy.deadline}</TableHead>
                    <TableHead>{copy.invoices}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    return (
                      <TableRow key={item.paymentId}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="font-medium">{item.receiverName || item.receiverRfc}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {item.receiverRfc}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMxCurrency(item.amountMxn)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(item.paymentDate)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusBadgeVariant(item.repStatus)}
                            tone="soft"
                          >
                            {copy.statusLabels[item.repStatus]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={deadlineBadgeVariant(item.deadlineStatus)}
                            tone="soft"
                          >
                            {deadlineLabel(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-x-2 gap-y-1">
                            {item.allocations.map((allocation) => {
                              const label = folio(allocation.serie, allocation.folio);
                              const invoiceHref = `/invoices/${allocation.ingressInvoiceId}`;
                              return (
                                <Link
                                  key={allocation.ingressInvoiceId}
                                  to={invoiceHref}
                                  className="font-medium text-primary underline-offset-4 hover:underline"
                                  aria-label={copy.openInvoice(label)}
                                >
                                  {label}
                                </Link>
                              );
                            })}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {pagination && pagination.totalPages > 1 ? (
              <ListingPagination
                page={page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
