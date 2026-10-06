/**
 * Pure helpers to compute settlement periods aligned to salary frequency.
 *
 * Ported 1:1 from API `settlement.workbench.ts` (L42–176).
 * All dates are calendar-day strings `"YYYY-MM-DD"` in UTC.
 * Default `asOfDate` is today in CDMX, like the API (`getTodayMexicoString`).
 */

import { getTodayString } from "@shared/utils/dateUtils";

export type SalaryPeriodKind = "weekly" | "biweekly" | "monthly";

export interface PeriodResult {
  periodStart: string;
  periodEnd: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseCalendarDate(dateStr: string): Date {
  return new Date(`${dateStr.slice(0, 10)}T12:00:00Z`);
}

function fmt(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Period resolvers
// ---------------------------------------------------------------------------

export function getWeekPeriod(dateStr: string): PeriodResult {
  const date = parseCalendarDate(dateStr);
  const dow = date.getUTCDay(); // 0=Sun
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + mondayOffset);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { periodStart: fmt(monday), periodEnd: fmt(sunday) };
}

export function getBiweeklyPeriod(dateStr: string): PeriodResult {
  const date = parseCalendarDate(dateStr);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const day = date.getUTCDate();
  if (day <= 15) {
    return {
      periodStart: fmt(new Date(Date.UTC(y, m, 1))),
      periodEnd: fmt(new Date(Date.UTC(y, m, 15))),
    };
  }
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return {
    periodStart: fmt(new Date(Date.UTC(y, m, 16))),
    periodEnd: fmt(new Date(Date.UTC(y, m, lastDay))),
  };
}

export function getMonthlyPeriod(dateStr: string): PeriodResult {
  const date = parseCalendarDate(dateStr);
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth();
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  return {
    periodStart: fmt(new Date(Date.UTC(y, m, 1))),
    periodEnd: fmt(new Date(Date.UTC(y, m, lastDay))),
  };
}

// ---------------------------------------------------------------------------
// Navigation: next / previous period
// ---------------------------------------------------------------------------

export function getNextPeriod(
  salaryPeriod: SalaryPeriodKind,
  currentStart: string,
): PeriodResult {
  const d = parseCalendarDate(currentStart);

  switch (salaryPeriod) {
    case "weekly": {
      const next = new Date(d);
      next.setUTCDate(d.getUTCDate() + 7);
      return getWeekPeriod(fmt(next));
    }
    case "biweekly": {
      const day = d.getUTCDate();
      if (day === 1) {
        return getBiweeklyPeriod(
          fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 16))),
        );
      }
      // day === 16 → next month 1st half
      const nextMonth = d.getUTCMonth() + 1;
      const nextYear = nextMonth > 11 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
      return getBiweeklyPeriod(
        fmt(new Date(Date.UTC(nextYear, nextMonth % 12, 1))),
      );
    }
    case "monthly": {
      const nextMonth = d.getUTCMonth() + 1;
      const nextYear = nextMonth > 11 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
      return getMonthlyPeriod(
        fmt(new Date(Date.UTC(nextYear, nextMonth % 12, 1))),
      );
    }
  }
}

export function getPreviousPeriod(
  salaryPeriod: SalaryPeriodKind,
  currentStart: string,
): PeriodResult {
  const d = parseCalendarDate(currentStart);

  switch (salaryPeriod) {
    case "weekly": {
      const prev = new Date(d);
      prev.setUTCDate(d.getUTCDate() - 7);
      return getWeekPeriod(fmt(prev));
    }
    case "biweekly": {
      const day = d.getUTCDate();
      if (day === 16) {
        return getBiweeklyPeriod(
          fmt(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))),
        );
      }
      // day === 1 → previous month 2nd half
      const prevMonth = d.getUTCMonth() - 1;
      const prevYear = prevMonth < 0 ? d.getUTCFullYear() - 1 : d.getUTCFullYear();
      return getBiweeklyPeriod(
        fmt(new Date(Date.UTC(prevYear, (prevMonth + 12) % 12, 16))),
      );
    }
    case "monthly": {
      const prevMonth = d.getUTCMonth() - 1;
      const prevYear = prevMonth < 0 ? d.getUTCFullYear() - 1 : d.getUTCFullYear();
      return getMonthlyPeriod(
        fmt(new Date(Date.UTC(prevYear, (prevMonth + 12) % 12, 1))),
      );
    }
  }
}

// ---------------------------------------------------------------------------
// buildSuggestedSettlementPeriod — main entry point
// ---------------------------------------------------------------------------

export interface BuildSuggestedPeriodInput {
  salaryPeriod: SalaryPeriodKind;
  oldestTripDate?: string | null;
  latestTripDate?: string | null;
  asOfDate?: string;
}

export function buildSuggestedSettlementPeriod(
  input: BuildSuggestedPeriodInput,
): PeriodResult {
  const asOfDate = input.asOfDate ?? getTodayString();
  const anchorDate = input.oldestTripDate ?? input.latestTripDate ?? asOfDate;

  switch (input.salaryPeriod) {
    case "weekly":
      return getWeekPeriod(anchorDate);
    case "biweekly":
      return getBiweeklyPeriod(anchorDate);
    case "monthly":
      return getMonthlyPeriod(anchorDate);
  }
}

// ---------------------------------------------------------------------------
// ISO week number (for display label)
// ---------------------------------------------------------------------------

export function isoWeekNumber(dateStr: string): number {
  const date = parseCalendarDate(dateStr);
  const jan4 = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
  const diff = date.getTime() - monday.getTime();
  return Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
}
