import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { settlementsCopy } from "../copy/settlementsCopy";
import { useSettlements } from "../../application/hooks";
import {
  SETTLEMENTS_LIST_PATH,
  settlementCreatePath,
  settlementDetailPath,
} from "../../application/settlementsRoutes";
import {
  SettlementsTable,
  SettlementCard,
  SettlementCardSkeleton,
  DisburseSettlementDialog,
} from "../components";
import { exportSettlementsCsv } from "../utils/settlementExportHelpers";
import {
  SETTLEMENT_STATUS_LABELS,
  type SettlementStatus,
} from "../../domain/enums";
import type { DriverSettlement } from "../../domain/entities";

const copy = settlementsCopy;
const workbenchCopy = settlementsCopy.workbench;

/**
 * Registry histórico de liquidaciones — ListPageShell puro (ADR-0090 Fase 2).
 */
export function SettlementsRegistryPage() {
  const navigate = useNavigate();
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
      employeeId: (value) => `Operador: ${value.slice(0, 8)}`,
    },
  });

  const statusFilter = (filters.filters.status as SettlementStatus | "") || "";
  const employeeIdFilter = filters.filters.employeeId || "";

  const {
    data: settlementsData,
    isLoading,
    isFetching,
    refetch,
  } = useSettlements({
    status: statusFilter || undefined,
    employeeId: employeeIdFilter || undefined,
    search: filters.search.trim() || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const settlementsList = settlementsData?.data ?? [];

  const filteredSettlements = useMemo(() => {
    if (!filters.search.trim()) return settlementsList;
    const q = filters.search.toLowerCase();
    return settlementsList.filter(
      (s) =>
        s.settlementNumber.toLowerCase().includes(q) ||
        (s.employeeFullName && s.employeeFullName.toLowerCase().includes(q)),
    );
  }, [settlementsList, filters.search]);

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
    (id: string) => navigate(settlementDetailPath(id)),
    [navigate],
  );

  const pagination = settlementsData?.pagination
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
        title={copy.title}
        description="Historial completo de liquidaciones registradas."
        primaryAction={
          canCreate
            ? {
                label: copy.actions.createSettlement,
                icon: <Plus className="h-4 w-4" />,
                onClick: () => navigate(settlementCreatePath()),
              }
            : undefined
        }
        items={filteredSettlements}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={filters.setPage}
        entityLabelPlural="liquidaciones"
        emptyState={{
          icon: <Plus className="h-8 w-8 text-muted-foreground" />,
          title: copy.empty.settlementsTitle,
          description: filters.hasFilters
            ? "Intenta ajustar los filtros de búsqueda"
            : copy.empty.settlements,
          cta: canCreate
            ? {
                label: copy.actions.createSettlement,
                onClick: () => navigate(settlementCreatePath()),
              }
            : undefined,
          secondaryCta: filters.hasFilters
            ? {
                label: "Limpiar filtros",
                onClick: filters.clearAll,
                variant: "outline",
              }
            : undefined,
        }}
        beforeToolbar={
          <Button asChild type="button" variant="link" size="sm" className="h-auto px-0">
            <Link to={SETTLEMENTS_LIST_PATH}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {workbenchCopy.actions.backToWorkbench}
            </Link>
          </Button>
        }
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
          extraActions: canExport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredSettlements.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {copy.actions.exportCsv}
            </Button>
          ) : null,
          filters: (
            <>
              <EmployeeAsyncCombobox
                id="settlements-registry-employee-filter"
                className="w-48"
                value={employeeIdFilter}
                onChange={(employeeId) =>
                  filters.setFilter("employeeId", employeeId)
                }
                placeholder="Todos los operadores"
                allowClear
              />
              <Select
                value={statusFilter || "all"}
                onValueChange={(val) =>
                  filters.setFilter("status", val === "all" ? "" : val)
                }
              >
                <SelectTrigger className="w-48" aria-label="Filtrar por estado">
                  <SelectValue placeholder={copy.fields.status} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.fields.allStatuses}</SelectItem>
                  {(
                    Object.keys(SETTLEMENT_STATUS_LABELS) as SettlementStatus[]
                  ).map((st) => (
                    <SelectItem key={st} value={st}>
                      {SETTLEMENT_STATUS_LABELS[st]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ),
        }}
        renderTable={() => (
          <SettlementsTable
            settlements={filteredSettlements}
            isLoading={isLoading}
            onView={handleViewSettlement}
            onDisburse={setDisburseSettlement}
            onActionComplete={refetch}
            columnMode="registry"
          />
        )}
        renderCards={() =>
          filteredSettlements.map((st) => (
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
