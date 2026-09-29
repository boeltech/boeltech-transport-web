import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Download } from "lucide-react";
import { useAuth } from "@features/auth";
import { ROLES } from "@shared/constants/roles";
import { useToast } from "@shared/hooks";
import { getErrorMessage } from "@shared/api/interceptors/error-handler";
import { usePermissions } from "@shared/permissions";
import { Button } from "@shared/ui/button";
import { HubPageShell } from "@shared/ui/page-shells";
import { ReportsReturnLink } from "@shared/ui/reports-return/ReportsReturnLink";
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
  FinanceCycleStepper,
  FinanceSummaryCards,
} from "../components";
import { financeCopy } from "../copy";
import { buildFinanceCycleSteps } from "../utils/financeHubNav";
import { exportAgingByClientCsv } from "../utils/financeExportHelpers";

export function FinanceSummaryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
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

  const cycleSteps = useMemo(() => {
    const role = user?.role;
    return buildFinanceCycleSteps({
      invoiceable: hasPermission("invoices", "create"),
      dispatch:
        role === ROLES.ADMIN ||
        role === ROLES.MANAGER ||
        role === ROLES.ACCOUNTANT,
      cobros: hasPermission("finance", "create"),
      approvals: hasPermission("finance_approvals", "read"),
    });
  }, [hasPermission, user?.role]);

  const hub = financeCopy.page.hub;

  return (
    <div className="space-y-4">
      <ReportsReturnLink />
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
        <FinanceCycleStepper steps={cycleSteps} />
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
      </HubPageShell>
    </div>
  );
}
