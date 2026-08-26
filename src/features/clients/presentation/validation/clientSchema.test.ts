import { describe, expect, it } from "vitest";
import {
  clientEditFormSchema,
  clientFormDataToUpdateDto,
  clientFormSchema,
  clientToFormValues,
  createClientFormSchema,
  defaultClientFormValues,
} from "./clientSchema";
import type { Client } from "../../domain";

const validCompanyValues = {
  ...defaultClientFormValues,
  type: "company" as const,
  legalName: "Transportes Demo SA de CV",
  taxId: "AAA010101AAA",
  taxRegime: "601",
  paymentTerms: "cash" as const,
  creditDays: 0,
};

describe("clientSchema", () => {
  it("createClientFormSchema acepta alta mínima válida", () => {
    const result = createClientFormSchema.safeParse(validCompanyValues);
    expect(result.success).toBe(true);
  });

  it("clientFormSchema (wizard) acepta alta mínima válida", () => {
    const result = clientFormSchema.safeParse(validCompanyValues);
    expect(result.success).toBe(true);
  });

  it("clientFormSchema exige nombre si hay teléfono o correo de contacto", () => {
    const result = clientFormSchema.safeParse({
      ...validCompanyValues,
      contactName: "",
      phone: "5512345678",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "contactName"),
      ).toBe(true);
    }
  });

  it("createClientFormSchema rechaza RFC inválido para persona moral", () => {
    const result = createClientFormSchema.safeParse({
      ...validCompanyValues,
      taxId: "XAXX010101000",
    });
    expect(result.success).toBe(false);
  });

  it("createClientFormSchema rechaza tradeName mayor a 200 caracteres", () => {
    const result = createClientFormSchema.safeParse({
      ...validCompanyValues,
      tradeName: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("clientEditFormSchema acepta los mismos campos de edición completa", () => {
    const result = clientEditFormSchema.safeParse(validCompanyValues);
    expect(result.success).toBe(true);
  });

  it("clientFormDataToUpdateDto incluye invoiceAutoDispatchEnabled", () => {
    const dto = clientFormDataToUpdateDto({
      ...validCompanyValues,
      invoiceAutoDispatchEnabled: true,
      billingSchemeId: "11111111-1111-4111-8111-111111111111",
    });
    expect(dto.invoiceAutoDispatchEnabled).toBe(true);
    expect(dto.billingSchemeId).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("clientToFormValues defaulta invoiceAutoDispatchEnabled a false", () => {
    const client = {
      id: "c1",
      tenantId: "t1",
      clientCode: "CLI-1",
      type: "company",
      legalName: "Transportes Demo SA de CV",
      taxId: "AAA010101AAA",
      taxRegime: "601",
      paymentTerms: "cash",
      creditDays: 0,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Client;
    expect(clientToFormValues(client).invoiceAutoDispatchEnabled).toBe(false);
  });

  it("clientToFormValues + clientFormDataToUpdateDto redondean opcionales vacíos", () => {
    const client = {
      id: "c1",
      tenantId: "t1",
      clientCode: "CLI-1",
      type: "company",
      legalName: "Transportes Demo SA de CV",
      tradeName: undefined,
      taxId: "aaa010101aaa",
      taxRegime: "601",
      paymentTerms: "cash",
      creditDays: 0,
      isActive: true,
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    } as Client;

    const formValues = clientToFormValues(client);
    expect(formValues.taxId).toBe("AAA010101AAA");
    expect(formValues.tradeName).toBe("");

    const dto = clientFormDataToUpdateDto(formValues);
    expect(dto.tradeName).toBeNull();
    expect(dto.taxId).toBe("AAA010101AAA");
    expect(dto.legalName).toBe("Transportes Demo SA de CV");
    expect(dto).not.toHaveProperty("contactName");
    expect(dto).not.toHaveProperty("contactPosition");
    expect(dto).not.toHaveProperty("phone");
    expect(dto).not.toHaveProperty("secondaryPhone");
    expect(dto).not.toHaveProperty("email");
    expect(dto.invoiceAutoDispatchEnabled).toBe(false);
  });

  it("clientFormDataToUpdateDto omite contactos legacy aunque el form los tenga", () => {
    const dto = clientFormDataToUpdateDto({
      ...validCompanyValues,
      contactName: "Ana",
      contactPosition: "Compras",
      phone: "5512345678",
      secondaryPhone: "5599999999",
      email: "ana@acme.test",
      billingEmail: "billing@acme.test",
    });
    expect(dto.billingEmail).toBe("billing@acme.test");
    expect(dto).not.toHaveProperty("contactName");
    expect(dto).not.toHaveProperty("phone");
    expect(dto).not.toHaveProperty("email");
  });
});
