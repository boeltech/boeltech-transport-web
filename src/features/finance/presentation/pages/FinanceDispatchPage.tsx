/**
 * Workbench unificado de envío de facturas (F1–F4).
 * Tabs: Pendientes (F2+F3 Sheet) · Enviadas (F4) · Historial.
 */

import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { WorkbenchPageShell } from "@shared/ui/page-shells";
import { useInvoices } from "@features/invoicing";
import type { InvoiceListItem } from "@features/invoicing/domain";
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
import { FinanceDispatchHistoryPanel } from "../components/FinanceDispatchHistoryPanel";
import { FinanceDispatchPendingPanel } from "../components/FinanceDispatchPendingPanel";
import { FinanceDispatchSentPanel } from "../components/FinanceDispatchSentPanel";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import { mapDispatchWorkbenchBuckets } from "../utils/mapDispatchWorkbenchBuckets";

const copy = dispatchRunsCopy.workbench;

export function FinanceDispatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = parseDispatchWorkbenchTab(
    searchParams.get(DISPATCH_TAB_PARAM),
  );
  const [pendingCountFromPanel, setPendingCountFromPanel] = useState(0);
  const [sentCountFromPanel, setSentCountFromPanel] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] =
    useState<FinanceDispatchConfirmSheetMode>("send");
  const [confirmInvoices, setConfirmInvoices] = useState<InvoiceListItem[]>(
    [],
  );
  /** Incrementa tras batch ok → Pending/Sent panel limpia selección. */
  const [selectionResetKey, setSelectionResetKey] = useState(0);

  // Badge del bucket Pendientes aunque el tab activo sea otro.
  const { data: pendingMeta } = useInvoices({
    status: "stamped",
    emailDispatch: "unsent",
    page: 1,
    limit: 1,
  });
  const pendingCount =
    pendingMeta?.pagination?.total ?? pendingCountFromPanel;

  // Badge Enviadas (opcional F4).
  const { data: sentMeta } = useInvoices({
    status: "stamped",
    emailDispatch: "sent",
    page: 1,
    limit: 1,
  });
  const sentCount = sentMeta?.pagination?.total ?? sentCountFromPanel;

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
          // Filtros del historial solo aplican en ese bucket
          if (tab !== "history") {
            next.delete("dispatch_status");
            next.delete("billing_scheme_id");
          }
          // Búsqueda / página / periodo se reutilizan por tab activo: limpiar al cambiar
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

  const handleBatchComplete = useCallback((_okInvoiceIds: string[]) => {
    setSelectionResetKey((key) => key + 1);
  }, []);

  const buckets = useMemo(
    () =>
      mapDispatchWorkbenchBuckets({
        activeTab,
        onTabChange: handleTabChange,
        pendingCount,
        sentCount,
      }),
    [activeTab, handleTabChange, pendingCount, sentCount],
  );

  return (
    <>
      <WorkbenchPageShell
        title={copy.title}
        description={copy.description}
        buckets={buckets}
        bucketsAriaLabel={copy.bucketsAriaLabel}
        renderContent={() => {
          if (activeTab === "history") {
            return <FinanceDispatchHistoryPanel />;
          }

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
    </>
  );
}
