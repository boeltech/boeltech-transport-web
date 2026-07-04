import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ClipboardCheck, Info } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  AlertDialog,
  AlertDialogAction,
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
  useApprovals,
  useApproveApprovable,
  useBulkApprovals,
  useRejectApprovable,
} from "../../application";
import {
  APPROVAL_STATUS_LABELS,
  DEFAULT_APPROVAL_TYPE,
  isApprovableActionable,
  type ApprovableItem,
  type ApprovalStatus,
  type BulkOperation,
} from "../../domain";
import {
  ApprovalFilters,
  ApprovalInbox,
  BulkActionsBar,
  RejectExpenseSheet,
} from "../components";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  APPROVAL_STATUS_ALL,
  buildApprovalContextChips,
  buildApprovalEmptyState,
  hasApprovalUserFilters,
  resolveTripFilterLabel,
  type ApprovalContextFilterParams,
} from "../utils/approvalInboxFilters";
import { formatApprovableApproveConfirmDescription } from "../utils/approvalConfirmHelpers";
import { formatListingDateRangeLabel } from "@shared/ui/listing";

const copy = approvalsCopy.inbox;
const BULK_MAX = 50;
const PAGE_SIZE = 25;

function resolveListStatus(status: string): ApprovalStatus | undefined {
  if (!status || status === APPROVAL_STATUS_ALL) return undefined;
  return status as ApprovalStatus;
}

export function ApprovalInboxPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission("finance_approvals", "update");
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsAppliedRef = useRef(false);

  useEffect(() => {
    if (defaultsAppliedRef.current) return;
    defaultsAppliedRef.current = true;

    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      let changed = false;
      if (!params.get("type")) {
        params.set("type", DEFAULT_APPROVAL_TYPE);
        changed = true;
      }
      if (!params.get("status")) {
        params.set("status", "pending");
        changed = true;
      }
      return changed ? params : prev;
    }, { replace: true });
  }, [setSearchParams]);

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
          APPROVAL_STATUS_LABELS[value as ApprovalStatus] ?? value,
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

  const approvalType =
    (searchParams.get("type") as typeof DEFAULT_APPROVAL_TYPE) ||
    DEFAULT_APPROVAL_TYPE;

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
      status: resolveListStatus(filters.filters.status),
      category: filters.filters.category || undefined,
      tripId: contextFilters.tripId || undefined,
      driverId: contextFilters.driverId || undefined,
      vehicleId: contextFilters.vehicleId || undefined,
      fromDate: filters.filters.fromDate || undefined,
      toDate: filters.filters.toDate || undefined,
      search: filters.search || undefined,
      page: filters.page,
      pageSize: PAGE_SIZE,
    }),
    [
      approvalType,
      contextFilters,
      filters.filters,
      filters.page,
      filters.search,
    ],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useApprovals(listFilters);

  const showLoadError = isError && !isLoading;
  const items: ApprovableItem[] = showLoadError ? [] : (data?.data ?? []);
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

  const hasUserFilters = useMemo(
    () =>
      hasApprovalUserFilters({
        search: filters.search,
        status: filters.filters.status,
        category: filters.filters.category,
        fromDate: filters.filters.fromDate,
        toDate: filters.filters.toDate,
        context: contextFilters,
      }),
    [contextFilters, filters.filters, filters.search],
  );

  const emptyStateCopy = useMemo(
    () => buildApprovalEmptyState(hasUserFilters, tripFilterLabel),
    [hasUserFilters, tripFilterLabel],
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

  const activeFilterChips = useMemo(() => {
    const baseChips = filters.activeChips.filter(
      (chip) =>
        (chip.id !== "status" || filters.filters.status !== APPROVAL_STATUS_ALL) &&
        chip.id !== "fromDate" &&
        chip.id !== "toDate",
    );

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
      ...buildApprovalContextChips(
        contextFilters,
        tripFilterLabel,
        removeContextFilter,
      ),
    ];
  }, [
    contextFilters,
    filters,
    fromDate,
    hasDateFilter,
    removeContextFilter,
    toDate,
    tripFilterLabel,
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
    setSearchParams(() => {
      const params = new URLSearchParams();
      params.set("type", DEFAULT_APPROVAL_TYPE);
      params.set("status", "pending");
      return params;
    });
  }, [filters, setSearchParams]);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [approveTarget, setApproveTarget] = useState<ApprovableItem | null>(null);
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [rejectSheetOpen, setRejectSheetOpen] = useState(false);
  const [rejectTargets, setRejectTargets] = useState<ApprovableItem[]>([]);

  const handleRetryLoad = useCallback(() => {
    void refetch();
  }, [refetch]);

  const approveConfirmDescription = useMemo(
    () => formatApprovableApproveConfirmDescription(approveTarget),
    [approveTarget],
  );

  const beforeToolbar = useMemo(() => {
    if (!canUpdate) {
      return (
        <DetailAlertCard
          severity="info"
          icon={<Info className="h-4 w-4" />}
          title={copy.readOnly.title}
          items={[{ text: copy.readOnly.description }]}
        />
      );
    }
    return undefined;
  }, [canUpdate]);

  const listEmptyState = useMemo(() => {
    if (showLoadError) {
      return {
        icon: <ClipboardCheck className="h-10 w-10 text-muted-foreground" />,
        title: copy.errors.loadTitle,
        description: getErrorMessage(error),
        cta: {
          label: copy.errors.retry,
          onClick: handleRetryLoad,
        },
      };
    }

    return {
      icon: <ClipboardCheck className="h-10 w-10 text-muted-foreground" />,
      title: emptyStateCopy.title,
      description: emptyStateCopy.description,
    };
  }, [emptyStateCopy, error, handleRetryLoad, showLoadError]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds],
  );

  const approveMutation = useApproveApprovable({
    onSuccess: (result) => {
      toast({
        title: result.message ?? copy.toasts.approveSuccess,
        variant: "success",
      });
      setApproveTarget(null);
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast({
        title: copy.toasts.approveError,
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useRejectApprovable({
    onSuccess: (result) => {
      toast({
        title: result.message ?? copy.toasts.rejectSuccess,
        variant: "success",
      });
      setRejectSheetOpen(false);
      setRejectTargets([]);
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast({
        title: copy.toasts.rejectError,
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const bulkMutation = useBulkApprovals({
    onSuccess: (result) => {
      const total =
        result.data.successes.length + result.data.failures.length;
      toast({
        title: copy.toasts.bulkSuccess(result.data.successes.length, total),
        description:
          result.data.failures.length > 0
            ? copy.toasts.bulkPartial(result.data.failures.length)
            : undefined,
        variant: result.data.failures.length > 0 ? "default" : "success",
      });
      setBulkApproveOpen(false);
      setSelectedIds(new Set());
    },
    onError: (err) => {
      toast({
        title: copy.toasts.approveError,
        description: getErrorMessage(err),
        variant: "destructive",
      });
    },
  });

  const handleToggleItem = useCallback(
    (item: ApprovableItem, checked: boolean) => {
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
    [toast],
  );

  const handleToggleAll = useCallback(
    (checked: boolean) => {
      if (!checked) {
        setSelectedIds(new Set());
        return;
      }
      const actionable = items.filter(isApprovableActionable).slice(0, BULK_MAX);
      setSelectedIds(new Set(actionable.map((item) => item.id)));
    },
    [items],
  );

  const handleApproveConfirm = useCallback(() => {
    if (!approveTarget) return;
    approveMutation.mutate({
      type: approveTarget.approvableType,
      id: approveTarget.id,
    });
  }, [approveMutation, approveTarget]);

  const handleBulkApproveConfirm = useCallback(() => {
    const operations: BulkOperation[] = selectedItems.map((item) => ({
      type: item.approvableType,
      id: item.id,
      action: "approve",
    }));
    bulkMutation.mutate(operations);
  }, [bulkMutation, selectedItems]);

  const handleRejectSubmit = useCallback(
    (reason: string, targets: ApprovableItem[]) => {
      if (targets.length === 1) {
        rejectMutation.mutate({
          type: targets[0].approvableType,
          id: targets[0].id,
          reason,
        });
        return;
      }

      const operations: BulkOperation[] = targets.map((item) => ({
        type: item.approvableType,
        id: item.id,
        action: "reject",
        reason,
      }));
      bulkMutation.mutate(operations, {
        onSuccess: (result) => {
          toast({
            title: copy.toasts.bulkSuccess(
              result.data.successes.length,
              operations.length,
            ),
            description:
              result.data.failures.length > 0
                ? copy.toasts.bulkPartial(result.data.failures.length)
                : undefined,
            variant: result.data.failures.length > 0 ? "default" : "success",
          });
          setRejectSheetOpen(false);
          setRejectTargets([]);
          setSelectedIds(new Set());
        },
      });
    },
    [bulkMutation, rejectMutation, toast],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  return (
    <>
      <ListPageShell
        title={copy.title}
        description={copy.description}
        beforeToolbar={beforeToolbar}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <ApprovalFilters
              status={filters.filters.status as ApprovalStatus | "" | typeof APPROVAL_STATUS_ALL}
              category={filters.filters.category}
              fromDate={filters.filters.fromDate}
              toDate={filters.filters.toDate}
              onStatusChange={handleStatusFilterChange}
              onCategoryChange={(value) =>
                filters.setFilter("category", value === "all" ? "" : value)
              }
              onApplyDateRange={handleApplyDateRange}
              onClearDateRange={handleClearDateRange}
            />
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: handleClearFilters,
          hasFilters: hasUserFilters,
        }}
        items={items}
        isLoading={isLoading}
        entityLabelPlural="aprobaciones"
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
        emptyState={listEmptyState}
        renderTable={() => (
          showLoadError ? null : (
          <div className="space-y-4">
            <BulkActionsBar
              selectedCount={selectedIds.size}
              maxSelection={BULK_MAX}
              canUpdate={canUpdate}
              onApproveSelected={() => setBulkApproveOpen(true)}
              onRejectSelected={() => {
                setRejectTargets(selectedItems);
                setRejectSheetOpen(true);
              }}
              onClearSelection={() => setSelectedIds(new Set())}
            />
            <ApprovalInbox
              items={items}
              isLoading={isLoading}
              selectedIds={selectedIds}
              canUpdate={canUpdate}
              onToggleItem={handleToggleItem}
              onToggleAll={handleToggleAll}
              onApprove={(item) => setApproveTarget(item)}
              onReject={(item) => {
                setRejectTargets([item]);
                setRejectSheetOpen(true);
              }}
              maxSelection={BULK_MAX}
            />
          </div>
          )
        )}
      />

      <AlertDialog
        open={approveTarget != null}
        onOpenChange={(open) => {
          if (!open) setApproveTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.actions.approveConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {approveConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApproveConfirm}
              disabled={approveMutation.isPending}
            >
              {copy.actions.approveConfirmAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.bulk.approveConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.bulk.approveConfirmDescription(selectedItems.length)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkApproveConfirm}
              disabled={bulkMutation.isPending}
            >
              {copy.bulk.approve}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RejectExpenseSheet
        open={rejectSheetOpen}
        onOpenChange={setRejectSheetOpen}
        item={rejectTargets.length === 1 ? rejectTargets[0] : null}
        bulkItems={rejectTargets.length > 1 ? rejectTargets : undefined}
        isSubmitting={rejectMutation.isPending || bulkMutation.isPending}
        onSubmit={handleRejectSubmit}
      />
    </>
  );
}
