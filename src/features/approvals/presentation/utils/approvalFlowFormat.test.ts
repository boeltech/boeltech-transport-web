import { describe, expect, it } from "vitest";
import { EXPENSE_CATEGORY_LABELS } from "@features/trips/domain";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { ApprovableItem } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import {
  approvableFolio,
  approvalGuardsFor,
  describeBulkFailureMessage,
  formatFieldChanges,
  formatPendingFor,
  formatReapprovalConfirmLine,
  formatReapprovalTooltip,
  formatSignedLine,
  guardErrorMessage,
} from "./approvalFlowFormat";

describe("formatPendingFor", () => {
  it("rol en español, rol o persona, y +n con más de dos", () => {
    expect(formatPendingFor({ roles: ["accountant"], users: [] })).toBe("Contador");
    expect(
      formatPendingFor({
        roles: ["accountant"],
        users: [{ userId: "u1", fullName: "Marta López" }],
      }),
    ).toBe("Contador o Marta López");
    expect(
      formatPendingFor({
        roles: ["accountant", "manager"],
        users: [{ userId: "u1", fullName: "Marta López" }],
      }),
    ).toBe("Contador +2");
    expect(formatPendingFor({ roles: [], users: [] })).toBe("");
  });
});

describe("formatSignedLine", () => {
  it("«Firmó Ana López (Gerente) · fecha»", () => {
    expect(
      formatSignedLine({
        stepNo: 1,
        userId: "u-ana",
        fullName: "Ana López",
        role: "manager",
        decidedAt: "2026-10-01T18:00:00.000Z",
      }),
    ).toMatch(/^Firmó Ana López \(Gerente\) · .+/);
  });

  it("sin nombre usa «Otra persona»", () => {
    expect(
      formatSignedLine({ stepNo: 1, userId: null, fullName: null, role: null, decidedAt: null }),
    ).toMatch(/^Firmó Otra persona · /);
  });
});

describe("formatFieldChanges", () => {
  it("formatea montos, categorías y campos opacos; omite lo desconocido", () => {
    expect(
      formatFieldChanges([
        { field: "amount", from: 4000, to: 6000 },
        { field: "category", from: "fuel", to: "tolls" },
        { field: "trip_id", from: "t1", to: "t2" },
        { field: "secret_internal", from: 1, to: 2 },
      ]),
    ).toEqual([
      `Monto: ${formatMxCurrency(4000)} → ${formatMxCurrency(6000)}`,
      `Categoría: ${(EXPENSE_CATEGORY_LABELS as Record<string, string>).fuel ?? "fuel"} → ${(EXPENSE_CATEGORY_LABELS as Record<string, string>).tolls ?? "tolls"}`,
      "Viaje: cambió",
    ]);
  });

  it("valores vacíos se muestran como —", () => {
    expect(formatFieldChanges([{ field: "currency", from: null, to: "USD" }])).toEqual([
      "Moneda: — → USD",
    ]);
  });

  it("partidas manuales: agregada, quitada y cambiada con etiqueta corta", () => {
    expect(
      formatFieldChanges([
        {
          field: "manual_items",
          from: [
            {
              item_type: "bonus",
              description: "Bono puntualidad",
              amount: "200.00",
              is_deduction: false,
              trip_id: null,
            },
            {
              item_type: "penalty_deduction",
              description: "Multa caseta",
              amount: "50.00",
              is_deduction: true,
              trip_id: null,
            },
          ],
          to: [
            {
              item_type: "bonus",
              description: "Bono puntualidad",
              amount: "300.00",
              is_deduction: false,
              trip_id: null,
            },
            {
              item_type: "adjustment",
              description: "Ajuste diésel",
              amount: "30.00",
              is_deduction: true,
              trip_id: null,
            },
          ],
        },
      ]),
    ).toEqual([
      `Bono "Bono puntualidad" ${formatMxCurrency(200)}→${formatMxCurrency(300)}`,
      `− Penalización "Multa caseta" ${formatMxCurrency(50)}`,
      `+ Ajuste "Ajuste diésel" ${formatMxCurrency(30)}`,
    ]);
  });

  it("anticipos: empareja por advance_id y usa folio si viene", () => {
    expect(
      formatFieldChanges([
        {
          field: "advance_deductions",
          from: [{ advance_id: "a1", amount: "100.00" }],
          to: [
            { advance_id: "a1", amount: "150.00", folio: "ANT-9" },
            { advance_id: "a2", amount: "80.00" },
          ],
        },
      ]),
    ).toEqual([
      `Anticipo ${formatMxCurrency(100)}→${formatMxCurrency(150)}`,
      `+ Anticipo ${formatMxCurrency(80)}`,
    ]);

    expect(
      formatFieldChanges([
        {
          field: "advance_deductions",
          from: [],
          to: [{ advance_id: "a3", amount: "40.00", folio: "ANT-3" }],
        },
      ]),
    ).toEqual([`+ Anticipo ANT-3 ${formatMxCurrency(40)}`]);
  });

  it("máximo 3 deltas de partidas + «y n más»; net_amount al final", () => {
    const lines = formatFieldChanges([
      {
        field: "advance_deductions",
        from: [],
        to: [
          { advance_id: "a1", amount: "10.00" },
          { advance_id: "a2", amount: "20.00" },
        ],
      },
      {
        field: "manual_items",
        from: [],
        to: [
          {
            item_type: "bonus",
            description: "Uno",
            amount: "1.00",
            is_deduction: false,
            trip_id: null,
          },
          {
            item_type: "bonus",
            description: "Dos",
            amount: "2.00",
            is_deduction: false,
            trip_id: null,
          },
          {
            item_type: "bonus",
            description: "Tres",
            amount: "3.00",
            is_deduction: false,
            trip_id: null,
          },
        ],
      },
      { field: "net_amount", from: "1000.00", to: "900.00" },
      { field: "amount", from: 50, to: 60 },
    ]);

    expect(lines).toEqual([
      `Monto: ${formatMxCurrency(50)} → ${formatMxCurrency(60)}`,
      `+ Anticipo ${formatMxCurrency(10)}`,
      `+ Anticipo ${formatMxCurrency(20)}`,
      `+ Bono "Uno" ${formatMxCurrency(1)}`,
      "y 2 más",
      `Neto: ${formatMxCurrency(1000)} → ${formatMxCurrency(900)}`,
    ]);
    expect(lines.join(" · ")).not.toContain("Partidas manuales: cambió");
    expect(lines.join(" · ")).not.toContain("Descuentos de anticipos: cambió");
  });

  it("descripción de partida se recorta a 28 caracteres", () => {
    const long = "A".repeat(35);
    expect(
      formatFieldChanges([
        {
          field: "manual_items",
          from: [],
          to: [
            {
              item_type: "tax_deduction",
              description: long,
              amount: "12.00",
              is_deduction: true,
              trip_id: null,
            },
          ],
        },
      ]),
    ).toEqual([`+ Retención "${"A".repeat(28)}…" ${formatMxCurrency(12)}`]);
  });
});

describe("formatReapprovalTooltip (handoff 12 D3/D4)", () => {
  const amount = [{ field: "amount", from: "8000.00", to: "12000.00" }];
  const base = { invalidatedAt: null, previousInstanceId: null };

  it("approved → «Cambió desde la autorización anterior: …»", () => {
    expect(formatReapprovalTooltip({ ...base, previousStatus: "approved", changes: amount })).toBe(
      "Cambió desde la autorización anterior: Monto: $8,000.00 → $12,000.00",
    );
  });

  it("approved con diff vacío → copy sin lista", () => {
    expect(formatReapprovalTooltip({ ...base, previousStatus: "approved", changes: [] })).toBe(
      "Se corrigió después de autorizarse; requiere nueva firma.",
    );
  });

  it("in_progress → «Cambió mientras esperaba autorización: …»", () => {
    expect(
      formatReapprovalTooltip({ ...base, previousStatus: "in_progress", changes: amount }),
    ).toBe("Cambió mientras esperaba autorización: Monto: $8,000.00 → $12,000.00");
  });

  it("D5 concuerda con el concepto: anticipo, gasto y pago «autorizado»", () => {
    const reapproved = (changes: typeof amount | []) => ({
      flowStatus: "in_progress" as const,
      stepCurrent: 1,
      stepsTotal: 1,
      pendingFor: { roles: [], users: [] },
      signedSteps: [],
      routedBy: {
        tierIndex: null,
        minAmount: null,
        matchedConditions: [],
        policyVersion: null,
        lazy: true,
      },
      canAct: true,
      cannotActReason: null,
      escalated: false,
      reapproval: { ...base, previousStatus: "approved" as const, changes },
      returned: null,
    });
    const line = "Cambió: Monto: $8,000.00 → $12,000.00.";
    expect(formatReapprovalConfirmLine(reapproved(amount), "driver_advance_request")).toBe(
      `Ya estaba autorizado. ${line}`,
    );
    expect(formatReapprovalConfirmLine(reapproved(amount), "trip_expense")).toBe(
      `Ya estaba autorizado. ${line}`,
    );
    expect(formatReapprovalConfirmLine(reapproved(amount), "internal_staff_compensation")).toBe(
      `Ya estaba autorizado. ${line}`,
    );
    expect(formatReapprovalConfirmLine(reapproved([]), "driver_advance_request")).toBe(
      "Ya estaba autorizado; se corrigió y requiere nueva firma.",
    );
    expect(formatReapprovalConfirmLine(reapproved([]), "internal_staff_compensation")).toBe(
      "Ya estaba autorizado; se corrigió y requiere nueva firma.",
    );
  });

  it("sin dato (null) conserva el copy previo", () => {
    expect(formatReapprovalTooltip({ ...base, previousStatus: null, changes: amount })).toBe(
      "Cambió desde la autorización anterior: Monto: $8,000.00 → $12,000.00",
    );
  });
});

describe("approvalGuardsFor", () => {
  it("envía solo las guardas presentes", () => {
    expect(approvalGuardsFor({})).toEqual({});
    expect(approvalGuardsFor({ approvalRevision: null, approval: null })).toEqual({});
    expect(
      approvalGuardsFor({
        approvalRevision: "rev-1",
        approval: {
          flowStatus: "in_progress",
          stepCurrent: 2,
          stepsTotal: 2,
          pendingFor: { roles: [], users: [] },
          signedSteps: [],
          routedBy: {
            tierIndex: null,
            minAmount: null,
            matchedConditions: [],
            policyVersion: null,
            lazy: false,
          },
          canAct: true,
          cannotActReason: null,
          escalated: false,
          reapproval: null,
          returned: null,
        },
      }),
    ).toEqual({ expectedStep: 2, expectedRevision: "rev-1" });
  });
});

describe("describeBulkFailureMessage (mapeo de errores)", () => {
  it("guardas → copy del handoff", () => {
    expect(
      describeBulkFailureMessage({
        type: "trip_expense",
        id: "e1",
        error: { code: "APPROVAL_STEP_CHANGED", message: "raw" },
      }),
    ).toBe(approvalsCopy.guardErrors.APPROVAL_STEP_CHANGED);
    expect(guardErrorMessage("APPROVAL_STEP_ALREADY_SIGNED")).toBe(
      approvalsCopy.guardErrors.APPROVAL_STEP_ALREADY_SIGNED,
    );
  });

  it("autoaprobación prohibida → mensaje del API (o copy de respaldo)", () => {
    expect(
      describeBulkFailureMessage({
        type: "trip_expense",
        id: "e1",
        error: { code: "SELF_APPROVAL_FORBIDDEN", message: "Pídele a otro autorizador" },
      }),
    ).toBe("Pídele a otro autorizador");
    expect(
      describeBulkFailureMessage({
        type: "trip_expense",
        id: "e1",
        error: { code: "SELF_APPROVAL_FORBIDDEN", message: "" },
      }),
    ).toBe(approvalsCopy.selfApproval.serverRejected);
  });

  it("otro código → mensaje del API", () => {
    expect(
      describeBulkFailureMessage({
        type: "trip_expense",
        id: "e1",
        error: { code: "INVALID_STATUS", message: "Ya no está pendiente" },
      }),
    ).toBe("Ya no está pendiente");
  });
});

describe("approvableFolio", () => {
  it("gasto: viaje · descripción · monto", () => {
    const item = {
      approvableType: "trip_expense",
      amount: 1200,
      context: {
        approvableType: "trip_expense",
        tripCode: "V-1",
        description: "Diesel",
      },
    } as unknown as ApprovableItem;
    expect(approvableFolio(item)).toBe(`V-1 · Diesel · ${formatMxCurrency(1200)}`);
  });

  it("sin ítem usa el genérico", () => {
    expect(approvableFolio(undefined)).toBe(approvalsCopy.bulkFlow.unknownFolio);
  });
});
