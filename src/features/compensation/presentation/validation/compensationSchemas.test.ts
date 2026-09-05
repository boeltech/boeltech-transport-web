import { describe, expect, it } from "vitest";
import { batchAssignmentFormSchema, corridorTariffFormSchema } from "./compensationSchemas";

const employeeUuid = "22222222-2222-4222-8222-222222222222";
const branchUuid = "11111111-1111-4111-8111-111111111111";

describe("corridorTariffFormSchema", () => {
  it("acepta city_label con texto libre", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "CDMX → MTY",
      originRefType: "city_label",
      originRefValue: "Ciudad de México",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1500,
      isActive: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.originRefValue).toBe("ciudad de méxico");
      expect(parsed.data.destinationRefValue).toBe("monterrey");
    }
  });

  it("rechaza tarifa fija en 0", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "Ruta cero",
      originRefType: "city_label",
      originRefValue: "CDMX",
      destinationRefType: "city_label",
      destinationRefValue: "MTY",
      fixedAmount: 0,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("rechaza branch con refValue sin UUID", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "Ruta sucursal",
      originRefType: "branch",
      originRefValue: "not-a-uuid",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("acepta branch con UUID válido", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "Ruta sucursal",
      originRefType: "branch",
      originRefValue: branchUuid,
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza código postal inválido", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "Ruta CP",
      originRefType: "postal_code",
      originRefValue: "6400",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("acepta código postal de 5 dígitos", () => {
    const parsed = corridorTariffFormSchema.safeParse({
      name: "Ruta CP",
      originRefType: "postal_code",
      originRefValue: "64000",
      destinationRefType: "postal_code",
      destinationRefValue: "06600",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.originRefValue).toBe("64000");
      expect(parsed.data.destinationRefValue).toBe("06600");
    }
  });
});

describe("batchAssignmentFormSchema", () => {
  it("acepta un operador con fechas válidas", () => {
    const parsed = batchAssignmentFormSchema.safeParse({
      employeeIds: [employeeUuid],
      effectiveFrom: "2026-09-01",
      effectiveTo: "",
      closePreviousAssignment: true,
      reason: "",
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza más de 100 operadores", () => {
    const employeeIds = Array.from({ length: 101 }, (_, index) =>
      `aaaaaaaa-aaaa-4aaa-8aaa-${String(index).padStart(12, "0")}`,
    );

    const parsed = batchAssignmentFormSchema.safeParse({
      employeeIds,
      effectiveFrom: "2026-09-01",
      effectiveTo: "",
      closePreviousAssignment: true,
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const employeeErrors = parsed.error.flatten().fieldErrors.employeeIds;
      expect(employeeErrors?.some((message) => message.includes("100"))).toBe(true);
    }
  });
});
