/**
 * Correo del periodo: listado de listas (`ListPageShell`).
 *
 * Empty: sin frecuencias XOR auto vacío XOR virgin XOR recorte (D10).
 * Checklist Operate dismissible aparte. Atajo a frecuencias page-local.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, History, Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
import { ListPageShell } from "@shared/ui/page-shells";
import { useQueryErrorToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import {
  useBillingDispatchRuns,
  useFinanceListingFilters,
} from "@features/finance/application";
import {
  DISPATCH_RUN_STATUSES,
  type BillingDispatchRunListItem,
  type DispatchRunStatus,
} from "../../domain/billingDispatchRun.types";
import {
  DISPATCH_RUNS_PAGE_SIZE,
  FinanceDispatchRunsTable,
} from "../components/FinanceDispatchRunsTable";
import { FinanceDispatchCreateRunDialog } from "../components/FinanceDispatchCreateRunDialog";
import { FinanceDispatchPeriodChecklist } from "../components/FinanceDispatchPeriodChecklist";
import { FinanceDispatchPeriodFilters } from "../components/FinanceDispatchPeriodFilters";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FINANCE_DISPATCH_DETAIL_PATH } from "../../application/financeRoutes";
import { countDispatchPeriodPanelFilters } from "../utils/dispatchPeriodListFilters";
import { useIncomingFrom, useListQueueFromState } from "@shared/utils/listQueueFrom";
import { resolvePeriodListBackHref } from "../utils/dispatchWayfinding";

const copy = dispatchRunsCopy.tab;
const emptyCopy = dispatchRunsCopy.tab.empty;
const filterCopy = dispatchRunsCopy.tab.filters;

function parseDispatchRunStatus(
  value: string | undefined,
): DispatchRunStatus | undefined {
  if (!value) return undefined;
  return (DISPATCH_RUN_STATUSES as readonly string[]).includes(value)
    ? (value as DispatchRunStatus)
    : undefined;
}

export function FinanceDispatchPeriodPage() {
  const navigate = useNavigate();
  const { from: returnTo } = useListQueueFromState();
  const incomingFrom = useIncomingFrom();
  const workbenchBackHref = resolvePeriodListBackHref(incomingFrom);
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");

  const { data: schemes = [], isLoading: schemesLoading } = useBillingSchemes();
  const [createOpen, setCreateOpen] = useState(false);
  /** PRD D4: default on — exclude scheduled+cancelled via API (not client-only). */
  const [excludeEmptyScheduled, setExcludeEmptyScheduled] = useState(true);

  const filters = useFinanceListingFilters<"status" | "billingSchemeId">({
    filters: {
      status: { paramName: "dispatch_status" },
      billingSchemeId: { paramName: "billing_scheme_id" },
    },
    chipLabels: {
      status: (value) =>
        copy.filters.chipStatus(
          dispatchRunsCopy.status[value as DispatchRunStatus] ?? value,
        ),
      billingSchemeId: (value) =>
        copy.filters.chipScheme(
          schemes.find((s) => s.id === value)?.name ?? value,
        ),
    },
  });

  const statusFilter = parseDispatchRunStatus(filters.filters.status);
  const schemeFilter = filters.filters.billingSchemeId || undefined;
  const activePanelFilterCount = countDispatchPeriodPanelFilters({
    status: statusFilter ?? "",
    billingSchemeId: schemeFilter ?? "",
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  useEffect(() => {
    if (filters.filters.status && !statusFilter) {
      filters.setFilter("status", "");
    }
    // setFilter is estable en el hook de listing; no depender de `filters` entero.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- same as listing filters contract
  }, [filters.filters.status, statusFilter, filters.setFilter]);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useBillingDispatchRuns({
      page: filters.page,
      limit: DISPATCH_RUNS_PAGE_SIZE,
      status: statusFilter,
      billingSchemeId: schemeFilter,
      excludeEmptyScheduled,
    });

  const runs = data?.data ?? [];
  const schemesReady = !schemesLoading;
  const hasSchemes = schemesReady && schemes.length > 0;
  const noSchemes = schemesReady && schemes.length === 0;
  const listIdle =
    !isLoading && !filters.hasFilters && runs.length === 0;

  /** Si el listado ocultó solo automáticos vacíos, sondear para empty de rescate. */
  const shouldProbeEmptyScheduled =
    hasSchemes && listIdle && excludeEmptyScheduled;

  const emptyScheduledProbe = useBillingDispatchRuns({
    page: 1,
    limit: 5,
    excludeEmptyScheduled: false,
    enabled: shouldProbeEmptyScheduled,
  });

  const probeSettled =
    !shouldProbeEmptyScheduled ||
    (!emptyScheduledProbe.isLoading && !emptyScheduledProbe.isFetching);
  const hasHiddenEmptyScheduled =
    shouldProbeEmptyScheduled &&
    probeSettled &&
    (emptyScheduledProbe.data?.data?.length ?? 0) > 0;

  const showNoSchemesEmpty = listIdle && noSchemes;
  const showAutoEmpty =
    listIdle && hasSchemes && probeSettled && hasHiddenEmptyScheduled;
  const showVirginEmpty =
    listIdle && hasSchemes && probeSettled && !hasHiddenEmptyScheduled;

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadError,
  });

  const schemeName = useCallback(
    (id: string | null) =>
      id ? schemes.find((s) => s.id === id)?.name ?? id : "—",
    [schemes],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleView = useCallback(
    (id: string) => {
      navigate(FINANCE_DISPATCH_DETAIL_PATH(id), { state: { from: returnTo } });
    },
    [navigate, returnTo],
  );

  const handleOpenCreate = useCallback(() => {
    setCreateOpen(true);
  }, []);

  const handleCreateScheme = useCallback(() => {
    navigate(copy.relatedConfig.href);
  }, [navigate]);

  const primaryAction =
    canExecute && noSchemes
      ? {
          label: emptyCopy.noSchemesCta,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreateScheme,
          visible: true as const,
        }
      : {
          label: copy.executeCta,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleOpenCreate,
          visible: canExecute,
        };

  const emptyState = filters.hasFilters
    ? {
        icon: <History className="h-10 w-10 text-muted-foreground" />,
        title: emptyCopy.recorteTitle,
        description: emptyCopy.withFilters,
        secondaryCta: {
          label: emptyCopy.clearFilters,
          onClick: filters.clearAll,
          variant: "outline" as const,
        },
      }
    : showNoSchemesEmpty
      ? {
          icon: <History className="h-10 w-10 text-muted-foreground" />,
          title: emptyCopy.noSchemesTitle,
          description: emptyCopy.noSchemesDescription,
          cta: canExecute
            ? {
                label: emptyCopy.noSchemesCta,
                icon: <Plus className="h-4 w-4" />,
                onClick: handleCreateScheme,
              }
            : undefined,
        }
      : showAutoEmpty
        ? {
            icon: <History className="h-10 w-10 text-muted-foreground" />,
            title: emptyCopy.autoEmptyTitle,
            description: emptyCopy.autoEmptyDescription,
            cta: canExecute
              ? {
                  label: copy.executeCta,
                  icon: <Plus className="h-4 w-4" />,
                  onClick: handleOpenCreate,
                }
              : undefined,
          }
        : {
            icon: <History className="h-10 w-10 text-muted-foreground" />,
            title: emptyCopy.title,
            description: emptyCopy.description,
            cta:
              canExecute && showVirginEmpty
                ? {
                    label: copy.executeCta,
                    icon: <Plus className="h-4 w-4" />,
                    onClick: handleOpenCreate,
                  }
                : undefined,
          };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        {workbenchBackHref ? (
          <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
            <Link to={workbenchBackHref}>
              <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
              {copy.backToWorkbench}
            </Link>
          </Button>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}
        <div className="min-w-0 sm:text-right">
          <Link
            to={copy.relatedConfig.href}
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

      <FinanceDispatchPeriodChecklist />

      <ListPageShell<BillingDispatchRunListItem>
        title={copy.title}
        description={copy.subtitle}
        primaryAction={primaryAction}
        toolbar={{
          filters: (
            <>
              <Button
                type="button"
                variant={excludeEmptyScheduled ? "secondary" : "outline"}
                size="sm"
                onClick={() =>
                  setExcludeEmptyScheduled(!excludeEmptyScheduled)
                }
                aria-pressed={excludeEmptyScheduled}
                aria-label={filterCopy.hideEmptyScheduledAria}
              >
                {excludeEmptyScheduled
                  ? filterCopy.hideEmptyScheduledOn
                  : filterCopy.hideEmptyScheduledOff}
              </Button>
              <FinanceDispatchPeriodFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                status={statusFilter ?? ""}
                billingSchemeId={schemeFilter ?? ""}
                schemes={schemes}
                activePanelFilterCount={activePanelFilterCount}
                onStatusChange={(value) => filters.setFilter("status", value)}
                onSchemeChange={(value) =>
                  filters.setFilter("billingSchemeId", value)
                }
              />
            </>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
        }}
        isLoading={
          isLoading ||
          schemesLoading ||
          (shouldProbeEmptyScheduled && !probeSettled)
        }
        items={runs}
        pagination={
          data?.pagination
            ? {
                page: filters.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit ?? DISPATCH_RUNS_PAGE_SIZE,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        entityLabelPlural={copy.entityLabelPlural}
        renderTable={() => (
          <FinanceDispatchRunsTable
            runs={runs}
            isLoading={isLoading}
            schemeName={schemeName}
            onView={handleView}
          />
        )}
        emptyState={emptyState}
      />

      <FinanceDispatchCreateRunDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        alreadyOpenSource="list"
        returnTo={returnTo}
      />
    </div>
  );
}
