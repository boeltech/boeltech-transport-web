import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useToast } from "@shared/hooks";
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
import { formatBillingPeriodKey } from "../utils/platformBillingFormatters";
import { resolveClosedPeriodKeyForCloseRun } from "../utils/billingPeriod";
import { OpsIssueSaasInvoiceSheet } from "./OpsIssueSaasInvoiceSheet";
import { OpsMarkSaasInvoicePaidSheet } from "./OpsMarkSaasInvoicePaidSheet";
import { OpsChargeSaasInvoiceStripeSheet } from "./OpsChargeSaasInvoiceStripeSheet";
import { OpsVoidSaasInvoiceDialog } from "./OpsVoidSaasInvoiceDialog";
import {
  chargeRunNeedsAttention,
  resolveAutoChargeChip,
} from "../utils/autoChargeChip";
import { opsCopy } from "./opsCopy";
import { OpsArFilters } from "./OpsArFilters";
import { OpsArRowActions } from "./OpsArRowActions";
import { sumOpenArAging } from "./opsArAging";
import { OpsCollectionsBand } from "./patterns/OpsCollectionsBand";
import {
  OpsArStatusCluster,
  OpsMoneyAmount,
  OpsMoneyTable,
  OpsMoneyTableBody,
  OpsMoneyTableCell,
  OpsMoneyTableHead,
  OpsMoneyTableHeader,
  OpsMoneyTableRow,
} from "./patterns/OpsMoneyTable";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import { OpsTableSkeleton } from "./patterns/OpsTableSkeleton";
import { OpsBadge } from "./ui/OpsBadge";
import { OpsButton } from "./ui/OpsButton";
import { OpsPanel, OpsPanelBody } from "./ui/OpsPanel";

type ArView = "pending" | "overdue" | "all" | "exceptions";

function tenantHubHref(tenantId: string) {
  return `/platform/tenants/${tenantId}?tab=cobranza`;
}

function resolveArView(
  statusParam: string,
  minOverdueParam: string,
  viewParam: string,
): ArView {
  if (viewParam === "exceptions") return "exceptions";
  if (viewParam === "all") return "all";
  const minOverdue = Number(minOverdueParam);
  if (Number.isFinite(minOverdue) && minOverdue >= 1) return "overdue";
  if (statusParam === "open") return "pending";
  if (!statusParam) return "all";
  return "all";
}

function OpsBanner({
  tone,
  title,
  children,
  action,
}: {
  tone: "info" | "warn";
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <OpsPanel
      className={tone === "warn" ? "ops-bg-warn-soft" : undefined}
      data-ops-tick={tone === "warn" ? "warn" : undefined}
      data-testid="ops-ar-banner"
    >
      <OpsPanelBody className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium ops-text">{title}</p>
          {children}
        </div>
        {action}
      </OpsPanelBody>
    </OpsPanel>
  );
}

function ExceptionsMoneyTable({
  items,
  canMutate,
  onIssue,
}: {
  items: PlatformCloseRunItem[];
  canMutate: boolean;
  onIssue: (item: PlatformCloseRunItem) => void;
}) {
  const copy = platformCopy.ar;
  return (
    <OpsMoneyTable>
      <OpsMoneyTableHeader>
        <OpsMoneyTableRow>
          <OpsMoneyTableHead>{copy.exceptions.columns.tenant}</OpsMoneyTableHead>
          <OpsMoneyTableHead>{copy.exceptions.columns.reason}</OpsMoneyTableHead>
          <OpsMoneyTableHead>{copy.exceptions.columns.amount}</OpsMoneyTableHead>
          <OpsMoneyTableHead>
            {copy.exceptions.columns.actions}
          </OpsMoneyTableHead>
        </OpsMoneyTableRow>
      </OpsMoneyTableHeader>
      <OpsMoneyTableBody>
        {items.map((item) => (
          <OpsMoneyTableRow key={item.tenantId}>
            <OpsMoneyTableCell>
              <Link
                className="font-medium underline-offset-2 hover:underline ops-text-accent"
                to={tenantHubHref(item.tenantId)}
              >
                {item.tenantName}
              </Link>
              <div className="ops-font-mono text-[11px] ops-text-muted">
                {item.subdomain}
              </div>
            </OpsMoneyTableCell>
            <OpsMoneyTableCell>
              {copy.skipReasons[item.skipReason]}
            </OpsMoneyTableCell>
            <OpsMoneyTableCell>
              {item.hasFrozenAmount ? (
                <OpsMoneyAmount cents={item.estimatedTotalCents} />
              ) : (
                <span className="ops-text-muted">—</span>
              )}
            </OpsMoneyTableCell>
            <OpsMoneyTableCell>
              <div className="flex flex-wrap gap-1">
                {canMutate &&
                item.canIssueOverride &&
                item.hasFrozenAmount ? (
                  <OpsButton
                    size="sm"
                    variant="primary"
                    onClick={() => onIssue(item)}
                  >
                    {copy.actions.issue}
                  </OpsButton>
                ) : null}
                <OpsButton size="sm" variant="ghost" asChild>
                  <Link to={tenantHubHref(item.tenantId)}>
                    {copy.actions.viewTenant}
                  </Link>
                </OpsButton>
              </div>
            </OpsMoneyTableCell>
          </OpsMoneyTableRow>
        ))}
      </OpsMoneyTableBody>
    </OpsMoneyTable>
  );
}

/**
 * Workbench Cobranza `/platform/billing/ar` (flag ON) — piel Money + OpsBadge.
 */
export function PlatformArWorkbenchPage() {
  const copy = platformCopy.ar;
  const page = opsCopy.ar;
  const { toast } = useToast();
  const { user } = usePlatformAuth();
  const canMutate = isPlatformOwner(user?.platformRole);
  const stripeConfigured = isStripePublishableConfigured();
  const [stripeGatewayDown, setStripeGatewayDown] = useState(false);
  const canChargeStripe = canMutate && stripeConfigured && !stripeGatewayDown;
  const [searchParams, setSearchParams] = useSearchParams();

  const statusParam = searchParams.get("status") || "";
  const periodKeyParam = searchParams.get("period_key") || "";
  const tenantIdParam = searchParams.get("tenant_id") || "";
  const minOverdueParam = searchParams.get("min_days_overdue") || "";
  const viewParam = searchParams.get("view") || "";
  const pageNum = Math.max(1, Number(searchParams.get("page") || 1));

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
      page: pageNum,
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
    [pageNum, statusParam, periodKeyParam, tenantIdParam, minOverdueParam],
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
    page: isExceptionsView ? pageNum : 1,
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
  const aging = sumOpenArAging(rows);
  const showAging = aging.currentCents > 0 || aging.overdueCents > 0;
  const pagination = isExceptionsView
    ? closeRunPagination
    : data?.pagination;
  const listLoading = isExceptionsView
    ? closeRunQuery.isLoading
    : isLoading;
  const listError = isExceptionsView ? closeRunQuery.isError : isError;
  const listEmpty = isExceptionsView
    ? closeRunItems.length === 0
    : rows.length === 0;

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
        next.delete("status");
        next.delete("min_days_overdue");
        next.set("view", "all");
      }
      return next;
    });
  };

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

  const emptyTitle = listError
    ? copy.error.title
    : isExceptionsView
      ? !closeRun?.run.ran
        ? copy.exceptions.emptyNotRanTitle
        : closeRun.counts.actionable === 0
          ? copy.exceptions.emptyZeroTitle
          : copy.exceptions.emptyTitle
      : copy.empty.title;
  const emptyDescription = listError
    ? copy.error.description
    : isExceptionsView
      ? !closeRun?.run.ran
        ? copy.exceptions.emptyNotRanDescription
        : closeRun.counts.actionable === 0
          ? copy.exceptions.emptyZeroDescription
          : copy.exceptions.emptyDescription
      : copy.empty.description;

  return (
    <div className="space-y-3" data-testid="ops-ar-workbench">
      <header className="space-y-1">
        <h1 className="ops-type-h2 ops-text m-0 tracking-tight">
          {page.title}
        </h1>
        <p className="ops-type-caption ops-text-muted">{page.description}</p>
        <OpsBadge tone="accent">{page.saasBanner}</OpsBadge>
      </header>

      {!canMutate ? (
        <OpsBanner tone="info" title={copy.readOnlyAlert} />
      ) : null}

      {closeRunQuery.isLoading ? (
        <OpsBanner tone="info" title={copy.closeRun.loading} />
      ) : closeRunQuery.isError ? (
        <OpsBanner tone="warn" title={copy.closeRun.errorTitle}>
          <p className="text-xs ops-text-muted">
            {copy.closeRun.errorDescription}
          </p>
        </OpsBanner>
      ) : closeRun ? (
        <OpsBanner
          tone={
            !closeRun.run.ran || closeRun.counts.actionable === 0
              ? "info"
              : "warn"
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
              <OpsButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setView("exceptions")}
              >
                {copy.closeRun.viewExceptions}
              </OpsButton>
            ) : undefined
          }
        >
          <p className="text-xs ops-text-muted">
            {!closeRun.run.ran
              ? copy.closeRun.notYetDescription
              : closeRun.counts.actionable === 0
                ? copy.closeRun.zeroDescription
                : isExceptionsView
                  ? copy.closeRun.actionableOnExceptions
                  : copy.closeRun.actionableDescription}
          </p>
          {closeRunMeta ? (
            <p className="mt-1 text-[11px] ops-text-muted">{closeRunMeta}</p>
          ) : null}
        </OpsBanner>
      ) : null}

      {chargeRunQuery.isLoading ? (
        <OpsBanner tone="info" title={copy.chargeRun.loading} />
      ) : chargeRunQuery.isError ? (
        <OpsBanner tone="warn" title={copy.chargeRun.errorTitle}>
          <p className="text-xs ops-text-muted">
            {copy.chargeRun.errorDescription}
          </p>
        </OpsBanner>
      ) : chargeRun ? (
        <OpsBanner
          tone={
            !chargeRun.run.ran || !chargeNeedsAttention ? "info" : "warn"
          }
          title={
            !chargeRun.run.ran
              ? page.chargeNotYetTitle
              : copy.chargeRun.ranTitle
          }
          action={
            chargeRun.run.ran &&
            chargeNeedsAttention &&
            activeView !== "pending" ? (
              <OpsButton
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setView("pending")}
              >
                {copy.chargeRun.viewPending}
              </OpsButton>
            ) : undefined
          }
        >
          <p className="text-xs ops-text-muted">
            {!chargeRun.run.ran
              ? page.chargeNotYetDescription
              : chargeNeedsAttention
                ? isExceptionsView
                  ? copy.chargeRun.attentionDescription
                  : copy.chargeRun.attentionOnPending
                : copy.chargeRun.zeroDescription}
          </p>
          {chargeRun.run.ran ? (
            <p className="mt-1 text-xs ops-text">
              {copy.chargeRun.countsLine(chargeRun.counts)}
            </p>
          ) : null}
          {chargeRun.run.ranAt ? (
            <p className="mt-1 text-[11px] ops-text-muted">
              {copy.chargeRun.ranAt(formatDateTime(chargeRun.run.ranAt))}
            </p>
          ) : null}
        </OpsBanner>
      ) : null}

      <div className="ops-money-toolbar">
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
            const active = activeView === view;
            const exceptionsNeedAttention =
              view === "exceptions" &&
              typeof count === "number" &&
              count > 0;
            return (
              <button
                key={view}
                type="button"
                className="ops-chip"
                data-active={active}
                aria-pressed={active}
                onClick={() => setView(view)}
              >
                {count == null
                  ? label
                  : copy.views.chipWithCount(label, count)}
                {exceptionsNeedAttention ? (
                  <OpsBadge tone="warn">!</OpsBadge>
                ) : null}
              </button>
            );
          })}
        </div>
        <OpsArFilters
          periodKey={periodKeyParam}
          tenantId={tenantIdParam}
          onPeriodKeyChange={(next) => setParam("period_key", next)}
          onTenantIdChange={(id) => setParam("tenant_id", id)}
        />
        <div className="ml-auto flex flex-wrap gap-1">
          {showToolbarIssue ? (
            <OpsButton
              size="sm"
              variant="primary"
              onClick={() => setIssueTenantId(tenantIdParam)}
            >
              {copy.actions.issue}
            </OpsButton>
          ) : null}
          <OpsButton
            size="sm"
            variant="ghost"
            disabled={
              isFetching ||
              closeRunQuery.isFetching ||
              chargeRunQuery.isFetching
            }
            onClick={handleRefresh}
            aria-label={copy.refreshAria}
          >
            Actualizar
          </OpsButton>
        </div>
      </div>

      {(periodKeyParam || tenantIdParam) && (
        <div className="flex flex-wrap gap-1.5">
          {periodKeyParam ? (
            <OpsBadge tone="muted">
              {copy.filters.periodChip(
                formatBillingPeriodKey(periodKeyParam),
              )}
              <button
                type="button"
                className="ml-1 opacity-70 hover:opacity-100"
                aria-label="Quitar mes"
                onClick={() => setParam("period_key", "")}
              >
                ×
              </button>
            </OpsBadge>
          ) : null}
          {tenantIdParam ? (
            <OpsBadge tone="muted">
              {copy.filters.tenantChip(tenantIdParam.slice(0, 8))}
              <button
                type="button"
                className="ml-1 opacity-70 hover:opacity-100"
                aria-label={copy.filters.tenantClear}
                onClick={() => setParam("tenant_id", "")}
              >
                ×
              </button>
            </OpsBadge>
          ) : null}
        </div>
      )}

      {listLoading ? (
        <OpsTableSkeleton />
      ) : listEmpty ? (
        <OpsEmptyState
          variant={listError ? "error" : "empty"}
          title={emptyTitle}
          description={emptyDescription}
          action={
            listError ? (
              <OpsButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (isExceptionsView) {
                    void closeRunQuery.refetch();
                  } else {
                    void refetch();
                  }
                }}
              >
                Reintentar
              </OpsButton>
            ) : undefined
          }
        />
      ) : isExceptionsView ? (
        <ExceptionsMoneyTable
          items={closeRunItems}
          canMutate={canMutate}
          onIssue={(item) => setIssueTenantId(item.tenantId)}
        />
      ) : (
        <div className="space-y-3">
          {showAging ? (
            <div className="space-y-1">
              {pagination && pagination.totalPages > 1 ? (
                <p className="ops-type-caption ops-text-muted">{page.agingPage}</p>
              ) : null}
              <OpsCollectionsBand
                buckets={[
                  {
                    id: "current",
                    label: page.agingCurrent,
                    cents: aging.currentCents,
                  },
                  {
                    id: "overdue",
                    label: copy.views.overdue,
                    cents: aging.overdueCents,
                    overdue: aging.overdueCents > 0,
                  },
                ]}
                action={
                  aging.overdueCents > 0 && activeView !== "overdue" ? (
                    <OpsButton
                      variant="ghost"
                      size="sm"
                      onClick={() => setView("overdue")}
                    >
                      {copy.views.overdue}
                    </OpsButton>
                  ) : undefined
                }
              />
            </div>
          ) : null}
        <OpsMoneyTable>
          <OpsMoneyTableHeader>
            <OpsMoneyTableRow>
              <OpsMoneyTableHead>{copy.columns.tenant}</OpsMoneyTableHead>
              <OpsMoneyTableHead>{copy.columns.period}</OpsMoneyTableHead>
              <OpsMoneyTableHead>{copy.columns.status}</OpsMoneyTableHead>
              <OpsMoneyTableHead>{copy.columns.total}</OpsMoneyTableHead>
              <OpsMoneyTableHead>
                {copy.columns.dueAndOverdue}
              </OpsMoneyTableHead>
              {canMutate ? (
                <OpsMoneyTableHead>{copy.columns.actions}</OpsMoneyTableHead>
              ) : null}
            </OpsMoneyTableRow>
          </OpsMoneyTableHeader>
          <OpsMoneyTableBody>
            {rows.map((row) => {
              const isOverdue = row.status === "open" && row.daysOverdue > 0;
              return (
                <OpsMoneyTableRow
                  key={row.id}
                  data-ops-tick={isOverdue ? "warn" : undefined}
                >
                  <OpsMoneyTableCell>
                    <Link
                      className="font-medium underline-offset-2 hover:underline ops-text-accent"
                      to={tenantHubHref(row.tenantId)}
                    >
                      {row.tenantName}
                    </Link>
                    <div className="ops-font-mono text-[11px] ops-text-muted">
                      {row.subdomain}
                    </div>
                  </OpsMoneyTableCell>
                  <OpsMoneyTableCell>
                    {formatBillingPeriodKey(row.periodKey)}
                  </OpsMoneyTableCell>
                  <OpsMoneyTableCell>
                    <OpsArStatusCluster
                      status={row.status}
                      origin={row.origin}
                      chargeKind={resolveAutoChargeChip({
                        invoiceId: row.id,
                        latestAttempts: chargeAttempts,
                        runItems: chargeRunItems,
                      })}
                    />
                  </OpsMoneyTableCell>
                  <OpsMoneyTableCell>
                    <OpsMoneyAmount cents={row.totalCents} />
                  </OpsMoneyTableCell>
                  <OpsMoneyTableCell className="ops-font-mono tabular-nums">
                    {row.dueDate ? formatDate(row.dueDate) : "—"}
                  </OpsMoneyTableCell>
                  {canMutate ? (
                    <OpsMoneyTableCell>
                      {row.status === "draft" ? (
                        <OpsArRowActions
                          isDraft
                          onIssueDraft={() => handleIssueDraft(row)}
                          issueDraftPending={
                            issuingDraftId === row.id &&
                            issueDraftMutation.isPending
                          }
                        />
                      ) : row.status === "open" ? (
                        <OpsArRowActions
                          canChargeStripe={canChargeStripe}
                          onCharge={() => setChargeRow(row)}
                          onMarkPaid={() => setPayRow(row)}
                          onVoid={() => setVoidRow(row)}
                        />
                      ) : null}
                    </OpsMoneyTableCell>
                  ) : null}
                </OpsMoneyTableRow>
              );
            })}
          </OpsMoneyTableBody>
        </OpsMoneyTable>
        </div>
      )}

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-2 text-xs ops-text-muted">
          <span>
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <div className="flex gap-1">
            <OpsButton
              size="sm"
              variant="ghost"
              disabled={pagination.page <= 1}
              onClick={() => setParam("page", String(pagination.page - 1))}
            >
              Anterior
            </OpsButton>
            <OpsButton
              size="sm"
              variant="ghost"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setParam("page", String(pagination.page + 1))}
            >
              Siguiente
            </OpsButton>
          </div>
        </div>
      ) : null}

      {canMutate && issueTenantId ? (
        <OpsIssueSaasInvoiceSheet
          tenantId={issueTenantId}
          open
          onOpenChange={(open) => {
            if (!open) setIssueTenantId(null);
          }}
          defaultPeriodKey={closeRunPeriodKey}
        />
      ) : null}
      <OpsMarkSaasInvoicePaidSheet
        invoice={payRow}
        open={!!payRow}
        onOpenChange={(open) => {
          if (!open) setPayRow(null);
        }}
      />
      <OpsChargeSaasInvoiceStripeSheet
        invoice={chargeRow}
        open={!!chargeRow}
        onOpenChange={(open) => {
          if (!open) setChargeRow(null);
        }}
        onGatewayUnavailable={() => setStripeGatewayDown(true)}
      />
      <OpsVoidSaasInvoiceDialog
        invoice={voidRow}
        open={!!voidRow}
        onOpenChange={(open) => {
          if (!open) setVoidRow(null);
        }}
      />
    </div>
  );
}
