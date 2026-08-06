import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  Download,
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { formatDate } from "@shared/utils/dateUtils";
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
  BranchPlanLimitNotice,
  BranchReconcilePlanSheet,
  BranchTable,
} from "../components";
import { branchesCopy } from "../copy/branchesCopy";
import { getBranchMutationErrorToast } from "../utils/branchMutationErrors";

const DEFAULT_SORT_FIELD: BranchSortOptions["field"] = "name";

type DateDraftState = {
  createdFrom: string;
  createdTo: string;
};

const EMPTY_DATE_DRAFT: DateDraftState = {
  createdFrom: "",
  createdTo: "",
};

export function BranchesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showDeleted, setShowDeleted] = useState(false);
  const [reconcileOpen, setReconcileOpen] = useState(false);
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState<DateDraftState>(EMPTY_DATE_DRAFT);

  const filters = useListingFilters<"status" | "main" | "createdFrom" | "createdTo">({
    filters: {
      status: {},
      main: { paramName: "isMain" },
      createdFrom: { paramName: "created_from" },
      createdTo: { paramName: "created_to" },
    },
    chipLabels: {
      status: (value) =>
        branchesCopy.list.filters.statusChip(
          BRANCH_STATUS_LABELS[value as BranchStatusType] ?? value,
        ),
      main: (value) => branchesCopy.list.filters.typeChip(value === "true"),
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

  const syncDateDraftFromUrl = useCallback(() => {
    setDateDraft({
      createdFrom,
      createdTo,
    });
  }, [createdFrom, createdTo]);

  const handleDatePopoverOpenChange = useCallback(
    (open: boolean) => {
      setIsDateFilterOpen(open);
      if (open) {
        syncDateDraftFromUrl();
      }
    },
    [syncDateDraftFromUrl],
  );

  const dateDraftMatchesApplied = useMemo(
    () =>
      dateDraft.createdFrom === createdFrom &&
      dateDraft.createdTo === createdTo,
    [dateDraft, createdFrom, createdTo],
  );

  const handleApplyDateFilters = useCallback(() => {
    filters.setFilters({
      createdFrom: dateDraft.createdFrom,
      createdTo: dateDraft.createdTo,
    });
    setIsDateFilterOpen(false);
  }, [filters, dateDraft]);

  const handleClearDateFilter = useCallback(() => {
    filters.setFilters({
      createdFrom: "",
      createdTo: "",
    });
    setDateDraft({ ...EMPTY_DATE_DRAFT });
    setIsDateFilterOpen(false);
  }, [filters]);

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
  const hasDateFilter = Boolean(createdFrom || createdTo);
  const hasListFilters = filters.hasFilters || showDeleted || hasDateFilter;

  const formatRange = useCallback(
    (from: string, to: string) => {
      if (from && to) {
        return branchesCopy.list.filters.rangeBoth(formatDate(from), formatDate(to));
      }
      if (from) return branchesCopy.list.filters.rangeFrom(formatDate(from));
      if (to) return branchesCopy.list.filters.rangeTo(formatDate(to));
      return "";
    },
    [],
  );

  const dateFilterChipLabel = hasDateFilter
    ? branchesCopy.list.filters.chipDates(
        branchesCopy.list.filters.createdPrefix(
          formatRange(createdFrom, createdTo),
        ),
      )
    : "";

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

  const handleClearAllFilters = useCallback(() => {
    filters.clearAll();
    setShowDeleted(false);
    setDateDraft({ ...EMPTY_DATE_DRAFT });
  }, [filters]);

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    const chips = [...filters.activeChips];
    if (showDeleted) {
      chips.push({
        id: "deleted-view",
        label: branchesCopy.list.showDeleted.chip,
        onRemove: () => setShowDeleted(false),
      });
    }
    if (hasDateFilter) {
      chips.push({
        id: "date",
        label: dateFilterChipLabel,
        onRemove: handleClearDateFilter,
      });
    }
    return chips;
  }, [
    dateFilterChipLabel,
    filters.activeChips,
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
        title={branchesCopy.list.title}
        description={branchesCopy.list.description}
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
          label: branchesCopy.list.primaryAction,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate && !showDeleted,
          disabled: branchLimitReached,
          disabledTitle,
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
                <SelectTrigger className="w-44">
                  <SelectValue placeholder={branchesCopy.list.filters.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {branchesCopy.list.filters.statusAll}
                  </SelectItem>
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
                  <SelectItem value="all">
                    {branchesCopy.list.filters.typeAll}
                  </SelectItem>
                  <SelectItem value="true">
                    {branchesCopy.list.filters.typeMain}
                  </SelectItem>
                  <SelectItem value="false">
                    {branchesCopy.list.filters.typeSecondary}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Popover
                open={isDateFilterOpen}
                onOpenChange={handleDatePopoverOpenChange}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={hasDateFilter ? "secondary" : "outline"}
                  >
                    <SlidersHorizontal className="mr-2 h-4 w-4" />
                    {branchesCopy.list.filters.more}
                    {hasDateFilter ? (
                      <span className="ml-1.5 text-xs tabular-nums text-muted-foreground">
                        ·
                      </span>
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[22rem] p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Filter className="h-4 w-4" />
                      {branchesCopy.list.filters.moreHeading}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {branchesCopy.list.filters.createdHeading}
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="branches-created-from">
                            {branchesCopy.list.filters.from}
                          </Label>
                          <Input
                            id="branches-created-from"
                            type="date"
                            value={dateDraft.createdFrom}
                            max={dateDraft.createdTo || undefined}
                            onChange={(e) =>
                              setDateDraft((d) => ({
                                ...d,
                                createdFrom: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="branches-created-to">
                            {branchesCopy.list.filters.to}
                          </Label>
                          <Input
                            id="branches-created-to"
                            type="date"
                            value={dateDraft.createdTo}
                            min={dateDraft.createdFrom || undefined}
                            onChange={(e) =>
                              setDateDraft((d) => ({
                                ...d,
                                createdTo: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                      {hasDateFilter ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-start text-muted-foreground sm:order-1"
                          onClick={handleClearDateFilter}
                        >
                          <X className="mr-2 h-4 w-4" />
                          {branchesCopy.list.filters.clearDates}
                        </Button>
                      ) : (
                        <span className="hidden sm:order-1 sm:block" />
                      )}
                      <div className="flex w-full gap-2 sm:order-2 sm:w-auto sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={() => setIsDateFilterOpen(false)}
                        >
                          {branchesCopy.list.filters.cancel}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          disabled={dateDraftMatchesApplied}
                          onClick={handleApplyDateFilters}
                        >
                          {branchesCopy.list.filters.apply}
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

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
          title: hasListFilters
            ? branchesCopy.list.empty.filteredTitle
            : branchesCopy.list.empty.title,
          description: hasListFilters
            ? branchesCopy.list.empty.descriptionFiltered
            : branchesCopy.list.empty.descriptionDefault,
          cta:
            canCreate && !showDeleted
              ? {
                  label: branchLimitReached
                    ? branchesCopy.limitReached.createDisabled
                    : branchesCopy.list.primaryAction,
                  icon: <Building2 className="h-4 w-4" />,
                  onClick: branchLimitReached ? () => undefined : handleCreate,
                }
              : undefined,
          secondaryCta: hasListFilters
            ? {
                label: branchesCopy.list.empty.clearFilters,
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
