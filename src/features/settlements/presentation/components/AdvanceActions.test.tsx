import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AdvanceActions } from "./AdvanceActions";
import type { DriverAdvance } from "../../domain/entities";
import type { ApprovalBlock, SelfApprovalPolicy } from "@features/approvals";

function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 1,
    pendingFor: { roles: ["manager"], users: [] },
    signedSteps: [],
    routedBy: {
      tierIndex: null,
      minAmount: null,
      matchedConditions: [],
      policyVersion: null,
      lazy: false,
    },
    canAct: true,
    cannotActReason: null,
    escalated: false,
    reapproval: null,
    returned: null,
    ...overrides,
  };
}

const mockUsePermissions = vi.fn();
const mockUseAuth = vi.fn();
const mockToast = vi.fn();
const mockSubmitAdvance = vi.fn();
const mockApproveAdvance = vi.fn();
const mockRejectAdvance = vi.fn();
const mockDisburseAdvance = vi.fn();
const mockReturnAdvance = vi.fn();
const mockUpdateAdvance = vi.fn();
const mockCancelAdvance = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    submitAdvance: (...args: unknown[]) => mockSubmitAdvance(...args),
    approveAdvance: (...args: unknown[]) => mockApproveAdvance(...args),
    rejectAdvance: (...args: unknown[]) => mockRejectAdvance(...args),
    disburseAdvance: (...args: unknown[]) => mockDisburseAdvance(...args),
    returnAdvance: (...args: unknown[]) => mockReturnAdvance(...args),
    updateAdvance: (...args: unknown[]) => mockUpdateAdvance(...args),
    cancelAdvance: (...args: unknown[]) => mockCancelAdvance(...args),
  },
}));

const mockSelfApprovalPolicy = vi.fn<() => SelfApprovalPolicy | undefined>();

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  invalidateApprovalsRelatedQueries: vi.fn(),
  useSelfApprovalPolicy: () => ({ data: mockSelfApprovalPolicy() }),
}));

function makePolicy(
  overrides: Partial<Record<keyof SelfApprovalPolicy, boolean>> = {},
): SelfApprovalPolicy {
  const entry = (allowed = false) => ({
    allowed,
    activeCounterpartCount: allowed ? 0 : 1,
  });
  return {
    advanceApprove: entry(overrides.advanceApprove),
    advanceDisburse: entry(overrides.advanceDisburse),
    settlementApprove: entry(overrides.settlementApprove),
    settlementDisburse: entry(overrides.settlementDisburse),
    tripExpenseApprove: entry(overrides.tripExpenseApprove),
  };
}

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const sampleAdvance: DriverAdvance = {
  id: "adv-1",
  tenantId: "tenant-1",
  folio: "ANT-202608-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  tripId: "trip-1",
  tripCode: "TRP-101",
  amount: 1500,
  balanceRemaining: 1500,
  currency: "MXN",
  category: "travel_advance",
  status: "pending_approval",
  disbursedAt: null,
  paymentMethod: "bank_transfer",
  bankReference: null,
  submittedAt: "2026-08-15T10:00:00Z",
  submittedBy: "user-creator-123",
  notes: "Anticipo casetas",
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
};

describe("AdvanceActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && (action === "update" || action === "execute")) return true;
        return false;
      }),
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", name: "Auditor Finanzas", email: "auditor@boeltech.com" },
    });
    mockSelfApprovalPolicy.mockReturnValue(makePolicy());
  });

  it("1. Renderiza opciones de autorizar y rechazar cuando el usuario revisor es distinto del solicitante", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    expect(screen.getByText("Autorizar anticipo")).toBeInTheDocument();
    expect(screen.getByText("Rechazar anticipo")).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("2. ADR-0098 blocked_own: el solicitante ve «Enviada por ti» deshabilitado con la pista", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador Anticipo" },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    const ownRow = screen.getByRole("menuitem", { name: /Enviada por ti/i });
    expect(ownRow).toHaveAttribute("aria-disabled", "true");
    expect(ownRow).toHaveTextContent(/Debe autorizarla otra persona/i);
    expect(screen.queryByText("Autorizar anticipo")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar anticipo")).not.toBeInTheDocument();
  });

  it("2b. ADR-0098 blocked_own: el creador (no solo quien envió) también queda bloqueado", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockUseAuth.mockReturnValue({ user: { id: "user-maker-777", name: "Capturista" } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, createdBy: "user-maker-777" }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByRole("menuitem", { name: /Enviada por ti/i })).toBeInTheDocument();
    expect(screen.queryByText("Autorizar anticipo")).not.toBeInTheDocument();
  });

  it("2c. ADR-0098 self_confirm: el admin único confirma antes de autorizar lo propio", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ advanceApprove: true }));
    mockUseAuth.mockReturnValue({ user: { id: "user-creator-123", name: "Admin" } });
    mockApproveAdvance.mockResolvedValueOnce({ ...sampleAdvance, status: "pending_disbursement" });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    expect(await screen.findByText("¿Autorizar tu propia solicitud?")).toBeInTheDocument();
    expect(screen.getByText(/Tú enviaste este anticipo/i)).toBeInTheDocument();
    expect(mockApproveAdvance).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sí, autorizar" }));
    await waitFor(() => {
      expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1", {});
    });
  });

  it("2e. ADR-0099 D5: la confirmación de autorizar dice qué cambió desde la autorización anulada", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ advanceApprove: true }));
    mockUseAuth.mockReturnValue({ user: { id: "user-creator-123", name: "Admin" } });
    const approval = makeApproval({
      reapproval: {
        invalidatedAt: "2026-10-02T20:10:00.000Z",
        previousInstanceId: "inst-0",
        previousStatus: "approved",
        changes: [{ field: "amount", from: "8000.00", to: "12000.00" }],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, amount: 12000, approval }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(/Tú enviaste este anticipo/i);
    expect(dialog).toHaveTextContent(
      "Ya estaba autorizado. Cambió: Monto: $8,000.00 → $12,000.00.",
    );
  });

  it("2f. ADR-0099 D5: corrección antes de autorizar (in_progress) no agrega la línea", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ advanceApprove: true }));
    mockUseAuth.mockReturnValue({ user: { id: "user-creator-123", name: "Admin" } });
    const approval = makeApproval({
      reapproval: {
        invalidatedAt: "2026-10-02T20:10:00.000Z",
        previousInstanceId: "inst-0",
        previousStatus: "in_progress",
        changes: [{ field: "amount", from: "8000.00", to: "12000.00" }],
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, approval }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).not.toHaveTextContent(/Ya estaba autorizado/);
  });

  it("2d. ADR-0098: un 403 de autoacción muestra el mensaje del API como respaldo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockApproveAdvance.mockRejectedValueOnce(
      Object.assign(new Error("Hay otro autorizador activo."), {
        code: "SELF_APPROVAL_FORBIDDEN",
        details: { reason: "counterpart_available" },
      }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: "Hay otro autorizador activo.",
          variant: "destructive",
        }),
      );
    });
  });

  it("3. Ejecuta la aprobación al hacer click en Autorizar anticipo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockApproveAdvance.mockResolvedValueOnce({
      advance: { ...sampleAdvance, status: "pending_disbursement" },
      outcome: "approved",
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    const approveItem = screen.getByText("Autorizar anticipo");
    await user.click(approveItem);

    await waitFor(() => {
      expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1", {});
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Anticipo autorizado correctamente", variant: "success" }),
      );
    });
  });

  describe("3b. ADR-0099 D5: un paso, revisor distinto del solicitante", () => {
    const reapprovedAdvance = (previousStatus: "approved" | null): DriverAdvance => ({
      ...sampleAdvance,
      amount: 12000,
      approvalRevision: 3,
      approval: makeApproval({
        reapproval: previousStatus
          ? {
              invalidatedAt: "2026-10-02T20:10:00.000Z",
              previousInstanceId: "inst-0",
              previousStatus,
              changes: [{ field: "amount", from: "8000.00", to: "12000.00" }],
            }
          : null,
      }),
    });

    function renderAdvance(advance: DriverAdvance) {
      render(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <AdvanceActions advance={advance} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
    }

    it("autorización anulada → confirma con lo que cambió y aprueba con guardas", async () => {
      const user = userEvent.setup();
      mockApproveAdvance.mockResolvedValueOnce({
        advance: { ...sampleAdvance, status: "pending_disbursement" },
        outcome: "approved",
      });
      renderAdvance(reapprovedAdvance("approved"));

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      await user.click(screen.getByText("Autorizar anticipo"));

      expect(mockApproveAdvance).not.toHaveBeenCalled();
      const dialog = await screen.findByRole("alertdialog");
      expect(dialog).toHaveTextContent("¿Aprobar este anticipo?");
      expect(dialog).toHaveTextContent(
        "Ya estaba autorizado. Cambió: Monto: $8,000.00 → $12,000.00.",
      );
      await user.click(within(dialog).getByRole("button", { name: "Aprobar anticipo" }));

      await waitFor(() => {
        expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1", {
          expectedStep: 1,
          expectedRevision: 3,
        });
      });
      await waitFor(() => {
        expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      });
    });

    it("sin reautorización → aprueba directo, sin diálogo", async () => {
      const user = userEvent.setup();
      mockApproveAdvance.mockResolvedValueOnce({
        advance: { ...sampleAdvance, status: "pending_disbursement" },
        outcome: "approved",
      });
      renderAdvance(reapprovedAdvance(null));

      await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
      await user.click(screen.getByText("Autorizar anticipo"));

      await waitFor(() => {
        expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1", {
          expectedStep: 1,
          expectedRevision: 3,
        });
      });
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("4. Abre el Sheet de rechazo y envía motivo al confirmar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockRejectAdvance.mockResolvedValueOnce({ ...sampleAdvance, status: "rejected" });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    const rejectItem = screen.getByText("Rechazar anticipo");
    await user.click(rejectItem);

    expect(
      await screen.findByRole("heading", { name: /rechazar anticipo/i }),
    ).toBeInTheDocument();

    const textarea = screen.getByLabelText(/razón del rechazo/i);
    await user.type(textarea, "Monto excede el límite permitido para esta ruta");

    const confirmBtn = screen.getByRole("button", { name: "Rechazar" });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockRejectAdvance).toHaveBeenCalledWith(
        "adv-1",
        "Monto excede el límite permitido para esta ruta",
        {},
      );
    });
  });

  it("4b. ADR-0099: «Devolver para corregir» envía motivo rápido y guardas", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockReturnAdvance.mockResolvedValueOnce({ ...sampleAdvance, status: "draft" });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions
            advance={{ ...sampleAdvance, approvalRevision: 3, approval: makeApproval() }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Devolver para corregir"));

    expect(
      await screen.findByRole("heading", { name: /devolver anticipo para corregir/i }),
    ).toBeInTheDocument();
    await user.type(screen.getByLabelText(/^motivo$/i), "Falta el comprobante de casetas");
    await user.click(screen.getByRole("button", { name: "Devolver" }));

    await waitFor(() => {
      expect(mockReturnAdvance).toHaveBeenCalledWith(
        "adv-1",
        expect.objectContaining({
          reason: "Falta el comprobante de casetas",
          guards: { expectedStep: 1, expectedRevision: 3 },
        }),
      );
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Anticipo devuelto para corregir" }),
    );
  });

  it("4c. ADR-0099: paso intermedio pide confirmación y el toast nombra el siguiente rol", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockApproveAdvance.mockResolvedValueOnce({ advance: sampleAdvance, outcome: "step_signed" });
    const approval = makeApproval({
      stepsTotal: 2,
      nextStep: { stepNo: 2, roles: ["accountant"], users: [] },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, approval }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    expect(mockApproveAdvance).not.toHaveBeenCalled();
    const dialog = await screen.findByRole("alertdialog");
    await user.click(within(dialog).getByRole("button", { name: /firmar/i }));

    await waitFor(() => {
      expect(mockApproveAdvance).toHaveBeenCalledWith("adv-1", { expectedStep: 1 });
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringMatching(/paso 2.*Contador/i) }),
    );
  });

  it("4d. ADR-0099: una guarda (409) avisa sin reintentar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockApproveAdvance.mockRejectedValueOnce(
      Object.assign(new Error("stale"), { code: "APPROVAL_STEP_CHANGED" }),
    );

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Autorizar anticipo"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "warning" }));
    });
    expect(mockApproveAdvance).toHaveBeenCalledTimes(1);
  });

  it("4e. pendiente de autorización ofrece editar y cancelar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={sampleAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Editar anticipo…")).toBeInTheDocument();
    expect(screen.getByText("Cancelar anticipo…")).toBeInTheDocument();
  });

  it("5. Muestra opción de registrar entrega/pago para anticipos en pending_disbursement", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    const readyAdvance: DriverAdvance = {
      ...sampleAdvance,
      status: "pending_disbursement",
    };

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={readyAdvance} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const triggerBtn = screen.getByRole("button", { name: /abrir menú de acciones/i });
    await user.click(triggerBtn);

    expect(screen.getByText("Registrar entrega / pago")).toBeInTheDocument();
  });

  it("6. ADR-0098 blocked_own: el maker no puede registrar la entrega de su propio anticipo", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockUseAuth.mockReturnValue({ user: { id: "user-creator-123", name: "Creador" } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, status: "pending_disbursement" }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.queryByText("Registrar entrega / pago")).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /Enviada por ti/i })).toHaveTextContent(
      /Debe registrar el pago otra persona/i,
    );
  });

  it("7. ADR-0098 self_confirm: la entrega propia muestra el aviso de autoacción", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ advanceDisburse: true }));
    mockUseAuth.mockReturnValue({ user: { id: "user-creator-123", name: "Admin" } });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, status: "pending_disbursement" }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    await user.click(screen.getByText("Registrar entrega / pago"));

    expect(
      await screen.findByText("¿Registrar el pago de tu propia solicitud?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú registraste este anticipo/i)).toBeInTheDocument();
  });

  it("8. ADR-0099 D15: borrador devuelto ofrece corregir y reenviar", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions
            advance={{
              ...sampleAdvance,
              status: "draft",
              approval: makeApproval({
                flowStatus: "returned",
                stepCurrent: null,
                canAct: false,
                returned: {
                  reason: "Falta comprobante",
                  reasonCode: "missing_receipt",
                  returnedBy: "user-approver-999",
                  returnedByName: "Ana",
                  returnedAt: "2026-10-02T10:00:00Z",
                },
              }),
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Corregir y reenviar")).toBeInTheDocument();
    expect(screen.getByText("Reenviar sin cambios")).toBeInTheDocument();
    expect(screen.getByText("Cancelar anticipo…")).toBeInTheDocument();
    expect(screen.queryByText("Enviar a autorización")).not.toBeInTheDocument();
    expect(screen.queryByText("Editar anticipo…")).not.toBeInTheDocument();
  });

  it("9. ADR-0099 D18: entregado solo permite «Agregar nota…»", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AdvanceActions advance={{ ...sampleAdvance, status: "disbursed" }} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Agregar nota…")).toBeInTheDocument();
    expect(screen.queryByText("Editar anticipo…")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelar anticipo…")).not.toBeInTheDocument();
    expect(screen.queryByText("Autorizar anticipo")).not.toBeInTheDocument();
    expect(screen.queryByText("Registrar entrega / pago")).not.toBeInTheDocument();
  });
});
