import { describe, expect, it } from "vitest";
import { mapLastCollection, mapClientByChannel } from "./clientContactMappers";

describe("mapLastCollection", () => {
  it("maps a with_invoice last-collection", () => {
    const result = mapLastCollection({
      channel: "with_invoice",
      ref: { channel: "with_invoice", payment_id: "pay-1" },
      amount: 8000,
      at: "2026-11-12T10:00:00Z",
      label: "Transferencia",
    });

    expect(result).toEqual({
      channel: "with_invoice",
      ref: { channel: "with_invoice", paymentId: "pay-1" },
      amount: 8000,
      at: "2026-11-12T10:00:00Z",
      label: "Transferencia",
    });
  });

  it("maps a without_invoice batch last-collection", () => {
    const result = mapLastCollection({
      channel: "without_invoice",
      ref: { channel: "without_invoice", kind: "batch", batch_id: "b-1" },
      amount: 5000,
      at: "2026-11-10T08:00:00Z",
      label: "Efectivo",
    });

    expect(result).toEqual({
      channel: "without_invoice",
      ref: { channel: "without_invoice", kind: "batch", batchId: "b-1" },
      amount: 5000,
      at: "2026-11-10T08:00:00Z",
      label: "Efectivo",
    });
  });

  it("returns null for null input", () => {
    expect(mapLastCollection(null)).toBeNull();
  });
});

describe("mapClientByChannel", () => {
  it("maps the by_channel block", () => {
    const result = mapClientByChannel({
      with_invoice: { balance: 24360, count: 2, oldest_at: "2026-10-28" },
      without_invoice: { balance: 22600, count: 4, oldest_at: "2026-10-30" },
    });

    expect(result).toEqual({
      withInvoice: { balance: 24360, count: 2, oldestAt: "2026-10-28" },
      withoutInvoice: { balance: 22600, count: 4, oldestAt: "2026-10-30" },
    });
  });

  it("defaults to zeros on null input", () => {
    const result = mapClientByChannel(null);
    expect(result.withInvoice.balance).toBe(0);
    expect(result.withoutInvoice.balance).toBe(0);
  });

  it("handles missing oldest_at as null", () => {
    const result = mapClientByChannel({
      with_invoice: { balance: 1000, count: 1 },
      without_invoice: { balance: 0, count: 0 },
    });
    expect(result.withInvoice.oldestAt).toBeNull();
  });
});
