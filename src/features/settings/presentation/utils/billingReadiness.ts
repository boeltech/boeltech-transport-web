/**
 * Estado de preparación para facturar.
 *
 * Identidad, sello y numeración se derivan de GET settings (persistidos).
 * Conexión es mutación de sesión. RFC ante Finkok viene del embed/cache
 * (pedido 2026-10-23-finkok-registro-clientes, A3).
 */

import type { BillingSettings, FinkokEmitterStatus } from "../../domain";
import { FinkokEmitterStatuses } from "../../domain";
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

export interface FinkokEmitterReadiness {
  /** Flag on y status distinto de unavailable → mostrar paso en checklist. */
  visible: boolean;
  status: FinkokEmitterStatus;
  detail: string | null;
  /** Icono de fila en checklist. */
  rowStatus: BillingRequirementStatus;
  /** A3: bloquea ready / readyUnverified cuando visible y no ready. */
  blocksReady: boolean;
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

function finkokRowStatus(
  status: FinkokEmitterStatus,
  isMutating: boolean,
): BillingRequirementStatus {
  if (isMutating || status === FinkokEmitterStatuses.REGISTERING) {
    return "unknown";
  }
  if (status === FinkokEmitterStatuses.READY) return "ready";
  return "pending";
}

/**
 * Resuelve el paso «RFC ante el timbrador». Flag off / unavailable → oculto
 * (no entra a A3). Cache vacía con flag on se trata como no_registrado.
 */
export function resolveFinkokEmitterReadiness(
  settings: Pick<
    BillingSettings,
    "finkokRegistrationEnabled" | "finkokEmitter"
  >,
  opts?: { isMutating?: boolean },
): FinkokEmitterReadiness {
  const isMutating = Boolean(opts?.isMutating);
  const enabled = settings.finkokRegistrationEnabled;
  const raw = settings.finkokEmitter;

  if (!enabled) {
    return {
      visible: false,
      status: FinkokEmitterStatuses.UNAVAILABLE,
      detail: null,
      rowStatus: "unknown",
      blocksReady: false,
    };
  }

  const status: FinkokEmitterStatus =
    !raw || raw.status === FinkokEmitterStatuses.UNAVAILABLE
      ? FinkokEmitterStatuses.NOT_REGISTERED
      : isMutating
        ? FinkokEmitterStatuses.REGISTERING
        : raw.status;

  const ready = status === FinkokEmitterStatuses.READY;
  return {
    visible: true,
    status,
    detail: raw?.detail ?? null,
    rowStatus: finkokRowStatus(status, isMutating),
    blocksReady: !ready,
  };
}

export type BillingReadinessTone =
  | "ready"
  | "readyUnverified"
  | "attention"
  | "pending";

/**
 * Titular de la ficha. Núcleo = identidad + sello + numeración (+ RFC si flag).
 * "Listo para facturar" exige además la comprobación de conexión con el PAC.
 *
 * A3 (pedido registro clientes): sin RFC `ready` no hay ready / readyUnverified
 * cuando el flag está on.
 */
export function resolveReadinessTone(input: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  connection: BillingRequirementStatus;
  /** Cuando true, RFC debe estar listo para tono ready*. */
  finkokEmitterBlocksReady?: boolean;
}): BillingReadinessTone {
  if (
    input.identity === "pending" ||
    input.certificate === "pending" ||
    input.numbering === "pending" ||
    input.finkokEmitterBlocksReady
  ) {
    return "pending";
  }
  if (input.connection === "pending") {
    return "pending";
  }
  if (input.certificate === "warning") {
    return "attention";
  }
  if (input.connection === "ready") {
    return "ready";
  }
  return "readyUnverified";
}

/** Núcleo listo (sin exigir checks PAC de sesión). */
export function isBillingCoreReady(input: {
  identity: BillingRequirementStatus;
  certificate: BillingRequirementStatus;
  numbering: BillingRequirementStatus;
  finkokEmitterBlocksReady?: boolean;
}): boolean {
  return (
    input.identity === "ready" &&
    (input.certificate === "ready" || input.certificate === "warning") &&
    input.numbering === "ready" &&
    !input.finkokEmitterBlocksReady
  );
}

export type FinkokEmitterCtaKind = "register" | "verify" | "verifyStatus";

/**
 * CTA de RFC según estado PRD §5.
 * Primario: solo cuando no está listo. Secundario en diagnóstico puede
 * incluir «Verificar registro» con `includeReadyVerify`.
 */
export function resolveFinkokEmitterCta(
  status: FinkokEmitterStatus,
  opts?: { includeReadyVerify?: boolean },
): FinkokEmitterCtaKind | null {
  switch (status) {
    case FinkokEmitterStatuses.NOT_REGISTERED:
    case FinkokEmitterStatuses.ERROR:
      return "register";
    case FinkokEmitterStatuses.SUSPENDED:
      return "verifyStatus";
    case FinkokEmitterStatuses.READY:
      return opts?.includeReadyVerify ? "verify" : null;
    case FinkokEmitterStatuses.REGISTERING:
    case FinkokEmitterStatuses.UNAVAILABLE:
    default:
      return null;
  }
}
