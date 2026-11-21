import { beforeEach, describe, expect, it, vi } from "vitest";
import { employeeQueryKeys } from "../employeeQueryKeys";

const invalidateQueries = vi.fn();
const setQueryData = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries, setQueryData }),
}));

vi.mock("../../infrastructure/employeeRepository", () => ({
  fetchEmployees: vi.fn(),
  fetchEmployee: vi.fn(),
  createEmployee: vi.fn(),
  updateEmployee: vi.fn(),
  terminateEmployee: vi.fn(),
  getAvailableForDriver: vi.fn(),
  getEmployeeBasic: vi.fn(),
}));

vi.mock("../../infrastructure/employeeAddressRepository", () => ({
  fetchEmployeeAddresses: vi.fn(),
  fetchEmployeeAddressById: vi.fn(),
  pickEmployeePersonalAddress: vi.fn(),
}));

vi.mock("../../infrastructure/mappers", () => ({
  mapPaginatedEmployees: vi.fn(),
  mapEmployee: vi.fn(),
  mapApiToEmployeeForSelection: vi.fn(),
  mapApiToEmployeeList: vi.fn(),
}));

import { useTerminateEmployee, useUpdateEmployee } from "./useEmployees";

const COMPENSATION_ASSIGNMENTS_KEY = ["compensation", "assignments"];
const SETTLEMENTS_WORKBENCH_KEY = ["settlements", "workbench"];
const SETTLEMENTS_OPERATORS_KEY = ["settlements", "operators"];

describe("useEmployees cache invalidation", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
    setQueryData.mockClear();
  });

  it("useUpdateEmployee invalidates Ops + Wb + CompA", () => {
    const mutation = useUpdateEmployee("emp-1") as unknown as {
      onSuccess?: (result: { data: { id: string } }) => void;
    };

    mutation.onSuccess?.({ data: { id: "emp-1" } });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: COMPENSATION_ASSIGNMENTS_KEY,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: SETTLEMENTS_WORKBENCH_KEY,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: SETTLEMENTS_OPERATORS_KEY,
    });
  });

  it("useTerminateEmployee invalidates Emp + Ops + Wb + CompA (H-U09-Q01)", () => {
    const mutation = useTerminateEmployee() as unknown as {
      onSuccess?: (id: string) => void;
    };

    mutation.onSuccess?.("emp-9");

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: employeeQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: employeeQueryKeys.detail("emp-9"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: employeeQueryKeys.basic("emp-9"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: employeeQueryKeys.availableForDriver(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: COMPENSATION_ASSIGNMENTS_KEY,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: SETTLEMENTS_WORKBENCH_KEY,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: SETTLEMENTS_OPERATORS_KEY,
    });
  });
});
