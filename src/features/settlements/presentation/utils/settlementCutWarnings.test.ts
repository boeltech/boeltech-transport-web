import { describe, expect, it } from "vitest";
import type { SettlementCutPreviewRow } from "../../domain/settlementCut";
import {
  cutEffectAllowsNetDisplay,
  filterCutReviewRows,
  isCutRowReady,
  isCutRowSendable,
  partitionCutReviewRows,
  primaryCutWarningCode,
  resolveCutWarningUi,
  rowHasCutWarning,
} from "./settlementCutWarnings";

function row(
  partial: Partial<SettlementCutPreviewRow> &
    Pick<SettlementCutPreviewRow, "employeeId" | "effect">,
): SettlementCutPreviewRow {
  return {
    employeeFullName: partial.employeeFullName ?? "Operador",
    employmentType: "employee",
    salaryPeriod: "weekly",
    estimatedNet: partial.estimatedNet ?? 1000,
    estimatedGross: 1200,
    maxAdvanceDeductible: null,
    suggestedAdvanceDeduction: null,
    tripIds: [],
    warnings: partial.warnings ?? [],
    primaryReason: partial.primaryReason ?? null,
    periodOverlap: null,
    suggestedPeriodStart: null,
    openAdvancesBalance: 0,
    ...partial,
  };
}

describe("settlementCutWarnings — PRD §H / DOM", () => {
  it("exceso de deducciones es blocking (nunca neto $0 enviable)", () => {
    const ui = resolveCutWarningUi("deductions_exceed_capacity");
    expect(ui.effectHint).toBe("blocking");
    expect(ui.badgeVariant).toBe("destructive");
    expect(ui.action).toBe("split_advance");
    expect(ui.label).toBe("Anticipo mayor que su pago");
  });

  it("elige el aviso de mayor severidad cuando hay open_advance + exceso (C16)", () => {
    const code = primaryCutWarningCode(
      row({
        employeeId: "x",
        effect: "blocking",
        warnings: [
          { code: "open_advance", message: "Hay anticipos abiertos…" },
          {
            code: "deductions_exceed_capacity",
            message: "Supera capacidad",
          },
        ],
      }),
    );
    expect(code).toBe("deductions_exceed_capacity");
  });

  it("avisos soft son includable", () => {
    expect(resolveCutWarningUi("open_advance").effectHint).toBe("includable");
    expect(resolveCutWarningUi("template_change_in_period").effectHint).toBe(
      "includable",
    );
    expect(resolveCutWarningUi("zero_km_trips").effectHint).toBe("includable");
  });

  it("sin tarifa / ritmo distinto son excluded", () => {
    expect(resolveCutWarningUi("no_payable_template").effectHint).toBe(
      "excluded",
    );
    expect(resolveCutWarningUi("salary_period_mismatch").effectHint).toBe(
      "excluded",
    );
  });

  it("solo includable cuenta como enviable", () => {
    expect(
      isCutRowSendable(row({ employeeId: "a", effect: "includable" })),
    ).toBe(true);
    expect(
      isCutRowSendable(row({ employeeId: "b", effect: "blocking" })),
    ).toBe(false);
    expect(
      isCutRowSendable(row({ employeeId: "c", effect: "excluded" })),
    ).toBe(false);
  });

  it("blocking no muestra monto neto como pagable", () => {
    expect(cutEffectAllowsNetDisplay("includable")).toBe(true);
    expect(cutEffectAllowsNetDisplay("blocking")).toBe(false);
    expect(cutEffectAllowsNetDisplay("excluded")).toBe(false);
  });

  it("particiona Con aviso / Listos / Fuera", () => {
    const eligible = [
      row({
        employeeId: "1",
        effect: "blocking",
        warnings: [
          { code: "deductions_exceed_capacity", message: "Exceso" },
        ],
        primaryReason: "deductions_exceed_capacity",
      }),
      row({
        employeeId: "2",
        effect: "includable",
        warnings: [{ code: "open_advance", message: "Anticipo" }],
      }),
      row({ employeeId: "3", effect: "includable", warnings: [] }),
    ];
    const excluded = [
      row({
        employeeId: "4",
        effect: "excluded",
        warnings: [
          { code: "no_payable_template", message: "Sin tarifa" },
        ],
        primaryReason: "no_payable_template",
      }),
    ];

    const parts = partitionCutReviewRows(eligible, excluded);
    expect(parts.withWarning.map((r) => r.employeeId)).toEqual(["1", "2"]);
    expect(parts.ready.map((r) => r.employeeId)).toEqual(["3"]);
    expect(parts.outside.map((r) => r.employeeId)).toEqual(["4"]);
    expect(isCutRowReady(parts.ready[0]!)).toBe(true);
    expect(rowHasCutWarning(parts.withWarning[0]!)).toBe(true);
  });

  it("filtro default con aviso deja listos fuera", () => {
    const rows = [
      row({
        employeeId: "1",
        effect: "includable",
        warnings: [{ code: "open_advance", message: "A" }],
      }),
      row({ employeeId: "2", effect: "includable", warnings: [] }),
    ];
    expect(filterCutReviewRows(rows, "with_warning")).toHaveLength(1);
    expect(filterCutReviewRows(rows, "ready")).toHaveLength(1);
    expect(filterCutReviewRows(rows, "all")).toHaveLength(2);
  });
});
