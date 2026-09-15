import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Banknote, History, Plus, ArrowUpRight, Settings } from "lucide-react";
import {
  WorkbenchPageShell,
  type WorkbenchBucket,
} from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@shared/ui/tooltip";
import { ViewModeToggle } from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { useBranches } from "@features/branches";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application/compensationRoutes";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  useSettlements,
  useSettlementWorkbench,
  useSettlementWorkbenchCounts,
  useSettlementsReadiness,
  usePagosOperadoresGreenfield,
} from "../../application/hooks";
import {
  resolveSettlementsListRedirect,
  settlementCreatePath,
  settlementDetailPath,
  settlementsAdvancesPath,
  settlementsRegistryPath,
} from "../../application/settlementsRoutes";
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
  SettlementsSetupChecklist,
  SettlementSettingsSheet,
} from "../components";
import { mapSettlementWorkbenchBuckets } from "../utils/mapSettlementWorkbenchBuckets";
import type { DriverSettlement } from "../../domain/entities";

const copy = settlementsCopy;
const workbenchCopy = settlementsCopy.workbench;

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
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canUpdate = hasPermission("settlements", "update");
  const { enabled: greenfieldEnabled } = usePagosOperadoresGreenfield();
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const filters = useListingFilters<
    "employeeId" | "bucket" | "branchId" | "includeContractors"
  >({
    filters: {
      employeeId: {},
      bucket: {},
      branchId: {},
      includeContractors: {},
    },
    chipLabels: {
      employeeId: (value) => `Operador: ${value.slice(0, 8)}`,
      branchId: (value) =>
        `Sucursal: ${branchLabelById.get(value) ?? value.slice(0, 8)}`,
      bucket: (value) =>
        `Etapa: ${workbenchCopy.buckets[value as SettlementWorkbenchNavBucket] ?? value}`,
      includeContractors: () => "Incluye contratistas",
    },
  });

  const activeBucket: SettlementWorkbenchNavBucket = isWorkbenchBucket(
    filters.filters.bucket,
  )
    ? filters.filters.bucket
    : "pending";
  const employeeIdFilter = filters.filters.employeeId || "";
  const branchIdFilter = filters.filters.branchId || "";
  const includeContractors = filters.filters.includeContractors === "true";

  const workbenchParams = useMemo(
    () => ({
      employeeId: employeeIdFilter || undefined,
      branchId: branchIdFilter || undefined,
      includeContractors,
    }),
    [branchIdFilter, employeeIdFilter, includeContractors],
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

  useEffect(() => {
    const redirect = resolveSettlementsListRedirect(location.search);
    if (redirect) {
      navigate(redirect, { replace: true });
    }
  }, [location.search, navigate]);

  useEffect(() => {
    if (filters.filters.bucket === "approval") {
      filters.setFilter("bucket", "pending");
    }
  }, [filters]);

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
    employeeId: employeeIdFilter || undefined,
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
    employeeId: employeeIdFilter || undefined,
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
      filters.setFilters({ bucket });
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
    (id: string) => navigate(settlementDetailPath(id)),
    [navigate],
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
  const showChecklist = !readinessLoading && !isSettlementsReady;
  const showSchemesBridge =
    !readinessLoading &&
    activeBucket === "pending" &&
    backlogRows.length === 0;
  const showBeforeAwareness = showChecklist || showSchemesBridge;

  return (
    <>
      <WorkbenchPageShell
        title={greenfieldEnabled ? settlementsCopy.hub.title : copy.title}
        description={greenfieldEnabled ? settlementsCopy.hub.description : copy.description}
        showHeader={!greenfieldEnabled}
        primaryAction={
          canCreate
            ? {
                label: copy.actions.createSettlement,
                icon: <Plus className="h-4 w-4" />,
                onClick: () => navigate(settlementCreatePath()),
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
          <div className="space-y-1">
            <Link
              to={settlementsAdvancesPath()}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {workbenchCountsLoading
                ? workbenchCopy.buckets.openAdvances
                : workbenchCopy.openAdvancesBridge.linkLabel(
                    workbenchSummary.openAdvances,
                  )}
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <p className="text-xs text-muted-foreground">
              {workbenchCopy.openAdvancesBridge.description}
            </p>
          </div>
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.fields.searchPlaceholder,
          },
          onRefresh: handleRefresh,
          isRefreshing,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
          extraActions: (
            <>
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
              {!greenfieldEnabled && canUpdate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsOpen(true)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {settlementsCopy.hub.settingsAction}
                </Button>
              ) : null}
              <ViewModeToggle {...filters.viewModeProps} />
            </>
          ),
          filters: (
            <>
              <EmployeeAsyncCombobox
                id="settlements-workbench-employee-filter"
                className="w-48"
                value={employeeIdFilter}
                onChange={(employeeId) =>
                  filters.setFilter("employeeId", employeeId)
                }
                placeholder="Todos los operadores"
                allowClear
              />

              {branches.length > 0 ? (
                <Select
                  value={branchIdFilter || "all"}
                  onValueChange={(val) =>
                    filters.setFilter("branchId", val === "all" ? "" : val)
                  }
                >
                  <SelectTrigger
                    className="w-48"
                    aria-label="Filtrar por sucursal"
                  >
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las sucursales</SelectItem>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

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
                rows={backlogRows}
                isLoading={workbenchLoading}
                apiUnavailable={!isWorkbenchAvailable}
                viewMode={filters.viewMode}
                onNavigateCreate={navigate}
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
        relatedConfig={
          greenfieldEnabled
            ? undefined
            : {
                label: copy.actions.manageAgreements,
                href: COMPENSATION_TEMPLATES_PATH,
                description: workbenchCopy.readiness.relatedConfigDescription,
              }
        }
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
      <SettlementSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </>
  );
}
