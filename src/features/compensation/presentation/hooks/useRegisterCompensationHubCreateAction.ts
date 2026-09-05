import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

export interface CompensationHubCreateAction {
  label: string;
  onClick: () => void;
}

export interface CompensationHubOutletContext {
  setCreateAction: (action: CompensationHubCreateAction | null) => void;
}

/**
 * Registers the tab create CTA on the parent HubPageShell header
 * (ListPageShell header is hidden inside the hub).
 */
export function useRegisterCompensationHubCreateAction(
  action: CompensationHubCreateAction | null,
): void {
  const outlet = useOutletContext<CompensationHubOutletContext | undefined>();
  const setCreateAction = outlet?.setCreateAction;

  useEffect(() => {
    if (!setCreateAction) return;
    setCreateAction(action);
    return () => setCreateAction(null);
  }, [setCreateAction, action]);
}
