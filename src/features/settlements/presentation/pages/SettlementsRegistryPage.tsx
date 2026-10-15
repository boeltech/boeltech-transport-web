import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Archive, Download, Search } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { settlementsCopy } from "../copy/settlementsCopy";
import { useSettlements } from "../../application/hooks";
import {
  settlementCreatePath,
  settlementDetailPath,
} from "../../application/settlementsRoutes";
import { useSettlementQueueFromState } from "../utils/settlementWayfinding";
import {
  SettlementsTable,
  SettlementCard,
  SettlementCardSkeleton,
  DisburseSettlementDialog,
  SettlementRegistryFilters,
} from "../components";
import { exportSettlementsCsv } from "../utils/settlementExportHelpers";
import { useEmployeeFilterChipLabel } from "../hooks/useEmployeeFilterChipLabel";
import {
  SETTLEMENT_STATUS_LABELS,
  type SettlementStatus,
} from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

const copy = settlementsCopy;
const registryCopy = settlementsCopy.registry;

/**
 * Registry histórico de pagos — List deep-link bajo el hub (sin tab; sin segundo H1).
 */
export function SettlementsRegistryPage() {
  const navigate = useNavigate();
  const fromState = useSettlementQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canExport = hasPermission("settlements", "read");
  const [disburseSettlement, setDisburseSettlement] =
    useState<DriverSettlement | null>(null);

  const filters = useListingFilters<"status" | "employeeId">({
    filters: {
      status: {},
      employeeId: {},
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${SETTLEMENT_STATUS_LABELS[value as SettlementStatus] || value}`,
    },
  });

  const statusFilter = (filters.filters.status as SettlementStatus | "") || "";
  const employeeIdFilter = filters.filters.employeeId || "";
  const activePanelFilterCount =
    (statusFilter ? 1 : 0) + (employeeIdFilter ? 1 : 0);

  const {
    data: settlementsData,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useSettlements({
    status: statusFilter || undefined,
    employeeId: employeeIdFilter || undefined,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const showLoadError = isError && !isLoading;

  const settlementsList = useMemo(
    () => settlementsData?.data ?? [],
    [settlementsData?.data],
  );
  const employeeChipLabel = useEmployeeFilterChipLabel(
    employeeIdFilter,
    settlementsList,
  );

  const filteredSettlements = useMemo(() => {
    if (!filters.search.trim()) return settlementsList;
    const q = filters.search.toLowerCase();
    return settlementsList.filter(
      (s) =>
        s.settlementNumber.toLowerCase().includes(q) ||
        (s.employeeFullName && s.employeeFullName.toLowerCase().includes(q)),
    );
  }, [settlementsList, filters.search]);

  const activeFilterChips: ActiveFilterChip[] = employeeIdFilter
    ? [
        ...filters.activeChips,
        {
          id: "employeeId",
          label: employeeChipLabel,
          onRemove: () => filters.setFilter("employeeId", ""),
        },
      ]
    : filters.activeChips;

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const handleExport = useCallback(() => {
    if (filteredSettlements.length === 0) {
      toast({ title: copy.toasts.noSettlementsToExport, variant: "default" });
      return;
    }
    exportSettlementsCsv(filteredSettlements);
    toast({ title: copy.toasts.exportSettlementsSuccess, variant: "success" });
  }, [filteredSettlements, toast]);

  const handleViewSettlement = useCallback(
    (id: string) => navigate(settlementDetailPath(id), { state: fromState }),
    [fromState, navigate],
  );

  const pagination =
    !showLoadError && settlementsData?.pagination
      ? {
          page: filters.page,
          totalPages: settlementsData.pagination.totalPages,
          total: settlementsData.pagination.total,
          limit: settlementsData.pagination.limit,
        }
      : undefined;

  return (
    <>
      <ListPageShell
        title={registryCopy.title}
        description={registryCopy.description}
        showHeader={false}
        items={filteredSettlements}
        isLoading={isLoading || showLoadError}
        pagination={pagination}
        onPageChange={filters.setPage}
        entityLabelPlural={registryCopy.entityLabelPlural}
        emptyState={{
          icon: filters.hasFilters ? (
            <Search className="h-8 w-8 text-muted-foreground" />
          ) : (
            <Archive className="h-8 w-8 text-muted-foreground" />
          ),
          title: copy.empty.settlementsTitle,
          description: filters.hasFilters
            ? copy.empty.withFiltersDescription
            : copy.empty.settlements,
          cta: canCreate
            ? {
                label: copy.actions.createSettlement,
                onClick: () =>
                  navigate(settlementCreatePath(), { state: fromState }),
              }
            : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: copy.empty.clearFilters,
                onClick: filters.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
        beforeToolbar={
          showLoadError ? (
            <DetailAlertCard
              severity="critical"
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              title={registryCopy.loadErrorTitle}
              items={[{ text: registryCopy.loadError }]}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  {registryCopy.retry}
                </Button>
              }
            />
          ) : undefined
        }
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.fields.searchPlaceholder,
          },
          onRefresh: handleRefresh,
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
          viewMode: filters.viewModeProps,
          extraActions: canExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredSettlements.length === 0 || showLoadError}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {copy.actions.exportCsv}
            </Button>
          ) : null,
          filters: (
            <SettlementRegistryFilters
              key={
                activePanelFilterCount > 0 ? "filters-active" : "filters-idle"
              }
              status={statusFilter}
              employeeId={employeeIdFilter}
              activePanelFilterCount={activePanelFilterCount}
              onStatusChange={(value) => filters.setFilter("status", value)}
              onEmployeeChange={(employeeId) =>
                filters.setFilter("employeeId", employeeId)
              }
            />
          ),
        }}
        renderTable={() =>
          showLoadError ? null : (
            <SettlementsTable
              settlements={filteredSettlements}
              isLoading={isLoading}
              onView={handleViewSettlement}
              onDisburse={setDisburseSettlement}
              onActionComplete={refetch}
              columnMode="registry"
            />
          )
        }
        renderCards={() =>
          showLoadError
            ? null
            : filteredSettlements.map((st) => (
                <SettlementCard
                  key={st.id}
                  settlement={st}
                  onView={handleViewSettlement}
                  onDisburse={setDisburseSettlement}
                  onActionComplete={refetch}
                />
              ))
        }
        renderCardSkeleton={() => <SettlementCardSkeleton />}
      />

      {disburseSettlement ? (
        <DisburseSettlementDialog
          open={Boolean(disburseSettlement)}
          onOpenChange={(open) => {
            if (!open) setDisburseSettlement(null);
          }}
          settlement={disburseSettlement}
          onSuccess={() => {
            void refetch();
            setDisburseSettlement(null);
          }}
        />
      ) : null}
    </>
  );
}
