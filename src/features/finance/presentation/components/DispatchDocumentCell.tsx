import { Fragment } from "react";
import { Link } from "react-router-dom";
import type { DispatchDocumentItem } from "@features/invoicing";
import {
  formatDispatchDocumentLabel,
  sliceRelatedInvoicesForDisplay,
} from "../utils/groupDispatchDocumentsForSend";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";

const linkClassName = "font-mono text-primary hover:underline";

/**
 * Celda Documento del workbench Envíos (Pendientes / Enviadas).
 * REP con related → `{seudofolio} ·` + links a `/invoices/:id` (cap 2 +`+N`).
 * Sin related → solo seudofolio (F0). Factura → link al propio id.
 */
export function DispatchDocumentCell({ doc }: { doc: DispatchDocumentItem }) {
  const fromState = useInvoiceQueueFromState();

  if (doc.documentKind === "invoice") {
    const label = formatDispatchDocumentLabel(doc);
    return (
      <Link
        to={`/invoices/${doc.id}`}
        state={fromState}
        className={linkClassName}
      >
        {label}
      </Link>
    );
  }

  const base = formatDispatchDocumentLabel({
    documentKind: "rep",
    folioLabel: doc.folioLabel,
    relatedInvoices: [],
  });
  const { visible, extraCount } = sliceRelatedInvoicesForDisplay(
    doc.relatedInvoices,
  );

  if (visible.length === 0) {
    return <span className="font-medium">{base}</span>;
  }

  return (
    <span className="font-medium">
      {base}
      {" · "}
      {visible.map((inv, index) => (
        <Fragment key={inv.id}>
          {index > 0 ? ", " : null}
          <Link
            to={`/invoices/${inv.id}`}
            state={fromState}
            className={linkClassName}
          >
            {inv.folioLabel.trim() || inv.id}
          </Link>
        </Fragment>
      ))}
      {extraCount > 0 ? ` +${extraCount}` : null}
    </span>
  );
}
