import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Landmark } from "lucide-react";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { Button } from "@shared/ui/button";
import {
  buildFinanceCobrosPath,
  useAccountStatement,
  useAgingByClient,
  useAgingSummary,
  useFinanceSummary,
} from "@features/finance/application";
import {
  FinanceAccountStatementSection,
  FinanceAgingChart,
  FinanceSectionHeader,
  FinanceSummaryCards,
} from "../components";
import { financeCopy } from "../copy";
import { exportAgingByClientCsv } from "../utils/financeExportHelpers";

export function FinanceSummaryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    data: summary,
    isLoading,
    isError: summaryError,
    error: summaryErr,
  } = useFinanceSummary();
  const {
    data: statement,
    isLoading: stmtLoading,
    isError: stmtError,
    error: stmtErr,
  } = useAccountStatement();
  const {
    data: agingSummary,
    isLoading: agingLoading,
    isError: agingError,
    error: agingErr,
  } = useAgingSummary();
  const { data: agingByClient } = useAgingByClient();

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

  const handleCollectClient = useCallback(
    (clientRfc: string) => {
      navigate(buildFinanceCobrosPath(clientRfc));
    },
    [navigate],
  );

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
      <FinanceSectionHeader
        icon={<Landmark className="h-5 w-5" />}
        title={financeCopy.page.sections.summary.title}
        subtitle={financeCopy.page.sections.summary.subtitle}
      />

      <FinanceSummaryCards summary={summary} isLoading={isLoading} />

      <FinanceAgingChart
        agingSummary={agingSummary}
        isLoading={agingLoading}
        exportAction={agingExportAction}
      />

      <FinanceAccountStatementSection
        rows={rows}
        isLoading={stmtLoading}
        onCollectClient={handleCollectClient}
      />
    </div>
  );
}
