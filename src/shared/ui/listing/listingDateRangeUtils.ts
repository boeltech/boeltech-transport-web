import { formatDate, getTodayString } from "@shared/utils/dateUtils";
import { addCalendarDays } from "../form/dateFieldUtils";

const DEFAULT_PLACEHOLDER = "Filtrar por fecha";

export function formatListingDateRangeLabel(
  fromDate: string,
  toDate: string,
  placeholder = DEFAULT_PLACEHOLDER,
): string {
  const hasFrom = !!fromDate;
  const hasTo = !!toDate;

  if (!hasFrom && !hasTo) return placeholder;

  if (hasFrom && hasTo) {
    return `${formatDate(fromDate)} - ${formatDate(toDate)}`;
  }

  if (hasFrom) return `Desde ${formatDate(fromDate)}`;
  return `Hasta ${formatDate(toDate)}`;
}

export const LISTING_DATE_RANGE_QUICK_PRESETS = {
  today: (): { fromDate: string; toDate: string } => {
    const today = getTodayString();
    return { fromDate: today, toDate: today };
  },
  lastWeek: (): { fromDate: string; toDate: string } => {
    const today = getTodayString();
    return {
      fromDate: addCalendarDays(today, -7),
      toDate: today,
    };
  },
  lastMonth: (): { fromDate: string; toDate: string } => {
    const today = getTodayString();
    const year = Number(today.slice(0, 4));
    const month = Number(today.slice(5, 7));
    const day = Number(today.slice(8, 10));
    const previous = new Date(Date.UTC(year, month - 2, day));
    const fromDate = `${previous.getUTCFullYear()}-${String(previous.getUTCMonth() + 1).padStart(2, "0")}-${String(previous.getUTCDate()).padStart(2, "0")}`;
    return {
      fromDate,
      toDate: today,
    };
  },
  thisMonth: (): { fromDate: string; toDate: string } => {
    const today = getTodayString();
    return {
      fromDate: `${today.slice(0, 8)}01`,
      toDate: today,
    };
  },
} as const;
