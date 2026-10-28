import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@shared/hooks";
import { mapBackendError } from "@shared/utils/errorMapper";
import {
  PlatformTenantStatus,
  isPlatformOwner,
  type PlatformPulseAttentionItem,
} from "../../domain/entities";
import {
  usePlatformPulse,
  useResendPlatformTenantActivation,
} from "../../application/hooks/usePlatformTenants";
import { getPlatformSubscriptionStatusLabel } from "../utils/platformBillingFormatters";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { OpsSuspendTenantDialog } from "./OpsSuspendTenantDialog";
import { platformCopy } from "../copy/platformCopy";
import { opsCopy } from "./opsCopy";
import {
  filterHoyQueue,
  HOY_QUEUE_ORDER,
  pickHoyLandingQueue,
  type HoyQueueId,
} from "./hoyQueues";
import { OpsRegisterPaymentSheet } from "./OpsRegisterPaymentSheet";
import { OpsHoyQueues } from "./patterns/OpsHoyQueues";
import { OpsKpiStrip, type OpsKpiCell } from "./patterns/OpsKpiStrip";
import { OpsMoneyAmount } from "./patterns/OpsMoneyTable";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import {
  OpsTable,
  OpsTableBody,
  OpsTableCell,
  OpsTableHead,
  OpsTableHeader,
  OpsTableRow,
} from "./ui/OpsTable";

const QUEUE_LABEL: Record<HoyQueueId, string> = {
  past_due: opsCopy.hoy.chips.pastDue,
  suspended: opsCopy.hoy.chips.suspended,
  activation: opsCopy.hoy.chips.activation,
  trial: opsCopy.hoy.chips.trial,
};

function reasonLabel(code: string): string {
  return platformCopy.pulse.reasonCodes[code] ?? code;
}

function itemNeedsPaymentPush(item: PlatformPulseAttentionItem): boolean {
  return (
    item.cxcOverdueCents > 0 ||
    item.subscriptionStatus === "past_due" ||
    item.reasonCodes.includes("past_due") ||
    item.reasonCodes.includes("cxc_overdue")
  );
}

/** Compacto para KPI de mando ($36.6k) — no sustituye OpsMoneyAmount en filas. */
function formatCompactMora(cents: number): string {
  if (cents <= 0) return "$0";
  const pesos = cents / 100;
  if (pesos >= 1000) {
    const k = pesos / 1000;
    const rounded = k >= 10 ? Math.round(k) : Math.round(k * 10) / 10;
    return `$${rounded}k`;
  }
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(pesos);
}

function formatGeneratedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return opsCopy.hoy.generatedAt(iso);
  const formatted = new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `Actualizado ${formatted}`;
}

/**
 * Columna Plan ≠ Señal: plan/status útil; nunca eco de «Cobro pendiente» / reason badge.
 * Pulse no trae planName — status humanizado solo si no choca con la señal.
 */
function planColumnLabel(item: PlatformPulseAttentionItem): string {
  const status = item.subscriptionStatus?.trim() || null;
  if (!status) return "—";
  // past_due es señal de cobro, no plan (copy = «Cobro pendiente»).
  if (status === "past_due") return "—";
  const label = getPlatformSubscriptionStatusLabel(status);
  if (!label || label === status) return "—";
  const signalLabels = item.reasonCodes.map((code) => reasonLabel(code));
  if (signalLabels.includes(label)) return "—";
  return label;
}

interface HoyRowActionsProps {
  item: PlatformPulseAttentionItem;
  queue: HoyQueueId;
  canMutate: boolean;
  resendPending: boolean;
  onResend: () => void;
  onRegisterPayment: () => void;
  onSuspend: () => void;
  onReactivate: () => void;
}

function HoyRowActions({
  item,
  queue,
  canMutate,
  resendPending,
  onResend,
  onRegisterPayment,
  onSuspend,
  onReactivate,
}: HoyRowActionsProps) {
  const copy = opsCopy.hoy;
  return (
    <>
      {queue === "trial" ? (
        <OpsButton variant="primary" size="sm" asChild>
          <Link to={`/platform/tenants/${item.tenantId}`}>
            {copy.cta.viewHub}
          </Link>
        </OpsButton>
      ) : null}
      {canMutate && queue === "activation" ? (
        <OpsButton
          variant="primary"
          size="sm"
          disabled={resendPending}
          onClick={onResend}
        >
          {copy.cta.resend}
        </OpsButton>
      ) : null}
      {canMutate && queue === "past_due" ? (
        <>
          <OpsButton variant="primary" size="sm" onClick={onRegisterPayment}>
            {copy.cta.registerPayment}
          </OpsButton>
          <OpsButton variant="ghost" size="sm" onClick={onSuspend}>
            {copy.cta.suspend}
          </OpsButton>
        </>
      ) : null}
      {canMutate && queue === "suspended" ? (
        <OpsButton variant="primary" size="sm" onClick={onReactivate}>
          {copy.cta.reactivate}
        </OpsButton>
      ) : null}
      <OpsButton variant="ghost" size="sm" asChild>
        <Link to={`/platform/tenants/${item.tenantId}`}>{copy.view}</Link>
      </OpsButton>
    </>
  );
}

/**
 * Landing Hoy (flag v1). Colas desde GET /platform/pulse — sin backends nuevos.
 * Estructura C «Mando acero»: KPI strip → chips de cola → tabla hairline.
 * V5: cards hairline < md; targets táctiles vía tokens.
 */
export function PlatformHoyPage() {
  const copy = opsCopy.hoy;
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const [queue, setQueue] = useState<HoyQueueId>("past_due");
  const landedRef = useRef(false);
  const pickedRef = useRef(false);
  const { data: pulse, isLoading, isError, refetch } = usePlatformPulse();
  const resendMutation = useResendPlatformTenantActivation({
    onSuccess: () => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendSuccess,
        variant: "success",
      });
    },
    onError: (err) => {
      toast({
        title: platformCopy.tenants.detail.adminActivation.resendError,
        description: mapBackendError(err).message,
        variant: "error",
      });
    },
  });

  const [paymentTenant, setPaymentTenant] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [statusTarget, setStatusTarget] = useState<{
    item: PlatformPulseAttentionItem;
    status: typeof PlatformTenantStatus.SUSPENDED | typeof PlatformTenantStatus.ACTIVE;
    urgePayment: boolean;
  } | null>(null);

  const rows = useMemo(
    () => filterHoyQueue(pulse?.attentionQueue ?? [], queue),
    [pulse?.attentionQueue, queue],
  );

  const counts = useMemo(() => {
    const items = pulse?.attentionQueue ?? [];
    return {
      activation: filterHoyQueue(items, "activation").length,
      trial: filterHoyQueue(items, "trial").length,
      past_due: filterHoyQueue(items, "past_due").length,
      suspended: filterHoyQueue(items, "suspended").length,
    };
  }, [pulse?.attentionQueue]);

  const moraCents = useMemo(() => {
    const pastDue = filterHoyQueue(pulse?.attentionQueue ?? [], "past_due");
    return pastDue.reduce((sum, item) => sum + (item.cxcOverdueCents ?? 0), 0);
  }, [pulse?.attentionQueue]);

  const kpiCells = useMemo((): OpsKpiCell[] => {
    const loading = isLoading;
    return [
      {
        id: "mora",
        label: copy.kpi.mora.label,
        value: loading ? "…" : formatCompactMora(moraCents),
        caption: copy.kpi.mora.caption(counts.past_due),
        tone: !loading && moraCents > 0 ? "warn" : undefined,
      },
      {
        id: "suspended",
        label: copy.kpi.suspended.label,
        value: loading ? "…" : counts.suspended,
        caption: copy.kpi.suspended.caption,
        tone: !loading && counts.suspended > 0 ? "danger" : undefined,
      },
      {
        id: "activation",
        label: copy.kpi.activation.label,
        value: loading ? "…" : counts.activation,
        caption: copy.kpi.activation.caption,
      },
      {
        id: "trial",
        label: copy.kpi.trial.label,
        value: loading ? "…" : counts.trial,
        caption: copy.kpi.trial.caption,
      },
    ];
  }, [copy.kpi, counts, isLoading, moraCents]);

  useEffect(() => {
    if (landedRef.current || pickedRef.current || isLoading || !pulse) return;
    setQueue(pickHoyLandingQueue(counts));
    landedRef.current = true;
  }, [isLoading, pulse, counts]);

  return (
    <div data-testid="platform-hoy-page" className="space-y-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
          <p className="ops-type-caption ops-text-muted">{copy.description}</p>
        </div>
        {pulse?.generatedAt ? (
          <p className="ops-type-caption ops-font-mono ops-text-muted m-0">
            {formatGeneratedAt(pulse.generatedAt)}
          </p>
        ) : null}
      </header>

      <OpsKpiStrip aria-label={copy.kpiAria} cells={kpiCells} />

      <OpsHoyQueues
        chips={HOY_QUEUE_ORDER.map((id) => ({
          id,
          label: QUEUE_LABEL[id],
          count: counts[id],
        }))}
        activeQueue={queue}
        onQueueChange={(id) => {
          pickedRef.current = true;
          setQueue(id);
        }}
        isLoading={isLoading}
        isEmpty={!isLoading && rows.length === 0}
        emptyTitle={copy.empty.title}
        emptyDescription={copy.empty.description}
        error={
          isError
            ? {
                title: copy.error.title,
                description: copy.error.description,
                retryLabel: copy.error.retry,
                onRetry: () => {
                  void refetch();
                },
              }
            : null
        }
      >
        <>
          <div
            className="ops-hoy-desktop-table overflow-x-auto"
            data-testid="ops-hoy-desktop-table"
          >
            <OpsTable>
              <OpsTableHeader>
                <OpsTableRow>
                  <OpsTableHead>{copy.columns.tenant}</OpsTableHead>
                  <OpsTableHead>{copy.columns.plan}</OpsTableHead>
                  <OpsTableHead>{copy.columns.balance}</OpsTableHead>
                  <OpsTableHead>{copy.columns.days}</OpsTableHead>
                  <OpsTableHead className="text-right">
                    {copy.columns.actions}
                  </OpsTableHead>
                </OpsTableRow>
              </OpsTableHeader>
              <OpsTableBody>
                {rows.map((item) => (
                  <OpsTableRow key={item.tenantId}>
                    <OpsTableCell>
                      <Link
                        to={`/platform/tenants/${item.tenantId}`}
                        className="font-medium ops-text hover:underline underline-offset-2"
                      >
                        {item.name}
                      </Link>
                      <p className="ops-type-caption ops-font-mono ops-text-muted">
                        {item.subdomain}
                      </p>
                    </OpsTableCell>
                    <OpsTableCell className="ops-text-muted">
                      {planColumnLabel(item)}
                    </OpsTableCell>
                    <OpsTableCell>
                      {item.cxcOverdueCents > 0 ? (
                        <OpsMoneyAmount cents={item.cxcOverdueCents} />
                      ) : (
                        <span className="ops-text-muted">—</span>
                      )}
                    </OpsTableCell>
                    <OpsTableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.reasonCodes.slice(0, 2).map((code) => (
                          <OpsBadge key={code} tone="muted">
                            {reasonLabel(code)}
                          </OpsBadge>
                        ))}
                      </div>
                    </OpsTableCell>
                    <OpsTableCell className="text-right">
                      <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                        <HoyRowActions
                          item={item}
                          queue={queue}
                          canMutate={canMutate}
                          resendPending={
                            resendMutation.isPending &&
                            resendMutation.variables?.id === item.tenantId
                          }
                          onResend={() =>
                            resendMutation.mutate({ id: item.tenantId })
                          }
                          onRegisterPayment={() =>
                            setPaymentTenant({
                              id: item.tenantId,
                              label: item.name,
                            })
                          }
                          onSuspend={() =>
                            setStatusTarget({
                              item,
                              status: PlatformTenantStatus.SUSPENDED,
                              urgePayment: false,
                            })
                          }
                          onReactivate={() =>
                            setStatusTarget({
                              item,
                              status: PlatformTenantStatus.ACTIVE,
                              urgePayment: itemNeedsPaymentPush(item),
                            })
                          }
                        />
                      </div>
                    </OpsTableCell>
                  </OpsTableRow>
                ))}
              </OpsTableBody>
            </OpsTable>
          </div>

          <ul
            className="ops-hoy-mobile-list"
            data-testid="ops-hoy-mobile-list"
          >
            {rows.map((item) => (
              <li key={item.tenantId} className="ops-hoy-card">
                <div className="ops-hoy-card-head">
                  <div className="min-w-0">
                    <Link
                      to={`/platform/tenants/${item.tenantId}`}
                      className="font-medium ops-text hover:underline underline-offset-2"
                    >
                      {item.name}
                    </Link>
                    <p className="ops-type-caption ops-font-mono ops-text-muted m-0">
                      {item.subdomain}
                    </p>
                  </div>
                  {item.cxcOverdueCents > 0 ? (
                    <OpsMoneyAmount cents={item.cxcOverdueCents} />
                  ) : (
                    <span className="ops-type-caption ops-text-muted">—</span>
                  )}
                </div>
                <div className="ops-hoy-card-meta">
                  <span className="ops-type-caption ops-text-muted">
                    {copy.columns.plan}: {planColumnLabel(item)}
                  </span>
                  {item.reasonCodes.slice(0, 2).map((code) => (
                    <OpsBadge key={code} tone="muted">
                      {reasonLabel(code)}
                    </OpsBadge>
                  ))}
                </div>
                <div className="ops-hoy-card-actions">
                  <HoyRowActions
                    item={item}
                    queue={queue}
                    canMutate={canMutate}
                    resendPending={
                      resendMutation.isPending &&
                      resendMutation.variables?.id === item.tenantId
                    }
                    onResend={() =>
                      resendMutation.mutate({ id: item.tenantId })
                    }
                    onRegisterPayment={() =>
                      setPaymentTenant({
                        id: item.tenantId,
                        label: item.name,
                      })
                    }
                    onSuspend={() =>
                      setStatusTarget({
                        item,
                        status: PlatformTenantStatus.SUSPENDED,
                        urgePayment: false,
                      })
                    }
                    onReactivate={() =>
                      setStatusTarget({
                        item,
                        status: PlatformTenantStatus.ACTIVE,
                        urgePayment: itemNeedsPaymentPush(item),
                      })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </>
      </OpsHoyQueues>

      <OpsRegisterPaymentSheet
        tenantId={paymentTenant?.id ?? null}
        tenantLabel={paymentTenant?.label}
        open={Boolean(paymentTenant)}
        onOpenChange={(next) => {
          if (!next) setPaymentTenant(null);
        }}
      />

      <OpsSuspendTenantDialog
        open={Boolean(statusTarget)}
        onOpenChange={(next) => {
          if (!next) setStatusTarget(null);
        }}
        tenant={
          statusTarget
            ? {
                id: statusTarget.item.tenantId,
                name: statusTarget.item.name,
                subdomain: statusTarget.item.subdomain,
              }
            : null
        }
        targetStatus={statusTarget?.status ?? null}
        urgePayment={statusTarget?.urgePayment}
        onRegisterPayment={
          statusTarget
            ? () => {
                setPaymentTenant({
                  id: statusTarget.item.tenantId,
                  label: statusTarget.item.name,
                });
                setStatusTarget(null);
              }
            : undefined
        }
      />
    </div>
  );
}
