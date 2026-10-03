import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementActions } from "./SettlementActions";
import type { DriverSettlement } from "../../domain/entities";
import type { ApprovalBlock, SelfApprovalPolicy } from "@features/approvals";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

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
const mockApproveSettlement = vi.fn();
const mockRejectSettlement = vi.fn();
const mockSubmitSettlement = vi.fn();
const mockCancelSettlement = vi.fn();
const mockReturnSettlement = vi.fn();
const mockSettingsQuery = vi.fn(() => ({
  data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
  isSuccess: true,
  isLoading: false,
  isError: false,
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => mockUsePermissions(),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks/useSettlementSettings", () => ({
  useSettlementSettings: () => mockSettingsQuery(),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    approveSettlement: (...args: unknown[]) => mockApproveSettlement(...args),
    rejectSettlement: (...args: unknown[]) => mockRejectSettlement(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    cancelSettlement: (...args: unknown[]) => mockCancelSettlement(...args),
    returnSettlement: (...args: unknown[]) => mockReturnSettlement(...args),
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

const sampleSettlement: DriverSettlement = {
  id: "set-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202608-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  status: "pending_approval",
  totalTripsCommission: 2500,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 0,
  grossAmount: 2500,
  netAmount: 2500,
  currency: "MXN",
  submittedBy: "user-creator-123",
  disbursedAt: null,
  disbursedBy: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: null,
  approvedBy: null,
  rejectionReason: null,
  notes: null,
  createdAt: "2026-08-15T10:00:00Z",
  updatedAt: "2026-08-15T10:00:00Z",
};

const draftSettlement: DriverSettlement = {
  ...sampleSettlement,
  status: "draft",
  submittedBy: null,
};

describe("SettlementActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    mockUsePermissions.mockReturnValue({
      hasPermission: vi.fn((resource: string, action: string) => {
        if (resource === "settlements" && (action === "update" || action === "execute")) {
          return true;
        }
        return false;
      }),
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", name: "Auditor", email: "a@boeltech.com" },
    });
    mockSelfApprovalPolicy.mockReturnValue(makePolicy());
  });

  it("muestra autorizar/rechazar cuando el revisor no es el solicitante", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Autorizar")).toBeInTheDocument();
    expect(screen.getByText("Rechazar")).toBeInTheDocument();
    expect(screen.queryByText("Enviar a autorización")).not.toBeInTheDocument();
  });

  it("ADR-0098 blocked_own: el solicitante ve «Enviada por ti» deshabilitado en el menú", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    const ownRow = screen.getByRole("menuitem", { name: /Enviada por ti/i });
    expect(ownRow).toHaveAttribute("aria-disabled", "true");
    expect(ownRow).toHaveTextContent(/Debe autorizarla otra persona/i);
    expect(screen.queryByText("Autorizar")).not.toBeInTheDocument();
    expect(screen.queryByText("Rechazar")).not.toBeInTheDocument();
  });

  it("ADR-0098 blocked_own: falla cerrado si la política no cargó", async () => {
    mockSelfApprovalPolicy.mockReturnValue(undefined);
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions variant="buttons" settlement={sampleSettlement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Autorizar$/i })).not.toBeInTheDocument();
  });

  it("ADR-0098 self_confirm: el admin único autoriza lo propio tras confirmar", async () => {
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ settlementApprove: true }));
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    mockApproveSettlement.mockResolvedValue({ ...sampleSettlement, status: "approved" });
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={sampleSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
    await user.click(screen.getByText("Autorizar"));
    expect(
      await screen.findByText("¿Autorizar tu propia solicitud?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú enviaste este pago/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Sí, autorizar" }));
    expect(mockApproveSettlement).toHaveBeenCalledWith("set-1");
  });

  it("ADR-0098 self_confirm: el ejecutor único ve Registrar pago con aviso de autoacción", async () => {
    mockSelfApprovalPolicy.mockReturnValue(makePolicy({ settlementDisburse: true }));
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            onDisburse={vi.fn()}
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Registrar pago/i }));
    expect(
      await screen.findByText("¿Registrar el pago de tu propia solicitud?"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tú registraste este pago/i)).toBeInTheDocument();
  });

  it("ADR-0098: la política ignora los conteos de settings", () => {
    mockSettingsQuery.mockReturnValue({
      data: { voboThresholdMxn: 0, activeApproverCount: 1, activeExecutorCount: 1 },
      isSuccess: true,
      isLoading: false,
      isError: false,
    });
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions variant="buttons" settlement={sampleSettlement} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Autorizar$/i })).not.toBeInTheDocument();
  });

  it("muestra Enviar a autorización en borrador que lo requiere", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: true,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Enviar a autorización/i })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Enviar para autorización/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("draft en menú muestra Enviar a autorización y Cancelar pago", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions settlement={draftSettlement} onView={vi.fn()} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await user.click(screen.getByRole("button", { name: /abrir menú de acciones/i }));
    expect(screen.getByText("Enviar a autorización")).toBeInTheDocument();
    expect(screen.getByText("Cancelar pago")).toBeInTheDocument();
    expect(screen.queryByText("Rechazar")).not.toBeInTheDocument();
  });

  it("oculta Registrar pago al maker en bypass (borrador sin VoBo)", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: false,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
  });

  it("permite Registrar pago desde borrador bypass si no es el maker", () => {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...draftSettlement,
              voboRequired: false,
              createdBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();
  });

  it("oculta Registrar pago al maker en Autorizado", () => {
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", name: "Creador", email: "c@boeltech.com" },
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Registrar pago/i }),
    ).not.toBeInTheDocument();
  });

  it("aviso de umbral no bloquea CTAs cuando falla la lectura de settings", () => {
    mockSettingsQuery.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isLoading: false,
      isError: true,
    });
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <SettlementActions
            variant="buttons"
            settlement={{
              ...sampleSettlement,
              status: "approved",
              createdBy: "user-creator-123",
              submittedBy: "user-creator-123",
            }}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: /Registrar pago/i })).toBeInTheDocument();
    expect(
      screen.getByText(/No se pudo leer la configuración de pagos a operadores/i),
    ).toBeInTheDocument();
  });

  describe("F6c (ADR-0099 / ADR-0085 E10)", () => {
    const withApproval = (overrides: Partial<ApprovalBlock> = {}): DriverSettlement => ({
      ...sampleSettlement,
      approvalRevision: "rev-7",
      approval: makeApproval(overrides),
    });

    it("«Devolver para corregir» pide motivo y envía guardas", async () => {
      const user = userEvent.setup();
      mockReturnSettlement.mockResolvedValueOnce({ ...sampleSettlement, status: "draft" });
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions variant="buttons" settlement={withApproval()} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await user.click(screen.getByRole("button", { name: /Devolver para corregir/i }));
      await user.type(await screen.findByLabelText(/^motivo$/i), "Falta el bono de puntualidad");
      await user.click(screen.getByRole("button", { name: "Devolver" }));

      await waitFor(() => {
        expect(mockReturnSettlement).toHaveBeenCalledWith(
          "set-1",
          expect.objectContaining({
            reason: "Falta el bono de puntualidad",
            guards: { expectedStep: 1, expectedRevision: "rev-7" },
          }),
        );
      });
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Liquidación devuelta para corregir" }),
      );
    });

    it("Rechazar vive en ⋯ y usa el Sheet con guardas", async () => {
      const user = userEvent.setup();
      mockRejectSettlement.mockResolvedValueOnce({ ...sampleSettlement, status: "rejected" });
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions variant="buttons" settlement={withApproval()} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      expect(screen.queryByRole("button", { name: /^Rechazar$/i })).not.toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: /Más acciones/i }));
      await user.click(await screen.findByRole("menuitem", { name: /Rechazar/i }));
      await user.type(
        await screen.findByLabelText(/razón del rechazo/i),
        "El periodo no corresponde a este operador",
      );
      await user.click(screen.getByRole("button", { name: "Rechazar" }));

      await waitFor(() => {
        expect(mockRejectSettlement).toHaveBeenCalledWith(
          "set-1",
          "El periodo no corresponde a este operador",
          { expectedStep: 1, expectedRevision: "rev-7" },
        );
      });
    });

    it("una guarda (409) al autorizar avisa, recarga y no reintenta", async () => {
      const user = userEvent.setup();
      mockApproveSettlement.mockRejectedValueOnce(
        Object.assign(new Error("stale"), { code: "APPROVAL_STEP_CHANGED" }),
      );
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions variant="buttons" settlement={withApproval()} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await user.click(screen.getByRole("button", { name: /Autorizar/i }));
      await user.click(await screen.findByRole("button", { name: /Sí, autorizar pago/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "warning" }));
      });
      expect(mockApproveSettlement).toHaveBeenCalledTimes(1);
      expect(mockApproveSettlement).toHaveBeenCalledWith("set-1", {
        expectedStep: 1,
        expectedRevision: "rev-7",
      });
    });

    it("«Corregir» aparece solo con onCorrect y en estados corregibles", async () => {
      const user = userEvent.setup();
      const onCorrect = vi.fn();
      const queryClient = createTestQueryClient();
      const { rerender } = render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions
              variant="buttons"
              settlement={{ ...sampleSettlement, status: "approved" }}
              onCorrect={onCorrect}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await user.click(screen.getByRole("button", { name: "Corregir" }));
      expect(onCorrect).toHaveBeenCalledTimes(1);

      rerender(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions
              variant="buttons"
              settlement={{ ...sampleSettlement, status: "disbursed" }}
              onCorrect={onCorrect}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(screen.queryByRole("button", { name: "Corregir" })).not.toBeInTheDocument();
    });

    it("devuelta en menú: «Reenviar sin cambios» en lugar de «Enviar a autorización»", async () => {
      const user = userEvent.setup();
      const queryClient = createTestQueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <SettlementActions
              settlement={{
                ...draftSettlement,
                approval: makeApproval({ flowStatus: "returned", stepCurrent: null, canAct: false }),
              }}
              onView={vi.fn()}
            />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await user.click(screen.getByRole("button", { name: /Abrir menú de acciones/i }));
      expect(screen.getByText("Reenviar sin cambios")).toBeInTheDocument();
      expect(screen.queryByText("Enviar a autorización")).not.toBeInTheDocument();
    });
  });
});
