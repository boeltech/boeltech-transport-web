import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DATE_FIELD_COPY } from "@shared/ui/form";
import { localInputToUtcIso } from "@shared/utils/dateUtils";

import type { DriverSettlement } from "../../domain/entities";
import { DisburseSettlementDialog } from "./DisburseSettlementDialog";

const mockMutateAsync = vi.fn();
const mockToast = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks/useSettlements", () => ({
  useDisburseSettlement: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const sampleSettlement: DriverSettlement = {
  id: "settlement-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202608-0003",
  employeeId: "emp-1",
  employeeFullName: "Xaime Weir Rojo",
  tripId: "trip-1",
  tripCode: "TRP-101",
  periodStart: "2026-08-01",
  periodEnd: "2026-08-31",
  grossAmount: 6000,
  deductionsAmount: 748.83,
  netAmount: 5251.17,
  currency: "MXN",
  status: "approved",
  disbursedAt: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: "2026-08-30T18:00:00.000Z",
  approvedBy: "user-approver",
  createdAt: "2026-08-28T10:00:00.000Z",
  updatedAt: "2026-08-30T18:00:00.000Z",
};

function renderDialog(open = true) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DisburseSettlementDialog
        open={open}
        onOpenChange={vi.fn()}
        settlement={sampleSettlement}
      />
    </QueryClientProvider>,
  );
}

describe("DisburseSettlementDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(undefined);
  });

  it("renders design-system date and time controls instead of datetime-local", () => {
    renderDialog();

    expect(
      screen.getByLabelText(/fecha y hora de transferencia/i),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(DATE_FIELD_COPY.timeAriaLabel)).toBeInTheDocument();
    expect(screen.queryByDisplayValue(/T\d{2}:\d{2}/)).not.toBeInTheDocument();
    expect(document.querySelector('input[type="datetime-local"]')).toBeNull();
    expect(screen.getByText(DATE_FIELD_COPY.mexicoTimeCaption)).toBeInTheDocument();
  });

  it("serializes disbursedAt with localInputToUtcIso on submit", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(
      screen.getByLabelText(/referencia bancaria/i),
      "SPEI-998823",
    );
    await user.click(
      screen.getByRole("button", { name: /confirmar pago realizado/i }),
    );

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledTimes(1);
    });

    const payload = mockMutateAsync.mock.calls[0]?.[0] as {
      id: string;
      data: { disbursedAt: string };
    };

    expect(payload.id).toBe("settlement-1");
    expect(payload.data.disbursedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

    const timeInput = screen.getByLabelText(DATE_FIELD_COPY.timeAriaLabel) as HTMLInputElement;
    const dateButton = screen.getByLabelText(/fecha y hora de transferencia/i);
    const dateText = dateButton.textContent ?? "";
    const localMatch = dateText.match(/(\d{4}-\d{2}-\d{2})/);
    if (localMatch?.[1] && timeInput.value) {
      expect(payload.data.disbursedAt).toBe(
        localInputToUtcIso(`${localMatch[1]}T${timeInput.value}`),
      );
    }
  });
});
