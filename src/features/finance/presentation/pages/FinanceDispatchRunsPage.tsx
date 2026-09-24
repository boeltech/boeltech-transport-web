import { Navigate } from "react-router-dom";
import { FINANCE_DISPATCH_HISTORY_HREF } from "../../application/financeRoutes";

/**
 * @deprecated Prefer `/finance/dispatch?tab=history`. Redirect-only (F1).
 */
export function FinanceDispatchRunsPage() {
  return <Navigate to={FINANCE_DISPATCH_HISTORY_HREF} replace />;
}
