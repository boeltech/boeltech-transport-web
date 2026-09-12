import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  formatDateTime,
  formatDateTimeFromLocalInput,
  isExpired,
  isExpiringSoon,
  isStrictlyPast,
  localInputToUtcIso,
} from "./dateUtils";

describe("formatDateTimeFromLocalInput", () => {
  it("muestra la misma hora civil que el input datetime-local del wizard", () => {
    const localInput = "2026-05-28T18:55";
    const displayed = formatDateTimeFromLocalInput(localInput);
    const viaUtc = formatDateTime(localInputToUtcIso(localInput));

    expect(displayed).toBe(viaUtc);
    expect(displayed).toMatch(/28 may 2026/i);
    expect(displayed).toMatch(/6:55/i);
  });

  it("delega en formatDateTime cuando el valor ya trae zona UTC", () => {
    const iso = "2026-05-29T00:55:00.000Z";
    expect(formatDateTimeFromLocalInput(iso)).toBe(formatDateTime(iso));
  });
});

describe("isExpired / isExpiringSoon / isStrictlyPast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Noon CDMX ≈ 18:00Z — stable Mexico civil day 2026-09-08
    vi.setSystemTime(new Date("2026-09-08T18:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("isExpired: same-day is expired", () => {
    expect(isExpired("2026-09-08")).toBe(true);
  });

  it("isExpired: yesterday is expired", () => {
    expect(isExpired("2026-09-07")).toBe(true);
  });

  it("isExpired: tomorrow is not expired", () => {
    expect(isExpired("2026-09-09")).toBe(false);
  });

  it("isExpired: null/empty is not expired", () => {
    expect(isExpired(null)).toBe(false);
    expect(isExpired(undefined)).toBe(false);
    expect(isExpired("")).toBe(false);
  });

  it("isStrictlyPast: same-day is not past", () => {
    expect(isStrictlyPast("2026-09-08")).toBe(false);
  });

  it("isStrictlyPast: yesterday is past", () => {
    expect(isStrictlyPast("2026-09-07")).toBe(true);
  });

  it("isExpiringSoon: same-day is not expiring soon (already expired)", () => {
    expect(isExpiringSoon("2026-09-08", 30)).toBe(false);
  });

  it("isExpiringSoon: tomorrow is expiring soon", () => {
    expect(isExpiringSoon("2026-09-09", 30)).toBe(true);
  });

  it("isExpired and isExpiringSoon are mutually exclusive", () => {
    for (const date of ["2026-09-07", "2026-09-08", "2026-09-09", "2026-10-01"]) {
      expect(isExpired(date) && isExpiringSoon(date)).toBe(false);
    }
  });
});
