import { forwardRef } from "react";
import { formatDate } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import {
  SETTLEMENT_STATUS_LABELS,
  SETTLEMENT_ITEM_TYPE_LABELS,
  DISBURSEMENT_METHOD_LABELS,
  type SettlementItemType,
  type DisbursementMethod,
} from "../../domain/enums";
import { formatItemTitleAndSubtitle } from "./SettlementItemsTable";
import { settlementsCopy } from "../copy/settlementsCopy";

interface SettlementReceiptPrintViewProps {
  settlement: DriverSettlement;
  companyName?: string;
  rfc?: string;
}

export const SettlementReceiptPrintView = forwardRef<HTMLDivElement, SettlementReceiptPrintViewProps>(
  function SettlementReceiptPrintView(
    { settlement, companyName = "Empresa de Transporte", rfc },
    ref,
  ) {
    const copy = settlementsCopy.detailPage.items;
    const receiptCopy = settlementsCopy.detailPage.receipt;
    const items = settlement.items ?? [];
    const earnings = items.filter((it) => !it.isDeduction);
    const deductions = items.filter((it) => it.isDeduction);
    const totalDeductions = settlement.totalAdvancesDeducted + settlement.totalOtherDeductions;

    const paymentMethodLabel = settlement.disbursementMethod
      ? DISBURSEMENT_METHOD_LABELS[settlement.disbursementMethod as DisbursementMethod] ?? settlement.disbursementMethod
      : null;
    const isPaid = settlement.status === "disbursed" || Boolean(settlement.disbursedAt);
    const isApprovedPendingPay =
      settlement.status === "approved" && !isPaid;

    return (
      <div
        ref={ref}
        className="p-6 text-black bg-white max-w-4xl mx-auto print:p-2 print:max-w-none text-xs font-sans leading-tight"
      >
        {/* CABECERA DE LA EMPRESA Y COMPROBANTE */}
        <div className="flex justify-between items-start border-b-2 border-black pb-3 mb-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase">{companyName}</h1>
            {rfc && <p className="text-[11px] text-muted-foreground">RFC: {rfc}</p>}
            <p className="text-[11px] font-semibold text-foreground">{receiptCopy.documentTitle}</p>
          </div>
          <div className="text-right">
            <div className="inline-block border-2 border-black px-2.5 py-0.5 text-sm font-bold font-mono bg-muted print:bg-transparent">
              {receiptCopy.folioLabel} {settlement.settlementNumber}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {receiptCopy.statusLabel}{" "}
              <span className="font-semibold text-black">
                {SETTLEMENT_STATUS_LABELS[settlement.status] ?? settlement.status}
              </span>
            </p>
            {isApprovedPendingPay ? (
              <p className="mt-1 inline-block border-2 border-black px-2 py-0.5 text-[10px] font-black tracking-wide">
                {receiptCopy.signatures.pendingPaymentBanner}
              </p>
            ) : isPaid ? (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide">
                {receiptCopy.signatures.finalReceiptBanner}
              </p>
            ) : null}
            <p className="text-[10px] text-muted-foreground">
              {receiptCopy.issueDateLabel} {formatDate(settlement.createdAt || new Date().toISOString())}
            </p>
          </div>
        </div>

        {/* DATOS DEL OPERADOR Y PERÍODO */}
        <div className="grid grid-cols-2 gap-3 border border-border p-2.5 rounded-sm mb-3 bg-muted/80 print:bg-transparent">
          <div>
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">{receiptCopy.driverLabel}</p>
            <p className="text-sm font-bold text-black">{settlement.employeeFullName ?? "—"}</p>
            {paymentMethodLabel && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {receiptCopy.paymentMethodLabel} <span className="font-medium text-black">{paymentMethodLabel}</span>
                {settlement.disbursementReference && (
                  <span> · {receiptCopy.bankRefLabel} <span className="font-mono text-black">{settlement.disbursementReference}</span></span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase text-muted-foreground font-semibold">{receiptCopy.settledPeriodLabel}</p>
            <p className="text-sm font-bold text-black">
              {formatDate(settlement.periodStart)} al {formatDate(settlement.periodEnd)}
            </p>
            {settlement.disbursedAt && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {receiptCopy.signatures.disbursedOnPrefix} <span className="font-medium text-black">{formatDate(settlement.disbursedAt)}</span>
              </p>
            )}
          </div>
        </div>

        {/* TABLA DE INGRESOS Y VIAJES DEL PERÍODO */}
        <div className="mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider bg-muted px-2 py-1 mb-1 border border-border">
            {receiptCopy.earningsTitle}
          </h2>
          <table className="w-full border-collapse border border-border text-left">
            <thead>
              <tr className="bg-muted text-[10px] uppercase text-muted-foreground">
                <th className="border border-border p-1.5">{receiptCopy.earningsTable.concept}</th>
                <th className="border border-border p-1.5">{receiptCopy.earningsTable.type}</th>
                <th className="border border-border p-1.5">{receiptCopy.earningsTable.trip}</th>
                <th className="border border-border p-1.5 text-right">{receiptCopy.earningsTable.quantity}</th>
                <th className="border border-border p-1.5 text-right">{receiptCopy.earningsTable.rate}</th>
                <th className="border border-border p-1.5 text-right">{receiptCopy.earningsTable.amount}</th>
              </tr>
            </thead>
            <tbody>
              {earnings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-border p-2 text-center text-muted-foreground italic">
                    {receiptCopy.earningsTable.empty}
                  </td>
                </tr>
              ) : (
                earnings.map((it, idx) => {
                  const { title, subtitle, badgeTag } = formatItemTitleAndSubtitle(it, copy);
                  return (
                    <tr key={it.id ?? idx} className="text-[11px]">
                      <td className="border border-border p-1.5">
                        <div className="font-semibold text-black">
                          {title} {badgeTag ? <span className="font-normal text-[10px] text-muted-foreground">[{badgeTag}]</span> : ""}
                        </div>
                        {subtitle && <div className="text-[10px] text-muted-foreground leading-tight">{subtitle}</div>}
                      </td>
                      <td className="border border-border p-1.5 text-[10px] text-muted-foreground">
                        {SETTLEMENT_ITEM_TYPE_LABELS[it.itemType as SettlementItemType] ?? it.itemType}
                      </td>
                      <td className="border border-border p-1.5 font-mono text-[11px]">{it.tripCode ?? "—"}</td>
                      <td className="border border-border p-1.5 text-right tabular-nums">{it.quantity}</td>
                      <td className="border border-border p-1.5 text-right tabular-nums">
                        {it.unitRate > 0 ? formatMxCurrency(it.unitRate) : "—"}
                      </td>
                      <td className="border border-border p-1.5 text-right tabular-nums font-semibold text-black">
                        {formatMxCurrency(it.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/80 font-bold text-[11px]">
                <td colSpan={5} className="border border-border p-1.5 text-right uppercase">
                  {receiptCopy.earningsTable.subtotal}
                </td>
                <td className="border border-border p-1.5 text-right tabular-nums text-black">
                  {formatMxCurrency(settlement.grossAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* TABLA DE DEDUCCIONES Y ANTICIPOS */}
        <div className="mb-3">
          <h2 className="text-[11px] font-bold uppercase tracking-wider bg-muted px-2 py-1 mb-1 border border-border">
            {receiptCopy.deductionsTitle}
          </h2>
          <table className="w-full border-collapse border border-border text-left">
            <thead>
              <tr className="bg-muted text-[10px] uppercase text-muted-foreground">
                <th className="border border-border p-1.5">{receiptCopy.deductionsTable.concept}</th>
                <th className="border border-border p-1.5">{receiptCopy.deductionsTable.type}</th>
                <th className="border border-border p-1.5">{receiptCopy.deductionsTable.reference}</th>
                <th className="border border-border p-1.5 text-right">{receiptCopy.deductionsTable.amount}</th>
              </tr>
            </thead>
            <tbody>
              {deductions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-border p-2 text-center text-muted-foreground italic">
                    {receiptCopy.deductionsTable.empty}
                  </td>
                </tr>
              ) : (
                deductions.map((it, idx) => {
                  const { title, subtitle } = formatItemTitleAndSubtitle(it, copy);
                  return (
                    <tr key={it.id ?? idx} className="text-[11px]">
                      <td className="border border-border p-1.5">
                        <div className="font-semibold text-black">{title}</div>
                        {subtitle && <div className="text-[10px] text-muted-foreground leading-tight">{subtitle}</div>}
                      </td>
                      <td className="border border-border p-1.5 text-[10px] text-muted-foreground">
                        {SETTLEMENT_ITEM_TYPE_LABELS[it.itemType as SettlementItemType] ?? it.itemType}
                      </td>
                      <td className="border border-border p-1.5 font-mono text-[10px] text-muted-foreground">
                        {it.calculationDetails?.advanceFolio ?? (it.advanceId ? "Anticipo vinculado" : "—")}
                      </td>
                      <td className="border border-border p-1.5 text-right tabular-nums font-semibold text-black">
                        -{formatMxCurrency(it.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-muted/80 font-bold text-[11px]">
                <td colSpan={3} className="border border-border p-1.5 text-right uppercase">
                  {receiptCopy.deductionsTable.subtotal}
                </td>
                <td className="border border-border p-1.5 text-right tabular-nums text-black">
                  -{formatMxCurrency(totalDeductions)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* BANDA DE BALANCE HORIZONTAL (D3) */}
        <div className="border-2 border-black bg-muted p-2 mb-3 rounded-sm print:bg-transparent break-inside-avoid">
          <div className="grid grid-cols-3 gap-2 text-center items-center">
            <div className="border-r border-border pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {receiptCopy.balance.totalEarningsLabel}
              </span>
              <span className="text-sm font-bold tabular-nums text-black block">
                {formatMxCurrency(settlement.grossAmount)}
              </span>
            </div>
            <div className="border-r border-border pr-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                {receiptCopy.balance.totalDeductionsLabel}
              </span>
              <span className="text-sm font-bold tabular-nums text-black block">
                -{formatMxCurrency(totalDeductions)}
              </span>
            </div>
            <div className="bg-muted/80 py-1 px-2 rounded-sm border border-border print:bg-muted">
              <span className="text-[10px] uppercase font-black tracking-tight text-black block">
                {receiptCopy.balance.netToPayLabel}
              </span>
              <span className="text-base font-black tabular-nums text-black block">
                {formatMxCurrency(settlement.netAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* OBSERVACIONES / NOTAS */}
        {settlement.notes && (
          <div className="border border-border p-2 rounded-sm mb-3 text-[10px] bg-white break-inside-avoid">
            <span className="font-bold">{receiptCopy.notesTitle} </span>
            <span>{settlement.notes}</span>
          </div>
        )}

        {/* FIRMAS DE CONFORMIDAD */}
        <div className="grid grid-cols-2 gap-8 pt-4 mt-4 border-t border-border text-center break-inside-avoid print:pt-3 print:mt-2">
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="font-bold text-xs text-black">{settlement.employeeFullName ?? "Operador / Conductor"}</p>
            <p className="text-[10px] font-semibold text-muted-foreground">{receiptCopy.signatures.driverTitle}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">{receiptCopy.signatures.driverDisclaimer}</p>
          </div>
          <div>
            <div className="border-b border-black w-3/4 mx-auto mb-1"></div>
            <p className="font-bold text-xs text-black">
              {settlement.approvedByName || receiptCopy.signatures.approverDefaultName}
            </p>
            <p className="text-[10px] font-semibold text-muted-foreground">{receiptCopy.signatures.approverTitle}</p>
            <p className="text-[9px] text-muted-foreground mt-0.5 leading-tight">
              {isPaid
                ? `${receiptCopy.signatures.disbursedOnPrefix} ${formatDate(settlement.disbursedAt!)} · ${receiptCopy.signatures.approverDisclaimerDisbursed}`
                : isApprovedPendingPay
                  ? `${receiptCopy.signatures.pendingPaymentBanner} · ${receiptCopy.signatures.approverDisclaimerPending}`
                  : receiptCopy.signatures.approverDisclaimerPending}
            </p>
          </div>
        </div>
      </div>
    );
  },
);
