import { describe, expect, it } from "vitest";
import {
  clientContactFormDataToCreateDto,
  clientContactFormSchema,
} from "./clientContactSchema";

describe("clientContactSchema", () => {
  it("requiere nombre completo", () => {
    const result = clientContactFormSchema.safeParse({
      fullName: "",
      signsCartaPorte: false,
      receivesInvoices: false,
      authorizesPayments: false,
      isPrimary: false,
    });
    expect(result.success).toBe(false);
  });

  it("valida email opcional", () => {
    const invalid = clientContactFormSchema.safeParse({
      fullName: "Ana",
      email: "not-an-email",
      signsCartaPorte: false,
      receivesInvoices: false,
      authorizesPayments: false,
      isPrimary: false,
    });
    expect(invalid.success).toBe(false);

    const valid = clientContactFormSchema.safeParse({
      fullName: "Ana",
      email: "",
      signsCartaPorte: true,
      receivesInvoices: false,
      authorizesPayments: false,
      isPrimary: true,
    });
    expect(valid.success).toBe(true);
  });

  it("clientContactFormDataToCreateDto normaliza vacíos a null", () => {
    const dto = clientContactFormDataToCreateDto({
      fullName: "  Ana  ",
      position: "",
      email: "",
      phone: "3312345678",
      secondaryPhone: "",
      signsCartaPorte: true,
      receivesInvoices: false,
      authorizesPayments: false,
      isPrimary: true,
      notes: "",
    });
    expect(dto.fullName).toBe("Ana");
    expect(dto.position).toBeNull();
    expect(dto.email).toBeNull();
    expect(dto.isPrimary).toBe(true);
  });
});
