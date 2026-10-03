import { describe, expect, it } from "vitest";
import {
  batchAssignmentFormSchema,
  compensationTemplateFormSchema,
  corridorTariffCreateFormSchema,
  corridorTariffFormSchema,
  corridorTariffLegacySoftFormSchema,
  templateDeductionSchema,
  templateFixedAllowanceSchema,
} from "./compensationSchemas";

const employeeUuid = "22222222-2222-4222-8222-222222222222";
const branchUuid = "11111111-1111-4111-8111-111111111111";

describe("corridorTariffCreateFormSchema", () => {
  it("acepta city_label con texto libre y normaliza", () => {
    const parsed = corridorTariffCreateFormSchema.safeParse({
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
      expect(parsed.data.originRefType).toBe("city_label");
      expect(parsed.data.destinationRefType).toBe("city_label");
    }
  });

  it("rechaza tarifa fija en 0", () => {
    const parsed = corridorTariffCreateFormSchema.safeParse({
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

  it("rechaza branch (create estrecho)", () => {
    const parsed = corridorTariffCreateFormSchema.safeParse({
      name: "Ruta sucursal",
      originRefType: "branch",
      originRefValue: branchUuid,
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("rechaza código postal (create estrecho)", () => {
    const parsed = corridorTariffCreateFormSchema.safeParse({
      name: "Ruta CP",
      originRefType: "postal_code",
      originRefValue: "64000",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1000,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });

  it("alias corridorTariffFormSchema apunta al create estrecho", () => {
    expect(corridorTariffFormSchema).toBe(corridorTariffCreateFormSchema);
  });
});

describe("corridorTariffLegacySoftFormSchema", () => {
  it("acepta hidratar origin branch sin exigir ciudad", () => {
    const parsed = corridorTariffLegacySoftFormSchema.safeParse({
      name: "Legacy branch",
      originRefType: "branch",
      originRefValue: branchUuid,
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1200,
      notes: null,
      isActive: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("acepta refs postal_code / dest branch", () => {
    const parsed = corridorTariffLegacySoftFormSchema.safeParse({
      name: "Legacy dead",
      originRefType: "postal_code",
      originRefValue: "64000",
      destinationRefType: "branch",
      destinationRefValue: branchUuid,
      fixedAmount: 900,
      isActive: false,
    });

    expect(parsed.success).toBe(true);
  });

  it("sigue exigiendo tarifa > 0", () => {
    const parsed = corridorTariffLegacySoftFormSchema.safeParse({
      name: "Sin monto",
      originRefType: "branch",
      originRefValue: branchUuid,
      destinationRefType: "city_label",
      destinationRefValue: "MTY",
      fixedAmount: 0,
      isActive: true,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("templateFixedAllowanceSchema", () => {
  it("acepta tipos de pago fijo expandidos", () => {
    const parsed = templateFixedAllowanceSchema.safeParse({
      allowanceType: "per_diem",
      label: "Viáticos",
      amount: 300,
      period: "weekly",
      isMandatory: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("acepta aportación patronal", () => {
    const parsed = templateFixedAllowanceSchema.safeParse({
      allowanceType: "employer_contribution",
      label: "Aportación patronal",
      amount: 150,
      period: "monthly",
      isMandatory: false,
    });

    expect(parsed.success).toBe(true);
  });
});

describe("templateDeductionSchema", () => {
  it("acepta deducciones de tarifa", () => {
    const parsed = templateDeductionSchema.safeParse({
      deductionType: "savings_fund",
      label: "Fondo de ahorro",
      amount: 200,
      period: "weekly",
      isMandatory: true,
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza deductionType desconocido", () => {
    const parsed = templateDeductionSchema.safeParse({
      deductionType: "not_real",
      label: "X",
      amount: 10,
      period: "weekly",
      isMandatory: true,
    });

    expect(parsed.success).toBe(false);
  });
});

describe("compensationTemplateFormSchema", () => {
  it("incluye deductions vacías por default", () => {
    const parsed = compensationTemplateFormSchema.safeParse({
      name: "Tarifa demo",
      rules: [],
      fixedAllowances: [],
      corridorIds: [],
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.deductions).toEqual([]);
    }
  });

  it("acepta una regla por cada clase de ruta", () => {
    const parsed = compensationTemplateFormSchema.safeParse({
      name: "Tarifa mixta",
      rules: [
        {
          routeType: "local",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
        {
          routeType: "long_haul",
          commissionType: "percentage_of_freight",
          rateValue: 30,
          minimumGuaranteedAmount: 0,
        },
        {
          routeType: "transfer",
          commissionType: "fixed_per_trip",
          rateValue: 200,
          minimumGuaranteedAmount: 0,
        },
      ],
      fixedAllowances: [],
      corridorIds: [],
    });

    expect(parsed.success).toBe(true);
  });

  it("rechaza dos reglas con el mismo routeType", () => {
    const parsed = compensationTemplateFormSchema.safeParse({
      name: "Tarifa duplicada",
      rules: [
        {
          routeType: "local",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
        },
        {
          routeType: "local",
          commissionType: "percentage_of_freight",
          rateValue: 30,
          minimumGuaranteedAmount: 0,
        },
      ],
      fixedAllowances: [],
      corridorIds: [],
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issue = parsed.error.issues.find(
        (entry) =>
          entry.path.join(".") === "rules.1.routeType" &&
          entry.message.includes("Solo se permite una"),
      );
      expect(issue).toBeDefined();
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
