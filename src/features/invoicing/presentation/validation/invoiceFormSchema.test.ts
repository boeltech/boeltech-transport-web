import { describe, expect, it } from "vitest";

import {
  defaultInvoiceFormValues,
  invoiceCreateFormSchema,
  invoiceFormSchema,
  parseCreateInvoicePayload,
} from "./invoiceFormSchema";

describe("invoiceFormSchema", () => {
  it("requires trip_ids on create", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente SA de CV",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 1000,
      total_tax: 160,
      total: 1160,
      trip_ids: [],
    };

    const result = invoiceCreateFormSchema.safeParse(values);
    expect(result.success).toBe(false);
  });

  it("accepts valid create payload", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      trip_ids: ["550e8400-e29b-41d4-a716-446655440000"],
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente SA de CV",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 1000,
      total_tax: 160,
      total: 1160,
    };

    const result = invoiceCreateFormSchema.safeParse(values);
    expect(result.success).toBe(true);
  });

  it("accepts shared form schema without trip_ids for edit UX", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente SA de CV",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 1000,
      total_tax: 160,
      total: 1160,
    };

    const result = invoiceFormSchema.safeParse(values);
    expect(result.success).toBe(true);
  });

  it("parseCreateInvoicePayload injects trip id from URL", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: "XAXX010101000",
      receiver_name: "Cliente SA de CV",
      receiver_tax_regime: "601",
      receiver_postal_code: "64000",
      subtotal: 1000,
      total_tax: 160,
      total: 1160,
    };

    const payload = parseCreateInvoicePayload(
      values,
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(payload.trip_ids).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });
});
