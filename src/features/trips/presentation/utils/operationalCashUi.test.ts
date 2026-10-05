import { describe, expect, it } from "vitest";
import { cfdiEmissionIntentCopy } from "../copy/cfdiEmissionIntentCopy";
import {
  operationalCashErrorToast,
  operationalCashStatusBadgeVariant,
  operationalCashStatusLabel,
} from "./operationalCashUi";

describe("operationalCashUi", () => {
  it("maps status labels and badge variants", () => {
    expect(operationalCashStatusLabel("pending")).toBe(
      cfdiEmissionIntentCopy.cash.statusPending,
    );
    expect(operationalCashStatusLabel("partial")).toBe(
      cfdiEmissionIntentCopy.cash.statusPartial,
    );
    expect(operationalCashStatusLabel("collected")).toBe(
      cfdiEmissionIntentCopy.cash.statusCollected,
    );
    expect(operationalCashStatusBadgeVariant("pending")).toBe("neutral");
    expect(operationalCashStatusBadgeVariant("partial")).toBe("warning");
    expect(operationalCashStatusBadgeVariant("collected")).toBe("success");
  });

  it("maps API error codes to toast titles", () => {
    expect(
      operationalCashErrorToast(
        { code: "TRIP_OPERATIONAL_CASH_EXCEEDS_RATE", message: "x" },
        "create",
      ).title,
    ).toBe(cfdiEmissionIntentCopy.cash.toast.exceedsRate);
    expect(
      operationalCashErrorToast(
        { code: "TRIP_OPERATIONAL_CASH_RECEIPT_ALREADY_VOIDED", message: "x" },
        "void",
      ).title,
    ).toBe(cfdiEmissionIntentCopy.cash.toast.alreadyVoided);
  });
});
