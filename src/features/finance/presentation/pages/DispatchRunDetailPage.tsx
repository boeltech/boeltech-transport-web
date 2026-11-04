import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Mail,
  Plus,
} from "lucide-react";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { DetailAlertCard } from "@shared/ui/data-display";
import { DetailPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";
import { isClientPortalRole } from "@shared/constants/roles";
import { useBillingSchemes } from "@features/settings/application/hooks/useBillingSchemes";
import { canAccessBillingDispatchRuns } from "../../application/financeHubAccess";
import { useIncomingFrom } from "@shared/utils/listQueueFrom";
import {
  resolveDispatchRunBackHref,
  resolveDispatchRunBackLabel,
} from "../utils/dispatchWayfinding";
import {
  useBillingDispatchRun,
  useConfirmSendBillingDispatchRun,
  usePreviewBillingDispatchRun,
} from "../../application/hooks/useBillingDispatchRuns";
import type {
  BillingDispatchRunItem,
  RecipientsByClient,
} from "../../domain/billingDispatchRun.types";
import {
  DispatchRunAlreadySentSection,
  DispatchRunClientGroup,
  DispatchRunFolioList,
  DispatchRunReadyTable,
  DispatchRunSendResults,
} from "../components";
import { DispatchRunStatusBadge } from "../components/DispatchRunStatusBadge";
import { DispatchRunOriginBadge } from "../components/DispatchRunOriginBadge";
import { DispatchRunActions } from "../components/DispatchRunActions";
import { DispatchRunConfirmSheet } from "../components/DispatchRunConfirmSheet";
import { DispatchRunCutBar } from "../components/DispatchRunCutBar";
import { FinanceDispatchCreateRunDialog } from "../components/FinanceDispatchCreateRunDialog";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { isEmptyScheduledCancelled } from "../utils/dispatchRunStatusPresentation";
import {
  buildClientSendResults,
  buildPendingStampInvoicePath,
  canConfirmForceResend,
  canConfirmSend,
  canRefreshPreview,
  clientDisplayName,
  clientIdsFromItems,
  countDispatchPreviewBuckets,
  countFailedClientResults,
  formatPendingStampTripLabel,
  groupAlreadySentByClient,
  groupPendingStampByClient,
  isDispatchRunInFlight,
  isDispatchRunTerminal,
  partitionByDocumentKind,
  shouldCollapseClientGroups,
  shouldCollapsePendingCard,
  splitDispatchRunItems,
  summarizeReadyToSend,
} from "../utils/dispatchRunPreviewBuckets";
import { formatDispatchPeriodCutLabel } from "../utils/formatDispatchPeriodCutLabel";
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
  clearResendSelection,
  resendSelectionCount,
  selectAllSkippedDocuments,
  selectClientSkippedDocuments,
  skippedItemsForSelection,
  toggleInvoiceId,
  togglePaymentId,
  type ResendSelectionState,
} from "../utils/dispatchRunResendSelection";

const copy = dispatchRunsCopy.detail;
const EMPTY_RECIPIENT_GROUPS: RecipientsByClient[] = [];

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
                        state={{ from: `/finance/dispatch/${runId}` }}
                        className="font-medium text-primary hover:underline"
                      >
                        {formatPendingStampTripLabel(
                          item,
                          copy.buckets.tripFallback,
                        )}
                      </Link>
                    ) : (
                      <span>{copy.buckets.tripFallback}</span>
                    )}
                  </div>
                  {canStamp && item.tripId ? (
                    <Button variant="outline" size="sm" asChild>
                      <Link
                        to={buildPendingStampInvoicePath(item)}
                        state={{ from: `/finance/dispatch/${runId}` }}
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

function TypedReadySection({
  title,
  anchor,
  emptyCopy,
  emptyHint,
  items,
  quietCount,
  collapsible = false,
  defaultOpen = true,
}: {
  title: string;
  anchor: string;
  emptyCopy: string;
  emptyHint?: string;
  items: BillingDispatchRunItem[];
  quietCount: string;
  /** Completada: tablas densas secundarias, colapsables. */
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  const body =
    items.length === 0 ? (
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{emptyCopy}</p>
        {emptyHint ? (
          <p className="text-xs text-muted-foreground">{emptyHint}</p>
        ) : null}
      </div>
    ) : (
      <div className="overflow-hidden rounded-md border border-border">
        <DispatchRunReadyTable items={items} />
      </div>
    );

  const header = (
    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
      <div className="space-y-1.5">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{anchor}</CardDescription>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs tabular-nums text-muted-foreground">
          {quietCount}
        </span>
        {collapsible && items.length > 0 ? (
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2">
              {open ? copy.sections.collapseDocs : copy.sections.expandDocs}
              <ChevronDown
                className={`ml-1 h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden
              />
            </Button>
          </CollapsibleTrigger>
        ) : null}
      </div>
    </CardHeader>
  );

  if (collapsible && items.length > 0) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <Card aria-label={title}>
          {header}
          <CollapsibleContent>
            <CardContent>{body}</CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    );
  }

  return (
    <Card aria-label={title}>
      {header}
      <CardContent>{body}</CardContent>
    </Card>
  );
}

export function DispatchRunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission, role } = usePermissions();
  const canAccess = canAccessBillingDispatchRuns({
    isClientPortal: isClientPortalRole(role),
    hasInvoicesRead: hasPermission("invoices", "read"),
  });
  const canExecute = hasPermission("invoices", "execute");
  const incomingFrom = useIncomingFrom();
  const backHref = resolveDispatchRunBackHref(incomingFrom);
  const backLabel = resolveDispatchRunBackLabel(incomingFrom);

  const { data: run, isLoading, isError, refetch } = useBillingDispatchRun(
    canAccess ? id : undefined,
  );
  const { data: schemes = [] } = useBillingSchemes();
  const previewMutation = usePreviewBillingDispatchRun();
  const confirmMutation = useConfirmSendBillingDispatchRun();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resendOpen, setResendOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [selection, setSelection] = useState<RecipientSelectionState>({});
  const [resendSelection, setResendSelection] = useState<ResendSelectionState>(
    clearResendSelection(),
  );
  const [pendingOpen, setPendingOpen] = useState<boolean | null>(null);
  const [alreadySentOpen, setAlreadySentOpen] = useState(false);
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
  const { invoices: readyInvoices, reps: readyReps } =
    partitionByDocumentKind(readyToSend);
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
    resendSelection,
  );
  const resendClientIds = clientIdsFromItems(selectedResendItems);
  const resendRecipientGroups = filterRecipientGroupsByClientIds(
    recipientsByClient,
    resendClientIds,
  );
  const selectedResendCount = resendSelectionCount(resendSelection);

  const showConfirm = canConfirmSend(run?.status ?? "", counts.readyTotalCount);
  const terminal = isDispatchRunTerminal(run?.status ?? "");
  const inFlight = isDispatchRunInFlight(run?.status ?? "");
  const editableResend = Boolean(
    canExecute && run?.status === "previewed" && !terminal,
  );

  const collapseReadyGroups = shouldCollapseClientGroups(
    readyToSend.length,
    readySummary.clientCount,
  );
  const collapseAlreadySentGroups = shouldCollapseClientGroups(
    alreadySent.length,
    groupAlreadySentByClient(alreadySent).size,
  );
  const awaitingSendCount = readyToSend.filter(
    (item) => item.status === "listed" || item.status === "queued",
  ).length;
  const collapsePendingByDefault = shouldCollapsePendingCard(
    pendingStamp.length,
    awaitingSendCount,
  );

  const sendResultRows = useMemo(
    () =>
      terminal || run?.clientReceipts
        ? buildClientSendResults(run?.items, run?.clientReceipts)
        : [],
    [terminal, run?.items, run?.clientReceipts],
  );
  const failedClientCount = countFailedClientResults(sendResultRows);

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
    setResendSelection(clearResendSelection());
  }, [run?.id, run?.previewedAt, recipientsByClient]);

  useEffect(() => {
    setPendingOpen(null);
    setAlreadySentOpen(false);
  }, [run?.id, run?.previewedAt]);

  const periodCutLabel = run
    ? formatDispatchPeriodCutLabel(run)
    : copy.titleFallback;

  const onlyRepsBatch =
    readySummary.invoiceCount === 0 && readySummary.repCount > 0;

  const pendingCardOpen =
    pendingOpen ?? !collapsePendingByDefault;

  const handleRefresh = async () => {
    if (!id) return;
    await previewMutation.mutateAsync(id);
    await refetch();
  };

  const handleConfirm = async () => {
    if (!id || confirmInFlight.current) return;
    if (!canConfirmSend(run?.status ?? "", counts.readyTotalCount)) {
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
    if (!canConfirmForceResend(run?.status ?? "", selectedResendCount)) {
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
        resendSelection,
        recipientsByClient,
        selection,
        resendClientIds,
      );
      await confirmMutation.mutateAsync({ id, payload });
      setResendOpen(false);
      setResendSelection(clearResendSelection());
      await refetch();
    } catch {
      await refetch();
    } finally {
      resendInFlight.current = false;
    }
  };

  const isPending =
    previewMutation.isPending || confirmMutation.isPending;

  if (!canAccess) {
    return <Navigate to="/forbidden" replace />;
  }

  if (isLoading) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref,
          backLabel,
          icon: <Mail className="h-6 w-6" />,
          title: copy.titleFallback,
        }}
      />
    );
  }

  if (isError || !run) {
    return (
      <DetailPageShell
        isLoading={false}
        header={{
          backHref,
          backLabel,
          icon: <Mail className="h-6 w-6" />,
          title: copy.titleFallback,
        }}
        alerts={
          <DetailAlertCard
            severity="critical"
            icon={<AlertCircle className="h-5 w-5" aria-hidden />}
            title={copy.loadErrorTitle}
            items={[{ text: copy.loadError }]}
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  void refetch();
                }}
              >
                {copy.retry}
              </Button>
            }
          />
        }
      />
    );
  }

  const confirmDisabled =
    isPending || counts.readyTotalCount < 1 || hasZeroSelected;
  const resendDisabled =
    isPending || selectedResendCount < 1 || hasResendZeroSelected;
  const alreadySentCount = alreadySent.length;
  const showEmptyScheduledAlert =
    isEmptyScheduledCancelled(run.origin, run.status) &&
    counts.readyTotalCount === 0;
  const isCompleted = run.status === "completed";
  const showSendInCutBar = Boolean(canExecute && showConfirm && !terminal);
  const showResendOutline = Boolean(
    canExecute &&
      editableResend &&
      canConfirmForceResend(run.status, selectedResendCount),
  );

  const moreActions = canExecute ? (
    <DispatchRunActions
      variant="buttons"
      omitPrimary
      runId={run.id}
      status={run.status}
      readyCount={counts.readyTotalCount}
      selectedResendCount={selectedResendCount}
      hasZeroSelected={hasZeroSelected}
      hasResendZeroSelected={hasResendZeroSelected}
      isPending={isPending}
      previewPending={previewMutation.isPending}
      onRefresh={() => void handleRefresh()}
      onResend={() => {
        setResendError(null);
        setResendOpen(true);
      }}
      onCancelled={() => {
        /* stay on detalle */
      }}
    />
  ) : null;

  return (
    <>
    <DetailPageShell
      isLoading={false}
      header={{
        backHref,
        backLabel,
        icon: <Mail className="h-6 w-6" />,
        iconVariant: "primary",
        title: (
          <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
            <span>{copy.titleFallback}</span>
            <DispatchRunStatusBadge
              status={run.status}
              origin={run.origin}
              showIcon
              size="sm"
            />
            <DispatchRunOriginBadge
              origin={run.origin}
              glossary="detail"
              className="text-xs font-medium"
            />
          </span>
        ),
      }}
    >
      <div className="space-y-5">
        <Alert variant="info" className="border-info/25 py-2">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden />
          <AlertDescription className="text-xs leading-snug">
            {copy.i1Banner}
          </AlertDescription>
        </Alert>

        <DispatchRunCutBar
          periodLabel={periodCutLabel}
          frequencyName={schemeName}
          invoiceCount={readySummary.invoiceCount}
          repCount={readySummary.repCount}
          pendingCount={pendingStamp.length}
          showPendingRail={!pendingCardOpen}
          showSend={showSendInCutBar}
          sendDisabled={confirmDisabled}
          isPending={isPending}
          onSend={() => {
            setConfirmError(null);
            setConfirmOpen(true);
          }}
          secondaryActions={moreActions}
        />

        {showEmptyScheduledAlert ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title={copy.emptyScheduledAlert.title}
            action={
              canExecute ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                  {copy.emptyScheduledAlert.cta}
                </Button>
              ) : null
            }
          >
            <p>{copy.emptyScheduledAlert.body}</p>
          </DetailAlertCard>
        ) : null}

        {inFlight ? (
          <DetailAlertCard
            severity="info"
            icon={<Loader2 className="h-5 w-5 animate-spin" aria-hidden />}
            title={copy.result.title}
          >
            <p>{copy.sendingBanner}</p>
          </DetailAlertCard>
        ) : null}

        {!showConfirm &&
        counts.readyTotalCount === 0 &&
        !terminal &&
        !showEmptyScheduledAlert ? (
          <DetailAlertCard
            severity="warning"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title={copy.confirm.noReady}
            action={
              canExecute && canRefreshPreview(run.status) ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    void handleRefresh();
                  }}
                >
                  {previewMutation.isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden />
                  ) : null}
                  {copy.refreshPreview}
                </Button>
              ) : null
            }
          />
        ) : null}

        {run.status === "completed" && failedClientCount > 0 ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title={copy.result.completedWithErrors(
              failedClientCount,
              sendResultRows.length,
            )}
          >
            {run.errorSummary ? <p>{run.errorSummary}</p> : null}
          </DetailAlertCard>
        ) : null}

        {run.status === "completed" && failedClientCount === 0 ? (
          <DetailAlertCard
            severity="info"
            icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            title={copy.result.completed}
          />
        ) : null}

        {run.status === "failed" ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title={copy.result.error}
            action={
              canExecute ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                  {copy.emptyScheduledAlert.cta}
                </Button>
              ) : null
            }
          >
            <p>{run.errorSummary ?? copy.result.errorHint}</p>
          </DetailAlertCard>
        ) : run.errorSummary && run.status !== "completed" ? (
          <DetailAlertCard
            severity="critical"
            icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
            title={copy.result.error}
          >
            <p>{run.errorSummary}</p>
          </DetailAlertCard>
        ) : null}

        {sendResultRows.length > 0 ? (
          <DispatchRunSendResults rows={sendResultRows} />
        ) : null}

        <TypedReadySection
          title={copy.sections.invoices}
          anchor={copy.sections.invoicesAnchor}
          emptyCopy={copy.sections.emptyReadyInvoices}
          items={readyInvoices}
          quietCount={
            isCompleted
              ? copy.counts.quietIncluded(readyInvoices.length)
              : copy.counts.quietReady(readyInvoices.length)
          }
          collapsible={isCompleted}
          defaultOpen={!isCompleted}
        />

        <TypedReadySection
          title={copy.sections.reps}
          anchor={copy.sections.repsAnchor}
          emptyCopy={copy.sections.emptyReadyReps}
          emptyHint={copy.sections.emptyReadyRepsHint}
          items={readyReps}
          quietCount={
            isCompleted
              ? copy.counts.quietIncluded(readyReps.length)
              : copy.counts.quietReady(readyReps.length)
          }
          collapsible={isCompleted}
          defaultOpen={!isCompleted}
        />

        {pendingStamp.length > 0 ? (
          <Collapsible
            open={pendingCardOpen}
            onOpenChange={setPendingOpen}
          >
            <div className="rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {copy.buckets.pendingTitle}
                  </p>
                  {!pendingCardOpen ? (
                    <p className="text-xs text-muted-foreground">
                      {copy.buckets.pendingCollapsedSummary(pendingStamp.length)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {copy.buckets.pendingNote}
                    </p>
                  )}
                </div>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm">
                    {pendingCardOpen
                      ? copy.buckets.collapsePending
                      : copy.buckets.expandPending}
                    <ChevronDown
                      className={`ml-1 h-4 w-4 transition-transform ${pendingCardOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="border-t border-border px-3 py-3">
                  <PendingStampRows
                    items={pendingStamp}
                    canStamp={canExecute && !terminal}
                    runId={run.id}
                    collapseGroups={collapseReadyGroups}
                  />
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : null}

        {alreadySentCount > 0 ? (
          <Collapsible
            open={alreadySentOpen}
            onOpenChange={setAlreadySentOpen}
          >
            <div className="rounded-lg border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {copy.alreadySent.title}{" "}
                    <span className="font-normal text-muted-foreground">
                      {copy.alreadySent.collapsedHint(alreadySentCount)}
                    </span>
                  </p>
                  {alreadySentOpen ? (
                    <p className="text-xs text-muted-foreground">
                      {copy.alreadySent.description}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {showResendOutline && alreadySentOpen ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={
                        isPending ||
                        selectedResendCount < 1 ||
                        hasResendZeroSelected
                      }
                      onClick={() => {
                        setResendError(null);
                        setResendOpen(true);
                      }}
                    >
                      {copy.resendCta}
                    </Button>
                  ) : null}
                  <CollapsibleTrigger asChild>
                    <Button type="button" variant="ghost" size="sm">
                      {alreadySentOpen
                        ? copy.alreadySent.collapse
                        : copy.alreadySent.expand}
                      <ChevronDown
                        className={`ml-1 h-4 w-4 transition-transform ${alreadySentOpen ? "rotate-180" : ""}`}
                        aria-hidden
                      />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
              <CollapsibleContent>
                <div className="border-t border-border px-3 py-3">
                  <DispatchRunAlreadySentSection
                    items={alreadySent}
                    recipientsByClient={recipientsByClient}
                    clientReceipts={
                      editableResend ? undefined : run.clientReceipts
                    }
                    resendSelection={resendSelection}
                    recipientSelection={selection}
                    editable={editableResend}
                    listedClientIds={listedClientIds}
                    collapseGroups={collapseAlreadySentGroups}
                    onToggleInvoice={(invoiceId, checked) => {
                      setResendSelection((prev) =>
                        toggleInvoiceId(prev, invoiceId, checked),
                      );
                    }}
                    onTogglePayment={(paymentId, checked) => {
                      setResendSelection((prev) =>
                        togglePaymentId(prev, paymentId, checked),
                      );
                    }}
                    onSelectAll={() => {
                      setResendSelection(selectAllSkippedDocuments(alreadySent));
                    }}
                    onClearSelection={() => {
                      setResendSelection(clearResendSelection());
                    }}
                    onSelectClient={(clientId) => {
                      setResendSelection((prev) =>
                        selectClientSkippedDocuments(
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
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : null}

        <p className="max-w-prose text-xs text-muted-foreground">
          {copy.footNote}
        </p>
      </div>

      <DispatchRunConfirmSheet
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) setConfirmError(null);
        }}
        mode="send"
        invoiceCount={readySummary.invoiceCount}
        repCount={readySummary.repCount}
        clientCount={readySummary.clientCount}
        recipientCount={selectedRecipientCount}
        pendingStampCount={counts.pendingStampCount}
        onlyRepsBatch={onlyRepsBatch}
        recipientGroups={listedRecipientGroups}
        selection={selection}
        onToggleRecipient={(clientId, key, checked) => {
          setSelection((prev) =>
            toggleRecipientKey(prev, clientId, key, checked),
          );
        }}
        hasZeroSelected={hasZeroSelected}
        errorMessage={confirmError}
        isPending={confirmMutation.isPending}
        confirmDisabled={confirmDisabled}
        onConfirm={() => {
          void handleConfirm();
        }}
      />

      <DispatchRunConfirmSheet
        open={resendOpen}
        onOpenChange={(open) => {
          setResendOpen(open);
          if (!open) setResendError(null);
        }}
        mode="resend"
        invoiceCount={resendSelection.invoiceIds.length}
        repCount={resendSelection.paymentIds.length}
        clientCount={resendClientIds.length}
        recipientCount={resendRecipientCount}
        recipientGroups={resendRecipientGroups}
        selection={selection}
        onToggleRecipient={(clientId, key, checked) => {
          setSelection((prev) =>
            toggleRecipientKey(prev, clientId, key, checked),
          );
        }}
        hasZeroSelected={hasResendZeroSelected}
        errorMessage={resendError}
        isPending={confirmMutation.isPending}
        confirmDisabled={resendDisabled}
        onConfirm={() => {
          void handleResendConfirm();
        }}
      />
    </DetailPageShell>

    <FinanceDispatchCreateRunDialog
      open={createOpen}
      onOpenChange={setCreateOpen}
      alreadyOpenSource="list"
      returnTo={backHref}
    />
    </>
  );
}
