import { beforeEach, describe, expect, it, vi } from "vitest";
import { dashboardQueryKeys } from "@features/dashboard/domain";
import { branchQueryKeys } from "../../domain";

const invalidateQueries = vi.fn();
const useMutationMock = vi.fn((config: unknown) => config);

vi.mock("@tanstack/react-query", () => ({
  useMutation: (config: unknown) => useMutationMock(config),
  useQuery: vi.fn(),
  useQueryClient: () => ({ invalidateQueries }),
}));

vi.mock("../../infrastructure", () => ({
  branchesApi: {
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    restore: vi.fn(),
  },
}));

import {
  useCreateBranch,
  useDeleteBranch,
  useRestoreBranch,
  useUpdateBranch,
} from "./useBranches";

describe("useBranches cache — branch KPIs (H-U01-Q01)", () => {
  beforeEach(() => {
    useMutationMock.mockClear();
    invalidateQueries.mockClear();
  });

  it("create invalida branch-kpis*", () => {
    const mutation = useCreateBranch() as unknown as {
      onSuccess?: (data: {
        data: { id: string; code: string; name: string };
      }) => void;
    };

    mutation.onSuccess?.({
      data: { id: "b1", code: "MTY", name: "Monterrey" },
    });

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: branchQueryKeys.lists(),
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...dashboardQueryKeys.all, "branch-kpis"],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [...dashboardQueryKeys.all, "branch-kpis-trend"],
    });
  });

  it("update/delete/restore invalidan branch-kpis*", () => {
    const update = useUpdateBranch() as unknown as {
      onSuccess?: (data: { data: { id: string } }) => void;
    };
    update.onSuccess?.({ data: { id: "b1" } });

    const del = useDeleteBranch() as unknown as {
      onSuccess?: () => void;
    };
    del.onSuccess?.();

    const restore = useRestoreBranch() as unknown as {
      onSuccess?: (data: { data: { id: string } }) => void;
    };
    restore.onSuccess?.({ data: { id: "b1" } });

    const kpiCalls = invalidateQueries.mock.calls.filter(
      ([arg]) =>
        Array.isArray((arg as { queryKey?: unknown }).queryKey) &&
        ((arg as { queryKey: unknown[] }).queryKey[1] === "branch-kpis" ||
          (arg as { queryKey: unknown[] }).queryKey[1] === "branch-kpis-trend"),
    );
    expect(kpiCalls.length).toBeGreaterThanOrEqual(6);
  });
});
