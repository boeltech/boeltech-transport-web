/**
 * Workbench unificado de envío de facturas.
 * Tabs: Pendientes · Enviadas. Lotes del periodo vía crossLink + CTA de cabecera.
 */

import { useCallback, useMemo, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { usePermissions } from "@shared/permissions";
import { useInvoices } from "@features/invoicing";
import type { InvoiceListItem } from "@features/invoicing";
import { useBillingDispatchRuns } from "@features/finance/application";
import {
  DEFAULT_DISPATCH_TAB,
  DISPATCH_TAB_PARAM,
  parseDispatchWorkbenchTab,
  type DispatchWorkbenchTabId,
} from "../config/dispatchWorkbenchConfig";
import {
  FinanceDispatchConfirmSheet,
  type FinanceDispatchConfirmSheetMode,
} from "../components/FinanceDispatchConfirmSheet";
import { FinanceDispatchCreateRunDialog } from "../components/FinanceDispatchCreateRunDialog";
import { FinanceDispatchPendingPanel } from "../components/FinanceDispatchPendingPanel";
import { FinanceDispatchSentPanel } from "../components/FinanceDispatchSentPanel";
import {
  FINANCE_DISPATCH_PERIOD_PATH,
} from "../../application/financeRoutes";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { mapDispatchWorkbenchBuckets } from "../utils/mapDispatchWorkbenchBuckets";
import { useInvoiceQueueFromState } from "../utils/invoiceQueueFrom";

const copy = dispatchRunsCopy.workbench;

export function FinanceDispatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { from: returnTo } = useInvoiceQueueFromState();
  const tabParam = searchParams.get(DISPATCH_TAB_PARAM);
  const { hasPermission } = usePermissions();
  const canExecute = hasPermission("invoices", "execute");
  const activeTab = parseDispatchWorkbenchTab(tabParam);
  const [pendingCountFromPanel, setPendingCountFromPanel] = useState(0);
  const [sentCountFromPanel, setSentCountFromPanel] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [createRunOpen, setCreateRunOpen] = useState(false);
  const [confirmMode, setConfirmMode] =
    useState<FinanceDispatchConfirmSheetMode>("send");
  const [confirmInvoices, setConfirmInvoices] = useState<InvoiceListItem[]>(
    [],
  );
  /** Incrementa tras batch ok → Pending/Sent panel limpia selección. */
  const [selectionResetKey, setSelectionResetKey] = useState(0);

  const { data: pendingMeta } = useInvoices({
    status: "stamped",
    emailDispatch: "unsent",
    page: 1,
    limit: 1,
  });
  const pendingCount =
    pendingMeta?.pagination?.total ?? pendingCountFromPanel;

  const { data: sentMeta } = useInvoices({
    status: "stamped",
    emailDispatch: "sent",
    page: 1,
    limit: 1,
  });
  const sentCount = sentMeta?.pagination?.total ?? sentCountFromPanel;

  const { data: periodMeta } = useBillingDispatchRuns({
    page: 1,
    limit: 1,
  });
  const periodCount = periodMeta?.pagination?.total ?? 0;

  const handleTabChange = useCallback(
    (tab: DispatchWorkbenchTabId) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (tab === DEFAULT_DISPATCH_TAB) {
            next.delete(DISPATCH_TAB_PARAM);
          } else {
            next.set(DISPATCH_TAB_PARAM, tab);
          }
          next.delete("dispatch_status");
          next.delete("billing_scheme_id");
          next.delete("search");
          next.delete("page");
          next.delete("dateFrom");
          next.delete("dateTo");
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const requestSend = useCallback((selected: InvoiceListItem[]) => {
    if (selected.length === 0) return;
    setConfirmMode("send");
    setConfirmInvoices(selected);
    setConfirmOpen(true);
  }, []);

  const requestResend = useCallback((selected: InvoiceListItem[]) => {
    if (selected.length === 0) return;
    setConfirmMode("resend");
    setConfirmInvoices(selected);
    setConfirmOpen(true);
  }, []);

  const handleBatchComplete = useCallback(() => {
    setSelectionResetKey((key) => key + 1);
  }, []);

  const buckets = useMemo(
    () =>
      mapDispatchWorkbenchBuckets({
        activeTab,
        onTabChange: handleTabChange,
        pendingCount,
        sentCount,
        periodCount,
      }),
    [activeTab, handleTabChange, pendingCount, sentCount, periodCount],
  );

  if (tabParam === "history") {
    return <Navigate to={FINANCE_DISPATCH_PERIOD_PATH} replace />;
  }

  return (
    <>
      <WorkbenchPageShell
        title={copy.title}
        description={copy.description}
        primaryAction={{
          label: copy.armPeriodCta,
          icon: <Plus className="h-4 w-4" />,
          onClick: () => setCreateRunOpen(true),
          visible: canExecute,
        }}
        buckets={buckets}
        bucketsAriaLabel={copy.bucketsAriaLabel}
        renderContent={() => {
          if (activeTab === "sent") {
            return (
              <FinanceDispatchSentPanel
                requestResend={requestResend}
                onSentTotalChange={setSentCountFromPanel}
                selectionResetKey={selectionResetKey}
              />
            );
          }

          return (
            <FinanceDispatchPendingPanel
              requestSend={requestSend}
              onPendingTotalChange={setPendingCountFromPanel}
              selectionResetKey={selectionResetKey}
            />
          );
        }}
        relatedConfig={{
          label: "Ver registro de facturas",
          href: "/finance/invoices",
          description: "Listado completo de facturas emitidas.",
        }}
      />

      <FinanceDispatchConfirmSheet
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setConfirmInvoices([]);
            setConfirmMode("send");
          }
        }}
        invoices={confirmInvoices}
        mode={confirmMode}
        onBatchComplete={handleBatchComplete}
      />

      <FinanceDispatchCreateRunDialog
        open={createRunOpen}
        onOpenChange={setCreateRunOpen}
        alreadyOpenSource="workbench"
        returnTo={returnTo}
      />
    </>
  );
}
