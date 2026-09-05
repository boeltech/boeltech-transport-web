import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMock } = vi.hoisted(() => ({
  getMock: vi.fn(),
}));

vi.mock("@shared/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/api")>();
  return {
    ...actual,
    apiClient: {
      get: getMock,
    },
  };
});

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
});
