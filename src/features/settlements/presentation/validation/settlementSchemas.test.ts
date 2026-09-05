import { describe, expect, it } from "vitest";
import {
  compensationAgreementFormSchema,
  compensationAgreementRuleSchema,
  driverAdvanceFormSchema,
  previewSettlementQuerySchema,
  createSettlementFormSchema,
  disburseSettlementFormSchema,
} from "./settlementSchemas";

describe("Settlement Validation Schemas (Fase 0)", () => {
  describe("compensationAgreementFormSchema", () => {
    it("valida un acuerdo compuesto con sueldo base semanal y reglas por ruta (ADR-0086)", () => {
      const compositeData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        hasFixedSalary: true,
        fixedSalaryAmount: 3500,
        fixedSalaryPeriod: "weekly" as const,
        isSalaryGuaranteed: true,
        currency: "MXN" as const,
        effectiveFrom: "2026-09-01",
        rules: [
          {
            routeType: "long_haul" as const,
            commissionType: "rate_per_km" as const,
            rateValue: 2.5,
            minimumGuaranteedAmount: 500,
            notes: "Comisi?n for?nea est?ndar",
          },
          {
            routeType: "local" as const,
            commissionType: "none" as const,
            rateValue: 0,
            minimumGuaranteedAmount: 0,
            notes: "Local sin comisi?n",
          },
        ],
        notes: "Esquema compuesto piloto",
      };

      const result = compensationAgreementFormSchema.safeParse(compositeData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.hasFixedSalary).toBe(true);
        expect(result.data.fixedSalaryAmount).toBe(3500);
        expect(result.data.rules).toHaveLength(2);
      }
    });

    it("valida un acuerdo v?lido con tarifa por km (legacy ADR-0085)", () => {
      const validData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        calculationType: "rate_per_km" as const,
        baseRate: 0,
        ratePerKm: 2.5,
        percentageRate: 0,
        helperDailyRate: 0,
        currency: "MXN" as const,
        effectiveFrom: "2026-08-01",
        effectiveTo: "2026-12-31",
        notes: "Acuerdo semestral",
      };

      const result = compensationAgreementFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rechaza si effectiveFrom es posterior a effectiveTo", () => {
      const invalidData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        calculationType: "fixed_per_trip" as const,
        baseRate: 500,
        effectiveFrom: "2026-09-01",
        effectiveTo: "2026-08-01",
      };

      const result = compensationAgreementFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toContain("effectiveTo");
      }
    });

    it("rechaza si hay reglas con routeType duplicado (H2)", () => {
      const duplicateRulesData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        hasFixedSalary: true,
        fixedSalaryAmount: 3000,
        effectiveFrom: "2026-09-01",
        rules: [
          {
            routeType: "long_haul" as const,
            commissionType: "rate_per_km" as const,
            rateValue: 3.0,
          },
          {
            routeType: "long_haul" as const,
            commissionType: "fixed_per_trip" as const,
            rateValue: 500,
          },
        ],
      };

      const result = compensationAgreementFormSchema.safeParse(duplicateRulesData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("rules"))).toBe(true);
      }
    });

    it("rechaza si no tiene ni sueldo fijo ni reglas ni tarifas legacy (H2)", () => {
      const emptyData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        hasFixedSalary: false,
        fixedSalaryAmount: 0,
        rules: [],
        baseRate: 0,
        ratePerKm: 0,
        percentageRate: 0,
        helperDailyRate: 0,
        effectiveFrom: "2026-09-01",
      };

      const result = compensationAgreementFormSchema.safeParse(emptyData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((issue) => issue.path.includes("rules"))).toBe(true);
      }
    });
  });

  describe("compensationAgreementRuleSchema", () => {
    it("valida una regla v?lida por tipo de ruta", () => {
      const rule = {
        routeType: "long_haul" as const,
        commissionType: "rate_per_km" as const,
        rateValue: 3.2,
        minimumGuaranteedAmount: 400,
        notes: "Tarifa carretera federal",
      };
      const result = compensationAgreementRuleSchema.safeParse(rule);
      expect(result.success).toBe(true);
    });

    it("rechaza una regla con tarifa negativa", () => {
      const rule = {
        routeType: "local" as const,
        commissionType: "fixed_per_trip" as const,
        rateValue: -50,
      };
      const result = compensationAgreementRuleSchema.safeParse(rule);
      expect(result.success).toBe(false);
    });
  });

  describe("driverAdvanceFormSchema", () => {
    it("valida un anticipo de viaje positivo con submitForApproval por defecto true", () => {
      const validData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        amount: 1500,
        category: "travel_advance" as const,
        paymentMethod: "bank_transfer" as const,
        bankReference: "SPEI-00123",
      };

      const result = driverAdvanceFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.submitForApproval).toBe(true);
      }
    });

    it("rechaza un monto no positivo o indefinido", () => {
      const invalidData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        amount: 0,
        category: "fuel" as const,
      };

      const result = driverAdvanceFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("El monto debe ser mayor a 0");
      }

      const undefinedAmount = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        category: "fuel" as const,
      };
      const resultUndef = driverAdvanceFormSchema.safeParse(undefinedAmount);
      expect(resultUndef.success).toBe(false);
      if (!resultUndef.success) {
        expect(resultUndef.error.issues[0]?.message).toBe("El monto debe ser mayor a 0");
      }
    });
  });

  describe("previewSettlementQuerySchema", () => {
    it("valida query de preview con periodo congruente", () => {
      const validData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
      };

      const result = previewSettlementQuerySchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rechaza fechas con formato err?neo", () => {
      const invalidData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        periodStart: "01/08/2026",
        periodEnd: "15/08/2026",
      };

      const result = previewSettlementQuerySchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("createSettlementFormSchema", () => {
    it("valida creaci?n de liquidaci?n con anticipos y sin customItems", () => {
      const validData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        tripIds: ["a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"],
        advancesToApply: [
          {
            advanceId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            amountToDeduct: 1000,
          },
        ],
        customItems: [],
        submitForApproval: true,
      };

      const result = createSettlementFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rechaza anticipos con amountToDeduct menor o igual a 0", () => {
      const invalidData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        advancesToApply: [
          {
            advanceId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
            amountToDeduct: 0,
          },
        ],
      };

      const result = createSettlementFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("El monto a deducir debe ser mayor a 0");
      }
    });

    it("rechaza customItems no vac?os (H4)", () => {
      const invalidData = {
        employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        customItems: [
          {
            itemType: "bonus" as const,
            description: "Bono no permitido",
            amount: 500,
          },
        ],
      };

      const result = createSettlementFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("disburseSettlementFormSchema", () => {
    it("valida dispersi?n con folio y m?todo", () => {
      const validData = {
        disbursementMethod: "bank_transfer" as const,
        disbursementReference: "SPEI-BBVA-9944",
        disbursedAt: "2026-08-16T12:00:00Z",
        notes: "Dispersi?n quincenal",
      };

      const result = disburseSettlementFormSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rechaza referencia bancaria con solo espacios en blanco tras trim", () => {
      const invalidData = {
        disbursementMethod: "bank_transfer" as const,
        disbursementReference: "   ",
        disbursedAt: "2026-08-16T12:00:00Z",
        notes: "",
      };

      const result = disburseSettlementFormSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe("La referencia o folio de pago es obligatoria");
      }
    });

    it("aplica trim a disbursementReference y notes", () => {
      const dataWithSpaces = {
        disbursementMethod: "bank_transfer" as const,
        disbursementReference: "  SPEI-998811  ",
        disbursedAt: "  2026-08-16T12:00:00Z  ",
        notes: "  Pago efectuado  ",
      };

      const result = disburseSettlementFormSchema.safeParse(dataWithSpaces);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.disbursementReference).toBe("SPEI-998811");
        expect(result.data.disbursedAt).toBe("2026-08-16T12:00:00Z");
        expect(result.data.notes).toBe("Pago efectuado");
      }
    });
  });
});
