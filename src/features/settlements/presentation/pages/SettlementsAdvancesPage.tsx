import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { settlementsCopy } from "../copy/settlementsCopy";
import { useDriverAdvances, usePagosOperadoresGreenfield } from "../../application/hooks";
import { SETTLEMENTS_LIST_PATH } from "../../application/settlementsRoutes";
import {
  DriverAdvancesTable,
  DriverAdvanceCard,
  DriverAdvanceCardSkeleton,
  DriverAdvanceCreateDialog,
} from "../components";
import { exportDriverAdvancesCsv } from "../utils/settlementExportHelpers";
import { useRegisterCompensationHubCreateAction } from "@features/compensation/presentation/hooks/useRegisterCompensationHubCreateAction";

const copy = settlementsCopy;
const workbenchCopy = settlementsCopy.workbench;

/**
 * Gestión de anticipos — ListPageShell (ADR-0090 Fase 2; fuera del workbench).
 * Muestra la cola operativa (borrador → autorización → entrega → saldo abierto).
 * No filtrar por OPEN_ADVANCE_STATUSES: ese subconjunto es solo el KPI del workbench;
 * al registrar con “enviar a autorización” el estado es pending_approval y debe verse aquí.
 */
export function SettlementsAdvancesPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canExport = hasPermission("settlements", "read");
  const { enabled: greenfieldEnabled } = usePagosOperadoresGreenfield();
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);

  const openCreate = useCallback(() => setAdvanceDialogOpen(true), []);
  const hubCreateAction = useMemo(
    () =>
      canCreate && greenfieldEnabled
        ? { label: copy.actions.createAdvance, onClick: openCreate }
        : null,
    [canCreate, greenfieldEnabled, openCreate],
  );
  useRegisterCompensationHubCreateAction(hubCreateAction);

  const filters = useListingFilters<"employeeId">({
    filters: {
      employeeId: {},
    },
    chipLabels: {
      employeeId: (value) => `Operador: ${value.slice(0, 8)}`,
    },
  });

  const employeeIdFilter = filters.filters.employeeId || "";

  const {
    data: advancesData,
    isLoading,
    isFetching,
    refetch,
  } = useDriverAdvances({
    employeeId: employeeIdFilter || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const advancesList = advancesData?.data ?? [];

  const filteredAdvances = useMemo(() => {
    if (!filters.search.trim()) return advancesList;
    const q = filters.search.toLowerCase();
    return advancesList.filter(
      (a) =>
        a.folio.toLowerCase().includes(q) ||
        (a.employeeFullName && a.employeeFullName.toLowerCase().includes(q)) ||
        (a.tripCode && a.tripCode.toLowerCase().includes(q)) ||
        (a.bankReference && a.bankReference.toLowerCase().includes(q)),
    );
  }, [advancesList, filters.search]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.toasts.dataRefreshed, variant: "success" });
  }, [refetch, toast]);

  const handleExport = useCallback(() => {
    if (filteredAdvances.length === 0) {
      toast({ title: copy.toasts.noAdvancesToExport, variant: "default" });
      return;
    }
    exportDriverAdvancesCsv(filteredAdvances);
    toast({ title: copy.toasts.exportAdvancesSuccess, variant: "success" });
  }, [filteredAdvances, toast]);

  const pagination = advancesData?.pagination
    ? {
        page: filters.page,
        totalPages: advancesData.pagination.totalPages,
        total: advancesData.pagination.total,
        limit: advancesData.pagination.limit,
      }
    : undefined;

  return (
    <>
      <ListPageShell
        showHeader={!greenfieldEnabled}
        title={copy.tabs.advances}
        description="Anticipos en gestión: por autorizar, por entregar o con saldo pendiente de descontar."
        primaryAction={
          canCreate
            ? {
                label: copy.actions.createAdvance,
                icon: <Plus className="h-4 w-4" />,
                onClick: () => setAdvanceDialogOpen(true),
              }
            : undefined
        }
        items={filteredAdvances}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={filters.setPage}
        entityLabelPlural="anticipos pendientes"
        emptyState={{
          icon: <Plus className="h-8 w-8 text-muted-foreground" />,
          title: copy.empty.advancesTitle,
          description: filters.hasFilters
            ? "Intenta ajustar los filtros de búsqueda"
            : copy.empty.advances,
          cta: canCreate
            ? {
                label: copy.actions.createAdvance,
                onClick: () => setAdvanceDialogOpen(true),
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
          greenfieldEnabled ? undefined : (
          <Button asChild type="button" variant="link" size="sm" className="h-auto px-0">
            <Link to={SETTLEMENTS_LIST_PATH}>
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              {workbenchCopy.actions.backToWorkbench}
            </Link>
          </Button>
          )
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
              disabled={filteredAdvances.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              {copy.actions.exportCsv}
            </Button>
          ) : null,
          filters: (
            <EmployeeAsyncCombobox
              id="settlements-advances-employee-filter"
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
          <DriverAdvancesTable
            advances={filteredAdvances}
            isLoading={isLoading}
          />
        )}
        renderCards={() =>
          filteredAdvances.map((adv) => (
            <DriverAdvanceCard key={adv.id} advance={adv} />
          ))
        }
        renderCardSkeleton={() => <DriverAdvanceCardSkeleton />}
      />

      <DriverAdvanceCreateDialog
        open={advanceDialogOpen}
        onOpenChange={setAdvanceDialogOpen}
        onSuccess={() => void refetch()}
      />
    </>
  );
}
