import { describe, expect, it } from "vitest";
import {
  collectEligibleUserIds,
  mapApprovalPoliciesOverview,
  mapCandidateUser,
  mapPolicyVersionsResponse,
  mapRules,
  mapSavedPolicyVersion,
  mapSimulationResult,
  toApiRules,
  toApiSimulationFacts,
  type ApiRules,
} from "./mappers";

const apiRules: ApiRules = {
  rules_schema_version: 1,
  tiers: [
    {
      min_amount: 0,
      conditions: {},
      requires_approval: true,
      steps: [{ eligible_roles: ["manager"], eligible_user_ids: [] }],
    },
    {
      min_amount: 5000,
      conditions: { categories: ["fuel"], missing_cfdi: true },
      requires_approval: true,
      steps: [
        { eligible_roles: ["manager"], eligible_user_ids: ["u-1"] },
        { eligible_roles: [], eligible_user_ids: ["u-2", "u-1"] },
      ],
    },
  ],
};

describe("approval-policies mappers", () => {
  it("mapea el overview snake → camel", () => {
    const overview = mapApprovalPoliciesOverview({
      edit_enabled: false,
      concepts: [
        {
          concept: "trip_expense",
          source: "tenant",
          version: 3,
          effective_from: "2026-10-01T12:00:00Z",
          created_by: "u-9",
          created_by_name: "Gerardo Méndez",
          rules: apiRules,
          summary: "Desde $0.00: Gerente",
          pending_requests: 2,
        },
      ],
    });
    expect(overview.editEnabled).toBe(false);
    expect(overview.concepts[0]).toMatchObject({
      concept: "trip_expense",
      source: "tenant",
      version: 3,
      effectiveFrom: "2026-10-01T12:00:00Z",
      createdByName: "Gerardo Méndez",
      pendingRequests: 2,
    });
    expect(overview.concepts[0]!.rules.tiers[1]).toEqual({
      minAmount: 5000,
      conditions: { categories: ["fuel"], missingCfdi: true },
      requiresApproval: true,
      steps: [
        { eligibleRoles: ["manager"], eligibleUserIds: ["u-1"] },
        { eligibleRoles: [], eligibleUserIds: ["u-2", "u-1"] },
      ],
    });
  });

  it("toApiRules es inverso de mapRules y vacía pasos de tramos sin autorización", () => {
    expect(toApiRules(mapRules(apiRules))).toEqual(apiRules);
    const noApproval = toApiRules({
      rulesSchemaVersion: 1,
      tiers: [{ minAmount: 0, conditions: {}, requiresApproval: false, steps: [{ eligibleRoles: ["admin"], eligibleUserIds: [] }] }],
    });
    expect(noApproval.tiers[0]!.steps).toEqual([]);
  });

  it("collectEligibleUserIds = unión de personas designadas (lockstep eligible_user_ids)", () => {
    expect(collectEligibleUserIds(mapRules(apiRules)).sort()).toEqual(["u-1", "u-2"]);
  });

  it("mapea guardado con warnings", () => {
    const saved = mapSavedPolicyVersion({
      concept: "settlement",
      source: "tenant",
      version: 1,
      effective_from: null,
      created_by: "u-1",
      rules: apiRules,
      summary: "x",
      warnings: [{ tier_index: 0, step_no: 1, reason: "single_eligible" }],
    });
    expect(saved.warnings).toEqual([{ tierIndex: 0, stepNo: 1, reason: "single_eligible" }]);
  });

  it("mapea versiones con diff y paginación", () => {
    const page = mapPolicyVersionsResponse({
      data: [
        {
          version: 2,
          effective_from: "2026-10-01T00:00:00Z",
          created_by: "u-1",
          created_by_name: "Ana López",
          source: "tenant",
          diff_summary: [{ field: "min_amount", tier_index: 1, step_no: null, from: 15000, to: 20000 }],
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });
    expect(page.items[0]).toMatchObject({
      version: 2,
      createdByName: "Ana López",
      diffSummary: [{ field: "min_amount", tierIndex: 1, stepNo: null, from: 15000, to: 20000 }],
    });
    expect(page.totalPages).toBe(1);
  });

  it("simulación: hechos camel → snake y resultado snake → camel", () => {
    expect(toApiSimulationFacts({ amount: 100, category: "fuel", missingCfdi: true })).toEqual({
      amount: 100,
      category: "fuel",
      missing_cfdi: true,
    });
    expect(
      mapSimulationResult({
        requires_approval: true,
        tier_index: 1,
        steps: [{ step_no: 1, eligible: [{ user_id: "u-1", full_name: "Ana", role: "admin" }] }],
        violations: [],
      }),
    ).toEqual({
      requiresApproval: true,
      tierIndex: 1,
      steps: [{ stepNo: 1, eligible: [{ userId: "u-1", fullName: "Ana", role: "admin" }] }],
      violations: [],
    });
  });

  it("usuario candidato compone el nombre", () => {
    expect(mapCandidateUser({ id: "u", first_name: "Ana", last_name: "López", role: "admin" })).toEqual({
      id: "u",
      fullName: "Ana López",
      role: "admin",
    });
  });
});
