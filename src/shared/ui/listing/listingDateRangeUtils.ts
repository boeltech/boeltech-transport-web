import { formatDate } from "@shared/utils/dateUtils";

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

export function toIsoDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

export const LISTING_DATE_RANGE_QUICK_PRESETS = {
  today: (): { fromDate: string; toDate: string } => {
    const today = toIsoDateString(new Date());
    return { fromDate: today, toDate: today };
  },
  lastWeek: (): { fromDate: string; toDate: string } => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    return {
      fromDate: toIsoDateString(weekAgo),
      toDate: toIsoDateString(today),
    };
  },
  lastMonth: (): { fromDate: string; toDate: string } => {
    const today = new Date();
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);
    return {
      fromDate: toIsoDateString(monthAgo),
      toDate: toIsoDateString(today),
    };
  },
  thisMonth: (): { fromDate: string; toDate: string } => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      fromDate: toIsoDateString(firstDay),
      toDate: toIsoDateString(today),
    };
  },
} as const;
