import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { SettlementSettingsSheet } from "./SettlementSettingsSheet";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.hub.settings;
const mockUseSettlementSettings = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("../../application/hooks", () => ({
  useSettlementSettings: (options?: { enabled?: boolean }) => mockUseSettlementSettings(options),
  useUpdateSettlementSettings: () => ({ mutateAsync: mockMutateAsync, isPending: false, error: null }),
}));

function renderSheet() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <SettlementSettingsSheet open onOpenChange={vi.fn()} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** ADR-0099 §9.4 variante conservadora: umbral de solo lectura cuando lo gestiona la regla. */
describe("SettlementSettingsSheet con managed_by_policy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el umbral derivado de solo lectura y enlaza a Reglas de autorización", () => {
    mockUseSettlementSettings.mockReturnValue({
      data: { voboThresholdMxn: 5000, activeApproverCount: 2, activeExecutorCount: 1, managedByPolicy: true },
      isLoading: false,
    });
    renderSheet();

    expect(screen.getByTestId("settlement-settings-managed")).toBeInTheDocument();
    const threshold = screen.getByLabelText(copy.thresholdLabel) as HTMLInputElement;
    expect(threshold).toBeDisabled();
    expect(Number(threshold.value.replace(/[^0-9.]/g, ""))).toBe(5000);
    expect(screen.queryByRole("button", { name: copy.save })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: copy.managedLink })).toHaveAttribute(
      "href",
      "/settings/approvals?concept=settlement",
    );
  });

  it("sin managed_by_policy conserva el formulario editable", () => {
    mockUseSettlementSettings.mockReturnValue({
      data: { voboThresholdMxn: 1500, activeApproverCount: 2, activeExecutorCount: 1, managedByPolicy: false },
      isLoading: false,
    });
    renderSheet();

    expect(screen.queryByTestId("settlement-settings-managed")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.save })).toBeEnabled();
  });
});
