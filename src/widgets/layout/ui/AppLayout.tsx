// src/widgets/layout/ui/AppLayout.tsx

import { Outlet } from "react-router-dom";
import { QueryProvider } from "@app/providers/QueryProvider";
import { AuthProvider } from "@app/providers/AuthProvider";
import { PermissionProvider } from "@app/providers/PermissionProvider";
import { ThemeProvider } from "@app/providers/ThemeProvider";
import { ToastProvider } from "@app/providers/ToastProvider";
import { Toaster } from "@shared/ui/toast";
import { Sidebar } from "@widgets/sidebar";
import { Header } from "@widgets/header";
import { SidebarProvider, useSidebar } from "@widgets/layout";

/**
 * AppLayout
 *
 * Layout principal para rutas privadas (autenticadas).
 * Incluye todos los providers necesarios y el layout visual.
 *
 * Estructura:
 * ┌─────────────────────────────────────────────────┐
 * │  Header                                         │
 * ├────────────┬────────────────────────────────────┤
 * │            │                                    │
 * │  Sidebar   │         <Outlet />                 │
 * │            │    (contenido de la página)        │
 * │            │                                    │
 * └────────────┴────────────────────────────────────┘
 */
export const AppLayout = () => {
  return (
    <QueryProvider>
      <AuthProvider>
        <PermissionProvider>
          <ThemeProvider>
            <ToastProvider>
              <SidebarProvider>
                <LayoutShell />
              </SidebarProvider>
              <Toaster />
            </ToastProvider>
          </ThemeProvider>
        </PermissionProvider>
      </AuthProvider>
    </QueryProvider>
  );
};

/**
 * Shell del layout (separado para usar el contexto del Sidebar)
 */
const LayoutShell = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Área de contenido con scroll */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
