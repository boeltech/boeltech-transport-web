/**
 * Comprobantes por atender — F2 pieza 4 (C28–C29).
 *
 * `EntityListTable` density list, kinds T1–T10 standard.
 * Columnas: Cobro (fecha) · Cliente · Importe · Facturas · Comprobante (estado+motivo) · Plazo SAT · acción.
 * Una sola acción primaria por fila según helpers vigentes.
 * La fila abre el detalle del cobro (stub hasta F3).
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
  isRepPacConfigErrorMessage,
} from "@features/finance/domain";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { ListingPagination, ListingResultsSummary } from "@shared/ui/listing";
import { Skeleton } from "@shared/ui/skeleton";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { financeCopy } from "../copy";
import { toInvoiceNavTargets } from "../utils/cobrosInvoiceNav";
import { CobrosInvoiceFolioChips } from "./CobrosInvoiceNav";

const copy = financeCopy.cobros.exceptions;
const PAGE_SIZE = 10;
const BILLING_SETTINGS_PATH = "/settings/billing";

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

function statusBadgeVariant(
  status: FinanceRepExceptionStatus,
): "warning" | "destructive" | "neutral" {
  if (status === "failed") return "destructive";
  if (
    status === "pending" ||
    status === "restamp_pending" ||
    status === "cancelling"
  ) {
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

// --------------------------------------------------------------------------
// Single primary action per row (C29)
// --------------------------------------------------------------------------

type RowActionKind = "retry" | "config" | "orphan" | "none";

function classifyRowAction(item: FinanceRepExceptionItem): RowActionKind {
  if (isRepPacConfigErrorMessage(item.repLastError)) return "config";
  if (
    canRetryRepStamp({
      repStatus: item.repStatus,
      repLastError: item.repLastError,
      repCfdiUuid: item.repCfdiUuid,
    })
  ) {
    return "retry";
  }
  if (
    isRepOrphanParked({
      repStatus: item.repStatus,
      repCfdiUuid: item.repCfdiUuid,
    })
  ) {
    return "orphan";
  }
  return "none";
}

// --------------------------------------------------------------------------
// Table columns
// --------------------------------------------------------------------------

function buildColumns(opts: {
  retryMutation: ReturnType<typeof useRetryFinanceRepStamp>;
}): EntityListColumnDef<FinanceRepExceptionItem>[] {
  const { retryMutation } = opts;

  return [
    {
      id: "date",
      header: copy.date,
      kind: "date",
      accessor: (item) => item.paymentDate,
    },
    {
      id: "client",
      header: copy.client,
      kind: "stacked",
      stackedWeight: "normal",
      accessor: (item): EntityListStackedValue => ({
        primary: item.receiverName || item.receiverRfc,
        secondary: item.receiverRfc,
      }),
    },
    {
      id: "amount",
      header: copy.amount,
      kind: "money",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (item) => item.amountMxn,
    },
    {
      id: "invoices",
      header: copy.invoices,
      kind: "text",
      accessor: (item) => (
        <CobrosInvoiceFolioChips
          invoices={toInvoiceNavTargets(item.allocations)}
        />
      ),
    },
    {
      id: "status",
      header: copy.status,
      kind: "stacked",
      stackedWeight: "normal",
      accessor: (item): EntityListStackedValue => {
        const reasonText =
          item.repLastError?.trim() ||
          (item.repStatus === "failed" ? copy.statusLabels.failed : "—");
        const manualReview = isRepManualReview({
          repLastError: item.repLastError,
        });
        return {
          primary: (
            <Badge
              variant={statusBadgeVariant(item.repStatus)}
              tone="soft"
            >
              {copy.statusLabels[item.repStatus]}
            </Badge>
          ),
          secondary: (
            <span className="truncate" title={reasonText}>
              {reasonText}
              {manualReview ? (
                <span className="ml-1 text-muted-foreground">
                  · {copy.manualReviewHint}
                </span>
              ) : null}
            </span>
          ),
        };
      },
    },
    {
      id: "deadline",
      header: copy.deadline,
      kind: "text",
      accessor: (item) => (
        <Badge variant={deadlineBadgeVariant(item.deadlineStatus)} tone="soft">
          {deadlineLabel(item)}
        </Badge>
      ),
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: (item) => {
        const actionKind = classifyRowAction(item);
        const primary = item.allocations[0];
        const retrying =
          retryMutation.isPending &&
          retryMutation.variables?.paymentId === item.paymentId;

        switch (actionKind) {
          case "config":
            return (
              <Button size="sm" variant="outline" asChild>
                <Link to={BILLING_SETTINGS_PATH}>
                  {copy.goToBillingSettings}
                </Link>
              </Button>
            );
          case "retry":
            return primary ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={retryMutation.isPending}
                onClick={(e) => {
                  e.stopPropagation();
                  retryMutation.mutate({
                    invoiceId: primary.ingressInvoiceId,
                    paymentId: item.paymentId,
                  });
                }}
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
            ) : null;
          case "orphan":
            return (
              <span className="text-xs text-muted-foreground">
                {copy.orphanHint}
              </span>
            );
          default:
            return null;
        }
      },
    },
  ];
}

// --------------------------------------------------------------------------
// Section
// --------------------------------------------------------------------------

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

  const columns = useMemo(
    () => buildColumns({ retryMutation }),
    [retryMutation],
  );

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
          <EntityListTable
            framed
            density="list"
            aria-label={copy.title}
            columns={columns}
            rows={items}
            getRowId={(item) => item.paymentId}
            isLoading={isLoading}
          />
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
