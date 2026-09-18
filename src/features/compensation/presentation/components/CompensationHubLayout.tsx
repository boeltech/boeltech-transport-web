import { Outlet, useOutletContext } from "react-router-dom";
import type { CompensationHubOutletContext } from "../hooks/useRegisterCompensationHubCreateAction";

/**
 * Nested under OperatorPaymentsHubLayout (D-P1).
 * Forwards the parent hub context so templates/corridors register their create CTA
 * on the operator-payments chrome (no nested HubPageShell).
 */
export function CompensationHubLayout() {
  const parentContext = useOutletContext<CompensationHubOutletContext | undefined>();
  return <Outlet context={parentContext} />;
}
