/**
 * VehicleListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de vehículos.
 * Homologado con TripsListPage y DriversListPage.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleListPage.tsx
 */

import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
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
import { usePermissions } from "@shared/permissions";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
import { BranchStatus, useBranches } from "@features/branches";
import { MasterImportWizard, importsCopy } from "@features/imports";
import { Button } from "@shared/ui/button";
import { FileUp, Loader2, Plus, Search } from "lucide-react";

import { useVehicles, useDeleteVehicle } from "../../application";
import {
  VehicleStatus,
  VehicleType,
  type VehicleListItem,
  type VehicleStatusType,
  type VehicleTypeValue,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "../../domain";
import { VehicleTable, VehicleCard, VehicleCardSkeleton } from "../components";
import { vehiclesCopy } from "../copy/vehiclesCopy";
import { VEHICLE_STATUS_CONFIG } from "../index";

const listFilterCopy = vehiclesCopy.list.filters;

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleListPage() {
  const navigate = useNavigate();
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
        `Estado: ${VEHICLE_STATUS_CONFIG[value as VehicleStatusType]?.label || value}`,
      type: (value) =>
        `Tipo: ${VEHICLE_TYPE_LABELS[value as VehicleTypeValue] || value}`,
      branchId: (value) =>
        listFilterCopy.chipBranch(
          branchLabelById.get(value) ?? value.slice(0, 8),
        ),
    },
  });
  const statusFilter = filters.filters.status as VehicleStatusType | "";
  const typeFilter = filters.filters.type as VehicleTypeValue | "";
  const branchIdFilter = filters.filters.branchId || "";

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
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canCreate = hasPermission("vehicles", "create");
  const canEdit = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");
  const canImport =
    hasPermission("imports", "execute") && hasPermission("vehicles", "create");
  const [importWizardOpen, setImportWizardOpen] = useState(false);

  const handleView = useCallback(
    (id: string) => navigate(`/vehicles/${id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/vehicles/${id}/edit`),
    [navigate],
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
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
    <>
      <ListPageShell
        title="Vehículos"
        description="Gestión de la flota vehicular"
        primaryAction={{
          label: "Nuevo Vehículo",
          icon: <Plus className="h-4 w-4" />,
          onClick: handleCreate,
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: "Buscar vehículo...",
          },
          filters: (
            <>
              <Select
                value={statusFilter || "all"}
                onValueChange={(value) => filters.setFilter("status", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.values(VehicleStatus).map((statusValue) => (
                    <SelectItem key={statusValue} value={statusValue}>
                      {VEHICLE_STATUS_LABELS[statusValue]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={typeFilter || "all"}
                onValueChange={(value) => filters.setFilter("type", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {Object.values(VehicleType).map((typeValue) => (
                    <SelectItem key={typeValue} value={typeValue}>
                      {VEHICLE_TYPE_LABELS[typeValue]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={branchIdFilter || "all"}
                onValueChange={(value) => filters.setFilter("branchId", value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={listFilterCopy.branch} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {listFilterCopy.allBranches}
                  </SelectItem>
                  {branchOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          ),
          extraActions: canImport ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setImportWizardOpen(true)}
              leftIcon={<FileUp className="h-4 w-4" />}
            >
              {importsCopy.cta.importCsv}
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
          title: "No se encontraron vehículos",
          description: filters.hasFilters
            ? "Intenta ajustar los filtros de búsqueda"
            : "Comienza agregando tu primer vehículo",
          cta: canCreate
            ? {
                label: "Nuevo Vehículo",
                icon: <Plus className="h-4 w-4" />,
                onClick: handleCreate,
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
