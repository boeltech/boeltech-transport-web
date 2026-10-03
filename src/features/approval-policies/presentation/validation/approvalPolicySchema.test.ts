import { describe, expect, it } from "vitest";
import {
  buildApprovalPolicySchema,
  emptyTier,
  formValuesToRules,
  rulesToFormValues,
  serverIssuePathToField,
  type PolicyFormValues,
} from "./approvalPolicySchema";

const base = (concept: Parameters<typeof emptyTier>[0]) => emptyTier(concept, 0);

function issuesOf(concept: Parameters<typeof buildApprovalPolicySchema>[0], values: PolicyFormValues) {
  const result = buildApprovalPolicySchema(concept).safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

describe("buildApprovalPolicySchema (espejo de forma §3.1)", () => {
  it("acepta un tramo base con el techo", () => {
    expect(issuesOf("driver_advance", { tiers: [base("driver_advance")] })).toEqual([]);
  });

  it("paso vacío → error en tiers.i.steps.j", () => {
    const tier = { ...base("trip_expense"), steps: [{ eligibleRoles: [], eligibleUserIds: [] }] };
    expect(issuesOf("trip_expense", { tiers: [tier] })).toEqual([
      { path: "tiers.0.steps.0", message: "Elige al menos un rol o una persona" },
    ]);
  });

  it("rol fuera del techo → error en el paso", () => {
    const tier = { ...base("disbursement"), steps: [{ eligibleRoles: ["manager" as const], eligibleUserIds: [] }] };
    expect(issuesOf("disbursement", { tiers: [tier] })[0]?.path).toBe("tiers.0.steps.0");
  });

  it("primer tramo con monto o condición no es base", () => {
    const tier = { ...base("trip_expense"), minAmount: 100 };
    expect(issuesOf("trip_expense", { tiers: [tier] })[0]?.path).toBe("tiers.0.minAmount");
  });

  it("tramos adicionales requieren monto > 0 y no duplican monto sin condiciones", () => {
    const issues = issuesOf("driver_advance", {
      tiers: [base("driver_advance"), emptyTier("driver_advance", 0), emptyTier("driver_advance", 5000), emptyTier("driver_advance", 5000)],
    });
    expect(issues.map((i) => i.path)).toEqual(["tiers.1.minAmount", "tiers.1.minAmount", "tiers.3.minAmount"]);
  });

  it("máximo 4 tramos", () => {
    const tiers = [base("driver_advance"), ...[1, 2, 3, 4].map((n) => emptyTier("driver_advance", n * 1000))];
    expect(issuesOf("driver_advance", { tiers }).length).toBeGreaterThan(0);
  });

  it("«sin autorización» solo en liquidaciones", () => {
    const noApproval = { ...base("settlement"), requiresApproval: false, steps: [] };
    expect(issuesOf("settlement", { tiers: [noApproval] })).toEqual([]);
    expect(issuesOf("driver_advance", { tiers: [{ ...noApproval }] })[0]?.path).toBe("tiers.0.requiresApproval");
  });

  it("dispersión: un solo paso", () => {
    const tier = { ...base("disbursement"), steps: [base("disbursement").steps[0]!, base("disbursement").steps[0]!] };
    expect(issuesOf("disbursement", { tiers: [tier] })[0]?.path).toBe("tiers.0.steps.1");
  });

  it("condición no permitida por concepto", () => {
    const tier = { ...emptyTier("settlement", 1000), missingCfdi: true };
    expect(issuesOf("settlement", { tiers: [base("settlement"), tier] })[0]?.path).toBe("tiers.1.missingCfdi");
  });
});

describe("conversión formulario ↔ reglas", () => {
  it("ordena por monto y conserva condiciones", () => {
    const values = rulesToFormValues({
      rulesSchemaVersion: 1,
      tiers: [
        { minAmount: 5000, conditions: { manualAdjustments: true }, requiresApproval: true, steps: [{ eligibleRoles: ["admin"], eligibleUserIds: [] }] },
        { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
      ],
    });
    expect(values.tiers.map((t) => t.minAmount)).toEqual([0, 5000]);
    expect(formValuesToRules(values).tiers[1]).toEqual({
      minAmount: 5000,
      conditions: { manualAdjustments: true },
      requiresApproval: true,
      steps: [{ eligibleRoles: ["admin"], eligibleUserIds: [] }],
    });
  });

  it("serverIssuePathToField ubica issues del body en el formulario", () => {
    expect(serverIssuePathToField(["rules", "tiers", 2, "steps", 1, "eligible_roles", 0])).toBe("tiers.2.steps.1");
    expect(serverIssuePathToField(["rules", "tiers", 1, "min_amount"])).toBe("tiers.1.minAmount");
    expect(serverIssuePathToField(["expected_version"])).toBeNull();
  });
});
