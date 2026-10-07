import { describe, expect, it } from "vitest";
import type { PolicyCandidates, PolicyCandidateUser } from "./entities";
import { getConceptCeilingRoles, resolveDesignatedPerson } from "./eligibility";
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

  it("los referenciados (inactivos, suspendidos o sin permiso) no habilitan plantillas", () => {
    const candidates: PolicyCandidates = {
      users: [manager],
      referencedUsers: [
        { id: "x-admin", fullName: "Xavier", role: "admin", status: "suspended" },
        { id: "x-acc", fullName: "Olga", role: "accountant", status: "inactive" },
      ],
    };
    expect(templateAvailability("doubleSign", "settlement", candidates.users)).toEqual({
      available: false,
      reason: "Requiere 2 autorizadores activos; tienes 1",
    });
    expect(templateAvailability("byAmount", "settlement", candidates.users).available).toBe(false);
  });
});

describe("resolveDesignatedPerson", () => {
  const candidates: PolicyCandidates = {
    users: [admin, manager],
    referencedUsers: [
      { id: "r-inactive", fullName: "Olga Antigua", role: "manager", status: "inactive" },
      { id: "r-suspended", fullName: "Sergio Suspendido", role: "admin", status: "suspended" },
      { id: "r-dispatcher", fullName: "Diego Despacho", role: "dispatcher", status: "active" },
    ],
  };

  it("activo dentro del techo = elegible", () => {
    expect(resolveDesignatedPerson("a", "settlement", candidates)).toEqual({
      id: "a",
      fullName: "Ana",
      state: "eligible",
    });
  });

  it("activo del padrón fuera del techo del concepto = sin permiso (gerente en dispersión)", () => {
    expect(resolveDesignatedPerson("m", "disbursement", candidates).state).toBe("no_permission");
  });

  it("referenciado: estado por status, y activo con rol fuera del techo = sin permiso", () => {
    expect(resolveDesignatedPerson("r-inactive", "settlement", candidates)).toEqual({
      id: "r-inactive",
      fullName: "Olga Antigua",
      state: "inactive",
    });
    expect(resolveDesignatedPerson("r-suspended", "settlement", candidates).state).toBe("suspended");
    expect(resolveDesignatedPerson("r-dispatcher", "settlement", candidates)).toEqual({
      id: "r-dispatcher",
      fullName: "Diego Despacho",
      state: "no_permission",
    });
  });

  it("borrado (en ninguna lista) = no disponible, sin nombre", () => {
    expect(resolveDesignatedPerson("u-gone", "settlement", candidates)).toEqual({
      id: "u-gone",
      fullName: null,
      state: "unavailable",
    });
  });
});
