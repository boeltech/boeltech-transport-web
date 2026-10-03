import { describe, expect, it } from "vitest";
import {
  calculatedBaseFromStored,
  computeSettlementTotals,
  deriveManualItemIsDeduction,
  isManualSettlementItem,
  normalizeManualItems,
  type CalculatedSettlementBase,
  type ManualSettlementItemInput,
} from "./settlementTotals";

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
