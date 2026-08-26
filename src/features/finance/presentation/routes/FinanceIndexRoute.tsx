import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth";
import { isFinanceAnalyticsEnabled } from "@features/finance/application";
import { resolveLegacyFinanceLocation } from "@features/finance/application/financeRoutes";
import { isClientPortalRole } from "@shared/constants/roles";
import { usePermissions } from "@shared/permissions";
import { FinanceSummaryPage } from "../pages/FinanceSummaryPage";

/**
 * /finance — Resumen para staff con analytics; redirect legacy ?tab=;
 * portal client y dispatcher sin finance.read → /finance/invoices.
 */
export function FinanceIndexRoute() {
  const { search } = useLocation();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const isClientPortal = isClientPortalRole(user?.role);

  if (search.includes("tab=")) {
    return <Navigate to={resolveLegacyFinanceLocation(search)} replace />;
  }

  if (isClientPortal) {
    return <Navigate to="/finance/invoices" replace />;
  }

  const canAnalytics = isFinanceAnalyticsEnabled({
    isClientPortal,
    hasFinanceRead: hasPermission("finance", "read"),
  });

  if (!canAnalytics) {
    return <Navigate to="/finance/invoices" replace />;
  }

  return <FinanceSummaryPage />;
}
