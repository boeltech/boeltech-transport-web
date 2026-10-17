/**
 * LayoutShell
 *
 * Componente que estructura el layout principal:
 * - Sidebar (desktop y móvil)
 * - Header
 * - Área de contenido principal
 *
 * Consume el SidebarProvider para manejar el estado.
 *
 * Ubicación: src/widgets/layout/ui/LayoutShell.tsx
 */

import { Outlet } from "react-router-dom";

import { cn } from "@shared/lib/utils/cn";
import { useSidebar } from "@/app/providers/SidebarProvider";
import {
  MobileSidebar,
  Sidebar,
  SIDEBAR_COLLAPSED_WIDTH_PX,
  SIDEBAR_MAIN_OFFSET_CLASS,
  SIDEBAR_MAIN_OFFSET_COLLAPSED_CLASS,
  SIDEBAR_WIDTH_PX,
} from "@widgets/sidebar";
import { Header } from "@/widgets/header";
import { EmailVerificationBanner } from "@features/auth";
import { DemoDataBanner } from "@features/dashboard";
import { HelpPanelProvider } from "@features/help-center";

/**
 * LayoutShell
 *
 * Layout principal de la aplicación autenticada.
 * Integra Sidebar, Header y área de contenido.
 */
export function LayoutShell() {
  const { isCollapsed } = useSidebar();

  return (
    <HelpPanelProvider>
      <div className="min-h-screen bg-background">
        <a
          href="#contenido"
          className={cn(
            "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50",
            "focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium",
            "focus:text-foreground focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          Saltar al contenido
        </a>

        {/* ==========================================
            Sidebar Desktop (único landmark aside)
            ========================================== */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
            "hidden lg:block",
          )}
          style={{
            width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH_PX : SIDEBAR_WIDTH_PX,
          }}
          aria-label="Navegación principal"
        >
          <Sidebar />
        </aside>

        {/* ==========================================
            Sidebar Mobile (Drawer — Sheet modal)
            ========================================== */}
        <MobileSidebar />

        {/* ==========================================
            Header
            ========================================== */}
        <Header />

        {/* ==========================================
            Main Content
            ========================================== */}
        <main
          id="contenido"
          className={cn("min-h-screen transition-all duration-300 ease-in-out")}
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
                <EmailVerificationBanner />
                <DemoDataBanner />
                <Outlet />
              </div>
            </div>
          </div>
        </main>
      </div>
    </HelpPanelProvider>
  );
}
