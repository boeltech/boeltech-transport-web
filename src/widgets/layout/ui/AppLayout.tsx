// src/widgets/layout/ui/AppLayout.tsx

import { QueryProvider } from "@app/providers/QueryProvider";
import { AuthProvider } from "@app/providers/AuthProvider";
import { PermissionProvider } from "@app/providers/PermissionProvider";
import { ThemeProvider } from "@app/providers/ThemeProvider";
import { ToastProvider } from "@app/providers/ToastProvider";
import { SidebarProvider } from "@app/providers/SidebarProvider";
import { LayoutShell } from "./LayoutShell";

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
 *
 * Orden de Providers (de afuera hacia adentro):
 * 1. QueryProvider    - React Query para data fetching
 * 2. AuthProvider     - Autenticación (JWT, user, login/logout)
 * 3. PermissionProvider - RBAC (permisos basados en rol)
 * 4. ThemeProvider    - Dark/Light mode
 * 5. ToastProvider    - Notificaciones toast
 * 6. SidebarProvider  - Estado del sidebar (collapsed, mobile)
 * 7. LayoutShell      - UI: Sidebar + Header + Content
 *
 * Cada provider puede acceder a los providers que lo envuelven:
 * - PermissionProvider puede usar useAuth()
 * - ToastProvider puede usar useTheme()
 * - LayoutShell puede usar todos los hooks
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
            </ToastProvider>
          </ThemeProvider>
        </PermissionProvider>
      </AuthProvider>
    </QueryProvider>
  );
};
