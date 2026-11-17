/**
 * FinanceCobrosInvoiceTable — bandeja Cobros con factura (`EntityListTable`).
 *
 * F2: tabla agrupada por cliente/RFC con casilla de grupo (evolve-ds).
 * Columnas C3: Factura · Emisión · Viajes · Total (MXN) · Cobrado (MXN) · Por cobrar (MXN).
 * Casilla de fila + casilla de grupo (T9); selección ancla RFC.
 * Empty → null (WorkbenchPageShell). Workbench: framed default.
 */

import { useMemo } from "react";
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListGroup,
  type EntityListGroupHeader,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { Button } from "@shared/ui/button";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  FinanceInvoiceListItem,
  FinanceOpenPpdByClient,
} from "@features/finance/domain";
import { financeCopy } from "../copy";
import { isCobrosInvoiceSelectable } from "../utils/cobrosSelection";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";

const copy = financeCopy.cobros;

function invoiceFolio(invoice: FinanceInvoiceListItem): string {
  return `${invoice.serie}-${invoice.folio}`;
}

function TripCodes({ codes }: { codes: string[] }) {
  if (codes.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {codes.slice(0, 2).map((code) => (
        <Badge key={code} variant="secondary" className="text-xs">
          {code}
        </Badge>
      ))}
      {codes.length > 2 ? (
        <Badge variant="secondary" className="text-xs">
          +{codes.length - 2}
        </Badge>
      ) : null}
    </div>
  );
}

interface FinanceCobrosInvoiceTableProps {
  invoices: FinanceInvoiceListItem[];
  /** `meta.by_client` from API for group headers. */
  byClient?: readonly FinanceOpenPpdByClient[];
  selected: Record<string, boolean>;
  /** RFC ancla de la selección; deshabilita filas de otro RFC. */
  anchorRfc?: string | null;
  isLoading?: boolean;
  onToggle: (invoice: FinanceInvoiceListItem, checked: boolean) => void;
  onToggleGroup: (groupKey: string, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
  /** CTA "Registrar cobro" por grupo cuando no hay selección abierta. */
  onRegisterGroup?: (rfc: string, clientId: string | null) => void;
}

function buildColumns(opts: {
  selected: Record<string, boolean>;
  anchorRfc: string | null;
  onToggle: (invoice: FinanceInvoiceListItem, checked: boolean) => void;
}): EntityListColumnDef<FinanceInvoiceListItem>[] {
  const { selected, anchorRfc, onToggle } = opts;

  return [
    {
      id: "select",
      header: "",
      kind: "text",
      className: "w-10",
      headerClassName: "w-10",
      accessor: (invoice) => {
        const folio = invoiceFolio(invoice);
        const selectable = isCobrosInvoiceSelectable(invoice, anchorRfc);
        return (
          <span data-no-row-nav="" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={Boolean(selected[invoice.id])}
              disabled={!selectable}
              onCheckedChange={(checked) =>
                onToggle(invoice, checked === true)
              }
              aria-label={
                selectable
                  ? copy.selectInvoice(folio)
                  : copy.selectInvoiceDisabled(folio)
              }
            />
          </span>
        );
      },
    },
    {
      id: "invoice",
      header: copy.columns.invoice,
      kind: "primary",
      accessor: (invoice) => invoiceFolio(invoice),
    },
    {
      id: "issuedAt",
      header: copy.columns.issuedAt,
      kind: "date",
      accessor: (invoice) => invoice.issuedAt,
    },
    {
      id: "trips",
      header: copy.columns.trips,
      kind: "status",
      accessor: (invoice) => <TripCodes codes={invoice.tripCodes} />,
    },
    {
      id: "total",
      header: "Total (MXN)",
      kind: "money",
      accessor: (invoice) => invoice.total,
    },
    {
      id: "cobrado",
      header: copy.columns.cobrado,
      kind: "stacked",
      stackedWeight: "normal",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (invoice): EntityListStackedValue | null => {
        const paid = invoice.totalPaid;
        if (paid <= 0) return null;
        return {
          primary: (
            <span className="font-mono tabular-nums">
              {formatMxCurrency(paid)}
            </span>
          ),
        };
      },
    },
    {
      id: "balance",
      header: copy.columns.balance,
      kind: "money",
      className: "font-semibold",
      accessor: (invoice) => invoice.balanceDue,
    },
    {
      id: "actions",
      header: "",
      kind: "actions",
      accessor: () => null,
    },
  ];
}

function getGroupKey(invoice: FinanceInvoiceListItem): string {
  return invoice.receiverRfc.trim().toUpperCase();
}

export function FinanceCobrosInvoiceTable({
  invoices,
  byClient,
  selected,
  anchorRfc = null,
  isLoading = false,
  onToggle,
  onToggleGroup,
  onRegisterGroup,
}: FinanceCobrosInvoiceTableProps) {
  const fromState = useInvoiceQueueFromState();

  const byClientMap = useMemo(() => {
    const map = new Map<string, FinanceOpenPpdByClient>();
    for (const client of byClient ?? []) {
      const key = (client.receiverRfc ?? "").trim().toUpperCase();
      if (key) map.set(key, client);
    }
    return map;
  }, [byClient]);

  const columns = useMemo(
    () =>
      buildColumns({
        selected,
        anchorRfc,
        onToggle,
      }),
    [selected, anchorRfc, onToggle],
  );

  const renderGroupHeader = useMemo(() => {
    return (group: EntityListGroup<FinanceInvoiceListItem>): EntityListGroupHeader => {
      const rfc = group.key;
      const meta = byClientMap.get(rfc);
      const name = meta?.clientName?.trim() || group.rows[0]?.receiverName?.trim();
      const invoiceCount = meta?.invoiceCount ?? group.rows.length;
      const totalBalance = meta?.totalBalance ?? group.rows.reduce((s, i) => s + i.balanceDue, 0);
      const displayName = name || rfc;
      const countLabel = invoiceCount === 1
        ? "1 factura"
        : `${invoiceCount} facturas`;

      const selectedInGroup = group.rows.filter((i) => selected[i.id]);
      const allSelected =
        group.rows.length > 0 && selectedInGroup.length === group.rows.length;
      const someSelected = selectedInGroup.length > 0 && !allSelected;
      const groupChecked = allSelected
        ? true
        : someSelected
          ? "indeterminate"
          : false;

      const groupDisabled =
        anchorRfc != null && anchorRfc !== rfc;

      const clientId = meta?.clientId ?? null;

      return {
        title: displayName,
        meta: `${rfc} · ${countLabel}`,
        selection: groupDisabled
          ? undefined
          : {
              checked: groupChecked,
              onCheckedChange: (checked: boolean) => onToggleGroup(rfc, checked),
              "aria-label": copy.selectGroupAria(displayName),
            },
        cells: {
          balance: totalBalance,
          actions:
            !groupDisabled && onRegisterGroup ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onRegisterGroup(rfc, clientId)}
                aria-label={copy.groupRegisterAria(displayName)}
              >
                {copy.groupRegisterCta}
              </Button>
            ) : undefined,
        },
      };
    };
  }, [byClientMap, selected, anchorRfc, onToggleGroup]);

  return (
    <EntityListTable
      density="list"
      aria-label={copy.entityLabelPlural}
      columns={columns}
      rows={invoices}
      getRowId={(row) => row.id}
      isLoading={isLoading}
      primaryTo={(invoice) => `/invoices/${invoice.id}`}
      primaryState={() => fromState}
      getGroupKey={getGroupKey}
      renderGroupHeader={renderGroupHeader}
      getRowClassName={(invoice) =>
        anchorRfc && !isCobrosInvoiceSelectable(invoice, anchorRfc)
          ? "opacity-60"
          : undefined
      }
    />
  );
}
