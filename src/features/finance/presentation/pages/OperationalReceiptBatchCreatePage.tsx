/**
 * Redirect P3 — path legacy lote → formulario único `/finance/collections/new`.
 */

import { Navigate, useParams } from "react-router-dom";

import { buildRegisterCollectionPath } from "@features/finance/application";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";

/**
 * Conserva bookmarks a `/clients/:id/operational-receipt-batches/new`.
 * El form ya no se monta aquí.
 */
export function OperationalReceiptBatchCreatePage() {
  const { id: clientId = "" } = useParams<{ id: string }>();
  const from = useIncomingFrom();

  if (!clientId) {
    return <Navigate to="/clients" replace />;
  }

  return (
    <Navigate
      to={buildRegisterCollectionPath({
        channel: "without_invoice",
        clientId,
        from: from ?? undefined,
      })}
      replace
    />
  );
}
