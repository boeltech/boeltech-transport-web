/**
 * User security panels — MFA TOTP + sesiones activas (MC7–MC9).
 * Vive en Mi cuenta (`/account/security`). Sin SettingsPageShell.
 * Copy: securitySettingsCopy · sin cambios de contrato API MFA.
 */

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Smartphone,
  Monitor,
  Copy,
  Check,
  Laptop,
  Tablet,
  Download,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks/useToast";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  authApi,
  MFA_STATUS_QUERY_KEY,
  useAuth,
  useRevokeOtherSessions,
  type AuthSessionItem,
} from "@features/auth";
import { ROLES } from "@shared/constants/roles";
import { cn } from "@shared/lib/utils/cn";
import { TotpSetupQr } from "../components/TotpSetupQr";
import { OtpSixDigitInput } from "../components/OtpSixDigitInput";
import { securitySettingsCopy as copy } from "../copy/securitySettingsCopy";
import {
  describeUserAgent,
  formatRevokeOthersDescription,
  formatSessionStarted,
  formatSessionWhen,
  sessionDeviceKind,
  sortSessionsCurrentFirst,
} from "../lib/sessionDevice";

const SESSIONS_QUERY_KEY = ["auth", "sessions"] as const;

function SessionDeviceIcon({
  ua,
  className,
}: {
  ua: string | null;
  className?: string;
}) {
  const kind = sessionDeviceKind(ua);
  if (kind === "tablet") return <Tablet className={className} aria-hidden />;
  if (kind === "phone") return <Smartphone className={className} aria-hidden />;
  if (kind === "laptop") return <Laptop className={className} aria-hidden />;
  return <Monitor className={className} aria-hidden />;
}

function downloadRecoveryTxt(codes: string[], filename: string) {
  const blob = new Blob([`${codes.join("\n")}\n`], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** MFA + sesiones (contraseña en PasswordChangeSection de Mi cuenta). */
export const UserSecuritySettings = memo(function UserSecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    revokeOtherSessions,
    isPending: isRevokingOthers,
  } = useRevokeOtherSessions();

  const isAdmin = user?.role === ROLES.ADMIN;

  const mfaQuery = useQuery({
    queryKey: MFA_STATUS_QUERY_KEY,
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
  const [revokeOthersOpen, setRevokeOthersOpen] = useState(false);

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
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
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
      await queryClient.invalidateQueries({ queryKey: MFA_STATUS_QUERY_KEY });
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

  const confirmRevokeOthers = useCallback(async () => {
    try {
      const result = await revokeOtherSessions();
      setRevokeOthersOpen(false);
      toast({
        title: copy.toast.othersRevoked,
        description:
          typeof result?.revoked === "number"
            ? `Se cerraron ${result.revoked} sesión${result.revoked === 1 ? "" : "es"}.`
            : undefined,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: copy.toast.othersRevokeFailed,
        description: mapBackendError(err).message,
        variant: "error",
      });
    }
  }, [revokeOtherSessions, toast]);

  const copyRecovery = useCallback(async () => {
    if (!recoveryCodes?.length) return;
    await navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopiedRecovery(true);
  }, [recoveryCodes]);

  const downloadRecovery = useCallback(() => {
    if (!recoveryCodes?.length) return;
    downloadRecoveryTxt(recoveryCodes, copy.recoveryDialog.downloadFilename);
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
  const showAdminBanner =
    isAdmin && !mfaEnabled && !mfaQuery.isLoading && !mfaQuery.isError;

  const sessions = useMemo(
    () => sortSessionsCurrentFirst(sessionsQuery.data ?? []),
    [sessionsQuery.data],
  );
  const otherSessions = useMemo(
    () => sessions.filter((s) => !s.current),
    [sessions],
  );
  const revokeOthersDescription = formatRevokeOthersDescription(
    otherSessions.map((s) => describeUserAgent(s.userAgent)),
  );

  return (
    <>
      <div className="space-y-6">
        <section
          className="rounded-xl border bg-card"
          aria-labelledby="security-mfa-heading"
        >
          <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
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
                  <Badge variant="neutral" tone="soft">
                    {copy.mfa.statusOff}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {mfaEnabled
                  ? copy.mfa.descriptionOn
                  : copy.mfa.descriptionOff}
                {mfaEnabled && mfaQuery.data?.enabledAt
                  ? ` ${copy.mfa.enabledAt} ${formatSessionWhen(mfaQuery.data.enabledAt)}.`
                  : null}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
              {!mfaEnabled ? (
                <Button
                  type="button"
                  size="sm"
                  variant={isAdmin ? "default" : "outline"}
                  onClick={startSetup}
                  disabled={setupBusy || mfaQuery.isLoading || mfaQuery.isError}
                  isLoading={setupBusy}
                >
                  {copy.mfa.enable}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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

          {mfaQuery.isError || showAdminBanner ? (
            <div className="space-y-3 px-5 pb-5 pt-4">
              {mfaQuery.isError ? (
                <>
                  <AlertWithIcon
                    variant="destructive"
                    title={copy.mfa.errorTitle}
                  >
                    {copy.mfa.errorBody}
                  </AlertWithIcon>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void mfaQuery.refetch()}
                  >
                    {copy.mfa.retry}
                  </Button>
                </>
              ) : null}

              {showAdminBanner ? (
                <AlertWithIcon variant="warning" title={copy.adminBanner.title}>
                  {copy.adminBanner.body}
                </AlertWithIcon>
              ) : null}
            </div>
          ) : (
            <div className="h-4" aria-hidden />
          )}
        </section>

        <section
          className="rounded-xl border bg-card"
          aria-labelledby="security-sessions-heading"
        >
          <div className="flex flex-col gap-3 px-5 pt-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="security-sessions-heading"
                  className="text-base font-semibold tracking-tight"
                >
                  {copy.sessions.title}
                </h2>
                {!sessionsQuery.isLoading && !sessionsQuery.isError ? (
                  <Badge variant="secondary">
                    {copy.sessions.countLabel(sessions.length)}
                  </Badge>
                ) : null}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy.sessions.description}
              </p>
            </div>

            {!sessionsQuery.isLoading &&
            !sessionsQuery.isError &&
            otherSessions.length > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0"
                onClick={() => setRevokeOthersOpen(true)}
              >
                {copy.sessions.revokeOthers}
              </Button>
            ) : null}
          </div>

          <div className="px-5 pb-5 pt-4">
            {sessionsQuery.isError ? (
              <div className="space-y-3">
                <AlertWithIcon
                  variant="destructive"
                  title={copy.sessions.errorTitle}
                >
                  {copy.sessions.errorBody}
                </AlertWithIcon>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => void sessionsQuery.refetch()}
                >
                  {copy.sessions.retry}
                </Button>
              </div>
            ) : null}

            {sessionsQuery.isLoading ? (
              <div
                className="space-y-3 rounded-lg border p-3"
                aria-busy="true"
                aria-label={copy.sessions.loading}
              >
                {[0, 1, 2].map((row) => (
                  <div
                    key={row}
                    className="grid grid-cols-[2fr_1fr_1fr_4rem] gap-4"
                  >
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </div>
            ) : null}

            {!sessionsQuery.isLoading && !sessionsQuery.isError ? (
              <div className="overflow-hidden rounded-lg border">
                <Table density="list">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{copy.sessions.colDevice}</TableHead>
                      <TableHead>{copy.sessions.colIp}</TableHead>
                      <TableHead>{copy.sessions.colLastUsed}</TableHead>
                      <TableHead className="w-24 text-right">
                        <span className="sr-only">
                          {copy.sessions.colActions}
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const deviceTitle = describeUserAgent(session.userAgent);
                      return (
                        <TableRow
                          key={session.id}
                          className={cn(session.current && "bg-muted/40")}
                        >
                          <TableCell>
                            <div className="flex min-w-0 items-start gap-2.5">
                              <SessionDeviceIcon
                                ua={session.userAgent}
                                className="text-muted-foreground mt-0.5 h-[18px] w-[18px] shrink-0"
                              />
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p
                                    className="text-sm font-semibold"
                                    title={session.userAgent ?? undefined}
                                  >
                                    {deviceTitle}
                                  </p>
                                  {session.current ? (
                                    <Badge variant="info" tone="soft">
                                      {copy.sessions.current}
                                    </Badge>
                                  ) : null}
                                </div>
                                <p className="text-muted-foreground text-xs">
                                  {copy.sessions.startedAt(
                                    formatSessionStarted(session.createdAt),
                                  )}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {session.ip ?? "—"}
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatSessionWhen(session.lastUsedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            {!session.current ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={revokingId === session.id}
                                isLoading={revokingId === session.id}
                                onClick={() => void revokeSession(session)}
                              >
                                {copy.sessions.revoke}
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {sessions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-muted-foreground text-sm"
                        >
                          {copy.sessions.empty}
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </div>
            ) : null}

            {!sessionsQuery.isLoading &&
            !sessionsQuery.isError &&
            sessions.length === 1 &&
            sessions[0]?.current ? (
              <p className="text-muted-foreground mt-3 text-xs">
                {copy.sessions.emptyOthers}
              </p>
            ) : null}
          </div>
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
              <AlertWithIcon
                variant="warning"
                title={copy.recoveryDialog.warningTitle}
              >
                {copy.recoveryDialog.warning}
              </AlertWithIcon>
              <ul className="bg-muted grid grid-cols-2 gap-2 rounded-lg p-3 font-mono text-sm">
                {recoveryCodes.map((code) => (
                  <li key={code}>{code}</li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={copyRecovery}>
                  {copiedRecovery ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <Copy className="mr-2 h-4 w-4" />
                  )}
                  {copiedRecovery
                    ? copy.recoveryDialog.copied
                    : copy.recoveryDialog.copy}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={downloadRecovery}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  {copy.recoveryDialog.download}
                </Button>
              </div>
              <DialogFooter>
                <Button type="button" onClick={closeSetupDialog}>
                  {copy.recoveryDialog.done}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-semibold">{copy.setupDialog.stepScan}</p>
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
                  <Label htmlFor="mfa-secret" className="sr-only">
                    {copy.setupDialog.secretLabel}
                  </Label>
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
                      size="sm"
                      className="shrink-0"
                      onClick={copySecret}
                      aria-label={copy.setupDialog.copySecret}
                    >
                      {copiedSecret ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <Copy className="mr-2 h-4 w-4" />
                      )}
                      {copy.setupDialog.copySecret}
                    </Button>
                  </div>
                </div>
              ) : null}
              <div className="space-y-2">
                <p className="text-sm font-semibold">{copy.setupDialog.stepCode}</p>
                <OtpSixDigitInput
                  id="mfa-confirm"
                  value={confirmCode}
                  onChange={setConfirmCode}
                  disabled={setupBusy}
                  autoFocus
                  aria-label={copy.setupDialog.codeLabel}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
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
              <OtpSixDigitInput
                id="disable-code"
                value={disableCode}
                onChange={setDisableCode}
                disabled={disableBusy}
                aria-label={copy.disableDialog.codeLabel}
              />
            </div>
            {isAdmin ? (
              <AlertWithIcon
                variant="warning"
                title={copy.disableDialog.adminWarningTitle}
              >
                {copy.disableDialog.adminWarningBody}
              </AlertWithIcon>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
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

      <Dialog open={revokeOthersOpen} onOpenChange={setRevokeOthersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {copy.revokeOthersDialog.title(otherSessions.length)}
            </DialogTitle>
            <DialogDescription>{revokeOthersDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRevokeOthersOpen(false)}
              disabled={isRevokingOthers}
            >
              {copy.revokeOthersDialog.cancel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void confirmRevokeOthers()}
              disabled={isRevokingOthers || otherSessions.length === 0}
              isLoading={isRevokingOthers}
            >
              {copy.revokeOthersDialog.confirm(otherSessions.length)}
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
