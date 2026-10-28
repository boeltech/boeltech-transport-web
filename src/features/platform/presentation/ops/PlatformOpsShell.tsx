import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { PlatformAuthProvider } from "../providers/PlatformAuthProvider";
import { PlatformMfaEnrollmentGate } from "../providers/PlatformMfaEnrollmentGate";
import { OpsThemeProvider, useOpsTheme } from "./OpsThemeProvider";
import { PlatformCommandPalette } from "./PlatformCommandPalette";
import { usePlatformCommandPaletteHotkey } from "./usePlatformCommandPaletteHotkey";
import { opsCopy } from "./opsCopy";
import { PlatformOpsNav } from "./PlatformOpsNav";
import { PlatformOpsRail } from "./PlatformOpsRail";
import { PlatformOpsTopbar } from "./PlatformOpsTopbar";
import { OpsPortalHost, OpsSheet, OpsSheetContent } from "./ui";
import "./opsTokens.css";

/**
 * Chrome Ops (flag ON). Aislado de AppLayout / AuthProvider ERP / ThemeCycle.
 */
export function PlatformOpsShell() {
  return (
    <PlatformAuthProvider>
      <PlatformMfaEnrollmentGate>
        <OpsThemeProvider>
          <PlatformOpsShellLayout />
        </OpsThemeProvider>
      </PlatformMfaEnrollmentGate>
    </PlatformAuthProvider>
  );
}

function PlatformOpsShellLayout() {
  const { pathname } = useLocation();
  const { resolved } = useOpsTheme();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const openCmd = useCallback(() => setCmdOpen(true), []);
  usePlatformCommandPaletteHotkey(openCmd);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div
      className="platform-ops"
      data-ops-shell="true"
      data-ops-theme={resolved}
      data-testid="platform-ops-shell"
    >
      <a
        href="#contenido-platform-ops"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 ops-bg-accent ops-rounded px-3 py-2 text-xs"
      >
        Saltar al contenido
      </a>

      <OpsPortalHost>
        <PlatformOpsRail pathname={pathname} />
        <PlatformOpsTopbar
          onOpenCommand={openCmd}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <OpsSheet open={menuOpen} onOpenChange={setMenuOpen}>
          <OpsSheetContent
            side="left"
            aria-label={opsCopy.nav.openMenu}
          >
            <PlatformOpsNav
              pathname={pathname}
              onNavigate={() => setMenuOpen(false)}
            />
          </OpsSheetContent>
        </OpsSheet>
        <PlatformCommandPalette open={cmdOpen} onOpenChange={setCmdOpen} />

        <main
          id="contenido-platform-ops"
          className="min-h-screen pt-[var(--ops-topbar-h)] lg:pl-[var(--ops-rail-w)]"
          tabIndex={-1}
        >
          <div className="px-3 pb-4 pt-3 md:px-4 md:pb-6">
            <div className="mx-auto max-w-[1200px]">
              <Outlet />
            </div>
          </div>
        </main>
      </OpsPortalHost>
    </div>
  );
}
