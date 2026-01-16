import { Outlet } from "react-router-dom";

import { cn } from "@shared/lib/cn";
import { useSidebar } from "@app/providers/SidebarProvider";
import { Sidebar, MobileSidebar } from "@widgets/sidebar";
import { Header } from "@widgets/header";

// ============================================
// Constantes
// ============================================

const SIDEBAR_WIDTH = 256; // 16rem = 256px
const SIDEBAR_COLLAPSED_WIDTH = 64; // 4rem = 64px

/**
 * LayoutShell
 *
 * Componente que estructura el layout principal:
 * - Sidebar (desktop y móvil)
 * - Header
 * - Área de contenido principal
 *
 * Consume el SidebarProvider para manejar el estado.
 */
export const LayoutShell = () => {
  const { collapsed, mobileOpen, toggle, openMobile, closeMobile } =
    useSidebar();

  return (
    <div className="min-h-screen bg-background">
      {/* ==========================================
          Sidebar Desktop
          ========================================== */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300 ease-in-out",
          "hidden lg:block",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <Sidebar />
      </aside>

      {/* ==========================================
          Sidebar Mobile (Drawer)
          ========================================== */}
      <MobileSidebar open={mobileOpen} onClose={closeMobile} />

      {/* ==========================================
          Header
          ========================================== */}
      <Header onMenuClick={openMobile} />

      {/* ==========================================
          Main Content
          ========================================== */}
      <main
        className={cn(
          "min-h-[calc(100vh-4rem)] pt-16 transition-all duration-300 ease-in-out",
          "p-4 md:p-6 lg:p-8",
          // Margen izquierdo para el sidebar en desktop
          collapsed ? "lg:ml-16" : "lg:ml-64"
        )}
      >
        <div className="mx-auto max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
