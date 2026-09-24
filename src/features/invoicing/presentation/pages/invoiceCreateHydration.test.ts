import { describe, expect, it } from "vitest";
import {
  invoiceCreateHydrationKey,
  shouldHydrateInvoiceCreate,
  shouldPreserveSeededInvoiceConcepts,
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
    expect(shouldHydrateInvoiceCreate(key, "trip-a", "split_share")).toBe(true);
  });

  it("includes legId in hydration key for split_share", () => {
    expect(
      invoiceCreateHydrationKey("trip-a", "split_share", "leg-1"),
    ).toBe("trip-a:split_share:leg-1");
    const key = invoiceCreateHydrationKey("trip-a", "split_share", "leg-1");
    expect(
      shouldHydrateInvoiceCreate(key, "trip-a", "split_share", {
        legId: "leg-2",
      }),
    ).toBe(true);
    expect(
      shouldHydrateInvoiceCreate(key, "trip-a", "split_share", {
        legId: "leg-1",
        formIsDirty: true,
      }),
    ).toBe(false);
  });

  it("does not hydrate without a trip id", () => {
    expect(
      shouldHydrateInvoiceCreate(null, "", "primary_transport"),
    ).toBe(false);
  });

  it("preserves seeded concepts on a later prefill of the same key", () => {
    const key = invoiceCreateHydrationKey("trip-a", "primary_transport");
    expect(
      shouldPreserveSeededInvoiceConcepts(null, "trip-a", "primary_transport"),
    ).toBe(false);
    expect(
      shouldPreserveSeededInvoiceConcepts(key, "trip-a", "primary_transport"),
    ).toBe(true);
    expect(
      shouldPreserveSeededInvoiceConcepts(key, "trip-b", "primary_transport"),
    ).toBe(false);
  });
});
