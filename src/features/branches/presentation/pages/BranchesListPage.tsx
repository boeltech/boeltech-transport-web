/**
 * BranchesListPage — padrón de sucursales (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; estado / tipo / fecha de alta en
 * «Filtros (n)»; Eliminadas = toggle de vista (no badge); Exportar = acción.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Download, Plus, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { formatDate } from "@shared/utils/dateUtils";
import {
  getErrorMessage,
  isApiError,
} from "@shared/api/interceptors/error-handler";
import {
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
  BranchListFilters,
  BranchOverQuotaBanner,
  BranchPlanLimitNotice,
  BranchReconcilePlanSheet,
  BranchTable,
} from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";
import { countBranchPanelFilters } from "../utils/branchListFilters";

const DEFAULT_SORT_FIELD: BranchSortOptions["field"] = "name";
const copy = branchesCopy.list;

export function BranchesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDeleted, setShowDeleted] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);

  const filters = useListingFilters<"status" | "main" | "createdFrom" | "createdTo">({
    filters: {
      status: {},
      main: { paramName: "isMain" },
      createdFrom: { paramName: "created_from" },
      createdTo: { paramName: "created_to" },
    },
    chipLabels: {
      status: (value) =>
        copy.chip.status(BRANCH_STATUS_LABELS[value as BranchStatusType] ?? value),
      main: (value) => copy.chip.type(value === "true"),
    },
  });

  const statusFilter = filters.filters.status as BranchStatusType | "";
  const mainFilter = filters.filters.main;
  const createdFrom = filters.filters.createdFrom;
  const createdTo = filters.filters.createdTo;
  const sortBy =
    (searchParams.get("sortBy") as BranchSortOptions["field"] | null) ??
    DEFAULT_SORT_FIELD;
  const sortOrder = (searchParams.get("sortOrder") || "asc") as "asc" | "desc";
  const activePanelFilterCount = countBranchPanelFilters({
    status: statusFilter,
    isMain: mainFilter,
    createdFrom,
    createdTo,
  });
  const hasPanelFilters = activePanelFilterCount > 0;
  const hasDateFilter = Boolean(createdFrom || createdTo);

  const listParams = useMemo<BranchQueryParams>(
    () => ({
      page: filters.page,
      limit: 10,
      filters: {
        status: statusFilter || undefined,
        isMain: mainFilter ? mainFilter === "true" : undefined,
        search: filters.search || undefined,
        isActive: showDeleted ? false : true,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined,
      },
      sort: {
        field: sortBy,
        direction: sortOrder,
      },
    }),
    [
      createdFrom,
      createdTo,
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
        title: copy.toasts.deleteSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      showBranchErrorToast(error, copy.toasts.deleteError);
    },
  });

  const restoreMutation = useRestoreBranch({
    onSuccess: () => {
      toast({
        title: copy.toasts.restoreSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      showBranchErrorToast(error, copy.toasts.restoreError);
    },
  });

  const branches = data?.data ?? [];
  const canCreate = hasPermission("branches", "create");
  const canDelete = hasPermission("branches", "delete");
  const canExport = hasPermission("branches", "export");
  const canRestore = hasPermission("branches", "update");
  const branchLimitReached = !showDeleted && (data?.meta?.limitReached ?? false);
  const hasListFilters = filters.hasFilters || showDeleted;

  const formatRange = useCallback((from: string, to: string) => {
    if (from && to) {
      return copy.filters.rangeBoth(formatDate(from), formatDate(to));
    }
    if (from) return copy.filters.rangeFrom(formatDate(from));
    if (to) return copy.filters.rangeTo(formatDate(to));
    return "";
  }, []);

  const handleCreate = useCallback(() => navigate("/branches/new"), [navigate]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({
      title: copy.page.refreshSuccess,
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

  const handleShowDeletedToggle = useCallback(() => {
    setShowDeleted((current) => !current);
    filters.setPage(1);
  }, [filters]);

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

  const handleClearAllFilters = useCallback(() => {
    filters.clearAll();
    setShowDeleted(false);
  }, [filters]);

  const handleClearDateFilter = useCallback(() => {
    filters.setFilters({
      createdFrom: "",
      createdTo: "",
    });
  }, [filters]);

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips = [...filters.activeChips];
    if (showDeleted) {
      chips.push({
        id: "deleted-view",
        label: copy.showDeleted.chip,
        onRemove: () => setShowDeleted(false),
      });
    }
    if (hasDateFilter) {
      chips.push({
        id: "date",
        label: copy.chip.dates(formatRange(createdFrom, createdTo)),
        onRemove: handleClearDateFilter,
      });
    }
    return chips;
  }, [
    createdFrom,
    createdTo,
    filters.activeChips,
    formatRange,
    handleClearDateFilter,
    hasDateFilter,
    showDeleted,
  ]);

  const disabledTitle = branchLimitReached
    ? typeof data?.meta?.maxBranches === "number"
      ? branchesCopy.limitReached.descriptionWithLimit(data.meta.maxBranches)
      : branchesCopy.limitReached.createDisabled
    : undefined;

  return (
    <>
      <ListPageShell
        title={copy.page.title}
        description={copy.page.description}
        beforeToolbar={
          <div className="space-y-4">
            <BranchCapacityBanner meta={data?.meta} />
            <BranchOverQuotaBanner
              meta={data?.meta}
              canReconcile={canDelete && !showDeleted}
              onReconcile={() => setReconcileOpen(true)}
            />
            <BranchPlanLimitNotice meta={data?.meta} />
          </div>
        }
        primaryAction={{
          label: copy.actions.create,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate && !showDeleted,
          disabled: branchLimitReached,
          disabledTitle,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <>
              {canDelete ? (
                <Button
                  type="button"
                  variant={showDeleted ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleShowDeletedToggle}
                  aria-pressed={showDeleted}
                  aria-label={copy.showDeleted.aria}
                >
                  {copy.showDeleted.label}
                </Button>
              ) : null}
              <BranchListFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                status={statusFilter}
                isMain={mainFilter}
                createdFrom={createdFrom}
                createdTo={createdTo}
                activePanelFilterCount={activePanelFilterCount}
                onStatusChange={(value) => filters.setFilter("status", value)}
                onTypeChange={(value) => filters.setFilter("main", value)}
                onCreatedFromChange={(value) =>
                  filters.setFilter("createdFrom", value)
                }
                onCreatedToChange={(value) =>
                  filters.setFilter("createdTo", value)
                }
              />
            </>
          ),
          extraActions: canExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting}
              onClick={handleExport}
              leftIcon={<Download className="h-4 w-4" />}
              aria-label={copy.export.aria}
            >
              {isExporting ? copy.export.exporting : copy.export.label}
            </Button>
          ) : null,
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: handleClearAllFilters,
          hasFilters: hasListFilters,
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
        entityLabelPlural={copy.entityLabelPlural}
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
          title: copy.empty.title,
          description: hasListFilters
            ? copy.empty.descriptionFiltered
            : copy.empty.descriptionClear,
          cta:
            canCreate && !showDeleted
              ? {
                  label: branchLimitReached
                    ? branchesCopy.limitReached.createDisabled
                    : copy.actions.create,
                  icon: <Building2 className="h-4 w-4" />,
                  onClick: branchLimitReached ? () => undefined : handleCreate,
                }
              : undefined,
          secondaryCta: hasListFilters
            ? {
                label: copy.actions.clearFilters,
                onClick: handleClearAllFilters,
                variant: "outline",
              }
            : undefined,
        }}
      />
      <BranchReconcilePlanSheet
        open={reconcileOpen}
        onOpenChange={setReconcileOpen}
      />
    </>
  );
}
