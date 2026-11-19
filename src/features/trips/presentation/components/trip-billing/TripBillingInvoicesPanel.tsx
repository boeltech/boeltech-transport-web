/**
 * Tabla «Facturas del viaje» (D18 / D-INV-1…9) — listado trip-linked.
 * Modo reparto (D19 / F-01/F-02): 1 fila/pierna + card Servicios adicionales.
 */

import { useMemo, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";

import { buildInvoiceCreateHref } from "@features/invoicing/application/invoiceCreateHref";
import { InvoiceStatusLabels } from "@features/invoicing/domain";
import { useTripLinkedInvoices } from "@features/trips/application";
import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { usePermissions } from "@shared/permissions";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListShareValue,
  type EntityListSummaryRow,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { billingCopy } from "../../copy/tripDetail/billingCopy";
import {
  buildTripBillingInvoiceRows,
  summarizeVigente,
  type TripBillingInvoiceRow,
} from "./buildTripBillingInvoiceRows";

const copy = billingCopy.invoices;

function statusLabel(status: string | null): string {
  if (!status) return "—";
  const known = status as keyof typeof InvoiceStatusLabels;
  return InvoiceStatusLabels[known] ?? status;
}

function statusVariant(
  status: string | null,
): "success" | "warning" | "neutral" | "destructive" {
  switch (status) {
    case "stamped":
      return "success";
    case "draft":
    case "stamping":
    case "cancellation_pending":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "neutral";
  }
}

function formatMoneyCell(
  value: number | null,
  options?: { strike?: boolean; dash?: boolean },
): ReactNode {
  if (options?.dash || value == null) return "—";
  const formatted = formatMxCurrency(value);
  if (options?.strike) {
    return <span className="line-through text-muted-foreground">{formatted}</span>;
  }
  return formatted;
}

function rowAction(
  row: TripBillingInvoiceRow,
  tripId: string,
  navigate: ReturnType<typeof useNavigate>,
): ReactNode {
  if (row.href) {
    const label = row.isDraft
      ? copy.openDraft
      : row.isReplacedRow
        ? copy.openInvoice
        : copy.viewInvoice;
    return (
      <Button asChild variant="ghost" size="sm">
        <Link to={row.href} state={{ from: `/trips/${tripId}` }}>
          {label}
        </Link>
      </Button>
    );
  }
  if (row.invoicePortionHref) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          navigate(row.invoicePortionHref!, {
            state: { from: `/trips/${tripId}` },
          })
        }
      >
        {row.kind === "false_trip_pending"
          ? copy.pendingInvoice
          : copy.invoicePortion}
      </Button>
    );
  }
  return null;
}

export interface TripBillingInvoicesPanelProps {
  trip: Trip;
  revenueSplit?: TripRevenueSplit | null;
  onOpenRevenueSplit?: () => void;
  onOpenHistory?: () => void;
  /** D27: copy de descripción cuando hay original sin cancelar. */
  hasPartialSubstitution?: boolean;
}

export function TripBillingInvoicesPanel({
  trip,
  revenueSplit,
  onOpenRevenueSplit,
  onOpenHistory,
  hasPartialSubstitution = false,
}: TripBillingInvoicesPanelProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("invoices", "create");
  const inv = trip.invoicing;
  const isFalseTrip = trip.operationalOutcome === "false_trip";
  const hasSplit =
    inv.hasActiveSplit ||
    revenueSplit?.status === "active" ||
    revenueSplit?.status === "draft";

  const { data: linkedInvoices = [], isLoading } = useTripLinkedInvoices(
    trip.id,
  );

  const rows: TripBillingInvoiceRow[] = useMemo(
    () =>
      buildTripBillingInvoiceRows({
        trip,
        linkedInvoices,
        revenueSplit,
        canCreate,
      }),
    [canCreate, linkedInvoices, revenueSplit, trip],
  );

  const vigente = useMemo(() => summarizeVigente(rows), [rows]);

  const legRows = useMemo(
    () => (hasSplit ? rows.filter((row) => row.kind === "split") : rows),
    [hasSplit, rows],
  );

  const accessoryRows = useMemo(
    () =>
      hasSplit ? rows.filter((row) => row.kind === "accessory") : [],
    [hasSplit, rows],
  );

  const leftoverRows = useMemo(
    () =>
      hasSplit
        ? rows.filter(
            (row) => row.kind !== "split" && row.kind !== "accessory",
          )
        : [],
    [hasSplit, rows],
  );

  const splitColumns: EntityListColumnDef<TripBillingInvoiceRow>[] = useMemo(
    () => [
      {
        id: "client",
        header: copy.columns.client,
        kind: "stacked",
        accessor: (row) => ({
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span>{row.title}</span>
              {row.isPrimaryClient ? (
                <Badge variant="neutral" tone="soft">
                  {copy.badgePrimaryClient}
                </Badge>
              ) : null}
              {row.carriesCartaPorte ? (
                <Badge variant="info" tone="soft">
                  {copy.badgeCarriesCp}
                </Badge>
              ) : null}
            </span>
          ),
          secondary: row.subtitle || undefined,
        }),
      },
      {
        id: "share",
        header: copy.columns.share,
        kind: "share",
        accessor: (row): EntityListShareValue | null =>
          row.sharePercent == null
            ? null
            : {
                amount: row.shareAmount,
                percent: row.sharePercent,
              },
      },
      {
        id: "invoice",
        header: copy.columns.invoice,
        kind: "stacked",
        accessor: (row) => {
          if (row.status == null) {
            return {
              primary: (
                <Badge variant="warning" tone="soft">
                  {copy.pendingInvoiceBadge}
                </Badge>
              ),
              secondary:
                trip.status === "cancelled"
                  ? copy.noEmit
                  : copy.pendingInvoiceDetail,
            };
          }
          const totalLine =
            row.total != null
              ? copy.invoiceTotal(formatMxCurrency(row.total))
              : undefined;
          const folioLine = row.folio
            ? row.stampedAt
              ? `${row.folio} · ${formatDateTime(row.stampedAt)}`
              : row.folio
            : undefined;
          return {
            primary: (
              <span className="inline-flex flex-wrap items-center gap-1.5">
                <Badge variant={statusVariant(row.status)} tone="soft">
                  {statusLabel(row.status)}
                </Badge>
                {row.needsSubstitute ? (
                  <Badge variant="warning" tone="soft">
                    {copy.toSubstitute}
                  </Badge>
                ) : null}
                {row.pendingCancel ? (
                  <Badge variant="warning" tone="soft">
                    {copy.toCancel}
                  </Badge>
                ) : null}
              </span>
            ),
            secondary: [folioLine, totalLine].filter(Boolean).join(" · ") || undefined,
          };
        },
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: (row) => rowAction(row, trip.id, navigate),
      },
    ],
    [navigate, trip.id, trip.status],
  );

  const docsColumns: EntityListColumnDef<TripBillingInvoiceRow>[] = useMemo(() => {
    const cols: EntityListColumnDef<TripBillingInvoiceRow>[] = [
      {
        id: "document",
        header: copy.columns.document,
        kind: "stacked",
        accessor: (row) => ({
          primary: row.title,
          secondary: row.subtitle,
        }),
      },
      {
        id: "status",
        header: copy.columns.statusFolio,
        kind: "stacked",
        accessor: (row) => ({
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <Badge variant={statusVariant(row.status)} tone="soft">
                {statusLabel(row.status)}
              </Badge>
              {row.needsSubstitute ? (
                <Badge variant="warning" tone="soft">
                  {copy.toSubstitute}
                </Badge>
              ) : null}
              {row.pendingCancel ? (
                <Badge variant="warning" tone="soft">
                  {copy.toCancel}
                </Badge>
              ) : null}
            </span>
          ),
          secondary: row.folio
            ? row.stampedAt
              ? `${row.folio} · ${formatDateTime(row.stampedAt)}`
              : row.folio
            : row.status == null
              ? copy.pendingInvoice
              : undefined,
        }),
      },
      {
        id: "total",
        header: copy.columns.total,
        kind: "money",
        accessor: (row) =>
          formatMoneyCell(row.total, { strike: row.strikeTotal }),
      },
      {
        id: "collected",
        header: copy.columns.collected,
        kind: "money",
        accessor: (row) =>
          formatMoneyCell(row.collected, {
            dash: !row.showAmounts || row.collected == null,
          }),
      },
      {
        id: "balance",
        header: copy.columns.balance,
        kind: "money",
        accessor: (row) =>
          formatMoneyCell(row.balance, {
            dash: !row.showAmounts || row.balance == null,
          }),
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: (row) => rowAction(row, trip.id, navigate),
      },
    ];
    return cols;
  }, [navigate, trip.id]);

  const columns = hasSplit ? splitColumns : docsColumns;

  const description = isFalseTrip
    ? copy.descriptionFalseTrip
    : hasPartialSubstitution
      ? copy.descriptionPartialSubstitution
      : hasSplit
        ? copy.descriptionSplit
        : copy.description;

  const showAccessoryEmptyDocs =
    !isFalseTrip &&
    !hasSplit &&
    rows.length > 0 &&
    !rows.some((row) => row.kind === "accessory");

  const activeSplitChip =
    revenueSplit?.status === "active" && revenueSplit.legs.length > 0
      ? billingCopy.split.activeChip(
          ...revenueSplit.legs.map((leg) => String(leg.sharePercent)),
        )
      : null;

  const summaryRow: EntityListSummaryRow | undefined = useMemo(() => {
    if (hasSplit && revenueSplit && revenueSplit.status !== "cancelled") {
      const splitVigente = summarizeVigente(legRows);
      return {
        label: copy.freightBasis,
        cells: {
          share: {
            amount: revenueSplit.basisAmount,
            percent: 100,
          },
          invoice:
            splitVigente.rowCount > 0
              ? copy.facturadoSummary(formatMxCurrency(splitVigente.total))
              : undefined,
        },
      };
    }
    if (!hasSplit && vigente.rowCount > 0) {
      return {
        label: copy.facturadoVigente,
        cells: {
          total: vigente.total,
          collected: vigente.collected,
          balance: vigente.balance,
        },
      };
    }
    return undefined;
  }, [hasSplit, legRows, revenueSplit, vigente]);

  const accessoryColumns: EntityListColumnDef<TripBillingInvoiceRow>[] =
    useMemo(
      () => [
        {
          id: "document",
          header: copy.columns.document,
          kind: "stacked",
          accessor: (row) => ({
            primary: row.title,
            secondary: row.subtitle || undefined,
          }),
        },
        {
          id: "status",
          header: copy.columns.statusFolio,
          kind: "stacked",
          accessor: (row) => ({
            primary: (
              <Badge variant={statusVariant(row.status)} tone="soft">
                {statusLabel(row.status)}
              </Badge>
            ),
            secondary: row.folio ?? undefined,
          }),
        },
        {
          id: "total",
          header: copy.columns.total,
          kind: "money",
          accessor: (row) =>
            formatMoneyCell(row.total, { strike: row.strikeTotal }),
        },
        {
          id: "collected",
          header: copy.columns.collected,
          kind: "money",
          accessor: (row) =>
            formatMoneyCell(row.collected, {
              dash: !row.showAmounts || row.collected == null,
            }),
        },
        {
          id: "balance",
          header: copy.columns.balance,
          kind: "money",
          accessor: (row) =>
            formatMoneyCell(row.balance, {
              dash: !row.showAmounts || row.balance == null,
            }),
        },
        {
          id: "actions",
          header: "",
          kind: "actions",
          accessor: (row) => rowAction(row, trip.id, navigate),
        },
      ],
      [navigate, trip.id],
    );

  const accessoryTableRows = [...accessoryRows, ...leftoverRows];

  return (
    <div className="space-y-3">
      <Card data-testid="trip-billing-invoices">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">
                {hasSplit ? copy.titleSplit : copy.title}
              </CardTitle>
              {activeSplitChip ? (
                <Badge
                  variant="info"
                  tone="soft"
                  data-testid="trip-billing-split-chip"
                >
                  {activeSplitChip}
                </Badge>
              ) : null}
            </div>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {onOpenHistory ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onOpenHistory}
              >
                {copy.history}
              </Button>
            ) : null}
            {canCreate &&
            inv.canGenerateAccessoryInvoice &&
            !isFalseTrip &&
            !hasSplit ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    buildInvoiceCreateHref({
                      tripId: trip.id,
                      scope: "accessory",
                    }),
                    { state: { from: `/trips/${trip.id}` } },
                  )
                }
              >
                {copy.accessoryCta}
              </Button>
            ) : null}
            {revenueSplit?.status === "draft" && onOpenRevenueSplit ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onOpenRevenueSplit}
                >
                  {billingCopy.split.cancelDraft}
                </Button>
                <Button type="button" size="sm" onClick={onOpenRevenueSplit}>
                  {billingCopy.split.continueDraft}
                </Button>
              </>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {legRows.length === 0 && !isLoading ? (
            <p className="text-sm text-muted-foreground">{copy.emptyTable}</p>
          ) : (
            <EntityListTable
              columns={columns}
              rows={legRows}
              getRowId={(row) => row.id}
              density="compact"
              framed={false}
              isLoading={isLoading && legRows.length === 0}
              summaryRow={summaryRow}
            />
          )}
          {showAccessoryEmptyDocs ? (
            <p className="text-xs text-muted-foreground">
              {copy.emptyAccessories}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {hasSplit && !isFalseTrip ? (
        <Card data-testid="trip-billing-accessories">
          <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">
                {copy.accessoriesSectionTitle}
              </CardTitle>
            </div>
            {canCreate && inv.canGenerateAccessoryInvoice ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(
                    buildInvoiceCreateHref({
                      tripId: trip.id,
                      scope: "accessory",
                    }),
                    { state: { from: `/trips/${trip.id}` } },
                  )
                }
              >
                {copy.accessoryCta}
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            {accessoryTableRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {copy.emptyAccessories}
              </p>
            ) : (
              <EntityListTable
                columns={accessoryColumns}
                rows={accessoryTableRows}
                getRowId={(row) => row.id}
                density="compact"
                framed={false}
              />
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
