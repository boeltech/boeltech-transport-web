import { useMemo } from "react";
import { AlertCircle, Download } from "lucide-react";
import { useAuth } from "@features/auth";
import { ROLES } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";
import { useDispatchDocuments } from "@features/invoicing/application";
import { useInvoiceableWorkbenchSummary } from "@features/trips/application";
import {
  buildFinanceAnalysisHref,
  useAccountStatement,
  useAgingByClient,
  useAgingSummary,
  useFinanceSummary,
  useMonthlyPerformance,
  useOpenPpdSummary,
  useOperationalCashPending,
} from "@features/finance/application";
import {
  FinanceAccountStatementSection,
  FinanceAgingChart,
  FinanceCycleStepper,
  FinanceMonthPanel,
  FinanceReceivableKpis,
} from "../components";
import { financeCopy } from "../copy";
import { buildFinanceCycleSteps } from "../utils/financeHubNav";
import { exportAgingByClientCsv } from "../utils/financeExportHelpers";
import {
  FINANCE_PULSE_PERFORMANCE_MONTHS,
  resolveFinancePulseMonth,
} from "../utils/financePulse";
import { formatPerformanceMonth } from "../utils/monthlyPerformanceFormat";

function HubQueryError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  return (
    <DetailAlertCard
      severity="critical"
      icon={<AlertCircle className="h-5 w-5" aria-hidden />}
      title={title}
      items={[{ text: getErrorMessage(error) }]}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            void onRetry();
          }}
        >
          {financeCopy.summary.errors.retry}
        </Button>
      }
    />
  );
}

export function FinanceSummaryPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const canReadFinance = hasPermission("finance", "read");
  const {
    data: summary,
    isLoading,
    isError: summaryError,
    error: summaryErr,
    refetch: refetchSummary,
  } = useFinanceSummary();
  const {
    data: performance,
    isLoading: performanceLoading,
    isError: performanceError,
    error: performanceErr,
    refetch: refetchPerformance,
  } = useMonthlyPerformance(FINANCE_PULSE_PERFORMANCE_MONTHS);
  const {
    data: statement,
    isLoading: stmtLoading,
    isError: stmtError,
    error: stmtErr,
    refetch: refetchStatement,
  } = useAccountStatement();
  const {
    data: agingSummary,
    isLoading: agingLoading,
    isError: agingError,
    error: agingErr,
    refetch: refetchAging,
  } = useAgingSummary();
  const { data: agingByClient } = useAgingByClient();

  const canInvoiceable = hasPermission("invoices", "create");
  const canDispatch =
    user?.role === ROLES.ADMIN ||
    user?.role === ROLES.MANAGER ||
    user?.role === ROLES.ACCOUNTANT;
  const canCobros = hasPermission("finance", "create");
  const canOperational = hasPermission("operational_cash", "create");

  const { data: invoiceableSummary } = useInvoiceableWorkbenchSummary();
  const { data: dispatchPending } = useDispatchDocuments(
    { bucket: "pending", limit: 1, page: 1 },
    canDispatch,
  );
  const { data: openPpdSummary } = useOpenPpdSummary({
    enabled: canCobros || canReadFinance,
  });
  const { data: operationalPending } = useOperationalCashPending(
    { page: 1, limit: 1 },
    { enabled: canOperational || canReadFinance },
  );

  const rows = statement ?? [];
  const overdueClientCount = useMemo(
    () => rows.filter((row) => row.overdueAmount > 0.009).length,
    [rows],
  );

  const pulseMonth = useMemo(
    () => resolveFinancePulseMonth(performance),
    [performance],
  );
  const pulsePeriodLabel = pulseMonth
    ? formatPerformanceMonth(pulseMonth.period)
    : null;
  const analysisHref = buildFinanceAnalysisHref("performance");

  const agingExportAction = useMemo(() => {
    if (!agingByClient?.length) return undefined;
    return (
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => {
          exportAgingByClientCsv(agingByClient);
          toast({
            title: financeCopy.exports.toasts.exportedTitle,
            description: financeCopy.exports.toasts.aging,
          });
        }}
      >
        <Download className="mr-2 h-4 w-4" />
        {financeCopy.summary.exportAging}
      </Button>
    );
  }, [agingByClient, toast]);

  const cycleSteps = useMemo(() => {
    const openCount =
      (openPpdSummary?.open ?? 0) + (openPpdSummary?.partial ?? 0);
    return buildFinanceCycleSteps(
      {
        invoiceable: canInvoiceable,
        dispatch: canDispatch,
        cobros: canCobros,
        operational: canOperational || canReadFinance,
      },
      {
        invoiceable: invoiceableSummary?.total,
        dispatch: dispatchPending?.pagination.total,
        cobros: openCount,
        cobrosBalance: openPpdSummary?.totalBalance,
        cobrosRepExceptions: openPpdSummary?.repExceptions,
        operational: operationalPending?.meta.totals.tripCount,
        operationalBalance: operationalPending?.meta.totals.pendingAmount,
      },
    );
  }, [
    canCobros,
    canDispatch,
    canInvoiceable,
    canOperational,
    canReadFinance,
    dispatchPending?.pagination.total,
    invoiceableSummary?.total,
    openPpdSummary?.open,
    openPpdSummary?.partial,
    openPpdSummary?.repExceptions,
    openPpdSummary?.totalBalance,
    operationalPending?.meta.totals.pendingAmount,
    operationalPending?.meta.totals.tripCount,
  ]);

  const hub = financeCopy.page.hub;

  return (
    <HubPageShell
      title={hub.title}
      description={hub.description}
      orientation={{
        text:
          user?.role === ROLES.ACCOUNTANT
            ? hub.orientationAccountant
            : user?.role === ROLES.MANAGER
              ? hub.orientationManager
              : hub.orientation,
      }}
    >
      <ReportsReturnLink />

      {summaryError ? (
        <HubQueryError
          title={financeCopy.summary.errors.summary}
          error={summaryErr}
          onRetry={() => {
            void refetchSummary();
          }}
        />
      ) : null}
      {performanceError ? (
        <HubQueryError
          title={financeCopy.summary.errors.performance}
          error={performanceErr}
          onRetry={() => {
            void refetchPerformance();
          }}
        />
      ) : null}
      {agingError ? (
        <HubQueryError
          title={financeCopy.summary.errors.aging}
          error={agingErr}
          onRetry={() => {
            void refetchAging();
          }}
        />
      ) : null}
      {stmtError ? (
        <HubQueryError
          title={financeCopy.summary.errors.statement}
          error={stmtErr}
          onRetry={() => {
            void refetchStatement();
          }}
        />
      ) : null}

      <FinanceReceivableKpis
        summary={summary}
        agingSummary={agingSummary}
        isSummaryLoading={isLoading}
        isAgingLoading={agingLoading}
        overdueClientCount={overdueClientCount}
        periodLabel={pulsePeriodLabel}
      />

      <FinanceCycleStepper steps={cycleSteps} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FinanceAgingChart
          agingSummary={agingSummary}
          isLoading={agingLoading}
          exportAction={agingExportAction}
        />
        <FinanceMonthPanel
          pulseMonth={pulseMonth}
          isLoading={performanceLoading || isLoading}
          periodLabel={pulsePeriodLabel}
          analysisHref={analysisHref}
          expensesThisMonth={summary?.expensesThisMonth}
        />
      </div>

      <FinanceAccountStatementSection
        rows={rows}
        isLoading={stmtLoading}
        showCollectAction={canCobros}
        canDownloadStatement={canReadFinance}
      />
    </HubPageShell>
  );
}
