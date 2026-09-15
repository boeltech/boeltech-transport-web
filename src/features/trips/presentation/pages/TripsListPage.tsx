/**
 * TripsListPage — ADR-0090 WorkbenchPageShell migration.
 *
 * Centro operativo de viajes: awareness strip con buckets por estado,
 * toolbar con filtros ortogonales, tabla/cards como work surface.
 *
 * Decisiones de producto (Capa 1):
 *   D1 — overdue = toggle en toolbar, no bucket.
 *   D2 — Select de status eliminado de TripListFilters (el strip lo reemplaza).
 *   D3 — Workaround v0.5: N queries limit=1 para obtener counts.
 *   D4 — Buckets condicionados por rol.
 *   D5 — Bucket activo sincroniza con ?status= en query params.
 *   D6 — Default sin bucket activo = todos los viajes.
 */

import { useCallback, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import {
  WorkbenchPageShell,
  type WorkbenchBucket,
} from "@shared/ui/page-shells";
import { useListingFilters, useToast } from "@shared/hooks";
import type { ActiveFilterChip } from "@shared/ui/listing";
import { formatListingDateRangeLabel, ViewModeToggle } from "@shared/ui/listing";
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
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";

import {
  useTrips,
  useDeleteTrip,
  useCancelTrip,
  useTripWorkbenchSummary,
} from "../../application";
import { type TripStatusType } from "../../domain";
import {
  TripTable,
  TripCard,
  TripCardSkeleton,
  TripListFilters,
  parseTripInvoiceStatusFilter,
  getTripInvoiceStatusLabel,
} from "../components";
import { tripsListCopy } from "../copy/listCopy";
import {
  type TripWorkbenchBucket,
  BUCKET_TO_STATUS,
  getTripWorkbenchBucketsForRole,
  isTripWorkbenchBucket,
} from "../config/tripWorkbenchConfig";
import { mapTripWorkbenchBuckets } from "../utils/mapTripWorkbenchBuckets";

const copy = tripsListCopy;
const workbenchCopy = tripsListCopy.workbench;

export function TripsListPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const cancelReasonRef = useRef<HTMLTextAreaElement>(null);

  const role = useRole();
  const isClientPortal = isClientPortalRole(role);
  const isDriverPortal = isDriverPortalRole(role);
  const isLeanTripPortal = isClientPortal || isDriverPortal;

  // ── Workbench summary (D3 workaround v0.5) ──────────────────────
  const {
    summary: workbenchSummary,
    isLoading: summaryLoading,
    isFetching: summaryFetching,
    hasError: summaryHasError,
    refetch: refetchSummary,
  } = useTripWorkbenchSummary();

  // ── Bucket state (D5/D6) ────────────────────────────────────────
  const statusParam = searchParams.get("status") || "";
  const activeBucket: TripWorkbenchBucket | null = isTripWorkbenchBucket(statusParam)
    ? statusParam
    : null;

  const visibleBuckets = useMemo(
    () => getTripWorkbenchBucketsForRole(isClientPortal, isDriverPortal),
    [isClientPortal, isDriverPortal],
  );

  const fiscalAttentionOnly = searchParams.get("fiscalAttention") === "1";

  const handleBucketChange = useCallback(
    (bucket: TripWorkbenchBucket) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        // Toggle: clicking active bucket clears it (back to "all")
        if (activeBucket === bucket && !fiscalAttentionOnly) {
          params.delete("status");
        } else {
          params.set("status", bucket);
          // Mutuamente excluyente con cola de atención fiscal (count global)
          params.delete("fiscalAttention");
        }
        params.set("page", "1");
        return params;
      });
    },
    [activeBucket, fiscalAttentionOnly, setSearchParams],
  );

  const handleFiscalAttentionBucketChange = useCallback(
    (attentionOnly: boolean) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (attentionOnly) {
          params.set("fiscalAttention", "1");
          params.delete("status");
        } else {
          params.delete("fiscalAttention");
        }
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const buckets: WorkbenchBucket[] = useMemo(
    () =>
      mapTripWorkbenchBuckets({
        summary: workbenchSummary,
        visibleBuckets,
        activeBucket,
        onBucketChange: handleBucketChange,
        fiscalAttentionOnly,
        onFiscalAttentionChange: handleFiscalAttentionBucketChange,
      }),
    [
      activeBucket,
      fiscalAttentionOnly,
      handleBucketChange,
      handleFiscalAttentionBucketChange,
      visibleBuckets,
      workbenchSummary,
    ],
  );

  // ── Filters (shared with toolbar) ──────────────────────────────
  const filters = useListingFilters<"status">({
    filters: { status: {} },
    chipLabels: {
      status: (value) => {
        const label =
          workbenchCopy.buckets[value as TripWorkbenchBucket] ?? value;
        return `Estado: ${label}`;
      },
    },
  });

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const overdueOnly = searchParams.get("overdue") === "1";
  const invoiceStatusFilter = parseTripInvoiceStatusFilter(
    searchParams.get("invoiceStatus"),
  );
  const originBranchIdParam = searchParams.get("originBranchId")?.trim() || "";
  const originBranchFilter =
    originBranchIdParam === "unassigned"
      ? ("unassigned" as const)
      : originBranchIdParam || undefined;

  // Derive the status filter from the active bucket
  const statusFilter: TripStatusType | undefined = activeBucket
    ? BUCKET_TO_STATUS[activeBucket]
    : undefined;

  const { data, isLoading, isFetching, refetch } = useTrips({
    page: filters.page,
    limit: 10,
    filters: {
      status: statusFilter || undefined,
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

  // ── Mutations ──────────────────────────────────────────────────
  const deleteMutation = useDeleteTrip({
    onSuccess: () => {
      toast({ title: copy.toast.deleted, variant: "success" });
      refetch();
      refetchSummary();
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
      refetchSummary();
    },
    onError: (error) =>
      toast({
        title: copy.toast.cancelError,
        description: error.message,
        variant: "destructive",
      }),
  });

  // ── Derived state ──────────────────────────────────────────────
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

  const hasPanelFilters = hasDateFilter || hasFiscalFilter || hasOriginBranchFilter;

  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const dateFilterChipLabel = copy.chip.date(
    formatListingDateRangeLabel(dateFrom, dateTo, copy.filter.datePlaceholder),
  );

  // ── Callbacks ──────────────────────────────────────────────────
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
      handleFiscalAttentionBucketChange(attentionOnly);
    },
    [handleFiscalAttentionBucketChange],
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

  const handleOverdueToggle = useCallback(() => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      if (overdueOnly) params.delete("overdue");
      else params.set("overdue", "1");
      params.set("page", "1");
      return params;
    });
  }, [overdueOnly, setSearchParams]);

  const clearAllTripsFilters = useCallback(() => {
    filters.setSearchInput("");
    setSearchParams(new URLSearchParams());
  }, [filters, setSearchParams]);

  const goCreateReserve = useCallback(() => {
    navigate("/trips/new");
  }, [navigate]);

  const handleRefresh = useCallback(async () => {
    await refetch();
    refetchSummary();
    toast({ title: copy.refreshSuccess, variant: "success" });
  }, [refetch, refetchSummary, toast]);

  // ── Active filter chips ────────────────────────────────────────
  const activeFilterChips: ActiveFilterChip[] = [
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

  // ── Empty state per bucket ─────────────────────────────────────
  const emptyTitle = hasOverdueFilter
    ? copy.empty.overdueTitle
    : isClientPortal
      ? copy.empty.titleClient
      : isDriverPortal
        ? copy.empty.titleDriver
        : activeBucket
          ? `No hay viajes ${workbenchCopy.buckets[activeBucket].toLowerCase()}`
          : copy.empty.title;

  const emptyDescription = hasOverdueFilter
    ? copy.empty.overdueDescription
    : hasFilters
      ? copy.empty.filteredDescription
      : isClientPortal
        ? copy.empty.noDataDescriptionClient
        : isDriverPortal
          ? copy.empty.noDataDescriptionDriver
          : copy.empty.noDataDescription;

  return (
    <>
      <WorkbenchPageShell
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
        beforeAwareness={
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
        buckets={buckets}
        bucketsAriaLabel={workbenchCopy.scorecardAriaLabel}
        bucketsLoading={summaryLoading}
        isDegraded={summaryHasError}
        degradedMessage={workbenchCopy.degradedMessage}
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
              fiscalAttentionOnly={fiscalAttentionOnly}
              invoiceStatusFilter={invoiceStatusFilter}
              dateFrom={dateFrom}
              dateTo={dateTo}
              hasActiveFilters={hasPanelFilters}
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
                    onClick={() => handleBucketChange("draft")}
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
              <ViewModeToggle {...filters.viewModeProps} />
            </>
          ),
          onRefresh: handleRefresh,
          isRefreshing: isFetching || summaryFetching,
          activeFilterChips,
          onClearFilters: clearAllTripsFilters,
          hasFilters,
        }}
        renderContent={() => {
          if (isLoading) {
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TripCardSkeleton key={i} />
                ))}
              </div>
            );
          }

          if (trips.length === 0) {
            return (
              <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Search className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1.5">
                  <p className="text-lg font-semibold">{emptyTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {emptyDescription}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {canCreate ? (
                    <Button onClick={goCreateReserve} leftIcon={<CalendarPlus className="h-4 w-4" />}>
                      {copy.actions.create}
                    </Button>
                  ) : null}
                  {hasFilters ? (
                    <Button variant="outline" onClick={clearAllTripsFilters}>
                      {copy.actions.clearFilters}
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          }

          if (filters.viewMode === "cards") {
            return (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onView={handleView}
                    onEdit={canEdit ? handleEdit : undefined}
                    onDelete={canDelete ? handleDelete : undefined}
                    onCancel={canEdit ? handleCancel : undefined}
                    hideClient={isLeanTripPortal}
                  />
                ))}
              </div>
            );
          }

          return (
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
          );
        }}
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
      />

      {/* Delete confirmation */}
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

      {/* Cancel confirmation */}
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
