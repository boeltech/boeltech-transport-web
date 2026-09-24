/**
 * Sheet de confirmación multi-cliente para envío digest (F4′ async + link).
 * Un correo por cliente con enlace a ZIP; destinatarios por grupo.
 * No toca SendInvoiceDialog (atajo 1 folio).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertWithIcon } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import { FieldInlineError } from "@shared/ui/form";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { useToast } from "@shared/hooks";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import {
  useInvoiceSendRecipients,
  useSendInvoicesBatch,
} from "@features/invoicing/application";
import type {
  SendInvoiceBatchGroupItem,
  SendInvoiceBatchResultItem,
} from "@features/invoicing/application";
import type {
  InvoiceListItem,
  InvoiceSendRecipients,
} from "@features/invoicing/domain";
import { InvoiceRecipientsChecklist } from "@features/invoicing/presentation/components/InvoiceRecipientsChecklist";
import {
  buildSendRecipientKeys,
  defaultSelectedRecipientKeys,
  toggleRecipientKey,
} from "@features/invoicing/presentation/utils/invoiceSendRecipientSelection";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  groupInvoicesForDispatch,
  invoiceFolioLabel,
  type DispatchInvoiceGroup,
} from "../utils/groupInvoicesForDispatch";

const copy = dispatchRunsCopy.workbench.confirmSheet;
/** PRD §F: error largo → Alert inline (umbral overlays ~160). */
const LONG_ERROR_CHARS = 160;

export type FinanceDispatchConfirmSheetMode = "send" | "resend";

export interface FinanceDispatchConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoices: InvoiceListItem[];
  /** Tras un enqueue con al menos un grupo queued — limpiar selección / refresh. */
  onBatchComplete?: (okInvoiceIds: string[]) => void;
  /** Reenvío con warning de duplicado. Default first-send. */
  mode?: FinanceDispatchConfirmSheetMode;
}

type GroupRecipientState = {
  selectedKeys: string[];
  payload: InvoiceSendRecipients | null;
  status: "idle" | "ready" | "empty" | "error";
};

function groupDisplayName(group: DispatchInvoiceGroup): string {
  const receiverLabel = group.clientName.trim();
  if (receiverLabel) return receiverLabel;
  const rfc = group.receiverRfc.trim();
  if (rfc) return rfc;
  if (group.clientId) {
    return copy.clientFallback(group.clientId.slice(0, 8));
  }
  return copy.rfcOnlyLabel;
}

function resultStatusLabel(item: SendInvoiceBatchResultItem): string {
  if (item.ok) return copy.resultOk;
  if (item.status === "skipped") return copy.resultSkipped;
  return copy.resultFail;
}

function DispatchConfirmClientGroup({
  group,
  open,
  disabled,
  state,
  onStateChange,
}: {
  group: DispatchInvoiceGroup;
  open: boolean;
  disabled: boolean;
  state: GroupRecipientState;
  onStateChange: (next: GroupRecipientState) => void;
}) {
  const {
    data: recipientsPayload,
    isLoading,
    isError,
    refetch,
  } = useInvoiceSendRecipients(group.sampleInvoiceId, open);
  const initKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      initKeyRef.current = null;
      return;
    }
    if (isLoading) return;
    if (isError) {
      initKeyRef.current = null;
      onStateChange({
        selectedKeys: [],
        payload: null,
        status: "error",
      });
      return;
    }
    if (!recipientsPayload) return;

    const initKey = `${recipientsPayload.clientId}:${recipientsPayload.recipients
      .map((r) => r.key)
      .join(",")}`;
    if (initKeyRef.current === initKey) return;
    initKeyRef.current = initKey;

    const hasEligible = recipientsPayload.recipients.length > 0;
    onStateChange({
      selectedKeys: hasEligible
        ? defaultSelectedRecipientKeys(recipientsPayload)
        : [],
      payload: recipientsPayload,
      status: hasEligible ? "ready" : "empty",
    });
  }, [open, isLoading, isError, recipientsPayload, onStateChange]);

  const groupTotal = group.invoices.reduce((sum, inv) => sum + inv.total, 0);
  const clientHref =
    group.clientId ?? recipientsPayload?.clientId ?? null;
  const showLoading = isLoading && state.status !== "ready" && state.status !== "empty";

  return (
    <section
      className="space-y-3 rounded-md border bg-muted/20 p-3"
      data-testid={`dispatch-confirm-group-${group.groupKey}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">
            {groupDisplayName(group)}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {group.receiverRfc}
          </p>
        </div>
        <p className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {copy.groupTotal(formatMxCurrency(groupTotal))}
        </p>
      </div>

      <ul className="space-y-1.5">
        {group.invoices.map((invoice) => (
          <li
            key={invoice.id}
            className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2 text-sm"
          >
            <span className="font-medium">{invoiceFolioLabel(invoice)}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatMxCurrency(invoice.total)}
            </span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          {copy.recipientsHeading}
        </p>
        <p className="text-xs text-muted-foreground">{copy.recipientsHint}</p>

        {showLoading ? (
          <div className="flex items-center py-3 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
            {copy.loadingRecipients}
          </div>
        ) : null}

        {state.status === "error" || (!isLoading && isError) ? (
          <div className="space-y-2 text-sm">
            <p className="text-destructive">{copy.loadRecipientsError}</p>
            <button
              type="button"
              className="text-primary underline-offset-4 hover:underline"
              disabled={disabled}
              onClick={() => void refetch()}
            >
              {copy.retryRecipients}
            </button>
          </div>
        ) : null}

        {state.status === "empty" ? (
          <AlertWithIcon variant="warning" title={copy.noRecipientsTitle}>
            <p>{copy.noRecipients}</p>
            {clientHref ? (
              <p className="mt-2">
                <Link
                  to={`/clients/${clientHref}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {copy.clientLink}
                </Link>
              </p>
            ) : null}
          </AlertWithIcon>
        ) : null}

        {state.status === "ready" && state.payload ? (
          <>
            <InvoiceRecipientsChecklist
              recipients={state.payload.recipients}
              selectedKeys={state.selectedKeys}
              disabled={disabled}
              idPrefix={`dispatch-send-${group.groupKey}`}
              onToggle={(key, checked) =>
                onStateChange({
                  ...state,
                  selectedKeys: toggleRecipientKey(
                    state.selectedKeys,
                    key,
                    checked,
                  ),
                })
              }
            />
            {state.selectedKeys.length === 0 ? (
              <FieldInlineError
                fieldId={`dispatch-recipients-${group.groupKey}`}
                message={copy.zeroSelected}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {copy.recipientsSelected(state.selectedKeys.length)}
              </p>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

export function FinanceDispatchConfirmSheet({
  open,
  onOpenChange,
  invoices,
  onBatchComplete,
  mode = "send",
}: FinanceDispatchConfirmSheetProps) {
  const { toast } = useToast();
  const { sendBatch, isPending, progress } = useSendInvoicesBatch();
  const [groupStates, setGroupStates] = useState<
    Record<string, GroupRecipientState>
  >({});
  const [results, setResults] = useState<SendInvoiceBatchResultItem[] | null>(
    null,
  );

  const groups = useMemo(
    () => groupInvoicesForDispatch(invoices),
    [invoices],
  );

  useEffect(() => {
    if (!open) {
      setGroupStates({});
      setResults(null);
    }
  }, [open]);

  const setGroupState = useCallback(
    (groupKey: string, next: GroupRecipientState) => {
      setGroupStates((prev) => {
        const prevEntry = prev[groupKey];
        if (
          prevEntry &&
          prevEntry.status === next.status &&
          prevEntry.payload === next.payload &&
          prevEntry.selectedKeys.length === next.selectedKeys.length &&
          prevEntry.selectedKeys.every((k, i) => k === next.selectedKeys[i])
        ) {
          return prev;
        }
        return { ...prev, [groupKey]: next };
      });
    },
    [],
  );

  const sendableGroups = useMemo((): SendInvoiceBatchGroupItem[] => {
    const items: SendInvoiceBatchGroupItem[] = [];

    for (const group of groups) {
      const state = groupStates[group.groupKey];
      if (!state || state.status !== "ready" || !state.payload) continue;
      if (state.selectedKeys.length === 0) continue;

      const keys = buildSendRecipientKeys(state.payload, state.selectedKeys);
      items.push({
        groupKey: group.groupKey,
        clientLabel: groupDisplayName(group),
        invoiceIds: group.invoices.map((inv) => inv.id),
        folioLabels: group.invoices.map((inv) => invoiceFolioLabel(inv)),
        recipientKeys: keys,
      });
    }
    return items;
  }, [groups, groupStates]);

  const anyUnresolved = groups.some((g) => {
    const s = groupStates[g.groupKey];
    return !s || s.status === "idle";
  });
  const anyError = groups.some(
    (g) => groupStates[g.groupKey]?.status === "error",
  );
  const canConfirm =
    !isPending &&
    !results &&
    !anyUnresolved &&
    !anyError &&
    sendableGroups.length > 0;

  const isResend = mode === "resend";

  const handleConfirm = useCallback(async () => {
    if (sendableGroups.length === 0) return;
    setResults(null);
    const batchResults = await sendBatch(sendableGroups);
    setResults(batchResults);

    const okGroups = batchResults.filter((r) => r.ok);
    const failGroups = batchResults.filter((r) => !r.ok);
    const okInvoiceIds = okGroups.flatMap((r) => r.invoiceIds);
    const okInvoiceCount = okInvoiceIds.length;

    if (okInvoiceIds.length > 0) {
      onBatchComplete?.(okInvoiceIds);
    }

    if (failGroups.length === 0) {
      toast({
        variant: "success",
        title: isResend
          ? copy.toastQueuedResend(okInvoiceCount, okGroups.length)
          : copy.toastQueued(okInvoiceCount, okGroups.length),
      });
      onOpenChange(false);
      return;
    }

    if (okGroups.length === 0) {
      toast({
        variant: "error",
        title: copy.toastAllFailed,
      });
      return;
    }

    toast({
      variant: "warning",
      title: copy.toastPartial(okGroups.length, failGroups.length),
    });
  }, [
    sendableGroups,
    sendBatch,
    onBatchComplete,
    onOpenChange,
    toast,
    isResend,
  ]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isPending) return;
      onOpenChange(next);
    },
    [isPending, onOpenChange],
  );

  const showResults = Boolean(results);
  const longErrors =
    results?.filter(
      (r) => !r.ok && r.errorMessage && r.errorMessage.length > LONG_ERROR_CHARS,
    ) ?? [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="flex h-full w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          <SheetTitle>{isResend ? copy.titleResend : copy.title}</SheetTitle>
          <SheetDescription>{copy.description}</SheetDescription>
        </SheetHeader>

        <div
          data-slot="dispatch-confirm-body"
          className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4 text-sm"
        >
          {isResend ? (
            <Alert variant="warning">
              <AlertDescription>{copy.resendWarning}</AlertDescription>
            </Alert>
          ) : null}

          {!showResults ? (
            <Alert variant="info">
              <AlertDescription>{copy.linkHint}</AlertDescription>
            </Alert>
          ) : null}

          <p className="text-sm font-medium text-foreground">
            {copy.summary(invoices.length, groups.length)}
          </p>

          {showResults && results ? (
            <div className="space-y-3">
              <p className="font-medium">{copy.resultTitle}</p>
              {longErrors.length > 0 ? (
                <div className="space-y-2">
                  {longErrors.map((item) => (
                    <Alert key={`long-err-${item.groupKey}`} variant="destructive">
                      <AlertDescription className="select-text whitespace-pre-wrap">
                        <span className="font-medium">{item.clientLabel}: </span>
                        {item.errorMessage}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : null}
              <ul className="space-y-2">
                {results.map((item) => {
                  const showInlineError =
                    !item.ok &&
                    item.errorMessage &&
                    item.errorMessage.length <= LONG_ERROR_CHARS;
                  return (
                    <li
                      key={item.groupKey}
                      className="flex items-start gap-2 rounded-md border px-3 py-2"
                      data-testid={`dispatch-result-group-${item.groupKey}`}
                    >
                      {item.ok ? (
                        <CheckCircle2
                          className="mt-0.5 h-4 w-4 shrink-0 text-success"
                          aria-hidden
                        />
                      ) : (
                        <XCircle
                          className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                          aria-hidden
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium">
                          {item.clientLabel}{" "}
                          <span className="text-muted-foreground">
                            · {resultStatusLabel(item)}
                          </span>
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.folioLabels.join(", ")}
                          {" · "}
                          {copy.groupFolioCount(item.folioLabels.length)}
                        </p>
                        {showInlineError ? (
                          <p className="mt-0.5 text-xs text-destructive">
                            {item.errorMessage}
                          </p>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <>
              {groups.map((group) => (
                <DispatchConfirmClientGroup
                  key={group.groupKey}
                  group={group}
                  open={open}
                  disabled={isPending}
                  state={
                    groupStates[group.groupKey] ?? {
                      selectedKeys: [],
                      payload: null,
                      status: "idle",
                    }
                  }
                  onStateChange={(next) =>
                    setGroupState(group.groupKey, next)
                  }
                />
              ))}

              {!anyUnresolved && !anyError && sendableGroups.length === 0 ? (
                <Alert variant="destructive">
                  <AlertDescription>{copy.nothingSendable}</AlertDescription>
                </Alert>
              ) : null}

              {isPending && progress ? (
                <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <Loader2
                    className="h-4 w-4 animate-spin text-primary"
                    aria-hidden
                  />
                  {copy.progress(progress.current, progress.total)}
                </div>
              ) : null}
            </>
          )}
        </div>

        <SheetFooter className="mt-auto shrink-0 gap-2 border-t bg-background px-6 py-4 sm:justify-end">
          {showResults ? (
            <Button
              type="button"
              onClick={() => onOpenChange(false)}
            >
              {copy.close}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                {copy.cancel}
              </Button>
              <Button
                type="button"
                disabled={!canConfirm}
                onClick={() => void handleConfirm()}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    {copy.submitting}
                  </>
                ) : isResend ? (
                  copy.confirmResend
                ) : (
                  copy.confirm
                )}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
