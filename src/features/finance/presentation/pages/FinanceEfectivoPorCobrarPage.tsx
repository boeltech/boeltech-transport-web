/**
 * Bandeja «Cobros sin factura» — F2 Workbench (C1–C5, C11).
 * Misma anatomía que Facturas a crédito: WorkbenchPageShell + buckets +
 * tabla agrupada por cliente con casilla de grupo + «Cobros de hoy».
 */

import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowUpRight, HandCoins, Search, Send } from "lucide-react";
import { WorkbenchPageShell, type WorkbenchBucket } from "@shared/ui/page-shells";
import { type ActiveFilterChip } from "@shared/ui/listing";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { DetailAlertCard } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListGroup,
  type EntityListGroupHeader,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { usePermissions } from "@shared/permissions";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useActiveClients } from "@features/clients/application";
import { getClientDisplayName } from "@features/clients/domain";
import {
  buildRegisterCollectionPath,
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_CLIENT_ID_PARAM,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
  OPERATIONAL_CASH_PENDING_PAGE_SIZE,
  useFinanceListingFilters,
  useOperationalCashPending,
} from "@features/finance/application";
import {
  OPERATIONAL_PAYMENT_INSTRUMENT_LABELS,
  type OperationalCashPendingTrip,
} from "@features/finance/domain";
import type { TripStatusType } from "@features/trips/domain";
import { TripStatusBadge } from "@features/trips/presentation";
import { financeCopy } from "../copy";
import {
  operationalCashClientKey,
  groupOperationalCashPendingByClient,
} from "../utils/groupOperationalCashPending";
import { FinanceCobrosTodayTray } from "../components/FinanceCobrosTodayTray";
import {
  clearCobrosTodayTray,
  readCobrosTodayTray,
  removeCobrosTodayEntry,
  writeCobrosTodayTray,
  type CobrosTodayEntry,
} from "../utils/cobrosFollowThrough";
import { useQueryErrorToast } from "@shared/hooks";

const copy = financeCopy.efectivoPorCobrar;
const CLIENT_FILTER_ALL = "__all__";

// ============================================================================
// Client filter
// ============================================================================

function ClientToolbarFilter({
  value,
  onChange,
  options,
  isLoading,
}: {
  value: string;
  onChange: (clientId: string) => void;
  options: Array<{ id: string; label: string }>;
  isLoading?: boolean;
}) {
  return (
    <div className="min-w-[12rem] max-w-xs flex-1 sm:flex-none">
      <Label htmlFor="efectivo-client-filter" className="sr-only">
        {copy.clientFilterLabel}
      </Label>
      <Select
        value={value || CLIENT_FILTER_ALL}
        onValueChange={(next) =>
          onChange(next === CLIENT_FILTER_ALL ? "" : next)
        }
        disabled={isLoading}
      >
        <SelectTrigger id="efectivo-client-filter" className="max-w-xs">
          <SelectValue placeholder={copy.clientFilterPlaceholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CLIENT_FILTER_ALL}>
            {copy.clientFilterAll}
          </SelectItem>
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================================
// Table columns
// ============================================================================

function buildColumns(opts: {
  selected: Record<string, boolean>;
  anchorClientKey: string | null;
  onToggle: (trip: OperationalCashPendingTrip, checked: boolean) => void;
}): EntityListColumnDef<OperationalCashPendingTrip>[] {
  const { selected, anchorClientKey, onToggle } = opts;

  return [
    {
      id: "select",
      header: "",
      kind: "text",
      className: "w-10",
      headerClassName: "w-10",
      accessor: (trip) => {
        const key = operationalCashClientKey(trip.clientId);
        const selectable = !anchorClientKey || anchorClientKey === key;
        return (
          <span data-no-row-nav="" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={Boolean(selected[trip.id])}
              disabled={!selectable}
              onCheckedChange={(checked) =>
                onToggle(trip, checked === true)
              }
              aria-label={`Seleccionar viaje ${trip.code}`}
            />
          </span>
        );
      },
    },
    {
      id: "trip",
      header: copy.columns.trip,
      kind: "primary",
      accessor: (trip) => trip.code,
    },
    {
      id: "departure",
      header: copy.columns.departure,
      kind: "date",
      accessor: (trip) => trip.scheduledDeparture,
    },
    {
      id: "status",
      header: copy.columns.status,
      kind: "status",
      accessor: (trip) => (
        <TripStatusBadge status={trip.status as TripStatusType} />
      ),
    },
    {
      id: "baseRate",
      header: "Tarifa (MXN)",
      kind: "money",
      accessor: (trip) => trip.baseRate,
    },
    {
      id: "collected",
      header: "Cobrado (MXN)",
      kind: "stacked",
      stackedWeight: "normal",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (trip): EntityListStackedValue | null => {
        const total = trip.operationalCash.collectedTotal;
        if (total <= 0) return null;
        const receipt = trip.lastActiveReceipt;
        const instrument = receipt
          ? OPERATIONAL_PAYMENT_INSTRUMENT_LABELS[receipt.paymentInstrument]
          : undefined;
        return {
          primary: (
            <span className="font-mono tabular-nums">
              {formatMxCurrency(total)}
            </span>
          ),
          secondary: instrument ?? undefined,
        };
      },
    },
    {
      id: "pending",
      header: "Por cobrar (MXN)",
      kind: "money",
      className: "font-semibold",
      accessor: (trip) => trip.operationalCash.pendingAmount,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: () => null,
    },
  ];
}

// ============================================================================
// Selection bar
// ============================================================================

function SinFacturaRegisterBar({
  count,
  clientName,
  total,
  onClear,
  onRegister,
}: {
  count: number;
  clientName: string | null;
  total: string;
  onClear: () => void;
  onRegister: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M10 3L4.5 8.5 2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-medium">
          {count} viaje{count === 1 ? "" : "s"}
        </span>
        {clientName ? (
          <span className="text-sm text-muted-foreground">{clientName}</span>
        ) : null}
        <span className="text-sm font-semibold tabular-nums">{total}</span>
        <span className="text-xs text-muted-foreground">
          · Ajustas el monto y el reparto en el siguiente paso
        </span>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onClear}>
          Quitar selección
        </Button>
        <Button type="button" size="sm" onClick={onRegister}>
          <Send className="mr-2 h-4 w-4" aria-hidden />
          Registrar cobro
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// PAGE
// ============================================================================

export function FinanceEfectivoPorCobrarPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("operational_cash", "create");

  const filters = useFinanceListingFilters<"clientId">({
    filters: {
      clientId: { paramName: FINANCE_EFECTIVO_CLIENT_ID_PARAM },
    },
    chipLabels: {
      clientId: (value) => copy.clientChip(value),
    },
  });

  const clientId = filters.filters.clientId || null;

  const { data: activeClients = [], isLoading: isLoadingClients } =
    useActiveClients();

  const { data, isLoading, isError, error, refetch, isFetching } =
    useOperationalCashPending({
      page: filters.page,
      limit: OPERATIONAL_CASH_PENDING_PAGE_SIZE,
      clientId,
    });

  useQueryErrorToast({
    isError,
    error,
    title: copy.loadErrorTitle,
  });

  // Cobros de hoy session (C11)
  const [todayTray, setTodayTray] = useState<CobrosTodayEntry[]>(() => {
    const all = readCobrosTodayTray();
    return all.filter((e) => !e.invoices?.length || e.invoices.length === 0);
  });

  const handleDismissTray = useCallback(() => {
    clearCobrosTodayTray();
    setTodayTray([]);
  }, []);

  const handleDismissEntry = useCallback((paymentId: string) => {
    setTodayTray((prev) => removeCobrosTodayEntry(prev, paymentId));
  }, []);

  const handleEntryLiveUpdate = useCallback(
    (paymentId: string, live: { repStatus: string }) => {
      setTodayTray((prev) => {
        const idx = prev.findIndex((e) => e.paymentId === paymentId);
        if (idx < 0) return prev;
        if (prev[idx].repStatus === live.repStatus) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], repStatus: live.repStatus };
        writeCobrosTodayTray(next);
        return next;
      });
    },
    [],
  );

  // Selection state
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  const trips = data?.data ?? [];
  const byClient = data?.meta?.byClient ?? [];
  const totals = data?.meta?.totals;
  const groups = useMemo(
    () => groupOperationalCashPendingByClient(trips, byClient),
    [trips, byClient],
  );

  const selectedTrips = useMemo(
    () => trips.filter((t) => selected[t.id]),
    [trips, selected],
  );

  const anchorClientKey = useMemo(() => {
    for (const trip of trips) {
      if (selected[trip.id]) {
        return operationalCashClientKey(trip.clientId);
      }
    }
    return null;
  }, [trips, selected]);

  const selectedTotal = useMemo(
    () =>
      selectedTrips.reduce(
        (sum, t) => sum + t.operationalCash.pendingAmount,
        0,
      ),
    [selectedTrips],
  );

  const selectedClientName = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return selectedTrips[0]?.clientName?.trim() || null;
  }, [selectedTrips]);

  const toggleTrip = useCallback(
    (trip: OperationalCashPendingTrip, checked: boolean) => {
      const key = operationalCashClientKey(trip.clientId);
      if (checked && anchorClientKey && anchorClientKey !== key) return;
      setSelected((prev) => ({ ...prev, [trip.id]: checked }));
    },
    [anchorClientKey],
  );

  const toggleGroup = useCallback(
    (groupKey: string, checked: boolean) => {
      setSelected((prev) => {
        const next = { ...prev };
        for (const trip of trips) {
          if (operationalCashClientKey(trip.clientId) === groupKey) {
            next[trip.id] = checked;
          }
        }
        return next;
      });
    },
    [trips],
  );

  const handleClearSelection = useCallback(() => {
    setSelected({});
  }, []);

  const openRegisterForm = useCallback(() => {
    if (selectedTrips.length === 0) return;
    const first = selectedTrips[0]!;
    navigate(
      buildRegisterCollectionPath({
        channel: "without_invoice",
        clientId: first.clientId,
        tripIds: selectedTrips.map((t) => t.id),
        from: FINANCE_EFECTIVO_POR_COBRAR_PATH,
      }),
    );
  }, [selectedTrips, navigate]);

  const handleRegisterGroup = useCallback(
    (clientIdForGroup: string | null) => {
      if (!clientIdForGroup) return;
      navigate(
        buildRegisterCollectionPath({
          channel: "without_invoice",
          clientId: clientIdForGroup,
          from: FINANCE_EFECTIVO_POR_COBRAR_PATH,
        }),
      );
    },
    [navigate],
  );

  const showRegisterBar =
    canCreate && selectedTrips.length > 0 && trips.length > 0;

  // Client filter
  const clientChipLabel = useMemo(() => {
    if (!clientId) return null;
    const fromActive = activeClients.find((c) => c.id === clientId);
    if (fromActive) return copy.clientChip(getClientDisplayName(fromActive));
    const match = byClient.find((c) => c.clientId === clientId);
    const name =
      match?.clientName?.trim() ||
      trips.find((t) => t.clientId === clientId)?.clientName?.trim() ||
      clientId;
    return copy.clientChip(name);
  }, [activeClients, byClient, clientId, trips]);

  const clientOptions = useMemo(() => {
    const options = activeClients.map((client) => ({
      id: client.id,
      label: getClientDisplayName(client),
    }));
    if (clientId && !options.some((option) => option.id === clientId)) {
      const match = byClient.find((c) => c.clientId === clientId);
      const fallbackName =
        match?.clientName?.trim() ||
        trips.find((t) => t.clientId === clientId)?.clientName?.trim() ||
        clientId;
      return [{ id: clientId, label: fallbackName }, ...options];
    }
    return options;
  }, [activeClients, byClient, clientId, trips]);

  const activeChips: ActiveFilterChip[] = useMemo(() => {
    if (!clientId || !clientChipLabel) return [];
    return [
      {
        id: "clientId",
        label: clientChipLabel,
        onRemove: () => filters.setFilter("clientId", ""),
      },
    ];
  }, [clientChipLabel, clientId, filters]);

  const handleClientFilterChange = useCallback(
    (nextClientId: string) => {
      filters.setFilter("clientId", nextClientId);
      setSelected({});
    },
    [filters],
  );

  const handleRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Buckets
  const openCount = totals?.tripCount ?? 0;
  const partialCount = groups.reduce(
    (sum, g) =>
      sum + g.trips.filter((t) => t.operationalCash.collectedTotal > 0 && t.operationalCash.pendingAmount > 0).length,
    0,
  );

  const buckets: WorkbenchBucket[] = useMemo(
    () => [
      {
        id: "open",
        label: "Por cobrar",
        count: openCount,
        description: totals ? formatMxCurrency(totals.pendingAmount) : undefined,
        isActive: true,
        onClick: (): void => undefined,
        tone: (openCount > 0 ? "success" : "default") as WorkbenchBucket["tone"],
      },
      {
        id: "partial",
        label: "Con abono parcial",
        count: partialCount,
        isActive: false,
        onClick: (): void => undefined,
        tone: (partialCount > 0 ? "warning" : "default") as WorkbenchBucket["tone"],
      },
    ],
    [openCount, partialCount, totals],
  );

  const hasClientFilter = Boolean(clientId);
  const showLoadError = isError && !data;

  // Table columns
  const columns = useMemo(
    () =>
      buildColumns({
        selected,
        anchorClientKey,
        onToggle: toggleTrip,
      }),
    [selected, anchorClientKey, toggleTrip],
  );

  const rows = useMemo(() => groups.flatMap((g) => g.trips), [groups]);

  const groupsByKey = useMemo(
    () =>
      new Map(
        groups.map((g) => [operationalCashClientKey(g.clientId), g]),
      ),
    [groups],
  );

  const getGroupKey = (trip: OperationalCashPendingTrip) =>
    operationalCashClientKey(trip.clientId);

  const renderGroupHeader = useMemo(() => {
    return (
      tableGroup: EntityListGroup<OperationalCashPendingTrip>,
    ): EntityListGroupHeader => {
      const group = groupsByKey.get(tableGroup.key);
      if (!group) return { title: copy.clientUnknown };
      const name = group.clientName?.trim() || copy.clientUnknown;

      const selectedInGroup = tableGroup.rows.filter((t) => selected[t.id]);
      const allSelected =
        tableGroup.rows.length > 0 &&
        selectedInGroup.length === tableGroup.rows.length;
      const someSelected = selectedInGroup.length > 0 && !allSelected;
      const groupChecked = allSelected
        ? true
        : someSelected
          ? "indeterminate"
          : false;

      const groupDisabled =
        anchorClientKey != null && anchorClientKey !== tableGroup.key;

      return {
        title: name,
        meta: copy.groupTripCount(group.tripCount, tableGroup.rows.length),
        selection: groupDisabled
          ? undefined
          : {
              checked: groupChecked,
              onCheckedChange: (checked: boolean) =>
                toggleGroup(tableGroup.key, checked),
              "aria-label": copy.groupBatchAria(name),
            },
        cells: {
          pending: group.pendingAmount,
          actions:
            canCreate && group.clientId && !groupDisabled ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleRegisterGroup(group.clientId)}
                aria-label={copy.groupBatchAria(name)}
              >
                {copy.groupBatchCta}
              </Button>
            ) : undefined,
        },
      };
    };
  }, [
    groupsByKey,
    selected,
    anchorClientKey,
    toggleGroup,
    canCreate,
    handleRegisterGroup,
  ]);

  const pagination =
    !showLoadError && data?.pagination
      ? {
          page: filters.page,
          totalPages: data.pagination.totalPages,
          total: data.pagination.total,
          limit: data.pagination.limit,
        }
      : undefined;

  const handlePageChange = useCallback(
    (nextPage: number) => {
      setSelected({});
      filters.setPage(nextPage);
    },
    [filters],
  );

  return (
    <WorkbenchPageShell
      title={copy.title}
      description={copy.description}
      beforeAwareness={
        todayTray.length > 0 ? (
          <FinanceCobrosTodayTray
            entries={todayTray}
            onDismissTray={handleDismissTray}
            onDismissEntry={handleDismissEntry}
            onEntryLiveUpdate={handleEntryLiveUpdate}
          />
        ) : undefined
      }
      afterAwareness={
        <div className="flex items-center justify-end text-sm text-muted-foreground">
          {copy.crossLink}{" "}
          <Link
            to={FINANCE_COBROS_PATH}
            className="ml-1 font-medium text-primary hover:underline"
          >
            {copy.crossLinkLabel}
            <ArrowUpRight className="ml-0.5 inline h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      }
      buckets={buckets}
      bucketsAriaLabel="Estado de cobros sin factura"
      bucketsLoading={isLoading}
      isDegraded={showLoadError}
      degradedMessage={copy.loadError}
      toolbar={{
        filters: (
          <ClientToolbarFilter
            value={clientId ?? ""}
            onChange={handleClientFilterChange}
            options={clientOptions}
            isLoading={isLoadingClients}
          />
        ),
        onRefresh: handleRefresh,
        isRefreshing: isFetching,
        activeFilterChips: activeChips,
        hasFilters: hasClientFilter,
        onClearFilters: hasClientFilter ? filters.clearAll : undefined,
      }}
      renderContent={() => {
        if (showLoadError) {
          return (
            <DetailAlertCard
              severity="critical"
              icon={<AlertCircle className="h-5 w-5" aria-hidden />}
              title={copy.loadErrorTitle}
              items={[{ text: copy.loadError }]}
              action={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void refetch();
                  }}
                >
                  {copy.retry}
                </Button>
              }
            />
          );
        }

        if (!isLoading && rows.length === 0) {
          return (
            <EmptyState
              icon={
                hasClientFilter ? (
                  <Search className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <HandCoins className="h-8 w-8 text-muted-foreground" />
                )
              }
              title={
                hasClientFilter
                  ? copy.emptyFiltered.title
                  : copy.empty.title
              }
              description={
                hasClientFilter
                  ? copy.emptyFiltered.description
                  : copy.empty.description
              }
              secondaryCta={
                hasClientFilter
                  ? {
                      label: copy.clearClientFilter,
                      onClick: filters.clearAll,
                      variant: "outline",
                    }
                  : undefined
              }
            />
          );
        }

        return (
          <div className="space-y-4">
            <EntityListTable
              framed={false}
              density="list"
              aria-label={copy.entityLabelPlural}
              columns={columns}
              rows={rows}
              getRowId={(row) => row.id}
              isLoading={isLoading}
              primaryTo={(trip) => `/trips/${trip.id}?tab=costs`}
              getGroupKey={getGroupKey}
              renderGroupHeader={renderGroupHeader}
              getRowClassName={(trip) =>
                anchorClientKey &&
                operationalCashClientKey(trip.clientId) !== anchorClientKey
                  ? "opacity-60"
                  : undefined
              }
            />
            {showRegisterBar ? (
              <Card className="sticky bottom-4 border-primary/30 bg-primary/5 shadow-md">
                <CardContent className="p-4">
                  <SinFacturaRegisterBar
                    count={selectedTrips.length}
                    clientName={selectedClientName}
                    total={formatMxCurrency(selectedTotal)}
                    onClear={handleClearSelection}
                    onRegister={openRegisterForm}
                  />
                </CardContent>
              </Card>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Un cobro es de un solo cliente: al marcar una fila, los demás clientes se atenúan.
            </p>
          </div>
        );
      }}
      pagination={pagination}
      onPageChange={handlePageChange}
      relatedConfig={{
        label: copy.relatedConfig.label,
        href: FINANCE_COBROS_PATH,
        description: copy.relatedConfig.description,
      }}
    />
  );
}
