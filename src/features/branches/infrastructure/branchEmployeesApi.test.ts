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

import { branchEmployeesApi } from "./branchEmployeesApi";

const BRANCH_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("branchEmployeesApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists employees by branch with camelCase mapping", async () => {
    getMock.mockResolvedValue({
      data: [
        {
          id: "emp-1",
          employee_number: "EMP-001",
          full_name: "Juan Pérez",
          department: "Operaciones",
          position: "Chofer",
          status: "active",
        },
      ],
      pagination: {
        page: 1,
        limit: 100,
        total: 1,
        total_pages: 1,
      },
    });

    const employees = await branchEmployeesApi.listByBranch(BRANCH_ID);

    expect(getMock).toHaveBeenCalledWith("/employees", {
      params: {
        branch_id: BRANCH_ID,
        is_active: true,
        limit: 100,
        page: 1,
        sort_by: "first_name",
        sort_order: "asc",
      },
    });
    expect(employees).toEqual([
      {
        id: "emp-1",
        employeeNumber: "EMP-001",
        fullName: "Juan Pérez",
        department: "Operaciones",
        position: "Chofer",
        status: "active",
      },
    ]);
  });
});
