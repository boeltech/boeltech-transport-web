import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { DriverAdvance } from "../../domain/entities";
import { AdvanceEditSheet } from "./AdvanceEditSheet";
import { AdvanceAddNoteDialog } from "./AdvanceAddNoteDialog";
import { AdvanceCancelDialog } from "./AdvanceCancelDialog";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

const mockToast = vi.fn();
const mockUpdateAdvance = vi.fn();
const mockSubmitAdvance = vi.fn();
const mockCancelAdvance = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("@shared/ui/employee-async-combobox", () => ({
  EmployeeAsyncCombobox: ({ label }: { label: string }) => <div>{label}</div>,
}));

vi.mock("@features/employees", () => ({
  useEmployee: () => ({
    data: {
      data: {
        driverRole: { driverId: "drv-1" },
      },
    },
    isLoading: false,
  }),
}));

vi.mock("@features/trips", () => ({
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
    updateAdvance: (...args: unknown[]) => mockUpdateAdvance(...args),
    submitAdvance: (...args: unknown[]) => mockSubmitAdvance(...args),
    cancelAdvance: (...args: unknown[]) => mockCancelAdvance(...args),
  },
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

const authorizedAdvance: DriverAdvance = {
  id: "adv-1",
  tenantId: "tenant-1",
  folio: "ANT-202610-0007",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  tripId: null,
  tripCode: null,
  amount: 8000,
  balanceRemaining: 8000,
  currency: "MXN",
  category: "travel_advance",
  status: "pending_disbursement",
  disbursedAt: null,
  paymentMethod: "bank_transfer",
  bankReference: null,
  notes: "Casetas",
  approvedByName: "Ana López",
  approvedAt: "2026-10-02T10:00:00Z",
  createdAt: "2026-10-01T10:00:00Z",
  updatedAt: "2026-10-01T10:00:00Z",
};

function renderWithClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateAdvance.mockResolvedValue({
    advance: authorizedAdvance,
    approvalEffect: "none",
    changes: [],
  });
  mockSubmitAdvance.mockResolvedValue(authorizedAdvance);
  mockCancelAdvance.mockResolvedValue({ ...authorizedAdvance, status: "cancelled" });
});

describe("AdvanceEditSheet", () => {
  it("criterio 3: cambiar el monto autorizado confirma con «$8,000 → $12,000» y «Quedarás como solicitante»", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockUpdateAdvance.mockResolvedValueOnce({
      advance: { ...authorizedAdvance, status: "pending_approval", amount: 12000 },
      approvalEffect: "reapproval_required",
      changes: ["amount"],
    });
    renderWithClient(
      <AdvanceEditSheet open onOpenChange={onOpenChange} advance={authorizedAdvance} />,
    );

    expect(screen.getByTestId("advance-material-hint")).toHaveTextContent(/Ana López/);

    const amount = screen.getByLabelText(/monto/i);
    await user.clear(amount);
    await user.type(amount, "12000");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Monto: \$8,000\.00 → \$12,000\.00/)).toBeInTheDocument();
    expect(within(dialog).getByText(/Pierde la autorización de Ana López/)).toBeInTheDocument();
    expect(
      within(dialog).getByText("Quedarás como solicitante: no podrás autorizar este cambio."),
    ).toBeInTheDocument();
    expect(mockUpdateAdvance).not.toHaveBeenCalled();

    await user.click(within(dialog).getByRole("button", { name: "Guardar y volver a autorización" }));

    await waitFor(() => {
      expect(mockUpdateAdvance).toHaveBeenCalledWith("adv-1", {
        expectedStatus: "pending_disbursement",
        amount: 12000,
      });
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Anticipo actualizado; requiere nueva autorización" }),
    );
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("criterio 4: cambiar solo la nota guarda sin diálogo", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <AdvanceEditSheet open onOpenChange={vi.fn()} advance={authorizedAdvance} />,
    );

    await user.type(screen.getByLabelText(/notas/i), " y comida");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => {
      expect(mockUpdateAdvance).toHaveBeenCalledWith("adv-1", {
        expectedStatus: "pending_disbursement",
        notes: "Casetas y comida",
      });
    });
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Anticipo actualizado" }),
    );
  });

  it("D18: cambiar viaje opcional confirma y manda tripId", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const tripId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
    mockUpdateAdvance.mockResolvedValueOnce({
      advance: {
        ...authorizedAdvance,
        tripId,
        tripCode: "V-2026-001",
      },
      approvalEffect: "reapproval_required",
      changes: ["trip_id"],
    });
    renderWithClient(
      <AdvanceEditSheet open onOpenChange={onOpenChange} advance={authorizedAdvance} />,
    );

    expect(screen.getByTestId("advance-material-hint")).toHaveTextContent(/viaje/i);

    await user.click(screen.getByRole("combobox", { name: /viaje \(opcional\)/i }));
    await user.click(await screen.findByRole("option", { name: "V-2026-001" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(/Viaje:/)).toBeInTheDocument();
    expect(within(dialog).getByText(/V-2026-001/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Guardar y volver a autorización" }));

    await waitFor(() => {
      expect(mockUpdateAdvance).toHaveBeenCalledWith("adv-1", {
        expectedStatus: "pending_disbursement",
        tripId,
      });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("criterio 7: un 409 ADVANCE_NOT_MUTABLE muestra «Cerrar y recargar» y no cierra el Sheet", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    mockUpdateAdvance.mockRejectedValueOnce(
      Object.assign(new Error("No mutable"), { code: "ADVANCE_NOT_MUTABLE" }),
    );
    renderWithClient(
      <AdvanceEditSheet open onOpenChange={onOpenChange} advance={authorizedAdvance} />,
    );

    await user.type(screen.getByLabelText(/notas/i), " extra");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText("Cambió de estado mientras lo editabas")).toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /cerrar y recargar/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(mockUpdateAdvance).toHaveBeenCalledTimes(1);
  });

  it("D15: devuelto en modo corregir muestra el motivo y «Guardar y reenviar» reenvía", async () => {
    const user = userEvent.setup();
    const returned: DriverAdvance = {
      ...authorizedAdvance,
      status: "draft",
      approval: {
        flowStatus: "returned",
        stepCurrent: null,
        stepsTotal: 1,
        pendingFor: { roles: [], users: [] },
        signedSteps: [],
        routedBy: {
          tierIndex: null,
          minAmount: null,
          matchedConditions: [],
          policyVersion: null,
          lazy: false,
        },
        canAct: false,
        cannotActReason: null,
        escalated: false,
        reapproval: null,
        returned: {
          reason: "Sube el ticket de casetas",
          reasonCode: "missing_receipt",
          returnedBy: "user-ana",
          returnedByName: "Ana",
          returnedAt: "2026-10-02T10:00:00Z",
        },
      },
    };
    renderWithClient(
      <AdvanceEditSheet open onOpenChange={vi.fn()} advance={returned} mode="correct" />,
    );

    expect(screen.getByText(/Sube el ticket de casetas/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar y reenviar" }));

    await waitFor(() => expect(mockSubmitAdvance).toHaveBeenCalledWith("adv-1"));
    expect(mockUpdateAdvance).not.toHaveBeenCalled();
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Anticipo reenviado a autorización" }),
    );
  });
});

describe("AdvanceAddNoteDialog", () => {
  it("criterio 5: conserva la nota anterior y agrega la nueva fechada", async () => {
    const user = userEvent.setup();
    const disbursed = { ...authorizedAdvance, status: "disbursed" as const };
    renderWithClient(
      <AdvanceAddNoteDialog
        open
        onOpenChange={vi.fn()}
        advance={disbursed}
        now={() => new Date("2026-10-03T18:00:00Z")}
      />,
    );

    expect(screen.getByTestId("advance-current-note")).toHaveTextContent("Casetas");
    await user.click(screen.getByRole("button", { name: "Agregar nota" }));
    expect(screen.getByText("Escribe la nota adicional")).toBeInTheDocument();
    expect(mockUpdateAdvance).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Nota adicional"), "Devolvió $500");
    await user.click(screen.getByRole("button", { name: "Agregar nota" }));

    await waitFor(() => expect(mockUpdateAdvance).toHaveBeenCalledTimes(1));
    const [, payload] = mockUpdateAdvance.mock.calls[0] as [string, { notes: string }];
    expect(payload).toMatchObject({ expectedStatus: "disbursed" });
    expect(payload.notes.startsWith("Casetas\n— ")).toBe(true);
    expect(payload.notes.endsWith(": Devolvió $500")).toBe(true);
  });
});

describe("AdvanceCancelDialog", () => {
  it("criterio 6: pendiente exige motivo de 5+ caracteres", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <AdvanceCancelDialog
        open
        onOpenChange={vi.fn()}
        advance={{ ...authorizedAdvance, status: "pending_approval" }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Cancelar anticipo" }));
    expect(
      screen.getByText("El motivo debe tener al menos 5 caracteres"),
    ).toBeInTheDocument();
    expect(mockCancelAdvance).not.toHaveBeenCalled();

    await user.type(screen.getByLabelText("Motivo"), "Viaje cancelado por el cliente");
    await user.click(screen.getByRole("button", { name: "Cancelar anticipo" }));

    await waitFor(() => {
      expect(mockCancelAdvance).toHaveBeenCalledWith("adv-1", "Viaje cancelado por el cliente");
    });
  });

  it("criterio 6: autorizado avisa que se anula la autorización", () => {
    renderWithClient(
      <AdvanceCancelDialog open onOpenChange={vi.fn()} advance={authorizedAdvance} />,
    );
    expect(screen.getByText("Se anula la autorización vigente.")).toBeInTheDocument();
  });

  it("criterio 6: borrador pide confirmación simple sin motivo", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <AdvanceCancelDialog
        open
        onOpenChange={vi.fn()}
        advance={{ ...authorizedAdvance, status: "draft" }}
      />,
    );

    expect(screen.getByText("¿Cancelar este borrador?")).toBeInTheDocument();
    expect(screen.queryByLabelText("Motivo")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar anticipo" }));

    await waitFor(() => expect(mockCancelAdvance).toHaveBeenCalledWith("adv-1", undefined));
  });
});
