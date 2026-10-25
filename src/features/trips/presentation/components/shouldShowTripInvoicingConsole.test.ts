import { describe, expect, it } from "vitest";

import { TripStatus } from "@features/trips/domain";

import { shouldCollapseTripInvoicingConsoleByDefault } from "./shouldShowTripInvoicingConsole";

describe("shouldCollapseTripInvoicingConsoleByDefault (F4)", () => {
  it("colapsa en in_progress sin ATF", () => {
    expect(
      shouldCollapseTripInvoicingConsoleByDefault({
        status: TripStatus.IN_PROGRESS,
        requiresFiscalAttention: false,
      }),
    ).toBe(true);
  });

  it("no colapsa en in_progress con ATF", () => {
    expect(
      shouldCollapseTripInvoicingConsoleByDefault({
        status: TripStatus.IN_PROGRESS,
        requiresFiscalAttention: true,
      }),
    ).toBe(false);
  });

  it("no colapsa en scheduled / completed / draft", () => {
    for (const status of [
      TripStatus.DRAFT,
      TripStatus.SCHEDULED,
      TripStatus.COMPLETED,
      TripStatus.CANCELLED,
    ] as const) {
      expect(
        shouldCollapseTripInvoicingConsoleByDefault({
          status,
          requiresFiscalAttention: false,
        }),
      ).toBe(false);
    }
  });
});
