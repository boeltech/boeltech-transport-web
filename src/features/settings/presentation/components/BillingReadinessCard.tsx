/**
 * Ficha de preparación para facturar (hub operate-first).
 *
 * Checklist: identidad → sello → numeración; diagnóstico PAC en un solo bloque.
 */

import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  FileKey,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";

import {
  PAC_PROVIDER_LABELS,
  type PacProvider,
  type RegisterPacEmitterResult,
  type TestPacConnectionResult,
} from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  isBillingCoreReady,
  resolveReadinessTone,
  type BillingRequirementStatus,
  type CertificateReadiness,
  type IdentityReadiness,
  type NumberingReadiness,
} from "../utils/billingReadiness";

const copy = billingSettingsCopy.readiness;
const stampingCopy = billingSettingsCopy.stamping;

export const BILLING_ANCHORS = {
  certificate: "sello-digital",
  numbering: "numeracion",
  diagnostics: "diagnostico-timbrador",
} as const;

export const SETTINGS_GENERAL_PATH = "/settings/general";

export interface BillingReadinessCardProps {
  identity: IdentityReadiness;
  certificate: CertificateReadiness;
  numbering: NumberingReadiness;
  connection: BillingRequirementStatus;
  isCheckingConnection: boolean;
  emitter: BillingRequirementStatus;
  isRegisteringEmitter: boolean;
  /** Manager sin rol admin: el sello lo carga otro. */
  certificateUploadRestricted?: boolean;
  provider: PacProvider;
  canRunDiagnostics: boolean;
  connectionResult?: TestPacConnectionResult;
  emitterResult?: RegisterPacEmitterResult;
  onTestConnection: () => void;
  onRegisterEmitter: () => void;
}

export const BillingReadinessCard = memo(function BillingReadinessCard({
  identity,
  certificate,
  numbering,
  connection,
  isCheckingConnection,
  emitter,
  isRegisteringEmitter,
  certificateUploadRestricted = false,
  provider,
  canRunDiagnostics,
  connectionResult,
  emitterResult,
  onTestConnection,
  onRegisterEmitter,
}: BillingReadinessCardProps) {
  const tone = resolveReadinessTone({
    identity: identity.status,
    certificate: certificate.status,
    numbering: numbering.status,
    connection,
    emitter,
  });

  const coreReady = isBillingCoreReady({
    identity: identity.status,
    certificate: certificate.status,
    numbering: numbering.status,
  });

  const diagnosticsForcedOpen =
    connection === "pending" ||
    emitter === "pending" ||
    Boolean(connectionResult && !connectionResult.success) ||
    Boolean(emitterResult && !emitterResult.success);

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(
    () => !coreReady || diagnosticsForcedOpen,
  );

  const headline = {
    ready: { title: copy.titleReady, description: copy.descriptionReady },
    readyUnverified: {
      title: copy.titleReadyUnverified,
      description: copy.descriptionReadyUnverified,
    },
    attention: {
      title: copy.titleAttention,
      description: copy.descriptionAttention,
    },
    pending: { title: copy.titlePending, description: copy.descriptionPending },
  }[tone];

  const badge = {
    ready: { label: copy.badgeReady, variant: "success" as const },
    readyUnverified: { label: copy.badgeReady, variant: "success" as const },
    attention: { label: copy.badgeAttention, variant: "warning" as const },
    pending: { label: copy.badgePending, variant: "warning" as const },
  }[tone];

  const cta = resolvePrimaryCta({
    identity: identity.status,
    certificate: certificate.status,
    numbering: numbering.status,
    connection,
    emitter,
    certificateUploadRestricted,
  });

  const environment = connectionResult?.environment;

  return (
    <section
      aria-label={copy.sectionLabel}
      className="rounded-xl border bg-card text-card-foreground shadow-sm"
    >
      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{headline.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {headline.description}
            </p>
          </div>
          <Badge variant={badge.variant} tone="soft" className="shrink-0">
            {badge.label}
          </Badge>
        </div>

        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          <RequirementRow
            label={copy.requirements.identity}
            status={identity.status}
            detail={describeIdentity(identity)}
          />
          <RequirementRow
            label={copy.requirements.certificate}
            status={certificate.status}
            detail={describeCertificate(
              certificate,
              certificateUploadRestricted,
            )}
          />
          <RequirementRow
            label={copy.requirements.numbering}
            status={numbering.status}
            detail={describeNumbering(numbering)}
          />
        </ul>

        {cta ? (
          cta.to ? (
            <Button asChild size="sm">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <a href={`#${cta.anchor}`}>{cta.label}</a>
            </Button>
          )
        ) : null}

        <Collapsible
          open={diagnosticsOpen || diagnosticsForcedOpen}
          onOpenChange={setDiagnosticsOpen}
        >
          <div
            id={BILLING_ANCHORS.diagnostics}
            className="space-y-3 border-t pt-3 scroll-mt-24"
          >
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                <span>{copy.checksHeading}</span>
                <span className="inline-flex items-center gap-1">
                  {diagnosticsOpen || diagnosticsForcedOpen
                    ? copy.collapseDiagnostics
                    : copy.expandDiagnostics}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      (diagnosticsOpen || diagnosticsForcedOpen) &&
                        "rotate-180",
                    )}
                    aria-hidden
                  />
                </span>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3">
              <div>
                <InfoRow
                  variant="inline"
                  label={stampingCopy.providerLabel}
                  value={PAC_PROVIDER_LABELS[provider] ?? provider}
                />
                <InfoRow
                  variant="inline"
                  label={stampingCopy.environmentLabel}
                  value={
                    environment === "production"
                      ? stampingCopy.environmentProduction
                      : environment === "sandbox"
                        ? stampingCopy.environmentSandbox
                        : stampingCopy.environmentUnknown
                  }
                />
              </div>

              <ul className="grid gap-x-6 sm:grid-cols-2">
                <RequirementRow
                  label={copy.requirements.connection}
                  status={connection}
                  detail={describeCheck(
                    connection,
                    isCheckingConnection,
                    false,
                  )}
                />
                <RequirementRow
                  label={copy.requirements.emitter}
                  status={emitter}
                  detail={describeCheck(emitter, isRegisteringEmitter, true)}
                />
              </ul>
              <p className="text-xs text-muted-foreground">{copy.checksHint}</p>

              {canRunDiagnostics ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={onTestConnection}
                    disabled={isCheckingConnection}
                  >
                    {isCheckingConnection ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isCheckingConnection
                      ? stampingCopy.testingConnection
                      : stampingCopy.testConnection}
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
                      ? stampingCopy.registeringEmitter
                      : stampingCopy.registerEmitter}
                  </Button>
                </div>
              ) : null}

              {connectionResult ? (
                <Alert
                  variant={connectionResult.success ? "default" : "warning"}
                >
                  {connectionResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {connectionResult.success
                      ? stampingCopy.connectionOkTitle
                      : stampingCopy.connectionFailedTitle}
                  </AlertTitle>
                  <AlertDescription>
                    {connectionResult.message}
                  </AlertDescription>
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
                    {emitterResult.success
                      ? stampingCopy.emitterOkTitle
                      : stampingCopy.emitterFailedTitle}
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
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>
    </section>
  );
});

// ============================================================================
// ROW
// ============================================================================

interface RequirementRowProps {
  label: string;
  status: BillingRequirementStatus;
  detail: string;
}

function RequirementRow({ label, status, detail }: RequirementRowProps) {
  const Icon = {
    ready: CheckCircle2,
    warning: AlertTriangle,
    pending: XCircle,
    unknown: CircleDashed,
  }[status];

  return (
    <li className="flex items-start gap-2 py-1.5">
      <Icon
        aria-hidden
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0",
          status === "ready" && "text-success",
          status === "warning" && "text-warning",
          status === "pending" && "text-destructive",
          status === "unknown" && "text-muted-foreground",
        )}
      />
      <div className="min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p
          className={cn(
            "text-xs",
            status === "warning" ? "text-warning" : "text-muted-foreground",
          )}
        >
          {detail}
        </p>
      </div>
    </li>
  );
}

function EmitterFailureDetail({
  result,
}: {
  result: RegisterPacEmitterResult;
}) {
  const missing = result.reason
    ? stampingCopy.emitterReasons[result.reason]
    : undefined;

  if (!missing) {
    return <>{result.message}</>;
  }

  return (
    <div className="space-y-1">
      <p>{copy.pendingListTitle}</p>
      <ul className="list-inside list-disc">
        <li>{missing}</li>
      </ul>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function describeIdentity(identity: IdentityReadiness): string {
  if (identity.status === "ready") return copy.identity.ready;
  if (identity.status === "unknown") return copy.identity.unknown;
  return copy.identity.missing;
}

function describeCertificate(
  certificate: CertificateReadiness,
  uploadRestricted: boolean,
): string {
  if (certificate.status === "pending" && uploadRestricted) {
    return copy.certificate.adminOnly;
  }
  if (!certificate.expiresAt) {
    return certificate.status === "pending"
      ? copy.certificate.missing
      : copy.certificate.validNoDate;
  }

  const date = formatDate(certificate.expiresAt.toISOString());
  if (certificate.status === "pending") {
    return copy.certificate.expired.replace("{date}", date);
  }
  if (certificate.status === "warning") {
    return copy.certificate.expiring.replace("{date}", date);
  }
  return copy.certificate.valid.replace("{date}", date);
}

function describeNumbering(numbering: NumberingReadiness): string {
  if (numbering.status !== "ready" || !numbering.serie) {
    return copy.numbering.missing;
  }
  return copy.numbering.ready.replace("{serie}", numbering.serie);
}

function describeCheck(
  status: BillingRequirementStatus,
  isRunning: boolean,
  isEmitter: boolean,
): string {
  if (isRunning) return copy.check.running;
  if (status === "ready") {
    return isEmitter ? copy.check.okEmitter : copy.check.ok;
  }
  if (status === "pending") return copy.check.failed;
  return isEmitter ? copy.check.unknownEmitter : copy.check.unknownConnection;
}

function resolvePrimaryCta(statuses: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  emitter: BillingRequirementStatus;
  certificateUploadRestricted: boolean;
}): { label: string; to?: string; anchor?: string } | null {
  if (statuses.identity === "pending") {
    return { label: copy.ctaIdentity, to: SETTINGS_GENERAL_PATH };
  }
  if (
    statuses.certificate === "pending" &&
    !statuses.certificateUploadRestricted
  ) {
    return { label: copy.ctaCertificate, anchor: BILLING_ANCHORS.certificate };
  }
  if (statuses.numbering === "pending") {
    return { label: copy.ctaNumbering, anchor: BILLING_ANCHORS.numbering };
  }
  if (statuses.connection === "pending") {
    return {
      label: copy.ctaConnection,
      anchor: BILLING_ANCHORS.diagnostics,
    };
  }
  if (statuses.emitter === "pending") {
    return { label: copy.ctaEmitter, anchor: BILLING_ANCHORS.diagnostics };
  }
  return null;
}
