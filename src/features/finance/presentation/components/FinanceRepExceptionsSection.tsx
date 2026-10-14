import { useState } from "react";
import { AlertCircle, FileWarning, Loader2 } from "lucide-react";
import {
  useRepExceptions,
  useRetryFinanceRepStamp,
} from "@features/finance/application";
import type {
  FinanceRepDeadlineStatus,
  FinanceRepExceptionItem,
  FinanceRepExceptionStatus,
} from "@features/finance/domain";
import {
  canRetryRepStamp,
  isRepManualReview,
  isRepOrphanParked,
  REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
} from "@features/finance/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
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
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import { toInvoiceNavTargets } from "../utils/cobrosInvoiceNav";
import {
  CobrosInvoiceFolioChips,
  CobrosInvoiceNavCta,
} from "./CobrosInvoiceNav";

const copy = financeCopy.cobros.exceptions;
const PAGE_SIZE = 10;

function statusBadgeVariant(
  status: FinanceRepExceptionStatus,
): "warning" | "destructive" | "neutral" {
  // pending stays warning (not destructive) — PRD D6
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
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useRepExceptions({
    page,
    limit: PAGE_SIZE,
    receiverRfc,
  });
  const items = data?.data ?? [];
  const pagination = data?.pagination;

  const retryMutation = useRetryFinanceRepStamp({
    onSuccess: () => {
      toast({ title: copy.toastRetrySuccess });
      void refetch();
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: copy.toastRetryError,
        description: getErrorMessage(err),
      });
    },
  });

  // Workbench bucket already owns the section chrome (D10) — no Card+CardHeader.
  return (
    <div className="space-y-4">
      {isError ? (
        <DetailAlertCard
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={copy.loadErrorTitle}
          items={[{ text: copy.loadError }]}
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void refetch();
              }}
            >
              {copy.retry}
            </Button>
          }
        />
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
                  <TableHead>{copy.reason}</TableHead>
                  <TableHead>{copy.deadline}</TableHead>
                  <TableHead>{copy.invoices}</TableHead>
                  <TableHead>{copy.action}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const primary = item.allocations[0];
                  const canRetry = canRetryRepStamp({
                    repStatus: item.repStatus,
                    repLastError: item.repLastError,
                    repCfdiUuid: item.repCfdiUuid,
                  });
                  const manualReview = isRepManualReview({
                    repLastError: item.repLastError,
                  });
                  const orphan = isRepOrphanParked({
                    repStatus: item.repStatus,
                    repCfdiUuid: item.repCfdiUuid,
                  });
                  const retrying =
                    retryMutation.isPending &&
                    retryMutation.variables?.paymentId === item.paymentId;
                  const reasonText =
                    item.repLastError?.trim() ||
                    (item.repStatus === "failed"
                      ? copy.statusLabels.failed
                      : "—");

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
                      <TableCell className="max-w-[14rem]">
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={reasonText}
                        >
                          {reasonText}
                        </p>
                        {manualReview &&
                        item.repLastError !==
                          REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {copy.manualReviewHint}
                          </p>
                        ) : null}
                        {orphan && !manualReview ? (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {copy.orphanHint}
                          </p>
                        ) : null}
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
                        <CobrosInvoiceFolioChips
                          invoices={toInvoiceNavTargets(item.allocations)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          {canRetry && primary ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={retryMutation.isPending}
                              onClick={() =>
                                retryMutation.mutate({
                                  invoiceId: primary.ingressInvoiceId,
                                  paymentId: item.paymentId,
                                })
                              }
                            >
                              {retrying ? (
                                <>
                                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                  {copy.retrying}
                                </>
                              ) : (
                                copy.retryStamp
                              )}
                            </Button>
                          ) : null}
                          {/* N=1 only: N>1 uses folio chips + «+N más» / no ghost dueña. */}
                          {item.allocations.length === 1 ? (
                            <CobrosInvoiceNavCta
                              invoices={toInvoiceNavTargets(item.allocations)}
                            />
                          ) : null}
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
    </div>
  );
}
