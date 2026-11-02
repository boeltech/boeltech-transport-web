/**
 * Redirects permanentes ES → EN para Cobros y Efectivo por cobrar.
 * Preservan query (`rfc`, `bucket`, `clientId`, etc.).
 */

import { Navigate, useLocation } from "react-router-dom";
import {
  FINANCE_COBROS_PATH,
  FINANCE_EFECTIVO_POR_COBRAR_PATH,
} from "../../application/financeRoutes";

export function FinanceCobrosLegacyRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${FINANCE_COBROS_PATH}${search}`} replace />;
}

export function FinanceEfectivoPorCobrarLegacyRedirect() {
  const { search } = useLocation();
  return (
    <Navigate to={`${FINANCE_EFECTIVO_POR_COBRAR_PATH}${search}`} replace />
  );
}
