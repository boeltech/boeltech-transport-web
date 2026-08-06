import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "./PlatformAuthProvider";

/**
 * Soft-gate: platform_owner must enroll MFA before using the rest of the console.
 */
export function PlatformMfaEnrollmentGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading } = usePlatformAuth();
  const location = useLocation();

  if (isLoading || !user) {
    return children;
  }

  const onSecurity = location.pathname.startsWith("/platform/security");
  const mustEnroll =
    isPlatformOwner(user.platformRole) && user.mfaEnabled === false;

  if (mustEnroll && !onSecurity) {
    return <Navigate to="/platform/security" replace />;
  }

  return children;
}
