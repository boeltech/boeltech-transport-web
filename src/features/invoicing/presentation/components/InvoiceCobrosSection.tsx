/**
 * «Cobros de esta factura» (F3 · C22–C23).
 * Tabla DS + franja Total · Cobrado · Por cobrar + Ver cobro.
 * La hoja unificada la monta el host de composición (widget) — invoicing no importa finance.
 */

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { DollarSign } from "lucide-react";

import type { Invoice, Payment } from "@features/invoicing/domain";
import { invoicingCopy } from "../copy/invoicingCopy";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  EntityListTable,
  type EntityListColumnDef,
} from "@shared/ui/table";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";

import { RepStatusBadge } from "../config/repStatusConfig";

const copy = invoicingCopy.detail.cobrosSection;
const viewCobro = invoicingCopy.detail.actions.viewCobro;
const emDash = copy.emDash;

/** Literales alineados a financeRoutes (invoicing no importa finance). */
const COLLECTIONS_NEW_PATH = "/finance/collections/new";

function buildInvoiceRegisterCobroHref(params: {
  invoiceId: string;
  receiverRfc: string;
  from?: string;
}): string {
  const search = new URLSearchParams();
  search.set("channel", "with_invoice");
  search.set("invoiceId", params.invoiceId);
  const rfc = params.receiverRfc.trim().toUpperCase();
  if (rfc) search.set("receiverRfc", rfc);
  const from = params.from?.trim();
  if (from) search.set("from", from);
  return `${COLLECTIONS_NEW_PATH}?${search.toString()}`;
}

type CobroRow = {
  id: string;
  payment: Payment;
  balanceAfter: number | null;
};

function buildBalanceAfterByPayment(
  payments: readonly Payment[],
  invoiceTotal: number,
): Map<string, number> {
  const sorted = [...payments].sort((a, b) => {
    const da = `${a.paymentDate}T${a.paymentTime}`;
    const db = `${b.paymentDate}T${b.paymentTime}`;
    return da.localeCompare(db);
  });
  const map = new Map<string, number>();
  let remaining = invoiceTotal;
  for (const payment of sorted) {
    const abono =
      payment.repImpPagado != null ? payment.repImpPagado : payment.amountMxn;
    remaining = Math.max(0, Number((remaining - abono).toFixed(2)));
    map.set(
      payment.id,
      payment.repImpSaldoInsoluto != null
        ? payment.repImpSaldoInsoluto
        : remaining,
    );
  }
  return map;
}

export interface InvoiceCobrosSectionProps {
  invoice: Invoice;
  canRegister: boolean;
  fromPath?: string;
  onViewCobro: (paymentId: string) => void;
}

export function InvoiceCobrosSection({
  invoice,
  canRegister,
  fromPath,
  onViewCobro,
}: InvoiceCobrosSectionProps) {
  const balanceById = useMemo(
    () => buildBalanceAfterByPayment(invoice.payments, invoice.total),
    [invoice.payments, invoice.total],
  );

  const rows: CobroRow[] = useMemo(
    () =>
      invoice.payments.map((payment) => ({
        id: payment.id,
        payment,
        balanceAfter: balanceById.get(payment.id) ?? null,
      })),
    [invoice.payments, balanceById],
  );

  const registerHref = buildInvoiceRegisterCobroHref({
    invoiceId: invoice.id,
    receiverRfc: invoice.receiverRfc,
    from: fromPath ?? `/invoices/${invoice.id}`,
  });

  const columns: EntityListColumnDef<CobroRow>[] = useMemo(
    () => [
      {
        id: "date",
        header: copy.columns.date,
        kind: "stacked",
        accessor: (row) => ({
          primary: formatDate(row.payment.paymentDate),
          secondary: undefined,
        }),
      },
      {
        id: "form",
        header: copy.columns.form,
        kind: "stacked",
        accessor: (row) => ({
          primary:
            row.payment.paymentFormName ?? row.payment.paymentForm,
          secondary: row.payment.reference
            ? row.payment.reference
            : undefined,
        }),
      },
      {
        id: "installment",
        header: copy.columns.installment,
        kind: "number",
        accessor: (row) => row.payment.repNumParcialidad ?? emDash,
      },
      {
        id: "amount",
        header: copy.columns.amount,
        kind: "money",
        accessor: (row) =>
          row.payment.repImpPagado != null
            ? row.payment.repImpPagado
            : row.payment.amountMxn,
      },
      {
        id: "balanceAfter",
        header: copy.columns.balanceAfter,
        kind: "money",
        accessor: (row) => row.balanceAfter,
      },
      {
        id: "comprobante",
        header: copy.columns.comprobante,
        kind: "status",
        accessor: (row) => (
          <RepStatusBadge status={row.payment.repStatus} />
        ),
      },
      {
        id: "actions",
        header: "",
        kind: "actions",
        accessor: (row) => (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onViewCobro(row.payment.id)}
          >
            {viewCobro}
          </Button>
        ),
      },
    ],
    [onViewCobro],
  );

  const showRegister = canRegister && (invoice.balanceDue ?? 0) > 0;
  const collected = invoice.totalPaid ?? 0;
  const balanceDue = invoice.balanceDue ?? 0;

  return (
    <Card id="invoice-payments">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">
            {copy.title(invoice.payments.length)}
          </CardTitle>
          {showRegister ? (
            <Button type="button" size="sm" asChild>
              <Link to={registerHref} aria-label={copy.registerCtaAria}>
                <DollarSign className="mr-1.5 h-4 w-4" aria-hidden />
                {copy.registerCta}
              </Link>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">{copy.total}</p>
            <p className="font-semibold tabular-nums">
              {formatMxCurrency(invoice.total)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{copy.collected}</p>
            <p className="font-semibold tabular-nums">
              {formatMxCurrency(collected)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{copy.balanceDue}</p>
            <p className="font-semibold tabular-nums">
              {formatMxCurrency(balanceDue)}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{copy.empty}</p>
        ) : (
          <EntityListTable
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            density="compact"
            framed={false}
          />
        )}
      </CardContent>
    </Card>
  );
}
