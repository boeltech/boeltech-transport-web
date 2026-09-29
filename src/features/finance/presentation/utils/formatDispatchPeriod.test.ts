import { describe, expect, it } from "vitest";
import { formatDate } from "@shared/utils/dateUtils";
import type { DispatchPeriodWindowFields } from "../../domain/billingDispatchRun.types";
import { dispatchRunsCopy } from "../copy/dispatchRunsCopy";
import {
  formatDispatchPeriodInclusiveCopy,
  formatDispatchPeriodListLabel,
  formatDispatchRunTitle,
} from "./formatDispatchPeriod";

const calendar: DispatchPeriodWindowFields = {
  windowKind: "calendar_cut",
  cadenceKind: "periodic_weekly",
  inclusiveStart: "2026-04-18",
  inclusiveEnd: "2026-04-24",
  cutDate: "2026-04-25",
  windowHours: null,
};

const event: DispatchPeriodWindowFields = {
  windowKind: "event_hours",
  cadenceKind: "event",
  inclusiveStart: null,
  inclusiveEnd: null,
  cutDate: null,
  windowHours: 48,
};

describe("formatDispatchPeriod", () => {
  it("listado calendar no usa periodEnd como día inclusivo", () => {
    expect(formatDispatchPeriodListLabel(calendar)).toBe(
      dispatchRunsCopy.tab.table.periodCalendar(
        formatDate("2026-04-18"),
        formatDate("2026-04-25"),
      ),
    );
    expect(formatDispatchPeriodListLabel(calendar)).toContain("corte");
    expect(formatDispatchPeriodListLabel(calendar)).not.toMatch(/2026-04-25T/);
  });

  it("listado event usa últimas n h", () => {
    expect(formatDispatchPeriodListLabel(event)).toBe("Últimas 48 h");
  });

  it("título y copy D2 distinguen corte civil vs horas", () => {
    expect(formatDispatchRunTitle(calendar)).toBe(
      dispatchRunsCopy.detail.titleCalendar(
        formatDate("2026-04-18"),
        formatDate("2026-04-24"),
      ),
    );
    expect(formatDispatchPeriodInclusiveCopy(calendar)).toBe(
      dispatchRunsCopy.detail.periodCalendar(
        formatDate("2026-04-18"),
        formatDate("2026-04-24"),
        formatDate("2026-04-25"),
      ),
    );
    expect(formatDispatchRunTitle(event)).toBe(
      dispatchRunsCopy.detail.titleEvent(48),
    );
    expect(formatDispatchPeriodInclusiveCopy(event)).toBe(
      dispatchRunsCopy.detail.periodEvent(48),
    );
  });

  it("sin ventana conocida no inventa el día de corte", () => {
    const empty: DispatchPeriodWindowFields = {
      windowKind: null,
      cadenceKind: null,
      inclusiveStart: null,
      inclusiveEnd: null,
      cutDate: null,
      windowHours: null,
    };
    expect(formatDispatchPeriodListLabel(empty)).toBe("—");
    expect(formatDispatchRunTitle(empty)).toBe(
      dispatchRunsCopy.detail.titleFallback,
    );
    expect(formatDispatchPeriodInclusiveCopy(empty)).toBeNull();
  });
});
