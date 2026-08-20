/**
 * TripsListPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Listado de viajes: operación primero, factura secundaria.
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
import {
  isClientPortalRole,
  isDriverPortalRole,
} from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { Search, AlertTriangle, Clock, CalendarPlus } from "lucide-react";

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

const copy = tripsListCopy;

export function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);

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

  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: copy.toast.deleted, variant: "success" });
      refetch();
    },
    onError: (error) => {
      toast({
        title: copy.toast.deleteError,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useCancelTrip({
    onSuccess: () => {
      toast({ title: copy.toast.cancelled, variant: "success" });
      refetch();
    },
    onError: (error) =>
      toast({
        title: copy.toast.cancelError,
        description: error.message,
        variant: "destructive",
      }),
  });

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

  /** Filtros del panel (sin búsqueda ni overdue toggle de toolbar). */
  const hasPanelFilters =
    Boolean(status) ||
    hasDateFilter ||
    hasFiscalFilter ||
    hasOriginBranchFilter;

  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");
  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const isDriverPortal = isDriverPortalRole(role);
  const isLeanTripPortal = isClientPortal || isDriverPortal;

  const dateFilterChipLabel = copy.chip.date(
    formatListingDateRangeLabel(
      dateFrom,
      dateTo,
      copy.filter.datePlaceholder,
    ),
  );

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

  const goCreateReserve = useCallback(() => {
    navigate("/trips/new");
  }, [navigate]);

  const activeFilterChips: ActiveFilterChip[] = [
    ...filters.activeChips,
    ...(fiscalAttentionOnly
      ? [
          {
            id: "fiscal",
            label: copy.chip.fiscalAttention,
            onRemove: () => handleFiscalAttentionChange(false),
          },
        ]
      : []),
    ...(invoiceStatusFilter
      ? [
          {
            id: "invoice-status",
            label: copy.chip.invoice(
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
            label: copy.chip.overdue,
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
                ? copy.chip.originBranchUnassigned
                : copy.chip.originBranch(originBranchIdParam),
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
        title={
          isClientPortal
            ? copy.page.titleClient
            : isDriverPortal
              ? copy.page.titleDriver
              : copy.page.title
        }
        description={
          isClientPortal
            ? copy.page.descriptionClient
            : isDriverPortal
              ? copy.page.descriptionDriver
              : copy.page.description
        }
        beforeToolbar={
          !isLeanTripPortal && !overdueOnly && overdueTripCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>{copy.banner.title}</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{copy.banner.body(overdueTripCount)}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-warning/40 bg-background"
                  onClick={handleOverdueToggle}
                >
                  {copy.banner.action}
                </Button>
              </AlertDescription>
            </Alert>
          ) : undefined
        }
        primaryAction={{
          label: copy.actions.create,
          icon: <CalendarPlus className="h-4 w-4" />,
          onClick: goCreateReserve,
          visible: canCreate,
        }}
        toolbar={{
          search: {
            ...filters.searchProps,
            placeholder: isClientPortal
              ? copy.filter.searchPlaceholderClient
              : isDriverPortal
                ? copy.filter.searchPlaceholderDriver
                : copy.filter.searchPlaceholder,
          },
          filters: (
            <TripListFilters
              key={hasPanelFilters ? "filters-active" : "filters-idle"}
              status={status}
              fiscalAttentionOnly={fiscalAttentionOnly}
              invoiceStatusFilter={invoiceStatusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              hasActiveFilters={hasPanelFilters}
              onStatusChange={handleStatusChange}
              onFiscalAttentionChange={handleFiscalAttentionChange}
              onInvoiceStatusChange={handleInvoiceStatusChange}
              onApplyDateRange={handleApplyDateRange}
              onClearDateRange={handleClearDateRange}
              hideInvoiceFilters={isLeanTripPortal}
            />
          ),
          extraActions: (
            <>
              {!isLeanTripPortal ? (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      filters.setFilter("status", TripStatus.DRAFT)
                    }
                  >
                    {copy.actions.viewDrafts}
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
                    {copy.filter.overdue}
                  </Button>
                </>
              ) : null}
            </>
          ),
          onRefresh: async () => {
            await refetch();
            toast({ title: copy.refreshSuccess, variant: "success" });
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
        entityLabelPlural={
          isClientPortal
            ? copy.entityLabelPluralClient
            : isDriverPortal
              ? copy.entityLabelPluralDriver
              : copy.entityLabelPlural
        }
        renderTable={() => (
          <TripTable
            trips={trips}
            isLoading={isLoading}
            onView={handleView}
            onEdit={canEdit ? handleEdit : undefined}
            onDelete={canDelete ? handleDelete : undefined}
            onCancel={canEdit ? handleCancel : undefined}
            hideClientColumn={isLeanTripPortal}
            hideFiscalAttentionBadge={isLeanTripPortal}
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
              hideClient={isLeanTripPortal}
            />
          ))
        }
        renderCardSkeleton={() => <TripCardSkeleton />}
        emptyState={{
          icon: <Search className="h-10 w-10 text-muted-foreground" />,
          title: hasOverdueFilter
            ? copy.empty.overdueTitle
            : isClientPortal
              ? copy.empty.titleClient
              : isDriverPortal
                ? copy.empty.titleDriver
                : copy.empty.title,
          description: hasOverdueFilter
            ? copy.empty.overdueDescription
            : hasFilters
              ? copy.empty.filteredDescription
              : isClientPortal
                ? copy.empty.noDataDescriptionClient
                : isDriverPortal
                  ? copy.empty.noDataDescriptionDriver
                  : copy.empty.noDataDescription,
          cta: canCreate
            ? {
                label: copy.actions.create,
                icon: <CalendarPlus className="h-4 w-4" />,
                onClick: goCreateReserve,
              }
            : undefined,
          secondaryCta: hasFilters
            ? {
                label: copy.actions.clearFilters,
                onClick: clearAllTripsFilters,
                variant: "outline",
              }
            : undefined,
        }}
      />

      <AlertDialog
        open={!!pendingDeleteId}
        onOpenChange={(open) => !open && setPendingDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.dialog.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.dialog.deleteDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{copy.dialog.deleteCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {copy.dialog.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={!!cancelDialogId}
        onOpenChange={(open) => !open && setCancelDialogId(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              <SectionHeadingWithHint
                title={copy.dialog.cancelTitle}
                titleClassName="text-lg font-semibold leading-none tracking-tight"
                hintLabel={copy.dialog.cancelTitle}
                hint={copy.dialog.cancelHint}
              />
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                {copy.dialog.cancelReasonLabel}{" "}
                <span className="font-normal text-muted-foreground">
                  {copy.dialog.cancelReasonOptional}
                </span>
              </label>
              <Textarea
                ref={cancelReasonRef}
                placeholder={copy.dialog.cancelReasonPlaceholder}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogId(null)}>
              {copy.dialog.cancelBack}
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              {copy.dialog.cancelConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
