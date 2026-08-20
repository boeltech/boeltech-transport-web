import { getTodayString } from "@shared/utils/dateUtils";

export const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DATETIME_LOCAL_PATTERN = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/;

/** Marcador para calendarios en portal (Popover anidado en filtros). */
export const DATE_FIELD_CALENDAR_ATTR = "data-date-field-calendar";

export const DATE_FIELD_COPY = {
  placeholderDate: "Elegir fecha",
  mexicoTimeCaption: "Hora de México",
  previousMonth: "Mes anterior",
  nextMonth: "Mes siguiente",
  previousYear: "Año anterior",
  nextYear: "Año siguiente",
  chooseYear: "Elegir año",
  previousYearRange: "Años anteriores",
  nextYearRange: "Años siguientes",
  timeAriaLabel: "Hora",
  weekdays: ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"] as const,
} as const;

export const TRIP_SCHEDULE_DEFAULT_TIME = "08:00";

export type IsoDateParts = { year: number; month: number; day: number };

export function parseIsoDateParts(value: string): IsoDateParts | null {
  if (!ISO_DATE_PATTERN.test(value)) return null;
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function addCalendarDays(isoDate: string, days: number): string {
  const parts = parseIsoDateParts(isoDate);
  if (!parts) return isoDate;
  const utc = Date.UTC(parts.year, parts.month - 1, parts.day + days);
  const next = new Date(utc);
  return formatIsoDate(
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
  );
}

export function splitDateTimeLocal(value: string): { date: string; time: string } {
  const trimmed = value.trim();
  if (!trimmed) return { date: "", time: "" };
  const match = DATETIME_LOCAL_PATTERN.exec(trimmed);
  if (match?.[1] && match[2]) {
    return { date: match[1], time: match[2] };
  }
  if (ISO_DATE_PATTERN.test(trimmed)) {
    return { date: trimmed, time: "" };
  }
  return { date: "", time: "" };
}

export function joinDateTimeLocal(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}`;
}

export function mexicoTodayAt(time: string): string {
  return joinDateTimeLocal(getTodayString(), time);
}

export function mexicoTomorrowAt(time: string): string {
  return joinDateTimeLocal(addCalendarDays(getTodayString(), 1), time);
}

export function formatMonthHeading(year: number, month: number): string {
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(
    "es-MX",
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** 0 = lunes … 6 = domingo (calendario México). */
export function mondayFirstWeekday(year: number, month: number, day: number): number {
  const jsDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return (jsDay + 6) % 7;
}

export function isIsoDateInRange(
  isoDate: string,
  min?: string,
  max?: string,
): boolean {
  if (min && isoDate < min) return false;
  if (max && isoDate > max) return false;
  return true;
}

export function preventCloseIfDateCalendar(event: {
  target: EventTarget | null;
  preventDefault: () => void;
}): void {
  const target = event.target;
  if (
    target instanceof Element &&
    target.closest(`[${DATE_FIELD_CALENDAR_ATTR}]`)
  ) {
    event.preventDefault();
  }
}
