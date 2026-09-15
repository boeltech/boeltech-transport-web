import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { settlementsCopy } from "../copy/settlementsCopy";
import { usePagosOperadoresGreenfield, useSettlements } from "../../application/hooks";
import { settlementDetailPath } from "../../application/settlementsRoutes";
import {
  SettlementCard,
  SettlementCardSkeleton,
  SettlementsTable,
} from "../components";
import type { DriverSettlement } from "../../domain/entities";

const copy = settlementsCopy;
const hubCopy = settlementsCopy.hub;

export function SettlementsPendingApprovalPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { enabled: greenfieldEnabled } = usePagosOperadoresGreenfield();
  const canUpdate = hasPermission("settlements", "update");

  const filters = useListingFilters<"employeeId">({
    filters: { employeeId: {} },
    chipLabels: {
      employeeId: (value) => `Operador: ${value.slice(0, 8)}`,
    },
  });

  const employeeIdFilter = filters.filters.employeeId || "";

  const { data, isLoading, isFetching, refetch } = useSettlements({
    status: "pending_approval",
    employeeId: employeeIdFilter || undefined,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const settlements = data?.data ?? [];

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const handleView = useCallback(
    (id: string) => navigate(settlementDetailPath(id)),
    [navigate],
  );

  const pagination = useMemo(() => {
    if (!data?.pagination) return undefined;
    return {
      page: filters.page,
      totalPages: data.pagination.totalPages,
      total: data.pagination.total,
      limit: data.pagination.limit,
    };
  }, [data?.pagination, filters.page]);

  return (
    <ListPageShell
      showHeader={!greenfieldEnabled}
      title={hubCopy.tabs.porAutorizar}
      description={hubCopy.pendingApprovalEmptyDescription}
      items={settlements as DriverSettlement[]}
      isLoading={isLoading}
      pagination={pagination}
      onPageChange={filters.setPage}
      entityLabelPlural="cortes por autorizar"
      emptyState={{
        title: hubCopy.pendingApprovalEmptyTitle,
        description: hubCopy.pendingApprovalEmptyDescription,
      }}
      toolbar={{
        search: {
          ...filters.searchProps,
          placeholder: copy.fields.searchPlaceholder,
        },
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: filters.activeChips,
        onClearFilters: filters.clearAll,
        hasFilters: filters.hasFilters,
        viewMode: filters.viewModeProps,
        filters: (
          <EmployeeAsyncCombobox
            id="settlements-vobo-employee-filter"
            className="w-48"
            value={employeeIdFilter}
            onChange={(employeeId) =>
              filters.setFilter("employeeId", employeeId)
            }
            placeholder="Todos los operadores"
            allowClear
          />
        ),
      }}
      renderTable={() => (
        <SettlementsTable
          settlements={settlements}
          isLoading={isLoading}
          onView={handleView}
          onActionComplete={() => void refetch()}
          approvalLinkOnly={!canUpdate || !greenfieldEnabled}
          emptyMessage={hubCopy.pendingApprovalEmptyDescription}
          columnMode="pipeline"
        />
      )}
      renderCards={() =>
        settlements.map((settlement) => (
          <SettlementCard
            key={settlement.id}
            settlement={settlement}
            onView={handleView}
            onActionComplete={() => void refetch()}
            approvalLinkOnly={!canUpdate || !greenfieldEnabled}
          />
        ))
      }
      renderCardSkeleton={() => <SettlementCardSkeleton />}
    />
  );
}
