/**
 * Estado de preparación para facturar.
 *
 * Identidad, sello y numeración se derivan de GET settings (persistidos).
 * Conexión y alta ante el timbrador son mutaciones de sesión: nunca se
 * presentan como estado recordado.
 */

import type { BillingSettings } from "../../domain";
import {
  isCompanyIdentityReady,
  type CompanyIdentitySource,
} from "./companyIdentityReadiness";

/** Días de anticipación con los que se avisa el vencimiento del sello. */
export const CERTIFICATE_EXPIRY_WARNING_DAYS = 60;

export type BillingRequirementStatus =
  | "ready"
  | "warning"
  | "pending"
  | "unknown";

export interface CertificateReadiness {
  status: BillingRequirementStatus;
  expiresAt: Date | null;
  /** Días restantes; negativo si ya venció. `null` si no hay fecha. */
  daysRemaining: number | null;
}

export interface NumberingReadiness {
  status: BillingRequirementStatus;
  serie: string | null;
}

export interface IdentityReadiness {
  status: Extract<BillingRequirementStatus, "ready" | "pending" | "unknown">;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function resolveIdentityReadiness(
  settings: CompanyIdentitySource | undefined,
  opts?: { known: boolean },
): IdentityReadiness {
  if (!opts?.known || settings === undefined) {
    return { status: "unknown" };
  }
  return {
    status: isCompanyIdentityReady(settings) ? "ready" : "pending",
  };
}

export function resolveCertificateReadiness(
  settings: Pick<BillingSettings, "certificateConfigured" | "certificateExpiry">,
  now: Date = new Date(),
): CertificateReadiness {
  if (!settings.certificateConfigured) {
    return { status: "pending", expiresAt: null, daysRemaining: null };
  }

  if (!settings.certificateExpiry) {
    return { status: "ready", expiresAt: null, daysRemaining: null };
  }

  const expiresAt = new Date(settings.certificateExpiry);
  if (Number.isNaN(expiresAt.getTime())) {
    return { status: "ready", expiresAt: null, daysRemaining: null };
  }

  const daysRemaining = Math.floor(
    (expiresAt.getTime() - now.getTime()) / MS_PER_DAY,
  );

  if (daysRemaining < 0) {
    return { status: "pending", expiresAt, daysRemaining };
  }
  if (daysRemaining <= CERTIFICATE_EXPIRY_WARNING_DAYS) {
    return { status: "warning", expiresAt, daysRemaining };
  }
  return { status: "ready", expiresAt, daysRemaining };
}

/**
 * La ficha de preparación solo reporta la serie. El consecutivo en curso se
 * muestra en el bloque de numeración vía `nextFolio` del GET /settings/billing.
 */
export function resolveNumberingReadiness(
  settings: Pick<BillingSettings, "serieFactura" | "folioInicial">,
): NumberingReadiness {
  const serie = settings.serieFactura?.trim() || null;

  if (!serie || settings.folioInicial < 1) {
    return { status: "pending", serie };
  }

  return { status: "ready", serie };
}

export type BillingReadinessTone =
  | "ready"
  | "readyUnverified"
  | "attention"
  | "pending";

/**
 * Titular de la ficha. Núcleo = identidad + sello + numeración.
 * "Listo para facturar" exige además las comprobaciones PAC de la sesión.
 */
export function resolveReadinessTone(input: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  emitter: BillingRequirementStatus;
}): BillingReadinessTone {
  if (
    input.identity === "pending" ||
    input.certificate === "pending" ||
    input.numbering === "pending"
  ) {
    return "pending";
  }
  if (input.connection === "pending" || input.emitter === "pending") {
    return "pending";
  }
  if (input.certificate === "warning") {
    return "attention";
  }
  if (input.connection === "ready" && input.emitter === "ready") {
    return "ready";
  }
  return "readyUnverified";
}

/** Núcleo listo (sin exigir checks PAC de sesión). */
export function isBillingCoreReady(input: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
}): boolean {
  return (
    input.identity === "ready" &&
    (input.certificate === "ready" || input.certificate === "warning") &&
    input.numbering === "ready"
  );
}
