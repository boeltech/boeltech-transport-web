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
import { OpsMoneyAmount } from "./patterns/OpsMoneyTable";
import { OpsSectionRule } from "./patterns/OpsSectionRule";
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

/**
 * Landing Hoy (flag v1). Colas desde GET /platform/pulse — sin backends nuevos.
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

  useEffect(() => {
    if (landedRef.current || pickedRef.current || isLoading || !pulse) return;
    setQueue(pickHoyLandingQueue(counts));
    landedRef.current = true;
  }, [isLoading, pulse, counts]);

  return (
    <div data-testid="platform-hoy-page" className="space-y-3">
      <header className="space-y-1">
        <h1 className="ops-type-h2 ops-text m-0">{copy.title}</h1>
        <p className="ops-type-caption ops-text-muted">{copy.description}</p>
      </header>

      <OpsSectionRule
        label={copy.queuesRule}
        meta={
          pulse?.generatedAt ? copy.generatedAt(pulse.generatedAt) : undefined
        }
      />

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
        <div className="overflow-x-auto">
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
                      className="font-medium ops-text-accent hover:underline"
                    >
                      {item.name}
                    </Link>
                    <p className="ops-type-caption ops-font-mono ops-text-muted">
                      {item.subdomain}
                    </p>
                  </OpsTableCell>
                  <OpsTableCell className="ops-text-muted">
                    {item.subscriptionStatus ?? "—"}
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
                    <div className="inline-flex items-center gap-1.5">
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
                          disabled={
                            resendMutation.isPending &&
                            resendMutation.variables?.id === item.tenantId
                          }
                          onClick={() =>
                            resendMutation.mutate({ id: item.tenantId })
                          }
                        >
                          {copy.cta.resend}
                        </OpsButton>
                      ) : null}
                      {canMutate && queue === "past_due" ? (
                        <>
                          <OpsButton
                            variant="primary"
                            size="sm"
                            onClick={() =>
                              setPaymentTenant({
                                id: item.tenantId,
                                label: item.name,
                              })
                            }
                          >
                            {copy.cta.registerPayment}
                          </OpsButton>
                          <OpsButton
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setStatusTarget({
                                item,
                                status: PlatformTenantStatus.SUSPENDED,
                                urgePayment: false,
                              })
                            }
                          >
                            {copy.cta.suspend}
                          </OpsButton>
                        </>
                      ) : null}
                      {canMutate && queue === "suspended" ? (
                        <OpsButton
                          variant="primary"
                          size="sm"
                          onClick={() =>
                            setStatusTarget({
                              item,
                              status: PlatformTenantStatus.ACTIVE,
                              urgePayment: itemNeedsPaymentPush(item),
                            })
                          }
                        >
                          {copy.cta.reactivate}
                        </OpsButton>
                      ) : null}
                      <OpsButton variant="ghost" size="sm" asChild>
                        <Link to={`/platform/tenants/${item.tenantId}`}>
                          {copy.view}
                        </Link>
                      </OpsButton>
                    </div>
                  </OpsTableCell>
                </OpsTableRow>
              ))}
            </OpsTableBody>
          </OpsTable>
        </div>
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
