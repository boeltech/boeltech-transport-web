import { describe, expect, it } from "vitest";
import { recomputeInvoiceAmountsFromConcepts } from "@boeltech/cfdi-domain";

import {
  applyConceptTaxFlags,
  defaultInvoiceFormValues,
  defaultFleteConceptFormLine,
  invoiceCreateFormSchema,
  invoiceFormSchema,
  parseCreateInvoicePayload,
  parseDraftInvoicePayload,
} from "./invoiceFormSchema";

describe("invoiceFormSchema", () => {
  const sampleConcepts = [defaultFleteConceptFormLine(1000)];

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
      concepts: sampleConcepts,
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
      concepts: sampleConcepts,
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
      concepts: sampleConcepts,
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
      concepts: sampleConcepts,
    };

    const payload = parseCreateInvoicePayload(
      values,
      "550e8400-e29b-41d4-a716-446655440000",
    );
    expect(payload.trip_ids).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("parseDraftInvoicePayload validates form then strips UX-only fields", () => {
    const values = {
      ...defaultInvoiceFormValues(),
      receiver_rfc: "MERG881004A27",
      receiver_name: "GERARDO DANIEL MÉNDEZ RAYAS",
      receiver_tax_regime: "612",
      receiver_postal_code: "54439",
      subtotal: 1000,
      total_tax: 160,
      retained_tax: 0,
      total: 1160,
      apply_retained_tax: false,
    };

    const payload = parseDraftInvoicePayload(values);
    expect(payload).toMatchObject({
      receiver_rfc: "MERG881004A27",
      receiver_name: "GERARDO DANIEL MÉNDEZ RAYAS",
    });
    expect(payload).not.toHaveProperty("apply_retained_tax");
    expect(payload).not.toHaveProperty("trip_ids");
  });

  it("calcula IVA y retención solo en partidas que los tienen activos", () => {
    const flete = defaultFleteConceptFormLine(10000, {
      ivaAplica: true,
      retencionAplica: true,
    });
    const service = {
      ...defaultFleteConceptFormLine(1000, { ivaAplica: true, retencionAplica: false }),
      concept_type: "service" as const,
      description: "Maniobras",
    };
    const amounts = recomputeInvoiceAmountsFromConcepts(
      [flete, service],
      0,
      { tasaIva: 0.16, retainedTaxRate: 0 },
    );
    expect(amounts.subtotal).toBe(11000);
    expect(amounts.total_tax).toBe(1760);
    expect(amounts.retained_tax).toBe(400);
    expect(amounts.total).toBe(12360);
  });

  it("applyConceptTaxFlags desactiva tasas cuando no aplican", () => {
    expect(applyConceptTaxFlags(false, false, 0.16)).toEqual({
      object_imp: "02",
      iva_rate: 0,
      retained_iva_rate: 0,
    });
  });
});
