import { AuthProvider } from "@features/auth";
import { ProductOnboardingGate } from "@app/router/guards/ProductOnboardingGate";
import { SubscriptionRequiredGate } from "@app/router/guards/SubscriptionRequiredGate";
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
 * Providers globales (App.tsx): Query → Theme → Toast → Router
 *
 * Orden de Providers del shell autenticado (de afuera hacia adentro):
 * 1. AuthProvider                - Autenticación (JWT, user, login/logout)
 * 2. ProductOnboardingGate       - Gate de onboarding de producto
 * 3. SubscriptionRequiredGate    - Gate suscripción operativa (ADR-0064)
 * 4. PermissionProvider          - RBAC (permisos basados en rol)
 * 5. TooltipProvider             - Tooltips Radix
 * 6. SidebarProvider             - Estado del sidebar (collapsed, mobile)
 * 7. LayoutShell                 - UI: Sidebar + Header + Content
 */
export const AppLayout = () => {
  return (
    <AuthProvider>
      <ProductOnboardingGate>
        <SubscriptionRequiredGate>
          <PermissionProvider>
            <TooltipProvider delayDuration={250}>
              <SidebarProvider>
                <LayoutShell />
              </SidebarProvider>
            </TooltipProvider>
          </PermissionProvider>
        </SubscriptionRequiredGate>
      </ProductOnboardingGate>
    </AuthProvider>
  );
};
