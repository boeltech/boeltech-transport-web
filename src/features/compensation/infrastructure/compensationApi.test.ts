import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock, postMock, patchMock, putMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
  postMock: vi.fn(),
  patchMock: vi.fn(),
  putMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      get: getMock,
      post: postMock,
      patch: patchMock,
      put: putMock,
    },
  };
});

import type { CompensationTemplateRule } from "../domain/entities";
import { compensationApi } from "./compensationApi";

describe("compensationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listCorridors maps snake_case corridor fields and pagination (total_pages → totalPages)", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "cor-1",
          name: "CDMX → MTY",
          origin_ref_type: "city_label",
          origin_ref_value: "Ciudad de México",
          destination_ref_type: "city_label",
          destination_ref_value: "Monterrey",
          fixed_amount: 1500,
          notes: null,
          is_active: true,
        },
      ],
      pagination: {
        page: 1,
        limit: 20,
        total: 25,
        total_pages: 2,
      },
    });

    const result = await compensationApi.listCorridors({ page: 1, pageSize: 20 });

    expect(getMock).toHaveBeenCalledWith("/compensation/corridors", {
      params: {
        search: undefined,
        is_active: undefined,
        page: 1,
        page_size: 20,
      },
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      totalPages: 2,
    });
    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: "cor-1",
      name: "CDMX → MTY",
      originRefType: "city_label",
      originRefValue: "Ciudad de México",
      destinationRefType: "city_label",
      destinationRefValue: "Monterrey",
      fixedAmount: 1500,
      isActive: true,
    });
  });

  it("listTemplates maps snake_case pagination to camelCase", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "tpl-1",
          name: "Operador foráneo",
          description: null,
          is_active: true,
          rules: [],
          fixed_allowances: [],
          corridor_ids: [],
          corridors: [],
          active_assignments_count: 2,
        },
      ],
      pagination: {
        page: 2,
        limit: 20,
        total: 25,
        total_pages: 2,
      },
    });

    const result = await compensationApi.listTemplates({ page: 2, pageSize: 20 });

    expect(getMock).toHaveBeenCalledWith("/compensation/templates", {
      params: {
        search: undefined,
        is_active: undefined,
        page: 2,
        page_size: 20,
      },
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 20,
      total: 25,
      totalPages: 2,
    });
    expect(result.data[0]?.name).toBe("Operador foráneo");
    expect(result.data[0]?.activeAssignmentsCount).toBe(2);
  });

  it("listTemplates agrupado por familia: manda group_by/scope/inactive_reason sin is_active y mapea `family`", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "tpl-2",
          family_id: "tpl-1",
          name: "Operador foráneo",
          status: "active",
          version: 2,
          is_active: true,
          rules: [],
          fixed_allowances: [],
          corridor_ids: [],
          corridors: [],
          family: {
            versions_count: 3,
            active_version: { id: "tpl-2", version: 2 },
            draft_version: { id: "tpl-3", version: 3 },
            superseded_active_assignments_count: 4,
            superseded_scheduled_assignments_count: 1,
          },
        },
      ],
      pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
    });

    const result = await compensationApi.listTemplates({
      groupBy: "family",
      scope: "current",
      isActive: true,
      page: 1,
      pageSize: 20,
    });

    const params = getMock.mock.calls[0]?.[1]?.params as Record<string, unknown>;
    expect(params).toMatchObject({ group_by: "family", scope: "current", page: 1, page_size: 20 });
    expect(params.is_active).toBeUndefined();
    expect(params.status).toBeUndefined();
    expect(result.data[0]?.family).toEqual({
      versionsCount: 3,
      activeVersion: { id: "tpl-2", version: 2 },
      draftVersion: { id: "tpl-3", version: 3 },
      supersededActiveAssignmentsCount: 4,
      supersededScheduledAssignmentsCount: 1,
    });

    await compensationApi.listTemplates({
      groupBy: "family",
      status: "inactive",
      inactiveReason: "superseded",
    });
    expect(getMock.mock.calls[1]?.[1]?.params).toMatchObject({
      group_by: "family",
      status: "inactive",
      inactive_reason: "superseded",
    });
  });

  it("listAssignments maps snake_case pagination to camelCase", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "asg-1",
          employee_id: "emp-1",
          template_id: "tpl-1",
          effective_from: "2026-09-01",
          effective_to: null,
          is_active: true,
          employee_full_name: "Juan Pérez",
          template_name: "Operador foráneo",
        },
      ],
      pagination: {
        page: 1,
        limit: 50,
        total: 60,
        total_pages: 2,
      },
    });

    const result = await compensationApi.listAssignments({
      templateId: "tpl-1",
      page: 1,
      pageSize: 50,
    });

    expect(getMock).toHaveBeenCalledWith("/compensation/template-assignments", {
      params: {
        template_id: "tpl-1",
        employee_id: undefined,
        active_on: undefined,
        page: 1,
        page_size: 50,
      },
    });
    expect(result.pagination).toEqual({
      page: 1,
      limit: 50,
      total: 60,
      totalPages: 2,
    });
    expect(result.data[0]?.employeeFullName).toBe("Juan Pérez");
  });

  describe("reglas «Sin pago extra» (none) viajan con tarifa y mínimo en 0", () => {
    const rules: CompensationTemplateRule[] = [
      {
        routeType: "local",
        commissionType: "none",
        rateValue: 5,
        minimumGuaranteedAmount: 500,
        notes: "oculto en el editor",
        sortOrder: 0,
      },
      {
        routeType: "long_haul",
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 400,
        sortOrder: 1,
      },
    ];

    const expectedRules = [
      {
        routeType: "local",
        commissionType: "none",
        rateValue: 0,
        minimumGuaranteedAmount: 0,
        notes: "oculto en el editor",
        sortOrder: 0,
      },
      {
        routeType: "long_haul",
        commissionType: "rate_per_km",
        rateValue: 3,
        minimumGuaranteedAmount: 400,
        notes: null,
        sortOrder: 1,
      },
    ];

    const templateResponse = {
      data: {
        id: "tpl-1",
        name: "Operador",
        description: null,
        is_active: false,
        rules: [],
        fixed_allowances: [],
        corridor_ids: [],
        corridors: [],
      },
    };

    it("createTemplate", async () => {
      postMock.mockResolvedValue(templateResponse);

      await compensationApi.createTemplate({ name: "Operador", rules });

      expect(postMock.mock.calls[0]?.[1]).toMatchObject({ rules: expectedRules });
    });

    it("updateTemplate (PATCH)", async () => {
      patchMock.mockResolvedValue(templateResponse);

      await compensationApi.updateTemplate("tpl-1", { rules });

      expect(patchMock.mock.calls[0]?.[1]).toEqual({ rules: expectedRules });
    });

    it("replaceTemplateConfiguration (PUT)", async () => {
      putMock.mockResolvedValue(templateResponse);

      await compensationApi.replaceTemplateConfiguration("tpl-1", {
        rules,
        fixedAllowances: [],
        deductions: [],
        corridorIds: [],
      });

      expect(putMock.mock.calls[0]?.[1]).toMatchObject({ rules: expectedRules });
    });
  });

  describe("api#63 — vista previa del lote y asignación por id", () => {
    const payload = {
      templateId: "tpl-v2",
      employeeIds: ["emp-fernando", "emp-1", "emp-fernando"],
      effectiveFrom: "2026-09-01",
      reason: "Cambio de versión",
    };

    const expectedBody = {
      templateId: "tpl-v2",
      employeeIds: ["emp-fernando", "emp-1"],
      effectiveFrom: "2026-09-01",
      effectiveTo: null,
      closePreviousAssignment: true,
      reason: "Cambio de versión",
    };

    it("previewBatchAssignments hace POST a /batch/preview con el body del lote y mapea", async () => {
      postMock.mockResolvedValue({
        data: {
          would_create_count: 1,
          would_skip_count: 1,
          employees: [
            { employee_id: "emp-fernando", employee_full_name: "Fernando Castillo", outcome: "skip" },
            { employee_id: "emp-1", employee_full_name: "Ana López", outcome: "create" },
          ],
          conflicts: [
            {
              employee_id: "emp-fernando",
              code: "OVERLAPPING_ACTIVE_ASSIGNMENT",
              message: "No se puede cerrar …",
              reason: "previous_starts_on_or_after",
              employee_full_name: "Fernando Castillo",
              existing_assignment_id: "asg-v1",
              existing_template_id: "tpl-v1",
              existing_template_name: "Operador Foráneo Estándar",
              existing_template_version: 1,
              existing_effective_from: "2026-09-01",
              existing_effective_to: "2026-10-06",
              suggested_effective_from: "2026-10-07",
            },
          ],
          closures: [],
        },
      });

      const result = await compensationApi.previewBatchAssignments(payload);

      expect(postMock).toHaveBeenCalledTimes(1);
      expect(postMock).toHaveBeenCalledWith(
        "/compensation/template-assignments/batch/preview",
        expectedBody,
      );
      expect(result.wouldSkipCount).toBe(1);
      expect(result.employees.map((e) => e.employeeFullName)).toEqual([
        "Fernando Castillo",
        "Ana López",
      ]);
      expect(result.conflicts[0]).toMatchObject({
        reason: "previous_starts_on_or_after",
        existingTemplateVersion: 1,
        existingEffectiveTo: "2026-10-06",
        suggestedEffectiveFrom: "2026-10-07",
      });
    });

    it("batchCreateAssignments manda el mismo body sin ids repetidos (el lote no los quita)", async () => {
      postMock.mockResolvedValue({
        data: { created_count: 2, skipped_count: 0, conflicts: [], created: [] },
      });

      await compensationApi.batchCreateAssignments(payload);

      expect(postMock).toHaveBeenCalledWith(
        "/compensation/template-assignments/batch",
        expectedBody,
      );
    });

    it("conserva la casilla desmarcada y el «hasta»", async () => {
      postMock.mockResolvedValue({
        data: { would_create_count: 0, would_skip_count: 0, employees: [], conflicts: [], closures: [] },
      });

      await compensationApi.previewBatchAssignments({
        ...payload,
        effectiveTo: "2026-09-30",
        closePreviousAssignment: false,
      });

      expect(postMock).toHaveBeenCalledWith(
        "/compensation/template-assignments/batch/preview",
        { ...expectedBody, effectiveTo: "2026-09-30", closePreviousAssignment: false },
      );
    });

    it("getAssignment hace GET por id y mapea", async () => {
      getMock.mockResolvedValue({
        data: {
          id: "asg-v1",
          employee_id: "emp-fernando",
          employee_full_name: "Fernando Castillo",
          template_id: "tpl-v1",
          effective_from: "2026-09-01",
          effective_to: "2026-10-06",
          is_active: true,
        },
      });

      const result = await compensationApi.getAssignment("asg-v1");

      expect(getMock).toHaveBeenCalledWith("/compensation/template-assignments/asg-v1");
      expect(result).toMatchObject({
        id: "asg-v1",
        employeeFullName: "Fernando Castillo",
        templateId: "tpl-v1",
        effectiveTo: "2026-10-06",
        isActive: true,
      });
    });
  });
});
