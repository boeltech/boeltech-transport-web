/**
 * VehicleListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de vehículos.
 * Homologado con TripsListPage y DriversListPage.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleListPage.tsx
 */

import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { useListingFilters, useToast } from "@shared/hooks";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { usePermissions } from "@shared/permissions";
import {
  Plus,
  Search,
} from "lucide-react";

// Feature imports
import { useVehicles, useDeleteVehicle } from "../../application";
import {
  VehicleStatus,
  VehicleType,
  type VehicleStatusType,
  type VehicleTypeValue,
  VEHICLE_STATUS_LABELS,
  VEHICLE_TYPE_LABELS,
} from "../../domain";
import { VehicleTable, VehicleCard, VehicleCardSkeleton } from "../components";
import { VEHICLE_STATUS_CONFIG } from "../index";

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const filters = useListingFilters<"status" | "type">({
    filters: {
      status: {},
      type: {},
    },
    chipLabels: {
      status: (value) =>
        `Estado: ${VEHICLE_STATUS_CONFIG[value as VehicleStatusType]?.label || value}`,
      type: (value) => `Tipo: ${VEHICLE_TYPE_LABELS[value as VehicleTypeValue] || value}`,
    },
  });
  const statusFilter = filters.filters.status as VehicleStatusType | "";
  const typeFilter = filters.filters.type as VehicleTypeValue | "";

  // Fetch vehicles
  const { data, isLoading, isFetching, refetch } = useVehicles({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
      type: typeFilter || undefined,
      search: filters.search || undefined,
      isActive: true,
    },
    sort: { field: "unit_number", direction: "asc" },
  });

  // Mutations
  const deleteMutation = useDeleteVehicle({
    onSuccess: () => {
      toast({ title: "Vehículo eliminado", variant: "success" });
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

  // Data
  const vehicles = data?.data ?? [];

  // Permisos
  const canCreate = hasPermission("vehicles", "create");
  const canEdit = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");

  // Handlers
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
      if (window.confirm("¿Estás seguro de eliminar este vehículo?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );
  const handleCreate = useCallback(() => {
    navigate("/vehicles/new");
  }, [navigate]);
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast({ title: "Lista actualizada", variant: "success" });
  }, [refetch, toast]);

  return (
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
  );
}
