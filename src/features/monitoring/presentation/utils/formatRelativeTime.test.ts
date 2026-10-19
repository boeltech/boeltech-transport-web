import { describe, expect, it } from "vitest";
import { formatRelativeTime } from "./formatRelativeTime";

describe("formatRelativeTime", () => {
  const now = Date.parse("2026-10-18T12:00:00.000Z");

  it("formats just now / minutes / hours", () => {
    expect(formatRelativeTime("2026-10-18T11:59:40.000Z", now)).toBe(
      "Hace un momento",
    );
    expect(formatRelativeTime("2026-10-18T11:50:00.000Z", now)).toBe(
      "Hace 10 min",
    );
    expect(formatRelativeTime("2026-10-18T09:00:00.000Z", now)).toBe(
      "Hace 3 h",
    );
  });

  it("handles null", () => {
    expect(formatRelativeTime(null, now)).toBe("—");
  });
});
