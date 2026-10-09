import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { FileText, RefreshCw } from "lucide-react";

import type {
  Trip,
  TripFleetDiffFieldKey,
  TripFleetLastRefresh,
  TripFleetSnapshotBlockMeta,
  TripFleetSnapshotView,
} from "@features/trips/domain";
import { useTripFleetSnapshot } from "@features/trips/application";
import { usePermissions } from "@shared/permissions";
import { formatDateTime } from "@shared/utils/dateUtils";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { Skeleton } from "@shared/ui/skeleton";

import { tripDetailCopy } from "../../copy";
import {
  describeRefreshBlockedReason,
  diffFieldSet,
  formatCpInvoiceFolio,
  formatFleetValue,
  formatInsurance,
  isForbiddenError,
  resolveFleetSnapshotCardMode,
  shouldQueryTripFleetSnapshot,
  tripExpectsFleetSnapshot,
  type FleetCatalogLabels,
} from "./tripFleetSnapshotHelpers";
import { useFleetCatalogLabels } from "./useFleetCatalogLabels";
import { TripFleetSnapshotRefreshSheet } from "./TripFleetSnapshotRefreshSheet";

const copy = tripDetailCopy.fleetSnapshot.card;

export interface TripFleetSnapshotCardProps {
  trip: Trip;
  isClientPortalView?: boolean;
  /** Misma regla que `canShowFiscalSubstituteCta` (administrador o gerente). */
  canSubstituteInvoice: boolean;
}

interface FleetRow {
  label: string;
  value: string | null;
  diffKeys: readonly TripFleetDiffFieldKey[];
}

function RowLabel({ label, changed }: { label: string; changed: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {label}
      {changed ? (
        <Badge variant="info" tone="soft" className="text-[10px] font-medium">
          {copy.diffBadge}
        </Badge>
      ) : null}
    </span>
  );
}

function FleetRows({
  rows,
  diff,
}: {
  rows: readonly FleetRow[];
  diff: ReadonlySet<TripFleetDiffFieldKey>;
}) {
  return (
    <>
      {rows.map((row) => (
        <InfoRow
          key={row.label}
          variant="inline"
          label={
            <RowLabel label={row.label} changed={row.diffKeys.some((key) => diff.has(key))} />
          }
          value={row.value}
        />
      ))}
    </>
  );
}

function LastRefreshLine({ entry }: { entry: TripFleetLastRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const text = copy.lastRefresh(entry.byName?.trim() || copy.lastRefreshUnknownUser, entry.reason);
  return (
    <div className="space-y-0.5">
      <p
        className={expanded ? "text-xs text-muted-foreground" : "line-clamp-2 text-xs text-muted-foreground"}
        title={expanded ? undefined : text}
      >
        {text}
      </p>
      <button
        type="button"
        className="text-xs font-medium text-primary underline-offset-4 hover:underline"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? copy.viewLessReason : copy.viewFullReason}
      </button>
    </div>
  );
}

function FleetBlock({
  title,
  meta,
  lastRefresh,
  badges,
  diff,
  visibleRows,
  foldedRows,
}: {
  title: string;
  meta: TripFleetSnapshotBlockMeta;
  lastRefresh: TripFleetLastRefresh | null;
  badges: ReactNode;
  diff: ReadonlySet<TripFleetDiffFieldKey>;
  visibleRows: readonly FleetRow[];
  foldedRows: readonly FleetRow[];
}) {
  const [expanded, setExpanded] = useState(false);
  const isBackfillMaster = meta.source === "backfill_master";

  return (
    <section className="min-w-0 space-y-2" aria-label={title}>
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-sm font-semibold">{title}</h4>
          {isBackfillMaster ? (
            <Badge variant="warning" tone="soft" className="text-[10px]">
              {copy.reviewBadge}
            </Badge>
          ) : null}
          {badges}
        </div>
        <p className="text-xs text-muted-foreground">
          {copy.sourceLine(copy.source[meta.source] ?? meta.source, formatDateTime(meta.snapshotAt))}
        </p>
        {meta.source === "master_refresh" && lastRefresh ? (
          <LastRefreshLine entry={lastRefresh} />
        ) : null}
        {isBackfillMaster ? (
          <p className="text-xs text-muted-foreground">{copy.reviewHint}</p>
        ) : null}
      </div>

      <div>
        <FleetRows rows={visibleRows} diff={diff} />
        {expanded ? <FleetRows rows={foldedRows} diff={diff} /> : null}
      </div>

      {foldedRows.length > 0 ? (
        <button
          type="button"
          className="text-xs font-medium text-primary underline-offset-4 hover:underline"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? copy.collapse : copy.expand}
        </button>
      ) : null}

      {diff.size > 0 ? (
        <p className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          {copy.diffNote}
        </p>
      ) : null}
    </section>
  );
}

function buildVehicleRows(
  view: TripFleetSnapshotView,
  trip: Trip,
  labels: FleetCatalogLabels,
): { visible: FleetRow[]; folded: FleetRow[] } {
  const snapshot = view.snapshot!.vehicle;
  const unitNumber =
    view.master?.vehicle.unitNumber ??
    (trip.vehicle && trip.vehicle.id === snapshot.vehicleId ? trip.vehicle.unitNumber : null);

  const visible: FleetRow[] = [
    { label: copy.label.unitNumber, value: unitNumber ?? copy.value.unavailable, diffKeys: [] },
    { label: copy.label.plate, value: snapshot.licensePlate, diffKeys: ["license_plate"] },
    {
      label: copy.label.config,
      value: formatFleetValue("config", snapshot.satConfigAutotransporteCode, labels),
      diffKeys: ["sat_config_autotransporte_code"],
    },
    {
      label: copy.label.permitType,
      value: formatFleetValue("permit", snapshot.satTipoPermisoCode, labels),
      diffKeys: ["sat_tipo_permiso_code"],
    },
    {
      label: copy.label.permitNumber,
      value: formatFleetValue("text", snapshot.sctPermitNumber, labels),
      diffKeys: ["sct_permit_number"],
    },
  ];

  const folded: FleetRow[] = [
    { label: copy.label.year, value: formatFleetValue("text", snapshot.year, labels), diffKeys: ["year"] },
    {
      label: copy.label.grossWeight,
      value: formatFleetValue("weight", snapshot.pesoBrutoVehicular, labels),
      diffKeys: ["peso_bruto_vehicular"],
    },
    {
      label: copy.label.rcInsurer,
      value: formatFleetValue("text", snapshot.insuranceCompany, labels),
      diffKeys: ["insurance_company"],
    },
    {
      label: copy.label.rcPolicy,
      value: formatFleetValue("text", snapshot.insurancePolicy, labels),
      diffKeys: ["insurance_policy"],
    },
    {
      label: copy.label.rcExpiry,
      value: formatFleetValue("date", snapshot.insuranceExpiry, labels),
      diffKeys: ["insurance_expiry"],
    },
    {
      label: copy.label.permitExpiry,
      value: formatFleetValue("date", snapshot.sctPermitExpiry, labels),
      diffKeys: ["sct_permit_expiry"],
    },
  ];

  const envInsurance = formatInsurance(snapshot.aseguraMedioAmbiente, snapshot.polizaMedioAmbiente);
  if (envInsurance) {
    folded.push({
      label: copy.label.envInsurance,
      value: envInsurance,
      diffKeys: ["asegura_medio_ambiente", "poliza_medio_ambiente"],
    });
  }
  const cargoInsurance = formatInsurance(snapshot.aseguraCarga, snapshot.polizaCarga);
  if (cargoInsurance) {
    folded.push({
      label: copy.label.cargoInsurance,
      value: cargoInsurance,
      diffKeys: ["asegura_carga", "poliza_carga"],
    });
  }

  return { visible, folded };
}

function buildDriverRows(view: TripFleetSnapshotView): FleetRow[] {
  const snapshot = view.snapshot!.driver;
  return [
    { label: copy.label.driverName, value: snapshot.driverFullName, diffKeys: ["driver_full_name"] },
    { label: copy.label.driverRfc, value: snapshot.driverRfc, diffKeys: ["driver_rfc"] },
    {
      label: copy.label.driverLicense,
      value: snapshot.driverLicenseNumber,
      diffKeys: ["driver_license_number"],
    },
  ];
}

function OutdatedInvoiceNotice({
  view,
  tripId,
  canSubstituteInvoice,
  canReadInvoices,
}: {
  view: TripFleetSnapshotView;
  tripId: string;
  canSubstituteInvoice: boolean;
  canReadInvoices: boolean;
}) {
  const invoice = view.cpInvoice;
  if (!view.cpInvoiceOutdated || !invoice) return null;
  const invoiceHref = `/invoices/${invoice.id}`;
  const linkState = { from: `/trips/${tripId}` };

  return (
    <AlertWithIcon variant="warning" title={copy.outdated.title(formatCpInvoiceFolio(invoice))}>
      <p>{copy.outdated.body}</p>
      {canSubstituteInvoice ? (
        <Button type="button" size="sm" variant="outline" className="mt-2" asChild>
          <Link to={invoiceHref} state={linkState}>
            {copy.outdated.cta}
          </Link>
        </Button>
      ) : (
        <p className="mt-1">
          {copy.outdated.askManager}{" "}
          {canReadInvoices ? (
            <Link
              to={invoiceHref}
              state={linkState}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {copy.outdated.openInvoice}
            </Link>
          ) : null}
        </p>
      )}
    </AlertWithIcon>
  );
}

function EmptySnapshotState({
  trip,
  canOpenVehicle,
  canOpenDriver,
}: {
  trip: Trip;
  canOpenVehicle: boolean;
  canOpenDriver: boolean;
}) {
  const vehicleId = trip.vehicle?.id ?? trip.vehicleId;
  const driverId = trip.driver?.id ?? trip.driverId;
  const linkState = { from: `/trips/${trip.id}` };
  return (
    <div className="space-y-2 rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm">
      <p className="font-medium">{copy.empty.title}</p>
      <p className="text-muted-foreground">{copy.empty.body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        {canOpenVehicle && vehicleId ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={`/vehicles/${vehicleId}`} state={linkState}>
              {copy.empty.openVehicle}
            </Link>
          </Button>
        ) : null}
        {canOpenDriver && driverId ? (
          <Button type="button" size="sm" variant="outline" asChild>
            <Link to={`/drivers/${driverId}`} state={linkState}>
              {copy.empty.openDriver}
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CardShell({
  action,
  children,
}: {
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card data-testid="trip-fleet-snapshot-card">
      <CardHeader className="flex flex-col gap-3 space-y-0 pb-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            {copy.title}
          </CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4 pt-0">{children}</CardContent>
    </Card>
  );
}

export function TripFleetSnapshotCard({
  trip,
  isClientPortalView = false,
  canSubstituteInvoice,
}: TripFleetSnapshotCardProps) {
  const { hasPermission } = usePermissions();
  const canRead = hasPermission("trips_fleet_snapshot", "read");
  const canExecute = hasPermission("trips_fleet_snapshot", "execute");
  const canReadInvoices = hasPermission("invoices", "read");
  const enabled = shouldQueryTripFleetSnapshot(trip, { canRead, isClientPortalView });
  const [sheetOpen, setSheetOpen] = useState(false);

  const query = useTripFleetSnapshot(trip.id, { enabled });
  const labels = useFleetCatalogLabels(enabled && Boolean(query.data?.snapshot));

  if (!enabled) return null;

  if (query.isPending) {
    if (!tripExpectsFleetSnapshot(trip.status)) return null;
    return (
      <CardShell>
        <Skeleton className="h-24 w-full" />
      </CardShell>
    );
  }

  if (query.isError) {
    if (isForbiddenError(query.error)) return null;
    return (
      <CardShell>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
          <span>{copy.loadError}</span>
          <Button type="button" size="sm" variant="outline" onClick={() => void query.refetch()}>
            {copy.retry}
          </Button>
        </div>
      </CardShell>
    );
  }

  const view = query.data;
  const mode = resolveFleetSnapshotCardMode(view, trip.status);
  if (mode === "hidden") return null;

  if (mode === "empty") {
    return (
      <CardShell>
        <EmptySnapshotState
          trip={trip}
          canOpenVehicle={hasPermission("vehicles", "read")}
          canOpenDriver={hasPermission("drivers", "read")}
        />
      </CardShell>
    );
  }

  const snapshot = view.snapshot!;
  const vehicleDiff = diffFieldSet(view, "vehicle");
  const driverDiff = diffFieldSet(view, "driver");
  const hasDiff = vehicleDiff.size > 0 || driverDiff.size > 0;
  const vehicleRows = buildVehicleRows(view, trip, labels);
  const canRefresh = canExecute && view.refresh.allowed;
  const blockedReason =
    canExecute && !view.refresh.allowed ? describeRefreshBlockedReason(view.refresh.reasonCode) : null;
  const trailerPlates = (trip.trailers ?? [])
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((trailer) => trailer.licensePlate)
    .filter(Boolean);

  return (
    <CardShell
      action={
        canRefresh ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5"
            onClick={() => setSheetOpen(true)}
          >
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            {copy.action.refresh}
          </Button>
        ) : null
      }
    >
      <OutdatedInvoiceNotice
        view={view}
        tripId={trip.id}
        canSubstituteInvoice={canSubstituteInvoice}
        canReadInvoices={canReadInvoices}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <FleetBlock
          title={copy.block.vehicle}
          meta={snapshot.vehicle}
          lastRefresh={view.lastRefresh?.vehicle ?? null}
          badges={
            view.master && !view.master.vehicle.isActive ? (
              <Badge variant="neutral" tone="soft" className="text-[10px]">
                {copy.deactivatedBadge}
              </Badge>
            ) : null
          }
          diff={vehicleDiff}
          visibleRows={vehicleRows.visible}
          foldedRows={vehicleRows.folded}
        />
        <FleetBlock
          title={copy.block.driver}
          meta={snapshot.driver}
          lastRefresh={view.lastRefresh?.driver ?? null}
          badges={
            view.master && !view.master.driver.isActive ? (
              <Badge variant="neutral" tone="soft" className="text-[10px]">
                {copy.driverDeactivatedBadge}
              </Badge>
            ) : null
          }
          diff={driverDiff}
          visibleRows={buildDriverRows(view)}
          foldedRows={[]}
        />
      </div>

      {hasDiff && !canExecute ? (
        <p className="text-xs text-muted-foreground">{copy.diffNoPermission}</p>
      ) : null}
      {blockedReason ? (
        <p className="text-xs text-muted-foreground">{blockedReason}</p>
      ) : null}
      {trailerPlates.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {copy.trailersNote(trailerPlates.join(", "))}
        </p>
      ) : null}

      {canExecute ? (
        <TripFleetSnapshotRefreshSheet
          trip={trip}
          labels={labels}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      ) : null}
    </CardShell>
  );
}
