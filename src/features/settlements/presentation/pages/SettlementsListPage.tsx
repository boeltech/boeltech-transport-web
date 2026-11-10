import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  History,
  MoreHorizontal,
  Plus,
  Wallet,
} from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { TooltipProvider } from "@shared/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { useBranches } from "@features/branches";
import { useAuth } from "@features/auth";
import { useSelfApprovalPolicy } from "@features/approvals/application";
import {
  DecisionReasonSheet,
  type DecisionReasonInput,
} from "@features/approvals/presentation/components";
import { useHelpEmptySupport } from "@features/help-center/presentation";
import { approvalPoliciesPath } from "@features/approval-policies/application";
import { COMPENSATION_TEMPLATES_PATH } from "@features/compensation/application";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  useBatchApproveSettlements,
  useBatchRejectSettlements,
  useOperatorPaymentReadiness,
  useSettlements,
  useSettlementWorkbench,
  useSettlementWorkbenchCounts,
  useSettlementsReadiness,
} from "../../application/hooks";
import {
  resolveSettlementsListRedirect,
  settlementCreatePath,
  settlementCutsNewPath,
  settlementDetailPath,
  SETTLEMENTS_LIST_PATH,
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
  SettlementBacklogTable,
  SettlementBatchRegisterSheet,
  SettlementBulkBar,
  SettlementClosedPeriodBanner,
  SettlementPipelineChevrons,
  SettlementPipelineQueue,
  SettlementListFilters,
  SettlementWorkbenchKpis,
  SettlementsSetupChecklist,
} from "../components";
import { filterSettlementBacklog } from "../utils/filterSettlementBacklog";
import { resolveClosedPeriodBanner } from "../utils/closedPeriodBanner";
import { useEmployeeFilterChipLabel } from "../hooks/useEmployeeFilterChipLabel";
import { settlementToApprovableItem } from "../utils/settlementApprovableItem";
import {
  partitionSettlementsForBatch,
  summarizeBatchOmits,
} from "../utils/settlementBatchOmit";
import type { DriverSettlement } from "../../domain/entities";
import { roundCents } from "../../domain/settlementTotals";

const copy = settlementsCopy;
const workbenchCopy = settlementsCopy.workbench;
const hubCopy = settlementsCopy.hub;

function isWorkbenchBucket(
  value: string,
): value is SettlementWorkbenchNavBucket {
  // TEC C.2: `paid` = Pagados; workbench usa `closed`.
  if (value === "paid") return true;
  return SETTLEMENT_WORKBENCH_BUCKETS.includes(
    value as SettlementWorkbenchNavBucket,
  );
}

function normalizeWorkbenchBucket(
  value: string,
): SettlementWorkbenchNavBucket {
  if (value === "paid") return "closed";
  return value as SettlementWorkbenchNavBucket;
}

/**
 * Workbench de pagos a operadores — WorkbenchPageShell (ADR-0090 / F2 sin hub tabs).
 * Historial → ?bucket=closed · Anticipos → /finance/operator-payments/advances
 */
export function SettlementsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = useSettlementQueueFromState();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canUpdate = hasPermission("settlements", "update");
  const canExecute = hasPermission("settlements", "execute");
  const canReadSettlements = hasPermission("settlements", "read");
  const canReadApprovalPolicies = hasPermission("approval_policies", "read");
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const batchApproveMutation = useBatchApproveSettlements();
  const batchRejectMutation = useBatchRejectSettlements();
  const defaultsAppliedRef = useRef(false);

  const { data: branchesData } = useBranches({
    limit: 100,
    filters: { isActive: true },
  });
  const branches = useMemo(
    () => branchesData?.data ?? [],
    [branchesData?.data],
  );

  const branchLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const branch of branches) {
      map.set(branch.id, branch.name);
    }
    return map;
  }, [branches]);

  const filters = useListingFilters<
    "bucket" | "branchId" | "includeContractors" | "employeeId"
  >({
    filters: {
      bucket: {},
      branchId: {},
      includeContractors: {},
      employeeId: {},
    },
    preserveParamsOnClear: ["bucket"],
  });

  const activeBucket: SettlementWorkbenchNavBucket = isWorkbenchBucket(
    filters.filters.bucket,
  )
    ? normalizeWorkbenchBucket(filters.filters.bucket)
    : "pending";
  const branchIdFilter = filters.filters.branchId || "";
  const includeContractors = filters.filters.includeContractors === "true";
  const employeeIdFilter = filters.filters.employeeId || "";

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
    isError: isWorkbenchError,
    refetch: refetchWorkbench,
  } = useSettlementWorkbench(workbenchParams);

  const listRedirect = resolveSettlementsListRedirect(location.search);

  useEffect(() => {
    if (activeBucket !== "pending" && includeContractors) {
      filters.setFilter("includeContractors", "");
    }
  }, [activeBucket, filters, includeContractors]);

  useEffect(() => {
    if (activeBucket !== "approval" && employeeIdFilter) {
      filters.setFilter("employeeId", "");
    }
  }, [activeBucket, employeeIdFilter, filters]);

  useEffect(() => {
    // Evitar flicker de bucket default cuando hay redirect legacy (?tab= / ?view=).
    if (listRedirect) return;
    if (defaultsAppliedRef.current) return;
    if (filters.filters.bucket) {
      defaultsAppliedRef.current = true;
      return;
    }
    if (workbenchCountsLoading) return;

    defaultsAppliedRef.current = true;
    filters.setFilter("bucket", resolveDefaultWorkbenchBucket());
  }, [filters, workbenchCountsLoading, listRedirect]);

  const [disburseSettlement, setDisburseSettlement] =
    useState<DriverSettlement | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [registerSheetOpen, setRegisterSheetOpen] = useState(false);
  const [registerEligible, setRegisterEligible] = useState<DriverSettlement[]>(
    [],
  );
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectEligible, setRejectEligible] = useState<DriverSettlement[]>([]);

  const pipelineStatus =
    activeBucket !== "pending"
      ? BUCKET_PIPELINE_STATUSES[activeBucket][0]
      : undefined;

  const {
    data: pipelineData,
    isLoading: isPipelineLoading,
    isFetching: isPipelineFetching,
    isError: isPipelineError,
    refetch: refetchPipelinePrimary,
  } = useSettlements({
    status: pipelineStatus,
    employeeId:
      activeBucket === "approval" && employeeIdFilter
        ? employeeIdFilter
        : undefined,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
    enabled: activeBucket !== "pending",
  });

  const {
    data: rejectedPipelineData,
    isLoading: isRejectedPipelineLoading,
    isFetching: isRejectedPipelineFetching,
    isError: isRejectedPipelineError,
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

  const employeeFilterChipLabel = useEmployeeFilterChipLabel(
    employeeIdFilter,
    pipelineSettlements,
  );

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

  const handleRetryLoad = useCallback(() => {
    if (activeBucket === "pending") {
      void refetchWorkbench();
      void refetchWorkbenchCounts();
      return;
    }
    void refetchPipelinePrimary();
    if (activeBucket === "draft") void refetchRejectedPipeline();
  }, [
    activeBucket,
    refetchPipelinePrimary,
    refetchRejectedPipeline,
    refetchWorkbench,
    refetchWorkbenchCounts,
  ]);

  const handleBucketChange = useCallback(
    (bucket: SettlementWorkbenchNavBucket) => {
      // Una sola llamada a setSearchParams: setFilters ya resetea page=1.
      // Un setPage() seguido sobrescribe la URL (RR no encadena updaters).
      // Contratistas / employeeId no aplican fuera de su bucket: limpiar.
      setSelectedIds(new Set());
      filters.setFilters({
        bucket,
        includeContractors: "",
        employeeId: "",
      });
    },
    [filters],
  );

  const pipelineChevrons = useMemo(
    () =>
      SETTLEMENT_WORKBENCH_BUCKETS.map((bucket) => {
        const count =
          bucket === "pending"
            ? workbenchSummary.pending
            : bucket === "draft"
              ? workbenchSummary.draft
              : bucket === "approval"
                ? workbenchSummary.approval
                : bucket === "payable"
                  ? workbenchSummary.payable
                  : workbenchSummary.closed;
        const amount =
          bucket === "pending"
            ? workbenchSummary.kpis?.toArm.amount
            : bucket === "approval"
              ? workbenchSummary.kpis?.inApproval.amount
              : bucket === "payable"
                ? workbenchSummary.kpis?.authorizedUnpaid.amount
                : undefined;
        return {
          id: bucket,
          label: workbenchCopy.buckets[bucket],
          count,
          amount,
          isActive: activeBucket === bucket,
          onClick: () => handleBucketChange(bucket),
        };
      }),
    [activeBucket, handleBucketChange, workbenchSummary],
  );

  const closedPeriod = useMemo(
    () =>
      resolveClosedPeriodBanner(
        workbenchSummary,
        workbenchData?.backlog ?? [],
      ),
    [workbenchData?.backlog, workbenchSummary],
  );

  const selectionEnabled =
    activeBucket === "payable" || activeBucket === "approval";

  const { data: operatorsData } = useOperatorPaymentReadiness({
    attention: "all",
    page: 1,
    pageSize: 100,
    enabled: selectionEnabled,
  });

  const hasClabeByEmployeeId = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const row of operatorsData?.data ?? []) {
      map.set(row.employeeId, row.hasClabe);
    }
    return map;
  }, [operatorsData?.data]);

  const selectedSettlements = useMemo(
    () => pipelineSettlements.filter((s) => selectedIds.has(s.id)),
    [pipelineSettlements, selectedIds],
  );
  const hasSelection = selectedIds.size > 0 && selectionEnabled;
  const selectedTotal = useMemo(
    () =>
      roundCents(
        selectedSettlements.reduce((sum, s) => sum + s.netAmount, 0),
      ),
    [selectedSettlements],
  );
  const withoutClabeCount = useMemo(
    () =>
      selectedSettlements.filter(
        (s) => hasClabeByEmployeeId.get(s.employeeId) === false,
      ).length,
    [hasClabeByEmployeeId, selectedSettlements],
  );

  const notifyLocalOmits = useCallback(
    (omitted: ReturnType<typeof partitionSettlementsForBatch>["omitted"]) => {
      if (omitted.length === 0) return;
      toast({
        title: workbenchCopy.bulkBar.omittedLeaveBatch(
          omitted.length,
          summarizeBatchOmits(omitted),
        ),
        variant: "warning",
      });
    },
    [toast],
  );

  const handleOpenRegisterBatch = useCallback(() => {
    const { eligible, omitted } = partitionSettlementsForBatch({
      settlements: selectedSettlements,
      kind: "disburse",
      userId: user?.id,
      selfApprovalPolicy,
      canUpdate,
      canExecute,
    });
    notifyLocalOmits(omitted);
    if (eligible.length === 0) {
      toast({
        title: workbenchCopy.batchRegister.emptyEligible,
        variant: "warning",
      });
      return;
    }
    setRegisterEligible([...eligible]);
    setRegisterSheetOpen(true);
  }, [
    canExecute,
    canUpdate,
    notifyLocalOmits,
    selectedSettlements,
    selfApprovalPolicy,
    toast,
    user?.id,
  ]);

  const handleApproveBatch = useCallback(async () => {
    const { eligible, omitted } = partitionSettlementsForBatch({
      settlements: selectedSettlements,
      kind: "approve",
      userId: user?.id,
      selfApprovalPolicy,
      canUpdate,
      canExecute,
    });
    notifyLocalOmits(omitted);
    if (eligible.length === 0) {
      toast({
        title: workbenchCopy.batchApprove.emptyEligible,
        variant: "warning",
      });
      return;
    }
    try {
      const result = await batchApproveMutation.mutateAsync({
        settlementIds: eligible.map((s) => s.id),
      });
      const processed = result.processed.length;
      const apiOmitted = result.omitted.length;
      toast({
        title:
          apiOmitted > 0
            ? workbenchCopy.batchApprove.successPartial(processed, apiOmitted)
            : workbenchCopy.batchApprove.successTitle(processed),
        description:
          apiOmitted > 0
            ? result.omitted.map((o) => o.reason).slice(0, 3).join("; ")
            : undefined,
        variant: "success",
      });
      setSelectedIds(new Set());
      void refetchPipelinePrimary();
      void refetchWorkbenchCounts();
    } catch (error) {
      toast({
        title: workbenchCopy.batchApprove.errorTitle,
        description: getErrorMessage(error),
        variant: "destructive",
      });
    }
  }, [
    batchApproveMutation,
    canExecute,
    canUpdate,
    notifyLocalOmits,
    refetchPipelinePrimary,
    refetchWorkbenchCounts,
    selectedSettlements,
    selfApprovalPolicy,
    toast,
    user?.id,
  ]);

  const handleOpenRejectBatch = useCallback(() => {
    const { eligible, omitted } = partitionSettlementsForBatch({
      settlements: selectedSettlements,
      kind: "reject",
      userId: user?.id,
      selfApprovalPolicy,
      canUpdate,
      canExecute,
    });
    notifyLocalOmits(omitted);
    if (eligible.length === 0) {
      toast({
        title: workbenchCopy.batchReject.emptyEligible,
        variant: "warning",
      });
      return;
    }
    setRejectEligible([...eligible]);
    setRejectSheetOpen(true);
  }, [
    canExecute,
    canUpdate,
    notifyLocalOmits,
    selectedSettlements,
    selfApprovalPolicy,
    toast,
    user?.id,
  ]);

  const handleRejectBatchSubmit = useCallback(
    async (input: DecisionReasonInput) => {
      try {
        const result = await batchRejectMutation.mutateAsync({
          settlementIds: rejectEligible.map((s) => s.id),
          reason: input.reason,
        });
        const processed = result.processed.length;
        const apiOmitted = result.omitted.length;
        toast({
          title:
            apiOmitted > 0
              ? workbenchCopy.batchReject.successPartial(processed, apiOmitted)
              : workbenchCopy.batchReject.successTitle(processed),
          description:
            apiOmitted > 0
              ? result.omitted.map((o) => o.reason).slice(0, 3).join("; ")
              : undefined,
          variant: "success",
        });
        setRejectSheetOpen(false);
        setRejectEligible([]);
        setSelectedIds(new Set());
        void refetchPipelinePrimary();
        void refetchWorkbenchCounts();
      } catch (error) {
        toast({
          title: workbenchCopy.batchReject.errorTitle,
          description: getErrorMessage(error),
          variant: "destructive",
        });
      }
    },
    [
      batchRejectMutation,
      refetchPipelinePrimary,
      refetchWorkbenchCounts,
      rejectEligible,
      toast,
    ],
  );

  const rejectApprovableItems = useMemo(
    () => rejectEligible.map(settlementToApprovableItem),
    [rejectEligible],
  );

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleSelectAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      setSelectedIds(new Set(pipelineSettlements.map((s) => s.id)));
    },
    [pipelineSettlements],
  );

  useEffect(() => {
    if (!selectionEnabled) setSelectedIds(new Set());
  }, [selectionEnabled]);

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

  const activeError = useMemo(() => {
    if (activeBucket === "pending") {
      return isWorkbenchError || !isWorkbenchAvailable;
    }
    if (activeBucket === "draft") {
      return isPipelineError || isRejectedPipelineError;
    }
    return isPipelineError;
  }, [
    activeBucket,
    isPipelineError,
    isRejectedPipelineError,
    isWorkbenchAvailable,
    isWorkbenchError,
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
  }, [activeBucket, filters.page, pipelineData, rejectedPipelineData]);

  const handleViewSettlement = useCallback(
    (id: string) => navigate(settlementDetailPath(id), { state: fromState }),
    [fromState, navigate],
  );

  const isRefreshing =
    isPipelineFetching ||
    isRejectedPipelineFetching ||
    workbenchCountsFetching ||
    workbenchFetching;

  const {
    items: readinessItems,
    isReady: isSettlementsReady,
    isLoading: readinessLoading,
  } = useSettlementsReadiness();

  const backlogRows = useMemo(
    () => workbenchData?.backlog ?? [],
    [workbenchData?.backlog],
  );
  const visibleBacklogRows = useMemo(
    () => filterSettlementBacklog(backlogRows, filters.search),
    [backlogRows, filters.search],
  );
  const hasBranchFilter = Boolean(branchIdFilter);
  const hasContractorFilter = includeContractors && activeBucket === "pending";
  const hasEmployeeFilter =
    activeBucket === "approval" && Boolean(employeeIdFilter);
  const hasToolbarFilters =
    Boolean(filters.search.trim()) ||
    hasBranchFilter ||
    hasContractorFilter ||
    hasEmployeeFilter;
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
    ...(hasEmployeeFilter
      ? [
          {
            id: "employee",
            label: employeeFilterChipLabel,
            onRemove: () => filters.setFilter("employeeId", ""),
          },
        ]
      : []),
  ];

  const isPendingBucket = activeBucket === "pending";
  const isSurfaceEmpty = isPendingBucket
    ? visibleBacklogRows.length === 0
    : pipelineSettlements.length === 0;

  // D5: checklist XOR bridge XOR EmptyState — solo cuando la cola está vacía.
  const showChecklist =
    isPendingBucket &&
    isSurfaceEmpty &&
    !activeLoading &&
    !activeError &&
    !readinessLoading &&
    !isSettlementsReady;
  const showSchemesBridge =
    isPendingBucket &&
    isSurfaceEmpty &&
    !activeLoading &&
    !activeError &&
    !readinessLoading &&
    !showChecklist &&
    backlogRows.length === 0 &&
    !hasToolbarFilters;

  const helpEmpty = useHelpEmptySupport(
    SETTLEMENTS_LIST_PATH,
    isPendingBucket &&
      isSurfaceEmpty &&
      !activeLoading &&
      !activeError &&
      !showChecklist &&
      !showSchemesBridge &&
      !hasToolbarFilters,
  );

  if (listRedirect) {
    return <Navigate to={listRedirect} replace />;
  }

  const armCut = () =>
    navigate(settlementCutsNewPath(), { state: fromState });

  return (
    <TooltipProvider delayDuration={0}>
      <WorkbenchPageShell
        title={hubCopy.title}
        description={hubCopy.description}
        showHeader
        primaryAction={
          canReadSettlements && !hasSelection
            ? {
                label: hubCopy.createCut,
                onClick: armCut,
                icon: <Plus className="mr-2 h-4 w-4" />,
                dataHelpAnchor: "stl-liquidar-periodo",
                // F5 R1: Gerente ve CTA + motivo; Contador/Admin arman.
                disabled: !canCreate,
                disabledTitle: !canCreate
                  ? hubCopy.createCutDisabledReason
                  : undefined,
              }
            : undefined
        }
        secondaryActions={
          <>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={() => navigate(settlementsRegistryPath())}
            >
              <History className="h-4 w-4" />
              {workbenchCopy.actions.viewFullHistory}
            </Button>
            {canReadSettlements ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canCreate}
                title={
                  !canCreate ? hubCopy.outOfCycleDisabledReason : undefined
                }
                onClick={() =>
                  navigate(settlementCreatePath(), { state: fromState })
                }
                data-testid="pago-fuera-de-ciclo"
              >
                {hubCopy.outOfCycle}
              </Button>
            ) : null}
            {canReadSettlements && hasSelection ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={armCut}
                disabled={!canCreate}
                title={
                  !canCreate ? hubCopy.createCutDisabledReason : undefined
                }
                data-help-anchor="stl-liquidar-periodo"
              >
                <Plus className="h-4 w-4" />
                {hubCopy.createCut}
              </Button>
            ) : null}
            {canReadApprovalPolicies ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Más</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate(approvalPoliciesPath("settlement"), {
                        state: {
                          from: `${location.pathname}${location.search}`,
                        },
                      })
                    }
                  >
                    {hubCopy.approvalPoliciesAction}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
        buckets={[]}
        beforeAwareness={
          <div className="space-y-4">
            {closedPeriod ? (
              <SettlementClosedPeriodBanner
                model={closedPeriod}
                onArmCut={armCut}
                canArmCut={canCreate}
                armCutDisabledReason={hubCopy.createCutDisabledReason}
              />
            ) : null}
            <SettlementWorkbenchKpis
              summary={workbenchSummary}
              isLoading={workbenchCountsLoading}
            />
            <SettlementPipelineChevrons
              buckets={pipelineChevrons}
              isLoading={workbenchCountsLoading}
            />
          </div>
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
        renderContent={() => {
          if (activeLoading) {
            return isPendingBucket ? (
              <SettlementBacklogTable
                rows={[]}
                isLoading
                viewMode={filters.viewMode}
                fromState={fromState}
                onNavigateCreate={(path) =>
                  navigate(path, { state: fromState })
                }
              />
            ) : (
              <SettlementPipelineQueue
                bucket={activeBucket}
                settlements={[]}
                isLoading
                viewMode={filters.viewMode}
                onView={handleViewSettlement}
              />
            );
          }

          if (activeError) {
            return (
              <DetailAlertCard
                severity="critical"
                icon={<AlertCircle className="h-5 w-5" aria-hidden />}
                title={workbenchCopy.loadErrorTitle}
                items={[{ text: workbenchCopy.loadError }]}
                action={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetryLoad}
                  >
                    {workbenchCopy.retry}
                  </Button>
                }
              />
            );
          }

          if (isSurfaceEmpty) {
            if (showChecklist) {
              return (
                <SettlementsSetupChecklist
                  items={readinessItems}
                  isReady={isSettlementsReady}
                  isLoading={readinessLoading}
                />
              );
            }

            if (showSchemesBridge) {
              return (
                <DetailAlertCard
                  severity="info"
                  icon={<Wallet className="h-5 w-5" aria-hidden />}
                  title={workbenchCopy.empty.schemesBridgeTitle}
                  items={[{ text: workbenchCopy.empty.schemesBridgeDescription }]}
                  action={
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(COMPENSATION_TEMPLATES_PATH)}
                      >
                        {workbenchCopy.empty.schemesBridgeAction}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/employees")}
                      >
                        {workbenchCopy.empty.schemesBridgeEmployeesAction}
                      </Button>
                    </div>
                  }
                />
              );
            }

            const emptyTitle = hasToolbarFilters
              ? workbenchCopy.empty.withFiltersTitle
              : isPendingBucket
                ? workbenchCopy.empty.backlogTitle
                : workbenchCopy.empty.pipelineTitle;
            const emptyDescription = hasToolbarFilters
              ? workbenchCopy.empty.withFiltersDescription
              : isPendingBucket
                ? helpEmpty?.phrase ?? workbenchCopy.empty.backlogDescription
                : workbenchCopy.empty.pipelineDescription;

            return (
              <EmptyState
                icon={<Wallet className="h-10 w-10 text-muted-foreground" />}
                title={emptyTitle}
                description={emptyDescription}
                cta={
                  hasToolbarFilters
                    ? {
                        label: workbenchCopy.empty.clearFilters,
                        onClick: filters.clearAll,
                        variant: "outline",
                      }
                    : helpEmpty
                      ? helpEmpty.viewHelpCta
                      : undefined
                }
              />
            );
          }

          return isPendingBucket ? (
            <SettlementBacklogTable
              rows={visibleBacklogRows}
              isLoading={false}
              viewMode={filters.viewMode}
              fromState={fromState}
              onNavigateCreate={(path) =>
                navigate(path, { state: fromState })
              }
            />
          ) : (
            <div className="space-y-2">
              {activeBucket === "payable" ? (
                <SettlementBulkBar
                  mode="payable"
                  selectedCount={selectedIds.size}
                  selectedTotal={selectedTotal}
                  withoutClabeCount={withoutClabeCount}
                  onRegisterBatch={handleOpenRegisterBatch}
                />
              ) : null}
              {activeBucket === "approval" ? (
                <SettlementBulkBar
                  mode="approval"
                  selectedCount={selectedIds.size}
                  selectedTotal={selectedTotal}
                  onApproveBatch={() => void handleApproveBatch()}
                  onRejectBatch={handleOpenRejectBatch}
                  isBusy={
                    batchApproveMutation.isPending ||
                    batchRejectMutation.isPending
                  }
                />
              ) : null}
              <SettlementPipelineQueue
                bucket={activeBucket}
                settlements={pipelineSettlements}
                isLoading={false}
                viewMode={filters.viewMode}
                onView={handleViewSettlement}
                onDisburse={setDisburseSettlement}
                selectedIds={selectionEnabled ? selectedIds : undefined}
                onToggleSelect={
                  selectionEnabled ? handleToggleSelect : undefined
                }
                onToggleSelectAll={
                  selectionEnabled ? handleToggleSelectAll : undefined
                }
                hasClabeByEmployeeId={
                  activeBucket === "payable" ? hasClabeByEmployeeId : undefined
                }
                onActionComplete={() => {
                  void refetchPipelinePrimary();
                  if (activeBucket === "draft") void refetchRejectedPipeline();
                  void refetchWorkbenchCounts();
                }}
              />
            </div>
          );
        }}
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

      {registerSheetOpen ? (
        <SettlementBatchRegisterSheet
          open={registerSheetOpen}
          onOpenChange={(open) => {
            setRegisterSheetOpen(open);
            if (!open) setRegisterEligible([]);
          }}
          settlements={registerEligible}
          hasClabeByEmployeeId={hasClabeByEmployeeId}
          onSuccess={() => {
            setSelectedIds(new Set());
            void refetchPipelinePrimary();
            void refetchWorkbenchCounts();
          }}
        />
      ) : null}

      {rejectSheetOpen ? (
        <DecisionReasonSheet
          mode="reject"
          open={rejectSheetOpen}
          onOpenChange={(open) => {
            setRejectSheetOpen(open);
            if (!open) setRejectEligible([]);
          }}
          item={rejectApprovableItems[0] ?? null}
          bulkItems={rejectApprovableItems}
          isSubmitting={batchRejectMutation.isPending}
          type="internal_staff_compensation"
          onSubmit={(input) => {
            void handleRejectBatchSubmit(input);
          }}
        />
      ) : null}
    </TooltipProvider>
  );
}
