/**
 * Bandeja «Efectivo por cobrar» — F2 ADR-0096 addendum lectura · F3 chrome Conform.
 * Agrupa por cliente; CTA → Costos del viaje. No registra abonos aquí.
 * Shell: ListPageShell (no Workbench).
 */

import { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowUpRight, HandCoins, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useQueryErrorToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useActiveClients } from "@features/clients/application";
import { getClientDisplayName } from "@features/clients/domain";
import {
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_CLIENT_ID_PARAM,
  OPERATIONAL_CASH_PENDING_PAGE_SIZE,
  useFinanceListingFilters,
  useOperationalCashPending,
} from "@features/finance/application";
import { financeCopy } from "../copy";
import { OperationalCashPendingTable } from "../components/OperationalCashPendingTable";
import { groupOperationalCashPendingByClient } from "../utils/groupOperationalCashPending";

const copy = financeCopy.efectivoPorCobrar;
const CLIENT_FILTER_ALL = "__all__";

function ClientToolbarFilter({
  value,
  onChange,
  options,
  isLoading,
}: {
  value: string;
  onChange: (clientId: string) => void;
  options: Array<{ id: string; label: string }>;
  isLoading?: boolean;
}) {
  return (
    <div className="min-w-[12rem] max-w-xs flex-1 sm:flex-none">
      <Label htmlFor="efectivo-client-filter" className="sr-only">
        {copy.clientFilterLabel}
      </Label>
      <Select
        value={value || CLIENT_FILTER_ALL}
        onValueChange={(next) =>
          onChange(next === CLIENT_FILTER_ALL ? "" : next)
        }
        disabled={isLoading}
      >
        <SelectTrigger id="efectivo-client-filter" className="max-w-xs">
          <SelectValue placeholder={copy.clientFilterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLIENT_FILTER_ALL}>
            {copy.clientFilterAll}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function KpiStrip({
  pendingAmount,
  tripCount,
  clientCount,
}: {
  pendingAmount: number;
  tripCount: number;
  clientCount: number;
}) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="rounded-lg border bg-card px-4 py-3">
        <dt className="text-xs text-muted-foreground">{copy.totals.pending}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">
          {formatMxCurrency(pendingAmount)}
        </dd>
      </div>
      <div className="rounded-lg border bg-card px-4 py-3">
        <dt className="text-xs text-muted-foreground">{copy.totals.trips}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">{tripCount}</dd>
      </div>
      <div className="rounded-lg border bg-card px-4 py-3">
        <dt className="text-xs text-muted-foreground">{copy.totals.clients}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">
          {clientCount}
        </dd>
      </div>
    </dl>
  );
}

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

  const { data: activeClients = [], isLoading: isLoadingClients } =
    useActiveClients();

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
    const fromActive = activeClients.find((c) => c.id === clientId);
    if (fromActive) return copy.clientChip(getClientDisplayName(fromActive));
    const match = byClient?.find((c) => c.clientId === clientId);
    const name =
      match?.clientName?.trim() ||
      trips?.find((t) => t.clientId === clientId)?.clientName?.trim() ||
      clientId;
    return copy.clientChip(name);
  }, [activeClients, byClient, clientId, trips]);

  const clientOptions = useMemo(() => {
    const options = activeClients.map((client) => ({
      id: client.id,
      label: getClientDisplayName(client),
    }));
    if (
      clientId &&
      !options.some((option) => option.id === clientId)
    ) {
      const match = byClient?.find((c) => c.clientId === clientId);
      const fallbackName =
        match?.clientName?.trim() ||
        trips?.find((t) => t.clientId === clientId)?.clientName?.trim() ||
        clientId;
      return [{ id: clientId, label: fallbackName }, ...options];
    }
    return options;
  }, [activeClients, byClient, clientId, trips]);

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

  const handleClientFilterChange = useCallback(
    (nextClientId: string) => {
      filters.setFilter("clientId", nextClientId);
    },
    [filters],
  );

  const showLoadError = isError && !data;
  const hasClientFilter = Boolean(clientId);
  const kpiPending = totals?.pendingAmount ?? 0;
  const kpiTrips = totals?.tripCount ?? 0;
  const kpiClients = totals?.clientCount ?? 0;

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
    <div className="space-y-6">
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
              <KpiStrip
                pendingAmount={kpiPending}
                tripCount={kpiTrips}
                clientCount={kpiClients}
              />
            </div>
          )
        }
        toolbar={{
          filters: (
            <ClientToolbarFilter
              value={clientId ?? ""}
              onChange={handleClientFilterChange}
              options={clientOptions}
              isLoading={isLoadingClients}
            />
          ),
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

      {/* Equivalente DS a relatedConfig (ListPageShell no lo expone; patrón Workbench). */}
      <div className="border-t pt-4">
        <Link
          to={FINANCE_COBROS_PATH}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          {copy.relatedConfig.label}
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">
          {copy.relatedConfig.description}
        </p>
      </div>
    </div>
  );
}
