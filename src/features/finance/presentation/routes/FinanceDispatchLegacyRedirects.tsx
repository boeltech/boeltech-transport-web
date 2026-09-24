/**
 * Redirects legacy de envío de facturas → workbench unificado /finance/dispatch.
 */

import { Navigate, useParams } from "react-router-dom";
import {
  FINANCE_DISPATCH_DETAIL_PATH,
  FINANCE_DISPATCH_HISTORY_HREF,
  FINANCE_DISPATCH_PENDING_HREF,
} from "../../application/financeRoutes";

export function FinanceSendInvoicesLegacyRedirect() {
  return <Navigate to={FINANCE_DISPATCH_PENDING_HREF} replace />;
}

export function FinanceDispatchRunsLegacyRedirect() {
  return <Navigate to={FINANCE_DISPATCH_HISTORY_HREF} replace />;
}

export function FinanceDispatchRunDetailLegacyRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    return <Navigate to={FINANCE_DISPATCH_HISTORY_HREF} replace />;
  }
  return <Navigate to={FINANCE_DISPATCH_DETAIL_PATH(id)} replace />;
}
