import { describe, expect, it } from "vitest";
import type { SettlementCutPreviewRow } from "../../domain/settlementCut";
import {
  applyZeroKmAckToCutRow,
  buildCutDidNotEnterRows,
  alreadyHasPaymentTooltip,
  cutDidNotEnterReasonLabel,
  cutEffectAllowsNetDisplay,
  filterCutReviewRows,
  isCutRowReady,
  isCutRowSendable,
  partitionCutReviewRows,
  primaryCutWarningCode,
  resolveCutRowWarningUi,
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
    expect(resolveCutWarningUi("zero_km_trips").label).toBe("Viaje sin km");
  });

  it("D6: missing_ack_zero_km es blocking con Confirmar (no el mismo badge que incluido)", () => {
    const ui = resolveCutWarningUi("missing_ack_zero_km");
    expect(ui.effectHint).toBe("blocking");
    expect(ui.badgeVariant).toBe("destructive");
    expect(ui.label).toBe("Falta confirmar km");
    expect(ui.action).toBe("confirm_zero_km");
  });

  it("COPY-04: payee en español", () => {
    const ui = resolveCutWarningUi("reimbursement_payee_required");
    expect(ui.label).toBe("Falta quién recibe el reembolso");
    expect(ui.action).toBe("define_payee");
  });

  it("F-R4b: nothing_to_pay con periodOverlap → Ya tiene un pago + Ver pago", () => {
    const covered = row({
      employeeId: "adriana",
      effect: "excluded",
      primaryReason: "nothing_to_pay",
      warnings: [
        {
          code: "nothing_to_pay",
          message: "No hay viajes, sueldo ni reembolsos en este periodo",
        },
      ],
      periodOverlap: {
        settlementId: "set-1",
        status: "pending_approval",
        settlementNumber: "LIQ-202611-0002",
        conflictsCount: 1,
        overlapKind: "contained",
      },
    });
    const ui = resolveCutRowWarningUi(covered);
    expect(ui?.label).toBe("Ya tiene un pago");
    expect(ui?.action).toBe("view_payment");
    expect(ui?.tooltip).toBe(
      alreadyHasPaymentTooltip(covered.periodOverlap!),
    );
    expect(cutDidNotEnterReasonLabel(covered)).toBe("Ya tiene un pago");
  });

  it("F-R4b: nothing_to_pay sin folio sigue Nada que pagar", () => {
    const empty = row({
      employeeId: "x",
      effect: "excluded",
      primaryReason: "nothing_to_pay",
      warnings: [
        {
          code: "nothing_to_pay",
          message: "No hay viajes, sueldo ni reembolsos en este periodo",
        },
      ],
      periodOverlap: null,
    });
    const ui = resolveCutRowWarningUi(empty);
    expect(ui?.label).toBe("Nada que pagar");
    expect(ui?.action).toBe("view_operator");
  });

  it("applyZeroKmAckToCutRow convierte blocking en includable soft", () => {
    const blocked = row({
      employeeId: "z",
      effect: "blocking",
      primaryReason: "missing_ack_zero_km",
      warnings: [
        { code: "missing_ack_zero_km", message: "API message" },
      ],
    });
    const acked = applyZeroKmAckToCutRow(blocked);
    expect(acked.effect).toBe("includable");
    expect(acked.primaryReason).toBe("zero_km_trips");
    expect(isCutRowSendable(acked)).toBe(true);
  });

  it("C30: buildCutDidNotEnterRows une excluded + blocking + omitted", () => {
    const eligible = [
      row({ employeeId: "ready", effect: "includable" }),
      row({
        employeeId: "block",
        effect: "blocking",
        primaryReason: "missing_ack_zero_km",
        warnings: [{ code: "missing_ack_zero_km", message: "Sin km" }],
      }),
    ];
    const excluded = [
      row({
        employeeId: "out",
        effect: "excluded",
        primaryReason: "no_payable_template",
        warnings: [{ code: "no_payable_template", message: "Sin tarifa" }],
      }),
    ];
    const didNot = buildCutDidNotEnterRows({
      eligible,
      excluded,
      createdEmployeeIds: new Set(["ready"]),
      omitted: [],
    });
    expect(didNot.map((r) => r.employeeId).sort()).toEqual(["block", "out"]);
    expect(cutDidNotEnterReasonLabel(didNot.find((r) => r.employeeId === "block")!)).toBe(
      "Sin km · sin confirmar",
    );
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
