/**
 * Quién timbra las facturas.
 *
 * Una línea de estado (timbrador y modo) más las dos acciones. El modo se
 * conoce al comprobar la conexión: el contrato actual no lo entrega en
 * GET /settings/billing, así que no se inventa un valor persistido.
 */

import { memo } from "react";
import { AlertTriangle, CheckCircle2, FileKey, Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { InfoRow } from "@shared/ui/data-display";

import {
  PAC_PROVIDER_LABELS,
  type PacProvider,
  type RegisterPacEmitterResult,
  type TestPacConnectionResult,
} from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import { BILLING_ANCHORS } from "./BillingReadinessCard";
import { SettingsCard } from "./SettingsLayout";

const copy = billingSettingsCopy.stamping;

export interface BillingStampingCardProps {
  provider: PacProvider;
  canRunActions: boolean;
  connectionResult?: TestPacConnectionResult;
  isTestingConnection: boolean;
  onTestConnection: () => void;
  emitterResult?: RegisterPacEmitterResult;
  isRegisteringEmitter: boolean;
  onRegisterEmitter: () => void;
}

export const BillingStampingCard = memo(function BillingStampingCard({
  provider,
  canRunActions,
  connectionResult,
  isTestingConnection,
  onTestConnection,
  emitterResult,
  isRegisteringEmitter,
  onRegisterEmitter,
}: BillingStampingCardProps) {
  const environment = connectionResult?.environment;

  return (
    <div id={BILLING_ANCHORS.stamping} className="scroll-mt-24">
      <SettingsCard title={copy.title} description={copy.description}>
        <div className="space-y-4">
          <div>
            <InfoRow
              variant="inline"
              label={copy.providerLabel}
              value={PAC_PROVIDER_LABELS[provider] ?? provider}
            />
            <InfoRow
              variant="inline"
              label={copy.environmentLabel}
              value={
                environment === "production"
                  ? copy.environmentProduction
                  : environment === "sandbox"
                    ? copy.environmentSandbox
                    : copy.environmentUnknown
              }
            />
          </div>

          {canRunActions ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onTestConnection}
                  disabled={isTestingConnection}
                >
                  {isTestingConnection ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  {isTestingConnection ? copy.testingConnection : copy.testConnection}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onRegisterEmitter}
                  disabled={isRegisteringEmitter}
                >
                  {isRegisteringEmitter ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileKey className="mr-2 h-4 w-4" />
                  )}
                  {isRegisteringEmitter
                    ? copy.registeringEmitter
                    : copy.registerEmitter}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{copy.registerHint}</p>
            </div>
          ) : null}

          {connectionResult ? (
            <Alert variant={connectionResult.success ? "default" : "warning"}>
              {connectionResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {connectionResult.success
                  ? copy.connectionOkTitle
                  : copy.connectionFailedTitle}
              </AlertTitle>
              <AlertDescription>{connectionResult.message}</AlertDescription>
            </Alert>
          ) : null}

          {emitterResult ? (
            <Alert variant={emitterResult.success ? "default" : "warning"}>
              {emitterResult.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>
                {emitterResult.success ? copy.emitterOkTitle : copy.emitterFailedTitle}
              </AlertTitle>
              <AlertDescription>
                {emitterResult.success ? (
                  emitterResult.message
                ) : (
                  <EmitterFailureDetail result={emitterResult} />
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>
      </SettingsCard>
    </div>
  );
});

// ============================================================================
// DETALLE DE FALLO DEL ALTA
// ============================================================================

/**
 * Nombra el requisito que falta a partir de `reason`. Cuando el servidor no
 * lo clasifica, se muestra su mensaje tal cual en vez de un texto genérico.
 */
function EmitterFailureDetail({ result }: { result: RegisterPacEmitterResult }) {
  const missing = result.reason ? copy.emitterReasons[result.reason] : undefined;

  if (!missing) {
    return <>{result.message}</>;
  }

  return (
    <div className="space-y-1">
      <p>{billingSettingsCopy.readiness.pendingListTitle}</p>
      <ul className="list-inside list-disc">
        <li>{missing}</li>
      </ul>
    </div>
  );
}
