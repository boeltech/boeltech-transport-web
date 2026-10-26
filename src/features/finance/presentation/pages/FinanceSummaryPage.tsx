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
import {
  buildFinanceAnalysisHref,
  buildFinanceCobrosPath,
  useAccountStatement,
  useAgingByClient,
  useAgingSummary,
  useDownloadAccountStatementPdf,
  useFinanceSummary,
  useIncomeByMonth,
  useMonthlyPerformance,
} from "@features/finance/application";
import {
  FinanceAccountStatementSection,
  FinanceAgingChart,
  FinanceCycleStepper,
  FinancePulseCards,
  FinanceSummaryCards,
} from "../components";
import { financeCopy } from "../copy";
import { buildFinanceCycleSteps } from "../utils/financeHubNav";
import { exportAgingByClientCsv } from "../utils/financeExportHelpers";
import {
  FINANCE_COLLECTED_TREND_MONTHS,
  FINANCE_PULSE_PERFORMANCE_MONTHS,
  resolveFinancePulseMonth,
  toCollectedTrendData,
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
    data: incomeByMonth,
    isLoading: incomeLoading,
  } = useIncomeByMonth({ months: FINANCE_COLLECTED_TREND_MONTHS });
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

  const downloadPdf = useDownloadAccountStatementPdf({
    onError: (err) => {
      toast({
        variant: "destructive",
        title: financeCopy.summary.accountStatement.downloadPdfError,
        description: getErrorMessage(err),
      });
    },
  });

  const rows = statement ?? [];
  const collectedTrendData = useMemo(
    () => toCollectedTrendData(incomeByMonth),
    [incomeByMonth],
  );

  const pulseMonth = useMemo(
    () => resolveFinancePulseMonth(performance),
    [performance],
  );
  const pulsePeriodLabel = pulseMonth
    ? formatPerformanceMonth(pulseMonth.period)
    : null;
  const analysisHref = buildFinanceAnalysisHref("performance");
  const cobrosHref = buildFinanceCobrosPath();

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
    const role = user?.role;
    return buildFinanceCycleSteps({
      invoiceable: hasPermission("invoices", "create"),
      dispatch:
        role === ROLES.ADMIN ||
        role === ROLES.MANAGER ||
        role === ROLES.ACCOUNTANT,
      cobros: hasPermission("finance", "create"),
    });
  }, [hasPermission, user?.role]);

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
      <FinanceCycleStepper steps={cycleSteps} />

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

      <FinancePulseCards
        summary={summary}
        pulseMonth={pulseMonth}
        isSummaryLoading={isLoading}
        isPerformanceLoading={performanceLoading}
        analysisHref={analysisHref}
        receivableHref={cobrosHref}
        overdueHref={cobrosHref}
        periodLabel={pulsePeriodLabel}
      />
      <FinanceSummaryCards
        summary={summary}
        isLoading={isLoading}
        collectedTrendData={collectedTrendData}
        collectedTrendLoading={incomeLoading}
        keys={["collectedThisMonth", "expensesThisMonth"]}
      />

      <FinanceAgingChart
        agingSummary={agingSummary}
        isLoading={agingLoading}
        exportAction={agingExportAction}
      />

      <FinanceAccountStatementSection
        rows={rows}
        isLoading={stmtLoading}
        showCollectAction
        onDownloadPdf={
          canReadFinance
            ? (clientRfc) => downloadPdf.mutate(clientRfc)
            : undefined
        }
        downloadingRfc={
          downloadPdf.isPending ? (downloadPdf.variables ?? null) : null
        }
      />
    </HubPageShell>
  );
}
