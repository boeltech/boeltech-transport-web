import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { useAuth } from "@features/auth";
import { canAccessFinanceSummaryRoute } from "@shared/permissions";
import { FinanceSummaryTab } from "./FinanceSummaryTab";
import { FinanceInvoicesTab } from "./FinanceInvoicesTab";

export function FinancePage() {
  const { user } = useAuth();
  const canSummary = useMemo(
    () => canAccessFinanceSummaryRoute(user?.role),
    [user?.role],
  );
  const showInvoiceMetrics = canSummary;

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "summary" && !canSummary) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("tab", "invoices");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, canSummary, setSearchParams]);

  const activeTab = useMemo(() => {
    const t = searchParams.get("tab");
    if (t === "summary" || t === "invoices") {
      if (t === "summary" && !canSummary) return "invoices";
      return t;
    }
    return canSummary ? "summary" : "invoices";
  }, [searchParams, canSummary]);

  const handleTabChange = (value: string) => {
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", value);
      return params;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground">
          Cobranza, facturación CFDI y estado de cuenta
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          {canSummary ? (
            <TabsTrigger value="summary">Resumen</TabsTrigger>
          ) : null}
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>

        {canSummary ? (
          <TabsContent value="summary" className="mt-6">
            <FinanceSummaryTab queriesEnabled={activeTab === "summary"} />
          </TabsContent>
        ) : null}

        <TabsContent value="invoices" className="mt-6">
          <FinanceInvoicesTab showFinanceSummaryMetrics={showInvoiceMetrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
