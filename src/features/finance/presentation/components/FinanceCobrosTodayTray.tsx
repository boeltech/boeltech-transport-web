import { useEffect, useMemo, useRef } from "react";
import { Loader2, Receipt, X } from "lucide-react";
import {
  canRetryRepStamp,
  isRepManualReview,
  isRepOrphanParked,
  isRepPermanentError,
  REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE,
  type FinanceRepStatusItem,
  type FinanceRepWaitReason,
} from "@features/finance/domain";
import {
  useRepStatusByIds,
  useRetryFinanceRepStamp,
} from "@features/finance/application";
import { DetailAlertCard } from "@shared/ui/data-display";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { financeCopy } from "../copy";
import type { CobrosTodayEntry } from "../utils/cobrosFollowThrough";
import {
  resolveCobrosRepStage,
  type CobrosRepStage,
} from "../utils/cobrosRepStage";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";
import type { CobrosInvoiceNavTarget } from "../utils/cobrosInvoiceNav";
import { CobrosInvoiceNavCta } from "./CobrosInvoiceNav";

const copy = financeCopy.cobros.todayTray;

/** Hints for in-progress wait reasons that the stage chip alone does not explain. */
function waitReasonHint(
  waitReason: FinanceRepWaitReason | string | null,
): string | null {
  if (
    waitReason === "pac_clock" ||
    waitReason === "quota" ||
    waitReason === "blocked_by_prior" ||
    waitReason === "retry_scheduled"
  ) {
    return copy.waitReasons[waitReason];
  }
  return null;
}

function stageBadgeVariant(
  stage: CobrosRepStage,
): "neutral" | "info" | "success" | "destructive" {
  if (stage === "ready") return "success";
  if (stage === "needs_action") return "destructive";
  if (stage === "stamping") return "info";
  return "neutral";
}

function traySeverity(
  needsAction: number,
): "info" | "warning" {
  return needsAction >= 1 ? "warning" : "info";
}

interface FinanceCobrosTodayTrayProps {
  entries: readonly CobrosTodayEntry[];
  onDismissTray: () => void;
  onDismissEntry: (paymentId: string) => void;
  /** Switch workbench to Excepciones REP (tray-level CTA when needs_action). */
  onViewExceptions?: () => void;
  onEntryLiveUpdate?: (
    paymentId: string,
    live: Pick<FinanceRepStatusItem, "repStatus">,
  ) => void;
}

export function FinanceCobrosTodayTray({
  entries,
  onDismissTray,
  onDismissEntry,
  onViewExceptions,
  onEntryLiveUpdate,
}: FinanceCobrosTodayTrayProps) {
  const { toast } = useToast();
  const fromState = useInvoiceQueueFromState();
  const paymentIds = useMemo(
    () => entries.map((entry) => entry.paymentId),
    [entries],
  );
  const { data: liveStatuses } = useRepStatusByIds(paymentIds, {
    enabled: entries.length > 0,
  });

  const liveById = useMemo(() => {
    const map = new Map<string, FinanceRepStatusItem>();
    for (const item of liveStatuses ?? []) {
      map.set(item.paymentId, item);
    }
    return map;
  }, [liveStatuses]);

  const prevStageRef = useRef<Map<string, CobrosRepStage>>(new Map());

  useEffect(() => {
    if (!liveStatuses) return;
    for (const item of liveStatuses) {
      const stage = resolveCobrosRepStage({
        repStatus: item.repStatus,
        waitReason: item.waitReason,
      });
      const prev = prevStageRef.current.get(item.paymentId);
      prevStageRef.current.set(item.paymentId, stage);
      onEntryLiveUpdate?.(item.paymentId, { repStatus: item.repStatus });
      if (!prev || prev === stage) continue;
      const entry = entries.find((e) => e.paymentId === item.paymentId);
      const amountLabel = formatMxCurrency(entry?.amount ?? 0);
      if (stage === "ready") {
        toast({
          title: copy.toastReadyTitle,
          description: copy.toastReadyDescription(amountLabel),
        });
      } else if (stage === "needs_action") {
        toast({
          variant: "error",
          title: copy.toastNeedsActionTitle,
          description: copy.toastNeedsActionDescription(amountLabel),
        });
      }
    }
  }, [liveStatuses, entries, onEntryLiveUpdate, toast]);

  const retryMutation = useRetryFinanceRepStamp({
    onSuccess: () => {
      toast({ title: copy.toastRetrySuccess });
    },
    onError: (err) => {
      toast({
        variant: "error",
        title: copy.toastRetryError,
        description: getErrorMessage(err),
      });
    },
  });

  const summary = useMemo(() => {
    let ready = 0;
    let inProgress = 0;
    let needsAction = 0;
    for (const entry of entries) {
      const live = liveById.get(entry.paymentId);
      const stage = resolveCobrosRepStage({
        repStatus: live?.repStatus ?? entry.repStatus,
        waitReason: live?.waitReason,
      });
      if (stage === "ready") ready += 1;
      else if (stage === "needs_action") needsAction += 1;
      else inProgress += 1;
    }
    return { ready, inProgress, needsAction };
  }, [entries, liveById]);

  if (entries.length === 0) return null;

  const severity = traySeverity(summary.needsAction);

  return (
    <DetailAlertCard
      severity={severity}
      icon={<Receipt className="h-5 w-5" aria-hidden />}
      title={copy.title}
      action={
        <>
          {summary.needsAction >= 1 && onViewExceptions ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onViewExceptions}
            >
              {copy.viewExceptions}
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDismissTray}
            aria-label={copy.dismissTrayAriaLabel}
          >
            {copy.dismissTray}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p>{copy.description}</p>
        <p className="text-xs">
          {copy.summary(
            summary.ready,
            summary.inProgress,
            summary.needsAction,
          )}
        </p>
        <ul className="space-y-2 text-foreground">
          {entries.map((entry) => {
            const live = liveById.get(entry.paymentId);
            const repStatus = live?.repStatus ?? entry.repStatus;
            const waitReason = live?.waitReason ?? null;
            const repLastError = live?.repLastError ?? null;
            const repCfdiUuid = live?.repCfdiUuid ?? null;
            const repErrorKind = live?.repErrorKind ?? null;
            const stage = resolveCobrosRepStage({ repStatus, waitReason });
            const amountLabel = formatMxCurrency(entry.amount);
            const navInvoices: CobrosInvoiceNavTarget[] = (
              live?.invoices ?? entry.invoices
            ).map((invoice) => ({
              id: invoice.id,
              serie: invoice.serie,
              folio: invoice.folio,
            }));
            const primaryInvoice = navInvoices[0];
            const canRetry = canRetryRepStamp({
              repStatus,
              waitReason,
              repLastError,
              repCfdiUuid,
              repErrorKind,
            });
            const manualReview = isRepManualReview({
              waitReason,
              repLastError,
              repErrorKind,
            });
            const permanent = isRepPermanentError({ repErrorKind });
            const orphan = isRepOrphanParked({ repStatus, repCfdiUuid });
            const waitHint =
              stage === "stamping" ? waitReasonHint(waitReason) : null;
            const retrying =
              retryMutation.isPending &&
              retryMutation.variables?.paymentId === entry.paymentId;

            return (
              <li
                key={entry.paymentId}
                className="rounded-md border bg-background/60 px-3 py-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium tabular-nums">
                        {amountLabel}
                      </span>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {entry.receiverRfc}
                      </Badge>
                      <Badge
                        variant={stageBadgeVariant(stage)}
                        tone="soft"
                      >
                        {copy.stages[stage]}
                      </Badge>
                    </div>
                    {waitHint ? (
                      <p className="text-xs text-muted-foreground">{waitHint}</p>
                    ) : null}
                    {stage === "needs_action" && repLastError ? (
                      <p
                        className="text-xs text-destructive"
                        title={repLastError}
                      >
                        {repLastError}
                      </p>
                    ) : null}
                    {manualReview &&
                    repLastError !== REP_PAC_TIMEOUT_MANUAL_REVIEW_MESSAGE ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.manualReviewHint}
                      </p>
                    ) : null}
                    {permanent && !manualReview ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.permanentErrorHint}
                      </p>
                    ) : null}
                    {orphan && !manualReview && !permanent ? (
                      <p className="text-xs text-muted-foreground">
                        {copy.orphanHint}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {canRetry && primaryInvoice ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={retryMutation.isPending}
                        onClick={() =>
                          retryMutation.mutate({
                            invoiceId: primaryInvoice.id,
                            paymentId: entry.paymentId,
                          })
                        }
                      >
                        {retrying ? (
                          <>
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            {copy.retrying}
                          </>
                        ) : (
                          copy.retryStamp
                        )}
                      </Button>
                    ) : null}
                    <CobrosInvoiceNavCta
                      invoices={navInvoices}
                      linkState={fromState}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground"
                      onClick={() => onDismissEntry(entry.paymentId)}
                      aria-label={copy.dismissRowAriaLabel(amountLabel)}
                    >
                      <X className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </DetailAlertCard>
  );
}
