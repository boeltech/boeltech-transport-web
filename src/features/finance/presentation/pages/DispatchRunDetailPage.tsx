import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  Mail,
  RefreshCw,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { DetailPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";
import { formatDate } from "@shared/utils/dateUtils";
import { isClientPortalRole } from "@shared/constants/roles";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import { canAccessBillingDispatchRuns } from "../../application/financeHubAccess";
import {
  useBillingDispatchRun,
  useCancelBillingDispatchRun,
  useConfirmSendBillingDispatchRun,
  usePreviewBillingDispatchRun,
} from "../../application/hooks/useBillingDispatchRuns";
import type {
  BillingDispatchClientReceipt,
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import {
  DispatchRunAlreadySentSection,
  DispatchRunClientGroup,
  DispatchRunClientReceipts,
  DispatchRunFolioList,
  DispatchRunRecipientsEditor,
  DispatchRunRecipientsReadOnly,
  DispatchRunSendResults,
} from "../components";
import { DispatchRunStatusBadge } from "../config/dispatchRunStatusConfig";
import { DispatchRunOriginBadge } from "../components/DispatchRunOriginBadge";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  buildClientSendResults,
  buildPendingStampInvoicePath,
  canCancelDispatchRun,
  canConfirmForceResend,
  canConfirmSend,
  canRefreshPreview,
  clientDisplayName,
  clientIdsFromItems,
  countDispatchPreviewBuckets,
  countFailedClientResults,
  groupAlreadySentByClient,
  groupPendingStampByClient,
  groupReadyToSendByClient,
  isDispatchRunInFlight,
  isDispatchRunTerminal,
  shortId,
  shouldCollapseClientGroups,
  shouldCollapsePendingCard,
  shouldShowAttachmentsHint,
  splitDispatchRunItems,
  summarizeReadyToSend,
} from "../utils/dispatchRunPreviewBuckets";
import {
  buildRecipientOverrides,
  clientsWithZeroSelected,
  countSelectedRecipients,
  defaultRecipientSelection,
  filterRecipientGroupsByClientIds,
  toggleRecipientKey,
  type RecipientSelectionState,
} from "../utils/dispatchRunRecipientSelection";
import {
  buildForceResendPayload,
  clearInvoiceSelection,
  selectAllSkippedInvoiceIds,
  selectClientSkippedInvoiceIds,
  skippedItemsForSelection,
  toggleInvoiceId,
  type InvoiceSelectionState,
} from "../utils/dispatchRunResendSelection";

const copy = dispatchRunsCopy.detail;
const EMPTY_RECIPIENT_GROUPS: RecipientsByClient[] = [];

function itemStatusLabel(status: string): string {
  return (
    dispatchRunsCopy.itemStatus[
      status as keyof typeof dispatchRunsCopy.itemStatus
    ] ?? status
  );
}

function ItemStatusBadge({ status }: { status: string }) {
  if (status === "listed" || status === "queued" || status === "skipped") {
    return null;
  }
  const variant =
    status === "sent"
      ? "success"
      : status === "failed"
        ? "destructive"
        : "outline";
  return (
    <Badge variant={variant} className="shrink-0">
      {itemStatusLabel(status)}
    </Badge>
  );
}

function PendingStampRows({
  items,
  canStamp,
  runId,
  collapseGroups,
}: {
  items: BillingDispatchRunItem[];
  canStamp: boolean;
  runId: string;
  collapseGroups: boolean;
}) {
  const byClient = groupPendingStampByClient(items);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{copy.buckets.emptyBucket}</p>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from(byClient.entries()).map(([clientId, clientItems]) => {
        const label = clientDisplayName(
          clientItems[0]!,
          copy.buckets.clientFallback,
        );
        return (
          <DispatchRunClientGroup
            key={clientId}
            title={label}
            invoiceCount={clientItems.length}
            defaultOpen={!collapseGroups}
          >
            <DispatchRunFolioList
              items={clientItems}
              renderItem={(item) => (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    {item.tripId ? (
                      <Link
                        to={`/trips/${item.tripId}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {copy.buckets.tripLabel(shortId(item.tripId) || "—")}
                      </Link>
                    ) : (
                      <span>{copy.buckets.tripFallback}</span>
                    )}
                  </div>
                  {canStamp && item.tripId ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={buildPendingStampInvoicePath(item)}
                        state={{ from: `/finance/dispatch-runs/${runId}` }}
                      >
                        {copy.buckets.stampCta}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              )}
            />
          </DispatchRunClientGroup>
        );
      })}
    </div>
  );
}

function ReadyToSendRows({
  items,
  recipientsByClient,
  clientReceipts,
  selection,
  editable,
  collapseGroups,
  onToggleRecipient,
}: {
  items: BillingDispatchRunItem[];
  recipientsByClient: RecipientsByClient[];
  clientReceipts: BillingDispatchClientReceipt[] | null | undefined;
  selection: RecipientSelectionState;
  editable: boolean;
  collapseGroups: boolean;
  onToggleRecipient: (clientId: string, key: string, checked: boolean) => void;
}) {
  const byClient = groupReadyToSendByClient(items);
  const recipientsMap = useMemo(() => {
    const map = new Map<string, RecipientsByClient>();
    for (const group of recipientsByClient) {
      map.set(group.clientId, group);
    }
    return map;
  }, [recipientsByClient]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{copy.buckets.emptyBucket}</p>
    );
  }

  return (
    <div className="space-y-3">
      {Array.from(byClient.entries()).map(([clientId, clientItems]) => {
        const label = clientDisplayName(
          clientItems[0]!,
          copy.buckets.clientFallback,
        );
        const group = recipientsMap.get(clientId);
        const selectedKeys = selection[clientId] ?? [];
        const recipientTotal = group?.recipients.length ?? 0;
        const hasZero =
          editable && (recipientTotal === 0 || selectedKeys.length === 0);

        return (
          <DispatchRunClientGroup
            key={clientId}
            title={label}
            invoiceCount={clientItems.length}
            recipientSelected={editable ? selectedKeys.length : undefined}
            recipientTotal={editable ? recipientTotal : undefined}
            hasZeroRecipients={hasZero}
            defaultOpen={!collapseGroups}
          >
            <DispatchRunFolioList
              items={clientItems}
              renderItem={(item) => (
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <span>
                      {item.folio
                        ? copy.buckets.invoiceLabel(item.folio)
                        : copy.buckets.invoiceFallback}
                    </span>
                    <ItemStatusBadge status={item.status} />
                  </div>
                  {item.status === "failed" && item.errorMessage ? (
                    <span className="text-xs text-destructive">
                      {item.errorMessage}
                    </span>
                  ) : null}
                </div>
              )}
            />
            {editable && group ? (
              <DispatchRunRecipientsEditor
                groups={[group]}
                selection={selection}
                onToggle={onToggleRecipient}
              />
            ) : null}
            {!editable && clientReceipts ? (
              <DispatchRunClientReceipts
                receipts={clientReceipts}
                clientId={clientId}
              />
            ) : null}
            {!editable && !clientReceipts && group ? (
              <DispatchRunRecipientsReadOnly group={group} />
            ) : null}
          </DispatchRunClientGroup>
        );
      })}
    </div>
  );
}

function DecisionActionBar({
  sticky,
  summary,
  canExecute,
  showRefresh,
  showCancel,
  showResend,
  showConfirm,
  isPending,
  previewPending,
  hasZeroSelected,
  hasResendZeroSelected,
  onRefresh,
  onCancel,
  onResend,
  onConfirm,
}: {
  sticky: boolean;
  summary: string;
  canExecute: boolean;
  showRefresh: boolean;
  showCancel: boolean;
  showResend: boolean;
  showConfirm: boolean;
  isPending: boolean;
  previewPending: boolean;
  hasZeroSelected: boolean;
  hasResendZeroSelected: boolean;
  onRefresh: () => void;
  onCancel: () => void;
  onResend: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className={
        sticky
          ? "sticky top-0 z-10 -mx-1 space-y-3 border-b bg-background/95 px-1 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          : "space-y-3"
      }
    >
      <p className="text-sm font-medium text-foreground">{summary}</p>
      <div className="flex flex-wrap items-center gap-2">
        {canExecute && showRefresh ? (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={onRefresh}
          >
            {previewPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            {copy.refreshPreview}
          </Button>
        ) : null}
        {canExecute && showCancel ? (
          <Button
            type="button"
            variant="ghost"
            className="text-destructive"
            disabled={isPending}
            onClick={onCancel}
          >
            {copy.cancelRun}
          </Button>
        ) : null}
        {canExecute && showResend ? (
          <Button
            type="button"
            variant="secondary"
            className="sm:ml-auto"
            disabled={isPending || hasResendZeroSelected}
            onClick={onResend}
          >
            {copy.resendCta}
          </Button>
        ) : null}
        {canExecute && showConfirm ? (
          <Button
            type="button"
            className={showResend ? undefined : "sm:ml-auto"}
            disabled={isPending || hasZeroSelected}
            onClick={onConfirm}
          >
            {copy.sendCta}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function DispatchRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission, role } = usePermissions();
  const canAccess = canAccessBillingDispatchRuns({
    isClientPortal: isClientPortalRole(role),
    hasInvoicesRead: hasPermission("invoices", "read"),
  });
  const canExecute = hasPermission("invoices", "execute");

  const { data: run, isLoading, isError, refetch } = useBillingDispatchRun(
    canAccess ? id : undefined,
  );
  const { data: schemes = [] } = useBillingSchemes();
  const previewMutation = usePreviewBillingDispatchRun();
  const confirmMutation = useConfirmSendBillingDispatchRun();
  const cancelMutation = useCancelBillingDispatchRun();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [selection, setSelection] = useState<RecipientSelectionState>({});
  const [invoiceSelection, setInvoiceSelection] =
    useState<InvoiceSelectionState>([]);
  const [pendingOpen, setPendingOpen] = useState<boolean | null>(null);
  const confirmInFlight = useRef(false);
  const resendInFlight = useRef(false);
  const selectionSyncedFor = useRef<string | null>(null);

  const schemeName = useMemo(() => {
    if (!run?.billingSchemeId) return "—";
    return schemes.find((s) => s.id === run.billingSchemeId)?.name ?? run.billingSchemeId;
  }, [run?.billingSchemeId, schemes]);

  const counts = countDispatchPreviewBuckets(run?.summary);
  const { pendingStamp, readyToSend, alreadySent } = splitDispatchRunItems(
    run?.items,
  );
  const readySummary = summarizeReadyToSend(readyToSend);
  const recipientsByClient =
    run?.recipientsByClient ?? EMPTY_RECIPIENT_GROUPS;

  const listedClientIds = useMemo(
    () => new Set(clientIdsFromItems(readyToSend)),
    [readyToSend],
  );
  const listedRecipientGroups = useMemo(
    () => filterRecipientGroupsByClientIds(recipientsByClient, listedClientIds),
    [recipientsByClient, listedClientIds],
  );

  const selectedResendItems = skippedItemsForSelection(
    alreadySent,
    invoiceSelection,
  );
  const resendClientIds = clientIdsFromItems(selectedResendItems);
  const resendRecipientGroups = filterRecipientGroupsByClientIds(
    recipientsByClient,
    resendClientIds,
  );

  const showConfirm = canConfirmSend(run?.status ?? "", counts.readyToSendCount);
  const showResend = canConfirmForceResend(
    run?.status ?? "",
    invoiceSelection.length,
  );
  const showRefresh = canRefreshPreview(run?.status ?? "");
  const showCancel = canCancelDispatchRun(run?.status ?? "");
  const terminal = isDispatchRunTerminal(run?.status ?? "");
  const inFlight = isDispatchRunInFlight(run?.status ?? "");
  const editableRecipients = Boolean(canExecute && showConfirm && !terminal);
  const editableResend = Boolean(
    canExecute && run?.status === "previewed" && !terminal,
  );

  const collapseReadyGroups = shouldCollapseClientGroups(
    counts.readyToSendCount,
    readySummary.clientCount,
  );
  const collapseAlreadySentGroups = shouldCollapseClientGroups(
    alreadySent.length,
    groupAlreadySentByClient(alreadySent).size,
  );
  const collapsePendingByDefault = shouldCollapsePendingCard(
    counts.pendingStampCount,
    counts.readyToSendCount,
  );
  const showAttachmentsHint = shouldShowAttachmentsHint(
    counts.readyToSendCount,
    readySummary.clientCount,
  );

  const sendResultRows = useMemo(
    () =>
      terminal || run?.clientReceipts
        ? buildClientSendResults(run?.items, run?.clientReceipts)
        : [],
    [terminal, run?.items, run?.clientReceipts],
  );
  const failedClientCount = countFailedClientResults(sendResultRows);
  const showPostSendResults =
    (run?.status === "completed" || run?.status === "failed") &&
    sendResultRows.length > 0;

  const zeroSelectedClients = clientsWithZeroSelected(
    listedRecipientGroups,
    selection,
  );
  const hasZeroSelected = zeroSelectedClients.length > 0;
  const selectedRecipientCount = countSelectedRecipients(
    Object.fromEntries(
      listedRecipientGroups.map((g) => [
        g.clientId,
        selection[g.clientId] ?? [],
      ]),
    ),
  );

  const resendZeroSelected = clientsWithZeroSelected(
    resendRecipientGroups,
    selection,
  );
  const hasResendZeroSelected =
    resendZeroSelected.length > 0 ||
    resendClientIds.some((clientId) => {
      const group = recipientsByClient.find((g) => g.clientId === clientId);
      return !group || group.recipients.length === 0;
    });
  const resendRecipientCount = countSelectedRecipients(
    Object.fromEntries(
      resendRecipientGroups.map((g) => [
        g.clientId,
        selection[g.clientId] ?? [],
      ]),
    ),
  );

  useEffect(() => {
    if (!run?.id) return;
    const syncKey = `${run.id}:${run.previewedAt ?? ""}:${recipientsByClient
      .map((g) => `${g.clientId}:${g.recipients.map((r) => r.key).join(",")}`)
      .join("|")}`;
    if (selectionSyncedFor.current === syncKey) return;
    selectionSyncedFor.current = syncKey;
    setSelection(defaultRecipientSelection(recipientsByClient));
    setInvoiceSelection(clearInvoiceSelection());
  }, [run?.id, run?.previewedAt, recipientsByClient]);

  useEffect(() => {
    setPendingOpen(null);
  }, [run?.id, run?.previewedAt]);

  const periodSubtitle = run
    ? copy.periodClosedTrips(
        formatDate(run.periodStart),
        formatDate(run.periodEnd),
      )
    : undefined;

  const decisionSummaryText = copy.decisionSummary(
    counts.readyToSendCount,
    readySummary.clientCount,
    counts.pendingStampCount,
  );

  const stickyActions =
    Boolean(canExecute) &&
    (showConfirm || showResend) &&
    run?.status === "previewed";

  const pendingCardOpen =
    pendingOpen ?? !collapsePendingByDefault;

  const handleRefresh = async () => {
    if (!id) return;
    await previewMutation.mutateAsync(id);
    await refetch();
  };

  const handleConfirm = async () => {
    if (!id || confirmInFlight.current) return;
    if (!canConfirmSend(run?.status ?? "", counts.readyToSendCount)) {
      setConfirmOpen(false);
      await refetch();
      return;
    }
    if (hasZeroSelected) {
      setConfirmError(copy.recipients.zeroSelected);
      return;
    }
    confirmInFlight.current = true;
    setConfirmError(null);
    try {
      const recipientOverrides = buildRecipientOverrides(
        listedRecipientGroups,
        selection,
      );
      // Envío normal: nunca forceResend (D3 / SDD §5.5).
      await confirmMutation.mutateAsync({
        id,
        payload: { recipientOverrides },
      });
      setConfirmOpen(false);
      await refetch();
    } catch {
      await refetch();
    } finally {
      confirmInFlight.current = false;
    }
  };

  const handleResendConfirm = async () => {
    if (!id || resendInFlight.current) return;
    if (!canConfirmForceResend(run?.status ?? "", invoiceSelection.length)) {
      setResendOpen(false);
      await refetch();
      return;
    }
    if (hasResendZeroSelected) {
      setResendError(copy.resendConfirm.zeroSelected);
      return;
    }
    resendInFlight.current = true;
    setResendError(null);
    try {
      const payload = buildForceResendPayload(
        invoiceSelection,
        recipientsByClient,
        selection,
        resendClientIds,
      );
      await confirmMutation.mutateAsync({ id, payload });
      setResendOpen(false);
      setInvoiceSelection(clearInvoiceSelection());
      await refetch();
    } catch {
      await refetch();
    } finally {
      resendInFlight.current = false;
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    await cancelMutation.mutateAsync(id);
    navigate("/finance/dispatch-runs");
  };

  const isPending =
    previewMutation.isPending ||
    confirmMutation.isPending ||
    cancelMutation.isPending;

  if (!canAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/finance/dispatch-runs",
          backLabel: copy.backToList,
          icon: <Mail className="h-6 w-6" />,
          title: copy.title,
        }}
      />
    );
  }

  if (isError || !run) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          backHref: "/finance/dispatch-runs",
          backLabel: copy.backToList,
          icon: <Mail className="h-6 w-6" />,
          title: copy.title,
        }}
        alerts={
          <p className="text-sm text-destructive">{dispatchRunsCopy.toast.error}</p>
        }
      />
    );
  }

  const confirmDisabled =
    isPending || counts.readyToSendCount < 1 || hasZeroSelected;
  const resendDisabled =
    isPending || invoiceSelection.length < 1 || hasResendZeroSelected;
  const alreadySentCount =
    alreadySent.length > 0
      ? alreadySent.length
      : counts.alreadySentSkipped;

  return (
    <DetailPageShell
      isLoading={false}
      header={{
        backHref: "/finance/dispatch-runs",
        backLabel: copy.backToList,
        icon: <Mail className="h-6 w-6" />,
        iconVariant: "primary",
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span className="shrink-0">{copy.title}</span>
            <DispatchRunStatusBadge status={run.status} showIcon size="sm" />
            <DispatchRunOriginBadge
              origin={run.origin}
              className="text-xs font-medium"
            />
          </span>
        ),
        subtitle: (
          <div className="space-y-0.5">
            {periodSubtitle ? (
              <p className="truncate text-sm text-muted-foreground">
                {periodSubtitle}
              </p>
            ) : null}
            <p className="truncate text-xs text-muted-foreground">
              {copy.schemeTypeLabel(schemeName)}
            </p>
          </div>
        ),
      }}
    >
      <div className="space-y-6">
        <DecisionActionBar
          sticky={stickyActions}
          summary={decisionSummaryText}
          canExecute={canExecute}
          showRefresh={showRefresh}
          showCancel={showCancel}
          showResend={showResend}
          showConfirm={showConfirm}
          isPending={isPending}
          previewPending={previewMutation.isPending}
          hasZeroSelected={hasZeroSelected}
          hasResendZeroSelected={hasResendZeroSelected}
          onRefresh={() => void handleRefresh()}
          onCancel={() => void handleCancel()}
          onResend={() => {
            setResendError(null);
            setResendOpen(true);
          }}
          onConfirm={() => {
            setConfirmError(null);
            setConfirmOpen(true);
          }}
        />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{copy.counts.readyToSend}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {counts.readyToSendCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{copy.counts.pendingStamp}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {counts.pendingStampCount}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>{copy.counts.alreadySent}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">
                {alreadySentCount}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {inFlight ? (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>{copy.result.title}</AlertTitle>
            <AlertDescription>{copy.sendingBanner}</AlertDescription>
          </Alert>
        ) : null}

        {showAttachmentsHint && showConfirm ? (
          <Alert>
            <AlertDescription>{copy.attachmentsHint}</AlertDescription>
          </Alert>
        ) : null}

        {editableRecipients && hasZeroSelected ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.recipients.zeroSelected}</AlertTitle>
          </Alert>
        ) : null}

        {editableResend &&
        invoiceSelection.length > 0 &&
        hasResendZeroSelected ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.resendConfirm.zeroSelected}</AlertTitle>
          </Alert>
        ) : null}

        {!showConfirm && counts.readyToSendCount === 0 && !terminal ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.confirm.noReady}</AlertTitle>
          </Alert>
        ) : null}

        {run.status === "completed" && failedClientCount > 0 ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>
              {copy.result.completedWithErrors(
                failedClientCount,
                sendResultRows.length,
              )}
            </AlertTitle>
            {run.errorSummary ? (
              <AlertDescription>{run.errorSummary}</AlertDescription>
            ) : null}
          </Alert>
        ) : null}

        {run.status === "completed" && failedClientCount === 0 ? (
          <Alert>
            <AlertTitle>{copy.result.completed}</AlertTitle>
          </Alert>
        ) : null}

        {run.status === "failed" ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{copy.result.error}</AlertTitle>
            <AlertDescription>
              {run.errorSummary ?? copy.result.errorHint}
            </AlertDescription>
          </Alert>
        ) : run.errorSummary && run.status !== "completed" ? (
          <Alert variant="destructive">
            <AlertTitle>{copy.result.error}</AlertTitle>
            <AlertDescription>{run.errorSummary}</AlertDescription>
          </Alert>
        ) : null}

        {showPostSendResults ? (
          <DispatchRunSendResults rows={sendResultRows} />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <Collapsible
              open={pendingCardOpen}
              onOpenChange={setPendingOpen}
            >
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{copy.buckets.pendingTitle}</CardTitle>
                  {collapsePendingByDefault || pendingStamp.length > 0 ? (
                    <CollapsibleTrigger asChild>
                      <Button type="button" variant="ghost" size="sm">
                        {pendingCardOpen
                          ? copy.buckets.collapsePending
                          : copy.buckets.expandPending}
                      </Button>
                    </CollapsibleTrigger>
                  ) : null}
                </div>
                {!pendingCardOpen && pendingStamp.length > 0 ? (
                  <CardDescription>
                    {copy.buckets.pendingCollapsedSummary(pendingStamp.length)}
                  </CardDescription>
                ) : pendingStamp.length > 0 ? (
                  <CardDescription>{copy.buckets.pendingNote}</CardDescription>
                ) : null}
              </CardHeader>
              <CollapsibleContent>
                <CardContent>
                  <PendingStampRows
                    items={pendingStamp}
                    canStamp={canExecute && !terminal}
                    runId={run.id}
                    collapseGroups={collapseReadyGroups}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{copy.buckets.readyTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReadyToSendRows
                items={readyToSend}
                recipientsByClient={recipientsByClient}
                clientReceipts={
                  showPostSendResults ? null : run.clientReceipts
                }
                selection={selection}
                editable={editableRecipients}
                collapseGroups={collapseReadyGroups}
                onToggleRecipient={(clientId, key, checked) => {
                  setSelection((prev) =>
                    toggleRecipientKey(prev, clientId, key, checked),
                  );
                }}
              />
            </CardContent>
          </Card>
        </div>

        {alreadySentCount > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>{copy.alreadySent.title}</CardTitle>
              <CardDescription>{copy.alreadySent.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <DispatchRunAlreadySentSection
                items={alreadySent}
                recipientsByClient={recipientsByClient}
                invoiceSelection={invoiceSelection}
                recipientSelection={selection}
                editable={editableResend}
                listedClientIds={listedClientIds}
                collapseGroups={collapseAlreadySentGroups}
                onToggleInvoice={(invoiceId, checked) => {
                  setInvoiceSelection((prev) =>
                    toggleInvoiceId(prev, invoiceId, checked),
                  );
                }}
                onSelectAll={() => {
                  setInvoiceSelection(selectAllSkippedInvoiceIds(alreadySent));
                }}
                onClearSelection={() => {
                  setInvoiceSelection(clearInvoiceSelection());
                }}
                onSelectClient={(clientId) => {
                  setInvoiceSelection((prev) =>
                    selectClientSkippedInvoiceIds(
                      alreadySent,
                      clientId,
                      prev,
                    ),
                  );
                }}
                onToggleRecipient={(clientId, key, checked) => {
                  setSelection((prev) =>
                    toggleRecipientKey(prev, clientId, key, checked),
                  );
                }}
              />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.confirm.title}</AlertDialogTitle>
            <AlertDialogDescription>{copy.confirm.emailNote}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-sm">
            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <p className="font-medium">
                {copy.confirm.summaryClients(readySummary.clientCount)}
                {" · "}
                {copy.confirm.summaryInvoices(readySummary.folioCount)}
                {" · "}
                {copy.confirm.summaryRecipients(selectedRecipientCount)}
              </p>
              <p className="mt-2 text-muted-foreground">
                {copy.confirm.recipientsNote}
              </p>
            </div>

            {counts.pendingStampCount > 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>{copy.confirm.pendingWarningTitle}</AlertTitle>
                <AlertDescription>{copy.confirm.pendingWarning}</AlertDescription>
              </Alert>
            ) : null}

            {confirmError || hasZeroSelected ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {confirmError ?? copy.recipients.zeroSelected}
                </AlertTitle>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {copy.confirm.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={confirmDisabled}
              onClick={(event) => {
                event.preventDefault();
                void handleConfirm();
              }}
            >
              {confirmMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {copy.confirm.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={resendOpen}
        onOpenChange={(open) => {
          setResendOpen(open);
          if (!open) setResendError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.resendConfirm.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {copy.resendConfirm.emailNote}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 text-sm">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{copy.resendConfirm.riskNote}</AlertDescription>
            </Alert>

            <div className="rounded-lg border bg-muted/40 px-4 py-3">
              <p className="font-medium">
                {copy.resendConfirm.summaryClients(resendClientIds.length)}
                {" · "}
                {copy.resendConfirm.summaryInvoices(invoiceSelection.length)}
                {" · "}
                {copy.resendConfirm.summaryRecipients(resendRecipientCount)}
              </p>
              <p className="mt-2 text-muted-foreground">
                {copy.resendConfirm.recipientsNote}
              </p>
            </div>

            {resendError || hasResendZeroSelected ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>
                  {resendError ?? copy.resendConfirm.zeroSelected}
                </AlertTitle>
              </Alert>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>
              {copy.resendConfirm.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={resendDisabled}
              onClick={(event) => {
                event.preventDefault();
                void handleResendConfirm();
              }}
            >
              {confirmMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {copy.resendConfirm.submit}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DetailPageShell>
  );
}
