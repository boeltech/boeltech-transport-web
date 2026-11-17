/**
 * Catálogo y orden de «Lo que te toca» (PRD Q2/Q4 · I2).
 * Sin fila Q6. Urgencia: critical → warning → info; empate por área.
 */

import type { PendingQueueUrgency } from "@shared/ui/pending-queue";

export type AttentionRowId =
  | "rep_exceptions"
  | "overdue_trips"
  | "approvals"
  | "overdue_ar"
  | "fiscal_attention"
  | "invoiceable_blocked"
  | "invoiceable_ready"
  | "draft_trips"
  | "gps_unread"
  | "settlements"
  | "document_expiries";

export type AttentionArea =
  | "Operación"
  | "Aprobaciones"
  | "Facturación"
  | "Cobranza"
  | "Pagos"
  | "Flota";

const AREA_ORDER: Record<AttentionArea, number> = {
  Operación: 0,
  Aprobaciones: 1,
  Facturación: 2,
  Cobranza: 3,
  Pagos: 4,
  Flota: 5,
};

const URGENCY_ORDER: Record<PendingQueueUrgency, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

export interface AttentionRowDefinition {
  id: AttentionRowId;
  title: string;
  area: AttentionArea;
  ctaLabel: string;
  /** Urgencia base; documents/rep pueden subir a critical en runtime. */
  urgency: PendingQueueUrgency;
}

/** Catálogo PRD sin Q6 — orden de declaración no es el de render. */
export const ATTENTION_ROW_CATALOG: readonly AttentionRowDefinition[] = [
  {
    id: "rep_exceptions",
    title: "Comprobantes por atender",
    area: "Cobranza",
    ctaLabel: "Atender",
    urgency: "warning",
  },
  {
    id: "overdue_trips",
    title: "Viajes con retraso",
    area: "Operación",
    ctaLabel: "Ver viajes",
    urgency: "warning",
  },
  {
    id: "approvals",
    title: "Por autorizar",
    area: "Aprobaciones",
    ctaLabel: "Revisar",
    urgency: "warning",
  },
  {
    id: "overdue_ar",
    title: "Cobros vencidos",
    area: "Cobranza",
    ctaLabel: "Ver en Cartera",
    urgency: "warning",
  },
  {
    id: "fiscal_attention",
    title: "Atención fiscal",
    area: "Facturación",
    ctaLabel: "Revisar",
    urgency: "warning",
  },
  {
    id: "invoiceable_blocked",
    title: "Bloqueados para facturar",
    area: "Facturación",
    ctaLabel: "Resolver",
    urgency: "warning",
  },
  {
    id: "invoiceable_ready",
    title: "Listos para facturar",
    area: "Facturación",
    ctaLabel: "Facturar",
    urgency: "info",
  },
  {
    id: "draft_trips",
    title: "Reservas por completar",
    area: "Operación",
    ctaLabel: "Completar",
    urgency: "info",
  },
  {
    id: "gps_unread",
    title: "Alertas GPS sin leer",
    area: "Operación",
    ctaLabel: "Ver alertas",
    urgency: "warning",
  },
  {
    id: "settlements",
    title: "Pagos a operadores por cerrar",
    area: "Pagos",
    ctaLabel: "Revisar",
    urgency: "info",
  },
  {
    id: "document_expiries",
    title: "Documentos por vencer",
    area: "Flota",
    ctaLabel: "Ver",
    urgency: "warning",
  },
] as const;

export function compareAttentionRows(
  a: { urgency: PendingQueueUrgency; area: AttentionArea },
  b: { urgency: PendingQueueUrgency; area: AttentionArea },
): number {
  const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
  if (u !== 0) return u;
  return AREA_ORDER[a.area] - AREA_ORDER[b.area];
}

export function formatAttentionEyebrow(now: Date = new Date()): string {
  const date = now.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Mexico_City",
  });
  const capitalized = date.charAt(0).toUpperCase() + date.slice(1);
  return `${capitalized} · Todas las sucursales`;
}

export function buildDayLine(input: {
  pendingCount: number;
  topDetail?: string | null;
  allClear?: {
    tripsToday?: number;
    inProgress?: number;
    fiscalReady?: number;
    mode: "ops" | "fiscal" | "generic";
  };
  activationPendingSteps?: number | null;
}): string {
  if (
    input.activationPendingSteps != null &&
    input.activationPendingSteps > 0
  ) {
    return `Te faltan ${input.activationPendingSteps} pasos para crear tu primer viaje en tlamx.`;
  }

  if (input.pendingCount <= 0) {
    const clear = input.allClear;
    if (clear?.mode === "ops" && clear.tripsToday != null) {
      const inRoute = clear.inProgress ?? 0;
      return `Estás al día. Hoy hay ${clear.tripsToday} viajes: ${inRoute} en ruta.`;
    }
    if (clear?.mode === "fiscal" && clear.fiscalReady != null) {
      return `Estás al día. ${clear.fiscalReady} listos para facturar cuando quieras.`;
    }
    return "Estás al día. No hay nada pendiente en tus bandejas. Se actualiza solo.";
  }

  if (input.pendingCount === 1 && input.topDetail) {
    return `Tienes 1 pendiente: ${input.topDetail}.`;
  }

  if (input.topDetail) {
    return `Tienes ${input.pendingCount} pendientes. Lo más urgente: ${input.topDetail}.`;
  }

  return `Tienes ${input.pendingCount} pendientes.`;
}

const APPROVAL_TYPE_LABELS: Record<string, string> = {
  trip_expense: "gastos de viaje",
  driver_advance_request: "anticipos",
  sin_cfdi_exception: "viajes sin factura",
  internal_staff_compensation: "compensaciones",
  fuel_transaction: "combustible",
  maintenance_order: "mantenimiento",
  vehicle_doc_renewal: "renovación de documentos",
  overhead_expense: "gastos generales",
};

export function formatApprovalsBreakdown(
  counts: Record<string, number> | null | undefined,
): string | undefined {
  if (!counts) return undefined;
  const parts: string[] = [];
  for (const [type, n] of Object.entries(counts)) {
    if (type === "total" || n <= 0) continue;
    const label = APPROVAL_TYPE_LABELS[type] ?? type;
    parts.push(`${n} ${label}`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function formatOverdueTripsBreakdown(
  departureLate: number,
  arrivalLate: number,
): string | undefined {
  const parts: string[] = [];
  if (departureLate > 0) {
    parts.push(
      `${departureLate} no ha salido`,
    );
  }
  if (arrivalLate > 0) {
    parts.push(`${arrivalLate} llegada tarde`);
  }
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function formatDocumentExpiryBreakdown(input: {
  byType: {
    license: number;
    medicalCertificate: number;
    insurance: number;
    sctPermit: number;
  };
  withinDays: number;
  expired: number;
}): string {
  const parts: string[] = [];
  const { byType } = input;
  if (byType.license > 0) parts.push(`${byType.license} licencias`);
  if (byType.medicalCertificate > 0) {
    parts.push(`${byType.medicalCertificate} certificados médicos`);
  }
  if (byType.insurance > 0) parts.push(`${byType.insurance} seguros`);
  if (byType.sctPermit > 0) parts.push(`${byType.sctPermit} permisos SCT`);
  const body =
    parts.length > 0 ? parts.join(" · ") : "licencias · certificados · seguros · permisos";
  const prefix =
    input.expired > 0
      ? `${input.expired} vencido${input.expired === 1 ? "" : "s"} · `
      : "";
  return `${prefix}${body} · en los próximos ${input.withinDays} días`;
}
