import { describe, expect, it } from "vitest";
import type { PolicyCandidateUser } from "./entities";
import { getConceptCeilingRoles } from "./eligibility";
import { buildPolicyTemplate, templateAvailability, TEMPLATE_HIGH_AMOUNT_MXN } from "./templates";

const admin: PolicyCandidateUser = { id: "a", fullName: "Ana", role: "admin" };
const manager: PolicyCandidateUser = { id: "m", fullName: "Mario", role: "manager" };
const dispatcher: PolicyCandidateUser = { id: "d", fullName: "Dora", role: "dispatcher" };

describe("techo por concepto (lockstep getConceptCeilingRoles del API)", () => {
  it("anticipos y liquidaciones = settlements.update; gastos = finance_approvals.update; dispersión = settlements.execute", () => {
    expect(getConceptCeilingRoles("driver_advance").sort()).toEqual(["accountant", "admin", "manager"]);
    expect(getConceptCeilingRoles("settlement").sort()).toEqual(["accountant", "admin", "manager"]);
    expect(getConceptCeilingRoles("trip_expense").sort()).toEqual(["accountant", "admin", "manager"]);
    expect(getConceptCeilingRoles("disbursement").sort()).toEqual(["accountant", "admin"]);
  });
});

describe("buildPolicyTemplate", () => {
  it("oneApprover: un tramo base con todo el techo", () => {
    const rules = buildPolicyTemplate("oneApprover", { concept: "driver_advance" });
    expect(rules.tiers).toHaveLength(1);
    expect(rules.tiers[0]).toMatchObject({ minAmount: 0, requiresApproval: true });
    expect(rules.tiers[0]!.steps[0]!.eligibleRoles.sort()).toEqual(["accountant", "admin", "manager"]);
  });

  it("byAmount: equipo sin admin abajo y solo admin desde el monto alto", () => {
    const rules = buildPolicyTemplate("byAmount", { concept: "trip_expense" });
    expect(rules.tiers.map((t) => t.minAmount)).toEqual([0, TEMPLATE_HIGH_AMOUNT_MXN]);
    expect(rules.tiers[0]!.steps[0]!.eligibleRoles).not.toContain("admin");
    expect(rules.tiers[1]!.steps[0]!.eligibleRoles).toEqual(["admin"]);
  });

  it("doubleSign: dos pasos desde el monto alto", () => {
    const rules = buildPolicyTemplate("doubleSign", { concept: "driver_advance" });
    expect(rules.tiers[1]!.steps).toHaveLength(2);
  });

  it("liquidaciones preservan el umbral vigente como tramo sin autorización (SDD §3.10)", () => {
    const rules = buildPolicyTemplate("oneApprover", { concept: "settlement", settlementThresholdMxn: 5_000 });
    expect(rules.tiers).toEqual([
      { minAmount: 0, conditions: {}, requiresApproval: false, steps: [] },
      expect.objectContaining({ minAmount: 5_000, requiresApproval: true }),
    ]);
  });

  it("si el umbral supera el monto alto, el tramo alto sube al doble", () => {
    const rules = buildPolicyTemplate("byAmount", { concept: "settlement", settlementThresholdMxn: 30_000 });
    expect(rules.tiers.map((t) => t.minAmount)).toEqual([0, 30_000, 60_000]);
  });
});

describe("templateAvailability", () => {
  it("doble firma deshabilitada con 1 autorizador activo, con motivo", () => {
    expect(templateAvailability("doubleSign", "settlement", [admin, dispatcher])).toEqual({
      available: false,
      reason: "Requiere 2 autorizadores activos; tienes 1",
    });
  });

  it("doble firma nunca aplica a dispersión", () => {
    expect(templateAvailability("doubleSign", "disbursement", [admin, manager]).available).toBe(false);
  });

  it("sin usuarios conocidos (lectores) no se bloquea", () => {
    expect(templateAvailability("doubleSign", "settlement", null).available).toBe(true);
  });

  it("por monto requiere un administrador activo", () => {
    expect(templateAvailability("byAmount", "settlement", [manager]).available).toBe(false);
    expect(templateAvailability("byAmount", "settlement", [manager, admin]).available).toBe(true);
  });
});
