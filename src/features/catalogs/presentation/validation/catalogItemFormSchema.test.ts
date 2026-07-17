import { describe, expect, it } from "vitest";
import {
  catalogItemEditFormSchema,
  catalogItemFormSchema,
} from "./catalogItemFormSchema";

describe("catalogItemFormSchema", () => {
  it("rejects empty code and name on create", () => {
    const result = catalogItemFormSchema.safeParse({
      code: "",
      name: "",
      sortOrder: 0,
      isActive: true,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.code).toBeDefined();
      expect(result.error.flatten().fieldErrors.name).toBeDefined();
    }
  });

  it("rejects invalid code characters", () => {
    const result = catalogItemFormSchema.safeParse({
      code: "tipo vehículo",
      name: "Válido",
      sortOrder: 0,
      isActive: true,
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid create payload", () => {
    const result = catalogItemFormSchema.safeParse({
      code: "tracto",
      name: "Tractocamión",
      description: "Unidad pesada",
      parentCode: "",
      sortOrder: 1,
      isActive: true,
    });

    expect(result.success).toBe(true);
  });

  it("edit schema omits code and requires name", () => {
    const missingName = catalogItemEditFormSchema.safeParse({
      name: "",
      sortOrder: 0,
      isActive: true,
    });
    expect(missingName.success).toBe(false);

    const valid = catalogItemEditFormSchema.safeParse({
      name: "Actualizado",
      sortOrder: 2,
      isActive: false,
    });
    expect(valid.success).toBe(true);
  });
});
