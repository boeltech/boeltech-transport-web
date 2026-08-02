/**
 * TripsListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página principal de listado de viajes.
 * Sin selección múltiple (checkboxes).
 *
 * Ubicación: src/features/trips/presentation/pages/TripsListPage.tsx
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { useListingFilters, useToast } from "@shared/hooks";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { formatListingDateRangeLabel } from "@shared/ui/listing";
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
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { usePermissions } from "@shared/permissions";
import { Plus, Search, AlertTriangle, Clock, CalendarPlus } from "lucide-react";

// Feature imports
import {
  useTrips,
  useDeleteTrip,
  useCancelTrip,
} from "../../application";
import { type TripStatusType, TripStatus } from "../../domain";
import {
  TripTable,
  TripCard,
  TripCardSkeleton,
  TripListFilters,
  parseTripInvoiceStatusFilter,
  getTripInvoiceStatusLabel,
} from "../components";
import { TRIP_STATUS_CONFIG } from "../index";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { tripsListCopy } from "../copy/listCopy";

// ============================================================================
// COMPONENT
// ============================================================================

export function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Estado para diálogos de confirmación
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);

  // Filtros principales (search + status + viewMode + paginación) vía hook compartido
  const filters = useListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) =>
        `Estado: ${TRIP_STATUS_CONFIG[value as TripStatusType]?.label || value}`,
    },
  });
  const status = (filters.filters.status || null) as TripStatusType | null;

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const fiscalAttentionOnly = searchParams.get("fiscalAttention") === "1";
  const overdueOnly = searchParams.get("overdue") === "1";
  const invoiceStatusFilter = parseTripInvoiceStatusFilter(
    searchParams.get("invoiceStatus"),
  );
  const originBranchIdParam = searchParams.get("originBranchId")?.trim() || "";
  const originBranchFilter =
    originBranchIdParam === "unassigned"
      ? ("unassigned" as const)
      : originBranchIdParam || undefined;

  // Fetch trips
  const { data, isLoading, isFetching, refetch } = useTrips({
    page: filters.page,
    limit: 10,
    filters: {
      status: status || undefined,
      search: filters.search || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      requiresFiscalAttention: fiscalAttentionOnly ? true : undefined,
      invoiceStatus: invoiceStatusFilter,
      overdueOnly: overdueOnly ? true : undefined,
      originBranchId: originBranchFilter,
    },
    sort: { field: "scheduled_departure", direction: "desc" },
  });

  const { data: overdueCountData } = useTrips(
    {
      page: 1,
      limit: 1,
      filters: { overdueOnly: true },
    },
    {
      staleTime: 60_000,
      enabled: !overdueOnly,
    },
  );

  const overdueTripCount = overdueCountData?.pagination.total ?? 0;

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
  const trips = useMemo(() => data?.data ?? [], [data?.data]);
  const pagination = data?.pagination;
  const hasDateFilter = !!dateFrom || !!dateTo;
  const hasFiscalFilter = fiscalAttentionOnly || !!invoiceStatusFilter;
  const hasOverdueFilter = overdueOnly;
  const hasOriginBranchFilter = Boolean(originBranchFilter);
  const hasFilters =
    filters.hasFilters ||
    hasDateFilter ||
    hasFiscalFilter ||
    hasOverdueFilter ||
    hasOriginBranchFilter;

  // Permissions
  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const dateFilterChipLabel = tripsListCopy.chip.date(
    formatListingDateRangeLabel(
      dateFrom,
      dateTo,
      tripsListCopy.filter.datePlaceholder,
    ),
  );

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

  const handleStatusChange = useCallback(
    (value: string) => {
      filters.setFilter("status", value);
    },
    [filters],
  );

  const handleApplyDateRange = useCallback(
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

  const handleClearDateRange = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("dateFrom");
      params.delete("dateTo");
      params.set("page", "1");
      return params;
    });
  }, [setSearchParams]);

  const handleFiscalAttentionChange = useCallback(
    (attentionOnly: boolean) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (attentionOnly) params.set("fiscalAttention", "1");
        else params.delete("fiscalAttention");
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const handleInvoiceStatusChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (value === "all") params.delete("invoiceStatus");
        else params.set("invoiceStatus", value);
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const clearAllTripsFilters = useCallback(() => {
    filters.setSearchInput("");
    setSearchParams(new URLSearchParams());
  }, [filters, setSearchParams]);

  const handleOverdueToggle = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (overdueOnly) params.delete("overdue");
      else params.set("overdue", "1");
      params.set("page", "1");
      return params;
    });
  }, [overdueOnly, setSearchParams]);

  const activeFilterChips: ActiveFilterChip[] = [
    ...filters.activeChips,
    ...(fiscalAttentionOnly
      ? [
          {
            id: "fiscal",
            label: tripsListCopy.chip.fiscalAttention,
            onRemove: () => handleFiscalAttentionChange(false),
          },
        ]
      : []),
    ...(invoiceStatusFilter
      ? [
          {
            id: "invoice-status",
            label: tripsListCopy.chip.invoice(
              getTripInvoiceStatusLabel(invoiceStatusFilter),
            ),
            onRemove: () => handleInvoiceStatusChange("all"),
          },
        ]
      : []),
    ...(hasOverdueFilter
      ? [
          {
            id: "overdue",
            label: tripsListCopy.chip.overdue,
            onRemove: () => {
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.delete("overdue");
                params.set("page", "1");
                return params;
              });
            },
          },
        ]
      : []),
    ...(hasOriginBranchFilter
      ? [
          {
            id: "origin-branch",
            label:
              originBranchFilter === "unassigned"
                ? tripsListCopy.chip.originBranchUnassigned
                : tripsListCopy.chip.originBranch(originBranchIdParam),
            onRemove: () => {
              setSearchParams((prev) => {
                const params = new URLSearchParams(prev);
                params.delete("originBranchId");
                params.set("page", "1");
                return params;
              });
            },
          },
        ]
      : []),
    ...(hasDateFilter
      ? [
          {
            id: "date",
            label: dateFilterChipLabel,
            onRemove: handleClearDateRange,
          },
        ]
      : []),
  ];

  return (
    <>
      <ListPageShell
        title="Viajes"
        description="Gestiona los viajes de tu flota"
        beforeToolbar={
          !overdueOnly && overdueTripCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{tripsListCopy.banner.title}</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{tripsListCopy.banner.body(overdueTripCount)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-warning/40 bg-background"
                  onClick={handleOverdueToggle}
                >
                  {tripsListCopy.banner.action}
                </Button>
              </AlertDescription>
            </Alert>
          ) : undefined
        }
        primaryAction={{
          label: tripsListCopy.actions.reserve,
          icon: <CalendarPlus className="h-4 w-4" />,
          onClick: () => navigate("/trips/new?intent=reserve"),
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: tripsListCopy.filter.searchPlaceholder,
          },
          filters: (
            <TripListFilters
              status={status}
              fiscalAttentionOnly={fiscalAttentionOnly}
              invoiceStatusFilter={invoiceStatusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              onStatusChange={handleStatusChange}
              onFiscalAttentionChange={handleFiscalAttentionChange}
              onInvoiceStatusChange={handleInvoiceStatusChange}
              onApplyDateRange={handleApplyDateRange}
              onClearDateRange={handleClearDateRange}
            />
          ),
          extraActions: (
            <>
              {canCreate ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/trips/new")}
                >
                  <Plus className="h-4 w-4" />
                  {tripsListCopy.actions.createFull}
                </Button>
              ) : null}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => filters.setFilter("status", TripStatus.DRAFT)}
              >
                {tripsListCopy.actions.viewDrafts}
              </Button>
              <Button
                type="button"
                variant={overdueOnly ? "secondary" : "outline"}
                size="sm"
                className={cn(
                  overdueOnly &&
                    "border-warning/30 bg-warning-soft text-warning-soft-foreground hover:bg-warning-soft/80",
                )}
                onClick={handleOverdueToggle}
              >
                <Clock className="mr-2 h-4 w-4" />
                {tripsListCopy.filter.overdue}
              </Button>
            </>
          ),
          onRefresh: async () => {
            await refetch();
            toast({ title: tripsListCopy.refreshSuccess, variant: "success" });
          },
          isRefreshing: isFetching,
          activeFilterChips,
          onClearFilters: clearAllTripsFilters,
          hasFilters,
          viewMode: filters.viewModeProps,
        }}
        isLoading={isLoading}
        items={trips}
        pagination={
          pagination
            ? {
                page: filters.page,
                totalPages: pagination.totalPages,
                total: pagination.total,
                limit: pagination.limit,
              }
            : undefined
        }
        onPageChange={filters.setPage}
        entityLabelPlural="viajes"
        renderTable={() => (
          <TripTable
            trips={trips}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onCancel={canEdit ? handleCancel : undefined}
          />
        )}
        renderCards={() =>
          trips.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onView={handleView}
              onEdit={canEdit ? handleEdit : undefined}
              onDelete={canDelete ? handleDelete : undefined}
              onCancel={canEdit ? handleCancel : undefined}
            />
          ))
        }
        renderCardSkeleton={() => <TripCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: hasOverdueFilter
            ? tripsListCopy.empty.overdueTitle
            : "No se encontraron viajes",
          description: hasOverdueFilter
            ? tripsListCopy.empty.overdueDescription
            : hasFilters
              ? "Intenta ajustar los filtros de búsqueda"
              : "Comienza creando tu primer viaje",
          cta: canCreate
            ? {
                label: "Nuevo Viaje",
                icon: <Plus className="h-4 w-4" />,
                onClick: () => navigate("/trips/new"),
              }
            : undefined,
          secondaryCta: hasFilters
            ? {
                label: "Limpiar filtros",
                onClick: clearAllTripsFilters,
                variant: "outline",
              }
            : undefined,
        }}
      />

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
      {/* DIÁLOGO: Cancelar viaje con motivo                               */}
      {/* ================================================================ */}
      <Dialog
        open={!!cancelDialogId}
        onOpenChange={(open) => !open && setCancelDialogId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <SectionHeadingWithHint
                title="Cancelar viaje"
                titleClassName="text-lg font-semibold leading-none tracking-tight"
                hintLabel="Cancelar viaje"
                hint={
                  <>
                    ¿Está seguro de que desea cancelar este viaje? Esta acción cambiará el estado a
                    «Cancelado».
                  </>
                }
              />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
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
    </>
  );
}
