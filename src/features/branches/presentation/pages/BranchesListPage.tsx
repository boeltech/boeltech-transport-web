import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Download, Plus, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import {
  BranchStatus,
  BRANCH_STATUS_LABELS,
  type BranchQueryParams,
  type BranchSortOptions,
  type BranchStatusType,
} from "../../domain";
import {
  useBranches,
  useDeleteBranch,
  useExportBranches,
  useRestoreBranch,
} from "../../application";
import {
  BranchCapacityBanner,
  BranchCard,
  BranchCardSkeleton,
  BranchOverQuotaBanner,
  BranchReconcilePlanSheet,
  BranchTable,
} from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

const DEFAULT_SORT_FIELD: BranchSortOptions["field"] = "name";

export function BranchesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDeleted, setShowDeleted] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const filters = useListingFilters<"status" | "main">({
    filters: {
      status: {},
      main: { paramName: "isMain" },
    },
    chipLabels: {
      status: (value) =>
        branchesCopy.list.filters.statusChip(
          BRANCH_STATUS_LABELS[value as BranchStatusType] ?? value,
        ),
      main: (value) =>
        branchesCopy.list.filters.typeChip(value === "true"),
    },
  });

  const statusFilter = filters.filters.status as BranchStatusType | "";
  const mainFilter = filters.filters.main;
  const sortBy =
    (searchParams.get("sortBy") as BranchSortOptions["field"] | null) ??
    DEFAULT_SORT_FIELD;
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";

  const listParams = useMemo<BranchQueryParams>(
    () => ({
      page: filters.page,
      limit: 10,
      filters: {
        status: statusFilter || undefined,
        isMain: mainFilter ? mainFilter === "true" : undefined,
        search: filters.search || undefined,
        isActive: showDeleted ? false : true,
      },
      sort: {
        field: sortBy,
        direction: sortOrder,
      },
    }),
    [
      filters.page,
      filters.search,
      mainFilter,
      showDeleted,
      sortBy,
      sortOrder,
      statusFilter,
    ],
  );

  const { data, isLoading, isFetching, refetch } = useBranches(listParams);
  const { exportBranches, isExporting } = useExportBranches();

  const showBranchErrorToast = useCallback(
    (error: Error, fallbackTitle: string) => {
      const known = getBranchMutationErrorToast(error);
      if (known) {
        toast({
          title: known.title,
          description: known.description,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: fallbackTitle,
        description: isApiError(error)
          ? error.getDetailedMessage(3)
          : getErrorMessage(error),
        variant: "destructive",
      });
    },
    [toast],
  );

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.list.toasts.deleteSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      showBranchErrorToast(error, branchesCopy.list.toasts.deleteError);
    },
  });

  const restoreMutation = useRestoreBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.list.toasts.restoreSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      showBranchErrorToast(error, branchesCopy.list.toasts.restoreError);
    },
  });

  const branches = data?.data ?? [];
  const canCreate = hasPermission("branches", "create");
  const canDelete = hasPermission("branches", "delete");
  const canExport = hasPermission("branches", "export");
  const canRestore = hasPermission("branches", "update");
  const branchLimitReached = !showDeleted && (data?.meta?.limitReached ?? false);

  const handleCreate = useCallback(() => navigate("/branches/new"), [navigate]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: branchesCopy.list.refreshSuccess,
      variant: "success",
    });
  }, [refetch, toast]);

  const handleDelete = useCallback(
    (id: string) => {
      if (!canDelete || showDeleted) return;
      deleteMutation.mutate(id);
    },
    [canDelete, deleteMutation, showDeleted],
  );

  const handleRestore = useCallback(
    (id: string) => {
      if (!canRestore || !showDeleted) return;
      restoreMutation.mutate(id);
    },
    [canRestore, restoreMutation, showDeleted],
  );

  const handleExport = useCallback(() => {
    void exportBranches(listParams);
  }, [exportBranches, listParams]);

  const handleSortChange = useCallback(
    (field: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        const currentSortBy = params.get("sortBy") || DEFAULT_SORT_FIELD;
        const currentOrder = params.get("sortOrder") || "asc";
        if (currentSortBy === field) {
          params.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
        } else {
          params.set("sortBy", field);
          params.set("sortOrder", "asc");
        }
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const activeFilterChips = useMemo(() => {
    const chips = [...filters.activeChips];
    if (showDeleted) {
      chips.push({
        key: "deleted-view",
        label: branchesCopy.list.showDeleted.chip,
        onRemove: () => setShowDeleted(false),
      });
    }
    return chips;
  }, [filters.activeChips, showDeleted]);

  return (
    <>
    <ListPageShell
      title={branchesCopy.list.title}
      description={branchesCopy.list.description}
      beforeToolbar={
        <>
          <BranchOverQuotaBanner
            meta={data?.meta}
            canReconcile={canDelete && !showDeleted}
            onReconcile={() => setReconcileOpen(true)}
          />
          <BranchCapacityBanner meta={data?.meta} />
        </>
      }
      primaryAction={{
        label: branchesCopy.list.primaryAction,
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate && !showDeleted,
        disabled: branchLimitReached,
        disabledTitle: branchesCopy.limitReached.createDisabled,
      }}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: branchesCopy.list.searchPlaceholder,
        },
        filters: (
          <>
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) => filters.setFilter("status", value)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={branchesCopy.list.filters.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{branchesCopy.list.filters.statusAll}</SelectItem>
                <SelectItem value={BranchStatus.ACTIVE}>
                  {BRANCH_STATUS_LABELS[BranchStatus.ACTIVE]}
                </SelectItem>
                <SelectItem value={BranchStatus.INACTIVE}>
                  {BRANCH_STATUS_LABELS[BranchStatus.INACTIVE]}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={mainFilter || "all"}
              onValueChange={(value) => filters.setFilter("main", value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder={branchesCopy.list.filters.type} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{branchesCopy.list.filters.typeAll}</SelectItem>
                <SelectItem value="true">{branchesCopy.list.filters.typeMain}</SelectItem>
                <SelectItem value="false">{branchesCopy.list.filters.typeSecondary}</SelectItem>
              </SelectContent>
            </Select>
            {canDelete ? (
              <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                <Checkbox
                  id="show-deleted-branches"
                  checked={showDeleted}
                  onCheckedChange={(checked) => {
                    setShowDeleted(checked === true);
                    filters.setPage(1);
                  }}
                />
                <Label
                  htmlFor="show-deleted-branches"
                  className="cursor-pointer text-sm font-normal"
                >
                  {branchesCopy.list.showDeleted.label}
                </Label>
              </div>
            ) : null}
          </>
        ),
        extraActions: canExport ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isExporting}
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting
              ? branchesCopy.list.export.exporting
              : branchesCopy.list.export.label}
          </Button>
        ) : null,
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips,
        onClearFilters: () => {
          filters.clearAll();
          setShowDeleted(false);
        },
        hasFilters: filters.hasFilters || showDeleted,
        viewMode: filters.viewModeProps,
      }}
      isLoading={isLoading}
      items={branches}
      pagination={
        data?.pagination
          ? {
              page: filters.page,
              totalPages: data.pagination.totalPages,
              total: data.pagination.total,
              limit: data.pagination.limit,
            }
          : undefined
      }
      onPageChange={filters.setPage}
      entityLabelPlural={branchesCopy.list.entityLabelPlural}
      renderTable={() => (
        <BranchTable
          branches={branches}
          isLoading={isLoading}
          showDeleted={showDeleted}
          onDelete={canDelete && !showDeleted ? handleDelete : undefined}
          onRestore={canRestore && showDeleted ? handleRestore : undefined}
          isDeleting={deleteMutation.isPending}
          isRestoring={restoreMutation.isPending}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSortChange}
        />
      )}
      renderCards={() =>
        branches.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            showDeleted={showDeleted}
            onDelete={canDelete && !showDeleted ? handleDelete : undefined}
            onRestore={canRestore && showDeleted ? handleRestore : undefined}
            isDeleting={deleteMutation.isPending}
            isRestoring={restoreMutation.isPending}
          />
        ))
      }
      renderCardSkeleton={() => <BranchCardSkeleton />}
      emptyState={{
        icon: <Search className="h-10 w-10 text-muted-foreground" />,
        title: branchesCopy.list.empty.title,
        description: filters.hasFilters || showDeleted
          ? branchesCopy.list.empty.descriptionFiltered
          : branchesCopy.list.empty.descriptionDefault,
        cta: canCreate && !showDeleted
          ? {
              label: branchLimitReached
                ? branchesCopy.limitReached.createDisabled
                : branchesCopy.list.primaryAction,
              icon: <Building2 className="h-4 w-4" />,
              onClick: branchLimitReached ? () => undefined : handleCreate,
            }
          : undefined,
        secondaryCta: filters.hasFilters || showDeleted
          ? {
              label: branchesCopy.list.empty.clearFilters,
              onClick: () => {
                filters.clearAll();
                setShowDeleted(false);
              },
              variant: "outline",
            }
          : undefined,
      }}
    />
    <BranchReconcilePlanSheet open={reconcileOpen} onOpenChange={setReconcileOpen} />
  </>
  );
}
