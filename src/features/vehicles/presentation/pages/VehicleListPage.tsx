/**
 * VehicleListPage — padrón de vehículos (`ListPageShell`).
 *
 * Dictamen toolbar: search = lookup; estado / tipo / sucursal en «Filtros (n)».
 * `isActive: true` es invariante de consulta, no un control del riel.
 */
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useListQueueFromState } from "@shared/utils/listQueueFrom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { useListingFilters, useToast } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { ROLES } from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { isApiError } from "@shared/api/interceptors/error-handler";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { BranchStatus, useBranches } from "@features/branches";
import { MasterImportWizard } from "@features/imports";
import { Button } from "@shared/ui/button";
import { FileUp, Loader2, Plus, Search } from "lucide-react";

import { useVehicles, useDeleteVehicle } from "../../application";
import {
  isBillableMotrizNow,
  type VehicleListItem,
  type VehicleStatusType,
  type VehicleTypeValue,
  VEHICLE_TYPE_LABELS,
} from "../../domain";
import { VehicleTable, VehicleCard, VehicleCardSkeleton, VehicleListFilters } from "../components";
import { VehicleBillingPolicyNote } from "../components/VehicleBillingPolicyNote";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VEHICLE_STATUS_CONFIG } from "../index";
import { countVehiclePanelFilters } from "../utils/vehicleListFilters";

const copy = vehiclesCopy.list;

function deleteVehicleErrorDescription(error: unknown): string {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "No se pudo eliminar el vehículo";
  if (isApiError(error) && error.code === "VEHICLE_ASSIGNED_TO_ACTIVE_TRIP") {
    return `${message} Revise Viajes y reasigne la flota.`;
  }
  return message;
}

export function VehicleListPage() {
  const navigate = useNavigate();
  const fromState = useListQueueFromState();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

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
  const statusFilter = filters.filters.status as VehicleStatusType | "";
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
      isActive: true,
    },
    sort: { field: "unit_number", direction: "asc" },
  });

  const vehicles = data?.data ?? [];

  const [vehicleToDelete, setVehicleToDelete] =
    useState<VehicleListItem | null>(null);

  const deleteMutation = useDeleteVehicle({
    onSuccess: () => {
      toast({ title: "Vehículo eliminado", variant: "success" });
      setVehicleToDelete(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error al eliminar",
        description: deleteVehicleErrorDescription(error),
        variant: "destructive",
      });
    },
  });

  const role = useRole();
  const isManager = role === ROLES.MANAGER;
  const canCreate = hasPermission("vehicles", "create");
  const canEdit = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");
  const canImport =
    hasPermission("imports", "execute") && hasPermission("vehicles", "create");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const handleView = useCallback(
    (id: string) => navigate(`/vehicles/${id}`, { state: fromState }),
    [fromState, navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/vehicles/${id}/edit`, { state: fromState }),
    [fromState, navigate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      const vehicle = vehicles.find((v) => v.id === id);
      if (vehicle) setVehicleToDelete(vehicle);
    },
    [vehicles],
  );

  const handleConfirmDelete = useCallback(() => {
    if (!vehicleToDelete) return;
    deleteMutation.mutate(vehicleToDelete.id);
  }, [deleteMutation, vehicleToDelete]);
  const handleCreate = useCallback(() => {
    navigate("/vehicles/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: copy.page.refreshSuccess, variant: "success" });
  }, [refetch, toast]);

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
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: copy.filter.searchPlaceholder,
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <VehicleListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              status={statusFilter}
              type={typeFilter}
              branchId={branchIdFilter}
              branchOptions={branchOptions}
              activePanelFilterCount={activePanelFilterCount}
              onStatusChange={(value) => filters.setFilter("status", value)}
              onTypeChange={(value) => filters.setFilter("type", value)}
              onBranchChange={(value) => filters.setFilter("branchId", value)}
            />
          ),
          extraActions: canImport ? (
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
          activeFilterChips: filters.activeChips,
          onClearFilters: filters.clearAll,
          hasFilters: filters.hasFilters,
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
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        )}
        renderCards={() =>
          vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
            />
          ))
        }
        renderCardSkeleton={() => <VehicleCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: copy.empty.title,
          description: filters.hasFilters
            ? copy.empty.descriptionFiltered
            : canCreate
              ? isManager
                ? copy.empty.descriptionClearManager
                : copy.empty.descriptionClear
              : copy.empty.descriptionReadonly,
          cta: canCreate
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
        }}
      />

      <MasterImportWizard
        open={importWizardOpen}
        onOpenChange={setImportWizardOpen}
        entityType="vehicles"
        lockEntityType
      />

      <AlertDialog
        open={vehicleToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setVehicleToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este vehículo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El vehículo{" "}
              <strong>{vehicleToDelete?.unitNumber}</strong>
              {vehicleToDelete?.licensePlate
                ? ` (${vehicleToDelete.licensePlate})`
                : ""}{" "}
              será eliminado del sistema y dejará de estar disponible para
              asignaciones a viajes.
              {vehicleToDelete && isBillableMotrizNow(vehicleToDelete) ? (
                <>
                  {" "}
                  <VehicleBillingPolicyNote kind="remove" />
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
