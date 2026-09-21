import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@features/auth";
import { authApi } from "@features/auth/infrastructure";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { toastSuccess } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { emailVerificationBannerCopy as copy } from "./emailVerificationBannerCopy";

/**
 * Banner soft-gate: pide verificar correo sin bloquear el uso del ERP.
 * Solo se muestra cuando `emailVerifiedAt === null` (explícitamente no verificado).
 */
export function EmailVerificationBanner() {
  const { user, refreshProfile } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user || user.emailVerifiedAt !== null) {
    return null;
  }

  const handleResend = async () => {
    setSending(true);
    setError(null);
    setMessage(null);
    try {
      const result = await authApi.resendEmailVerification();
      setMessage(result.message || copy.resendSuccessDefault);
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setSending(false);
    }
  };

  const handleRefreshProfile = async () => {
    setChecking(true);
    setError(null);
    setMessage(null);
    try {
      const updated = await refreshProfile();
      if (updated?.emailVerifiedAt != null) {
        toastSuccess(copy.verifiedToast);
        return;
      }
      setMessage(copy.stillPending);
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setChecking(false);
    }
  };

  const busy = sending || checking;

  return (
    <div className="mb-4">
      <AlertWithIcon variant="warning" title={copy.title}>
        <div className="space-y-2 text-sm">
          <p>{copy.body(user.email)}</p>
          {message ? <p className="text-foreground">{message}</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy}
              onClick={handleResend}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {sending ? copy.resendSending : copy.resendButton}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={handleRefreshProfile}
            >
              {checking ? copy.confirmChecking : copy.confirmButton}
            </Button>
          </div>
        </div>
      </AlertWithIcon>
    </div>
  );
}
