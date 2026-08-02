export interface FinanceDateRange {
  from: string;
  to: string;
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Mes calendario local usado por dashboard y detalle de unidad. */
export function getCurrentMonthExpenseRange(
  now: Date = new Date(),
): FinanceDateRange {
  return {
    from: formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    to: formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
}

