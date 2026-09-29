import { Navigate } from "react-router-dom";

/** Legacy: el catálogo se mueve a Envíos del periodo. */
export function BillingSchemesPage() {
  return <Navigate to="/finance/dispatch/period" replace />;
}
