import { Navigate } from "react-router-dom";
import { FINANCE_DISPATCH_PERIOD_PATH } from "../../application/financeRoutes";

/** @deprecated Prefer `/finance/dispatch/period`. */
export function FinanceDispatchRunsPage() {
  return <Navigate to={FINANCE_DISPATCH_PERIOD_PATH} replace />;
}
