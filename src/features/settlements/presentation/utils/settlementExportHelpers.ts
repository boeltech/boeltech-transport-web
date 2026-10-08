import type { DriverSettlement, DriverAdvance } from "../../domain/entities";
import { downloadCsv } from "@shared/utils/exportCsv";
import { getTodayString, toMexicoDayKey } from "@shared/utils/dateUtils";
import { SETTLEMENT_STATUS_LABELS, ADVANCE_STATUS_LABELS, ADVANCE_CATEGORY_LABELS } from "../../domain/enums";
import { uncoveredDeductionsAmount } from "../../domain/settlementTotals";

export function exportSettlementsCsv(settlements: readonly DriverSettlement[]): void {
  const headers = [
    "Folio",
    "Operador",
    "Periodo Inicio",
    "Periodo Fin",
    "Monto Bruto",
    "Anticipos Deducidos",
    "Otras Deducciones",
    "Monto Neto",
    "Estado",
    "Fecha Creación",
    "Descuento no cubierto",
  ];

  const rows = settlements.map((st) => [
    st.settlementNumber,
    st.employeeFullName ?? "",
    st.periodStart,
    st.periodEnd,
    st.grossAmount,
    st.totalAdvancesDeducted,
    st.totalOtherDeductions,
    st.netAmount,
    SETTLEMENT_STATUS_LABELS[st.status] ?? st.status,
    toMexicoDayKey(st.createdAt) ?? "",
    st.uncoveredDeductionsAmount ?? uncoveredDeductionsAmount(st),
  ]);

  downloadCsv(`pagos-${getTodayString()}.csv`, headers, rows);
}

export function exportDriverAdvancesCsv(advances: readonly DriverAdvance[]): void {
  const headers = [
    "Folio",
    "Operador",
    "Categoría",
    "Monto Solicitado",
    "Monto Aplicado",
    "Saldo Pendiente",
    "Estado",
    "Fecha Creación",
    "Observaciones",
  ];

  const rows = advances.map((adv) => [
    adv.folio,
    adv.employeeFullName ?? "",
    ADVANCE_CATEGORY_LABELS[adv.category] ?? adv.category,
    adv.amount,
    adv.amount - adv.balanceRemaining,
    adv.balanceRemaining,
    ADVANCE_STATUS_LABELS[adv.status] ?? adv.status,
    toMexicoDayKey(adv.createdAt) ?? "",
    adv.notes ?? "",
  ]);

  downloadCsv(`anticipos-operadores-${getTodayString()}.csv`, headers, rows);
}
