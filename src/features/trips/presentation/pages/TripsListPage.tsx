/**
 * TripsListPage — ADR-0090 WorkbenchPageShell migration.
 *
 * Centro operativo de viajes: awareness strip con buckets por estado,
 * toolbar con filtros ortogonales, tabla/cards como work surface.
 *
 * Decisiones de producto (Capa 1 + dictamen toolbar):
 *   D1 — overdue = toggle en toolbar, no bucket.
 *   D2 — Select de status eliminado de TripListFilters (el strip lo reemplaza).
 *   D3 — Workaround v0.5: N queries limit=1 para obtener counts.
 *   D4 — Buckets condicionados por rol; lean no ve cola fiscal.
 *   D5 — Bucket activo sincroniza con ?status= en query params.
 *   D6 — Default sin bucket activo = todos los viajes.
 *   Toolbar — un recorte, un dueño: cola en scorecard; lookup en search;
 *   retraso en toggle; factura/fecha/sucursal en «Filtros».
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
  ROLES,
} from "@shared/constants/roles";
import { usePermissions, useRole } from "@shared/permissions";
import { BranchStatus, useBranches } from "@features/branches";
import { buildBranchSelectOptions } from "@shared/utils/branchSelectUtils";
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
import { AccountantTripsQueuesAlert } from "../components/AccountantTripsQueuesAlert";
import { DispatcherOrientationStrip } from "../components/DispatcherOrientationStrip";
import { ManagerSatReceptionAlert } from "../components/ManagerSatReceptionAlert";
import { OperatorCostsOrientationAlert } from "../components/OperatorCostsOrientationAlert";
import { ClientPortalOrientationAlert } from "../components/ClientPortalOrientationAlert";
import { DriverPortalOrientationAlert } from "../components/DriverPortalOrientationAlert";
import { tripsListCopy } from "../copy/listCopy";
import {
  type TripWorkbenchBucket,
  BUCKET_TO_STATUS,
  getTripWorkbenchBucketsForRole,
  isTripWorkbenchBucket,
} from "../config/tripWorkbenchConfig";
import { mapTripWorkbenchBuckets } from "../utils/mapTripWorkbenchBuckets";
import {
  resolveTripsListEmptyDescription,
  resolveTripsListPageDescription,
  shouldShowTripsJobEmpty,
} from "../utils/tripsListOrientation";
import { tripsListHref } from "../utils/tripsListHref";

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
  const isDispatcher = role === ROLES.DISPATCHER;
  const isAccountant = role === ROLES.ACCOUNTANT;
  const isManager = role === ROLES.MANAGER;
  const isOperator = role === ROLES.OPERATOR;

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
        showFiscalAttention: !isLeanTripPortal,
        fiscalAttentionDescription: isDispatcher
          ? workbenchCopy.bucketDescriptions.fiscalAttentionEscalate
          : isAccountant
            ? workbenchCopy.bucketDescriptions.fiscalAttentionAccountant
            : isManager
              ? workbenchCopy.bucketDescriptions.fiscalAttentionManager
              : undefined,
        bucketDescriptionOverrides: isClientPortal
          ? {
              scheduled: workbenchCopy.bucketDescriptions.scheduledClient,
              in_progress: workbenchCopy.bucketDescriptions.inProgressClient,
              completed: workbenchCopy.bucketDescriptions.completedClient,
            }
          : undefined,
      }),
    [
      activeBucket,
      fiscalAttentionOnly,
      handleBucketChange,
      handleFiscalAttentionBucketChange,
      isAccountant,
      isClientPortal,
      isDispatcher,
      isManager,
      isLeanTripPortal,
      visibleBuckets,
      workbenchSummary,
    ],
  );

  // ── Filters (shared with toolbar) ──────────────────────────────
  const filters = useListingFilters({
    preserveParamsOnClear: ["status", "fiscalAttention"],
  });

  const { data: branchesResult } = useBranches(
    {
      page: 1,
      limit: 100,
      filters: {
        isActive: true,
        status: BranchStatus.ACTIVE,
      },
      sort: {
        field: "name",
        direction: "asc",
      },
    },
    { enabled: !isLeanTripPortal },
  );

  const originBranchOptions = useMemo(
    () => buildBranchSelectOptions(branchesResult?.data ?? []),
    [branchesResult?.data],
  );

  const originBranchLabelById = useMemo(() => {
    const map = new Map<string, string>();
    for (const option of originBranchOptions) {
      map.set(option.value, option.label);
    }
    return map;
  }, [originBranchOptions]);

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
      enabled: !isLeanTripPortal && !overdueOnly,
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
  const hasInvoiceFilter = !!invoiceStatusFilter;
  const hasOverdueFilter = overdueOnly;
  const hasOriginBranchFilter = Boolean(originBranchFilter);
  const hasPanelFilters =
    hasDateFilter || hasInvoiceFilter || hasOriginBranchFilter;
  const activePanelFilterCount =
    Number(hasDateFilter) +
    Number(hasInvoiceFilter) +
    Number(hasOriginBranchFilter);
  const hasFilters =
    Boolean(filters.search.trim()) ||
    hasDateFilter ||
    hasInvoiceFilter ||
    hasOverdueFilter ||
    hasOriginBranchFilter;

  const canCreate = hasPermission("trips", "create");
  const canEdit = hasPermission("trips", "update");
  const canDelete = hasPermission("trips", "delete");

  const dateFilterChipLabel = copy.chip.date(
    formatListingDateRangeLabel(dateFrom, dateTo, copy.filter.datePlaceholder),
  );

  // ── Callbacks ──────────────────────────────────────────────────
  const handleView = useCallback(
    (id: string) =>
      navigate(`/trips/${id}`, {
        state: { from: tripsListHref(searchParams) },
      }),
    [navigate, searchParams],
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

  const handleOriginBranchChange = useCallback(
    (value: string) => {
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (!value || value === "all") params.delete("originBranchId");
        else params.set("originBranchId", value);
        params.set("page", "1");
        return params;
      });
    },
    [setSearchParams],
  );

  const clearAllTripsFilters = useCallback(() => {
    filters.clearAll();
  }, [filters]);

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
                : originBranchLabelById.get(originBranchIdParam)
                  ? copy.chip.originBranch(
                      originBranchLabelById.get(originBranchIdParam)!,
                    )
                  : copy.chip.originBranchUnknown,
            onRemove: () => handleOriginBranchChange("all"),
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
        : isManager && fiscalAttentionOnly && !hasFilters
          ? copy.empty.fiscalAttentionManagerTitle
          : activeBucket
            ? `No hay viajes ${workbenchCopy.buckets[activeBucket].toLowerCase()}`
            : copy.empty.title;

  const showJobEmpty = shouldShowTripsJobEmpty({
    isLeanTripPortal,
    hasFilters,
    hasActiveBucket: Boolean(activeBucket),
    fiscalAttentionOnly,
    hasOverdueFilter,
    isManager,
    isOperator,
  });

  const emptyDescription = resolveTripsListEmptyDescription({
    hasOverdueFilter,
    hasFilters,
    isClientPortal,
    isDriverPortal,
    isManager,
    isOperator,
    fiscalAttentionOnly,
    showJobEmpty,
  });

  const overdueBanner =
    !isLeanTripPortal && !overdueOnly && overdueTripCount > 0 ? (
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{copy.banner.title}</AlertTitle>
        <AlertDescription>{copy.banner.body(overdueTripCount)}</AlertDescription>
      </Alert>
    ) : null;

  const orientationStrip = isDispatcher ? <DispatcherOrientationStrip /> : null;
  const accountantQueuesAlert = isAccountant ? (
    <AccountantTripsQueuesAlert />
  ) : null;
  const managerSatAlert = isManager ? <ManagerSatReceptionAlert /> : null;
  const operatorCostsAlert = isOperator ? (
    <OperatorCostsOrientationAlert />
  ) : null;
  const driverPortalAlert = isDriverPortal ? (
    <DriverPortalOrientationAlert />
  ) : null;
  const clientPortalAlert = isClientPortal ? (
    <ClientPortalOrientationAlert />
  ) : null;

  const beforeAwareness =
    orientationStrip ||
    accountantQueuesAlert ||
    managerSatAlert ||
    operatorCostsAlert ||
    driverPortalAlert ||
    clientPortalAlert ||
    overdueBanner ? (
      <div className="space-y-3">
        {orientationStrip}
        {accountantQueuesAlert}
        {managerSatAlert}
        {operatorCostsAlert}
        {driverPortalAlert}
        {clientPortalAlert}
        {overdueBanner}
      </div>
    ) : undefined;

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
        description={resolveTripsListPageDescription({
          isClientPortal,
          isDriverPortal,
          isDispatcher,
          isAccountant,
          isManager,
          isOperator,
        })}
        beforeAwareness={beforeAwareness}
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
            className: "sm:w-auto sm:min-w-[20rem] sm:max-w-xl sm:flex-1",
          },
          filters: (
            <>
              {!isLeanTripPortal ? (
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
              ) : null}
              <TripListFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                variant={isLeanTripPortal ? "lean" : "fleet"}
                invoiceStatusFilter={invoiceStatusFilter}
                dateFrom={dateFrom}
                dateTo={dateTo}
                originBranchId={
                  originBranchFilter === "unassigned"
                    ? "unassigned"
                    : originBranchIdParam
                }
                originBranchOptions={originBranchOptions}
                activePanelFilterCount={activePanelFilterCount}
                onInvoiceStatusChange={handleInvoiceStatusChange}
                onApplyDateRange={handleApplyDateRange}
                onClearDateRange={handleClearDateRange}
                onOriginBranchChange={handleOriginBranchChange}
              />
            </>
          ),
          viewMode: filters.viewModeProps,
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
                  {showJobEmpty ? (
                    <div className="text-sm text-muted-foreground">
                      <p>{copy.empty.jobLead}</p>
                      <ol className="mx-auto mt-1.5 max-w-sm list-decimal space-y-0.5 pl-5 text-left">
                        {copy.orientation.steps.map((step) => (
                          <li key={step}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  ) : emptyDescription ? (
                    <p className="text-sm text-muted-foreground">
                      {emptyDescription}
                    </p>
                  ) : null}
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
