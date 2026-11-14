import { describe, expect, it } from "vitest";
import { buildClientOperationalReceiptBatchHref } from "../../application/financeRoutes";
import {
  isOperationalCashPendingHref,
  resolveOperationalReceiptBatchCreateBackHref,
  resolveOperationalReceiptBatchCreateSuccessHref,
} from "./operationalCashPendingWayfinding";

describe("operationalCashPendingWayfinding", () => {
  it("detects canonical and legacy tray paths", () => {
    expect(
      isOperationalCashPendingHref("/finance/operational-cash-pending"),
    ).toBe(true);
    expect(
      isOperationalCashPendingHref(
        "/finance/operational-cash-pending?clientId=c-1&page=2",
      ),
    ).toBe(true);
    expect(
      isOperationalCashPendingHref("/finance/efectivo-por-cobrar?page=1"),
    ).toBe(true);
    expect(isOperationalCashPendingHref("/clients/c-1")).toBe(false);
    expect(isOperationalCashPendingHref("https://evil.example/")).toBe(false);
  });

  it("returns tray with query when from is the bandeja", () => {
    expect(
      resolveOperationalReceiptBatchCreateBackHref(
        "/finance/operational-cash-pending?clientId=c-1&page=2",
        "c-1",
      ),
    ).toBe("/finance/operational-cash-pending?clientId=c-1&page=2");
  });

  it("falls back to client detail without tray origin", () => {
    expect(
      resolveOperationalReceiptBatchCreateBackHref(undefined, "c-1"),
    ).toBe("/clients/c-1");
    expect(
      resolveOperationalReceiptBatchCreateBackHref("/clients", "c-1"),
    ).toBe("/clients/c-1");
    expect(
      resolveOperationalReceiptBatchCreateBackHref("//evil.example", "c-1"),
    ).toBe("/clients/c-1");
  });

  it("success from bandeja returns tray with query intact", () => {
    expect(
      resolveOperationalReceiptBatchCreateSuccessHref(
        "/finance/operational-cash-pending?clientId=c-1&page=2",
        "c-1",
        "batch-1",
      ),
    ).toBe("/finance/operational-cash-pending?clientId=c-1&page=2");
  });

  it("success from ficha or undefined lands on ficha with ?batch=", () => {
    const expected = buildClientOperationalReceiptBatchHref("c-1", "batch-1");
    expect(
      resolveOperationalReceiptBatchCreateSuccessHref(
        undefined,
        "c-1",
        "batch-1",
      ),
    ).toBe(expected);
    expect(
      resolveOperationalReceiptBatchCreateSuccessHref(
        "/clients/c-1",
        "c-1",
        "batch-1",
      ),
    ).toBe(expected);
  });
});
