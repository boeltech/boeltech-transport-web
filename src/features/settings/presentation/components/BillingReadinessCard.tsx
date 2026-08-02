/**
 * Ficha de preparación para facturar.
 *
 * Encabeza /settings/billing y responde, sin scroll, si la empresa puede
 * emitir facturas y qué falta si no. Es presentacional: recibe el estado ya
 * resuelto para poder probarse sin montar la pantalla completa.
 */

import { memo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  XCircle,
} from "lucide-react";

import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import { formatDate } from "@shared/utils/dateUtils";

import { billingSettingsCopy } from "../copy/billingSettingsCopy";
import {
  resolveReadinessTone,
  type BillingRequirementStatus,
  type CertificateReadiness,
  type NumberingReadiness,
} from "../utils/billingReadiness";

const copy = billingSettingsCopy.readiness;

export const BILLING_ANCHORS = {
  certificate: "sello-digital",
  numbering: "numeracion",
  stamping: "timbrado",
} as const;

export interface BillingReadinessCardProps {
  certificate: CertificateReadiness;
  numbering: NumberingReadiness;
  /** Comprobación de conexión de esta sesión. */
  connection: BillingRequirementStatus;
  isCheckingConnection: boolean;
  /** Alta ante el timbrador de esta sesión. */
  emitter: BillingRequirementStatus;
  isRegisteringEmitter: boolean;
}

export const BillingReadinessCard = memo(function BillingReadinessCard({
  certificate,
  numbering,
  connection,
  isCheckingConnection,
  emitter,
  isRegisteringEmitter,
}: BillingReadinessCardProps) {
  const tone = resolveReadinessTone({
    certificate: certificate.status,
    numbering: numbering.status,
    connection,
    emitter,
  });

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
    certificate: certificate.status,
    numbering: numbering.status,
    connection,
    emitter,
  });

  return (
    <section
      aria-label={copy.sectionLabel}
      className="rounded-lg border bg-card text-card-foreground shadow-sm"
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

        <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
          <RequirementRow
            label={copy.requirements.certificate}
            status={certificate.status}
            detail={describeCertificate(certificate)}
          />
          <RequirementRow
            label={copy.requirements.numbering}
            status={numbering.status}
            detail={describeNumbering(numbering)}
          />
        </ul>

        <div className="space-y-1 border-t pt-3">
          <p className="text-xs font-medium text-muted-foreground">
            {copy.checksHeading}
          </p>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            <RequirementRow
              label={copy.requirements.connection}
              status={connection}
              detail={describeCheck(connection, isCheckingConnection, false)}
            />
            <RequirementRow
              label={copy.requirements.emitter}
              status={emitter}
              detail={describeCheck(emitter, isRegisteringEmitter, true)}
            />
          </ul>
          <p className="text-xs text-muted-foreground">{copy.checksHint}</p>
        </div>

        {cta ? (
          <Button asChild size="sm">
            <a href={`#${cta.anchor}`}>{cta.label}</a>
          </Button>
        ) : null}
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

// ============================================================================
// HELPERS
// ============================================================================

function describeCertificate(certificate: CertificateReadiness): string {
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
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  emitter: BillingRequirementStatus;
}): { label: string; anchor: string } | null {
  if (statuses.certificate === "pending") {
    return { label: copy.ctaCertificate, anchor: BILLING_ANCHORS.certificate };
  }
  if (statuses.numbering === "pending") {
    return { label: copy.ctaNumbering, anchor: BILLING_ANCHORS.numbering };
  }
  // Una comprobación que nadie ejecutó no es una tarea pendiente: solo las
  // que fallaron merecen llevar al usuario al bloque de timbrado.
  if (statuses.connection === "pending") {
    return { label: copy.ctaConnection, anchor: BILLING_ANCHORS.stamping };
  }
  if (statuses.emitter === "pending") {
    return { label: copy.ctaEmitter, anchor: BILLING_ANCHORS.stamping };
  }
  return null;
}
