import { describe, expect, it } from "vitest";
import {
  mapBatchConflict,
  mapBatchConflictFromApi,
  mapBatchPreviewFromApi,
  mapBatchResultFromApi,
  mapCorridor,
  mapCorridorFromApi,
  mapFrequentCityPair,
  mapFrequentCityPairFromApi,
  mapTemplate,
  mapTemplateFromApi,
} from "./mappers";

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
        {
          id: "allow-2",
          allowance_type: "employer_contribution",
          label: "Aportación patronal",
          amount: 150,
          period: "monthly",
          is_mandatory: false,
        },
      ],
      deductions: [
        {
          id: "ded-1",
          deduction_type: "savings_fund",
          label: "Fondo de ahorro",
          amount: 200,
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
    expect(mapped.midTripPayoutPolicy).toBe("split_by_assigned_km");
    expect(mapped.status).toBe("active");
    expect(mapped.version).toBe(1);
    expect(mapped.familyId).toBe("tpl-1");
    expect(mapped.lockedForEdit).toBe(false);
    expect(mapped.rules[0]?.routeType).toBe("long_haul");
    expect(mapped.fixedAllowances[0]?.amount).toBe(500);
    expect(mapped.fixedAllowances[1]?.allowanceType).toBe("employer_contribution");
    expect(mapped.deductions).toHaveLength(1);
    expect(mapped.deductions[0]?.deductionType).toBe("savings_fund");
    expect(mapped.corridorIds).toEqual(["corridor-1"]);
    expect(mapped.activeAssignmentsCount).toBe(3);
  });

  it("mapTemplate usa 0 cuando falta active_assignments_count y deductions vacías", () => {
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
    expect(mapped.deductions).toEqual([]);
  });

  it("mapTemplateFromApi convierte camelCase post-mapSingleResponse", () => {
    const mapped = mapTemplateFromApi({
      id: "tpl-1",
      name: "Operador foráneo",
      description: null,
      isActive: true,
      status: "active",
      version: 2,
      familyId: "fam-1",
      supersedesTemplateId: "tpl-0",
      lockedForEdit: true,
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
      deductions: [
        {
          id: "ded-1",
          deductionType: "union_dues",
          label: "Cuota sindical",
          amount: 50,
          period: "biweekly",
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
    expect(mapped.status).toBe("active");
    expect(mapped.version).toBe(2);
    expect(mapped.familyId).toBe("fam-1");
    expect(mapped.supersedesTemplateId).toBe("tpl-0");
    expect(mapped.lockedForEdit).toBe(true);
    expect(mapped.rules[0]?.routeType).toBe("long_haul");
    expect(mapped.fixedAllowances[0]?.isMandatory).toBe(true);
    expect(mapped.deductions[0]?.deductionType).toBe("union_dues");
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
    expect(mapped.deductions).toEqual([]);
  });

  describe("api#59 F1/F4 — motivo de inactivación y de bloqueo", () => {
    const baseRaw = {
      id: "tpl-2",
      name: "Operador foráneo",
      description: null,
      is_active: false,
      status: "inactive",
      version: 2,
      rules: [],
      fixed_allowances: [],
      corridor_ids: [],
      corridors: [],
    };

    it("mapTemplate convierte los cuatro campos snake_case", () => {
      const mapped = mapTemplate({
        ...baseRaw,
        locked_for_edit: true,
        locked_reason: "superseded",
        inactive_reason: "superseded",
        superseded_by_template_id: "tpl-1",
        inactivated_at: "2026-10-01T15:00:00.000Z",
      });

      expect(mapped.lockedReason).toBe("superseded");
      expect(mapped.inactiveReason).toBe("superseded");
      expect(mapped.supersededByTemplateId).toBe("tpl-1");
      expect(mapped.inactivatedAt).toBe("2026-10-01T15:00:00.000Z");
    });

    it("sin los campos (API anterior) no agrega las claves", () => {
      const mapped = mapTemplate(baseRaw);

      expect(mapped).not.toHaveProperty("lockedReason");
      expect(mapped).not.toHaveProperty("inactiveReason");
      expect(mapped).not.toHaveProperty("supersededByTemplateId");
      expect(mapped).not.toHaveProperty("inactivatedAt");
    });

    it("conserva null distinto de ausente", () => {
      const mapped = mapTemplateFromApi({
        id: "tpl-2",
        name: "Operador foráneo",
        description: null,
        isActive: false,
        status: "inactive",
        lockedReason: null,
        inactiveReason: null,
        supersededByTemplateId: null,
        inactivatedAt: null,
        rules: [],
        fixedAllowances: [],
        corridorIds: [],
        corridors: [],
      });

      expect(mapped.lockedReason).toBeNull();
      expect(mapped.inactiveReason).toBeNull();
      expect(mapped.supersededByTemplateId).toBeNull();
      expect(mapped.inactivatedAt).toBeNull();
    });

    it("mapTemplateFromApi acepta manual y used_in_settlements", () => {
      const mapped = mapTemplateFromApi({
        id: "tpl-2",
        name: "Operador foráneo",
        description: null,
        isActive: false,
        status: "inactive",
        lockedForEdit: true,
        lockedReason: "used_in_settlements",
        inactiveReason: "manual",
        rules: [],
        fixedAllowances: [],
        corridorIds: [],
        corridors: [],
      });

      expect(mapped.lockedReason).toBe("used_in_settlements");
      expect(mapped.inactiveReason).toBe("manual");
    });

    it("un motivo desconocido se trata como ausente", () => {
      const mapped = mapTemplate({
        ...baseRaw,
        locked_reason: "otro",
        inactive_reason: "archivada",
      });

      expect(mapped).not.toHaveProperty("lockedReason");
      expect(mapped).not.toHaveProperty("inactiveReason");
    });
  });

  describe("api#63 — conflictos del lote, vista previa y programadas", () => {
    const templateBase = {
      id: "tpl-v2",
      name: "Operador Foráneo Estándar",
      description: null,
      is_active: true,
      rules: [],
      fixed_allowances: [],
      corridor_ids: [],
      corridors: [],
      active_assignments_count: 2,
    };

    it("mapTemplate y mapTemplateFromApi leen scheduled_assignments_count", () => {
      expect(
        mapTemplate({ ...templateBase, scheduled_assignments_count: 1 }).scheduledAssignmentsCount,
      ).toBe(1);
      expect(
        mapTemplateFromApi({
          id: "tpl-v2",
          name: "Operador Foráneo Estándar",
          description: null,
          isActive: true,
          rules: [],
          fixedAllowances: [],
          corridorIds: [],
          corridors: [],
          activeAssignmentsCount: 2,
          scheduledAssignmentsCount: 0,
        }).scheduledAssignmentsCount,
      ).toBe(0);
    });

    it("plantilla sin scheduled (API anterior) → undefined, no 0", () => {
      expect(mapTemplate(templateBase).scheduledAssignmentsCount).toBeUndefined();
      expect(
        mapTemplateFromApi({
          id: "tpl-v2",
          name: "Operador Foráneo Estándar",
          description: null,
          isActive: true,
          rules: [],
          fixedAllowances: [],
          corridorIds: [],
          corridors: [],
        }).scheduledAssignmentsCount,
      ).toBeUndefined();
    });

    const fullConflictSnake = {
      employee_id: "emp-fernando",
      code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
      message: "No se puede cerrar la asignación anterior: …",
      reason: "previous_starts_on_or_after",
      employee_full_name: "Fernando Castillo",
      existing_assignment_id: "asg-v1",
      existing_template_id: "tpl-v1",
      existing_template_name: "Operador Foráneo Estándar",
      existing_template_version: 1,
      existing_effective_from: "2026-09-01",
      existing_effective_to: "2026-10-06",
      close_previous_on: null,
      suggested_effective_from: "2026-10-07",
    };

    const fullConflictMapped = {
      employeeId: "emp-fernando",
      code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
      message: "No se puede cerrar la asignación anterior: …",
      reason: "previous_starts_on_or_after",
      employeeFullName: "Fernando Castillo",
      existingAssignmentId: "asg-v1",
      existingTemplateId: "tpl-v1",
      existingTemplateName: "Operador Foráneo Estándar",
      existingTemplateVersion: 1,
      existingEffectiveFrom: "2026-09-01",
      existingEffectiveTo: "2026-10-06",
      closePreviousOn: null,
      suggestedEffectiveFrom: "2026-10-07",
    };

    it("conflicto completo: snake y camel dan lo mismo", () => {
      expect(mapBatchConflict(fullConflictSnake)).toEqual(fullConflictMapped);
      expect(
        mapBatchConflictFromApi({
          employeeId: "emp-fernando",
          code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
          message: "No se puede cerrar la asignación anterior: …",
          reason: "previous_starts_on_or_after",
          employeeFullName: "Fernando Castillo",
          existingAssignmentId: "asg-v1",
          existingTemplateId: "tpl-v1",
          existingTemplateName: "Operador Foráneo Estándar",
          existingTemplateVersion: 1,
          existingEffectiveFrom: "2026-09-01",
          existingEffectiveTo: "2026-10-06",
          closePreviousOn: null,
          suggestedEffectiveFrom: "2026-10-07",
        }),
      ).toEqual(fullConflictMapped);
    });

    it("conflicto de días liquidados con liquidaciones que bloquean", () => {
      const mapped = mapBatchConflict({
        employee_id: "emp-1",
        code: "ASSIGNMENT_PERIOD_SETTLED",
        message: "La liquidación LIQ-0012 …",
        reason: "period_settled",
        existing_assignment_id: null,
        existing_template_id: null,
        blocking_settlements: [
          {
            settlement_id: "set-1",
            settlement_number: "LIQ-0012",
            status: "approved",
            period_start: "2026-09-01",
            period_end: "2026-09-15",
          },
        ],
        blocking_settlements_total: 1,
        min_effective_to: "2026-09-15",
        suggested_effective_from: "2026-09-16",
      });

      expect(mapped.reason).toBe("period_settled");
      expect(mapped.existingAssignmentId).toBeNull();
      expect(mapped.existingTemplateId).toBeNull();
      expect(mapped.blockingSettlements).toEqual([
        {
          settlementId: "set-1",
          settlementNumber: "LIQ-0012",
          status: "approved",
          periodStart: "2026-09-01",
          periodEnd: "2026-09-15",
        },
      ]);
      expect(mapped.blockingSettlementsTotal).toBe(1);
      expect(mapped.minEffectiveTo).toBe("2026-09-15");
      expect(mapped.suggestedEffectiveFrom).toBe("2026-09-16");
    });

    it("conflicto vacío (API anterior): campos nuevos → undefined", () => {
      const mapped = mapBatchConflict({ employee_id: "emp-1", code: "OVERLAPPING_ACTIVE_ASSIGNMENT" });

      expect(mapped).toEqual({ employeeId: "emp-1", code: "OVERLAPPING_ACTIVE_ASSIGNMENT" });
      for (const key of [
        "message",
        "reason",
        "employeeFullName",
        "existingAssignmentId",
        "existingTemplateId",
        "existingTemplateName",
        "existingTemplateVersion",
        "existingEffectiveFrom",
        "existingEffectiveTo",
        "closePreviousOn",
        "suggestedEffectiveFrom",
        "blockingSettlements",
        "blockingSettlementsTotal",
        "minEffectiveTo",
      ] as const) {
        expect(mapped[key]).toBeUndefined();
      }
    });

    it("un reason desconocido se trata como ausente", () => {
      expect(
        mapBatchConflict({ ...fullConflictSnake, reason: "ASSIGNMENT_PERIOD_SETTLED" }).reason,
      ).toBeUndefined();
    });

    it("mapBatchResultFromApi conserva los campos nuevos de cada conflicto", () => {
      const result = mapBatchResultFromApi({
        createdCount: 0,
        skippedCount: 1,
        conflicts: [
          {
            employeeId: "emp-fernando",
            code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
            reason: "overlap_close_disabled",
            closePreviousOn: "2026-09-14",
          },
        ],
        created: [],
      });

      expect(result.conflicts[0]).toMatchObject({
        reason: "overlap_close_disabled",
        closePreviousOn: "2026-09-14",
      });
    });

    it("mapBatchPreviewFromApi convierte operadores, conflictos y cierres", () => {
      const preview = mapBatchPreviewFromApi({
        wouldCreateCount: 1,
        wouldSkipCount: 1,
        employees: [
          { employeeId: "emp-1", employeeFullName: "Ana López", outcome: "create" },
          { employeeId: "emp-fernando", employeeFullName: null, outcome: "skip" },
        ],
        conflicts: [
          {
            employeeId: "emp-fernando",
            code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
            reason: "previous_starts_on_or_after",
            existingTemplateVersion: 1,
          },
        ],
        closures: [
          {
            employeeId: "emp-1",
            employeeFullName: "Ana López",
            assignmentId: "asg-ana-v1",
            templateId: "tpl-v1",
            templateName: "Operador Foráneo Estándar",
            templateVersion: 1,
            effectiveFrom: "2026-08-01",
            effectiveTo: null,
            closeTo: "2026-08-31",
          },
        ],
      });

      expect(preview).toEqual({
        wouldCreateCount: 1,
        wouldSkipCount: 1,
        employees: [
          { employeeId: "emp-1", employeeFullName: "Ana López", outcome: "create" },
          { employeeId: "emp-fernando", employeeFullName: null, outcome: "skip" },
        ],
        conflicts: [
          {
            employeeId: "emp-fernando",
            code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
            reason: "previous_starts_on_or_after",
            existingTemplateVersion: 1,
          },
        ],
        closures: [
          {
            employeeId: "emp-1",
            employeeFullName: "Ana López",
            assignmentId: "asg-ana-v1",
            templateId: "tpl-v1",
            templateName: "Operador Foráneo Estándar",
            templateVersion: 1,
            effectiveFrom: "2026-08-01",
            effectiveTo: null,
            closeTo: "2026-08-31",
          },
        ],
      });
    });

    it("vista previa sin listas → arreglos vacíos", () => {
      expect(mapBatchPreviewFromApi({ wouldCreateCount: 0, wouldSkipCount: 0 })).toEqual({
        wouldCreateCount: 0,
        wouldSkipCount: 0,
        employees: [],
        conflicts: [],
        closures: [],
      });
    });
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

  it("mapFrequentCityPair convierte snake_case a camelCase", () => {
    const mapped = mapFrequentCityPair({
      origin_city: "Guadalajara",
      destination_city: "Tijuana",
      origin_state: "Jalisco",
      destination_state: "Baja California",
      trip_count: 12,
      last_used_at: "2026-09-15T18:00:00.000Z",
    });

    expect(mapped.originCity).toBe("Guadalajara");
    expect(mapped.destinationCity).toBe("Tijuana");
    expect(mapped.originState).toBe("Jalisco");
    expect(mapped.destinationState).toBe("Baja California");
    expect(mapped.tripCount).toBe(12);
    expect(mapped.lastUsedAt).toBe("2026-09-15T18:00:00.000Z");
  });

  it("mapFrequentCityPairFromApi conserva camelCase post-mapSingleResponse", () => {
    const mapped = mapFrequentCityPairFromApi({
      originCity: "CDMX",
      destinationCity: "Monterrey",
      originState: null,
      destinationState: "Nuevo León",
      tripCount: 3,
      lastUsedAt: "2026-09-20T12:00:00.000Z",
    });

    expect(mapped.originCity).toBe("CDMX");
    expect(mapped.destinationCity).toBe("Monterrey");
    expect(mapped.originState).toBeNull();
    expect(mapped.destinationState).toBe("Nuevo León");
    expect(mapped.tripCount).toBe(3);
    expect(mapped.lastUsedAt).toBe("2026-09-20T12:00:00.000Z");
  });
});
