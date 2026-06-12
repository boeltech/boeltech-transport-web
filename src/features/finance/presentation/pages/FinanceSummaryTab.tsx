import { useEffect, useMemo } from "react";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import {
  useAccountStatement,
  useAgingSummary,
  useFinanceSummary,
  useIncomeByMonth,
  useInvoicesByStatusMonth,
} from "@features/finance/application";
import {
  FinanceAccountStatementSection,
  FinanceAgingChart,
  FinanceSummaryCards,
  FinanceSummaryCharts,
  FinanceSummaryTimeSeriesCharts,
} from "../components";
import { financeCopy } from "../copy";

interface FinanceSummaryTabProps {
  queriesEnabled: boolean;
}

export function FinanceSummaryTab({ queriesEnabled }: FinanceSummaryTabProps) {
  const { toast } = useToast();
  const {
    data: summary,
    isLoading,
    isError: summaryError,
    error: summaryErr,
  } = useFinanceSummary({ enabled: queriesEnabled });
  const {
    data: statement,
    isLoading: stmtLoading,
    isError: stmtError,
    error: stmtErr,
  } = useAccountStatement({ enabled: queriesEnabled });
  const {
    data: agingSummary,
    isLoading: agingLoading,
    isError: agingError,
    error: agingErr,
  } = useAgingSummary({ enabled: queriesEnabled });
  const {
    data: incomeByMonth,
    isLoading: incomeLoading,
    isError: incomeError,
    error: incomeErr,
  } = useIncomeByMonth({ months: 12 }, { enabled: queriesEnabled });
  const {
    data: invoicesByStatusMonth,
    isLoading: invoicesByStatusLoading,
    isError: invoicesByStatusError,
    error: invoicesByStatusErr,
  } = useInvoicesByStatusMonth({ months: 12 }, { enabled: queriesEnabled });

  const collectedTrendData = useMemo(
    () => incomeByMonth?.collected.map((value) => ({ value })) ?? [],
    [incomeByMonth],
  );

  useEffect(() => {
    if (!summaryError || !summaryErr) return;
    toast({
      variant: "destructive",
      title: financeCopy.summary.errors.summary,
      description: getErrorMessage(summaryErr),
    });
  }, [summaryError, summaryErr, toast]);

  useEffect(() => {
    if (!stmtError || !stmtErr) return;
    toast({
      variant: "destructive",
      title: financeCopy.summary.errors.statement,
      description: getErrorMessage(stmtErr),
    });
  }, [stmtError, stmtErr, toast]);

  useEffect(() => {
    if (!agingError || !agingErr) return;
    toast({
      variant: "destructive",
      title: financeCopy.summary.errors.aging,
      description: getErrorMessage(agingErr),
    });
  }, [agingError, agingErr, toast]);

  useEffect(() => {
    if (!incomeError || !incomeErr) return;
    toast({
      variant: "destructive",
      title: financeCopy.summary.errors.incomeByMonth,
      description: getErrorMessage(incomeErr),
    });
  }, [incomeError, incomeErr, toast]);

  useEffect(() => {
    if (!invoicesByStatusError || !invoicesByStatusErr) return;
    toast({
      variant: "destructive",
      title: financeCopy.summary.errors.invoicesByStatusMonth,
      description: getErrorMessage(invoicesByStatusErr),
    });
  }, [invoicesByStatusError, invoicesByStatusErr, toast]);

  const rows = statement ?? [];

  return (
    <div className="space-y-6">
      <FinanceSummaryCards
        summary={summary}
        isLoading={isLoading}
        collectedTrendData={collectedTrendData}
        collectedTrendLoading={incomeLoading}
      />

      <FinanceSummaryCharts summary={summary} isLoading={isLoading} />

      <FinanceSummaryTimeSeriesCharts
        incomeByMonth={incomeByMonth}
        invoicesByStatusMonth={invoicesByStatusMonth}
        isLoading={incomeLoading || invoicesByStatusLoading}
      />

      <FinanceAgingChart agingSummary={agingSummary} isLoading={agingLoading} />

      <FinanceAccountStatementSection rows={rows} isLoading={stmtLoading} />
    </div>
  );
}
