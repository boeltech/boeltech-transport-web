import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SettlementDetailPage } from "./SettlementDetailPage";
import type { DriverSettlement } from "../../domain/entities";

const mockUseAuth = vi.fn();
const mockGetSettlementById = vi.fn();
const mockSubmitSettlement = vi.fn();

vi.mock("@features/auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: "accountant",
  }),
}));

vi.mock("@features/settings/application", () => ({
  useCompanySettings: () => ({
    data: {
      legalName: "Transportes Test",
      rfc: "AAA010101AAA",
      logoUrl: null,
      updatedAt: new Date("2026-01-01T00:00:00Z"),
    },
  }),
  useCompanyLogoObjectUrl: () => ({ logoSrc: null, isLoading: false, isError: false }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: vi.fn() }),
  };
});

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    getSettlementById: (...args: unknown[]) => mockGetSettlementById(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    approveSettlement: vi.fn(),
    rejectSettlement: vi.fn(),
    disburseSettlement: vi.fn(),
    listOperators: vi.fn().mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 100, total: 0, totalPages: 1 },
    }),
    getSettings: vi.fn().mockResolvedValue({
      voboThresholdMxn: 0,
      activeApproverCount: 2,
      activeExecutorCount: 2,
    }),
  },
}));

vi.mock("@features/approvals/application", async () => {
  const hooks = await import(
    "@features/approvals/application/hooks/useSelfApprovalPolicy"
  );
  return {
    invalidateSelfApprovalPolicy: hooks.invalidateSelfApprovalPolicy,
    useSelfActionForbiddenHandler: hooks.useSelfActionForbiddenHandler,
    invalidateApprovalsRelatedQueries: vi.fn(),
    useSelfApprovalPolicy: () => ({
      data: {
        advanceApprove: { allowed: false, activeCounterpartCount: 1 },
        advanceDisburse: { allowed: false, activeCounterpartCount: 1 },
        settlementApprove: { allowed: false, activeCounterpartCount: 1 },
        settlementDisburse: { allowed: false, activeCounterpartCount: 1 },
        tripExpenseApprove: { allowed: false, activeCounterpartCount: 1 },
      },
    }),
  };
});

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const pendingSettlement: DriverSettlement = {
  id: "set-detail-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202609-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-09-01",
  periodEnd: "2026-09-15",
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
  createdAt: "2026-09-15T10:00:00Z",
  updatedAt: "2026-09-15T10:00:00Z",
  items: [],
};

describe("SettlementDetailPage self-approval (H9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-approver-999",
        fullName: "Auditor",
        tenant: { name: "Tenant" },
      },
      isAuthenticated: true,
    });
  });

  it("muestra Autorizar cuando el revisor no es el solicitante", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Autorizar/i })).toBeInTheDocument();
  });

  it("vuelve a en autorización cuando viene con state.from", async () => {
    const user = userEvent.setup();
    const queryClient = createTestQueryClient();
    function QueueProbe() {
      const location = useLocation();
      return <div>{`${location.pathname}${location.search}`}</div>;
    }

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter
          initialEntries={[
            {
              pathname: "/finance/operator-payments/set-detail-1",
              state: { from: "/finance/operator-payments?bucket=approval" },
            },
          ]}
        >
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
            <Route
              path="/finance/operator-payments"
              element={<QueueProbe />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("button", { name: "Volver a en autorización" }),
    );
    expect(screen.getByText("/finance/operator-payments?bucket=approval")).toBeInTheDocument();
  });

  it("no muestra Autorizar cuando submittedBy === user.id", async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: "user-creator-123",
        fullName: "Creador",
        tenant: { name: "Tenant" },
      },
      isAuthenticated: true,
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Autorizar/i })).not.toBeInTheDocument();
  });

  it("H4: el paso Elaboró muestra el nombre que ahora llena el API", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      createdByName: "Ana Capataz",
      submittedByName: "Ana Capataz",
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByText("Elaboró")).toBeInTheDocument();
    expect(screen.getByText("Ana Capataz")).toBeInTheDocument();
  });

  it("H4: sin nombres del API el paso Elaboró queda vacío (regresión previa)", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.queryByText("Ana Capataz")).not.toBeInTheDocument();
  });

  it("D3′: muestra evidencia self-segregated en el timeline", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "disbursed",
      approvedAt: "2026-09-16T11:00:00Z",
      approvedBy: "user-solo",
      approvedByName: "Admin Único",
      disbursedAt: "2026-09-16T12:00:00Z",
      disbursedBy: "user-solo",
      disbursedByName: "Admin Único",
      disbursementMethod: "bank_transfer",
      disbursementReference: "SPEI-9",
      selfSegregatedApproval: true,
      approverCountAtApprove: 1,
      selfSegregatedDisbursement: true,
      executorCountAtDisburse: 1,
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Autorizado en modo un solo responsable/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Pago registrado en modo un solo responsable/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Autoaprobado")).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("P2-2: una liquidación autorrechazada no muestra «Autoaprobado»", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
      selfSegregatedApproval: true,
      approverCountAtApprove: 1,
    });
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.queryByText("Autoaprobado")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Autorizado en modo un solo responsable/i),
    ).not.toBeInTheDocument();
  });
});

describe("SettlementDetailPage F6c (ADR-0085 E10)", () => {
  function CreateProbe() {
    const location = useLocation();
    return <div data-testid="create-probe">{`${location.pathname}${location.search}`}</div>;
  }

  function renderDetail() {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/new" element={<CreateProbe />} />
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", fullName: "Auditor", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
    mockSubmitSettlement.mockResolvedValue({ ...pendingSettlement });
  });

  it("D25 / H1–H3: pendiente ofrece Devolver · Autorizar · Más (Preview/Corregir en ⋯)", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    renderDetail();

    await waitFor(() => {
      expect(screen.getByText("LIQ-202609-0001")).toBeInTheDocument();
    });

    expect(screen.getByRole("button", { name: /Autorizar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Más acciones/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Devolver para corregir/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Corregir" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Vista previa del recibo/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Rechazar$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Imprimir recibo/i })).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Si solo hay un error corregible, devuelve el pago/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Más acciones/i }));
    expect(
      await screen.findByRole("menuitem", { name: /Vista previa del recibo/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Corregir" })).toBeInTheDocument();
  });

  it("R1: dialog en pendiente usa título y descripción de vista previa", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Más acciones/i }));
    await user.click(
      await screen.findByRole("menuitem", { name: /Vista previa del recibo/i }),
    );

    expect(screen.getByRole("heading", { name: "Vista previa del recibo" })).toBeInTheDocument();
    expect(
      screen.getByText("Vista previa para revisión; no es un documento para firma."),
    ).toBeInTheDocument();
  });

  it("R1: dialog en autorizado usa «Recibo para firma»", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "approved",
      approvedAt: "2026-09-16T10:00:00Z",
      approvedBy: "user-approver-999",
      approvedByName: "Auditor",
    });
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Imprimir recibo/i }));

    expect(screen.getByRole("heading", { name: "Recibo para firma" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "Documento listo para firma del operador. Imprímelo y recoge la firma.",
      ),
    ).toBeInTheDocument();
  });

  it("R1: dialog en pagado usa «Recibo de pago»", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "disbursed",
      approvedAt: "2026-09-16T10:00:00Z",
      approvedBy: "user-approver-999",
      approvedByName: "Auditor",
      disbursedAt: "2026-09-17T10:00:00Z",
      disbursedBy: "user-executor-1",
      disbursedByName: "Tesorería",
      disbursementMethod: "cash",
    });
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Imprimir recibo/i }));

    expect(screen.getByRole("heading", { name: "Recibo de pago" })).toBeInTheDocument();
    expect(
      screen.getByText("Recibo del pago registrado. Imprímelo para firma o archivo."),
    ).toBeInTheDocument();
  });

  it("R2: en pagado el botón Imprimir recibo es primary", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "disbursed",
      approvedAt: "2026-09-16T10:00:00Z",
      approvedBy: "user-approver-999",
      approvedByName: "Auditor",
      disbursedAt: "2026-09-17T10:00:00Z",
      disbursedBy: "user-executor-1",
      disbursedByName: "Tesorería",
      disbursementMethod: "cash",
    });
    renderDetail();

    const printBtn = await screen.findByRole("button", { name: /Imprimir recibo/i });
    expect(printBtn.className).toMatch(/bg-primary/);
  });

  it("R2: en autorizado el botón Imprimir recibo es outline", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "approved",
      approvedAt: "2026-09-16T10:00:00Z",
      approvedBy: "user-approver-999",
      approvedByName: "Auditor",
    });
    renderDetail();

    const printBtn = await screen.findByRole("button", { name: /Imprimir recibo/i });
    expect(printBtn.className).not.toMatch(/bg-primary(?!\/)/);
    expect(printBtn.className).toMatch(/border-input/);
  });

  it("R2: en pendiente Vista previa del recibo vive en Más (no outline permanente)", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue(pendingSettlement);
    renderDetail();

    expect(
      screen.queryByRole("button", { name: /Vista previa del recibo/i }),
    ).not.toBeInTheDocument();
    await user.click(await screen.findByRole("button", { name: /Más acciones/i }));
    expect(
      await screen.findByRole("menuitem", { name: /Vista previa del recibo/i }),
    ).toBeInTheDocument();
  });

  it("R7: Imprimir vive en el footer del dialog, no en el header", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "approved",
      approvedAt: "2026-09-16T10:00:00Z",
      approvedBy: "user-approver-999",
      approvedByName: "Auditor",
    });
    renderDetail();

    await user.click(await screen.findByRole("button", { name: /Imprimir recibo/i }));

    const heading = screen.getByRole("heading", { name: "Recibo para firma" });
    const printInDialog = screen.getByRole("button", { name: /^Imprimir$/i });
    expect(heading.parentElement).not.toContainElement(printInDialog);
  });

  it("criterio 6: rechazada ofrece «Armar pago nuevo con este periodo»", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
    });
    renderDetail();

    await user.click(
      await screen.findByRole("button", { name: /Armar pago nuevo con este periodo/i }),
    );

    const target = screen.getByTestId("create-probe").textContent ?? "";
    expect(target).toContain("/finance/operator-payments/new?");
    expect(target).toContain("employeeId=emp-1");
    expect(target).toContain("periodStart=2026-09-01");
    expect(target).toContain("periodEnd=2026-09-15");
    expect(screen.queryByRole("button", { name: "Corregir" })).not.toBeInTheDocument();
  });

  it("criterio 1: devuelta muestra el motivo, abre el Sheet y permite reenviar sin cambios", async () => {
    const user = userEvent.setup();
    mockUseAuth.mockReturnValue({
      user: { id: "user-creator-123", fullName: "Creador", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "draft",
      advancesReserved: true,
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
          reason: "Falta el bono de puntualidad",
          reasonCode: "other",
          returnedBy: "user-approver-999",
          returnedByName: "Ana",
          returnedAt: "2026-09-16T11:00:00Z",
        },
      },
    });
    renderDetail();

    expect(await screen.findByText(/Falta el bono de puntualidad/)).toBeInTheDocument();
    // D15: el reenvío vive en la alerta, no se duplica en el header.
    expect(screen.queryByRole("button", { name: /Enviar a autorización/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Corregir y reenviar" }));
    expect(
      await screen.findByText("Corregir pago LIQ-202609-0001"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar y reenviar" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    await user.click(screen.getByRole("button", { name: "Reenviar sin cambios" }));
    await waitFor(() => expect(mockSubmitSettlement).toHaveBeenCalledWith("set-detail-1"));
  });
});

describe("SettlementDetailPage F2 DetailAlertCard.action (D7)", () => {
  function CreateProbe() {
    const location = useLocation();
    return <div data-testid="create-probe">{`${location.pathname}${location.search}`}</div>;
  }

  function renderDetail() {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/new" element={<CreateProbe />} />
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", fullName: "Auditor", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
  });

  it("cancelado: CTA en DetailAlertCard.action arma pago nuevo", async () => {
    const user = userEvent.setup();
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "cancelled",
    });
    renderDetail();

    const alert = await screen.findByTestId("settlement-cancelled-alert");
    expect(alert).toHaveTextContent("Pago cancelado");
    expect(alert).toHaveTextContent(
      "Sus viajes, sueldo y reembolsos quedaron libres para armar un pago nuevo.",
    );

    await user.click(
      screen.getByRole("button", { name: /Armar pago nuevo con este período/i }),
    );

    const target = screen.getByTestId("create-probe").textContent ?? "";
    expect(target).toContain("/finance/operator-payments/new?");
    expect(target).toContain("employeeId=emp-1");
    expect(target).toContain("periodStart=2026-09-01");
    expect(target).toContain("periodEnd=2026-09-15");
  });

  it("rechazado: CTA en DetailAlertCard.action (job) sin tocar ReturnedAlert", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      status: "rejected",
      rejectionReason: "Montos incorrectos",
    });
    renderDetail();

    const alert = await screen.findByTestId("settlement-rejected-alert");
    expect(alert).toHaveTextContent("Pago rechazado por gerencia");
    expect(alert).toHaveTextContent("Montos incorrectos");
    expect(
      screen.getByRole("button", { name: /Armar pago nuevo con este periodo/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Devuelta para corregir/i)).not.toBeInTheDocument();
  });
});

describe("SettlementDetailPage F4 fórmula 5 términos + Regla aplicada", () => {
  function settlementItem(
    overrides: Partial<NonNullable<DriverSettlement["items"]>[number]>,
  ): NonNullable<DriverSettlement["items"]>[number] {
    return {
      id: "item",
      settlementId: "set-detail-1",
      itemType: "bonus",
      tripId: null,
      tripExpenseId: null,
      advanceId: null,
      description: "",
      quantity: 1,
      unitRate: 0,
      amount: 0,
      isDeduction: false,
      createdAt: "2026-09-15T10:00:00Z",
      ...overrides,
    };
  }

  function renderDetail() {
    const queryClient = createTestQueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/finance/operator-payments/set-detail-1"]}>
          <Routes>
            <Route path="/finance/operator-payments/:id" element={<SettlementDetailPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: "user-approver-999", fullName: "Auditor", tenant: { name: "Tenant" } },
      isAuthenticated: true,
    });
  });

  it("muestra fórmula 5 términos, columna Regla aplicada e inspector (CA F4.7–F4.9)", async () => {
    mockGetSettlementById.mockResolvedValue({
      ...pendingSettlement,
      totalTripsCommission: 2733,
      totalBaseSalary: 4500,
      totalAdvancesDeducted: 2500,
      totalOtherDeductions: 200,
      grossAmount: 8033,
      netAmount: 5333,
      items: [
        settlementItem({
          id: "trip",
          itemType: "trip_commission",
          tripId: "trip-1",
          tripCode: "TRP-260908-0003",
          description: "Comisión de viaje TRP-260908-0003 (Amazon México → Estadio BBVA · Foráneo)",
          unitRate: 2733,
          amount: 2733,
          calculationDetails: {
            appliedRule: "920 km × $3.00",
            routeType: "long_haul",
            distanceKm: 920,
          },
        }),
        settlementItem({
          id: "salary",
          itemType: "base_salary",
          description: "Sueldo base fijo (Semanal)",
          unitRate: 4500,
          amount: 4500,
        }),
        settlementItem({
          id: "advance",
          itemType: "advance_deduction",
          advanceId: "adv-1",
          description: "Descuento de anticipo",
          unitRate: 2500,
          amount: 2500,
          isDeduction: true,
        }),
      ],
    });
    renderDetail();

    await screen.findByText("LIQ-202609-0001");

    const formula = screen.getByTestId("settlement-payment-formula");
    expect(formula).toHaveTextContent("Por viajes");
    expect(formula).toHaveTextContent("Sueldo y fijos");
    expect(formula).toHaveTextContent("Reembolsos");
    expect(formula).toHaveTextContent("Anticipos y descuentos");
    expect(formula).toHaveTextContent("A pagar");
    expect(formula).toHaveTextContent("$5,333.00");

    expect(screen.getByTestId("settlement-trips-rule-table")).toHaveTextContent(
      "Regla aplicada",
    );
    expect(screen.getByText("920 km × $3.00")).toBeInTheDocument();
    expect(screen.getByTestId("settlement-detail-inspector")).toHaveTextContent(
      "Por qué este monto",
    );
  });
});
