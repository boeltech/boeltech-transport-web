import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { formatDate } from "@shared/utils/dateUtils";
import type { PlatformSaasInvoice } from "../../domain/entities";
import { usePlatformTenantSaasInvoices } from "../../application/hooks/usePlatformSaasAr";
import {
  formatBillingPeriodKey,
  formatBillingPriceCents,
} from "../utils/platformBillingFormatters";
import { opsCopy } from "./opsCopy";
import { OpsMarkSaasInvoicePaidSheet } from "./OpsMarkSaasInvoicePaidSheet";
import { OpsEmptyState } from "./patterns/OpsEmptyState";
import {
  OpsButton,
  OpsSheet,
  OpsSheetContent,
  OpsSheetDescription,
  OpsSheetFooter,
  OpsSheetHeader,
  OpsSheetTitle,
} from "./ui";

interface OpsRegisterPaymentSheetProps {
  tenantId: string | null;
  tenantLabel?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Picker de cobros SaaS abiertos → OpsMarkSaasInvoicePaidSheet (mark-paid API).
 * Usado desde Hoy / Hub primaria sin salir de la sección.
 */
export function OpsRegisterPaymentSheet({
  tenantId,
  tenantLabel,
  open,
  onOpenChange,
}: OpsRegisterPaymentSheetProps) {
  const copy = opsCopy.registerPayment;
  const { data: invoices = [], isLoading } = usePlatformTenantSaasInvoices(
    tenantId ?? "",
  );
  const [payInvoice, setPayInvoice] = useState<PlatformSaasInvoice | null>(
    null,
  );

  const openInvoices = useMemo(
    () => invoices.filter((invoice) => invoice.status === "open"),
    [invoices],
  );

  useEffect(() => {
    if (!open) {
      setPayInvoice(null);
    }
  }, [open]);

  const hubCobranzaHref = tenantId
    ? `/platform/tenants/${tenantId}?tab=cobranza`
    : "/platform/billing";

  return (
    <>
      <OpsSheet
        open={open && !payInvoice}
        onOpenChange={(next) => {
          if (!next) onOpenChange(false);
        }}
      >
        <OpsSheetContent
          className="overflow-y-auto"
          onFocusOutside={(e) => e.preventDefault()}
        >
          <OpsSheetHeader>
            <OpsSheetTitle>{copy.title}</OpsSheetTitle>
            <OpsSheetDescription>
              {copy.description}
              {tenantLabel ? ` · ${tenantLabel}` : null}
            </OpsSheetDescription>
          </OpsSheetHeader>

          <div className="mt-2 space-y-3" data-testid="ops-register-payment-sheet">
            {isLoading ? (
              <OpsEmptyState variant="loading" title={copy.loading} />
            ) : openInvoices.length === 0 ? (
              <OpsEmptyState
                title={copy.empty}
                description={copy.emptyHint}
                panel={false}
                action={
                  <OpsButton asChild variant="ghost" size="sm">
                    <Link
                      to={hubCobranzaHref}
                      onClick={() => onOpenChange(false)}
                    >
                      {copy.goCobranza}
                    </Link>
                  </OpsButton>
                }
              />
            ) : (
              <div className="overflow-x-auto ops-rounded ops-hairline">
                <table className="w-full text-left text-sm">
                  <thead className="border-b text-xs ops-text-muted">
                    <tr>
                      <th className="px-3 py-2 font-medium">
                        {copy.columns.period}
                      </th>
                      <th className="px-2 py-2 font-medium">
                        {copy.columns.total}
                      </th>
                      <th className="px-2 py-2 font-medium">
                        {copy.columns.due}
                      </th>
                      <th className="px-3 py-2 font-medium text-right">
                        {copy.columns.action}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {openInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b last:border-b-0">
                        <td className="px-3 py-2">
                          {formatBillingPeriodKey(invoice.periodKey)}
                        </td>
                        <td className="px-2 py-2 tabular-nums">
                          {formatBillingPriceCents(invoice.totalCents)}
                        </td>
                        <td className="px-2 py-2 ops-text-muted">
                          {invoice.dueDate
                            ? formatDate(invoice.dueDate)
                            : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <OpsButton
                            type="button"
                            size="sm"
                            onClick={() => setPayInvoice(invoice)}
                          >
                            {copy.select}
                          </OpsButton>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <OpsSheetFooter className="mt-4">
            <OpsButton
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              {copy.close}
            </OpsButton>
          </OpsSheetFooter>
        </OpsSheetContent>
      </OpsSheet>

      <OpsMarkSaasInvoicePaidSheet
        invoice={payInvoice}
        open={Boolean(payInvoice)}
        onOpenChange={(next) => {
          if (!next) {
            setPayInvoice(null);
          }
        }}
      />
    </>
  );
}
