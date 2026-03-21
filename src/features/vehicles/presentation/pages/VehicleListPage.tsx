/**
 * VehicleListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de vehículos.
 * Homologado con TripsListPage y DriversListPage.
 *
 * Ubicación: src/features/vehicles/presentation/pages/VehicleListPage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  Plus,
  LayoutGrid,
  LayoutList,
  Search,
  RefreshCw,
  X,
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
import { generatePageNumbers } from "@shared/lib/utils/generatePageNumbers";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") as VehicleStatusType | null;
  const type = searchParams.get("type") as VehicleTypeValue | null;
  const search = searchParams.get("search") || "";

  // Fetch vehicles
  const { data, isLoading, isFetching, refetch } = useVehicles({
    page,
    limit: 10,
    filters: {
      status: status || undefined,
      type: type || undefined,
      search: search || undefined,
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
  const pagination = data?.pagination;

  // Permisos
  const canCreate = hasPermission("vehicles", "create");
  const canEdit = hasPermission("vehicles", "update");
  const canDelete = hasPermission("vehicles", "delete");

  // Filtros activos
  const hasFilters = !!status || !!type || !!search;

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

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("search", value);
        else params.delete("search");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set("status", value);
        else params.delete("status");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleTypeChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value && value !== "all") params.set("type", value);
        else params.delete("type");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", newPage.toString());
        return params;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams(new URLSearchParams());
  }, [setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehículos</h1>
          <p className="text-muted-foreground">Gestión de la flota vehicular</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/vehicles/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Vehículo
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar vehículo..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Status Filter */}
          <Select value={status || "all"} onValueChange={handleStatusChange}>
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

          {/* Type Filter */}
          <Select value={type || "all"} onValueChange={handleTypeChange}>
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

          {/* Clear Filters */}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              Limpiar filtros
            </Button>
          )}

          {/* Refresh */}
          <Button
            variant="outline"
            size="icon"
            onClick={async () => {
              await refetch();
              toast({ title: "Lista actualizada", variant: "success" });
            }}
            disabled={isFetching}
          >
            <RefreshCw
              className={cn("h-4 w-4", isFetching && "animate-spin")}
            />
          </Button>

          {/* View Toggle */}
          <div className="flex border rounded-md ml-auto">
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="Vista de tabla"
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              size="icon"
              onClick={() => setViewMode("cards")}
              title="Vista de tarjetas"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Active filters summary */}
        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Filtros activos:</span>
            {search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Búsqueda: "{search}"
                <button
                  onClick={() => handleSearchChange("")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {status && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Estado: {VEHICLE_STATUS_CONFIG[status]?.label || status}
                <button
                  onClick={() => handleStatusChange("all")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {type && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Tipo: {VEHICLE_TYPE_LABELS[type]}
                <button
                  onClick={() => handleTypeChange("all")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Summary */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          {pagination.total === 0 ? (
            "No se encontraron vehículos"
          ) : (
            <>
              Mostrando{" "}
              <span className="font-medium">
                {(page - 1) * pagination.limit + 1}-
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{" "}
              de <span className="font-medium">{pagination.total}</span>{" "}
              vehículos
            </>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <VehicleTable
          vehicles={vehicles}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <VehicleCardSkeleton key={i} />
            ))
          ) : vehicles.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No se encontraron vehículos
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando tu primer vehículo"}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                canCreate && (
                  <Button onClick={() => navigate("/vehicles/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Vehículo
                  </Button>
                )
              )}
            </div>
          ) : (
            vehicles.map((vehicle) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onView={handleView}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Página {page} de {pagination.totalPages}
          </p>

          <div className="flex items-center gap-2">
            {/* First page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(1)}
            >
              Primera
            </Button>

            {/* Previous */}
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Anterior
            </Button>

            {/* Page numbers */}
            <div className="hidden sm:flex items-center gap-1">
              {generatePageNumbers(page, pagination.totalPages).map(
                (pageNum, idx) =>
                  pageNum === "..." ? (
                    <span key={`ellipsis-${idx}`} className="px-2">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9"
                      onClick={() => handlePageChange(pageNum as number)}
                    >
                      {pageNum}
                    </Button>
                  ),
              )}
            </div>

            {/* Next */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Siguiente
            </Button>

            {/* Last page */}
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.totalPages)}
            >
              Última
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
