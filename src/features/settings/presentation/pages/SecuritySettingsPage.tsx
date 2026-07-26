/**
 * User security panels — MFA TOTP + sesiones activas.
 * Vive en Mi cuenta (`/account/security`). Sin SettingsPageShell.
 * Copy: securitySettingsCopy · sin cambios de contrato API.
 */

import { memo, useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Smartphone,
  Monitor,
  Copy,
  Check,
  Laptop,
  Tablet,
  ShieldCheck,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import { Skeleton } from "@shared/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@shared/ui/dialog";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import { authApi, useAuth, type AuthSessionItem } from "@features/auth";
import { ROLES } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import { TotpSetupQr } from "../components/TotpSetupQr";
import { securitySettingsCopy as copy } from "../copy/securitySettingsCopy";

const MFA_QUERY_KEY = ["auth", "mfa-status"] as const;
const SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;

function formatSessionWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function describeUserAgent(ua: string | null): {
  title: string;
  detail: string | null;
} {
  if (!ua?.trim()) {
    return { title: copy.sessions.unknownDevice, detail: null };
  }

  let browser = "Navegador";
  if (/Edg\//i.test(ua)) browser = "Microsoft Edge";
  else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";

  let os = "";
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  const title = os ? `${browser} · ${os}` : browser;
  const detail = ua.length > 96 ? `${ua.slice(0, 96)}…` : ua;
  return { title, detail };
}

function SessionDeviceIcon({
  ua,
  className,
}: {
  ua: string | null;
  className?: string;
}) {
  if (ua && /iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) {
    return <Tablet className={className} aria-hidden />;
  }
  if (ua && /Mobile|iPhone|Android/i.test(ua)) {
    return <Smartphone className={className} aria-hidden />;
  }
  if (ua) {
    return <Laptop className={className} aria-hidden />;
  }
  return <Monitor className={className} aria-hidden />;
}

/** MFA + sesiones (contraseña en PasswordChangeSection de Mi cuenta). */
export const UserSecuritySettings = memo(function UserSecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isAdmin = user?.role === ROLES.ADMIN;

  const mfaQuery = useQuery({
    queryKey: MFA_QUERY_KEY,
    queryFn: () => authApi.getMfaStatus(),
  });

  const sessionsQuery = useQuery({
    queryKey: SESSIONS_QUERY_KEY,
    queryFn: () => authApi.listSessions(),
  });

  const [setupOpen, setSetupOpen] = useState(false);
  const [setupSecret, setSetupSecret] = useState<string | null>(null);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);

  const [disableOpen, setDisableOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [disableBusy, setDisableBusy] = useState(false);

  const [copiedRecovery, setCopiedRecovery] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    if (!copiedRecovery && !copiedSecret) return;
    const t = window.setTimeout(() => {
      setCopiedRecovery(false);
      setCopiedSecret(false);
    }, 2000);
    return () => window.clearTimeout(t);
  }, [copiedRecovery, copiedSecret]);

  const startSetup = useCallback(async () => {
    setSetupBusy(true);
    try {
      const result = await authApi.setupMfa();
      setSetupSecret(result.secret);
      setSetupUrl(result.otpauthUrl);
      setConfirmCode("");
      setRecoveryCodes(null);
      setSetupOpen(true);
    } catch (err) {
      toast({
        title: copy.toast.setupFailed,
        description: mapBackendError(err).message,
        variant: "error",
      });
    } finally {
      setSetupBusy(false);
    }
  }, [toast]);

  const confirmSetup = useCallback(async () => {
    setSetupBusy(true);
    try {
      const { recoveryCodes: codes } = await authApi.confirmMfa(
        confirmCode.trim(),
      );
      setRecoveryCodes(codes);
      await queryClient.invalidateQueries({ queryKey: MFA_QUERY_KEY });
      toast({
        title: copy.toast.enabled,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: copy.toast.invalidCode,
        description: mapBackendError(err).message,
        variant: "error",
      });
    } finally {
      setSetupBusy(false);
    }
  }, [confirmCode, queryClient, toast]);

  const disableMfa = useCallback(async () => {
    setDisableBusy(true);
    try {
      await authApi.disableMfa({
        password: disablePassword,
        code: disableCode.trim(),
      });
      setDisableOpen(false);
      setDisablePassword("");
      setDisableCode("");
      await queryClient.invalidateQueries({ queryKey: MFA_QUERY_KEY });
      toast({
        title: copy.toast.disabled,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: copy.toast.disableFailed,
        description: mapBackendError(err).message,
        variant: "error",
      });
    } finally {
      setDisableBusy(false);
    }
  }, [disableCode, disablePassword, queryClient, toast]);

  const revokeSession = useCallback(
    async (session: AuthSessionItem) => {
      if (session.current) return;
      setRevokingId(session.id);
      try {
        await authApi.revokeSession(session.id);
        await queryClient.invalidateQueries({ queryKey: SESSIONS_QUERY_KEY });
        toast({ title: copy.toast.sessionRevoked, variant: "success" });
      } catch (err) {
        toast({
          title: copy.toast.sessionRevokeFailed,
          description: mapBackendError(err).message,
          variant: "error",
        });
      } finally {
        setRevokingId(null);
      }
    },
    [queryClient, toast],
  );

  const copyRecovery = useCallback(async () => {
    if (!recoveryCodes?.length) return;
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedRecovery(true);
  }, [recoveryCodes]);

  const copySecret = useCallback(async () => {
    if (!setupSecret) return;
    await navigator.clipboard.writeText(setupSecret);
    setCopiedSecret(true);
  }, [setupSecret]);

  const closeSetupDialog = useCallback(() => {
    setSetupOpen(false);
    setSetupSecret(null);
    setSetupUrl(null);
    setRecoveryCodes(null);
    setConfirmCode("");
  }, []);

  const mfaEnabled = mfaQuery.data?.enabled === true;
  const sessions = sessionsQuery.data ?? [];

  return (
    <>
      <div className="space-y-6">
        <p className="text-muted-foreground text-sm">{copy.page.intro}</p>

        {isAdmin && !mfaEnabled && !mfaQuery.isLoading ? (
          <AlertWithIcon variant="default" title={copy.adminBanner.title}>
            {copy.adminBanner.body}
          </AlertWithIcon>
        ) : null}

        <section
          className="rounded-xl border bg-card p-5 shadow-sm"
          aria-labelledby="security-mfa-heading"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 gap-3">
              <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
                <ShieldCheck className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2
                    id="security-mfa-heading"
                    className="text-base font-semibold tracking-tight"
                  >
                    {copy.mfa.title}
                  </h2>
                  {mfaQuery.isLoading ? (
                    <Badge variant="secondary">{copy.mfa.statusLoading}</Badge>
                  ) : mfaEnabled ? (
                    <Badge variant="success" tone="soft">
                      {copy.mfa.statusOn}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">{copy.mfa.statusOff}</Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {mfaEnabled ? copy.mfa.descriptionOn : copy.mfa.descriptionOff}
                </p>
                {mfaEnabled && mfaQuery.data?.enabledAt ? (
                  <p className="text-muted-foreground text-xs">
                    {copy.mfa.enabledAt}{" "}
                    {formatSessionWhen(mfaQuery.data.enabledAt)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
              {!mfaEnabled ? (
                <Button
                  type="button"
                  onClick={startSetup}
                  disabled={setupBusy || mfaQuery.isLoading}
                  isLoading={setupBusy}
                >
                  {copy.mfa.enable}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDisablePassword("");
                    setDisableCode("");
                    setDisableOpen(true);
                  }}
                >
                  {copy.mfa.disable}
                </Button>
              )}
            </div>
          </div>

          {mfaQuery.isError ? (
            <AlertWithIcon variant="destructive" className="mt-4">
              {mapBackendError(mfaQuery.error).message}
            </AlertWithIcon>
          ) : null}
        </section>

        <section
          className="rounded-xl border bg-card p-5 shadow-sm"
          aria-labelledby="security-sessions-heading"
        >
          <div className="mb-4 flex gap-3">
            <div className="bg-muted text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              <Monitor className="h-5 w-5" aria-hidden />
            </div>
            <div className="space-y-1">
              <h2
                id="security-sessions-heading"
                className="text-base font-semibold tracking-tight"
              >
                {copy.sessions.title}
              </h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.sessions.description}
              </p>
            </div>
          </div>

          {sessionsQuery.isError ? (
            <AlertWithIcon variant="destructive" className="mb-4">
              {mapBackendError(sessionsQuery.error).message}
            </AlertWithIcon>
          ) : null}

          {sessionsQuery.isLoading ? (
            <div
              className="space-y-3"
              aria-busy="true"
              aria-label={copy.sessions.loading}
            >
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <ul className="divide-border divide-y rounded-lg border">
              {sessions.map((session) => {
                const { title, detail } = describeUserAgent(session.userAgent);
                return (
                  <li
                    key={session.id}
                    className={cn(
                      "flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between",
                      session.current && "bg-muted/40",
                    )}
                  >
                    <div className="flex min-w-0 gap-3">
                      <SessionDeviceIcon
                        ua={session.userAgent}
                        className="text-muted-foreground mt-0.5 h-5 w-5 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">{title}</p>
                          {session.current ? (
                            <Badge variant="info" tone="soft">
                              {copy.sessions.current}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-xs">
                          {copy.sessions.lastUsed}:{" "}
                          {formatSessionWhen(session.lastUsedAt)}
                          {session.ip
                            ? ` · ${copy.sessions.ip} ${session.ip}`
                            : ""}
                        </p>
                        {detail && detail !== title ? (
                          <p
                            className="text-muted-foreground/80 truncate text-[11px]"
                            title={session.userAgent ?? undefined}
                          >
                            {detail}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    {!session.current ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 self-start sm:self-center"
                        disabled={revokingId === session.id}
                        isLoading={revokingId === session.id}
                        onClick={() => revokeSession(session)}
                      >
                        {copy.sessions.revoke}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
              {sessions.length === 0 ? (
                <li className="text-muted-foreground p-4 text-sm">
                  {copy.sessions.empty}
                </li>
              ) : null}
            </ul>
          )}
        </section>
      </div>

      <Dialog
        open={setupOpen}
        onOpenChange={(open) => {
          if (!open) closeSetupDialog();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {recoveryCodes
                ? copy.recoveryDialog.title
                : copy.setupDialog.title}
            </DialogTitle>
            <DialogDescription>
              {recoveryCodes
                ? copy.recoveryDialog.description
                : copy.setupDialog.description}
            </DialogDescription>
          </DialogHeader>

          {recoveryCodes ? (
            <div className="space-y-4">
              <AlertWithIcon variant="warning">
                {copy.recoveryDialog.warning}
              </AlertWithIcon>
              <ul className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-3 font-mono text-sm">
                {recoveryCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
              <Button type="button" variant="outline" onClick={copyRecovery}>
                {copiedRecovery ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copiedRecovery
                  ? copy.recoveryDialog.copied
                  : copy.recoveryDialog.copy}
              </Button>
              <DialogFooter>
                <Button type="button" onClick={closeSetupDialog}>
                  {copy.recoveryDialog.done}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {setupUrl ? (
                <TotpSetupQr
                  otpauthUrl={setupUrl}
                  alt={copy.setupDialog.qrAlt}
                  loadingLabel={copy.setupDialog.qrLoading}
                  errorMessage={copy.setupDialog.qrError}
                />
              ) : null}
              {setupSecret ? (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-xs">
                    {copy.setupDialog.cannotScanHint}
                  </p>
                  <Label htmlFor="mfa-secret">{copy.setupDialog.secretLabel}</Label>
                  <div className="flex gap-2">
                    <p
                      id="mfa-secret"
                      className="bg-muted min-w-0 flex-1 break-all rounded-md p-2.5 font-mono text-sm"
                    >
                      {setupSecret}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={copySecret}
                      aria-label={copy.setupDialog.copySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="mfa-confirm">{copy.setupDialog.codeLabel}</Label>
                <Input
                  id="mfa-confirm"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder={copy.setupDialog.codePlaceholder}
                  autoComplete="one-time-code"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSetupDialog}
                  disabled={setupBusy}
                >
                  {copy.setupDialog.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={confirmSetup}
                  disabled={setupBusy || confirmCode.trim().length < 6}
                  isLoading={setupBusy}
                >
                  {copy.setupDialog.confirm}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={disableOpen}
        onOpenChange={(open) => {
          setDisableOpen(open);
          if (!open) {
            setDisablePassword("");
            setDisableCode("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{copy.disableDialog.title}</DialogTitle>
            <DialogDescription>
              {copy.disableDialog.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disable-password">
                {copy.disableDialog.passwordLabel}
              </Label>
              <Input
                id="disable-password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disable-code">{copy.disableDialog.codeLabel}</Label>
              <Input
                id="disable-code"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder={copy.disableDialog.codePlaceholder}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDisableOpen(false)}
              disabled={disableBusy}
            >
              {copy.disableDialog.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={disableMfa}
              disabled={
                disableBusy ||
                !disablePassword ||
                disableCode.trim().length < 6
              }
              isLoading={disableBusy}
            >
              {copy.disableDialog.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
});

/** @deprecated Redirige a `/account/security`. */
export function SecuritySettingsPage() {
  return <Navigate to="/account/security" replace />;
}
