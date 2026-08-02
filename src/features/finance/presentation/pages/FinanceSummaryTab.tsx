import { useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Button } from "@shared/ui/button";
import {
  useAccountStatement,
  useAgingByClient,
  useAgingSummary,
  useFinanceSummary,
} from "@features/finance/application";
import {
  FinanceAccountStatementSection,
  FinanceAgingChart,
  FinanceSummaryCards,
} from "../components";
import { financeCopy } from "../copy";
import { exportAgingByClientCsv } from "../utils/financeExportHelpers";

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
  const { data: agingByClient } = useAgingByClient({
    enabled: queriesEnabled,
  });

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

  const rows = statement ?? [];

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

  return (
    <div className="space-y-6">
      <FinanceSummaryCards summary={summary} isLoading={isLoading} />

      <FinanceAgingChart
        agingSummary={agingSummary}
        isLoading={agingLoading}
        exportAction={agingExportAction}
      />

      <FinanceAccountStatementSection rows={rows} isLoading={stmtLoading} />
    </div>
  );
}
