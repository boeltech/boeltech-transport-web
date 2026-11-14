/**
 * FinanceInvoiceListTable — facturas del hub Finanzas (`EntityListTable`).
 *
 * ≤7 cols: Folio · Cliente · Fecha+método · Total · Saldo · Viajes · Estado(+envío).
 * Empty → null (WorkbenchPageShell). Workbench sin card de List: framed default.
 * Sin checkboxes (T9: no hay lote en este listado).
 */

import { useMemo } from "react";
import { Badge } from "@shared/ui/badge";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  FinanceInvoiceListItem,
  FinanceInvoiceStatus,
} from "@features/finance/domain";
import {
  getDisplayAmountsFromInvoiceFields,
  InvoiceBillingScopeBadge,
  InvoiceEmailDispatchBadge,
  invoicingCopy,
} from "@features/invoicing";
import { FinanceInvoiceStatusBadge } from "../config/financeInvoiceStatusConfig";
import { financeCopy } from "../copy";
import { formatFinancePaymentMethodLabel } from "../utils/formatFinancePaymentMethod";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";

const copy = financeCopy.invoices;

function splitSharePercentLabel(percent: number): string {
  return invoicingCopy.splitShare.sharePercentShort(percent);
}

/** Saldo mostrado vía dominio compartido (PUE stamped sin cobro ≠ liquidada). */
function getListDisplayAmounts(invoice: FinanceInvoiceListItem) {
  return getDisplayAmountsFromInvoiceFields({
    status: invoice.status,
    paymentMethod: invoice.paymentMethod,
    total: invoice.total,
    totalPaid: invoice.totalPaid,
  });
}

function statusLabel(
  status: FinanceInvoiceStatus,
  isClientPortal: boolean,
): string {
  if (isClientPortal) return copy.statusLabelsClient[status];
  return copy.statusLabels[status];
}

interface FinanceInvoiceListTableProps {
  invoices: FinanceInvoiceListItem[];
  isLoading: boolean;
  /** Host legacy; navegación = link primario. */
  onView: (id: string) => void;
  /** Portal client: oculta Cliente/RFC y Envío; labels de estado entendibles. */
  isClientPortal?: boolean;
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

function buildColumns(
  isClientPortal: boolean,
): EntityListColumnDef<FinanceInvoiceListItem>[] {
  const columns: EntityListColumnDef<FinanceInvoiceListItem>[] = [
    {
      id: "folio",
      header: copy.table.folio,
      kind: "primary",
      accessor: (invoice): EntityListStackedValue => ({
        primary: (
          <span className="font-mono tabular-nums">
            {`${invoice.serie}-${invoice.folio}`}
          </span>
        ),
        secondary: invoice.billingScope ? (
          <span className="inline-flex flex-wrap items-center gap-1.5 font-sans">
            <InvoiceBillingScopeBadge scope={invoice.billingScope} />
            {invoice.billingScope === "split_share" &&
            invoice.sharePercent != null ? (
              <span className="text-xs font-normal text-muted-foreground">
                {splitSharePercentLabel(invoice.sharePercent)}
              </span>
            ) : null}
          </span>
        ) : undefined,
      }),
    },
  ];

  if (!isClientPortal) {
    columns.push({
      id: "client",
      header: copy.table.client,
      kind: "stacked",
      accessor: (invoice): EntityListStackedValue => ({
        primary: invoice.receiverName,
        secondary: invoice.receiverRfc,
      }),
    });
  }

  columns.push(
    {
      id: "issued",
      header: copy.table.date,
      kind: "stacked",
      accessor: (invoice): EntityListStackedValue => ({
        primary: formatDate(invoice.issuedAt),
        secondary: (
          <Badge variant="outline" className="text-xs font-normal">
            {formatFinancePaymentMethodLabel(invoice.paymentMethod)}
          </Badge>
        ),
      }),
    },
    {
      id: "total",
      header: copy.table.total,
      kind: "money",
      accessor: (invoice) => invoice.total,
    },
    {
      id: "balance",
      header: copy.table.balance,
      kind: "status",
      headerClassName: "text-right",
      className: "text-right",
      accessor: (invoice) => {
        const { balanceDue } = getListDisplayAmounts(invoice);
        if (balanceDue > 0) {
          return (
            <span className="font-medium font-mono tabular-nums text-destructive">
              {formatMxCurrency(balanceDue)}
            </span>
          );
        }
        return (
          <span className="text-sm text-success">{copy.table.paid}</span>
        );
      },
    },
    {
      id: "trips",
      header: isClientPortal ? copy.table.tripsClient : copy.table.trips,
      kind: "status",
      accessor: (invoice) => <TripCodes codes={invoice.tripCodes} />,
    },
    {
      id: "status",
      header: copy.table.status,
      kind: "status",
      accessor: (invoice) => (
        <div className="flex flex-col items-start gap-1">
          {isClientPortal ? (
            <Badge variant="secondary" className="text-xs font-normal">
              {statusLabel(invoice.status, true)}
            </Badge>
          ) : (
            <FinanceInvoiceStatusBadge status={invoice.status} />
          )}
          {!isClientPortal ? (
            <InvoiceEmailDispatchBadge
              status={invoice.status}
              dispatchSentAt={invoice.dispatchSentAt}
              autoDispatchLastItemStatus={
                invoice.autoDispatch?.lastItemStatus
              }
            />
          ) : null}
        </div>
      ),
    },
  );

  return columns;
}

export function FinanceInvoiceListTable({
  invoices,
  isLoading,
  onView: _onView,
  isClientPortal = false,
}: FinanceInvoiceListTableProps) {
  const fromState = useInvoiceQueueFromState();
  const columns = useMemo(
    () => buildColumns(isClientPortal),
    [isClientPortal],
  );

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
    />
  );
}
