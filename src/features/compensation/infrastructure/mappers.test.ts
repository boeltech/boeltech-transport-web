import { describe, expect, it } from "vitest";
import { mapCorridor, mapCorridorFromApi, mapTemplate, mapTemplateFromApi } from "./mappers";

describe("compensation mappers", () => {
  it("mapTemplate convierte snake_case a camelCase", () => {
    const mapped = mapTemplate({
      id: "tpl-1",
      name: "Operador foráneo",
      description: null,
      is_active: true,
      rules: [
        {
          id: "rule-1",
          route_type: "long_haul",
          commission_type: "rate_per_km",
          rate_value: 3,
          minimum_guaranteed_amount: 0,
          notes: null,
          sort_order: 0,
        },
      ],
      fixed_allowances: [
        {
          id: "allow-1",
          allowance_type: "meals",
          label: "Comidas",
          amount: 500,
          period: "weekly",
          is_mandatory: true,
        },
      ],
      corridor_ids: ["corridor-1"],
      corridors: [
        {
          id: "corridor-1",
          name: "CDMX → MTY",
          origin_ref_type: "city_label",
          origin_ref_value: "CDMX",
          destination_ref_type: "city_label",
          destination_ref_value: "Monterrey",
          fixed_amount: 1500,
          notes: null,
          is_active: true,
        },
      ],
      active_assignments_count: 3,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-01T00:00:00.000Z",
    });

    expect(mapped.name).toBe("Operador foráneo");
    expect(mapped.rules[0]?.routeType).toBe("long_haul");
    expect(mapped.fixedAllowances[0]?.amount).toBe(500);
    expect(mapped.corridorIds).toEqual(["corridor-1"]);
    expect(mapped.activeAssignmentsCount).toBe(3);
  });

  it("mapTemplate usa 0 cuando falta active_assignments_count", () => {
    const mapped = mapTemplate({
      id: "tpl-empty",
      name: "Vacío",
      description: null,
      is_active: true,
      rules: [],
      fixed_allowances: [],
      corridor_ids: [],
      corridors: [],
    });

    expect(mapped.activeAssignmentsCount).toBe(0);
  });

  it("mapTemplateFromApi convierte camelCase post-mapSingleResponse", () => {
    const mapped = mapTemplateFromApi({
      id: "tpl-1",
      name: "Operador foráneo",
      description: null,
      isActive: true,
      rules: [
        {
          id: "rule-1",
          routeType: "long_haul",
          commissionType: "rate_per_km",
          rateValue: 3,
          minimumGuaranteedAmount: 0,
          notes: null,
          sortOrder: 0,
        },
      ],
      fixedAllowances: [
        {
          id: "allow-1",
          allowanceType: "meals",
          label: "Comidas",
          amount: 500,
          period: "weekly",
          isMandatory: true,
        },
      ],
      corridorIds: ["corridor-1"],
      corridors: [
        {
          id: "corridor-1",
          name: "CDMX → MTY",
          originRefType: "city_label",
          originRefValue: "CDMX",
          destinationRefType: "city_label",
          destinationRefValue: "Monterrey",
          fixedAmount: 1500,
          notes: null,
          isActive: true,
        },
      ],
      activeAssignmentsCount: 3,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(mapped.isActive).toBe(true);
    expect(mapped.rules[0]?.routeType).toBe("long_haul");
    expect(mapped.fixedAllowances[0]?.isMandatory).toBe(true);
    expect(mapped.corridorIds).toEqual(["corridor-1"]);
    expect(mapped.activeAssignmentsCount).toBe(3);
  });

  it("mapTemplateFromApi usa 0 cuando falta activeAssignmentsCount", () => {
    const mapped = mapTemplateFromApi({
      id: "tpl-empty",
      name: "Vacío",
      description: null,
      isActive: true,
      rules: [],
      fixedAllowances: [],
      corridorIds: [],
      corridors: [],
    });

    expect(mapped.activeAssignmentsCount).toBe(0);
  });

  it("mapCorridor convierte refs y monto", () => {
    const mapped = mapCorridor({
      id: "corridor-1",
      name: "CDMX → MTY",
      origin_ref_type: "city_label",
      origin_ref_value: "CDMX",
      destination_ref_type: "city_label",
      destination_ref_value: "Monterrey",
      fixed_amount: 1500,
      notes: null,
      is_active: true,
    });

    expect(mapped.originRefType).toBe("city_label");
    expect(mapped.fixedAmount).toBe(1500);
  });

  it("mapCorridorFromApi convierte camelCase post-mapSingleResponse", () => {
    const mapped = mapCorridorFromApi({
      id: "corridor-1",
      name: "CDMX → MTY",
      originRefType: "city_label",
      originRefValue: "CDMX",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1500,
      notes: null,
      isActive: true,
      createdAt: "2026-09-01T00:00:00.000Z",
      updatedAt: "2026-09-01T00:00:00.000Z",
    });

    expect(mapped.originRefType).toBe("city_label");
    expect(mapped.originRefValue).toBe("CDMX");
    expect(mapped.destinationRefValue).toBe("Monterrey");
    expect(mapped.fixedAmount).toBe(1500);
    expect(mapped.isActive).toBe(true);
  });
});
