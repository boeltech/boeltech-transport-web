import { useState } from "react";
import { Mail } from "lucide-react";
import { useAuth } from "@features/auth";
import { authApi } from "@features/auth/infrastructure";
import { AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { mapBackendError } from "@shared/utils/errorMapper";

/**
 * Banner soft-gate: pide verificar correo sin bloquear el uso del ERP.
 * Solo se muestra cuando `emailVerifiedAt === null` (explícitamente no verificado).
 */
export function EmailVerificationBanner() {
  const { user, refreshProfile } = useAuth();
  const [sending, setSending] = useState(false);
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
      setMessage(
        result.message ||
          "Te enviamos un nuevo enlace de verificación. Revisa tu bandeja.",
      );
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setSending(false);
    }
  };

  const handleRefreshProfile = async () => {
    try {
      await refreshProfile();
      setMessage("Perfil actualizado.");
    } catch (err) {
      setError(mapBackendError(err).message);
    }
  };

  return (
    <div className="mb-4">
      <AlertWithIcon variant="warning" title="Verifica tu correo">
        <div className="space-y-2 text-sm">
          <p>
            Enviamos un enlace a <strong>{user.email}</strong>. Debes
            verificarlo antes de completar el onboarding.
          </p>
          {message ? <p className="text-foreground">{message}</p> : null}
          {error ? <p className="text-destructive">{error}</p> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={sending}
              onClick={handleResend}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {sending ? "Enviando…" : "Reenviar correo"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleRefreshProfile}
            >
              Ya verifiqué
            </Button>
          </div>
        </div>
      </AlertWithIcon>
    </div>
  );
}
