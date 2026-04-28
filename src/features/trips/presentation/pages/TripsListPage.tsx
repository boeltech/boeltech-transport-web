/**
 * TripsListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de viajes.
 * Sin selección múltiple (checkboxes).
 *
 * Ubicación: src/features/trips/presentation/pages/TripsListPage.tsx
 */

import { useCallback, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useDebouncedSearchParam } from "@shared/hooks";
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
import { Popover, PopoverContent, PopoverTrigger } from "@shared/ui/popover";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@shared/ui/dialog";
import { Textarea } from "@shared/ui/text-area";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import {
  Plus,
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

  // Estado para diálogos de confirmación
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingStartId, setPendingStartId] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);

  // Parse URL params
  const page = parseInt(searchParams.get("page") || "1", 10);
  const status = searchParams.get("status") as TripStatusType | null;
  const search = searchParams.get("search") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const { searchInput, setSearchInput } = useDebouncedSearchParam(
    search,
    setSearchParams,
  );

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

  const handleDelete = useCallback((id: string) => {
    setPendingDeleteId(id);
  }, []);

  const confirmDelete = useCallback(() => {
    if (pendingDeleteId) deleteMutation.mutate(pendingDeleteId);
    setPendingDeleteId(null);
  }, [pendingDeleteId, deleteMutation]);

  const handleStart = useCallback((id: string) => {
    setPendingStartId(id);
  }, []);

  const confirmStart = useCallback(() => {
    if (pendingStartId) startMutation.mutate({ id: pendingStartId });
    setPendingStartId(null);
  }, [pendingStartId, startMutation]);

  const handleFinish = useCallback(
    (id: string) => navigate(`/trips/${id}/finish`),
    [navigate],
  );

  const handleCancel = useCallback((id: string) => {
    setCancelReason("");
    setCancelDialogId(id);
  }, []);

  const confirmCancel = useCallback(() => {
    if (cancelDialogId) {
      cancelMutation.mutate({
        id: cancelDialogId,
        reason: cancelReason || undefined,
      });
    }
    setCancelDialogId(null);
    setCancelReason("");
  }, [cancelDialogId, cancelReason, cancelMutation]);

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
          <ListingSearchInput
            placeholder="Buscar por código, origen, destino..."
            value={searchInput}
            onChange={handleSearchChange}
          />

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
                    label: `Estado: ${TRIP_STATUS_CONFIG[status]?.label || status}`,
                    onRemove: () => handleStatusChange("all"),
                  },
                ]
              : []),
            ...(hasDateFilter
              ? [
                  {
                    id: "date",
                    label: `Fecha: ${dateFilterText}`,
                    onRemove: handleClearDateFilter,
                  },
                ]
              : []),
          ]}
        />
      </div>

      {/* Results Summary */}
      {pagination && (
        <ListingResultsSummary
          entityLabelPlural="viajes"
          total={pagination.total}
          page={page}
          limit={pagination.limit}
        />
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
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Viaje
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
      {pagination && (
        <ListingPagination
          page={page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* ================================================================ */}
      {/* DIÁLOGO: Confirmar eliminación                                   */}
      {/* ================================================================ */}
      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El viaje y todos sus datos
              asociados (paradas, cargas y gastos) serán eliminados
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================ */}
      {/* DIÁLOGO: Confirmar inicio de viaje                               */}
      {/* ================================================================ */}
      <AlertDialog
        open={!!pendingStartId}
        onOpenChange={(open) => !open && setPendingStartId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Iniciar viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              El viaje cambiará a estado "En progreso". Asegúrese de que el
              vehículo y el conductor estén listos para salir.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmStart}>
              Iniciar viaje
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ================================================================ */}
      {/* DIÁLOGO: Cancelar viaje con motivo                               */}
      {/* ================================================================ */}
      <Dialog
        open={!!cancelDialogId}
        onOpenChange={(open) => !open && setCancelDialogId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancelar viaje</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              ¿Está seguro de que desea cancelar este viaje? Esta acción
              cambiará el estado a "Cancelado".
            </p>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                Motivo de cancelación{" "}
                <span className="text-muted-foreground font-normal">
                  (opcional)
                </span>
              </label>
              <Textarea
                ref={cancelReasonRef}
                placeholder="Ej: Cliente solicitó cancelación, condiciones climáticas adversas..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogId(null)}>
              Volver
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Cancelar viaje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
