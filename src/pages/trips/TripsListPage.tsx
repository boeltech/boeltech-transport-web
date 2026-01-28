/**
 * TripsListPage
 * FSD: Pages Layer - Composition
 *
 * ACTUALIZADO: Alineado con el Backend
 * - Status config alineado con valores del backend
 * - Rutas corregidas
 *
 * Esta página compone elementos del feature de trips.
 * No contiene lógica de negocio, solo composición de UI.
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

// Import from feature
import {
  useTrips,
  useDeleteTrip,
  useStartTrip,
  useCancelTrip,
  TripTable,
  TripCard,
  TripCardSkeleton,
  TRIP_STATUS_CONFIG,
} from "@/features/trips";

import { type TripStatusType } from "@features/trips/domain";

import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { Plus, LayoutGrid, LayoutList, Search, RefreshCw } from "lucide-react";
import { generatePageNumbers } from "@features/trips/presentation";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") as TripStatusType | null;
  const search = searchParams.get("search") || "";

  // Fetch trips - Usa TripListItem (no Trip completo)
  const { data, isLoading, refetch } = useTrips({
    page,
    limit: 10,
    filters: {
      status: status || undefined,
      search: search || undefined,
    },
    sort: { field: "scheduled_departure", direction: "desc" },
  });

  // Mutations
  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: "Viaje eliminado", variant: "success" });
      setSelectedIds([]);
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

  const startMutation = useStartTrip({
    onSuccess: () => {
      toast({ title: "Viaje iniciado", variant: "success" });
      refetch();
    },
    onError: (error) =>
      toast({
        title: "Error al iniciar",
        description: error.message,
        variant: "destructive",
      }),
  });

  const cancelMutation = useCancelTrip({
    onSuccess: () => {
      toast({ title: "Viaje cancelado", variant: "success" });
      refetch();
    },
    onError: (error) =>
      toast({
        title: "Error al cancelar",
        description: error.message,
        variant: "destructive",
      }),
  });

  // Handlers
  const handleView = useCallback(
    (id: string) => navigate(`/trips/${id}`),
    [navigate],
  );

  const handleEdit = useCallback(
    (id: string) => navigate(`/trips/${id}/edit`),
    [navigate],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm("¿Estás seguro de eliminar este viaje?")) {
        deleteMutation.mutate(id);
      }
    },
    [deleteMutation],
  );

  const handleStart = useCallback(
    (id: string) => {
      if (window.confirm("¿Iniciar este viaje?")) {
        startMutation.mutate(id);
      }
    },
    [startMutation],
  );

  const handleFinish = useCallback(
    (id: string) => navigate(`/trips/${id}/finish`),
    [navigate],
  );

  const handleCancel = useCallback(
    (id: string) => {
      const reason = window.prompt("Motivo de cancelación (opcional):");
      if (reason !== null) {
        cancelMutation.mutate({ id, reason: reason || undefined });
      }
    },
    [cancelMutation],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("search", value);
        else params.delete("search");
        params.set("page", "1"); // Reset to first page on search
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
        params.set("page", "1"); // Reset to first page on filter
        return params;
      });
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", String(newPage));
        return params;
      });
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  // Data
  const trips = data?.items ?? [];
  const pagination = data?.pagination;
  const hasFilters = !!status || !!search;

  // Permissions
  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Viajes</h1>
          <p className="text-muted-foreground">
            Gestiona los viajes de tu flota
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate("/trips/new")}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Viaje
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por código, origen, destino..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select value={status || "all"} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            {Object.entries(TRIP_STATUS_CONFIG).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-2 h-2 rounded-full",
                      config.bgColor
                        .replace("bg-", "bg-")
                        .replace("100", "500"),
                    )}
                  />
                  {config.label}
                </span>
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
          onClick={() => refetch()}
          disabled={isLoading}
        >
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
        </Button>

        {/* View Toggle */}
        <div className="flex border rounded-md">
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

      {/* Results Summary */}
      {pagination && (
        <div className="text-sm text-muted-foreground">
          {pagination.total === 0 ? (
            "No se encontraron viajes"
          ) : (
            <>
              Mostrando{" "}
              <span className="font-medium">
                {(page - 1) * pagination.limit + 1}-
                {Math.min(page * pagination.limit, pagination.total)}
              </span>{" "}
              de <span className="font-medium">{pagination.total}</span> viajes
            </>
          )}
        </div>
      )}

      {/* Content */}
      {viewMode === "table" ? (
        <TripTable
          trips={trips}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelectAll={() =>
            setSelectedIds(
              selectedIds.length === trips.length ? [] : trips.map((t) => t.id),
            )
          }
          onSelectOne={(id) =>
            setSelectedIds((prev) =>
              prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
            )
          }
          isAllSelected={
            trips.length > 0 && selectedIds.length === trips.length
          }
          onView={handleView}
          onEdit={canEdit ? handleEdit : undefined}
          onDelete={canDelete ? handleDelete : undefined}
          onStart={handleStart}
          onFinish={handleFinish}
          onCancel={handleCancel}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Skeleton loading
            Array.from({ length: 6 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))
          ) : trips.length === 0 ? (
            // Empty state
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No se encontraron viajes
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters
                  ? "Intenta ajustar los filtros de búsqueda"
                  : "Comienza creando tu primer viaje"}
              </p>
              {hasFilters ? (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              ) : (
                canCreate && (
                  <Button onClick={() => navigate("/trips/new")}>
                    <Plus className="mr-2 h-4 w-4" /> Crear Viaje
                  </Button>
                )
              )}
            </div>
          ) : (
            // Trip cards
            trips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onView={handleView}
                onEdit={canEdit ? handleEdit : undefined}
                onDelete={canDelete ? handleDelete : undefined}
                onStart={handleStart}
                onFinish={handleFinish}
                onCancel={handleCancel}
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

export default TripsListPage;
