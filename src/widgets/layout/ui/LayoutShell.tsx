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
 * Ubicación: src/app/layouts/LayoutShell.tsx
 */

import { Outlet } from "react-router-dom";

import { cn } from "@shared/lib/utils";
import { useSidebar } from "@/app/providers/SidebarProvider";
import { Sidebar, MobileSidebar } from "@/widgets/sidebar";
import { Header } from "@/widgets/header";

// ============================================
// Constantes
// ============================================

const SIDEBAR_WIDTH = 260; // px
const SIDEBAR_COLLAPSED_WIDTH = 70; // px

/**
 * LayoutShell
 *
 * Layout principal de la aplicación autenticada.
 * Integra Sidebar, Header y área de contenido.
 */
export function LayoutShell() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* ==========================================
          Sidebar Desktop
          ========================================== */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
          "hidden lg:block",
        )}
        style={{
          width: isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH,
        }}
      >
        <Sidebar />
      </aside>

      {/* ==========================================
          Sidebar Mobile (Drawer)
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
        className={cn("min-h-screen transition-all duration-300 ease-in-out")}
        style={{
          marginLeft: 0,
          // Solo aplicar margin en desktop (lg+)
        }}
      >
        {/* Wrapper con margin responsive */}
        <div
          className={cn(
            "min-h-screen transition-all duration-300 ease-in-out",
            isCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]",
          )}
        >
          {/* Content wrapper con padding */}
          <div className="pt-20 px-4 pb-4 md:px-6 md:pb-6 lg:px-8 lg:pb-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
