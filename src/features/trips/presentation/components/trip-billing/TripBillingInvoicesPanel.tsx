/**
 * Tabla «Facturas del viaje» (D18) + variantes split / accesoria / falso.
 */

import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";

import { buildInvoiceCreateHref } from "@features/invoicing/application";
import { useInvoice } from "@features/invoicing/application";
import { InvoiceStatusLabels } from "@features/invoicing/domain";
import type { Trip, TripRevenueSplit } from "@features/trips/domain";
import { usePermissions } from "@shared/permissions";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListShareValue,
} from "@shared/ui/table";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { getInvoiceDisplayAmounts } from "@features/invoicing/domain";
import { billingCopy } from "../../copy/tripDetail/billingCopy";

const copy = billingCopy.invoices;

type InvoiceRowKind = "freight" | "accessory" | "false_trip" | "split";

type InvoiceRow = {
  id: string;
  kind: InvoiceRowKind;
  title: string;
  subtitle: string;
  status: string | null;
  folio: string | null;
  stampedAt: string | null;
  total: number | null;
  collected: number | null;
  balance: number | null;
  /** F-ds: % de porción (solo split) → kind `share`. */
  sharePercent: number | null;
  /** F5b P1-A: flete vigente con Atención fiscal. */
  needsSubstitute: boolean;
  isDraft: boolean;
  href: string | null;
  invoicePortionHref: string | null;
};

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

export interface TripBillingInvoicesPanelProps {
  trip: Trip;
  revenueSplit?: TripRevenueSplit | null;
  onOpenRevenueSplit?: () => void;
  onOpenHistory?: () => void;
}

export function TripBillingInvoicesPanel({
  trip,
  revenueSplit,
  onOpenRevenueSplit,
  onOpenHistory,
}: TripBillingInvoicesPanelProps) {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission("invoices", "create");
  const inv = trip.invoicing;
  const isFalseTrip = trip.operationalOutcome === "false_trip";
  const hasSplit =
    inv.hasActiveSplit || revenueSplit?.status === "active" || revenueSplit?.status === "draft";

  const principalId = inv.invoiceId;
  const { data: principalInvoice } = useInvoice(principalId ?? "", {
    enabled: Boolean(principalId),
  });

  const rows: InvoiceRow[] = useMemo(() => {
    const out: InvoiceRow[] = [];
    const clientLabel = trip.client?.legalName?.trim() || "Cliente";
    const freightNeedsSubstitute =
      trip.requiresFiscalAttention && !isFalseTrip;

    if (hasSplit && revenueSplit && revenueSplit.status !== "cancelled") {
      for (const leg of revenueSplit.legs) {
        const label =
          leg.clientLegalName || leg.clientRfc || leg.clientId.slice(0, 8);
        const legInvoiceId = leg.invoiceId;
        out.push({
          id: leg.id,
          kind: "split",
          title: copy.docSplit(label),
          subtitle: leg.suggestedCartaPorte
            ? `${copy.withCartaPorte} · ${label}`
            : `${copy.withoutCartaPorte} · ${label}`,
          status: legInvoiceId ? "stamped" : null,
          folio: null,
          stampedAt: null,
          total:
            revenueSplit.basisAmount > 0
              ? (revenueSplit.basisAmount * leg.sharePercent) / 100
              : null,
          collected: null,
          balance: null,
          sharePercent: leg.sharePercent,
          needsSubstitute: false,
          isDraft: false,
          href: legInvoiceId ? `/invoices/${legInvoiceId}` : null,
          invoicePortionHref:
            !legInvoiceId && canCreate && inv.canGenerateSplitShareInvoice
              ? buildInvoiceCreateHref({
                  tripId: trip.id,
                  scope: "split_share",
                  legId: leg.id,
                })
              : null,
        });
      }
      return out;
    }

    if (principalId) {
      const amounts = principalInvoice
        ? getInvoiceDisplayAmounts(principalInvoice)
        : null;
      const isDraft = inv.invoiceStatus === "draft";
      out.push({
        id: principalId,
        kind: isFalseTrip ? "false_trip" : "freight",
        title: isFalseTrip ? copy.docFalseTrip : copy.docFreight,
        subtitle: isFalseTrip
          ? clientLabel
          : inv.cartaPorteAttached
            ? `${copy.withCartaPorte} · ${clientLabel}`
            : `${copy.withoutCartaPorte} · ${clientLabel}`,
        status: inv.invoiceStatus,
        folio: inv.invoiceFolio,
        stampedAt: principalInvoice?.stampedAt ?? null,
        total: principalInvoice?.total ?? null,
        collected: isDraft ? null : (amounts?.totalPaid ?? null),
        balance: isDraft ? null : (amounts?.balanceDue ?? null),
        sharePercent: null,
        needsSubstitute: freightNeedsSubstitute,
        isDraft,
        href: `/invoices/${principalId}`,
        invoicePortionHref: null,
      });
    }

    for (const acc of inv.accessoryInvoices ?? []) {
      const isDraft = acc.status === "draft";
      out.push({
        id: acc.id,
        kind: "accessory",
        title: copy.docAccessory,
        subtitle: clientLabel,
        status: acc.status,
        folio: acc.folio,
        stampedAt: null,
        total: acc.total,
        collected: isDraft ? null : null,
        balance: isDraft ? null : null,
        sharePercent: null,
        needsSubstitute: false,
        isDraft,
        href: `/invoices/${acc.id}`,
        invoicePortionHref: null,
      });
    }

    return out;
  }, [
    canCreate,
    hasSplit,
    inv,
    isFalseTrip,
    principalId,
    principalInvoice,
    revenueSplit,
    trip.client,
    trip.id,
    trip.requiresFiscalAttention,
  ]);

  const showShareColumn = rows.some((row) => row.sharePercent != null);

  const columns: EntityListColumnDef<InvoiceRow>[] = useMemo(() => {
    const cols: EntityListColumnDef<InvoiceRow>[] = [
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
            </span>
          ),
          secondary: row.folio
            ? row.stampedAt
              ? `${row.folio} · ${formatDateTime(row.stampedAt)}`
              : row.folio
            : undefined,
        }),
      },
    ];

    if (showShareColumn) {
      // F-ds: «Parte del flete» = monto + % + barra (sustituye Total + % texto F5b).
      cols.push({
        id: "share",
        header: copy.columns.share,
        kind: "share",
        accessor: (row): EntityListShareValue | null =>
          row.sharePercent == null
            ? null
            : {
                amount: row.total,
                percent: row.sharePercent,
              },
      });
    } else {
      cols.push({
        id: "total",
        header: copy.columns.total,
        kind: "money",
        accessor: (row) =>
          row.total == null ? "—" : formatMxCurrency(row.total),
      });
    }

    cols.push(
      {
        id: "collected",
        header: copy.columns.collected,
        kind: "money",
        accessor: (row) =>
          row.isDraft || row.collected == null
            ? "—"
            : formatMxCurrency(row.collected),
      },
      {
        id: "balance",
        header: copy.columns.balance,
        kind: "money",
        accessor: (row) =>
          row.isDraft || row.balance == null
            ? "—"
            : formatMxCurrency(row.balance),
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: (row) => {
          if (row.href) {
            return (
              <Button asChild variant="ghost" size="sm">
                <Link to={row.href} state={{ from: `/trips/${trip.id}` }}>
                  {row.isDraft ? copy.openDraft : copy.viewInvoice}
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
                    state: { from: `/trips/${trip.id}` },
                  })
                }
              >
                {copy.invoicePortion}
              </Button>
            );
          }
          return null;
        },
      },
    );

    return cols;
  }, [navigate, showShareColumn, trip.id]);

  const description = isFalseTrip
    ? copy.descriptionFalseTrip
    : hasSplit
      ? copy.descriptionSplit
      : copy.description;

  const showAccessoryEmpty =
    !hasSplit &&
    Boolean(principalId) &&
    (inv.accessoryInvoices?.length ?? 0) === 0;

  const activeSplitChip =
    revenueSplit?.status === "active" && revenueSplit.legs.length > 0
      ? billingCopy.split.activeChip(
          ...revenueSplit.legs.map((leg) => String(leg.sharePercent)),
        )
      : null;

  return (
    <Card data-testid="trip-billing-invoices">
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 pb-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle className="text-base">{copy.title}</CardTitle>
            {activeSplitChip ? (
              <Badge variant="info" tone="soft" data-testid="trip-billing-split-chip">
                {activeSplitChip}
              </Badge>
            ) : null}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          {onOpenHistory ? (
            <Button type="button" variant="ghost" size="sm" onClick={onOpenHistory}>
              {copy.history}
            </Button>
          ) : null}
          {canCreate && inv.canGenerateAccessoryInvoice && !isFalseTrip ? (
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
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aún no hay facturas en este viaje. Usa Facturar en el encabezado.
          </p>
        ) : (
          <EntityListTable
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            density="compact"
            framed={false}
            summaryRow={
              showShareColumn &&
              revenueSplit &&
              revenueSplit.status !== "cancelled"
                ? {
                    label: copy.freightBasis,
                    cells: {
                      share: {
                        amount: revenueSplit.basisAmount,
                        percent: 100,
                      },
                    },
                  }
                : undefined
            }
          />
        )}
        {showAccessoryEmpty ? (
          <p className="text-xs text-muted-foreground">{copy.emptyAccessories}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
