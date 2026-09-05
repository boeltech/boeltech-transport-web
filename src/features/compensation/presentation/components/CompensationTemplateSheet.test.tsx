import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { CompensationTemplateSheet } from "./CompensationTemplateSheet";
import type { CompensationTemplate } from "../../domain/entities";

const mockUpdateMutate = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/branches", () => ({
  BranchStatus: { ACTIVE: "active" },
  useBranches: () => ({ data: { data: [] } }),
}));

vi.mock("../../application/hooks", () => ({
  useUpdateCompensationTemplate: () => ({
    mutateAsync: mockUpdateMutate,
    isPending: false,
  }),
}));

vi.mock("../../application/hooks/useCorridors", () => ({
  useCorridorTariffs: () => ({ data: { data: [] } }),
}));

const sampleTemplate: CompensationTemplate = {
  id: "tpl-edit-1",
  name: "Esquema foráneo",
  description: "Notas",
  isActive: true,
  rules: [
    {
      routeType: "long_haul",
      commissionType: "rate_per_km",
      rateValue: 3,
      minimumGuaranteedAmount: 0,
      notes: null,
    },
  ],
  fixedAllowances: [
    {
      allowanceType: "meals",
      label: "Comidas",
      amount: 500,
      period: "weekly",
      isMandatory: true,
    },
  ],
  corridorIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
  corridors: [],
  activeAssignmentsCount: 0,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

describe("CompensationTemplateSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMutate.mockResolvedValue(sampleTemplate);
  });

  it("envía un único PATCH con metadata y configuración", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <CompensationTemplateSheet
            open
            onOpenChange={vi.fn()}
            template={sampleTemplate}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /Guardar/i }));

    await waitFor(() => {
      expect(mockUpdateMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "tpl-edit-1",
        name: "Esquema foráneo",
        isActive: true,
        rules: expect.arrayContaining([
          expect.objectContaining({ routeType: "long_haul", rateValue: 3 }),
        ]),
        fixedAllowances: expect.arrayContaining([
          expect.objectContaining({ label: "Comidas", amount: 500 }),
        ]),
        corridorIds: ["cccccccc-cccc-4ccc-8ccc-cccccccccccc"],
      }),
    );
  });
});
