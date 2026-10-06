import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { DriverAdvanceCreateDialog } from "./DriverAdvanceCreateDialog";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

const mockToast = vi.fn();
const mockCreateAdvance = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: string;
    onChange: (id: string) => void;
  }) => (
    <div>
      <label htmlFor="adv-employee-mock">{label}</label>
      <button
        type="button"
        id="adv-employee-mock"
        data-testid="adv-employee-mock"
        onClick={() => onChange("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee")}
      >
        {value || "Seleccionar operador"}
      </button>
    </div>
  ),
}));

vi.mock("@features/employees/application", () => ({
  useEmployee: () => ({
    data: {
      data: {
        driverRole: { driverId: "drv-1" },
      },
    },
    isLoading: false,
  }),
}));

vi.mock("@features/trips/application", () => ({
  useTrips: () => ({
    data: {
      data: [
        { id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11", tripCode: "V-2026-001" },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    createAdvance: (...args: unknown[]) => mockCreateAdvance(...args),
  },
}));

vi.mock("@features/notifications/infrastructure/notificationsApi", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
  },
}));

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCreateAdvance.mockResolvedValue({
    id: "adv-new",
    folio: "ANT-202610-0099",
    tripId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  });
});

describe("DriverAdvanceCreateDialog", () => {
  it("muestra Viaje (opcional) y envía tripId al crear", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderWithClient(
      <DriverAdvanceCreateDialog
        open
        onOpenChange={onOpenChange}
        defaultEmployeeId="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
      />,
    );

    expect(screen.getByRole("combobox", { name: /viaje \(opcional\)/i })).toBeInTheDocument();

    await user.click(screen.getByRole("combobox", { name: /viaje \(opcional\)/i }));
    await user.click(await screen.findByRole("option", { name: "V-2026-001" }));

    const amount = screen.getByLabelText(/monto/i);
    await user.clear(amount);
    await user.type(amount, "1500");

    await user.click(screen.getByRole("button", { name: "Registrar anticipo" }));

    await waitFor(() => {
      expect(mockCreateAdvance).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
          tripId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
          amount: 1500,
        }),
      );
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("limpia tripId al cambiar de empleado", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <DriverAdvanceCreateDialog
        open
        onOpenChange={vi.fn()}
        defaultEmployeeId="9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
        defaultTripId="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
      />,
    );

    const tripSelect = screen.getByRole("combobox", { name: /viaje \(opcional\)/i });
    expect(tripSelect).toHaveTextContent("V-2026-001");

    await user.click(screen.getByTestId("adv-employee-mock"));

    expect(tripSelect).toHaveTextContent(/sin viaje \(cuenta del operador\)/i);
  });
});