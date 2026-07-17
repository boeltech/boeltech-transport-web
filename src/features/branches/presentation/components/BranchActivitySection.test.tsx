import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchActivitySection } from "./BranchActivitySection";
import { branchesCopy } from "../copy/branchesCopy";
import { buildBranchManagementEvent } from "../../test/branchTestFixtures";

const mockGetActivity = vi.fn();

vi.mock("../../infrastructure/branchesApi", () => ({
  branchesApi: {
    getActivity: (...args: unknown[]) => mockGetActivity(...args),
  },
}));

function renderSection(branchId = "branch-1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BranchActivitySection branchId={branchId} />
    </QueryClientProvider>,
  );
}

describe("BranchActivitySection", () => {
  it("renders timeline events", async () => {
    mockGetActivity.mockResolvedValue({
      data: [buildBranchManagementEvent()],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    renderSection();

    await waitFor(() => {
      expect(screen.getByText("Sucursal actualizada")).toBeInTheDocument();
    });

    expect(screen.getByText(/Código: QRO-02/)).toBeInTheDocument();
  });

  it("renders empty state", async () => {
    mockGetActivity.mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });

    renderSection();

    await waitFor(() => {
      expect(screen.getByText(branchesCopy.detail.activity.empty)).toBeInTheDocument();
    });
  });
});
