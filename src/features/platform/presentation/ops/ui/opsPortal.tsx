import { useState, type ReactNode } from "react";
import { useOpsResolvedTheme } from "../OpsThemeProvider";
import { OPS_PORTAL_ROOT_ID, OpsPortalContext } from "./opsPortalContext";

/**
 * Host del portal: monta `#ops-portal-root` y expone el nodo vía context
 * (evita race getElementById en el primer paint).
 * Hereda `data-ops-theme` del shell; no redefine colores.
 */
export function OpsPortalHost({ children }: { children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  return (
    <OpsPortalContext.Provider value={el}>
      <div
        id={OPS_PORTAL_ROOT_ID}
        ref={setEl}
        data-testid="ops-portal-root"
      />
      {children}
    </OpsPortalContext.Provider>
  );
}

/** Fallback cuando el portal no está bajo el host (tests / edge). */
export function OpsPortalThemeScope({ children }: { children: ReactNode }) {
  const resolved = useOpsResolvedTheme();
  return (
    <div
      className="platform-ops"
      data-ops-portal=""
      data-ops-theme={resolved}
    >
      {children}
    </div>
  );
}
