import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import { platformApi } from "../../infrastructure/platformApi";
import { platformQueryKeys, isPlatformOwner } from "../../domain/entities";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import { PlatformTotpSetupQr } from "../components/PlatformTotpSetupQr";
import { opsCopy } from "./opsCopy";
import { OpsSecretList } from "./patterns/OpsSecretList";
import { OpsAlert } from "./ui/OpsAlert";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import { OpsInput } from "./ui/OpsInput";
import { OpsLabel } from "./ui/OpsLabel";
import {
  OpsPanel,
  OpsPanelBody,
  OpsPanelDescription,
  OpsPanelHeader,
  OpsPanelTitle,
} from "./ui/OpsPanel";

/**
 * Seguridad MFA Ops (flag ON) — OpsPanel/Input, sin Card light.
 */
export function OpsSecurityPage() {
  const copy = platformCopy.security;
  const opsSec = opsCopy.security;
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
    <div data-testid="platform-ops-security" className="space-y-3">
      <div>
        <h1 className="ops-type-h2 ops-text m-0">{opsSec.title}</h1>
        <p className="mt-1 max-w-xl text-xs ops-text-muted">
          {opsSec.description}
        </p>
      </div>

      {mustEnroll ? (
        <OpsAlert tone="warn" title={copy.mfaRequiredTitle}>
          <div className="space-y-2">
            <p className="text-xs">{copy.mfaRequiredBanner}</p>
            {!setup ? (
              <OpsButton
                variant="primary"
                size="sm"
                disabled={busy}
                onClick={() => void onSetup()}
              >
                {copy.setup}
              </OpsButton>
            ) : null}
          </div>
        </OpsAlert>
      ) : null}

      {error ? (
        <OpsAlert tone="danger" title={copy.errorTitle}>
          {error}
        </OpsAlert>
      ) : null}

      <OpsPanel>
        <OpsPanelHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <OpsPanelTitle>{copy.title}</OpsPanelTitle>
            <OpsPanelDescription>{copy.description}</OpsPanelDescription>
          </div>
          <OpsBadge tone={enabled ? "ok" : "muted"}>
            {enabled ? opsSec.statusEnabled : opsSec.statusDisabled}
          </OpsBadge>
        </OpsPanelHeader>
        <OpsPanelBody className="space-y-4">
          {statusQuery.data?.enabledAt ? (
            <p className="text-xs ops-text-muted">
              {copy.enabledAt(statusQuery.data.enabledAt)}
            </p>
          ) : null}

          {showInlineSetup ? (
            <OpsButton
              variant="primary"
              size="sm"
              disabled={busy}
              onClick={() => void onSetup()}
            >
              {copy.setup}
            </OpsButton>
          ) : null}

          {setup ? (
            <div className="space-y-3">
              <p className="text-xs ops-text">{copy.secretHint}</p>
              <PlatformTotpSetupQr
                otpauthUrl={setup.otpauthUrl}
                alt={copy.qrAlt}
                errorMessage={copy.qrError}
                loadingLabel={copy.qrLoading}
              />
              <p className="ops-font-mono text-[11px] break-all ops-text-muted">
                {setup.secret}
              </p>
              <div className="space-y-1">
                <OpsLabel htmlFor="ops-confirm-code">{copy.codeLabel}</OpsLabel>
                <OpsInput
                  id="ops-confirm-code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
              <OpsButton
                variant="primary"
                size="sm"
                disabled={busy || confirmCode.trim().length < 6}
                onClick={() => void onConfirm()}
              >
                {copy.confirm}
              </OpsButton>
            </div>
          ) : null}

          {recoveryCodes ? (
            <OpsSecretList codes={recoveryCodes} hint={copy.recoveryHint} />
          ) : null}

          {enabled ? (
            <div className="ops-border space-y-3 border-t pt-4">
              <div className="space-y-1">
                <OpsLabel htmlFor="ops-disable-password">
                  {copy.passwordLabel}
                </OpsLabel>
                <OpsInput
                  id="ops-disable-password"
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="space-y-1">
                <OpsLabel htmlFor="ops-disable-code">{copy.codeLabel}</OpsLabel>
                <OpsInput
                  id="ops-disable-code"
                  value={disableCode}
                  onChange={(e) => setDisableCode(e.target.value)}
                  autoComplete="one-time-code"
                />
              </div>
              <OpsButton
                variant="danger"
                size="sm"
                disabled={
                  busy ||
                  !disablePassword ||
                  disableCode.trim().length < 6 ||
                  mustEnroll
                }
                onClick={() => void onDisable()}
              >
                {copy.disable}
              </OpsButton>
            </div>
          ) : null}
        </OpsPanelBody>
      </OpsPanel>
    </div>
  );
}
