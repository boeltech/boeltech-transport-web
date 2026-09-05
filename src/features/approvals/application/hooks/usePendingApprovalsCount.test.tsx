import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { approvalsApi } from "../../infrastructure";
import {
  usePendingApprovalsCount,
  useApprovalsPendingCountsByType,
} from "./usePendingApprovalsCount";

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("usePendingApprovalsCount", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches consolidated total count when no type is provided", async () => {
    vi.spyOn(approvalsApi, "getAllPendingCounts").mockResolvedValue({
      trip_expense: 1,
      driver_advance_request: 1,
      internal_staff_compensation: 0,
      total: 2,
    });

    const { result } = renderHook(() => usePendingApprovalsCount(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(2);
    expect(approvalsApi.getAllPendingCounts).toHaveBeenCalled();
  });

  it("fetches specific type count when type is provided", async () => {
    vi.spyOn(approvalsApi, "list").mockResolvedValue({
      data: [],
      pagination: {
        page: 1,
        pageSize: 1,
        total: 1,
        totalPages: 1,
      },
    });

    const { result } = renderHook(
      () => usePendingApprovalsCount("driver_advance_request"),
      {
        wrapper: createWrapper(),
      },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBe(1);
    expect(approvalsApi.list).toHaveBeenCalledWith({
      type: "driver_advance_request",
      status: "pending",
      page: 1,
      pageSize: 1,
    });
  });

  it("fetches breakdown by type with useApprovalsPendingCountsByType", async () => {
    vi.spyOn(approvalsApi, "getAllPendingCounts").mockResolvedValue({
      trip_expense: 1,
      driver_advance_request: 1,
      internal_staff_compensation: 0,
      total: 2,
    });

    const { result } = renderHook(() => useApprovalsPendingCountsByType(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({
      trip_expense: 1,
      driver_advance_request: 1,
      internal_staff_compensation: 0,
      total: 2,
    });
  });
});
