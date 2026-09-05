import { useCallback, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { BranchStatus, useBranches } from "@features/branches";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import {
  useCorridorBranchNameMap,
  useCorridorDuplicateCatalog,
  useCorridorTariffs,
} from "../../application/hooks";
import { compensationCopy } from "../copy/compensationCopy";
import { CorridorTariffSheet, CorridorTariffsTable } from "../components";
import type { RouteCorridorTariff } from "../../domain/entities";
import { buildDuplicateCorridorIndex } from "../utils/corridorMatchKey";
import { useRegisterCompensationHubCreateAction } from "../hooks/useRegisterCompensationHubCreateAction";

const copy = compensationCopy.corridors;
const LIST_PAGE_SIZE = 20;

function parseActiveFilter(raw: string): boolean | undefined {
  if (raw === "active") return true;
  if (raw === "inactive") return false;
  return undefined;
}

export function CorridorTariffsListPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "update");
  const canManageCorridors =
    hasPermission("settlements", "update") ||
    hasPermission("settlements", "delete");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCorridor, setEditingCorridor] =
    useState<RouteCorridorTariff | null>(null);

  const filters = useListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) =>
        copy.filters.chipLabel(
          value === "active"
            ? copy.filters.active
            : value === "inactive"
              ? copy.filters.inactive
              : value,
        ),
    },
  });

  const statusFilter = filters.filters.status;
  const isActive = parseActiveFilter(statusFilter);

  const { data: branchesData } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
  });

  const { data, isLoading, isFetching, refetch } = useCorridorTariffs({
    search: filters.search.trim() || undefined,
    isActive,
    page: filters.page,
    pageSize: LIST_PAGE_SIZE,
  });

  const corridors = useMemo(() => data?.data ?? [], [data?.data]);

  const branchNameMap = useCorridorBranchNameMap(
    corridors,
    branchesData?.data ?? [],
  );

  const { data: duplicateCatalog = [] } = useCorridorDuplicateCatalog();

  const duplicateIndex = useMemo(
    () => buildDuplicateCorridorIndex(duplicateCatalog),
    [duplicateCatalog],
  );

  const hasDuplicates = duplicateIndex.duplicateIds.size > 0;

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: compensationCopy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const openCreate = useCallback(() => {
    setEditingCorridor(null);
    setSheetOpen(true);
  }, []);

  const hubCreateAction = useMemo(
    () =>
      canCreate
        ? { label: copy.create, onClick: openCreate }
        : null,
    [canCreate, openCreate],
  );
  useRegisterCompensationHubCreateAction(hubCreateAction);

  const openEdit = (corridor: RouteCorridorTariff) => {
    setEditingCorridor(corridor);
    setSheetOpen(true);
  };

  return (
    <>
      <ListPageShell
        showHeader={false}
        title={copy.title}
        beforeToolbar={
          <>
            <p className="mb-4 text-sm text-muted-foreground">{copy.description}</p>
            {hasDuplicates ? (
              <AlertWithIcon variant="warning">{copy.duplicateBanner}</AlertWithIcon>
            ) : null}
          </>
        }
        items={corridors}
        isLoading={isLoading}
        entityLabelPlural="rutas con tarifa fija"
        pagination={
          data?.pagination
            ? {
                page: data.pagination.page,
                totalPages: data.pagination.totalPages,
                total: data.pagination.total,
                limit: data.pagination.limit,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        emptyState={{
          icon: <Plus className="h-8 w-8 text-muted-foreground" />,
          title: copy.emptyTitle,
          description: copy.emptyDescription,
          cta: canCreate ? { label: copy.create, onClick: openCreate } : undefined,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.searchPlaceholder,
          },
          filters: (
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) =>
                filters.setFilter("status", value === "all" ? "" : value)
              }
            >
              <SelectTrigger
                className="w-44"
                aria-label={copy.filters.statusPlaceholder}
              >
                <SelectValue placeholder={copy.filters.statusPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.filters.all}</SelectItem>
                <SelectItem value="active">{copy.filters.active}</SelectItem>
                <SelectItem value="inactive">{copy.filters.inactive}</SelectItem>
              </SelectContent>
            </Select>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
        }}
        renderTable={() => (
          <CorridorTariffsTable
            corridors={corridors}
            isLoading={isLoading}
            branchNameMap={branchNameMap}
            duplicateIds={duplicateIndex.duplicateIds}
            showActions={canManageCorridors}
            onEdit={canCreate ? openEdit : undefined}
            onActionComplete={() => {
              void refetch();
            }}
          />
        )}
      />

      <CorridorTariffSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        corridor={editingCorridor}
        existingCorridors={duplicateCatalog}
        canSave={canCreate}
        onSuccess={() => refetch()}
      />
    </>
  );
}
