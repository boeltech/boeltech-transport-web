/**
 * DriversListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de conductores.
 * Sin selección múltiple (checkboxes).
 *
 * Ubicación: src/features/drivers/presentation/pages/DriversListPage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { useDebouncedSearchParam } from "@shared/hooks";
import { Button } from "@shared/ui/button";
import {
  ActiveFilterChips,
  ListingPagination,
  ListingResultsSummary,
  ListingSearchInput,
  ViewModeToggle,
} from "@shared/ui/listing";
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
  Search,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";

// Feature imports
import { useDrivers, useDeleteDriver } from "../../application";
import {
  DriverStatus,
  type DriverStatusType,
  DRIVER_STATUS_LABELS,
} from "../../domain";
import { DriverTable, DriverCard, DriverCardSkeleton } from "../components";
// import { DRIVER_STATUS_CONFIG } from "../config";
import { DRIVER_STATUS_CONFIG } from "../index";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

export function DriversListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") as DriverStatusType | null;
  const search = searchParams.get("search") || "";
  const licenseExpiring = searchParams.get("licenseExpiring") === "true";
  const { searchInput, setSearchInput } = useDebouncedSearchParam(
    search,
    setSearchParams,
  );

  // Fetch drivers
  const { data, isLoading, isFetching, refetch } = useDrivers({
    page,
    limit: 10,
    filters: {
      status: status || undefined,
      search: search || undefined,
      licenseExpiringSoon: licenseExpiring || undefined,
    },
    sort: { field: "employee_name", direction: "asc" },
  });

  // Mutations
  const deleteMutation = useDeleteDriver({
    onSuccess: () => {
      toast({ title: "Conductor eliminado", variant: "success" });
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
  const drivers = data?.data ?? [];
  const pagination = data?.pagination;

  // Permisos
  const canCreate = hasPermission("drivers", "create");
  const canEdit = hasPermission("drivers", "update");
  const canDelete = hasPermission("drivers", "delete");

  // Filtros activos
  const hasFilters = !!status || !!search || licenseExpiring;

  // Handlers
  const handleView = useCallback(
    (id: string) => navigate(`/drivers/${id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/drivers/${id}/edit`),
    [navigate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("¿Estás seguro de eliminar este conductor?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
    },
    [setSearchInput],
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

  const handleLicenseExpiringToggle = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (licenseExpiring) params.delete("licenseExpiring");
      else params.set("licenseExpiring", "true");
      params.set("page", "1");
      return params;
    });
  }, [licenseExpiring, setSearchParams]);

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
          <h1 className="text-2xl font-bold tracking-tight">Conductores</h1>
          <p className="text-muted-foreground">
            Gestiona los conductores de la flota
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/drivers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Conductor
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <ListingSearchInput
            placeholder="Buscar conductor..."
            value={searchInput}
            onChange={handleSearchChange}
          />

          {/* Status Filter */}
          <Select value={status || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {Object.values(DriverStatus).map((statusValue) => (
                <SelectItem key={statusValue} value={statusValue}>
                  {DRIVER_STATUS_LABELS[statusValue]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* License Expiring Filter */}
          <Button
            variant={licenseExpiring ? "secondary" : "outline"}
            size="sm"
            onClick={handleLicenseExpiringToggle}
            className={cn(
              licenseExpiring &&
                "bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/30 dark:hover:bg-amber-900/50",
            )}
          >
            <AlertTriangle className="mr-2 h-4 w-4" />
            Licencias por vencer
          </Button>

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
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
        </div>

        {/* Active filters summary */}
        <ActiveFilterChips
          chips={[
            ...(search
              ? [
                  {
                    id: "search",
                    label: `Búsqueda: "${search}"`,
                    onRemove: () => handleSearchChange(""),
                  },
                ]
              : []),
            ...(status
              ? [
                  {
                    id: "status",
                    label: `Estado: ${DRIVER_STATUS_CONFIG[status]?.label || status}`,
                    onRemove: () => handleStatusChange("all"),
                  },
                ]
              : []),
            ...(licenseExpiring
              ? [
                  {
                    id: "licenseExpiring",
                    label: "Licencias por vencer",
                    onRemove: handleLicenseExpiringToggle,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Results Summary */}
      {pagination && (
        <ListingResultsSummary
          entityLabelPlural="conductores"
          total={pagination.total}
          page={page}
          limit={pagination.limit}
        />
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <DriverTable
          drivers={drivers}
          isLoading={isLoading}
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <DriverCardSkeleton key={i} />
            ))
          ) : drivers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No se encontraron conductores
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza agregando tu primer conductor"}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                canCreate && (
                  <Button onClick={() => navigate("/drivers/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Conductor
                  </Button>
                )
              )}
            </div>
          ) : (
            drivers.map((driver) => (
              <DriverCard
                key={driver.id}
                driver={driver}
                onView={handleView}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
              />
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <ListingPagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
}
