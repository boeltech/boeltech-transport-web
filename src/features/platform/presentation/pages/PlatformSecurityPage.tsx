import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { platformApi } from "../../infrastructure/platformApi";
import { platformQueryKeys, isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTotpSetupQr } from "../components/PlatformTotpSetupQr";

export function PlatformSecurityPage() {
  const copy = platformCopy.security;
  const { toast } = useToast();
  const { user, refreshUser } = usePlatformAuth();
  const mustEnroll = Boolean(
    user && isPlatformOwner(user.platformRole) && user.mfaEnabled === false,
  );

  const statusQuery = useQuery({
    queryKey: [...platformQueryKeys.all, "mfa-status"] as const,
    queryFn: () => platformApi.getMfaStatus(),
  });

  const [setup, setSetup] = useState<{
    otpauthUrl: string;
    secret: string;
  } | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshProfileMfa = async () => {
    await refreshUser();
    await statusQuery.refetch();
  };

  const onSetup = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await platformApi.setupMfa();
      setSetup(result);
      setRecoveryCodes(null);
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const onConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await platformApi.confirmMfa(confirmCode.trim());
      setRecoveryCodes(result.recoveryCodes);
      setSetup(null);
      setConfirmCode("");
      await refreshProfileMfa();
      toast({ title: "MFA activado", variant: "success" });
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const onDisable = async () => {
    setError(null);
    setBusy(true);
    try {
      await platformApi.disableMfa({
        password: disablePassword,
        code: disableCode.trim(),
      });
      setDisablePassword("");
      setDisableCode("");
      await refreshProfileMfa();
      toast({ title: "MFA desactivado", variant: "success" });
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const enabled = statusQuery.data?.enabled ?? user?.mfaEnabled === true;

  return (
    <PlatformPageShell
      title={copy.title}
      description={copy.description}
    >
      {mustEnroll ? (
        <AlertWithIcon variant="warning" className="mb-4">
          {copy.mfaRequiredBanner}
        </AlertWithIcon>
      ) : null}
      {error ? (
        <AlertWithIcon variant="destructive" className="mb-4">
          {error}
        </AlertWithIcon>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <Badge variant={enabled ? "success" : "secondary"}>
            {enabled ? copy.statusEnabled : copy.statusDisabled}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusQuery.data?.enabledAt ? (
            <p className="text-muted-foreground text-sm">
              {copy.enabledAt(statusQuery.data.enabledAt)}
            </p>
          ) : null}

          {!enabled && !setup ? (
            <Button onClick={onSetup} disabled={busy}>
              {copy.setup}
            </Button>
          ) : null}

          {setup ? (
            <div className="space-y-4">
              <p className="text-sm">{copy.secretHint}</p>
              <PlatformTotpSetupQr
                otpauthUrl={setup.otpauthUrl}
                alt="QR MFA plataforma"
                errorMessage="No se pudo generar el QR. Usa el secreto manual."
              />
              <p className="font-mono text-xs break-all">{setup.secret}</p>
              <div className="space-y-2">
                <Label htmlFor="confirm-code">{copy.codeLabel}</Label>
                <Input
                  id="confirm-code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
              <Button onClick={onConfirm} disabled={busy || confirmCode.trim().length < 6}>
                {copy.confirm}
              </Button>
            </div>
          ) : null}

          {recoveryCodes ? (
            <div className="space-y-2 rounded-md border p-3">
              <p className="font-medium text-sm">{copy.recoveryTitle}</p>
              <p className="text-muted-foreground text-xs">{copy.recoveryHint}</p>
              <ul className="font-mono text-sm space-y-1">
                {recoveryCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {enabled ? (
            <div className="space-y-3 border-t pt-4">
              <div className="space-y-2">
                <Label htmlFor="disable-password">{copy.passwordLabel}</Label>
                <Input
                  id="disable-password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="disable-code">{copy.codeLabel}</Label>
                <Input
                  id="disable-code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
              <Button
                variant="destructive"
                onClick={onDisable}
                disabled={
                  busy ||
                  !disablePassword ||
                  disableCode.trim().length < 6 ||
                  mustEnroll
                }
              >
                {copy.disable}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PlatformPageShell>
  );
}
