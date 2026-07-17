import { apiClient, mapPaginatedResponse } from "@shared/api";
import type { DeepCamelCase } from "@shared/api";

export interface ApiBranchEmployeeListItem {
  id: string;
  employee_number: string;
  full_name: string;
  department: string | null;
  position: string | null;
  status: string;
}

export interface BranchEmployeeListItem {
  id: string;
  employeeNumber: string;
  fullName: string;
  department: string | null;
  position: string | null;
  status: string;
}

function mapBranchEmployeeItem(
  raw: DeepCamelCase<ApiBranchEmployeeListItem>,
): BranchEmployeeListItem {
  return {
    id: raw.id,
    employeeNumber: raw.employeeNumber,
    fullName: raw.fullName,
    department: raw.department,
    position: raw.position,
    status: raw.status,
  };
}

export const branchEmployeesApi = {
  listByBranch: async (branchId: string): Promise<BranchEmployeeListItem[]> => {
    const response = await apiClient.get<{
      data: ApiBranchEmployeeListItem[];
      pagination: { page: number; limit: number; total: number; total_pages: number };
    }>("/employees", {
      params: {
        branch_id: branchId,
        is_active: true,
        limit: 100,
        page: 1,
        sort_by: "first_name",
        sort_order: "asc",
      },
    });

    const mapped = mapPaginatedResponse(response);
    return mapped.data.map(mapBranchEmployeeItem);
  },
};
