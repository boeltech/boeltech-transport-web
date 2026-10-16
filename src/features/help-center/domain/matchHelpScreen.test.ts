import { describe, expect, it } from "vitest";
import { matchHelpScreen } from "./matchHelpScreen";

describe("matchHelpScreen", () => {
  it("matches static screens exactly", () => {
    expect(
      matchHelpScreen("/finance/invoiceable", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(true);
  });

  it("matches billing-schemes leaf path for frecuencias-envio", () => {
    expect(
      matchHelpScreen("/settings/billing-schemes", [
        "/settings/billing-schemes",
      ]),
    ).toBe(true);
    expect(
      matchHelpScreen("/finance/dispatch/period", [
        "/settings/billing-schemes",
      ]),
    ).toBe(false);
  });

  it("matches :id patterns against UUID pathnames", () => {
    expect(
      matchHelpScreen("/invoices/a1b2c3d4-e5f6-7890-abcd-ef1234567890", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(true);
  });

  it("does not match a different static route", () => {
    expect(
      matchHelpScreen("/finance/cobros", [
        "/finance/invoiceable",
        "/invoices/:id",
      ]),
    ).toBe(false);
  });

  it("ignores query string on the pathname", () => {
    expect(
      matchHelpScreen("/invoices/abc-123?tab=pdf", ["/invoices/:id"]),
    ).toBe(true);
  });
});
