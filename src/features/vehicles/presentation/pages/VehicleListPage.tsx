/**
 * VehicleListPage — padrón de vehículos (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; estado / tipo / sucursal en «Filtros (n)».
 * Por defecto `isActive: true`; el toggle «Dadas de baja» consulta `isActive: false`
 * (precedente sucursales) y deja solo «Ver detalles» y «Restaurar» por fila.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import { useListingFilters, useToast } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { BranchStatus, useBranches } from "@features/branches";
import { useDashboardActivation } from "@features/dashboard/application/hooks/useDashboardActivation";
import { resolveActivationEmptyGuidance } from "@features/dashboard/domain/activation";
import { buildActivationGapEmptyCta } from "@features/dashboard/presentation/utils/activationEmptyCta";
import { MasterImportWizard } from "@features/imports";
import { Button } from "@shared/ui/button";
import { FileUp, Plus, Search, Users } from "lucide-react";

import { useVehicles } from "../../application";
import {
  type VehicleListItem,
  type VehicleStatusType,
  type VehicleTypeValue,
  VEHICLE_TYPE_LABELS,
} from "../../domain";
import {
  VehicleTable,
  VehicleCard,
  VehicleCardSkeleton,
  VehicleListFilters,
  VehicleDeactivateDialog,
  VehicleRestoreDialog,
} from "../components";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VEHICLE_STATUS_CONFIG } from "../config/vehicleStatusConfig";
import { countVehiclePanelFilters } from "../utils/vehicleListFilters";

const copy = vehiclesCopy.list;

export function VehicleListPage() {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [showDeactivated, setShowDeactivated] = useState(false);

  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  const branchOptions = useMemo(
    () => buildBranchSelectOptions(branchesResult?.data ?? []),
    [branchesResult?.data],
  );

  const branchLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of branchOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [branchOptions]);

  const filters = useListingFilters<"status" | "type" | "branchId">({
    filters: {
      status: {},
      type: {},
      branchId: {},
    },
    chipLabels: {
      status: (value) =>
        copy.chip.status(
          VEHICLE_STATUS_CONFIG[value as VehicleStatusType]?.label || value,
        ),
      type: (value) =>
        copy.chip.type(VEHICLE_TYPE_LABELS[value as VehicleTypeValue] || value),
      branchId: (value) =>
        copy.filters.chipBranch(
          branchLabelById.get(value) ?? value.slice(0, 8),
        ),
    },
  });
  const statusFilter = showDeactivated
    ? ""
    : (filters.filters.status as VehicleStatusType | "");
  const typeFilter = filters.filters.type as VehicleTypeValue | "";
  const branchIdFilter = filters.filters.branchId || "";
  const activePanelFilterCount = countVehiclePanelFilters({
    status: statusFilter,
    type: typeFilter,
    branchId: branchIdFilter,
  });
  const hasPanelFilters = activePanelFilterCount > 0;

  const { data, isLoading, isFetching, refetch } = useVehicles({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      search: filters.search || undefined,
      branchId: branchIdFilter || undefined,
      isActive: !showDeactivated,
    },
    sort: { field: "unit_number", direction: "asc" },
  });

  const vehicles = useMemo(() => data?.data ?? [], [data?.data]);

  const [deactivateTarget, setDeactivateTarget] =
    useState<VehicleListItem | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<VehicleListItem | null>(
    null,
  );
  const [restoreOpen, setRestoreOpen] = useState(false);

  const role = useRole();
  const isManager = role === ROLES.MANAGER;
  const canCreate = hasPermission("vehicles", "create");
  const canEdit = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");
  const canImport =
    hasPermission("imports", "execute") && hasPermission("vehicles", "create");
  const canSeeDeactivated = hasPermission("vehicles", "read");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const { data: activation } = useDashboardActivation({
    enabled: !showDeactivated && !filters.hasFilters,
  });
  const activationGap = resolveActivationEmptyGuidance("vehicles", activation);
  const activationGapEmpty = activationGap
    ? buildActivationGapEmptyCta(activationGap, navigate, (
        <Users className="h-4 w-4" />
      ))
    : null;

  const handleView = useCallback(
    (id: string) => navigate(`/vehicles/${id}`, { state: fromState }),
    [fromState, navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/vehicles/${id}/edit`, { state: fromState }),
    [fromState, navigate],
  );

  const handleDeactivate = useCallback(
    (id: string) => {
      const vehicle = vehicles.find((v) => v.id === id);
      if (!vehicle) return;
      setDeactivateTarget(vehicle);
      setDeactivateOpen(true);
    },
    [vehicles],
  );

  const handleRestore = useCallback(
    (id: string) => {
      const vehicle = vehicles.find((v) => v.id === id);
      if (!vehicle) return;
      setRestoreTarget(vehicle);
      setRestoreOpen(true);
    },
    [vehicles],
  );

  const handleCreate = useCallback(() => {
    navigate("/vehicles/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.page.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

  const handleToggleDeactivated = useCallback(() => {
    setShowDeactivated((prev) => !prev);
    filters.setFilters({ status: "" });
  }, [filters]);

  const handleClearAllFilters = useCallback(() => {
    filters.clearAll();
    setShowDeactivated(false);
  }, [filters]);

  const activeFilterChips: ActiveFilterChip[] = useMemo(() => {
    if (!showDeactivated) return filters.activeChips;
    return [
      ...filters.activeChips,
      {
        id: "deactivated-view",
        label: copy.deactivatedView.chip,
        onRemove: () => setShowDeactivated(false),
      },
    ];
  }, [filters.activeChips, showDeactivated]);

  const hasListFilters = filters.hasFilters || showDeactivated;

  return (
    <>
      <ListPageShell
        title={copy.page.title}
        description={
          isManager && canCreate
            ? copy.page.descriptionManager
            : copy.page.description
        }
        primaryAction={{
          label: copy.actions.create,
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate && !showDeactivated,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <>
              {canSeeDeactivated ? (
                <Button
                  type="button"
                  variant={showDeactivated ? "secondary" : "outline"}
                  size="sm"
                  onClick={handleToggleDeactivated}
                  aria-pressed={showDeactivated}
                  aria-label={copy.deactivatedView.aria}
                >
                  {copy.deactivatedView.label}
                </Button>
              ) : null}
              <VehicleListFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                status={statusFilter}
                type={typeFilter}
                branchId={branchIdFilter}
                branchOptions={branchOptions}
                activePanelFilterCount={activePanelFilterCount}
                showStatus={!showDeactivated}
                onStatusChange={(value) => filters.setFilter("status", value)}
                onTypeChange={(value) => filters.setFilter("type", value)}
                onBranchChange={(value) => filters.setFilter("branchId", value)}
              />
            </>
          ),
          extraActions:
            canImport && !showDeactivated ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImportWizardOpen(true)}
                leftIcon={<FileUp className="h-4 w-4" />}
                aria-label={copy.actions.importAria}
              >
                {copy.actions.import}
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
        items={vehicles}
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
        entityLabelPlural="vehículos"
        renderTable={() => (
          <VehicleTable
            vehicles={vehicles}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canEdit && !showDeactivated ? handleEdit : undefined}
            onDeactivate={
              canDelete && !showDeactivated ? handleDeactivate : undefined
            }
            onRestore={canEdit && showDeactivated ? handleRestore : undefined}
          />
        )}
        renderCards={() =>
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={handleView}
              onEdit={canEdit && !showDeactivated ? handleEdit : undefined}
              onDeactivate={
                canDelete && !showDeactivated ? handleDeactivate : undefined
              }
              onRestore={canEdit && showDeactivated ? handleRestore : undefined}
            />
          ))
        }
        renderCardSkeleton={() => <VehicleCardSkeleton />}
        emptyState={
          showDeactivated
            ? {
                icon: <Search className="h-10 w-10 text-muted-foreground" />,
                title: copy.deactivatedView.emptyTitle,
                description: filters.hasFilters
                  ? copy.empty.descriptionFiltered
                  : undefined,
                secondaryCta: filters.hasFilters
                  ? {
                      label: copy.actions.clearFilters,
                      onClick: filters.clearAll,
                      variant: "outline",
                    }
                  : undefined,
              }
            : {
                icon: <Search className="h-10 w-10 text-muted-foreground" />,
                title: copy.empty.title,
                description: filters.hasFilters
                  ? copy.empty.descriptionFiltered
                  : activationGapEmpty
                    ? activationGapEmpty.description
                    : canCreate
                      ? isManager
                        ? copy.empty.descriptionClearManager
                        : copy.empty.descriptionClear
                      : copy.empty.descriptionReadonly,
                cta: activationGapEmpty
                  ? activationGapEmpty.cta
                  : canCreate
                    ? {
                        label: copy.actions.create,
                        icon: <Plus className="h-4 w-4" />,
                        onClick: handleCreate,
                      }
                    : undefined,
                secondaryCta: filters.hasFilters
                  ? {
                      label: copy.actions.clearFilters,
                      onClick: filters.clearAll,
                      variant: "outline",
                    }
                  : undefined,
              }
        }
      />

      <MasterImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        entityType="vehicles"
        lockEntityType
      />

      <VehicleDeactivateDialog
        vehicle={deactivateTarget}
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
      />

      <VehicleRestoreDialog
        vehicle={restoreTarget}
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
      />
    </>
  );
}
