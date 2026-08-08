import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  useResendPlatformTenantActivation,
  useRotatePlatformAdminCredentials,
} from "./usePlatformTenants";
import { platformQueryKeys } from "../../domain/entities";

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
  useMutation: (config: unknown) => useMutationMock(config),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("../../infrastructure/platformApi", () => ({
  platformApi: {
    getMetrics: vi.fn(),
    listPlans: vi.fn(),
    listTenants: vi.fn(),
    getTenantById: vi.fn(),
    createTenant: vi.fn(),
    updateTenantStatus: vi.fn(),
    updateDeclaredFleet: vi.fn(),
    resendAdminActivation: vi.fn(),
    rotateAdminCredentials: vi.fn(),
  },
}));

describe("admin activation mutations cache invalidation", () => {
  beforeEach(() => {
    invalidateQueries.mockReset();
    useMutationMock.mockClear();
  });

  it("resend invalidates tenant detail", () => {
    const mutationConfig = useResendPlatformTenantActivation({
      onSuccess: vi.fn(),
    }) as unknown as {
      onSuccess: (
        data: unknown,
        variables: { id: string },
        context: unknown,
      ) => void;
    };

    mutationConfig.onSuccess({}, { id: "tenant-1" }, {});

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: platformQueryKeys.tenantDetail("tenant-1"),
    });
  });

  it("rotate credentials invalidates tenant detail", () => {
    const mutationConfig = useRotatePlatformAdminCredentials({
      onSuccess: vi.fn(),
    }) as unknown as {
      onSuccess: (
        data: unknown,
        variables: { id: string; payload: { password: string } },
        context: unknown,
      ) => void;
    };

    mutationConfig.onSuccess(
      {},
      { id: "tenant-2", payload: { password: "SecurePass1!" } },
      {},
    );

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: platformQueryKeys.tenantDetail("tenant-2"),
    });
  });
});
