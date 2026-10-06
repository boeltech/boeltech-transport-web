import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriverAdvance } from "../../domain/entities";
import { DisburseAdvanceDialog } from "./DisburseAdvanceDialog";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

const mockMutateAsync = vi.fn();
const mockToast = vi.fn();
const mockOnOpenChange = vi.fn();
const mockOnSuccess = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks/useAdvances", () => ({
  useDisburseDriverAdvance: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
}));

vi.mock("@features/approvals/application", () => ({
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

const readyAdvance: DriverAdvance = {
  id: "adv-1",
  tenantId: "tenant-1",
  folio: "ANT-202610-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  tripId: "trip-1",
  tripCode: "TRP-101",
  amount: 1500,
  balanceRemaining: 1500,
  currency: "MXN",
  category: "travel_advance",
  status: "pending_disbursement",
  disbursedAt: null,
  paymentMethod: "bank_transfer",
  authorizedPaymentMethod: "bank_transfer",
  bankReference: "REF-DEL-SOLICITANTE",
  notes: null,
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
};

function renderDialog(advance: DriverAdvance = readyAdvance) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <DisburseAdvanceDialog
        open
        onOpenChange={mockOnOpenChange}
        advance={advance}
        onSuccess={mockOnSuccess}
      />
    </QueryClientProvider>,
  );
}

async function chooseMethod(user: ReturnType<typeof userEvent.setup>, label: RegExp) {
  await user.click(screen.getByRole("combobox", { name: /método de pago/i }));
  const listbox = await screen.findByRole("listbox");
  await user.click(within(listbox).getByRole("option", { name: label }));
}

const confirmButton = () => screen.getByRole("button", { name: /confirmar entrega/i });

describe("DisburseAdvanceDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue(readyAdvance);
  });

  it("precarga el método autorizado y no hereda la referencia del solicitante", () => {
    renderDialog({ ...readyAdvance, paymentMethod: "check", authorizedPaymentMethod: "check" });

    expect(screen.getByRole("combobox", { name: /método de pago/i })).toHaveTextContent("Cheque");
    expect(screen.getByLabelText(/referencia/i)).toHaveValue("");
    expect(screen.queryByText(/distinto al autorizado/i)).not.toBeInTheDocument();
  });

  it("sin método autorizado en la respuesta, precarga el método del anticipo", () => {
    renderDialog({ ...readyAdvance, paymentMethod: "cash", authorizedPaymentMethod: undefined });

    expect(screen.getByRole("combobox", { name: /método de pago/i })).toHaveTextContent("Efectivo");
  });

  it("exige referencia salvo en efectivo y muestra el error inline", async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(confirmButton()).toBeDisabled();

    const refInput = screen.getByLabelText(/referencia/i);
    await user.click(refInput);
    await user.tab();
    expect(
      await screen.findByText("La referencia es obligatoria salvo en pagos en efectivo"),
    ).toBeInTheDocument();
    expect(refInput).toHaveAttribute("aria-invalid", "true");

    await chooseMethod(user, /efectivo/i);
    await waitFor(() => {
      expect(
        screen.queryByText("La referencia es obligatoria salvo en pagos en efectivo"),
      ).not.toBeInTheDocument();
    });
    expect(screen.getByText("Opcional en pagos en efectivo.")).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();
  });

  it("avisa sin bloquear cuando el método elegido difiere del autorizado (transferencia → efectivo)", async () => {
    const user = userEvent.setup();
    renderDialog();

    await chooseMethod(user, /efectivo/i);

    expect(
      screen.getByText(/Se autorizó por Transferencia bancaria \(SPEI\) y vas a registrar la entrega en efectivo/i),
    ).toBeInTheDocument();
    expect(confirmButton()).toBeEnabled();

    await user.click(confirmButton());
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "adv-1",
        payload: { paymentMethod: "cash", bankReference: undefined },
      });
    });
  });

  it("avisa con el método autorizado cuando cambia a otro método no efectivo", async () => {
    const user = userEvent.setup();
    renderDialog();

    await chooseMethod(user, /cheque/i);

    expect(
      screen.getByText(/El método es distinto al autorizado \(Transferencia bancaria \(SPEI\)\)/i),
    ).toBeInTheDocument();
  });

  it("envía paymentMethod y la referencia capturada por quien paga", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.type(screen.getByLabelText(/referencia/i), "  SPEI-778899  ");
    await user.click(confirmButton());

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        id: "adv-1",
        payload: { paymentMethod: "bank_transfer", bankReference: "SPEI-778899" },
      });
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Anticipo entregado correctamente", variant: "success" }),
    );
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    expect(mockOnSuccess).toHaveBeenCalled();
  });

  it("traduce un 400 INVALID_PAYLOAD a un mensaje claro en toast y alerta", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(
      Object.assign(new Error("Datos de entrega inválidos"), { code: "INVALID_PAYLOAD" }),
    );
    renderDialog();

    await user.type(screen.getByLabelText(/referencia/i), "SPEI-1");
    await user.click(confirmButton());

    const expected =
      "Los datos de la entrega no son válidos. Revisa el método de pago y la referencia.";
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Error al registrar entrega de anticipo",
          description: expected,
          variant: "destructive",
        }),
      );
    });
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(mockOnOpenChange).not.toHaveBeenCalledWith(false);
  });
});
