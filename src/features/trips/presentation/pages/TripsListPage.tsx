/**
 * TripsListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de viajes.
 * Sin selección múltiple (checkboxes).
 *
 * Ubicación: src/features/trips/presentation/pages/TripsListPage.tsx
 */

import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  Plus,
  LayoutGrid,
  LayoutList,
  Search,
  RefreshCw,
  Calendar,
  X,
  Filter,
} from "lucide-react";

// Feature imports
import {
  useTrips,
  useDeleteTrip,
  useStartTrip,
  useCancelTrip,
} from "../../application";
import { type TripStatusType } from "../../domain";
import { TripTable, TripCard, TripCardSkeleton } from "../components";
import { TRIP_STATUS_CONFIG } from "../index";
import { generatePageNumbers } from "@shared/lib/utils/generatePageNumbers";
import { formatDate } from "@shared/utils/dateUtils";

// ============================================================================
// TYPES
// ============================================================================

type ViewMode = "table" | "cards";

// ============================================================================
// COMPONENT
// ============================================================================

export function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") as TripStatusType | null;
  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  // Fetch trips
  const { data, isLoading, isFetching, refetch } = useTrips({
    page,
    limit: 10,
    filters: {
      status: status || undefined,
      search: search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    },
    sort: { field: "scheduled_departure", direction: "desc" },
  });

  // Mutations
  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: "Viaje eliminado", variant: "success" });
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

  // Data
  const trips = data?.data ?? [];
  const pagination = data?.pagination;
  const hasFilters = !!status || !!search || !!dateFrom || !!dateTo;
  const hasDateFilter = !!dateFrom || !!dateTo;

  // Permissions
  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  // Date filter display text
  const dateFilterText = hasDateFilter
    ? dateFrom && dateTo
      ? `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
      : dateFrom
        ? `Desde ${formatDate(dateFrom)}`
        : `Hasta ${formatDate(dateTo)}`
    : "Filtrar por fecha";

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
        startMutation.mutate({ id });
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

  const handleDateFromChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("dateFrom", value);
        else params.delete("dateFrom");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleDateToChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value) params.set("dateTo", value);
        else params.delete("dateTo");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  // ============================================================================
  // FIX: Handler combinado para setear ambas fechas en una sola operación
  // Esto evita el race condition cuando se llaman dos setSearchParams seguidos
  // ============================================================================
  const handleDateRangeChange = useCallback(
    (from: string, to: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (from) params.set("dateFrom", from);
        else params.delete("dateFrom");
        if (to) params.set("dateTo", to);
        else params.delete("dateTo");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleClearDateFilter = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("dateFrom");
      params.delete("dateTo");
      params.set("page", "1");
      return params;
    });
    setIsDateFilterOpen(false);
  }, [setSearchParams]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.set("page", String(newPage));
        return params;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [setSearchParams],
  );

  const handleClearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

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
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, origen, destino..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8"
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

          {/* Date Range Filter */}
          <Popover open={isDateFilterOpen} onOpenChange={setIsDateFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={hasDateFilter ? "secondary" : "outline"}
                className={cn(
                  "w-auto justify-start text-left font-normal",
                  hasDateFilter && "pr-2",
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                <span className="truncate max-w-[200px]">{dateFilterText}</span>
                {hasDateFilter && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-2 p-1 hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearDateFilter();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        handleClearDateFilter();
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
              <div className="space-y-4">
                <div className="font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrar por fecha de salida
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dateFrom">Desde</Label>
                    <Input
                      id="dateFrom"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => handleDateFromChange(e.target.value)}
                      max={dateTo || undefined}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateTo">Hasta</Label>
                    <Input
                      id="dateTo"
                      type="date"
                      value={dateTo}
                      onChange={(e) => handleDateToChange(e.target.value)}
                      min={dateFrom || undefined}
                    />
                  </div>
                </div>

                {/* Quick filters - CORREGIDO: Usar handleDateRangeChange */}
                <div className="flex flex-wrap gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split("T")[0];
                      handleDateRangeChange(today, today);
                    }}
                  >
                    Hoy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(today.getDate() - 7);
                      handleDateRangeChange(
                        weekAgo.toISOString().split("T")[0],
                        today.toISOString().split("T")[0],
                      );
                    }}
                  >
                    Última semana
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setMonth(today.getMonth() - 1);
                      handleDateRangeChange(
                        monthAgo.toISOString().split("T")[0],
                        today.toISOString().split("T")[0],
                      );
                    }}
                  >
                    Último mes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const firstDay = new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1,
                      );
                      handleDateRangeChange(
                        firstDay.toISOString().split("T")[0],
                        today.toISOString().split("T")[0],
                      );
                    }}
                  >
                    Este mes
                  </Button>
                </div>

                {hasDateFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={handleClearDateFilter}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Limpiar fechas
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

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
                Estado: {TRIP_STATUS_CONFIG[status]?.label || status}
                <button
                  onClick={() => handleStatusChange("all")}
                  className="hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {hasDateFilter && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary rounded-md">
                Fecha: {dateFilterText}
                <button
                  onClick={handleClearDateFilter}
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
            Array.from({ length: 6 }).map((_, i) => (
              <TripCardSkeleton key={i} />
            ))
          ) : trips.length === 0 ? (
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
