import { describe, expect, it } from "vitest";
import {
  invoiceCreateHydrationKey,
  shouldHydrateInvoiceCreate,
} from "./invoiceCreateHydration";

describe("shouldHydrateInvoiceCreate", () => {
  it("hydrates when nothing has been hydrated yet", () => {
    expect(
      shouldHydrateInvoiceCreate(null, "trip-a", "primary_transport"),
    ).toBe(true);
  });

  it("re-hydrates a pristine form when prefill identity changes", () => {
    const key = invoiceCreateHydrationKey("trip-a", "primary_transport");
    expect(
      shouldHydrateInvoiceCreate(key, "trip-a", "primary_transport"),
    ).toBe(true);
    expect(
      shouldHydrateInvoiceCreate(key, "trip-a", "primary_transport", {
        formIsDirty: false,
      }),
    ).toBe(true);
  });

  it("does not re-hydrate the same trip when the user already edited", () => {
    const key = invoiceCreateHydrationKey("trip-a", "primary_transport");
    expect(
      shouldHydrateInvoiceCreate(key, "trip-a", "primary_transport", {
        formIsDirty: true,
      }),
    ).toBe(false);
  });

  it("hydrates when navigating to a different trip", () => {
    const key = invoiceCreateHydrationKey("trip-a", "primary_transport");
    expect(
      shouldHydrateInvoiceCreate(key, "trip-b", "primary_transport"),
    ).toBe(true);
  });

  it("hydrates when scope changes on the same trip", () => {
    const key = invoiceCreateHydrationKey("trip-a", "primary_transport");
    expect(shouldHydrateInvoiceCreate(key, "trip-a", "accessory")).toBe(true);
    expect(shouldHydrateInvoiceCreate(key, "trip-a", "false_trip")).toBe(true);
  });

  it("does not hydrate without a trip id", () => {
    expect(
      shouldHydrateInvoiceCreate(null, "", "primary_transport"),
    ).toBe(false);
  });
});
