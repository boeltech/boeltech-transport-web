/**
 * Estado de preparación para facturar.
 *
 * El sello y la numeración se derivan de GET /settings/billing, así que su
 * estado es real al abrir la pantalla. La conexión y el alta ante el timbrador
 * son mutaciones bajo demanda sin persistencia en el contrato actual: se
 * reportan como comprobaciones de la sesión, nunca como estado recordado.
 */

import type { BillingSettings } from "../../domain";

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

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

export type BillingReadinessTone = "ready" | "readyUnverified" | "attention" | "pending";

/**
 * Titular de la ficha. "Listo para facturar" exige que además de los dos
 * requisitos, las dos comprobaciones se hayan ejecutado con éxito en la sesión.
 */
export function resolveReadinessTone(input: {
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  emitter: BillingRequirementStatus;
}): BillingReadinessTone {
  if (input.certificate === "pending" || input.numbering === "pending") {
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
