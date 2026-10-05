import { describe, expect, it } from "vitest";
import type { SettlementItem } from "../../domain/entities";
import {
  getSettlementItemCategoryLabel,
  getSettlementItemOriginTitle,
  orderSettlementDeductions,
} from "./settlementItemOrigin";

type ItemInput = Pick<SettlementItem, "itemType" | "description" | "calculationDetails">;

function item(
  itemType: SettlementItem["itemType"],
  description: string,
  source?: string | null,
): ItemInput {
  return {
    itemType,
    description,
    calculationDetails: source === undefined ? undefined : { source },
  };
}

describe("getSettlementItemCategoryLabel", () => {
  it("deducción de tarifa (template_deduction + adjustment)", () => {
    expect(
      getSettlementItemCategoryLabel(
        item("adjustment", "Deducción de plantilla: Fondo de ahorro", "template_deduction"),
      ),
    ).toBe("Deducción de tarifa");
  });

  it("retención de tarifa conserva la categoría del tipo", () => {
    expect(
      getSettlementItemCategoryLabel(
        item("tax_deduction", "Deducción de plantilla: ISR", "template_deduction"),
      ),
    ).toBe("Retención / Impuesto");
  });

  it("prestación fija (fixed_allowance + bonus)", () => {
    expect(
      getSettlementItemCategoryLabel(item("bonus", "Prestación fija: Viáticos", "fixed_allowance")),
    ).toBe("Prestación fija");
  });

  it.each([undefined, null, "manual"])("manual (source %s) sin cambio", (source) => {
    expect(getSettlementItemCategoryLabel(item("adjustment", "Ajuste", source))).toBe(
      "Ajuste manual",
    );
    expect(getSettlementItemCategoryLabel(item("bonus", "Puntualidad", source))).toBe(
      "Bono / Incentivo",
    );
  });
});

describe("getSettlementItemOriginTitle", () => {
  it("quita el prefijo de deducción de plantilla y agrega subtítulo de tarifa", () => {
    expect(
      getSettlementItemOriginTitle(
        item("adjustment", "Deducción de plantilla: Fondo de ahorro", "template_deduction"),
      ),
    ).toEqual({ title: "Fondo de ahorro", subtitle: "De la tarifa del operador" });
  });

  it("retención de tarifa: título sin prefijo, sin subtítulo", () => {
    expect(
      getSettlementItemOriginTitle(
        item("tax_deduction", "Deducción de plantilla: ISR", "template_deduction"),
      ),
    ).toEqual({ title: "ISR", subtitle: null });
  });

  it("quita el prefijo de prestación fija", () => {
    expect(
      getSettlementItemOriginTitle(item("bonus", "Prestación fija: Viáticos", "fixed_allowance")),
    ).toEqual({ title: "Viáticos", subtitle: null });
  });

  it("sin prefijo muestra la descripción tal cual", () => {
    expect(
      getSettlementItemOriginTitle(item("bonus", "Comidas", "fixed_allowance"))?.title,
    ).toBe("Comidas");
    expect(
      getSettlementItemOriginTitle(item("adjustment", "Fondo de ahorro", "template_deduction"))
        ?.title,
    ).toBe("Fondo de ahorro");
  });

  it("deducción de tarifa recortada por ingreso insuficiente: el subtítulo dice cuánto no se aplicó", () => {
    expect(
      getSettlementItemOriginTitle({
        itemType: "adjustment",
        description: "Deducción de plantilla: Fondo de ahorro",
        calculationDetails: {
          source: "template_deduction",
          requestedAmount: 300,
          omittedAmount: 300,
        },
      }),
    ).toEqual({
      title: "Fondo de ahorro",
      subtitle: "No aplicado $300.00 por ingreso insuficiente",
    });
    expect(
      getSettlementItemOriginTitle({
        itemType: "tax_deduction",
        description: "Deducción de plantilla: ISR",
        calculationDetails: { source: "template_deduction", requestedAmount: 900, omittedAmount: 100 },
      })?.subtitle,
    ).toBe("No aplicado $100.00 por ingreso insuficiente");
  });

  it("partidas manuales no se tocan", () => {
    expect(getSettlementItemOriginTitle(item("adjustment", "Ajuste", "manual"))).toBeNull();
    expect(getSettlementItemOriginTitle(item("bonus", "Prestación fija: X"))).toBeNull();
  });
});

describe("orderSettlementDeductions", () => {
  it("anticipos, luego deducciones de tarifa, luego ajustes en contra; estable por grupo", () => {
    const items = [
      item("penalty_deduction", "Penalización A", "manual"),
      item("adjustment", "Deducción de plantilla: Fondo", "template_deduction"),
      item("advance_deduction", "Anticipo 1"),
      item("tax_deduction", "Deducción de plantilla: ISR", "template_deduction"),
      item("adjustment", "Ajuste en contra B"),
      item("advance_deduction", "Anticipo 2"),
    ];

    expect(orderSettlementDeductions(items).map((it) => it.description)).toEqual([
      "Anticipo 1",
      "Anticipo 2",
      "Deducción de plantilla: Fondo",
      "Deducción de plantilla: ISR",
      "Penalización A",
      "Ajuste en contra B",
    ]);
  });

  it("no muta el arreglo original", () => {
    const items = [item("adjustment", "B"), item("advance_deduction", "A")];
    orderSettlementDeductions(items);
    expect(items.map((it) => it.description)).toEqual(["B", "A"]);
  });
});
