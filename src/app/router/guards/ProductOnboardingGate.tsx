import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@features/auth";

/**
 * Tras autenticación, obliga a completar el onboarding de producto
 * mientras `onboardingCompletedAt` sea `null` en el perfil.
 * Debe montarse bajo `AuthProvider` (p. ej. en `AppLayout`).
 */
export function ProductOnboardingGate({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <>{children}</>;
  }

  /* Solo `null` API (pendiente). `undefined`: sesión cacheada previa al campo — no bloquear. */
  const mustCompleteProductOnboarding = user.onboardingCompletedAt === null;

  if (!mustCompleteProductOnboarding) {
    return <>{children}</>;
  }

  if (
    location.pathname === "/onboarding" ||
    location.pathname === "/settings/subscription"
  ) {
    return <>{children}</>;
  }

  return <Navigate to="/onboarding" replace state={{ from: location }} />;
}
