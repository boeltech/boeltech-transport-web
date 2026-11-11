import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  useDriverAdvances,
  useSettlementWorkbench,
} from "../../application/hooks";
import type { AdvanceStatus } from "../../domain/enums";
import type { DriverAdvance } from "../../domain/entities";
import {
  AdvancePeriodDeductionSheet,
  DriverAdvancesTable,
  DriverAdvanceCreateDialog,
  SettlementPipelineChevrons,
} from "../components";
import { useEmployeeFilterChipLabel } from "../hooks/useEmployeeFilterChipLabel";

const copy = settlementsCopy;
const advancesCopy = settlementsCopy.advancesList;

type AdvancePipelineBucket =
  | "pending_approval"
  | "pending_disbursement"
  | "open"
  | "deducted";

const OPEN_STATUSES: AdvanceStatus[] = ["disbursed", "partially_applied"];

/**
 * Anticipos workbench — pipeline 4 etapas + P10 Repartir (F4).
 */
export function SettlementsAdvancesPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canUpdate = hasPermission("settlements", "update");
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [repartirAdvance, setRepartirAdvance] = useState<DriverAdvance | null>(
    null,
  );
  const [activeBucket, setActiveBucket] =
    useState<AdvancePipelineBucket>("open");

  const openCreate = useCallback(() => setAdvanceDialogOpen(true), []);

  const filters = useListingFilters<"employeeId">({
    filters: {
      employeeId: {},
    },
  });

  const employeeIdFilter = filters.filters.employeeId || "";

  const {
    data: advancesData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useDriverAdvances({
    employeeId: employeeIdFilter || undefined,
    status:
      activeBucket === "open"
        ? undefined
        : activeBucket === "deducted"
          ? "fully_applied"
          : activeBucket,
    page: filters.page,
    pageSize: 20,
  });

  const { data: openDisbursed } = useDriverAdvances({
    status: "disbursed",
    page: 1,
    pageSize: 1,
  });
  const { data: openPartial } = useDriverAdvances({
    status: "partially_applied",
    page: 1,
    pageSize: 1,
  });
  const { data: pendingApprovalCount } = useDriverAdvances({
    status: "pending_approval",
    page: 1,
    pageSize: 1,
  });
  const { data: pendingDisburseCount } = useDriverAdvances({
    status: "pending_disbursement",
    page: 1,
    pageSize: 1,
  });
  const { data: deductedCount } = useDriverAdvances({
    status: "fully_applied",
    page: 1,
    pageSize: 1,
  });

  const { data: workbenchData } = useSettlementWorkbench();

  const showLoadError = isError && !isLoading;
  const advancesList = useMemo(() => {
    const rows = advancesData?.data ?? [];
    if (activeBucket === "open") {
      return rows.filter((a) =>
        OPEN_STATUSES.includes(a.status as AdvanceStatus),
      );
    }
    return rows;
  }, [activeBucket, advancesData?.data]);

  const employeeChipLabel = useEmployeeFilterChipLabel(
    employeeIdFilter,
    advancesList,
  );

  const filteredAdvances = useMemo(() => {
    if (!filters.search.trim()) return advancesList;
    const q = filters.search.toLowerCase();
    return advancesList.filter(
      (a) =>
        a.folio.toLowerCase().includes(q) ||
        (a.employeeFullName && a.employeeFullName.toLowerCase().includes(q)) ||
        (a.tripCode && a.tripCode.toLowerCase().includes(q)) ||
        (a.bankReference && a.bankReference.toLowerCase().includes(q)),
    );
  }, [advancesList, filters.search]);

  /**
   * C25: capacidad deductiva del próximo pago.
   * El backlog solo expone `estimatedNetAmount` (neto), no bruto/`max_advance_deductible`.
   * Sin campo de capacidad → no inventar; el aviso de exceso no se muestra (escala TEC).
   */
  const capacityByEmployee = useMemo(() => {
    const map = new Map<string, number>();
    // Campo canónico pendiente en backlog (TEC). No usar estimatedNetAmount como capacidad.
    void workbenchData?.backlog;
    return map;
  }, [workbenchData?.backlog]);

  const exceedsAdvances = useMemo(() => {
    return filteredAdvances.filter((a) => {
      if (!OPEN_STATUSES.includes(a.status as AdvanceStatus)) return false;
      const balance = a.availableBalance ?? a.balanceRemaining;
      const capacity = capacityByEmployee.get(a.employeeId);
      if (capacity == null) return false;
      return balance > capacity;
    });
  }, [capacityByEmployee, filteredAdvances]);

  const pipelineBuckets = useMemo(() => {
    const openCount =
      (openDisbursed?.pagination.total ?? 0) +
      (openPartial?.pagination.total ?? 0);
    return [
      {
        id: "pending_approval",
        label: advancesCopy.pipeline.pendingApproval,
        count: pendingApprovalCount?.pagination.total ?? 0,
        amount: undefined as number | undefined,
        isActive: activeBucket === "pending_approval",
        onClick: () => {
          setActiveBucket("pending_approval");
          filters.setPage(1);
        },
      },
      {
        id: "pending_disbursement",
        label: advancesCopy.pipeline.pendingDisbursement,
        count: pendingDisburseCount?.pagination.total ?? 0,
        amount: undefined,
        isActive: activeBucket === "pending_disbursement",
        onClick: () => {
          setActiveBucket("pending_disbursement");
          filters.setPage(1);
        },
      },
      {
        id: "open",
        label: advancesCopy.pipeline.open,
        count: openCount,
        amount: workbenchData?.summary.advancesDeductibleEstimate,
        isActive: activeBucket === "open",
        onClick: () => {
          setActiveBucket("open");
          filters.setPage(1);
        },
      },
      {
        id: "deducted",
        label: advancesCopy.pipeline.deducted,
        count: deductedCount?.pagination.total ?? 0,
        amount: undefined,
        isActive: activeBucket === "deducted",
        onClick: () => {
          setActiveBucket("deducted");
          filters.setPage(1);
        },
      },
    ];
  }, [
    activeBucket,
    deductedCount?.pagination.total,
    filters,
    openDisbursed?.pagination.total,
    openPartial?.pagination.total,
    pendingApprovalCount?.pagination.total,
    pendingDisburseCount?.pagination.total,
    workbenchData?.summary.advancesDeductibleEstimate,
  ]);

  const activeFilterChips: ActiveFilterChip[] = employeeIdFilter
    ? [
        ...filters.activeChips,
        {
          id: "employeeId",
          label: employeeChipLabel,
          onRemove: () => filters.setFilter("employeeId", ""),
        },
      ]
    : filters.activeChips;

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const pagination =
    !showLoadError && advancesData?.pagination
      ? {
          page: filters.page,
          totalPages: advancesData.pagination.totalPages,
          total: advancesData.pagination.total,
          limit: advancesData.pagination.limit,
        }
      : undefined;

  const repartirCapacity = repartirAdvance
    ? (capacityByEmployee.get(repartirAdvance.employeeId) ?? null)
    : null;

  const isEmpty =
    !isLoading && !showLoadError && filteredAdvances.length === 0;

  return (
    <>
      <WorkbenchPageShell
        showHeader
        title={advancesCopy.title}
        description={advancesCopy.description}
        primaryAction={
          canCreate
            ? {
                label: advancesCopy.primaryAction,
                onClick: openCreate,
                icon: <Plus className="mr-2 h-4 w-4" />,
              }
            : undefined
        }
        buckets={[]}
        beforeAwareness={
          <div className="space-y-3">
            <SettlementPipelineChevrons
              buckets={pipelineBuckets}
              ariaLabel={advancesCopy.pipeline.ariaLabel}
              amountMissingSumLabel={advancesCopy.pipeline.amountMissingSum}
            />
            <p className="text-xs text-muted-foreground">
              {advancesCopy.pipeline.openHint}
            </p>
          </div>
        }
        afterAwareness={
          <div className="grid gap-3 md:grid-cols-2">
            {exceedsAdvances[0] ? (
              <Alert variant="warning" data-testid="advance-exceeds-alert">
                <AlertTitle>
                  {advancesCopy.exceedsPaymentAlert.title(
                    exceedsAdvances[0].employeeFullName ??
                      exceedsAdvances[0].folio,
                  )}
                </AlertTitle>
                <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    {(() => {
                      const bal =
                        exceedsAdvances[0].availableBalance ??
                        exceedsAdvances[0].balanceRemaining;
                      const capacity =
                        capacityByEmployee.get(exceedsAdvances[0].employeeId) ??
                        0;
                      return advancesCopy.exceedsPaymentAlert.description(
                        formatMxCurrency(capacity),
                        formatMxCurrency(bal),
                      );
                    })()}
                  </span>
                  {canUpdate ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setRepartirAdvance(exceedsAdvances[0]!)}
                    >
                      {advancesCopy.exceedsPaymentAlert.action}
                    </Button>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}
            <Alert variant="info" data-testid="advance-not-reimbursement-alert">
              <AlertTitle>
                {advancesCopy.notReimbursementAlert.title}
              </AlertTitle>
              <AlertDescription>
                {advancesCopy.notReimbursementAlert.description}
              </AlertDescription>
            </Alert>
          </div>
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.fields.searchPlaceholder,
            ariaLabel: copy.fields.searchAriaLabel,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
          // V-M7: Operate fija tabla; toggle lista/grid fuera del toolbar.
          filters: (
            <EmployeeAsyncCombobox
              id="settlements-advances-employee-filter"
              value={employeeIdFilter}
              onChange={(id) => filters.setFilter("employeeId", id)}
              allowClear
              placeholder={advancesCopy.operatorAll}
              className="w-[220px]"
            />
          ),
        }}
        pagination={pagination}
        onPageChange={filters.setPage}
        renderContent={() => {
          if (showLoadError) {
            return (
              <DetailAlertCard
                severity="critical"
                icon={<AlertCircle className="h-5 w-5" aria-hidden />}
                title={advancesCopy.loadErrorTitle}
                items={[{ text: advancesCopy.loadError }]}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void refetch();
                    }}
                  >
                    {advancesCopy.retry}
                  </Button>
                }
              />
            );
          }

          if (isEmpty) {
            return (
              <EmptyState
                icon={<Plus className="h-8 w-8 text-muted-foreground" />}
                title={copy.empty.advancesTitle}
                description={
                  filters.hasFilters
                    ? copy.empty.withFiltersDescription
                    : copy.empty.advances
                }
                cta={
                  canCreate
                    ? {
                        label: advancesCopy.primaryAction,
                        onClick: () => setAdvanceDialogOpen(true),
                      }
                    : undefined
                }
                secondaryCta={
                  filters.hasFilters
                    ? {
                        label: copy.empty.clearFilters,
                        onClick: filters.clearAll,
                        variant: "outline",
                      }
                    : undefined
                }
              />
            );
          }

          return (
            <DriverAdvancesTable
              advances={filteredAdvances}
              isLoading={isLoading}
              onRepartir={
                canUpdate && activeBucket === "open"
                  ? (advance) => setRepartirAdvance(advance)
                  : undefined
              }
              estimatedByEmployee={capacityByEmployee}
            />
          );
        }}
      />

      <DriverAdvanceCreateDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
      />
      <AdvancePeriodDeductionSheet
        advance={repartirAdvance}
        open={Boolean(repartirAdvance)}
        onOpenChange={(open) => {
          if (!open) setRepartirAdvance(null);
        }}
        periodCapacity={repartirCapacity}
      />
    </>
  );
}
