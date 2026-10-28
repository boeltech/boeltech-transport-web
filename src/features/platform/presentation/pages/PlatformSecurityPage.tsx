import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Badge } from "@shared/ui/badge";
import { DetailAlertCard } from "@shared/ui/data-display";
import { FormStickyActions } from "@shared/ui/form";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { platformApi } from "../../infrastructure/platformApi";
import { platformQueryKeys, isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTotpSetupQr } from "../components/PlatformTotpSetupQr";
import { isPlatformConsoleV1Enabled } from "../ops/platformConsoleV1";
import { OpsSecurityPage } from "../ops/OpsSecurityPage";

export function PlatformSecurityPage() {
  if (isPlatformConsoleV1Enabled()) {
    return <OpsSecurityPage />;
  }
  return <PlatformSecurityPageConform />;
}

function PlatformSecurityPageConform() {
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
      toast({ title: copy.enabledToast, variant: "success" });
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
      toast({ title: copy.disabledToast, variant: "success" });
    } catch (err) {
      setError(mapBackendError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const enabled = statusQuery.data?.enabled ?? user?.mfaEnabled === true;
  const showInlineSetup = !enabled && !setup && !mustEnroll;

  return (
    <PlatformPageShell
      title={copy.title}
      description={copy.description}
    >
      {mustEnroll ? (
        <DetailAlertCard
          className="mb-4"
          severity="warning"
          icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
          title={copy.mfaRequiredTitle}
          action={
            !setup ? (
              <Button size="sm" onClick={onSetup} isLoading={busy}>
                {copy.setup}
              </Button>
            ) : undefined
          }
        >
          {copy.mfaRequiredBanner}
        </DetailAlertCard>
      ) : null}
      {error ? (
        <DetailAlertCard
          className="mb-4"
          severity="critical"
          icon={<AlertCircle className="h-5 w-5" aria-hidden />}
          title={copy.errorTitle}
        >
          {error}
        </DetailAlertCard>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">{copy.title}</CardTitle>
          <Badge variant={enabled ? "success" : "secondary"} tone="soft">
            {enabled ? copy.statusEnabled : copy.statusDisabled}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {statusQuery.data?.enabledAt ? (
            <p className="text-muted-foreground text-sm">
              {copy.enabledAt(statusQuery.data.enabledAt)}
            </p>
          ) : null}

          {showInlineSetup ? (
            <Button onClick={onSetup} isLoading={busy}>
              {copy.setup}
            </Button>
          ) : null}

          {setup ? (
            <div className="space-y-4">
              <p className="text-sm">{copy.secretHint}</p>
              <PlatformTotpSetupQr
                otpauthUrl={setup.otpauthUrl}
                alt={copy.qrAlt}
                errorMessage={copy.qrError}
                loadingLabel={copy.qrLoading}
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
              <FormStickyActions sticky={false}>
                <Button
                  onClick={onConfirm}
                  isLoading={busy}
                  disabled={confirmCode.trim().length < 6}
                >
                  {copy.confirm}
                </Button>
              </FormStickyActions>
            </div>
          ) : null}

          {recoveryCodes ? (
            <div className="space-y-2 rounded-lg border p-3">
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
              <FormStickyActions sticky={false}>
                <Button
                  variant="destructive"
                  onClick={onDisable}
                  isLoading={busy}
                  disabled={
                    !disablePassword ||
                    disableCode.trim().length < 6 ||
                    mustEnroll
                  }
                >
                  {copy.disable}
                </Button>
              </FormStickyActions>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </PlatformPageShell>
  );
}
