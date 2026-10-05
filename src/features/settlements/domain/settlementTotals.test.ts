import { describe, expect, it } from "vitest";
import {
  applyTemplateDeductionsByPriority,
  assessDeductionCapacity,
  calculatedBaseFromStored,
  computeSettlementTotals,
  deriveManualItemIsDeduction,
  isManualSettlementItem,
  normalizeManualItems,
  uncoveredDeductionsAmount,
  type CalculatedSettlementBase,
  type ManualSettlementItemInput,
} from "./settlementTotals";

/**
 * TEC-6: mismos casos que `settlementTotals.test.ts` del API (bloque «tope de
 * descuentos contra el bruto»). Si cambia la aritmética del API, cambian igual.
 */
describe("settlementTotals web ↔ API — tope de descuentos contra el bruto (R1–R3)", () => {
  const base = (
    calculatedGross: number,
    advancesDeducted = 0,
    templateDeductions = 0,
  ): CalculatedSettlementBase => ({ calculatedGross, templateDeductions, advancesDeducted });

  describe("applyTemplateDeductionsByPriority (R2)", () => {
    const line = (deductionType: string, amount: number, id = deductionType) => ({
      id,
      deductionType,
      amount,
    });

    it("todo cabe: aplicado = solicitado, sin omitido", () => {
      expect(applyTemplateDeductionsByPriority(2000, [line("savings_fund", 300)])).toEqual([
        {
          id: "savings_fund",
          deductionType: "savings_fund",
          amount: 300,
          requestedAmount: 300,
          appliedAmount: 300,
          omittedAmount: 0,
        },
      ]);
    });

    it("bruto 1,000: retención 200 completa, fondo 900 → 800 aplicado / 100 omitido", () => {
      const result = applyTemplateDeductionsByPriority(1000, [
        line("savings_fund", 900),
        line("tax_withholding", 200),
      ]);
      expect(result.map(({ appliedAmount, omittedAmount }) => ({ appliedAmount, omittedAmount }))).toEqual([
        { appliedAmount: 800, omittedAmount: 100 },
        { appliedAmount: 200, omittedAmount: 0 },
      ]);
    });

    it("bruto 0 con fondo 300: nada se aplica y todo queda omitido (no lanza)", () => {
      const [fund] = applyTemplateDeductionsByPriority(0, [line("savings_fund", 300)]);
      expect(fund).toMatchObject({ requestedAmount: 300, appliedAmount: 0, omittedAmount: 300 });
    });

    it("prioridad: retención → cuota sindical → fondo → renta de equipo → otra; estable dentro del tipo", () => {
      const result = applyTemplateDeductionsByPriority(350, [
        line("other_deduction", 100, "o"),
        line("equipment_rental", 100, "e"),
        line("savings_fund", 100, "s1"),
        line("savings_fund", 100, "s2"),
        line("union_dues", 100, "u"),
        line("tax_withholding", 100, "t"),
      ]);
      const applied = Object.fromEntries(result.map((item) => [item.id, item.appliedAmount]));
      expect(applied).toEqual({ t: 100, u: 100, s1: 100, s2: 50, e: 0, o: 0 });
      expect(result.map((item) => item.id)).toEqual(["o", "e", "s1", "s2", "u", "t"]);
    });

    it("tipo desconocido va al final", () => {
      const result = applyTemplateDeductionsByPriority(100, [
        line("legacy_type", 100),
        line("other_deduction", 100),
      ]);
      expect(result.map((item) => item.appliedAmount)).toEqual([0, 100]);
    });

    it("trabaja en centavos: sin residuos de punto flotante", () => {
      const result = applyTemplateDeductionsByPriority(0.3, [
        line("tax_withholding", 0.1),
        line("union_dues", 0.2),
        line("savings_fund", 0.05),
      ]);
      expect(result.map((item) => item.appliedAmount)).toEqual([0.1, 0.2, 0]);
      expect(result[2]!.omittedAmount).toBe(0.05);
    });
  });

  describe("assessDeductionCapacity (R1/R3)", () => {
    it("tope exacto: anticipo = bruto cabe", () => {
      expect(assessDeductionCapacity(base(2000, 2000), [])).toEqual({
        maxAdvanceDeductible: 2000,
        excessAmount: 0,
        excessSource: null,
      });
    });

    it("un centavo de más → excedente de anticipos", () => {
      expect(assessDeductionCapacity(base(2000, 2000.01), [])).toEqual({
        maxAdvanceDeductible: 2000,
        excessAmount: 0.01,
        excessSource: "advances",
      });
    });

    it("anticipo 2,500 sobre bruto 2,000 → excedente 500, máximo 2,000", () => {
      expect(assessDeductionCapacity(base(2000, 2500), [])).toMatchObject({
        maxAdvanceDeductible: 2000,
        excessAmount: 500,
        excessSource: "advances",
      });
    });

    it("deducciones de plantilla aplicadas reducen el máximo de anticipo (2,000 − 300 = 1,700)", () => {
      expect(assessDeductionCapacity(base(2000, 1700, 300), [])).toMatchObject({
        maxAdvanceDeductible: 1700,
        excessSource: null,
      });
      expect(assessDeductionCapacity(base(2000, 1800, 300), [])).toMatchObject({
        excessAmount: 100,
        excessSource: "advances",
      });
    });

    it("plantilla sola mayor que el bruto (histórico sin tope) no genera excedente", () => {
      expect(assessDeductionCapacity(base(1000, 0, 1500), [])).toEqual({
        maxAdvanceDeductible: 0,
        excessAmount: 0,
        excessSource: null,
      });
    });

    it("manuales en contra por sí solas exceden → manual_deductions, máximo de anticipo 0", () => {
      const manual = normalizeManualItems([
        { itemType: "penalty_deduction", description: "Multa", amount: 900 },
      ]);
      expect(assessDeductionCapacity(base(1000, 200, 200), manual)).toEqual({
        maxAdvanceDeductible: 0,
        excessAmount: 300,
        excessSource: "manual_deductions",
      });
    });

    it("bonos manuales amplían el bruto disponible", () => {
      const manual = normalizeManualItems([{ itemType: "bonus", description: "Bono", amount: 500 }]);
      expect(assessDeductionCapacity(base(2000, 2500), manual).excessSource).toBeNull();
    });

    it("varios anticipos se evalúan por su suma", () => {
      expect(assessDeductionCapacity(base(1000, 400 + 350 + 250.01), [])).toMatchObject({
        excessAmount: 0.01,
        excessSource: "advances",
      });
    });

    it("redondea a centavos (0.1 + 0.2 sobre 0.3 cabe)", () => {
      expect(assessDeductionCapacity(base(0.3, 0.1 + 0.2), []).excessSource).toBeNull();
    });
  });

  describe("uncoveredDeductionsAmount", () => {
    it("0 cuando el neto cubre; excedente redondeado en históricos", () => {
      expect(
        uncoveredDeductionsAmount({ grossAmount: 2000, totalAdvancesDeducted: 1700, totalOtherDeductions: 300 }),
      ).toBe(0);
      expect(
        uncoveredDeductionsAmount({ grossAmount: 2000, totalAdvancesDeducted: 2500, totalOtherDeductions: 0.1 }),
      ).toBe(500.1);
    });
  });
});

/**
 * TEC-6: mismos casos que `boeltech-transport-api/src/modules/settlements/policy/settlementTotals.test.ts`.
 * Si cambia la aritmética del API, estos esperados deben cambiar igual.
 */
describe("settlementTotals web ↔ API (paridad ADR-0085 D14 + E10.6)", () => {
  it("deriva el signo del tipo; solo el ajuste usa su sentido", () => {
    const items = normalizeManualItems([
      { itemType: "bonus", description: "Bono", amount: 100 },
      { itemType: "penalty_deduction", description: "Multa", amount: 20 },
      { itemType: "tax_deduction", description: "ISR", amount: 10 },
      { itemType: "adjustment", description: "Ajuste +", amount: 5, isDeduction: false },
    ]);
    expect(items.map((item) => item.isDeduction)).toEqual([false, true, true, false]);
    expect(items.every((item) => item.tripId === null)).toBe(true);
    expect(deriveManualItemIsDeduction({ itemType: "penalty_deduction", isDeduction: false })).toBe(
      true,
    );
    expect(deriveManualItemIsDeduction({ itemType: "bonus", isDeduction: true })).toBe(false);
  });

  it("isManualSettlementItem: prestaciones y deducciones de plantilla no son manuales", () => {
    expect(isManualSettlementItem({ itemType: "bonus" })).toBe(true);
    expect(isManualSettlementItem({ itemType: "bonus", calculationDetails: { source: "manual" } })).toBe(
      true,
    );
    expect(
      isManualSettlementItem({ itemType: "bonus", calculationDetails: { source: "fixed_allowance" } }),
    ).toBe(false);
    expect(
      isManualSettlementItem({
        itemType: "adjustment",
        calculationDetails: { source: "template_deduction" },
      }),
    ).toBe(false);
    expect(isManualSettlementItem({ itemType: "trip_commission" })).toBe(false);
  });

  describe("computeSettlementTotals", () => {
    const base: CalculatedSettlementBase = {
      calculatedGross: 1000,
      templateDeductions: 100,
      advancesDeducted: 200,
    };

    it("el ajuste suma o resta según su sentido y ambos mueven el neto", () => {
      const plus = computeSettlementTotals(
        base,
        normalizeManualItems([{ itemType: "adjustment", description: "+", amount: 50, isDeduction: false }]),
      );
      const minus = computeSettlementTotals(
        base,
        normalizeManualItems([{ itemType: "adjustment", description: "-", amount: 50, isDeduction: true }]),
      );
      expect(plus).toMatchObject({ grossAmount: 1050, totalBonuses: 50, totalOtherDeductions: 100, netAmount: 750 });
      expect(minus).toMatchObject({ grossAmount: 1000, totalBonuses: 0, totalOtherDeductions: 150, netAmount: 650 });
    });

    it("el neto no baja de cero y redondea a centavos", () => {
      const totals = computeSettlementTotals(
        { calculatedGross: 100.005, templateDeductions: 0, advancesDeducted: 0 },
        normalizeManualItems([{ itemType: "penalty_deduction", description: "Multa", amount: 500 }]),
      );
      expect(totals.netAmount).toBe(0);
      expect(totals.grossAmount).toBe(100.01);
    });

    it("criterio 3: una penalización de $300 baja el neto exactamente $300", () => {
      const before = computeSettlementTotals(base, []);
      const after = computeSettlementTotals(
        base,
        normalizeManualItems([{ itemType: "penalty_deduction", description: "Multa", amount: 300 }]),
      );
      expect(before.netAmount - after.netAmount).toBe(300);
      expect(after.totalOtherDeductions).toBe(400);
    });
  });

  describe("paridad alta ↔ corrección (F4b-S1)", () => {
    const cases: Array<{ name: string; base: CalculatedSettlementBase; items: ManualSettlementItemInput[]; net: number }> = [
      {
        name: "sin manuales",
        base: { calculatedGross: 1000, templateDeductions: 0, advancesDeducted: 0 },
        items: [],
        net: 1000,
      },
      {
        name: "mezcla completa",
        base: { calculatedGross: 4321.5, templateDeductions: 250, advancesDeducted: 800 },
        items: [
          { itemType: "bonus", description: "Bono", amount: 300 },
          { itemType: "penalty_deduction", description: "Multa", amount: 75.25 },
          { itemType: "tax_deduction", description: "Retención", amount: 40 },
          { itemType: "adjustment", description: "Ajuste +", amount: 12.5, isDeduction: false },
          { itemType: "adjustment", description: "Ajuste -", amount: 7.75, isDeduction: true },
        ],
        net: 3461,
      },
      {
        name: "solo deducciones manuales",
        base: { calculatedGross: 600, templateDeductions: 50, advancesDeducted: 0 },
        items: [{ itemType: "adjustment", description: "Faltante", amount: 30, isDeduction: true }],
        net: 520,
      },
    ];

    it.each(cases)(
      "$name: la base recuperada de lo guardado es la del alta y los totales coinciden",
      ({ base, items, net }) => {
        const manual = normalizeManualItems(items);
        const created = computeSettlementTotals(base, manual);
        const stored = {
          ...created,
          items: manual.map((item) => ({ ...item, calculationDetails: { source: "manual" } })),
        };

        expect(created.netAmount).toBe(net);
        expect(calculatedBaseFromStored(stored)).toEqual(base);
        expect(computeSettlementTotals(calculatedBaseFromStored(stored), manual)).toEqual(created);
      },
    );

    it("reemplazar las manuales parte de la misma base (no acumula)", () => {
      const base = { calculatedGross: 1000, templateDeductions: 100, advancesDeducted: 0 };
      const first = normalizeManualItems([{ itemType: "bonus", description: "Bono", amount: 200 }]);
      const created = computeSettlementTotals(base, first);
      const stored = { ...created, items: first.map((item) => ({ ...item, calculationDetails: null })) };
      const second = normalizeManualItems([
        { itemType: "penalty_deduction", description: "Multa", amount: 40 },
      ]);

      expect(computeSettlementTotals(calculatedBaseFromStored(stored), second)).toEqual(
        computeSettlementTotals(base, second),
      );
    });

    it("las prestaciones fijas y deducciones de plantilla guardadas quedan en la base", () => {
      const stored = {
        grossAmount: 1500,
        totalBonuses: 0,
        totalOtherDeductions: 120,
        totalAdvancesDeducted: 0,
        items: [
          { itemType: "bonus", amount: 500, isDeduction: false, calculationDetails: { source: "fixed_allowance" } },
          {
            itemType: "tax_deduction",
            amount: 120,
            isDeduction: true,
            calculationDetails: { source: "template_deduction" },
          },
        ],
      };
      expect(calculatedBaseFromStored(stored)).toEqual({
        calculatedGross: 1500,
        templateDeductions: 120,
        advancesDeducted: 0,
      });
    });
  });
});
