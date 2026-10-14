import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  Info,
  Wallet,
} from "lucide-react";
import { PlatformPageShell } from "../layout/PlatformPageShell";
import { ListPageShell } from "@shared/ui/page-shells/ListPageShell";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  DetailAlertCard,
  type DetailAlertSeverity,
} from "@shared/ui/data-display";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";
import type { ActiveFilterChip } from "@shared/ui/listing";
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
import { PlatformArListFilters } from "../components/PlatformArListFilters";
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

function ArJobBanner({
  severity,
  title,
  children,
  action,
}: {
  severity: DetailAlertSeverity;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  const icon =
    severity === "critical" ? (
      <AlertCircle className="h-5 w-5" aria-hidden />
    ) : severity === "warning" ? (
      <AlertTriangle className="h-5 w-5" aria-hidden />
    ) : (
      <Info className="h-5 w-5" aria-hidden />
    );
  return (
    <DetailAlertCard
      className="mb-4"
      severity={severity}
      icon={icon}
      title={title}
      action={action}
    >
      {children}
    </DetailAlertCard>
  );
}

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

  const activePanelFilterCount =
    Number(!!periodKeyParam) + Number(!!tenantIdParam);
  const hasPanelFilters = activePanelFilterCount > 0;

  const tenantChipLabel = (() => {
    if (!tenantIdParam) return "";
    const fromInvoice = invoiceRows.find(
      (row) => row.tenantId === tenantIdParam,
    );
    if (fromInvoice) return fromInvoice.tenantName;
    const fromException = closeRunItems.find(
      (item) => item.tenantId === tenantIdParam,
    );
    if (fromException) return fromException.tenantName;
    return tenantIdParam.slice(0, 8);
  })();

  const activeFilterChips: ActiveFilterChip[] = [];
  if (periodKeyParam) {
    activeFilterChips.push({
      id: "period",
      label: copy.filters.periodChip(formatBillingPeriodKey(periodKeyParam)),
      onRemove: () => setParam("period_key", ""),
    });
  }
  if (tenantIdParam) {
    activeFilterChips.push({
      id: "tenant",
      label: copy.filters.tenantChip(tenantChipLabel),
      onRemove: () => setParam("tenant_id", ""),
    });
  }

  const handleRefresh = () => {
    void Promise.all([
      refetch(),
      viewCounts.refetch(),
      closeRunQuery.refetch(),
      chargeRunQuery.refetch(),
    ]).then(() => toast({ title: copy.refreshToast, variant: "success" }));
  };

  const closeRunMeta = closeRun
    ? [
        copy.closeRun.periodLabel(
          formatBillingPeriodKey(closeRun.periodKey),
        ),
        closeRun.run.ranAt
          ? copy.closeRun.ranAt(formatDateTime(closeRun.run.ranAt))
          : null,
        copy.closeRun.csvCaption,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

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
        <ArJobBanner severity="info" title={copy.closeRun.loading} />
      ) : closeRunQuery.isError ? (
        <ArJobBanner severity="warning" title={copy.closeRun.errorTitle}>
          <p>{copy.closeRun.errorDescription}</p>
        </ArJobBanner>
      ) : closeRun ? (
        <ArJobBanner
          severity={
            !closeRun.run.ran
              ? "info"
              : closeRun.counts.actionable === 0
                ? "info"
                : "warning"
          }
          title={
            !closeRun.run.ran
              ? copy.closeRun.notYetTitle
              : closeRun.counts.actionable === 0
                ? copy.closeRun.zeroTitle
                : copy.closeRun.actionableTitle(closeRun.counts.actionable)
          }
          action={
            closeRun.run.ran &&
            closeRun.counts.actionable > 0 &&
            !isExceptionsView ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setView("exceptions")}
              >
                {copy.closeRun.viewExceptions}
              </Button>
            ) : undefined
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
          {closeRunMeta ? (
            <p className="mt-1 text-xs text-muted-foreground">{closeRunMeta}</p>
          ) : null}
        </ArJobBanner>
      ) : (
        <ArJobBanner severity="info" title={copy.closeHint} />
      )}

      {chargeRunQuery.isLoading ? (
        <ArJobBanner severity="info" title={copy.chargeRun.loading} />
      ) : chargeRunQuery.isError ? (
        <ArJobBanner severity="warning" title={copy.chargeRun.errorTitle}>
          <p>{copy.chargeRun.errorDescription}</p>
        </ArJobBanner>
      ) : chargeRun ? (
        <ArJobBanner
          severity={
            !chargeRun.run.ran
              ? "info"
              : chargeNeedsAttention
                ? "warning"
                : "info"
          }
          title={
            !chargeRun.run.ran
              ? copy.chargeRun.notYetTitle
              : copy.chargeRun.ranTitle
          }
          action={
            chargeRun.run.ran &&
            chargeNeedsAttention &&
            activeView !== "pending" ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setView("pending")}
              >
                {copy.chargeRun.viewPending}
              </Button>
            ) : undefined
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
          {chargeRun.run.ranAt ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {copy.chargeRun.ranAt(formatDateTime(chargeRun.run.ranAt))}
            </p>
          ) : null}
        </ArJobBanner>
      ) : null}

      <ListPageShell<PlatformCloseRunItem | PlatformSaasArRow>
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
            <>
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
                      className={cn(
                        activeView === view && "pointer-events-none",
                      )}
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
              <PlatformArListFilters
                key={hasPanelFilters ? "filters-active" : "filters-idle"}
                periodKey={periodKeyParam}
                tenantId={tenantIdParam}
                activePanelFilterCount={activePanelFilterCount}
                onPeriodKeyChange={(next) => setParam("period_key", next)}
                onTenantIdChange={(id) => setParam("tenant_id", id)}
              />
            </>
          ),
          onRefresh: handleRefresh,
          isRefreshing:
            isFetching ||
            closeRunQuery.isFetching ||
            chargeRunQuery.isFetching,
          activeFilterChips,
          hasFilters: hasPanelFilters,
          onClearFilters: () => {
            setSearchParams((prev) => {
              const next = new URLSearchParams(prev);
              next.delete("period_key");
              next.delete("tenant_id");
              next.delete("page");
              return next;
            });
          },
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
