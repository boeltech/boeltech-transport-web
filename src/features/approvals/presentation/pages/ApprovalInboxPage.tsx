/**
 * ApprovalInboxPage — bandeja de VoBo (WorkbenchPageShell ADR-0090).
 *
 * Dictamen toolbar: el scorecard es dueño del TIPO; pending es la cola
 * implícita (sin chip); estado ≠ pending, categoría y fecha van en «Filtros»;
 * el search es lookup; deep-links muestran nombre, no UUID.
 *
 * ADR-0099 (handoff F6a): cola «Me toca · Todas» (`queue`), flujo por pasos
 * en la celda «Estado», ⋯ con Devolver/Rechazar/historial, guardas sin
 * reintento y masiva con resultado por elemento.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Info } from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { EmptyState } from "@shared/ui/feedback-states";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { useAuth } from "@features/auth";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Button } from "@shared/ui/button";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import {
  EXPENSE_CATEGORY_LABELS,
  type ExpenseCategoryType,
} from "@features/trips/domain";
import {
  invalidateApprovalsRelatedQueries,
  useApprovals,
  useApprovalsPendingCountsByType,
  useApproveApprovable,
  useBulkApprovals,
  useRejectApprovable,
  useReturnApprovable,
  useSelfActionForbiddenHandler,
  useSelfApprovalPolicy,
  invalidateSelfApprovalPolicy,
} from "../../application";
import {
  APPROVAL_STATUS_LABELS,
  DEFAULT_APPROVAL_TYPE,
  countBulkOutcomes,
  getApprovalGuardCode,
  hasSelfActionForbiddenFailure,
  isIntermediateStep,
  predictBulkApprove,
  queueListFilters,
  resolveApprovableActionUi,
  type ApprovableItem,
  type ApprovableType,
  type ApprovalDecisionOutcome,
  type ApprovalQueue,
  type ApprovalStatus,
  type BulkAction,
  type BulkOperation,
  type BulkOutcomeCounts,
  type BulkResult,
} from "../../domain";
import {
  ApprovalFilters,
  ApprovalHistorySheet,
  ApprovalInbox,
  ApprovalQueueToggle,
  BulkActionsBar,
  BulkDecisionResultPanel,
  DecisionReasonSheet,
  ReapprovalConfirmNote,
  type BulkDecisionFailureRow,
  type DecisionReasonInput,
  type DecisionReasonMode,
} from "../components";
import {
  approvalsCopy,
  selfApprovalSubjectForType,
} from "../copy/approvalsCopy";
import {
  APPROVAL_STATUS_ALL,
  buildApprovalContextChips,
  buildApprovalEmptyState,
  countApprovalPanelFilters,
  hasApprovalUserFilters,
  resolveDriverFilterLabel,
  resolveTripFilterLabel,
  resolveVehicleFilterLabel,
  type ApprovalContextFilterParams,
} from "../utils/approvalInboxFilters";
import { formatApprovableApproveConfirmDescription } from "../utils/approvalConfirmHelpers";
import { isApprovableSelectable } from "../utils/approvalRowActions";
import {
  approvableFolio,
  approvalGuardsFor,
  commonNextStepLabel,
  describeBulkFailureMessage,
  formatNextStepLabel,
  guardErrorMessage,
} from "../utils/approvalFlowFormat";
import {
  mapApprovalWorkbenchBuckets,
  type ApprovalWorkbenchType,
} from "../utils/mapApprovalWorkbenchBuckets";
import { formatListingDateRangeLabel } from "@shared/ui/listing";

const copy = approvalsCopy.inbox;
const selfCopy = approvalsCopy.selfApproval;
const flowCopy = approvalsCopy.flow;
const bulkCopy = approvalsCopy.bulkFlow;
const SELF_APPROVED_PARAM = "selfApproved";
const QUEUE_PARAM = "queue";
const BULK_MAX = 50;
const PAGE_SIZE = 25;

function resolveListStatus(status: string): ApprovalStatus | undefined {
  if (!status || status === APPROVAL_STATUS_ALL) return undefined;
  return status as ApprovalStatus;
}

const OUTCOME_FOR_ACTION: Record<BulkAction, ApprovalDecisionOutcome> = {
  approve: "approved",
  reject: "rejected",
  return: "returned",
};

interface BulkDialogState {
  phase: "confirm" | "result";
  items: ApprovableItem[];
  total: number;
  counts?: BulkOutcomeCounts;
  failures?: BulkDecisionFailureRow[];
  nextStep?: number | null;
  nextRole?: string | null;
}

interface ReasonSheetState {
  mode: DecisionReasonMode;
  items: ApprovableItem[];
}

export interface ApprovalInboxPageProps {
  /**
   * Renderizada como tab de un hub: el encabezado lo pone el shell del hub y
   * la descripción baja al bloque previo al awareness strip.
   */
  embedded?: boolean;
  /**
   * Fija el tipo (p. ej. «Por autorizar» de Pagos a operadores): sin
   * tarjetas de tipo y sin `type` en la URL.
   */
  lockedType?: ApprovalWorkbenchType;
  /**
   * Solo con `embedded`: selector de operador en la barra (filtra por
   * `driverId`, que el API aplica como `employee_id` en anticipos y
   * liquidaciones).
   */
  operatorFilter?: { placeholder: string };
  /** Solo con `embedded`: vacío sin filtros con copy del hub anfitrión. */
  emptyState?: { title: string; description: string };
}

export function ApprovalInboxPage({
  embedded = false,
  lockedType,
  operatorFilter: operatorFilterProp,
  emptyState: emptyStateProp,
}: ApprovalInboxPageProps = {}) {
  const operatorFilter = embedded ? operatorFilterProp : undefined;
  const hostEmptyState = embedded ? emptyStateProp : undefined;
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("finance_approvals", "update");
  const currentUserId = user?.id;
  const queryClient = useQueryClient();
  const { data: selfApprovalPolicy } = useSelfApprovalPolicy();
  const handleSelfActionForbidden = useSelfActionForbiddenHandler();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        let changed = false;
        if (!lockedType && !params.get("type")) {
          params.set("type", DEFAULT_APPROVAL_TYPE);
          changed = true;
        }
        if (!params.get("status")) {
          params.set("status", "pending");
          changed = true;
        }
        return changed ? params : prev;
      },
      { replace: true },
    );
  }, [lockedType, setSearchParams]);

  const filters = useListingFilters<
    "status" | "category" | "fromDate" | "toDate"
  >({
    filters: {
      status: {},
      category: {},
      fromDate: { paramName: "fromDate" },
      toDate: { paramName: "toDate" },
    },
    chipLabels: {
      status: (value) =>
        copy.filters.statusChip(
          value === APPROVAL_STATUS_ALL
            ? copy.filters.statusAll
            : (APPROVAL_STATUS_LABELS[value as ApprovalStatus] ?? value),
        ),
      category: (value) =>
        copy.filters.categoryChip(
          EXPENSE_CATEGORY_LABELS[value as ExpenseCategoryType] ?? value,
        ),
    },
  });

  const fromDate = filters.filters.fromDate;
  const toDate = filters.filters.toDate;
  const hasDateFilter = !!fromDate || !!toDate;

  const approvalType: ApprovableType =
    lockedType ??
    ((searchParams.get("type") as ApprovableType) || DEFAULT_APPROVAL_TYPE);
  const showCategoryFilter = approvalType === "trip_expense";
  const selfApprovedFilter = searchParams.get(SELF_APPROVED_PARAM) === "true";
  const listStatus = resolveListStatus(filters.filters.status);
  /** D7: la cola solo aplica a pendientes. */
  const queue: ApprovalQueue | null =
    listStatus === "pending"
      ? searchParams.get(QUEUE_PARAM) === "all"
        ? "all"
        : "mine"
      : null;
  const countsQueue: ApprovalQueue = queue ?? "mine";

  const contextFilters = useMemo<ApprovalContextFilterParams>(
    () => ({
      tripId: searchParams.get("tripId"),
      tripCode: searchParams.get("tripCode"),
      driverId: searchParams.get("driverId"),
      vehicleId: searchParams.get("vehicleId"),
    }),
    [searchParams],
  );

  const listFilters = useMemo(
    () => ({
      type: approvalType,
      status: listStatus,
      category: filters.filters.category || undefined,
      tripId: contextFilters.tripId || undefined,
      driverId: contextFilters.driverId || undefined,
      vehicleId: contextFilters.vehicleId || undefined,
      fromDate: filters.filters.fromDate || undefined,
      toDate: filters.filters.toDate || undefined,
      search: filters.search || undefined,
      selfApproved: selfApprovedFilter ? true : undefined,
      ...(queue ? queueListFilters(queue) : {}),
      page: filters.page,
      pageSize: PAGE_SIZE,
    }),
    [
      approvalType,
      contextFilters,
      filters.filters,
      filters.page,
      filters.search,
      listStatus,
      queue,
      selfApprovedFilter,
    ],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useApprovals(listFilters);

  const { data: pendingCounts, isLoading: pendingCountsLoading } =
    useApprovalsPendingCountsByType({ queue: countsQueue });

  const showLoadError = isError && !isLoading;
  const items = useMemo<ApprovableItem[]>(
    () => (showLoadError ? [] : (data?.data ?? [])),
    [data?.data, showLoadError],
  );
  const pagination = data?.pagination;

  const tripFilterLabel = useMemo(
    () =>
      resolveTripFilterLabel(
        contextFilters.tripId,
        contextFilters.tripCode,
        items,
      ),
    [contextFilters.tripCode, contextFilters.tripId, items],
  );
  const driverFilterLabel = useMemo(
    () => resolveDriverFilterLabel(contextFilters.driverId, items),
    [contextFilters.driverId, items],
  );
  const vehicleFilterLabel = useMemo(
    () => resolveVehicleFilterLabel(contextFilters.vehicleId, items),
    [contextFilters.vehicleId, items],
  );
  const activePanelFilterCount = countApprovalPanelFilters({
    status: filters.filters.status,
    category: filters.filters.category,
    fromDate: filters.filters.fromDate,
    toDate: filters.filters.toDate,
    showCategory: showCategoryFilter,
    selfApproved: selfApprovedFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  const hasUserFilters = useMemo(
    () =>
      hasApprovalUserFilters({
        search: filters.search,
        status: filters.filters.status,
        category: filters.filters.category,
        fromDate: filters.filters.fromDate,
        toDate: filters.filters.toDate,
        selfApproved: selfApprovedFilter,
        context: contextFilters,
      }),
    [contextFilters, filters.filters, filters.search, selfApprovedFilter],
  );

  const mineIsEmpty =
    queue === "mine" && !isLoading && !showLoadError && items.length === 0 && !hasUserFilters;
  /** D13: con «Me toca» vacío, cuántas esperan a otra persona. */
  const { data: allQueueCounts } = useApprovalsPendingCountsByType({
    queue: "all",
    enabled: mineIsEmpty,
  });
  const waitingOthersCount = mineIsEmpty
    ? (allQueueCounts?.[approvalType as ApprovalWorkbenchType] ?? 0)
    : 0;

  const emptyStateCopy = useMemo(
    () =>
      !hasUserFilters && hostEmptyState
        ? hostEmptyState
        : buildApprovalEmptyState(hasUserFilters, tripFilterLabel),
    [hasUserFilters, hostEmptyState, tripFilterLabel],
  );

  const removeContextFilter = useCallback(
    (param: keyof ApprovalContextFilterParams) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.delete(param);
        if (param === "tripId") {
          params.delete("tripCode");
        }
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleSelfApprovedChange = useCallback(
    (value: boolean) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) {
          params.set(SELF_APPROVED_PARAM, "true");
          // La marca de autoacción también existe en autorrechazos; el filtro
          // solo lista lo autorizado.
          params.set("status", "approved");
        } else {
          params.delete(SELF_APPROVED_PARAM);
        }
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const activeFilterChips = useMemo(() => {
    const statusValue = filters.filters.status;
    const baseChips = filters.activeChips.filter((chip) => {
      if (chip.id === "fromDate" || chip.id === "toDate") return false;
      if (chip.id === "status") {
        return statusValue === APPROVAL_STATUS_ALL ||
          (Boolean(statusValue) && statusValue !== "pending");
      }
      if (chip.id === "category" && !showCategoryFilter) return false;
      return true;
    });

    const dateFilterText = formatListingDateRangeLabel(
      fromDate,
      toDate,
      copy.filters.dateFilterPlaceholder,
    );

    return [
      ...baseChips,
      ...(hasDateFilter
        ? [
            {
              id: "date",
              label: `Fecha: ${dateFilterText}`,
              onRemove: () =>
                filters.setFilters({ fromDate: "", toDate: "" }),
            },
          ]
        : []),
      ...(selfApprovedFilter
        ? [
            {
              id: SELF_APPROVED_PARAM,
              label: selfCopy.filterChip,
              onRemove: () => handleSelfApprovedChange(false),
            },
          ]
        : []),
      ...buildApprovalContextChips(
        contextFilters,
        {
          trip: tripFilterLabel,
          driver: driverFilterLabel,
          vehicle: vehicleFilterLabel,
        },
        removeContextFilter,
      ),
    ];
  }, [
    contextFilters,
    driverFilterLabel,
    filters,
    fromDate,
    handleSelfApprovedChange,
    hasDateFilter,
    removeContextFilter,
    selfApprovedFilter,
    showCategoryFilter,
    toDate,
    tripFilterLabel,
    vehicleFilterLabel,
  ]);

  const handleApplyDateRange = useCallback(
    (nextFromDate: string, nextToDate: string) => {
      filters.setFilters({ fromDate: nextFromDate, toDate: nextToDate });
    },
    [filters],
  );

  const handleClearDateRange = useCallback(() => {
    filters.setFilters({ fromDate: "", toDate: "" });
  }, [filters]);

  const handleStatusFilterChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value === "all") {
          params.set("status", APPROVAL_STATUS_ALL);
        } else {
          params.set("status", value);
        }
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    filters.setSearchInput("");
    setSearchParams((prev) => {
      const params = new URLSearchParams();
      if (!lockedType) params.set("type", approvalType);
      params.set("status", "pending");
      const currentQueue = prev.get(QUEUE_PARAM);
      if (currentQueue === "all") params.set(QUEUE_PARAM, currentQueue);
      return params;
    });
  }, [approvalType, filters, lockedType, setSearchParams]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approveTarget, setApproveTarget] = useState<ApprovableItem | null>(
    null,
  );
  const [bulkDialog, setBulkDialog] = useState<BulkDialogState | null>(null);
  const [reasonSheet, setReasonSheet] = useState<ReasonSheetState | null>(null);
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState<ApprovableItem | null>(null);

  const handleQueueChange = useCallback(
    (next: ApprovalQueue) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (next === "all") params.set(QUEUE_PARAM, "all");
        else params.delete(QUEUE_PARAM);
        params.set("page", "1");
        return params;
      });
      setSelectedIds(new Set());
    },
    [setSearchParams],
  );

  const handleOperatorFilterChange = useCallback(
    (employeeId: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (employeeId) params.set("driverId", employeeId);
        else params.delete("driverId");
        params.set("page", "1");
        return params;
      });
      setSelectedIds(new Set());
    },
    [setSearchParams],
  );

  const handleRetryLoad = useCallback(() => {
    void refetch();
  }, [refetch]);

  const resolveItemActionUi = useCallback(
    (item: ApprovableItem) =>
      resolveApprovableActionUi(item, currentUserId, selfApprovalPolicy, canUpdate),
    [canUpdate, currentUserId, selfApprovalPolicy],
  );

  const canSelect = useCallback(
    (item: ApprovableItem) =>
      isApprovableSelectable(item, canUpdate, currentUserId, selfApprovalPolicy),
    [canUpdate, currentUserId, selfApprovalPolicy],
  );

  const approveActionUi = approveTarget ? resolveItemActionUi(approveTarget) : null;
  const approveTargetIsSelf =
    approveActionUi?.kind === "act" && approveActionUi.selfConfirm;
  const approveStep =
    approveTarget && isIntermediateStep(approveTarget.approval)
      ? {
          current: approveTarget.approval.stepCurrent,
          total: approveTarget.approval.stepsTotal,
        }
      : null;

  const approveConfirmDescription = useMemo(
    () => formatApprovableApproveConfirmDescription(approveTarget),
    [approveTarget],
  );

  const toastSelfAwareError = useCallback(
    (title: string, err: unknown) => {
      const forbidden = handleSelfActionForbidden(err);
      toast({
        title,
        description: forbidden
          ? (forbidden.message ?? selfCopy.serverRejected)
          : getErrorMessage(err),
        variant: "destructive",
      });
    },
    [handleSelfActionForbidden, toast],
  );

  /**
   * Handoff F6 §6: una guarda cierra la decisión, avisa y recarga. Nunca se
   * reintenta. Devuelve `true` si el error era de guarda.
   */
  const handleGuardError = useCallback(
    (err: unknown, close: () => void): boolean => {
      const guard = getApprovalGuardCode(err);
      if (!guard) return false;
      close();
      setSelectedIds(new Set());
      invalidateApprovalsRelatedQueries(queryClient);
      toast({ title: guardErrorMessage(guard), variant: "warning" });
      return true;
    },
    [queryClient, toast],
  );

  const refreshPolicyOnBulkFailures = useCallback(
    (failures: ReadonlyArray<{ error: { code: string } }>) => {
      if (hasSelfActionForbiddenFailure(failures)) {
        void invalidateSelfApprovalPolicy(queryClient);
      }
    },
    [queryClient],
  );

  const handleTypeChange = useCallback(
    (newType: ApprovalWorkbenchType | string) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("type", newType);
        next.delete("category");
        next.set("page", "1");
        return next;
      });
      setSelectedIds(new Set());
    },
    [setSearchParams],
  );

  const buckets = useMemo(
    () =>
      lockedType
        ? []
        : mapApprovalWorkbenchBuckets({
            activeType: approvalType,
            counts: pendingCounts,
            onTypeChange: handleTypeChange,
          }),
    [approvalType, handleTypeChange, lockedType, pendingCounts],
  );

  const beforeAwareness = useMemo(() => {
    const parts: ReactNode[] = [];

    if (embedded && !lockedType) {
      parts.push(
        <p key="desc" className="text-sm text-muted-foreground">
          {copy.description}
        </p>,
      );
    }

    if (!canUpdate) {
      parts.push(
        <DetailAlertCard
          key="readonly"
          severity="info"
          icon={<Info className="h-4 w-4" />}
          title={copy.readOnly.title}
          items={[{ text: copy.readOnly.description }]}
        />,
      );
    }

    if (parts.length === 0) return null;
    return <div className="space-y-4">{parts}</div>;
  }, [canUpdate, embedded, lockedType]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const approveMutation = useApproveApprovable();
  const rejectMutation = useRejectApprovable();
  const returnMutation = useReturnApprovable();
  const bulkMutation = useBulkApprovals();

  const closeReasonSheet = useCallback(() => {
    setReasonSheetOpen(false);
  }, []);

  /** Resultado de masiva: todo OK = toast; con fallas el diálogo muestra cuáles. */
  const presentBulkResult = useCallback(
    (result: BulkResult, targets: ApprovableItem[], action: BulkAction) => {
      refreshPolicyOnBulkFailures(result.failures);
      const counts = countBulkOutcomes(result.successes, OUTCOME_FOR_ACTION[action]);
      const signedTargets = targets.filter((item) =>
        result.successes.some(
          (success) => success.id === item.id && success.outcome === "step_signed",
        ),
      );
      const nextStep = predictBulkApprove(signedTargets).nextStep;
      const nextRole = commonNextStepLabel(signedTargets);
      setSelectedIds(new Set());

      if (result.failures.length === 0) {
        toast({
          title:
            bulkCopy.successSummary({
              approved: counts.approved,
              stepSigned: counts.step_signed,
              returned: counts.returned,
              rejected: counts.rejected,
              nextStep,
              nextRole,
            }) || copy.toasts.bulkSuccess(result.successes.length, targets.length),
          variant: "success",
        });
        setBulkDialog(null);
        return;
      }

      const byId = new Map(targets.map((item) => [item.id, item]));
      setBulkDialog({
        phase: "result",
        items: targets,
        total: targets.length,
        counts,
        nextStep,
        nextRole,
        failures: result.failures.map((failure) => ({
          key: `${failure.type}-${failure.id}`,
          folio: approvableFolio(byId.get(failure.id)),
          message: describeBulkFailureMessage(failure),
        })),
      });
    },
    [refreshPolicyOnBulkFailures, toast],
  );

  const runBulk = useCallback(
    (
      action: BulkAction,
      targets: ApprovableItem[],
      input?: DecisionReasonInput,
      onSettled?: () => void,
    ) => {
      const operations: BulkOperation[] = targets.slice(0, BULK_MAX).map((item) => ({
        type: item.approvableType,
        id: item.id,
        action,
        ...(input ? { reason: input.reason } : {}),
        ...(input?.reasonCode ? { reasonCode: input.reasonCode } : {}),
        ...approvalGuardsFor(item),
      }));
      bulkMutation.mutate(operations, {
        onSuccess: (result) => {
          onSettled?.();
          presentBulkResult(result.data, targets, action);
        },
        onError: (err) => {
          toast({
            title:
              action === "return"
                ? flowCopy.returnError
                : action === "reject"
                  ? copy.toasts.rejectError(approvalType)
                  : copy.toasts.approveError(approvalType),
            description: getErrorMessage(err),
            variant: "destructive",
          });
        },
      });
    },
    [approvalType, bulkMutation, presentBulkResult, toast],
  );

  const handleToggleItem = useCallback(
    (item: ApprovableItem, checked: boolean) => {
      if (checked && !canSelect(item)) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (checked) {
          if (next.size >= BULK_MAX && !next.has(item.id)) {
            toast({ title: copy.bulk.maxSelection, variant: "default" });
            return prev;
          }
          next.add(item.id);
        } else {
          next.delete(item.id);
        }
        return next;
      });
    },
    [canSelect, toast],
  );

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      const actionable = items.filter(canSelect).slice(0, BULK_MAX);
      setSelectedIds(new Set(actionable.map((item) => item.id)));
    },
    [canSelect, items],
  );

  const ownSelectedCount = useMemo(
    () =>
      selectedItems.filter((item) => {
        const actionUi = resolveItemActionUi(item);
        return actionUi.kind === "act" && actionUi.selfConfirm;
      }).length,
    [resolveItemActionUi, selectedItems],
  );

  const handleApproveConfirm = useCallback(() => {
    if (!approveTarget) return;
    const target = approveTarget;
    const step = isIntermediateStep(target.approval)
      ? {
          current: target.approval.stepCurrent,
          total: target.approval.stepsTotal,
          nextRole: formatNextStepLabel(target.approval),
        }
      : null;
    approveMutation.mutate(
      {
        type: target.approvableType,
        id: target.id,
        guards: approvalGuardsFor(target),
      },
      {
        onSuccess: (result) => {
          const title =
            result.outcome === "step_signed" && step
              ? flowCopy.stepSignedToast(step.current, step.total, step.nextRole)
              : (result.message ?? copy.toasts.approveSuccess(target.approvableType));
          toast({ title, variant: "success" });
          setApproveTarget(null);
          setSelectedIds(new Set());
        },
        onError: (err) => {
          if (handleGuardError(err, () => setApproveTarget(null))) return;
          toastSelfAwareError(copy.toasts.approveError(target.approvableType), err);
        },
      },
    );
  }, [approveMutation, approveTarget, handleGuardError, toast, toastSelfAwareError]);

  const handleReasonSubmit = useCallback(
    (input: DecisionReasonInput, targets: ApprovableItem[]) => {
      if (!reasonSheet || targets.length === 0) return;
      const mode = reasonSheet.mode;

      if (targets.length > 1) {
        runBulk(mode, targets, input, closeReasonSheet);
        return;
      }

      const target = targets[0];
      const guards = approvalGuardsFor(target);
      const onError = (err: Error) => {
        if (handleGuardError(err, closeReasonSheet)) return;
        toastSelfAwareError(
          mode === "return"
            ? flowCopy.returnError
            : copy.toasts.rejectError(target.approvableType),
          err,
        );
      };

      if (mode === "return") {
        returnMutation.mutate(
          {
            type: target.approvableType,
            id: target.id,
            reason: input.reason,
            reasonCode: input.reasonCode ?? "other",
            ...guards,
          },
          {
            onSuccess: () => {
              toast({
                title: flowCopy.returnSuccess(target.approvableType),
                variant: "success",
              });
              closeReasonSheet();
              setSelectedIds(new Set());
            },
            onError,
          },
        );
        return;
      }

      rejectMutation.mutate(
        { type: target.approvableType, id: target.id, reason: input.reason, guards },
        {
          onSuccess: (result) => {
            toast({
              title: result.message ?? copy.toasts.rejectSuccess(target.approvableType),
              variant: "success",
            });
            closeReasonSheet();
            setSelectedIds(new Set());
          },
          onError,
        },
      );
    },
    [
      closeReasonSheet,
      handleGuardError,
      reasonSheet,
      rejectMutation,
      returnMutation,
      runBulk,
      toast,
      toastSelfAwareError,
    ],
  );

  const openReasonSheet = useCallback(
    (mode: DecisionReasonMode, targets: ApprovableItem[]) => {
      if (targets.length === 0) return;
      setReasonSheet({ mode, items: targets });
      setReasonSheetOpen(true);
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  const bulkPrediction = useMemo(
    () => predictBulkApprove(bulkDialog?.items ?? []),
    [bulkDialog?.items],
  );
  const bulkPredictionText =
    bulkDialog?.phase === "confirm"
      ? bulkCopy.prediction({
          total: bulkPrediction.total,
          approve: bulkPrediction.willApprove,
          advance: bulkPrediction.willAdvance,
          nextStep: bulkPrediction.nextStep,
          nextRole: commonNextStepLabel(bulkDialog.items),
        })
      : null;

  const reasonTargets = reasonSheet?.items ?? [];
  const isDeciding =
    rejectMutation.isPending || returnMutation.isPending || bulkMutation.isPending;

  const queueToggle = queue ? (
    <ApprovalQueueToggle value={queue} onChange={handleQueueChange} />
  ) : null;

  return (
    <>
      <WorkbenchPageShell
        title={copy.title}
        description={copy.description}
        showHeader={!embedded}
        beforeAwareness={beforeAwareness}
        buckets={buckets}
        bucketsAriaLabel="Tipos de aprobación"
        bucketsLoading={pendingCountsLoading}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <div className="flex flex-wrap items-center gap-2">
              {queueToggle}
              {operatorFilter ? (
                <EmployeeAsyncCombobox
                  id="approvals-operator-filter"
                  className="w-48"
                  value={contextFilters.driverId ?? ""}
                  onChange={handleOperatorFilterChange}
                  placeholder={operatorFilter.placeholder}
                  allowClear
                />
              ) : null}
              <ApprovalFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                status={
                  filters.filters.status as
                    | ApprovalStatus
                    | ""
                    | typeof APPROVAL_STATUS_ALL
                }
                category={filters.filters.category}
                fromDate={filters.filters.fromDate}
                toDate={filters.filters.toDate}
                showCategory={showCategoryFilter}
                activePanelFilterCount={activePanelFilterCount}
                onStatusChange={handleStatusFilterChange}
                onCategoryChange={(value) =>
                  filters.setFilter("category", value === "all" ? "" : value)
                }
                onApplyDateRange={handleApplyDateRange}
                onClearDateRange={handleClearDateRange}
                selfApproved={selfApprovedFilter}
                onSelfApprovedChange={handleSelfApprovedChange}
              />
            </div>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: handleClearFilters,
          hasFilters: hasUserFilters,
        }}
        renderContent={() => {
          if (showLoadError) {
            return (
              <EmptyState
                icon={
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                }
                title={copy.errors.loadTitle}
                description={getErrorMessage(error)}
                cta={{
                  label: copy.errors.retry,
                  onClick: handleRetryLoad,
                }}
              />
            );
          }

          if (!isLoading && items.length === 0) {
            if (waitingOthersCount > 0) {
              return (
                <EmptyState
                  icon={
                    <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                  }
                  title={flowCopy.emptyMine.title}
                  description={flowCopy.emptyMine.description(waitingOthersCount)}
                  cta={{
                    label: flowCopy.emptyMine.cta,
                    onClick: () => handleQueueChange("all"),
                  }}
                />
              );
            }
            return (
              <EmptyState
                icon={
                  <ClipboardCheck className="h-10 w-10 text-muted-foreground" />
                }
                title={emptyStateCopy.title}
                description={emptyStateCopy.description}
              />
            );
          }

          return (
            <div className="space-y-4">
              <BulkActionsBar
                selectedCount={selectedIds.size}
                maxSelection={BULK_MAX}
                canUpdate={canUpdate}
                onApproveSelected={() =>
                  setBulkDialog({
                    phase: "confirm",
                    items: selectedItems,
                    total: selectedItems.length,
                  })
                }
                onReturnSelected={() => openReasonSheet("return", selectedItems)}
                onRejectSelected={() => openReasonSheet("reject", selectedItems)}
                onClearSelection={() => setSelectedIds(new Set())}
              />
              <ApprovalInbox
                items={items}
                isLoading={isLoading}
                selectedIds={selectedIds}
                canUpdate={canUpdate}
                currentUserId={currentUserId}
                selfApprovalPolicy={selfApprovalPolicy}
                onToggleItem={handleToggleItem}
                onToggleAll={handleToggleAll}
                onApprove={(item) => setApproveTarget(item)}
                onReject={(item) => openReasonSheet("reject", [item])}
                onReturn={(item) => openReasonSheet("return", [item])}
                onHistory={(item) => setHistoryTarget(item)}
                maxSelection={BULK_MAX}
              />
            </div>
          );
        }}
        pagination={
          pagination
            ? {
                page: pagination.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit,
              }
            : undefined
        }
        onPageChange={filters.setPage}
      />

      <AlertDialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open && !approveMutation.isPending) setApproveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {approveTargetIsSelf
                ? selfCopy.confirmTitle
                : approveStep
                  ? flowCopy.stepConfirmTitle(approveStep.current, approveStep.total)
                  : copy.actions.approveConfirmTitle(approveTarget?.approvableType)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {approveTargetIsSelf && approveTarget
                ? selfCopy.confirmBody(
                    selfApprovalSubjectForType(approveTarget.approvableType),
                  )
                : approveStep
                  ? flowCopy.stepConfirmBody(approveStep.current, approveStep.total)
                  : approveConfirmDescription}
              <ReapprovalConfirmNote
                approval={approveTarget?.approval}
                type={approveTarget?.approvableType}
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approveMutation.isPending}>
              {copy.actions.cancel}
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {approveTargetIsSelf
                ? selfCopy.confirmAction
                : approveStep
                  ? flowCopy.stepConfirmAction
                  : copy.actions.approveConfirmAction(approveTarget?.approvableType)}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkDialog != null}
        onOpenChange={(open) => {
          if (!open && !bulkMutation.isPending) setBulkDialog(null);
        }}
      >
        <AlertDialogContent>
          {bulkDialog?.phase === "result" ? (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{bulkCopy.resultTitle}</AlertDialogTitle>
                <AlertDialogDescription className="sr-only">
                  {bulkCopy.failuresTitle(
                    bulkDialog.failures?.length ?? 0,
                    bulkDialog.total,
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <BulkDecisionResultPanel
                total={bulkDialog.total}
                counts={
                  bulkDialog.counts ?? {
                    approved: 0,
                    rejected: 0,
                    step_signed: 0,
                    returned: 0,
                  }
                }
                nextStep={bulkDialog.nextStep ?? null}
                nextRole={bulkDialog.nextRole ?? null}
                failures={bulkDialog.failures ?? []}
              />
              <AlertDialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setBulkDialog(null);
                    void refetch();
                  }}
                >
                  {bulkCopy.reload}
                </Button>
                <AlertDialogCancel>{bulkCopy.close}</AlertDialogCancel>
              </AlertDialogFooter>
            </>
          ) : (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {copy.bulk.approveConfirmTitle(approvalType)}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {bulkPredictionText ??
                    copy.bulk.approveConfirmDescription(
                      bulkDialog?.items.length ?? 0,
                      approvalType,
                    )}
                  {ownSelectedCount > 0
                    ? ` ${selfCopy.bulkWarning(ownSelectedCount)}`
                    : null}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkMutation.isPending}>
                  {copy.actions.cancel}
                </AlertDialogCancel>
                <Button
                  type="button"
                  onClick={() => runBulk("approve", bulkDialog?.items ?? [])}
                  disabled={bulkMutation.isPending || (bulkDialog?.items.length ?? 0) === 0}
                >
                  {copy.bulk.approve}
                </Button>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>

      <DecisionReasonSheet
        mode={reasonSheet?.mode ?? "reject"}
        open={reasonSheetOpen}
        onOpenChange={(open) => {
          if (!open && isDeciding) return;
          setReasonSheetOpen(open);
        }}
        item={reasonTargets.length === 1 ? reasonTargets[0] : null}
        bulkItems={reasonTargets.length > 1 ? reasonTargets : undefined}
        isSubmitting={isDeciding}
        onSubmit={handleReasonSubmit}
        type={approvalType}
      />

      <ApprovalHistorySheet
        open={historyTarget != null}
        onOpenChange={(open) => {
          if (!open) setHistoryTarget(null);
        }}
        type={historyTarget?.approvableType ?? null}
        id={historyTarget?.id ?? null}
        subtitle={historyTarget ? approvableFolio(historyTarget) : undefined}
      />
    </>
  );
}
