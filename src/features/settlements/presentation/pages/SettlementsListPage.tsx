import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Banknote, History, Plus, ArrowUpRight } from "lucide-react";
import {
  WorkbenchPageShell,
  type WorkbenchBucket,
} from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { useBranches } from "@features/branches";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application/compensationRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  useSettlements,
  useSettlementWorkbench,
  useSettlementWorkbenchCounts,
  useSettlementsReadiness,
} from "../../application/hooks";
import {
  resolveSettlementsListRedirect,
  settlementCreatePath,
  settlementDetailPath,
  settlementsAdvancesPath,
  settlementsRegistryPath,
} from "../../application/settlementsRoutes";
import { useSettlementQueueFromState } from "../utils/settlementWayfinding";
import {
  BUCKET_PIPELINE_STATUSES,
  resolveDefaultWorkbenchBucket,
  SETTLEMENT_WORKBENCH_BUCKETS,
  type SettlementWorkbenchNavBucket,
} from "../config/settlementWorkbenchConfig";
import {
  DisburseSettlementDialog,
  DriverAdvanceCreateDialog,
  SettlementBacklogTable,
  SettlementPipelineQueue,
  SettlementListFilters,
  SettlementsSetupChecklist,
} from "../components";
import { filterSettlementBacklog } from "../utils/filterSettlementBacklog";
import { mapSettlementWorkbenchBuckets } from "../utils/mapSettlementWorkbenchBuckets";
import type { DriverSettlement } from "../../domain/entities";

const copy = settlementsCopy;
const workbenchCopy = settlementsCopy.workbench;
const hubCopy = settlementsCopy.hub;

function isWorkbenchBucket(
  value: string,
): value is SettlementWorkbenchNavBucket {
  return SETTLEMENT_WORKBENCH_BUCKETS.includes(
    value as SettlementWorkbenchNavBucket,
  );
}

/**
 * Workbench de pagos a operadores — WorkbenchPageShell (ADR-0090 Fase 2).
 * Registry → /finance/settlements/registry · Anticipos → /finance/settlements/advances
 */
export function SettlementsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = useSettlementQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const defaultsAppliedRef = useRef(false);

  const { data: branchesData } = useBranches({
    limit: 100,
    filters: { isActive: true },
  });
  const branches = branchesData?.data ?? [];

  const branchLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const branch of branches) {
      map.set(branch.id, branch.name);
    }
    return map;
  }, [branches]);

  const filters = useListingFilters<"bucket" | "branchId" | "includeContractors">(
    {
      filters: {
        bucket: {},
        branchId: {},
        includeContractors: {},
      },
      preserveParamsOnClear: ["bucket"],
    },
  );

  const activeBucket: SettlementWorkbenchNavBucket = isWorkbenchBucket(
    filters.filters.bucket,
  )
    ? filters.filters.bucket
    : "pending";
  const branchIdFilter = filters.filters.branchId || "";
  const includeContractors = filters.filters.includeContractors === "true";

  const workbenchParams = useMemo(
    () => ({
      branchId: branchIdFilter || undefined,
      includeContractors,
    }),
    [branchIdFilter, includeContractors],
  );

  const {
    summary: workbenchSummary,
    isLoading: workbenchCountsLoading,
    isFetching: workbenchCountsFetching,
    isWorkbenchAvailable,
    refetch: refetchWorkbenchCounts,
  } = useSettlementWorkbenchCounts(workbenchParams);

  const {
    data: workbenchData,
    isLoading: workbenchLoading,
    isFetching: workbenchFetching,
    refetch: refetchWorkbench,
  } = useSettlementWorkbench(workbenchParams);

  const listRedirect = resolveSettlementsListRedirect(location.search);

  useEffect(() => {
    if (filters.filters.bucket === "approval") {
      filters.setFilter("bucket", "pending");
    }
  }, [filters]);

  useEffect(() => {
    if (activeBucket !== "pending" && includeContractors) {
      filters.setFilter("includeContractors", "");
    }
  }, [activeBucket, filters, includeContractors]);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    if (filters.filters.bucket) {
      defaultsAppliedRef.current = true;
      return;
    }
    if (workbenchCountsLoading) return;

    defaultsAppliedRef.current = true;
    filters.setFilter("bucket", resolveDefaultWorkbenchBucket());
  }, [filters, workbenchCountsLoading]);

  const [disburseSettlement, setDisburseSettlement] =
    useState<DriverSettlement | null>(null);
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);

  const pipelineStatus =
    activeBucket !== "pending"
      ? BUCKET_PIPELINE_STATUSES[activeBucket][0]
      : undefined;

  const {
    data: pipelineData,
    isLoading: isPipelineLoading,
    isFetching: isPipelineFetching,
    refetch: refetchPipelinePrimary,
  } = useSettlements({
    status: pipelineStatus,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
    enabled: activeBucket !== "pending",
  });

  const {
    data: rejectedPipelineData,
    isLoading: isRejectedPipelineLoading,
    isFetching: isRejectedPipelineFetching,
    refetch: refetchRejectedPipeline,
  } = useSettlements({
    status: "rejected",
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
    enabled: activeBucket === "draft",
  });

  const pipelineSettlements = useMemo(() => {
    if (activeBucket === "pending") return [];

    if (activeBucket === "draft") {
      const merged = [
        ...(pipelineData?.data ?? []),
        ...(rejectedPipelineData?.data ?? []),
      ];
      const unique = new Map(merged.map((item) => [item.id, item]));
      return Array.from(unique.values()).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
    }

    return pipelineData?.data ?? [];
  }, [activeBucket, pipelineData?.data, rejectedPipelineData?.data]);

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetchWorkbenchCounts(), refetchWorkbench()]);
    if (activeBucket !== "pending") {
      await refetchPipelinePrimary();
      if (activeBucket === "draft") await refetchRejectedPipeline();
    }
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [
    activeBucket,
    refetchPipelinePrimary,
    refetchRejectedPipeline,
    refetchWorkbench,
    refetchWorkbenchCounts,
    toast,
  ]);

  const handleBucketChange = useCallback(
    (bucket: SettlementWorkbenchNavBucket) => {
      // Una sola llamada a setSearchParams: setFilters ya resetea page=1.
      // Un setPage() seguido sobrescribe la URL (RR no encadena updaters).
      // Contratistas solo aplican a Por liquidar: no dejar el opt-in pegado.
      filters.setFilters({ bucket, includeContractors: "" });
    },
    [filters],
  );

  const buckets: WorkbenchBucket[] = useMemo(
    () =>
      mapSettlementWorkbenchBuckets({
        summary: workbenchSummary,
        activeBucket,
        onBucketChange: handleBucketChange,
      }),
    [activeBucket, handleBucketChange, workbenchSummary],
  );

  const activeLoading = useMemo(() => {
    if (activeBucket === "pending") {
      return workbenchLoading || workbenchCountsLoading;
    }
    return (
      isPipelineLoading ||
      (activeBucket === "draft" && isRejectedPipelineLoading)
    );
  }, [
    activeBucket,
    isPipelineLoading,
    isRejectedPipelineLoading,
    workbenchCountsLoading,
    workbenchLoading,
  ]);

  const activePagination = useMemo(() => {
    if (activeBucket === "pending") return undefined;

    if (activeBucket === "draft" && pipelineData?.pagination) {
      const total =
        (pipelineData.pagination.total ?? 0) +
        (rejectedPipelineData?.pagination.total ?? 0);
      return {
        page: filters.page,
        totalPages: Math.max(
          pipelineData.pagination.totalPages,
          rejectedPipelineData?.pagination.totalPages ?? 1,
        ),
        total,
        limit: pipelineData.pagination.limit,
      };
    }
    if (pipelineData?.pagination) {
      return {
        page: filters.page,
        totalPages: pipelineData.pagination.totalPages,
        total: pipelineData.pagination.total,
        limit: pipelineData.pagination.limit,
      };
    }
    return undefined;
  }, [
    activeBucket,
    filters.page,
    pipelineData?.pagination,
    rejectedPipelineData?.pagination,
  ]);

  const handleViewSettlement = useCallback(
    (id: string) => navigate(settlementDetailPath(id), { state: fromState }),
    [fromState, navigate],
  );

  const isRefreshing =
    isPipelineFetching ||
    isRejectedPipelineFetching ||
    workbenchCountsFetching ||
    workbenchFetching;

  const isDegraded = !isWorkbenchAvailable;

  const {
    items: readinessItems,
    isReady: isSettlementsReady,
    isLoading: readinessLoading,
  } = useSettlementsReadiness();

  const backlogRows = workbenchData?.backlog ?? [];
  const visibleBacklogRows = useMemo(
    () => filterSettlementBacklog(backlogRows, filters.search),
    [backlogRows, filters.search],
  );
  const hasBranchFilter = Boolean(branchIdFilter);
  const hasContractorFilter = includeContractors && activeBucket === "pending";
  const hasToolbarFilters =
    Boolean(filters.search.trim()) || hasBranchFilter || hasContractorFilter;
  const activeFilterChips: ActiveFilterChip[] = [
    ...(hasBranchFilter
      ? [
          {
            id: "branch",
            label: branchLabelById.get(branchIdFilter)
              ? workbenchCopy.chip.branch(branchLabelById.get(branchIdFilter)!)
              : workbenchCopy.chip.branchUnknown,
            onRemove: () => filters.setFilter("branchId", ""),
          },
        ]
      : []),
    ...(hasContractorFilter
      ? [
          {
            id: "include-contractors",
            label: workbenchCopy.chip.includeContractors,
            onRemove: () => filters.setFilter("includeContractors", ""),
          },
        ]
      : []),
  ];
  const showChecklist = !readinessLoading && !isSettlementsReady;
  const showSchemesBridge =
    !readinessLoading &&
    activeBucket === "pending" &&
    backlogRows.length === 0;
  const showBeforeAwareness = showChecklist || showSchemesBridge;

  if (listRedirect) {
    return <Navigate to={listRedirect} replace />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <WorkbenchPageShell
        title={hubCopy.title}
        description={hubCopy.description}
        showHeader={false}
        primaryAction={
          canCreate
            ? {
                label: copy.actions.createSettlement,
                icon: <Plus className="h-4 w-4" />,
                onClick: () =>
                  navigate(settlementCreatePath(), { state: fromState }),
              }
            : undefined
        }
        secondaryActions={
          canCreate ? (
            <Button
              variant="outline"
              leftIcon={<Banknote className="h-4 w-4" />}
              onClick={() => setAdvanceDialogOpen(true)}
            >
              {copy.actions.createAdvance}
            </Button>
          ) : undefined
        }
        beforeAwareness={
          showBeforeAwareness ? (
            <div className="space-y-3">
              <SettlementsSetupChecklist
                items={readinessItems}
                isReady={isSettlementsReady}
                isLoading={readinessLoading}
              />
              {showSchemesBridge ? (
                <Alert variant="info">
                  <AlertTitle>{workbenchCopy.empty.schemesBridgeTitle}</AlertTitle>
                  <AlertDescription className="space-y-2">
                    <p>{workbenchCopy.empty.schemesBridgeDescription}</p>
                    <p>
                      <Link
                        to={COMPENSATION_TEMPLATES_PATH}
                        className="font-medium text-foreground underline underline-offset-4"
                      >
                        {workbenchCopy.empty.schemesBridgeAction}
                      </Link>
                    </p>
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : undefined
        }
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.scorecards.settlements.ariaLabel}
        bucketsLoading={workbenchCountsLoading}
        isDegraded={isDegraded}
        degradedHref={settlementsRegistryPath()}
        degradedLinkLabel={workbenchCopy.actions.viewFullHistory}
        degradedMessage={workbenchCopy.empty.backlogApiPendingDescription}
        afterAwareness={
          !workbenchCountsLoading && workbenchSummary.openAdvances > 0 ? (
            <div className="space-y-1">
              <Link
                to={settlementsAdvancesPath()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                {workbenchCopy.openAdvancesBridge.linkLabel(
                  workbenchSummary.openAdvances,
                )}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <p className="text-xs text-muted-foreground">
                {workbenchCopy.openAdvancesBridge.description}
              </p>
            </div>
          ) : undefined
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder:
              activeBucket === "pending"
                ? workbenchCopy.filter.searchPending
                : workbenchCopy.filter.searchPipeline,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          onRefresh: handleRefresh,
          isRefreshing,
          activeFilterChips,
          onClearFilters: filters.clearAll,
          hasFilters: hasToolbarFilters,
          extraActions: (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate(settlementsRegistryPath())}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              {workbenchCopy.actions.viewFullHistory}
            </Button>
          ),
          viewMode: filters.viewModeProps,
          filters: (
            <>
              {activeBucket === "pending" ? (
                <div className="flex items-center gap-2 px-1">
                  <Checkbox
                    id="include-contractors"
                    checked={includeContractors}
                    onCheckedChange={(checked) =>
                      filters.setFilter(
                        "includeContractors",
                        checked === true ? "true" : "",
                      )
                    }
                  />
                  <Label
                    htmlFor="include-contractors"
                    className="text-sm font-normal"
                  >
                    {workbenchCopy.actions.includeContractors}
                  </Label>
                </div>
              ) : null}
              <SettlementListFilters
                branchId={branchIdFilter}
                branches={branches}
                activePanelFilterCount={Number(hasBranchFilter)}
                onBranchChange={(value) =>
                  filters.setFilter("branchId", value === "all" ? "" : value)
                }
              />
            </>
          ),
        }}
        renderContent={() => (
          <div className="space-y-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground cursor-help w-fit border-b border-dotted border-muted-foreground/40">
                  {workbenchCopy.buckets[activeBucket]}
                  <span className="sr-only">
                    {". "}
                    {workbenchCopy.bucketDescriptions[activeBucket]}
                  </span>
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs text-xs">
                {workbenchCopy.bucketDescriptions[activeBucket]}
              </TooltipContent>
            </Tooltip>
            {activeBucket === "pending" ? (
              <SettlementBacklogTable
                rows={visibleBacklogRows}
                isLoading={workbenchLoading}
                apiUnavailable={!isWorkbenchAvailable}
                viewMode={filters.viewMode}
                onNavigateCreate={(path) =>
                  navigate(path, { state: fromState })
                }
              />
            ) : (
              <SettlementPipelineQueue
                bucket={activeBucket}
                settlements={pipelineSettlements}
                isLoading={activeLoading}
                viewMode={filters.viewMode}
                onView={handleViewSettlement}
                onDisburse={setDisburseSettlement}
                onActionComplete={() => {
                  void refetchPipelinePrimary();
                  if (activeBucket === "draft") void refetchRejectedPipeline();
                  void refetchWorkbenchCounts();
                }}
              />
            )}
          </div>
        )}
        pagination={activePagination}
        onPageChange={filters.setPage}
      />

      {disburseSettlement ? (
        <DisburseSettlementDialog
          open={Boolean(disburseSettlement)}
          onOpenChange={(open) => {
            if (!open) setDisburseSettlement(null);
          }}
          settlement={disburseSettlement}
          onSuccess={() => {
            void refetchPipelinePrimary();
            void refetchWorkbenchCounts();
            setDisburseSettlement(null);
          }}
        />
      ) : null}

      <DriverAdvanceCreateDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
        onSuccess={() => {
          void refetchWorkbenchCounts();
          void refetchWorkbench();
        }}
      />
    </TooltipProvider>
  );
}
