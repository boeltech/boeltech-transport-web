import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { RefreshCw, Wallet } from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { MonthField } from "@shared/ui/form";
import { Label } from "@shared/ui/label";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import { isStripePublishableConfigured } from "@features/billing";
import {
  PLATFORM_SAAS_INVOICE_STATUS_VALUES,
  isPlatformOwner,
  type PlatformCloseRunItem,
  type PlatformSaasArRow,
  type PlatformSaasInvoiceStatusType,
} from "../../domain/entities";
import {
  usePlatformArList,
  usePlatformArViewCounts,
  usePlatformArCloseRun,
  usePlatformArChargeRun,
  useIssueSaasInvoiceDraft,
} from "../../application/hooks/usePlatformSaasAr";
import { usePlatformAuth } from "../providers/PlatformAuthProvider";
import { platformCopy } from "../copy/platformCopy";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import { resolveClosedPeriodKeyForCloseRun } from "../utils/billingPeriod";
import { ArTenantFilter } from "../components/ArTenantFilter";
import { PlatformArRowActions } from "../components/PlatformArRowActions";
import { IssueSaasInvoiceSheet } from "../components/IssueSaasInvoiceSheet";
import { MarkSaasInvoicePaidSheet } from "../components/MarkSaasInvoicePaidSheet";
import { ChargeSaasInvoiceStripeSheet } from "../components/ChargeSaasInvoiceStripeSheet";
import { VoidSaasInvoiceDialog } from "../components/VoidSaasInvoiceDialog";
import { SaasInvoiceOriginBadge } from "../components/SaasInvoiceOriginBadge";
import { SaasAutoChargeChip } from "../components/SaasAutoChargeChip";
import {
  chargeRunNeedsAttention,
  resolveAutoChargeChip,
} from "../utils/autoChargeChip";

type ArView = "pending" | "overdue" | "all" | "exceptions";

function tenantCommercialHref(tenantId: string) {
  return `/platform/tenants/${tenantId}?tab=commercial`;
}

function ExceptionsTable({
  items,
  canMutate,
  onIssue,
}: {
  items: PlatformCloseRunItem[];
  canMutate: boolean;
  onIssue: (item: PlatformCloseRunItem) => void;
}) {
  const copy = platformCopy.ar;

  const rowActions = (item: PlatformCloseRunItem) => {
    const issueOverride =
      canMutate && item.canIssueOverride && item.hasFrozenAmount;
    return (
      <div className="flex flex-wrap gap-1">
        {issueOverride ? (
          <Button size="sm" variant="default" onClick={() => onIssue(item)}>
            {copy.actions.issue}
          </Button>
        ) : null}
        <Button size="sm" variant="outline" asChild>
          <Link to={tenantCommercialHref(item.tenantId)}>
            {copy.actions.viewTenant}
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{copy.exceptions.columns.tenant}</TableHead>
              <TableHead>{copy.exceptions.columns.reason}</TableHead>
              <TableHead>{copy.exceptions.columns.amount}</TableHead>
              <TableHead>{copy.exceptions.columns.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.tenantId}>
                <TableCell>
                  <Link
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    to={tenantCommercialHref(item.tenantId)}
                  >
                    {item.tenantName}
                  </Link>
                  <div className="font-mono text-xs text-muted-foreground">
                    {item.subdomain}
                  </div>
                </TableCell>
                <TableCell>{copy.skipReasons[item.skipReason]}</TableCell>
                <TableCell className="tabular-nums">
                  {item.hasFrozenAmount
                    ? formatBillingPriceCents(item.estimatedTotalCents)
                    : "—"}
                </TableCell>
                <TableCell>{rowActions(item)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <li key={item.tenantId} className="rounded-lg border p-4 space-y-3">
            <div className="min-w-0">
              <Link
                className="font-medium text-primary underline-offset-2 hover:underline"
                to={tenantCommercialHref(item.tenantId)}
              >
                {item.tenantName}
              </Link>
              <div className="font-mono text-xs text-muted-foreground">
                {item.subdomain}
              </div>
            </div>
            <p className="text-sm">{copy.skipReasons[item.skipReason]}</p>
            <p className="tabular-nums text-sm">
              {item.hasFrozenAmount
                ? formatBillingPriceCents(item.estimatedTotalCents)
                : "—"}
            </p>
            {rowActions(item)}
          </li>
        ))}
      </ul>
    </>
  );
}

function arStatusBadgeVariant(
  status: PlatformSaasInvoiceStatusType,
): "warning" | "success" | "secondary" {
  if (status === "open") return "warning";
  if (status === "paid") return "success";
  return "secondary";
}

function resolveArView(
  statusParam: string,
  minOverdueParam: string,
  viewParam: string,
): ArView {
  // D4: `view=exceptions` is not a status filter. Bare URL still seeds Pendientes.
  if (viewParam === "exceptions") return "exceptions";
  if (viewParam === "all") return "all";
  const minOverdue = Number(minOverdueParam);
  if (Number.isFinite(minOverdue) && minOverdue >= 1) return "overdue";
  if (statusParam === "open") return "pending";
  if (!statusParam) return "all";
  return "all";
}

export function PlatformArLedgerPage() {
  const copy = platformCopy.ar;
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const stripeConfigured = isStripePublishableConfigured();
  const [stripeGatewayDown, setStripeGatewayDown] = useState(false);
  const canChargeStripe =
    canMutate && stripeConfigured && !stripeGatewayDown;
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status") || "";
  const periodKeyParam = searchParams.get("period_key") || "";
  const tenantIdParam = searchParams.get("tenant_id") || "";
  const minOverdueParam = searchParams.get("min_days_overdue") || "";
  const viewParam = searchParams.get("view") || "";
  const page = Math.max(1, Number(searchParams.get("page") || 1));

  // D2: bare entry → Pendientes (`status=open`).
  // Do NOT re-seed when the user chose Todos or Excepciones.
  useEffect(() => {
    const view = searchParams.get("view");
    if (view === "all" || view === "exceptions") return;
    const bareEntry =
      !searchParams.has("status") &&
      !searchParams.has("min_days_overdue") &&
      !searchParams.has("period_key") &&
      !searchParams.has("tenant_id") &&
      !searchParams.has("page") &&
      !searchParams.has("view");
    if (!bareEntry) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("status", "open");
        return next;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const activeView = resolveArView(statusParam, minOverdueParam, viewParam);
  const isExceptionsView = activeView === "exceptions";
  const closeRunPeriodKey = resolveClosedPeriodKeyForCloseRun(periodKeyParam);

  const queryParams = useMemo(
    () => ({
      page,
      pageSize: 25,
      status: (PLATFORM_SAAS_INVOICE_STATUS_VALUES as string[]).includes(
        statusParam,
      )
        ? (statusParam as PlatformSaasInvoiceStatusType)
        : undefined,
      periodKey: periodKeyParam || undefined,
      tenantId: tenantIdParam || undefined,
      minDaysOverdue: minOverdueParam
        ? Number(minOverdueParam)
        : undefined,
    }),
    [page, statusParam, periodKeyParam, tenantIdParam, minOverdueParam],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    usePlatformArList(queryParams);
  const viewCounts = usePlatformArViewCounts({
    periodKey: periodKeyParam || undefined,
    tenantId: tenantIdParam || undefined,
  });
  const closeRunQuery = usePlatformArCloseRun({
    periodKey: closeRunPeriodKey,
    include: "actionable",
    page: isExceptionsView ? page : 1,
    pageSize: 25,
  });
  const tenantToolbarCloseRun = usePlatformArCloseRun(
    {
      periodKey: closeRunPeriodKey,
      tenantId: tenantIdParam || undefined,
      include: "all",
      page: 1,
      pageSize: 1,
    },
    { enabled: Boolean(canMutate && tenantIdParam && !isExceptionsView) },
  );
  const chargeRunQuery = usePlatformArChargeRun({
    periodKey: periodKeyParam || undefined,
    tenantId: tenantIdParam || undefined,
    page: 1,
    pageSize: 25,
  });

  const chargeRun = chargeRunQuery.data?.data;
  const chargeAttempts = chargeRun?.latestAttempts ?? [];
  const chargeRunItems = chargeRun?.items ?? [];
  const chargeNeedsAttention = chargeRun
    ? chargeRunNeedsAttention(chargeRun.counts)
    : false;
  const closeRun = closeRunQuery.data?.data;
  const closeRunItems = closeRun?.items ?? [];
  const closeRunPagination = closeRunQuery.data?.pagination;
  const tenantToolbarItem =
    tenantToolbarCloseRun.data?.data.items[0] ?? null;
  const showToolbarIssue =
    canMutate &&
    Boolean(tenantIdParam) &&
    !isExceptionsView &&
    !tenantToolbarCloseRun.isLoading &&
    !tenantToolbarItem?.nonVoidInvoiceId &&
    Boolean(
      tenantToolbarItem?.canIssueOverride && tenantToolbarItem.hasFrozenAmount,
    );

  const invoiceRows = data?.data ?? [];
  const rows = isExceptionsView ? [] : invoiceRows;
  const pagination = isExceptionsView
    ? closeRunPagination
    : data?.pagination;
  const listItems = isExceptionsView ? closeRunItems : invoiceRows;
  const listLoading = isExceptionsView
    ? closeRunQuery.isLoading
    : isLoading;
  const listError = isExceptionsView ? closeRunQuery.isError : isError;

  const [issueTenantId, setIssueTenantId] = useState<string | null>(null);
  const [payRow, setPayRow] = useState<PlatformSaasArRow | null>(null);
  const [chargeRow, setChargeRow] = useState<PlatformSaasArRow | null>(null);
  const [voidRow, setVoidRow] = useState<PlatformSaasArRow | null>(null);
  const [issuingDraftId, setIssuingDraftId] = useState<string | null>(null);

  const issueDraftMutation = useIssueSaasInvoiceDraft({
    onSuccess: () => {
      toast({
        title: copy.actions.issueDraftSuccess,
        variant: "success",
      });
      setIssuingDraftId(null);
    },
    onError: (error) => {
      toast({
        title: copy.actions.issueDraftError,
        description: error.message,
        variant: "error",
      });
      setIssuingDraftId(null);
    },
  });

  const handleIssueDraft = (row: PlatformSaasArRow) => {
    setIssuingDraftId(row.id);
    void issueDraftMutation.mutateAsync({
      tenantId: row.tenantId,
      invoiceId: row.id,
    });
  };

  const setParam = (key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (!value) next.delete(key);
      else next.set(key, value);
      if (key !== "page") next.delete("page");
      return next;
    });
  };

  const setView = (view: ArView) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("page");
      if (view === "pending") {
        next.set("status", "open");
        next.delete("min_days_overdue");
        next.delete("view");
      } else if (view === "overdue") {
        next.set("status", "open");
        next.set("min_days_overdue", "1");
        next.delete("view");
      } else if (view === "exceptions") {
        next.delete("status");
        next.delete("min_days_overdue");
        next.set("view", "exceptions");
      } else {
        // Todos: sin filtro de estado; `view=all` evita que el seed
        // de Pendientes vuelva a forzar status=open.
        next.delete("status");
        next.delete("min_days_overdue");
        next.set("view", "all");
      }
      return next;
    });
  };

  return (
    <PlatformPageShell title={copy.title} description={copy.description}>
      {!canMutate ? (
        <AlertWithIcon
          className="mb-4"
          variant="info"
          title={copy.readOnlyAlert}
        />
      ) : null}

      {closeRunQuery.isLoading ? (
        <AlertWithIcon
          className="mb-4"
          variant="info"
          title={copy.closeRun.loading}
        />
      ) : closeRunQuery.isError ? (
        <AlertWithIcon
          className="mb-4"
          variant="warning"
          title={copy.closeRun.errorTitle}
        >
          {copy.closeRun.errorDescription}
        </AlertWithIcon>
      ) : closeRun ? (
        <AlertWithIcon
          className="mb-4"
          variant={
            !closeRun.run.ran
              ? "info"
              : closeRun.counts.actionable === 0
                ? "success"
                : "warning"
          }
          title={
            !closeRun.run.ran
              ? copy.closeRun.notYetTitle
              : closeRun.counts.actionable === 0
                ? copy.closeRun.zeroTitle
                : copy.closeRun.actionableTitle(closeRun.counts.actionable)
          }
        >
          <p>
            {!closeRun.run.ran
              ? copy.closeRun.notYetDescription
              : closeRun.counts.actionable === 0
                ? copy.closeRun.zeroDescription
                : isExceptionsView
                  ? copy.closeRun.actionableOnExceptions
                  : copy.closeRun.actionableDescription}
          </p>
          {closeRun.run.ran &&
          closeRun.counts.actionable > 0 &&
          !isExceptionsView ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setView("exceptions")}
            >
              {copy.closeRun.viewExceptions}
            </Button>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {[
              copy.closeRun.periodLabel(
                formatBillingPeriodKey(closeRun.periodKey),
              ),
              closeRun.run.ranAt
                ? copy.closeRun.ranAt(formatDateTime(closeRun.run.ranAt))
                : null,
              copy.closeRun.csvCaption,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </AlertWithIcon>
      ) : (
        <AlertWithIcon
          className="mb-4"
          variant="info"
          title={copy.closeHint}
        />
      )}

      {chargeRunQuery.isLoading ? (
        <AlertWithIcon
          className="mb-4"
          variant="info"
          title={copy.chargeRun.loading}
        />
      ) : chargeRunQuery.isError ? (
        <AlertWithIcon
          className="mb-4"
          variant="warning"
          title={copy.chargeRun.errorTitle}
        >
          {copy.chargeRun.errorDescription}
        </AlertWithIcon>
      ) : chargeRun ? (
        <AlertWithIcon
          className="mb-4"
          variant={
            !chargeRun.run.ran
              ? "info"
              : chargeNeedsAttention
                ? "warning"
                : "success"
          }
          title={
            !chargeRun.run.ran
              ? copy.chargeRun.notYetTitle
              : copy.chargeRun.ranTitle
          }
        >
          <p>
            {!chargeRun.run.ran
              ? copy.chargeRun.notYetDescription
              : chargeNeedsAttention
                ? isExceptionsView
                  ? copy.chargeRun.attentionDescription
                  : copy.chargeRun.attentionOnPending
                : copy.chargeRun.zeroDescription}
          </p>
          {chargeRun.run.ran ? (
            <p className="mt-1">{copy.chargeRun.countsLine(chargeRun.counts)}</p>
          ) : null}
          {chargeRun.run.ran && chargeNeedsAttention && !activeView.startsWith("pending") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => setView("pending")}
            >
              {copy.chargeRun.viewPending}
            </Button>
          ) : null}
          {chargeRun.run.ranAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {copy.chargeRun.ranAt(formatDateTime(chargeRun.run.ranAt))}
            </p>
          ) : null}
        </AlertWithIcon>
      ) : null}

      <ListPageShell
        title={copy.title}
        showHeader={false}
        entityLabelPlural={
          isExceptionsView ? copy.views.exceptions : copy.entityLabelPlural
        }
        items={listItems}
        isLoading={listLoading}
        pagination={
          pagination
            ? {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages,
              }
            : undefined
        }
        onPageChange={(nextPage) => setParam("page", String(nextPage))}
        toolbar={{
          extraActions: showToolbarIssue ? (
              <Button
                size="sm"
                variant="default"
                onClick={() => setIssueTenantId(tenantIdParam)}
              >
                {copy.actions.issue}
              </Button>
            ) : undefined,
          filters: (
            <div className="flex w-full min-w-0 flex-col gap-3">
              <div
                className="flex flex-wrap gap-1"
                role="group"
                aria-label={copy.views.ariaLabel}
              >
                {(
                  [
                    ["pending", copy.views.pending, viewCounts.pending],
                    ["overdue", copy.views.overdue, viewCounts.overdue],
                    ["all", copy.views.all, viewCounts.all],
                    [
                      "exceptions",
                      copy.views.exceptions,
                      closeRun?.run.ran
                        ? closeRun.counts.actionable
                        : undefined,
                    ],
                  ] as const
                ).map(([view, label, count]) => {
                  const exceptionsNeedAttention =
                    view === "exceptions" &&
                    typeof count === "number" &&
                    count > 0;
                  return (
                  <Button
                    key={view}
                    type="button"
                    size="sm"
                    variant={
                      exceptionsNeedAttention
                        ? "warning"
                        : activeView === view
                          ? "default"
                          : "outline"
                    }
                    className={cn(activeView === view && "pointer-events-none")}
                    aria-pressed={activeView === view}
                    aria-label={
                      count == null
                        ? label
                        : copy.views.chipAria(label, count)
                    }
                    onClick={() => setView(view)}
                  >
                    {count == null
                      ? label
                      : copy.views.chipWithCount(label, count)}
                  </Button>
                  );
                })}
              </div>
              <div className="flex w-full min-w-0 flex-wrap items-end gap-3">
                <div className="flex min-w-[12rem] flex-col gap-1.5">
                  <Label htmlFor="ar-period-key">{copy.filters.periodKey}</Label>
                  <MonthField
                    id="ar-period-key"
                    className="h-9 w-[12rem]"
                    placeholder={copy.filters.periodKeyPlaceholder}
                    value={periodKeyParam}
                    onChange={(next) => setParam("period_key", next)}
                    clearable
                  />
                </div>
                <div className="flex min-w-[13.75rem] flex-col gap-1.5">
                  <Label htmlFor="ar-tenant-filter">{copy.filters.tenant}</Label>
                  <ArTenantFilter
                    id="ar-tenant-filter"
                    value={tenantIdParam}
                    onChange={(id) => setParam("tenant_id", id)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="ml-auto h-9 w-9 shrink-0"
                  onClick={() => {
                    void Promise.all([
                      refetch(),
                      viewCounts.refetch(),
                      closeRunQuery.refetch(),
                      chargeRunQuery.refetch(),
                    ]).then(() =>
                      toast({ title: copy.refreshToast, variant: "success" }),
                    );
                  }}
                  disabled={
                    isFetching ||
                    closeRunQuery.isFetching ||
                    chargeRunQuery.isFetching
                  }
                  aria-label={copy.refreshAria}
                >
                  <RefreshCw
                    className={cn(
                      "h-4 w-4",
                      (isFetching ||
                        closeRunQuery.isFetching ||
                        chargeRunQuery.isFetching) &&
                        "animate-spin",
                    )}
                  />
                </Button>
              </div>
            </div>
          ),
        }}
        emptyState={{
          icon: <Wallet className="h-10 w-10" />,
          title: listError
            ? copy.error.title
            : isExceptionsView
              ? !closeRun?.run.ran
                ? copy.exceptions.emptyNotRanTitle
                : closeRun.counts.actionable === 0
                  ? copy.exceptions.emptyZeroTitle
                  : copy.exceptions.emptyTitle
              : copy.empty.title,
          description: listError
            ? copy.error.description
            : isExceptionsView
              ? !closeRun?.run.ran
                ? copy.exceptions.emptyNotRanDescription
                : closeRun.counts.actionable === 0
                  ? copy.exceptions.emptyZeroDescription
                  : copy.exceptions.emptyDescription
              : copy.empty.description,
        }}
        renderTable={() =>
          isExceptionsView ? (
            <ExceptionsTable
              items={closeRunItems}
              canMutate={canMutate}
              onIssue={(item) => setIssueTenantId(item.tenantId)}
            />
          ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{copy.columns.tenant}</TableHead>
                    <TableHead>{copy.columns.period}</TableHead>
                    <TableHead>{copy.columns.status}</TableHead>
                    <TableHead>{copy.columns.total}</TableHead>
                    <TableHead>{copy.columns.dueAndOverdue}</TableHead>
                    {canMutate ? (
                      <TableHead>{copy.columns.actions}</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const isOverdue =
                      row.status === "open" && row.daysOverdue > 0;
                    return (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Link
                            className="font-medium text-primary underline-offset-2 hover:underline"
                            to={tenantCommercialHref(row.tenantId)}
                          >
                            {row.tenantName}
                          </Link>
                          <div className="font-mono text-xs text-muted-foreground">
                            {row.subdomain}
                          </div>
                        </TableCell>
                        <TableCell>
                          {formatBillingPeriodKey(row.periodKey)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Badge
                              tone="soft"
                              variant={arStatusBadgeVariant(row.status)}
                            >
                              {copy.status[row.status]}
                            </Badge>
                            <SaasInvoiceOriginBadge origin={row.origin} />
                            <SaasAutoChargeChip
                              kind={resolveAutoChargeChip({
                                invoiceId: row.id,
                                latestAttempts: chargeAttempts,
                                runItems: chargeRunItems,
                              })}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatBillingPriceCents(row.totalCents)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="tabular-nums">
                              {row.dueDate ? formatDate(row.dueDate) : "—"}
                            </span>
                            {isOverdue ? (
                              <Badge
                                tone="soft"
                                variant="warning"
                                className="w-fit"
                              >
                                {copy.card.daysOverdue(row.daysOverdue)}
                              </Badge>
                            ) : null}
                          </div>
                        </TableCell>
                        {canMutate ? (
                        <TableCell>
                          {row.status === "draft" ? (
                            <PlatformArRowActions
                              variant="buttons"
                              isDraft
                              onIssueDraft={() => handleIssueDraft(row)}
                              issueDraftPending={
                                issuingDraftId === row.id &&
                                issueDraftMutation.isPending
                              }
                            />
                          ) : row.status === "open" ? (
                            <PlatformArRowActions
                              variant="buttons"
                              canChargeStripe={canChargeStripe}
                              onCharge={() => setChargeRow(row)}
                              onMarkPaid={() => setPayRow(row)}
                              onVoid={() => setVoidRow(row)}
                            />
                          ) : null}
                        </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <ul className="space-y-3 md:hidden">
              {rows.map((row) => {
                const isOverdue =
                  row.status === "open" && row.daysOverdue > 0;
                return (
                  <li
                    key={row.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          className="font-medium text-primary underline-offset-2 hover:underline"
                          to={tenantCommercialHref(row.tenantId)}
                        >
                          {row.tenantName}
                        </Link>
                        <div className="font-mono text-xs text-muted-foreground">
                          {row.subdomain}
                        </div>
                      </div>
                      <span className="shrink-0 tabular-nums font-medium">
                        {formatBillingPriceCents(row.totalCents)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm">
                        {formatBillingPeriodKey(row.periodKey)}
                      </span>
                      <Badge
                        tone="soft"
                        variant={arStatusBadgeVariant(row.status)}
                      >
                        {copy.status[row.status]}
                      </Badge>
                      <SaasInvoiceOriginBadge origin={row.origin} />
                      <SaasAutoChargeChip
                        kind={resolveAutoChargeChip({
                          invoiceId: row.id,
                          latestAttempts: chargeAttempts,
                          runItems: chargeRunItems,
                        })}
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {row.dueDate ? formatDate(row.dueDate) : "—"}
                      </span>
                      {isOverdue ? (
                        <Badge tone="soft" variant="warning" className="w-fit">
                          {copy.card.daysOverdue(row.daysOverdue)}
                        </Badge>
                      ) : null}
                    </div>
                    {canMutate && row.status === "draft" ? (
                      <PlatformArRowActions
                        isDraft
                        onIssueDraft={() => handleIssueDraft(row)}
                        issueDraftPending={
                          issuingDraftId === row.id &&
                          issueDraftMutation.isPending
                        }
                      />
                    ) : canMutate && row.status === "open" ? (
                      <PlatformArRowActions
                        canChargeStripe={canChargeStripe}
                        onCharge={() => setChargeRow(row)}
                        onMarkPaid={() => setPayRow(row)}
                        onVoid={() => setVoidRow(row)}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      />

      {canMutate && issueTenantId ? (
        <IssueSaasInvoiceSheet
          tenantId={issueTenantId}
          open
          onOpenChange={(open) => {
            if (!open) setIssueTenantId(null);
          }}
          defaultPeriodKey={closeRunPeriodKey}
        />
      ) : null}
      <MarkSaasInvoicePaidSheet
        invoice={payRow}
        open={!!payRow}
        onOpenChange={(open) => {
          if (!open) setPayRow(null);
        }}
      />
      <ChargeSaasInvoiceStripeSheet
        invoice={chargeRow}
        open={!!chargeRow}
        onOpenChange={(open) => {
          if (!open) setChargeRow(null);
        }}
        onGatewayUnavailable={() => setStripeGatewayDown(true)}
      />
      <VoidSaasInvoiceDialog
        invoice={voidRow}
        open={!!voidRow}
        onOpenChange={(open) => {
          if (!open) setVoidRow(null);
        }}
      />
    </PlatformPageShell>
  );
}
