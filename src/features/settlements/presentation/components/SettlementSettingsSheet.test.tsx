import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementSettingsSheet } from "./SettlementSettingsSheet";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.hub.settings;

const mockToast = vi.fn();
const mockMutateAsync = vi.fn();
const mockUseSettlementSettings = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks", () => ({
  useSettlementSettings: (options?: { enabled?: boolean }) =>
    mockUseSettlementSettings(options),
  useUpdateSettlementSettings: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
    error: null,
  }),
}));

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

function renderSheet(onOpenChange = vi.fn()) {
  const queryClient = createTestQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <SettlementSettingsSheet open onOpenChange={onOpenChange} />
    </QueryClientProvider>,
  );
}

describe("SettlementSettingsSheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
    mockUseSettlementSettings.mockReturnValue({
      data: {
        voboThresholdMxn: 1500,
        activeApproverCount: 2,
        activeExecutorCount: 2,
      },
      isLoading: false,
    });
  });

  it("renderiza el umbral de VoBo con el valor del tenant", () => {
    renderSheet();

    // MoneyInput alterna entre formato de moneda y edición según el foco:
    // se compara el monto, no la cadena formateada.
    const threshold = screen.getByLabelText(copy.thresholdLabel) as HTMLInputElement;
    expect(Number(threshold.value.replace(/,/g, ""))).toBe(1500);
    expect(screen.getByText(copy.thresholdHint)).toBeInTheDocument();
    expect(copy.thresholdHint).toMatch(/umbral 0/i);
  });

  it("no ofrece toggle ni controles de feature flag retirado", () => {
    renderSheet();

    expect(screen.queryByRole("switch")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Activar pagos a operadores/i),
    ).not.toBeInTheDocument();
  });

  it("guarda solo el umbral, sin la bandera en el payload", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);

    await user.click(screen.getByRole("button", { name: copy.save }));

    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync).toHaveBeenCalledWith({ voboThresholdMxn: 1500 });
    expect(Object.keys(mockMutateAsync.mock.calls[0]?.[0] ?? {})).toEqual([
      "voboThresholdMxn",
    ]);
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
