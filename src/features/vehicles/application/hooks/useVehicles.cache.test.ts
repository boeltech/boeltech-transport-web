import { beforeEach, describe, expect, it, vi } from "vitest";

import { branchVehicleQueryKeys } from "@features/branches/domain";
import { dashboardQueryKeys } from "@features/dashboard/domain";
import { fleetDocumentsQueryKeys } from "@features/fleet-documents/domain";
import { vehicleQueryKeys, type Vehicle } from "@features/vehicles/domain";

const invalidateQueries = vi.fn().mockResolvedValue(undefined);
const getQueryData = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useMutation: (config: unknown) => useMutationMock(config),
    useQueryClient: () => ({
      invalidateQueries,
      getQueryData,
    }),
  };
});

vi.mock("@features/notifications/application/invalidateNotificationsQueries", () => ({
  invalidateNotificationsQueries: vi.fn(),
}));

vi.mock("../../infrastructure", () => ({
  vehiclesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
    updateStatus: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
  },
}));

import {
  useCreateVehicle,
  useDeleteVehicle,
  useRestoreVehicle,
  useUpdateVehicle,
} from "./useVehicles";

describe("useVehicles cache invalidation (ola5 C1/C2)", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    invalidateQueries.mockResolvedValue(undefined);
    getQueryData.mockReset();
    useMutationMock.mockClear();
  });

  it("update invalidates fleet documents, dashboard and branch vehicles on branch change", () => {
    const vehicleId = "veh-1";
    const previousBranch = "branch-old";
    const nextBranch = "branch-new";
    getQueryData.mockReturnValue({
      id: vehicleId,
      branchId: previousBranch,
    } as Vehicle);

    const mutation = useUpdateVehicle() as unknown as {
      onSuccess: (
        data: { data: { id: string; branchId: string | null } },
        variables: { id: string; data: { branchId?: string } },
      ) => void;
    };

    mutation.onSuccess(
      { data: { id: vehicleId, branchId: nextBranch } },
      { id: vehicleId, data: { branchId: nextBranch } },
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch(previousBranch),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch(nextBranch),
    });
  });

  it("delete invalidates fleet documents and cached branch vehicles", () => {
    const vehicleId = "veh-2";
    getQueryData.mockReturnValue({
      id: vehicleId,
      branchId: "branch-a",
    } as Vehicle);

    const mutation = useDeleteVehicle() as unknown as {
      onSuccess: (
        data: undefined,
        variables: { id: string; payload: { reasonCode: string } },
      ) => void;
    };

    mutation.onSuccess(undefined, {
      id: vehicleId,
      payload: { reasonCode: "venta" },
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch("branch-a"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: vehicleQueryKeys.detail(vehicleId),
    });
  });

  it("create with branchId invalidates fleet documents and that branch", () => {
    const mutation = useCreateVehicle() as unknown as {
      onSuccess: (
        data: { data: { id: string; unitNumber: string } },
        variables: { branchId?: string },
      ) => void;
    };

    mutation.onSuccess(
      { data: { id: "veh-3", unitNumber: "U-3" } },
      { branchId: "branch-create" },
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: dashboardQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch("branch-create"),
    });
  });

  it("restore invalidates fleet documents and vehicle branch", () => {
    const mutation = useRestoreVehicle() as unknown as {
      onSuccess: (
        data: {
          vehicle: { id: string; branchId: string | null };
          warnings: Array<{ previousBranchId: string }>;
        },
        id: string,
      ) => void;
    };

    mutation.onSuccess(
      {
        vehicle: { id: "veh-4", branchId: "branch-restored" },
        warnings: [{ previousBranchId: "branch-cleared" }],
      },
      "veh-4",
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: fleetDocumentsQueryKeys.all,
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch("branch-restored"),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchVehicleQueryKeys.byBranch("branch-cleared"),
    });
  });
});
