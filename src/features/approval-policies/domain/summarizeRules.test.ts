import { describe, expect, it } from "vitest";
import type { ApprovalRules } from "./entities";
import { summarizeRules } from "./summarizeRules";

const rules = (tiers: ApprovalRules["tiers"]): ApprovalRules => ({ rulesSchemaVersion: 1, tiers });

describe("summarizeRules (paridad de redacción con policySummary.ts del API)", () => {
  it("un tramo base con todo el techo = «Cualquier autorizador»", () => {
    expect(
      summarizeRules(
        rules([
          {
            minAmount: 0,
            conditions: {},
            requiresApproval: true,
            steps: [{ eligibleRoles: ["admin", "manager", "accountant"], eligibleUserIds: [] }],
          },
        ]),
        "settlement",
      ),
    ).toBe("Cualquier autorizador");
  });

  it("dispersión: el techo es admin + contador", () => {
    expect(
      summarizeRules(
        rules([
          {
            minAmount: 0,
            conditions: {},
            requiresApproval: true,
            steps: [{ eligibleRoles: ["admin", "accountant"], eligibleUserIds: [] }],
          },
        ]),
        "disbursement",
      ),
    ).toBe("Cualquier autorizador");
  });

  it("varios tramos ordenados por monto, condiciones con «o» y doble firma", () => {
    const summary = summarizeRules(
      rules([
        {
          minAmount: 20_000,
          conditions: {},
          requiresApproval: true,
          steps: [
            { eligibleRoles: ["manager"], eligibleUserIds: [] },
            { eligibleRoles: ["admin"], eligibleUserIds: ["u-1"] },
          ],
        },
        {
          minAmount: 0,
          conditions: {},
          requiresApproval: true,
          steps: [{ eligibleRoles: ["manager", "accountant"], eligibleUserIds: [] }],
        },
        {
          minAmount: 5_000,
          conditions: { categories: ["fuel"], missingCfdi: true },
          requiresApproval: true,
          steps: [{ eligibleRoles: [], eligibleUserIds: ["u-1", "u-2"] }],
        },
      ]),
      "trip_expense",
      { categoryLabel: (c) => (c === "fuel" ? "Combustible" : c) },
    );
    expect(summary).toBe(
      "Desde $0.00: Gerente o Contador · " +
        "Desde $5,000.00 (categorías Combustible o sin CFDI): 2 personas designadas · " +
        "Desde $20,000.00: Doble firma: Gerente → Administrador o 1 persona designada",
    );
  });

  it("tramo sin autorización (umbral de liquidaciones)", () => {
    expect(
      summarizeRules(
        rules([
          { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
          {
            minAmount: 5_000,
            conditions: {},
            requiresApproval: true,
            steps: [{ eligibleRoles: ["admin", "manager", "accountant"], eligibleUserIds: [] }],
          },
        ]),
        "settlement",
      ),
    ).toBe("Desde $0.00: Sin autorización · Desde $5,000.00: Cualquier autorizador");
  });
});
