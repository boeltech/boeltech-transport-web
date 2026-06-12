import { useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Building2, Plus, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import { usePermissions } from "@shared/permissions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  BranchStatus,
  BRANCH_STATUS_LABELS,
  type BranchSortOptions,
  type BranchStatusType,
} from "../../domain";
import { useBranches, useDeleteBranch } from "../../application";
import { BranchCard, BranchCardSkeleton, BranchTable } from "../components";
import { branchesCopy } from "../copy/branchesCopy";

const DEFAULT_SORT_FIELD: BranchSortOptions["field"] = "name";

export function BranchesListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
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

  const { data, isLoading, isFetching, refetch } = useBranches({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      isMain: mainFilter ? mainFilter === "true" : undefined,
      search: filters.search || undefined,
      isActive: true,
    },
    sort: {
      field: sortBy,
      direction: sortOrder,
    },
  });

  const deleteMutation = useDeleteBranch({
    onSuccess: () => {
      toast({
        title: branchesCopy.list.toasts.deleteSuccess,
        variant: "success",
      });
      void refetch();
    },
    onError: (error) => {
      toast({
        title: branchesCopy.list.toasts.deleteError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const branches = data?.data ?? [];
  const canCreate = hasPermission("branches", "create");
  const canDelete = hasPermission("branches", "delete");

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
      if (!canDelete) return;
      deleteMutation.mutate(id);
    },
    [canDelete, deleteMutation],
  );

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

  return (
    <ListPageShell
      title={branchesCopy.list.title}
      description={branchesCopy.list.description}
      primaryAction={{
        label: branchesCopy.list.primaryAction,
        icon: <Plus className="h-4 w-4" />,
        onClick: handleCreate,
        visible: canCreate,
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
          </>
        ),
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips,
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters,
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
          onDelete={canDelete ? handleDelete : undefined}
          isDeleting={deleteMutation.isPending}
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
            onDelete={canDelete ? handleDelete : undefined}
            isDeleting={deleteMutation.isPending}
          />
        ))
      }
      renderCardSkeleton={() => <BranchCardSkeleton />}
      emptyState={{
        icon: <Search className="h-10 w-10 text-muted-foreground" />,
        title: branchesCopy.list.empty.title,
        description: filters.hasFilters
          ? branchesCopy.list.empty.descriptionFiltered
          : branchesCopy.list.empty.descriptionDefault,
        cta: canCreate
          ? {
              label: branchesCopy.list.primaryAction,
              icon: <Building2 className="h-4 w-4" />,
              onClick: handleCreate,
            }
          : undefined,
        secondaryCta: filters.hasFilters
          ? {
              label: branchesCopy.list.empty.clearFilters,
              onClick: filters.clearAll,
              variant: "outline",
            }
          : undefined,
      }}
    />
  );
}
