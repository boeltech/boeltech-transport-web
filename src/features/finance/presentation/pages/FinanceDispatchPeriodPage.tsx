/**
 * Envíos del periodo: listado de lotes + frecuencias de envío (`ListPageShell`).
 *
 * Dictamen toolbar: sin search (el API no busca); estado y frecuencia en
 * «Filtros (n)». Card de frecuencias y Armar no son recortes.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, History, Plus } from "lucide-react";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { ListPageShell } from "@shared/ui/page-shells";
import { useQueryErrorToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { BillingSchemesCompactCard } from "@features/settings/presentation/components/BillingSchemesCompactCard";
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
import { FinanceDispatchPeriodFilters } from "../components/FinanceDispatchPeriodFilters";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { FINANCE_DISPATCH_DETAIL_PATH } from "../../application/financeRoutes";
import { countDispatchPeriodPanelFilters } from "../utils/dispatchPeriodListFilters";
import { useIncomingFrom, useListQueueFromState } from "@shared/utils/listQueueFrom";
import { resolvePeriodListBackHref } from "../utils/dispatchWayfinding";

const copy = dispatchRunsCopy.tab;
const emptyCopy = dispatchRunsCopy.tab.empty;

function parseDispatchRunStatus(
  value: string | undefined,
): DispatchRunStatus | undefined {
  if (!value) return undefined;
  return (DISPATCH_RUN_STATUSES as readonly string[]).includes(value)
    ? (value as DispatchRunStatus)
    : undefined;
}

function DispatchPeriodOnboardingChecklist() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{emptyCopy.onboardingTitle}</CardTitle>
        <CardDescription>{emptyCopy.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-3 pl-5 text-sm">
          {emptyCopy.onboardingSteps.map((step) => (
            <li key={step.label}>
              <span className="text-foreground">{step.label}</span>
              {"href" in step &&
              step.href &&
              "linkLabel" in step &&
              step.linkLabel ? (
                <>
                  {" "}
                  <Link
                    to={step.href}
                    className="text-primary underline underline-offset-2"
                  >
                    {step.linkLabel}
                  </Link>
                </>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

export function FinanceDispatchPeriodPage() {
  const navigate = useNavigate();
  const { from: returnTo } = useListQueueFromState();
  const incomingFrom = useIncomingFrom();
  const workbenchBackHref = resolvePeriodListBackHref(incomingFrom);
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");

  const { data: schemes = [] } = useBillingSchemes();
  const [createOpen, setCreateOpen] = useState(false);

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
    });

  const runs = data?.data ?? [];
  const showOnboarding =
    !isLoading && !filters.hasFilters && runs.length === 0;

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

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" className="-ml-2 h-8 px-2" asChild>
        <Link to={workbenchBackHref}>
          <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden />
          {copy.backToWorkbench}
        </Link>
      </Button>
      <ListPageShell<BillingDispatchRunListItem>
        title={copy.title}
        description={copy.subtitle}
        primaryAction={{
          label: copy.executeCta,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleOpenCreate,
          visible: canExecute,
        }}
        beforeToolbar={
          <div className="space-y-6">
            <BillingSchemesCompactCard />
            {showOnboarding ? <DispatchPeriodOnboardingChecklist /> : null}
          </div>
        }
        toolbar={{
          filters: (
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
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
        }}
        isLoading={isLoading}
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
        emptyState={{
          icon: <History className="h-10 w-10 text-muted-foreground" />,
          title: filters.hasFilters
            ? copy.empty.recorteTitle
            : copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.withFilters
            : copy.empty.description,
          cta:
            canExecute && !filters.hasFilters
              ? {
                  label: copy.executeCta,
                  icon: <Plus className="h-4 w-4" />,
                  onClick: handleOpenCreate,
                }
              : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: copy.empty.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
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
