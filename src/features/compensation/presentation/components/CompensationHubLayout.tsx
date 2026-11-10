import { Outlet, useOutletContext } from "react-router-dom";
import type { CompensationHubOutletContext } from "../hooks/useRegisterCompensationHubCreateAction";

/**
 * @deprecated F2 — retiros hub. No montar en `routes.tsx`.
 * Conservado para smokes legacy.
 */
export function CompensationHubLayout() {
  const parentContext = useOutletContext<CompensationHubOutletContext | undefined>();
  return <Outlet context={parentContext} />;
}
