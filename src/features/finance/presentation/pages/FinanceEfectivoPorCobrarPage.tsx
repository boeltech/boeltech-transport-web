/**
 * Bandeja «Efectivo por cobrar» — F2 ADR-0096 addendum lectura.
 * Agrupa por cliente; CTA → Costos del viaje. No registra abonos aquí.
 */

import { useCallback, useMemo } from "react";
import { AlertCircle, HandCoins, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { useQueryErrorToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  FINANCE_EFECTIVO_CLIENT_ID_PARAM,
  OPERATIONAL_CASH_PENDING_PAGE_SIZE,
  useFinanceListingFilters,
  useOperationalCashPending,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import { OperationalCashPendingTable } from "../components/OperationalCashPendingTable";
import { groupOperationalCashPendingByClient } from "../utils/groupOperationalCashPending";

const copy = financeCopy.efectivoPorCobrar;

export function FinanceEfectivoPorCobrarPage() {
  const filters = useFinanceListingFilters<"clientId">({
    filters: {
      clientId: { paramName: FINANCE_EFECTIVO_CLIENT_ID_PARAM },
    },
    chipLabels: {
      clientId: (value) => copy.clientChip(value),
    },
  });

  const clientId = filters.filters.clientId || null;

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOperationalCashPending({
      page: filters.page,
      limit: OPERATIONAL_CASH_PENDING_PAGE_SIZE,
      clientId,
    });

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadErrorTitle,
  });

  const trips = data?.data;
  const byClient = data?.meta.byClient;
  const totals = data?.meta.totals;
  const groups = useMemo(
    () =>
      groupOperationalCashPendingByClient(trips ?? [], byClient ?? []),
    [trips, byClient],
  );

  const clientChipLabel = useMemo(() => {
    if (!clientId) return null;
    const match = byClient?.find((c) => c.clientId === clientId);
    const name =
      match?.clientName?.trim() ||
      trips?.find((t) => t.clientId === clientId)?.clientName?.trim() ||
      clientId;
    return copy.clientChip(name);
  }, [byClient, clientId, trips]);

  const activeChips = useMemo(() => {
    if (!clientId || !clientChipLabel) return [];
    return [
      {
        id: "clientId",
        label: clientChipLabel,
        onRemove: () => filters.setFilter("clientId", ""),
      },
    ];
  }, [clientChipLabel, clientId, filters]);

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const showLoadError = isError && !data;
  const hasClientFilter = Boolean(clientId);

  const pagination =
    !showLoadError && data?.pagination
      ? {
          page: filters.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          limit: data.pagination.limit,
        }
      : undefined;

  return (
    <ListPageShell
      title={copy.title}
      description={copy.description}
      items={trips ?? []}
      isLoading={isLoading || showLoadError}
      pagination={pagination}
      onPageChange={filters.setPage}
      entityLabelPlural={copy.entityLabelPlural}
      beforeToolbar={
        showLoadError ? (
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
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{copy.channelHint}</p>
            {totals && totals.tripCount > 0 ? (
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">
                    {copy.totals.pending}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {formatMxCurrency(totals.pendingAmount)}
                  </dd>
                </div>
                <div className="rounded-lg border bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">
                    {copy.totals.trips}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {totals.tripCount}
                  </dd>
                </div>
                <div className="rounded-lg border bg-card px-4 py-3">
                  <dt className="text-xs text-muted-foreground">
                    {copy.totals.clients}
                  </dt>
                  <dd className="mt-1 text-lg font-semibold tabular-nums">
                    {totals.clientCount}
                  </dd>
                </div>
              </dl>
            ) : null}
          </div>
        )
      }
      toolbar={{
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: activeChips,
        hasFilters: hasClientFilter,
        onClearFilters: hasClientFilter ? filters.clearAll : undefined,
      }}
      emptyState={{
        icon: hasClientFilter ? (
          <Search className="h-8 w-8 text-muted-foreground" />
        ) : (
          <HandCoins className="h-8 w-8 text-muted-foreground" />
        ),
        title: hasClientFilter ? copy.emptyFiltered.title : copy.empty.title,
        description: hasClientFilter
          ? copy.emptyFiltered.description
          : copy.empty.description,
        secondaryCta: hasClientFilter
          ? {
              label: copy.clearClientFilter,
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
      renderTable={() => (
        <OperationalCashPendingTable groups={groups} isLoading={isLoading} />
      )}
    />
  );
}
