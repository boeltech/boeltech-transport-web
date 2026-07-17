import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BranchAssignedVehiclesCard } from "./BranchAssignedVehiclesCard";
import { branchesCopy } from "../copy/branchesCopy";
import {
  BRANCH_TEST_IDS,
  buildBranchVehicle,
} from "../../test/branchTestFixtures";

const { mockUseBranchVehicles } = vi.hoisted(() => ({
  mockUseBranchVehicles: vi.fn(),
}));

vi.mock("../../application", () => ({
  useBranchVehicles: (...args: unknown[]) => mockUseBranchVehicles(...args),
}));

function renderCard(branchId = BRANCH_TEST_IDS.secondary) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BranchAssignedVehiclesCard branchId={branchId} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("BranchAssignedVehiclesCard", () => {
  it("muestra empty state cuando no hay vehículos", () => {
    mockUseBranchVehicles.mockReturnValue({
      data: [],
      isLoading: false,
    });

    renderCard();

    expect(
      screen.getByText(branchesCopy.detail.cards.vehicles),
    ).toBeInTheDocument();
    expect(
      screen.getByText(branchesCopy.detail.vehicles.empty),
    ).toBeInTheDocument();
    expect(
      screen.getByText(branchesCopy.detail.vehicles.count(0)),
    ).toBeInTheDocument();
  });

  it("lista vehículos con enlace al detalle", () => {
    const vehicle = buildBranchVehicle();
    mockUseBranchVehicles.mockReturnValue({
      data: [vehicle],
      isLoading: false,
    });

    renderCard();

    expect(screen.getByText(vehicle.unitNumber)).toBeInTheDocument();
    expect(screen.getByText(/ABC-123-D · Kenworth T680/)).toBeInTheDocument();
    expect(
      screen.getByText(branchesCopy.detail.vehicles.count(1)),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: branchesCopy.detail.vehicles.viewVehicle,
      }),
    ).toHaveAttribute("href", `/vehicles/${vehicle.id}`);
  });

  it("muestra skeletons mientras carga", () => {
    mockUseBranchVehicles.mockReturnValue({
      data: undefined,
      isLoading: true,
    });

    const { container } = renderCard();

    expect(
      screen.getByText(branchesCopy.detail.cards.vehicles),
    ).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      0,
    );
    expect(
      screen.queryByText(branchesCopy.detail.vehicles.empty),
    ).not.toBeInTheDocument();
  });
});
