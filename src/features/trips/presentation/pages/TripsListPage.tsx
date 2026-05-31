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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { useListingFilters, useToast } from "@shared/hooks";
import type { ActiveFilterChip } from "@shared/ui/listing";
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
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { usePermissions } from "@shared/permissions";
import {
  Plus,
  Search,
  Calendar,
  X,
  Filter,
} from "lucide-react";

// Feature imports
import {
  useTrips,
  useDeleteTrip,
  useCancelTrip,
} from "../../application";
import { type TripStatusType, type TripInvoiceStatus } from "../../domain";
import {
  TripTable,
  TripCard,
  TripCardSkeleton,
} from "../components";
import { TRIP_STATUS_CONFIG } from "../index";
import { formatDate } from "@shared/utils/dateUtils";

const EMPTY_TRIP_DATE_DRAFT = { dateFrom: "", dateTo: "" } as const;
type TripDateDraftState = { dateFrom: string; dateTo: string };

const TRIP_INVOICE_STATUS_FILTER_VALUES: TripInvoiceStatus[] = [
  "draft",
  "stamped",
  "cancellation_pending",
  "cancelled",
];

const TRIP_INVOICE_STATUS_LABELS: Record<TripInvoiceStatus, string> = {
  draft: "Borrador",
  stamped: "Timbrada",
  cancellation_pending: "Pend. cancelación SAT",
  cancelled: "Cancelada",
};

function parseInvoiceStatusFilter(
  raw: string | null,
): TripInvoiceStatus | undefined {
  if (!raw) return undefined;
  return TRIP_INVOICE_STATUS_FILTER_VALUES.includes(raw as TripInvoiceStatus)
    ? (raw as TripInvoiceStatus)
    : undefined;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isDateFilterOpen, setIsDateFilterOpen] = useState(false);
  const [dateDraft, setDateDraft] = useState<TripDateDraftState>(EMPTY_TRIP_DATE_DRAFT);

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

  // Filtro de fecha — local porque combina dos params relacionados
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const fiscalAttentionOnly = searchParams.get("fiscalAttention") === "1";
  const invoiceStatusFilter = parseInvoiceStatusFilter(
    searchParams.get("invoiceStatus"),
  );

  const syncDateDraftFromUrl = useCallback(() => {
    setDateDraft({ dateFrom, dateTo });
  }, [dateFrom, dateTo]);

  const handleDatePopoverOpenChange = useCallback(
    (open: boolean) => {
      setIsDateFilterOpen(open);
      if (open) {
        syncDateDraftFromUrl();
      }
    },
    [syncDateDraftFromUrl],
  );

  const dateDraftMatchesApplied = useMemo(
    () => dateDraft.dateFrom === dateFrom && dateDraft.dateTo === dateTo,
    [dateDraft, dateFrom, dateTo],
  );

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
  const hasFilters = filters.hasFilters || hasDateFilter || hasFiscalFilter;

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

  const handleApplyDateFilters = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (dateDraft.dateFrom) params.set("dateFrom", dateDraft.dateFrom);
      else params.delete("dateFrom");
      if (dateDraft.dateTo) params.set("dateTo", dateDraft.dateTo);
      else params.delete("dateTo");
      params.set("page", "1");
      return params;
    });
    setIsDateFilterOpen(false);
  }, [setSearchParams, dateDraft]);

  const handleCancelDatePopover = useCallback(() => {
    setIsDateFilterOpen(false);
  }, []);

  const handleClearDateFilter = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("dateFrom");
      params.delete("dateTo");
      params.set("page", "1");
      return params;
    });
    setDateDraft({ ...EMPTY_TRIP_DATE_DRAFT });
    setIsDateFilterOpen(false);
  }, [setSearchParams]);

  const clearFiscalSearchParams = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.delete("fiscalAttention");
      params.delete("invoiceStatus");
      params.set("page", "1");
      return params;
    });
  }, [setSearchParams]);

  const clearAllTripsFilters = useCallback(() => {
    filters.clearAll();
    handleClearDateFilter();
    clearFiscalSearchParams();
  }, [filters, handleClearDateFilter, clearFiscalSearchParams]);

  const activeFilterChips: ActiveFilterChip[] = [
    ...filters.activeChips,
    ...(fiscalAttentionOnly
      ? [
          {
            id: "fiscal",
            label: "Atención fiscal",
            onRemove: () => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                p.delete("fiscalAttention");
                p.set("page", "1");
                return p;
              });
            },
          },
        ]
      : []),
    ...(invoiceStatusFilter
      ? [
          {
            id: "invoice-status",
            label: `Factura: ${TRIP_INVOICE_STATUS_LABELS[invoiceStatusFilter]}`,
            onRemove: () => {
              setSearchParams((prev) => {
                const p = new URLSearchParams(prev);
                p.delete("invoiceStatus");
                p.set("page", "1");
                return p;
              });
            },
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
  ];

  return (
    <>
      <ListPageShell
        title="Viajes"
        description="Gestiona los viajes de tu flota"
        primaryAction={{
          label: "Nuevo Viaje",
          icon: <Plus className="h-4 w-4" />,
          onClick: () => navigate("/trips/new"),
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: "Buscar por código, origen, destino...",
          },
          filters: (
            <>
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

              <Select
                value={fiscalAttentionOnly ? "yes" : "all"}
                onValueChange={(v) => {
                  setSearchParams((prev) => {
                    const p = new URLSearchParams(prev);
                    if (v === "yes") p.set("fiscalAttention", "1");
                    else p.delete("fiscalAttention");
                    p.set("page", "1");
                    return p;
                  });
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Fiscal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos (fiscal)</SelectItem>
                  <SelectItem value="yes">Solo atención fiscal</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={invoiceStatusFilter ?? "all"}
                onValueChange={(v) => {
                  setSearchParams((prev) => {
                    const p = new URLSearchParams(prev);
                    if (v === "all") p.delete("invoiceStatus");
                    else p.set("invoiceStatus", v);
                    p.set("page", "1");
                    return p;
                  });
                }}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Estado factura" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las facturas</SelectItem>
                  {TRIP_INVOICE_STATUS_FILTER_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {TRIP_INVOICE_STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover open={isDateFilterOpen} onOpenChange={handleDatePopoverOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant={hasDateFilter ? "secondary" : "outline"}
                    className={cn(
                      "w-auto justify-start text-left font-normal",
                      hasDateFilter && "pr-2",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span className="max-w-[260px] truncate">{dateFilterText}</span>
                    {hasDateFilter ? (
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-2 rounded p-1 hover:bg-muted"
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
                    ) : null}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[24rem] p-4" align="start">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 font-medium">
                      <Filter className="h-4 w-4" />
                      Filtrar por fecha de salida
                    </div>

                    <div className="space-y-2 border-b pb-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor="trips-date-from">Desde</Label>
                          <Input
                            id="trips-date-from"
                            type="date"
                            value={dateDraft.dateFrom}
                            max={dateDraft.dateTo || undefined}
                            onChange={(e) =>
                              setDateDraft((d) => ({ ...d, dateFrom: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="trips-date-to">Hasta</Label>
                          <Input
                            id="trips-date-to"
                            type="date"
                            value={dateDraft.dateTo}
                            min={dateDraft.dateFrom || undefined}
                            onChange={(e) =>
                              setDateDraft((d) => ({ ...d, dateTo: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">Rango rápido</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date().toISOString().split("T")[0];
                            setDateDraft({ dateFrom: today, dateTo: today });
                          }}
                        >
                          Hoy
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            const weekAgo = new Date(today);
                            weekAgo.setDate(today.getDate() - 7);
                            setDateDraft({
                              dateFrom: weekAgo.toISOString().split("T")[0],
                              dateTo: today.toISOString().split("T")[0],
                            });
                          }}
                        >
                          Última semana
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            const monthAgo = new Date(today);
                            monthAgo.setMonth(today.getMonth() - 1);
                            setDateDraft({
                              dateFrom: monthAgo.toISOString().split("T")[0],
                              dateTo: today.toISOString().split("T")[0],
                            });
                          }}
                        >
                          Último mes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            const firstDay = new Date(
                              today.getFullYear(),
                              today.getMonth(),
                              1,
                            );
                            setDateDraft({
                              dateFrom: firstDay.toISOString().split("T")[0],
                              dateTo: today.toISOString().split("T")[0],
                            });
                          }}
                        >
                          Este mes
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
                      {hasDateFilter ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="justify-start text-muted-foreground sm:order-1"
                          onClick={handleClearDateFilter}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Limpiar fechas
                        </Button>
                      ) : (
                        <span className="hidden sm:block sm:order-1" />
                      )}
                      <div className="flex w-full gap-2 sm:order-2 sm:w-auto sm:justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          onClick={handleCancelDatePopover}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          className="flex-1 sm:flex-none"
                          disabled={dateDraftMatchesApplied}
                          onClick={handleApplyDateFilters}
                        >
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </>
          ),
          onRefresh: async () => {
            await refetch();
            toast({ title: "Lista actualizada", variant: "success" });
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
            onCancel={handleCancel}
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
              onCancel={handleCancel}
            />
          ))
        }
        renderCardSkeleton={() => <TripCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: "No se encontraron viajes",
          description: hasFilters
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
                    &quot;Cancelado&quot;.
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
