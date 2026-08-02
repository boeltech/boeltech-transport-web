import { describe, expect, it } from "vitest";
import {
  clientFormDataToUpdateDto,
  clientToFormValues,
  createClientFormSchema,
  defaultClientFormValues,
  updateClientFormSchema,
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

  it("updateClientFormSchema acepta los mismos campos de edición completa", () => {
    const result = updateClientFormSchema.safeParse(validCompanyValues);
    expect(result.success).toBe(true);
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
    expect(dto.tradeName).toBeUndefined();
    expect(dto.taxId).toBe("AAA010101AAA");
    expect(dto.legalName).toBe("Transportes Demo SA de CV");
  });
});
