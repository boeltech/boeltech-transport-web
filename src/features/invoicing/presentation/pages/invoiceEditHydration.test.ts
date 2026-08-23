import { describe, expect, it } from "vitest";
import {
  invoiceEditHydrationKey,
  shouldHydrateInvoiceEdit,
} from "./invoiceEditHydration";

describe("shouldHydrateInvoiceEdit", () => {
  it("hydrates when nothing has been hydrated yet", () => {
    expect(shouldHydrateInvoiceEdit(null, "inv-a")).toBe(true);
  });

  it("re-hydrates a pristine form when detail identity changes", () => {
    const key = invoiceEditHydrationKey("inv-a");
    expect(shouldHydrateInvoiceEdit(key, "inv-a")).toBe(true);
    expect(
      shouldHydrateInvoiceEdit(key, "inv-a", { formIsDirty: false }),
    ).toBe(true);
  });

  it("does not re-hydrate the same invoice when the user already edited", () => {
    const key = invoiceEditHydrationKey("inv-a");
    expect(
      shouldHydrateInvoiceEdit(key, "inv-a", { formIsDirty: true }),
    ).toBe(false);
  });

  it("hydrates when navigating to a different invoice", () => {
    const key = invoiceEditHydrationKey("inv-a");
    expect(shouldHydrateInvoiceEdit(key, "inv-b")).toBe(true);
  });

  it("does not hydrate without an invoice id", () => {
    expect(shouldHydrateInvoiceEdit(null, "")).toBe(false);
  });
});
