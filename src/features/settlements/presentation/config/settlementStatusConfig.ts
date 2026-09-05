/**
 * Settlement & Advance Status Configuration
 * Clean Architecture - Presentation Layer (Config)
 *
 * Configuración estandarizada de estados para liquidaciones y anticipos.
 * Conforme al design system del ERP-T.
 *
 * Ubicación: src/features/settlements/presentation/config/settlementStatusConfig.ts
 */

import {
  CheckCircle2,
  Clock,
  FileText,
  Banknote,
  XCircle,
} from "lucide-react";
import {
  type StatusConfig,
  createStatusConfig,
} from "@shared/config/status/types";
import { createStatusBadgeComponent } from "@shared/components/StatusBadge";
import {
  SETTLEMENT_STATUS_LABELS,
  ADVANCE_STATUS_LABELS,
  type SettlementStatus,
  type AdvanceStatus,
} from "../../domain/enums";

// ============================================================================
// SETTLEMENT STATUS CONFIG
// ============================================================================

export const SETTLEMENT_STATUS_CONFIG: Record<SettlementStatus, StatusConfig> = {
  draft: createStatusConfig("neutral", {
    label: SETTLEMENT_STATUS_LABELS.draft,
    icon: FileText,
    description: "Liquidación en borrador editable",
  }),

  pending_approval: createStatusConfig("warning", {
    label: SETTLEMENT_STATUS_LABELS.pending_approval,
    icon: Clock,
    description: "Sometida para autorización",
  }),

  approved: createStatusConfig("info", {
    label: SETTLEMENT_STATUS_LABELS.approved,
    icon: CheckCircle2,
    description: "Autorizada, pendiente de registrar el pago",
  }),

  disbursed: createStatusConfig("success", {
    label: SETTLEMENT_STATUS_LABELS.disbursed,
    icon: Banknote,
    description: "Pago registrado al operador",
  }),

  rejected: createStatusConfig("destructive", {
    label: SETTLEMENT_STATUS_LABELS.rejected,
    icon: XCircle,
    description: "Rechazada por el aprobador",
  }),

  cancelled: createStatusConfig("destructive", {
    label: SETTLEMENT_STATUS_LABELS.cancelled,
    icon: XCircle,
    description: "Liquidación cancelada",
  }),
};

export const SettlementStatusBadge = createStatusBadgeComponent(SETTLEMENT_STATUS_CONFIG);

// ============================================================================
// ADVANCE STATUS CONFIG
// ============================================================================

export const ADVANCE_STATUS_CONFIG: Record<AdvanceStatus, StatusConfig> = {
  draft: createStatusConfig("neutral", {
    label: ADVANCE_STATUS_LABELS.draft,
    icon: FileText,
    description: "Anticipo en borrador",
  }),

  pending_approval: createStatusConfig("warning", {
    label: ADVANCE_STATUS_LABELS.pending_approval,
    icon: Clock,
    description: "Pendiente de autorización de administración",
  }),

  pending_disbursement: createStatusConfig("info", {
    label: ADVANCE_STATUS_LABELS.pending_disbursement,
    icon: Clock,
    description: "Autorizado, pendiente de entrega de efectivo",
  }),

  disbursed: createStatusConfig("success", {
    label: ADVANCE_STATUS_LABELS.disbursed,
    icon: Banknote,
    description: "Entregado, saldo disponible para descontar",
  }),

  partially_applied: createStatusConfig("info", {
    label: ADVANCE_STATUS_LABELS.partially_applied,
    icon: Clock,
    description: "Descontado parcialmente en liquidaciones",
  }),

  fully_applied: createStatusConfig("success", {
    label: ADVANCE_STATUS_LABELS.fully_applied,
    icon: CheckCircle2,
    description: "Descontado al 100%",
  }),

  rejected: createStatusConfig("destructive", {
    label: ADVANCE_STATUS_LABELS.rejected,
    icon: XCircle,
    description: "Anticipo rechazado",
  }),

  cancelled: createStatusConfig("destructive", {
    label: ADVANCE_STATUS_LABELS.cancelled,
    icon: XCircle,
    description: "Anticipo cancelado",
  }),
};

export const AdvanceStatusBadge = createStatusBadgeComponent(ADVANCE_STATUS_CONFIG);
