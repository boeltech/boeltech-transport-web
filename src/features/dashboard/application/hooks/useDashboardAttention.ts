/**
 * Fuentes I3 de «Lo que te toca» + snapshot para encabezado/CTA.
 */

import { useMemo } from "react";
import { usePermissions } from "@shared/permissions";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { PendingQueueUrgency } from "@shared/ui/pending-queue";
import { useApprovalsPendingCountsByType } from "@features/approvals/application";
import { APPROVALS_INBOX_PATH } from "@features/approvals/presentation/utils/approvalsInboxPath";
import {
  useInvoiceableWorkbenchSummary,
  useTripOpsDaySummary,
  useTripWorkbenchSummary,
} from "@features/trips/application";
import {
  FINANCE_COBROS_PATH,
  FINANCE_HUB_PATH,
  FINANCE_INVOICEABLE_PATH,
  useFinanceSummary,
  useRepExceptions,
} from "@features/finance/application";
import {
  SETTLEMENTS_LIST_PATH,
  useSettlementsNavBadges,
} from "@features/settlements/application";
import { useEntitlement } from "@features/billing";
import { useGpsAlertsSummary } from "@features/monitoring/application";
import { ALERTS_LIST_PATH } from "@features/monitoring/domain";
import { useDocumentExpirySummary } from "@features/fleet-documents/application";
import { FLEET_DOCUMENTS_PATH } from "@features/fleet-documents/domain";
import {
  ATTENTION_ROW_CATALOG,
  compareAttentionRows,
  formatApprovalsBreakdown,
  formatDocumentExpiryBreakdown,
  formatOverdueTripsBreakdown,
  type AttentionArea,
  type AttentionRowId,
} from "../../domain/attentionQueue";
import {
  buildPendingApprovalsHref,
  type PendingApprovalsBriefCounts,
} from "../../domain/morningBrief";
import { dashboardCopy } from "../../presentation/copy/dashboardCopy";
import type { DashboardJobPending } from "../../presentation/utils/resolveDashboardJobAction";

export type AttentionRowView =
  | {
      kind: "ok";
      id: AttentionRowId;
      title: string;
      area: AttentionArea;
      urgency: PendingQueueUrgency;
      count: number;
      value: string;
      valueHint?: string;
      breakdown?: string;
      ctaLabel: string;
      href: string;
      labelDetail: string;
    }
  | {
      kind: "error";
      id: AttentionRowId;
      title: string;
      area: AttentionArea;
      onRetry: () => void;
    }
  | {
      kind: "clear";
      id: AttentionRowId;
      title: string;
    };

export interface DashboardAttentionSnapshot {
  pendingCount: number;
  firstPending: DashboardJobPending | null;
  topDetail: string | null;
  opsDay?: { tripsToday: number; inProgress: number };
  fiscalReady?: number;
  isLoading: boolean;
}

export function useDashboardAttention(options: { showFinance: boolean }) {
  const { hasPermission } = usePermissions();
  const canReadTrips = hasPermission("trips", "read");
  const canReadApprovals = hasPermission("finance_approvals", "read");
  const canReadInvoices = hasPermission("invoices", "read");
  const canReadFinance =
    hasPermission("finance", "read") || options.showFinance;
  const canReadSettlements = hasPermission("settlements", "read");
  const canReadGps = hasPermission("gps_tracking", "read");
  const canReadDocs =
    hasPermission("vehicles", "read") || hasPermission("drivers", "read");
  const gpsEntitlement = useEntitlement("gps_tracking");
  /** T6 / DC5: query GPS solo con permiso ∧ active; sin fila error si no active. */
  const gpsActive = canReadGps && gpsEntitlement.state === "active";

  const approvals = useApprovalsPendingCountsByType({
    queue: "mine",
    enabled: canReadApprovals,
  });
  const tripWorkbench = useTripWorkbenchSummary({ enabled: canReadTrips });
  const opsDay = useTripOpsDaySummary({ enabled: canReadTrips });
  const invoiceable = useInvoiceableWorkbenchSummary(undefined, {
    enabled: canReadInvoices,
  });
  const repExceptions = useRepExceptions({
    enabled: canReadFinance,
    page: 1,
    limit: 1,
  });
  const financeSummary = useFinanceSummary({ enabled: canReadFinance });
  const settlementsBadges = useSettlementsNavBadges();
  const gps = useGpsAlertsSummary({ enabled: gpsActive });
  const docs = useDocumentExpirySummary({ enabled: canReadDocs });

  const rows = useMemo((): AttentionRowView[] => {
    const out: AttentionRowView[] = [];

    for (const def of ATTENTION_ROW_CATALOG) {
      switch (def.id) {
        case "approvals": {
          if (!canReadApprovals) break;
          if (approvals.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void approvals.refetch(),
            });
            break;
          }
          if (approvals.isLoading || approvals.data === undefined) {
            break;
          }
          const total = approvals.data.total ?? 0;
          if (total <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          const counts = approvals.data as PendingApprovalsBriefCounts;
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count: total,
            value: String(total),
            breakdown: formatApprovalsBreakdown(
              approvals.data as unknown as Record<string, number>,
            ),
            ctaLabel: def.ctaLabel,
            href: buildPendingApprovalsHref(APPROVALS_INBOX_PATH, counts),
            labelDetail: "por autorizar",
          });
          break;
        }
        case "overdue_trips": {
          if (!canReadTrips) break;
          if (tripWorkbench.hasError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => tripWorkbench.refetch(),
            });
            break;
          }
          if (tripWorkbench.isLoading) break;
          const count = tripWorkbench.summary.overdue;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          const bd = opsDay.data?.overdueBreakdown;
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            breakdown: bd
              ? formatOverdueTripsBreakdown(bd.departureLate, bd.arrivalLate)
              : undefined,
            ctaLabel: def.ctaLabel,
            href: "/trips?overdue=1",
            labelDetail: "viajes con retraso",
          });
          break;
        }
        case "draft_trips": {
          if (!canReadTrips) break;
          if (tripWorkbench.hasError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => tripWorkbench.refetch(),
            });
            break;
          }
          if (tripWorkbench.isLoading) break;
          const count = tripWorkbench.summary.draft;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            breakdown: dashboardCopy.attention.draftBreakdown,
            ctaLabel: def.ctaLabel,
            href: "/trips?status=draft",
            labelDetail: "reservas por completar",
          });
          break;
        }
        case "fiscal_attention": {
          if (!canReadTrips) break;
          if (tripWorkbench.hasError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => tripWorkbench.refetch(),
            });
            break;
          }
          if (tripWorkbench.isLoading) break;
          const count = tripWorkbench.summary.fiscalAttention;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            ctaLabel: def.ctaLabel,
            href: "/trips?fiscalAttention=1",
            labelDetail: "en atención fiscal",
          });
          break;
        }
        case "invoiceable_ready": {
          if (!canReadInvoices) break;
          if (invoiceable.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void invoiceable.refetch(),
            });
            break;
          }
          if (invoiceable.isLoading || invoiceable.data === undefined) break;
          const count = invoiceable.data.ready;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          const amount = invoiceable.data.readyAmount ?? 0;
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            valueHint: amount > 0 ? formatMxCurrency(amount) : undefined,
            ctaLabel: def.ctaLabel,
            href: `${FINANCE_INVOICEABLE_PATH}?bucket=ready`,
            labelDetail: "listos para facturar",
          });
          break;
        }
        case "invoiceable_blocked": {
          if (!canReadInvoices) break;
          if (invoiceable.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void invoiceable.refetch(),
            });
            break;
          }
          if (invoiceable.isLoading || invoiceable.data === undefined) break;
          const count = invoiceable.data.blocked;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            ctaLabel: def.ctaLabel,
            href: `${FINANCE_INVOICEABLE_PATH}?bucket=blocked`,
            labelDetail: "bloqueados para facturar",
          });
          break;
        }
        case "rep_exceptions": {
          if (!canReadFinance) break;
          if (repExceptions.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void repExceptions.refetch(),
            });
            break;
          }
          if (repExceptions.isLoading || repExceptions.data === undefined) {
            break;
          }
          const count = repExceptions.data.pagination.total;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            ctaLabel: def.ctaLabel,
            href: `${FINANCE_COBROS_PATH}?bucket=rep_exceptions`,
            labelDetail: "comprobantes por atender",
          });
          break;
        }
        case "overdue_ar": {
          if (!canReadFinance) break;
          if (financeSummary.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void financeSummary.refetch(),
            });
            break;
          }
          if (financeSummary.isLoading || financeSummary.data === undefined) {
            break;
          }
          // I3: suma by_channel.*.overdue cuando viene; fallback totalOverdue.
          const byChannel = financeSummary.data.byChannel;
          const amount = byChannel
            ? byChannel.withInvoice.overdue + byChannel.withoutInvoice.overdue
            : financeSummary.data.totalOverdue;
          if (amount <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count: amount,
            value: formatMxCurrency(amount),
            breakdown: "Más de 30 días",
            ctaLabel: def.ctaLabel,
            href: FINANCE_HUB_PATH,
            labelDetail: "en cobros vencidos",
          });
          break;
        }
        case "settlements": {
          if (!canReadSettlements) break;
          if (settlementsBadges.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void settlementsBadges.refetch(),
            });
            break;
          }
          if (
            settlementsBadges.isLoading ||
            settlementsBadges.data === undefined
          ) {
            break;
          }
          const count = settlementsBadges.data.payments;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            ctaLabel: def.ctaLabel,
            href: SETTLEMENTS_LIST_PATH,
            labelDetail: "pagos a operadores",
          });
          break;
        }
        case "gps_unread": {
          if (!gpsActive) break;
          if (gps.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void gps.refetch(),
            });
            break;
          }
          if (gps.isLoading || gps.data === undefined) break;
          const count = gps.data.unreadCount;
          if (count <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: def.urgency,
            count,
            value: String(count),
            ctaLabel: def.ctaLabel,
            href: ALERTS_LIST_PATH,
            labelDetail: "alertas GPS sin leer",
          });
          break;
        }
        case "document_expiries": {
          if (!canReadDocs) break;
          if (docs.isError) {
            out.push({
              kind: "error",
              id: def.id,
              title: def.title,
              area: def.area,
              onRetry: () => void docs.refetch(),
            });
            break;
          }
          if (docs.isLoading || docs.data === undefined) break;
          const total = docs.data.total;
          if (total <= 0) {
            out.push({ kind: "clear", id: def.id, title: def.title });
            break;
          }
          const expired = docs.data.expired;
          out.push({
            kind: "ok",
            id: def.id,
            title: def.title,
            area: def.area,
            urgency: expired > 0 ? "critical" : def.urgency,
            count: total,
            value: String(total),
            breakdown: formatDocumentExpiryBreakdown({
              byType: docs.data.byType,
              withinDays: docs.data.withinDays,
              expired,
            }),
            ctaLabel: def.ctaLabel,
            href: `${FLEET_DOCUMENTS_PATH}?within_days=${docs.data.withinDays}`,
            labelDetail: "documentos por vencer",
          });
          break;
        }
        default:
          break;
      }
    }

    return out;
  }, [
    approvals,
    canReadApprovals,
    canReadDocs,
    canReadFinance,
    canReadInvoices,
    canReadSettlements,
    canReadTrips,
    docs,
    financeSummary,
    gps,
    gpsActive,
    invoiceable,
    opsDay.data?.overdueBreakdown,
    repExceptions,
    settlementsBadges,
    tripWorkbench,
  ]);

  const isLoading =
    (canReadApprovals && approvals.isLoading) ||
    (canReadTrips && tripWorkbench.isLoading) ||
    (canReadInvoices && invoiceable.isLoading) ||
    (canReadFinance &&
      (repExceptions.isLoading || financeSummary.isLoading)) ||
    (canReadSettlements && settlementsBadges.isLoading) ||
    (gpsActive && gps.isLoading) ||
    (canReadDocs && docs.isLoading);

  const snapshot = useMemo((): DashboardAttentionSnapshot => {
    const visibleOk = rows
      .filter(
        (r): r is Extract<AttentionRowView, { kind: "ok" }> => r.kind === "ok",
      )
      .sort(compareAttentionRows);
    const first = visibleOk[0];
    const counts = opsDay.data?.counts;
    return {
      pendingCount: visibleOk.length,
      firstPending: first
        ? {
            id: first.id,
            count: first.count,
            labelDetail: first.labelDetail,
            href: first.href,
            ctaVerb: first.ctaLabel,
          }
        : null,
      topDetail: first ? `${first.count} ${first.labelDetail}` : null,
      opsDay: counts
        ? {
            tripsToday:
              counts.departing +
              counts.inProgress +
              counts.overdue +
              counts.arrived,
            inProgress: counts.inProgress,
          }
        : undefined,
      fiscalReady: invoiceable.data?.ready,
      isLoading,
    };
  }, [invoiceable.data?.ready, isLoading, opsDay.data?.counts, rows]);

  return { rows, snapshot, isLoading };
}
