/**
 * FinanceCobrosInvoiceTable — bandeja Cobros con factura (`EntityListTable`).
 *
 * Checkbox de lote (T9 ya existía) · Folio · Cliente · Emisión · Viajes ·
 * Total · Saldo. Empty → null (WorkbenchPageShell). Workbench: framed default.
 */

import { useMemo } from "react";
import { Badge } from "@shared/ui/badge";
import { Checkbox } from "@shared/ui/checkbox";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import type { FinanceInvoiceListItem } from "@features/finance/domain";
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
  selected: Record<string, boolean>;
  /** RFC ancla de la selección; deshabilita filas de otro RFC. */
  anchorRfc?: string | null;
  isLoading?: boolean;
  onToggle: (invoice: FinanceInvoiceListItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}

function buildColumns(opts: {
  selected: Record<string, boolean>;
  anchorRfc: string | null;
  selectAllState: boolean | "indeterminate";
  selectableOnPageLength: number;
  onToggle: (invoice: FinanceInvoiceListItem, checked: boolean) => void;
  onTogglePage: (checked: boolean) => void;
}): EntityListColumnDef<FinanceInvoiceListItem>[] {
  const {
    selected,
    anchorRfc,
    selectAllState,
    selectableOnPageLength,
    onToggle,
    onTogglePage,
  } = opts;

  return [
    {
      id: "select",
      header: (
        <Checkbox
          checked={selectAllState}
          onCheckedChange={(checked) => onTogglePage(checked === true)}
          aria-label={copy.selectAllAria}
          disabled={selectableOnPageLength === 0}
        />
      ) as unknown as string,
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
      id: "client",
      header: copy.columns.client,
      kind: "stacked",
      accessor: (invoice): EntityListStackedValue => {
        const name = invoice.receiverName?.trim();
        return {
          primary: name || invoice.receiverRfc,
          secondary: name ? invoice.receiverRfc : undefined,
        };
      },
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
      header: copy.columns.total,
      kind: "money",
      accessor: (invoice) => invoice.total,
    },
    {
      id: "balance",
      header: copy.columns.balance,
      kind: "money",
      className: "font-semibold",
      accessor: (invoice) => invoice.balanceDue,
    },
  ];
}

export function FinanceCobrosInvoiceTable({
  invoices,
  selected,
  anchorRfc = null,
  isLoading = false,
  onToggle,
  onTogglePage,
}: FinanceCobrosInvoiceTableProps) {
  const fromState = useInvoiceQueueFromState();
  const selectableOnPage = invoices.filter((invoice) =>
    isCobrosInvoiceSelectable(invoice, anchorRfc),
  );
  const selectedOnPage = selectableOnPage.filter(
    (invoice) => selected[invoice.id],
  );
  const allSelected =
    selectableOnPage.length > 0 &&
    selectedOnPage.length === selectableOnPage.length;
  const someSelected = selectedOnPage.length > 0 && !allSelected;
  const selectAllState = allSelected
    ? true
    : someSelected
      ? "indeterminate"
      : false;
  const showSameRfcHint =
    Boolean(anchorRfc) &&
    invoices.some((invoice) => !isCobrosInvoiceSelectable(invoice, anchorRfc));

  const columns = useMemo(
    () =>
      buildColumns({
        selected,
        anchorRfc,
        selectAllState,
        selectableOnPageLength: selectableOnPage.length,
        onToggle,
        onTogglePage,
      }),
    [
      selected,
      anchorRfc,
      selectAllState,
      selectableOnPage.length,
      onToggle,
      onTogglePage,
    ],
  );

  return (
    <>
      {showSameRfcHint ? (
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          {copy.sameRfcOnlyHint}
        </p>
      ) : null}
      <EntityListTable
        density="list"
        aria-label={copy.entityLabelPlural}
        columns={columns}
        rows={invoices}
        getRowId={(row) => row.id}
        isLoading={isLoading}
        primaryTo={(invoice) => `/invoices/${invoice.id}`}
        primaryState={() => fromState}
        getRowClassName={(invoice) =>
          isCobrosInvoiceSelectable(invoice, anchorRfc)
            ? undefined
            : "opacity-60"
        }
      />
    </>
  );
}
