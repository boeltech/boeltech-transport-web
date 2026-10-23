/**
 * Ficha de preparación para facturar (hub operate-first).
 *
 * Checklist: identidad → sello → numeración → RFC ante el timbrador (si flag);
 * diagnóstico PAC (conexión + detalle RFC).
 *
 * Pedido 2026-10-23-finkok-registro-clientes (F3): sin UI ProFact /
 * register-emitter; credenciales PAC no visibles.
 */

import { memo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
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
  FinkokEmitterStatuses,
  PAC_PROVIDER_LABELS,
  type PacProvider,
  type TestPacConnectionResult,
} from "../../domain";
import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  isBillingCoreReady,
  resolveFinkokEmitterCta,
  resolveReadinessTone,
  type BillingRequirementStatus,
  type CertificateReadiness,
  type FinkokEmitterCtaKind,
  type FinkokEmitterReadiness,
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
  /** Manager sin rol admin: el sello lo carga otro. */
  certificateUploadRestricted?: boolean;
  /** Paso RFC; omitir o `visible: false` = flag off. */
  finkokEmitter?: FinkokEmitterReadiness;
  isFinkokEmitterMutating?: boolean;
  /** Admin: CTAs verificar/reintentar. Manager: solo lectura. */
  canMutateFinkokEmitter?: boolean;
  onVerifyFinkokEmitter?: () => void;
  onRegisterFinkokEmitter?: () => void;
  provider: PacProvider;
  canRunDiagnostics: boolean;
  connectionResult?: TestPacConnectionResult;
  onTestConnection: () => void;
}

export const BillingReadinessCard = memo(function BillingReadinessCard({
  identity,
  certificate,
  numbering,
  connection,
  isCheckingConnection,
  certificateUploadRestricted = false,
  finkokEmitter,
  isFinkokEmitterMutating = false,
  canMutateFinkokEmitter = false,
  onVerifyFinkokEmitter,
  onRegisterFinkokEmitter,
  provider,
  canRunDiagnostics,
  connectionResult,
  onTestConnection,
}: BillingReadinessCardProps) {
  const finkokVisible = Boolean(finkokEmitter?.visible);
  const finkokBlocksReady = Boolean(finkokEmitter?.blocksReady);

  const tone = resolveReadinessTone({
    identity: identity.status,
    certificate: certificate.status,
    numbering: numbering.status,
    connection,
    finkokEmitterBlocksReady: finkokBlocksReady,
  });

  const coreReady = isBillingCoreReady({
    identity: identity.status,
    certificate: certificate.status,
    numbering: numbering.status,
    finkokEmitterBlocksReady: finkokBlocksReady,
  });

  const diagnosticsForcedOpen =
    connection === "pending" ||
    Boolean(connectionResult && !connectionResult.success) ||
    (finkokVisible &&
      finkokEmitter != null &&
      finkokEmitter.status !== FinkokEmitterStatuses.READY);

  const [diagnosticsOpen, setDiagnosticsOpen] = useState(
    () => !coreReady || diagnosticsForcedOpen,
  );

  const descriptionReady = finkokVisible
    ? copy.descriptionReadyWithRfc
    : copy.descriptionReady;
  const descriptionReadyUnverified = finkokVisible
    ? copy.descriptionReadyUnverifiedWithRfc
    : copy.descriptionReadyUnverified;

  const headline = {
    ready: { title: copy.titleReady, description: descriptionReady },
    readyUnverified: {
      title: copy.titleReadyUnverified,
      description: descriptionReadyUnverified,
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
    certificateUploadRestricted,
    finkokEmitter: finkokVisible ? finkokEmitter : undefined,
    canMutateFinkokEmitter,
  });

  const environment = connectionResult?.environment;
  const finkokDiagCta =
    finkokVisible && finkokEmitter
      ? resolveFinkokEmitterCta(finkokEmitter.status, {
          includeReadyVerify: true,
        })
      : null;

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

        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-2">
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
          {finkokVisible && finkokEmitter ? (
            <RequirementRow
              label={copy.requirements.finkokEmitter}
              status={finkokEmitter.rowStatus}
              detail={describeFinkokEmitter(finkokEmitter)}
              spinning={
                isFinkokEmitterMutating ||
                finkokEmitter.status === FinkokEmitterStatuses.REGISTERING
              }
            />
          ) : null}
        </ul>

        {cta ? (
          cta.to ? (
            <Button asChild size="sm">
              <Link to={cta.to}>{cta.label}</Link>
            </Button>
          ) : cta.finkokAction ? (
            <Button
              type="button"
              size="sm"
              disabled={isFinkokEmitterMutating}
              onClick={() =>
                runFinkokAction(
                  cta.finkokAction,
                  onVerifyFinkokEmitter,
                  onRegisterFinkokEmitter,
                )
              }
            >
              {isFinkokEmitterMutating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {cta.label}
            </Button>
          ) : cta.anchor ? (
            <Button asChild size="sm">
              <a href={`#${cta.anchor}`}>{cta.label}</a>
            </Button>
          ) : null
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
                  detail={describeConnectionCheck(
                    connection,
                    isCheckingConnection,
                  )}
                />
                {finkokVisible && finkokEmitter ? (
                  <RequirementRow
                    label={copy.requirements.finkokEmitter}
                    status={finkokEmitter.rowStatus}
                    detail={describeFinkokEmitter(finkokEmitter)}
                    spinning={
                      isFinkokEmitterMutating ||
                      finkokEmitter.status ===
                        FinkokEmitterStatuses.REGISTERING
                    }
                  />
                ) : null}
              </ul>
              <p className="text-xs text-muted-foreground">{copy.checksHint}</p>

              <div className="flex flex-wrap gap-2">
                {canRunDiagnostics ? (
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
                ) : null}

                {canMutateFinkokEmitter && finkokDiagCta ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isFinkokEmitterMutating}
                    onClick={() =>
                      runFinkokAction(
                        finkokDiagCta,
                        onVerifyFinkokEmitter,
                        onRegisterFinkokEmitter,
                      )
                    }
                  >
                    {isFinkokEmitterMutating ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {finkokCtaLabel(finkokDiagCta)}
                  </Button>
                ) : null}
              </div>

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
  spinning?: boolean;
}

function RequirementRow({
  label,
  status,
  detail,
  spinning = false,
}: RequirementRowProps) {
  const Icon = spinning
    ? Loader2
    : {
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
          spinning && "animate-spin text-muted-foreground",
          !spinning && status === "ready" && "text-success",
          !spinning && status === "warning" && "text-warning",
          !spinning && status === "pending" && "text-destructive",
          !spinning && status === "unknown" && "text-muted-foreground",
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

function describeFinkokEmitter(emitter: FinkokEmitterReadiness): string {
  switch (emitter.status) {
    case FinkokEmitterStatuses.READY:
      return copy.finkokEmitter.ready;
    case FinkokEmitterStatuses.NOT_REGISTERED:
      return copy.finkokEmitter.notRegistered;
    case FinkokEmitterStatuses.REGISTERING:
      return copy.finkokEmitter.registering;
    case FinkokEmitterStatuses.SUSPENDED:
      return copy.finkokEmitter.suspended;
    case FinkokEmitterStatuses.ERROR:
      return emitter.detail?.trim()
        ? `${emitter.detail.trim()} Puedes volver a intentarlo.`
        : copy.finkokEmitter.error;
    default:
      return copy.finkokEmitter.errorFallback;
  }
}

function describeConnectionCheck(
  status: BillingRequirementStatus,
  isRunning: boolean,
): string {
  if (isRunning) return copy.check.running;
  if (status === "ready") return copy.check.ok;
  if (status === "pending") return copy.check.failed;
  return copy.check.unknownConnection;
}

function finkokCtaLabel(kind: FinkokEmitterCtaKind): string {
  if (kind === "register") return copy.ctaFinkokRegister;
  if (kind === "verifyStatus") return copy.ctaFinkokVerifyStatus;
  return copy.ctaFinkokVerify;
}

function runFinkokAction(
  kind: FinkokEmitterCtaKind | undefined,
  onVerify?: () => void,
  onRegister?: () => void,
) {
  if (kind === "register") {
    onRegister?.();
    return;
  }
  if (kind === "verify" || kind === "verifyStatus") {
    onVerify?.();
  }
}

function resolvePrimaryCta(statuses: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  certificateUploadRestricted: boolean;
  finkokEmitter?: FinkokEmitterReadiness;
  canMutateFinkokEmitter: boolean;
}): {
  label: string;
  to?: string;
  anchor?: string;
  finkokAction?: FinkokEmitterCtaKind;
} | null {
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
  if (
    statuses.finkokEmitter?.visible &&
    statuses.finkokEmitter.blocksReady &&
    statuses.canMutateFinkokEmitter
  ) {
    const kind = resolveFinkokEmitterCta(statuses.finkokEmitter.status);
    if (kind) {
      return {
        label: finkokCtaLabel(kind),
        finkokAction: kind,
      };
    }
    // registrando / sin CTA: anclar al diagnóstico
    return {
      label: copy.expandDiagnostics,
      anchor: BILLING_ANCHORS.diagnostics,
    };
  }
  if (
    statuses.finkokEmitter?.visible &&
    statuses.finkokEmitter.blocksReady &&
    !statuses.canMutateFinkokEmitter
  ) {
    return {
      label: copy.expandDiagnostics,
      anchor: BILLING_ANCHORS.diagnostics,
    };
  }
  if (statuses.connection === "pending") {
    return {
      label: copy.ctaConnection,
      anchor: BILLING_ANCHORS.diagnostics,
    };
  }
  return null;
}
