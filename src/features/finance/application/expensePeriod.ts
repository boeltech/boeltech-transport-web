import { getTodayString } from "@shared/utils/dateUtils";

export interface FinanceDateRange {
  from: string;
  to: string;
}

/**
 * Mes calendario de hoy en CDMX (`today` = `YYYY-MM-DD`), usado por dashboard,
 * detalle de unidad y Reportes. No depende de la zona del navegador.
 */
export function getCurrentMonthExpenseRange(
  today: string = getTodayString(),
): FinanceDateRange {
  const [year, month] = today.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return {
    from: `${monthKey}-01`,
    to: `${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}
