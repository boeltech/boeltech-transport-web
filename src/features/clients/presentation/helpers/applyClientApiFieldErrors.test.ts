import { describe, expect, it } from "vitest";
import { resolveClientCreateApiField } from "./applyClientApiFieldErrors";

describe("resolveClientCreateApiField", () => {
  it("maps client snake_case API paths to client form fields", () => {
    expect(resolveClientCreateApiField("tax_id")).toEqual({
      form: "client",
      field: "taxId",
    });
    expect(resolveClientCreateApiField("legal_name")).toEqual({
      form: "client",
      field: "legalName",
    });
  });

  it("maps nested billing address paths to address form fields", () => {
    expect(resolveClientCreateApiField("billing_address.postal_code")).toEqual({
      form: "address",
      field: "postalCode",
    });
    expect(resolveClientCreateApiField("billingAddress.satStateCode")).toEqual({
      form: "address",
      field: "satStateCode",
    });
  });

  it("accepts camelCase client fields", () => {
    expect(resolveClientCreateApiField("taxRegime")).toEqual({
      form: "client",
      field: "taxRegime",
    });
  });

  it("returns null for unknown or general fields", () => {
    expect(resolveClientCreateApiField("general")).toBeNull();
    expect(resolveClientCreateApiField("unknown_field")).toBeNull();
  });

  it("splits mixed validation payload into client vs address targets", () => {
    const entries = [
      { field: "tax_id", message: "RFC ya registrado" },
      { field: "billing_address.postal_code", message: "CP inválido" },
      { field: "general", message: "Revisa el alta" },
    ];

    const clientFields: string[] = [];
    const addressFields: string[] = [];
    const unmapped: string[] = [];

    for (const entry of entries) {
      const target = resolveClientCreateApiField(entry.field);
      if (target?.form === "client") clientFields.push(target.field);
      else if (target?.form === "address") addressFields.push(target.field);
      else if (entry.message.trim()) unmapped.push(entry.message);
    }

    expect(clientFields).toEqual(["taxId"]);
    expect(addressFields).toEqual(["postalCode"]);
    expect(unmapped).toEqual(["Revisa el alta"]);
  });
});
