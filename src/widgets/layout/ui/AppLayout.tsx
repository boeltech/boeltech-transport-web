import { AuthProvider } from "@features/auth";
import { ProductOnboardingGate } from "@app/router/guards/ProductOnboardingGate";
import { PermissionProvider } from "@app/providers/PermissionProvider";
import { SidebarProvider } from "@app/providers/SidebarProvider";
import { LayoutShell } from "./LayoutShell";
import { TooltipProvider } from "@shared/ui/tooltip";

/**
 * AppLayout
 *
 * Layout principal para rutas privadas (autenticadas).
 * Incluye providers de auth/RBAC/sidebar y el layout visual.
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
 * Providers globales (App.tsx): Query → Theme → Toast → Router
 *
 * Orden de Providers del shell autenticado (de afuera hacia adentro):
 * 1. AuthProvider           - Autenticación (JWT, user, login/logout)
 * 2. ProductOnboardingGate  - Gate de onboarding de producto
 * 3. PermissionProvider     - RBAC (permisos basados en rol)
 * 4. TooltipProvider        - Tooltips Radix
 * 5. SidebarProvider        - Estado del sidebar (collapsed, mobile)
 * 6. LayoutShell            - UI: Sidebar + Header + Content
 */
export const AppLayout = () => {
  return (
    <AuthProvider>
      <ProductOnboardingGate>
        <PermissionProvider>
          <TooltipProvider delayDuration={250}>
            <SidebarProvider>
              <LayoutShell />
            </SidebarProvider>
          </TooltipProvider>
        </PermissionProvider>
      </ProductOnboardingGate>
    </AuthProvider>
  );
};
