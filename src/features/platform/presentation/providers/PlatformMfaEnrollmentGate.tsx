import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { isPlatformOwner } from "../../domain/entities";
import { platformCopy } from "../copy/platformCopy";
import { usePlatformAuth } from "./PlatformAuthProvider";

/**
 * Soft-gate: platform_owner must enroll MFA before using the rest of the console.
 * While auth is loading, do not mount console routes (avoids refresh races / premature queries).
 */
export function PlatformMfaEnrollmentGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, isLoading } = usePlatformAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        role="status"
        aria-live="polite"
        data-testid="platform-auth-loading"
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">
            {platformCopy.shell.authLoading}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const onSecurity = location.pathname.startsWith("/platform/security");
  const mustEnroll =
    isPlatformOwner(user.platformRole) && user.mfaEnabled === false;

  if (mustEnroll && !onSecurity) {
    return <Navigate to="/platform/security" replace />;
  }

  return children;
}
