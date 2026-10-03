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
