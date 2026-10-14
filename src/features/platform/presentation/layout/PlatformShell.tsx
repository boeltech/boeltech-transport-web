import { Outlet } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import {
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_MAIN_OFFSET_CLASS,
  SIDEBAR_MAIN_OFFSET_COLLAPSED_CLASS,
  SIDEBAR_WIDTH_PX,
} from "@widgets/sidebar";
import { PlatformAuthProvider } from "../providers/PlatformAuthProvider";
import { PlatformMfaEnrollmentGate } from "../providers/PlatformMfaEnrollmentGate";
import {
  PlatformSidebarProvider,
  usePlatformSidebar,
} from "../providers/PlatformSidebarProvider";
import { PlatformHeader } from "./PlatformHeader";
import { PlatformMobileSidebar } from "./PlatformMobileSidebar";
import { PlatformSidebar } from "./PlatformSidebar";

/**
 * Chrome aislado de `/platform/*` (ADR-0062).
 * No monta AppLayout / AuthProvider / PermissionProvider del ERP.
 */
export function PlatformShell() {
  return (
    <PlatformAuthProvider>
      <PlatformSidebarProvider>
        <PlatformMfaEnrollmentGate>
          <PlatformShellLayout />
        </PlatformMfaEnrollmentGate>
      </PlatformSidebarProvider>
    </PlatformAuthProvider>
  );
}

function PlatformShellLayout() {
  const { isCollapsed } = usePlatformSidebar();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#contenido-platform"
        className={cn(
          "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50",
          "focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
          "focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
        )}
      >
        Saltar al contenido
      </a>

      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen transition-all duration-300 ease-in-out lg:block"
        style={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH_PX : SIDEBAR_WIDTH_PX,
        }}
        aria-label="Navegación de plataforma"
      >
        <PlatformSidebar />
      </aside>

      <PlatformMobileSidebar />
      <PlatformHeader />

      <main
        id="contenido-platform"
        className="min-h-screen transition-all duration-300 ease-in-out"
        tabIndex={-1}
      >
        <div
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out",
            isCollapsed
              ? SIDEBAR_MAIN_OFFSET_COLLAPSED_CLASS
              : SIDEBAR_MAIN_OFFSET_CLASS,
          )}
        >
          <div className="px-4 pb-4 pt-16 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
