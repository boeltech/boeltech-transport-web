import { useCallback, useMemo, useState } from "react";
import { AlertCircle, Download, Plus } from "lucide-react";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { usePermissions } from "@shared/permissions";
import { useListingFilters, useToast } from "@shared/hooks";
import { EmployeeAsyncCombobox } from "@shared/ui/employee-async-combobox";
import { settlementsCopy } from "../copy/settlementsCopy";
import { useDriverAdvances } from "../../application/hooks";
import {
  DriverAdvancesTable,
  DriverAdvanceCard,
  DriverAdvanceCardSkeleton,
  DriverAdvanceCreateDialog,
} from "../components";
import { exportDriverAdvancesCsv } from "../utils/settlementExportHelpers";
import { useRegisterCompensationHubCreateAction } from "@features/compensation/presentation/hooks/useRegisterCompensationHubCreateAction";

const copy = settlementsCopy;
const advancesCopy = settlementsCopy.advancesList;

/**
 * Gestión de anticipos — ListPageShell showHeader=false bajo el hub.
 * Un filtro en toolbar (operador); no inventar ListingFilterPanel vacío.
 * Empty = shell; error = DetailAlertCard + Reintentar.
 */
export function SettlementsAdvancesPage() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("settlements", "create");
  const canExport = hasPermission("settlements", "read");
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);

  const openCreate = useCallback(() => setAdvanceDialogOpen(true), []);
  const hubCreateAction = useMemo(
    () =>
      canCreate
        ? { label: copy.actions.createAdvance, onClick: openCreate }
        : null,
    [canCreate, openCreate],
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
    isError,
    refetch,
  } = useDriverAdvances({
    employeeId: employeeIdFilter || undefined,
    page: filters.page,
    pageSize: 20,
  });

  const showLoadError = isError && !isLoading;

  const filteredAdvances = useMemo(() => {
    const advancesList = advancesData?.data ?? [];
    if (!filters.search.trim()) return advancesList;
    const q = filters.search.toLowerCase();
    return advancesList.filter(
      (a) =>
        a.folio.toLowerCase().includes(q) ||
        (a.employeeFullName && a.employeeFullName.toLowerCase().includes(q)) ||
        (a.tripCode && a.tripCode.toLowerCase().includes(q)) ||
        (a.bankReference && a.bankReference.toLowerCase().includes(q)),
    );
  }, [advancesData?.data, filters.search]);

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

  const pagination =
    !showLoadError && advancesData?.pagination
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
        showHeader={false}
        title={copy.tabs.advances}
        description={advancesCopy.description}
        items={filteredAdvances}
        isLoading={isLoading || showLoadError}
        pagination={pagination}
        onPageChange={filters.setPage}
        entityLabelPlural="anticipos"
        emptyState={{
          icon: <Plus className="h-8 w-8 text-muted-foreground" />,
          title: copy.empty.advancesTitle,
          description: filters.hasFilters
            ? copy.empty.withFiltersDescription
            : copy.empty.advances,
          cta: canCreate
            ? {
                label: copy.actions.createAdvance,
                onClick: () => setAdvanceDialogOpen(true),
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
              title={advancesCopy.loadErrorTitle}
              items={[{ text: advancesCopy.loadError }]}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  {advancesCopy.retry}
                </Button>
              }
            />
          ) : null
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
              disabled={filteredAdvances.length === 0 || showLoadError}
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
        renderTable={() =>
          showLoadError ? null : (
            <DriverAdvancesTable
              advances={filteredAdvances}
              isLoading={isLoading}
            />
          )
        }
        renderCards={() =>
          showLoadError
            ? null
            : filteredAdvances.map((adv) => (
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
