/**
 * Smoke WS-F — flujo bandeja de aprobaciones (list → approve → vacío) y
 * escenarios ADR-0098 de autoaprobación (admin único, contraparte activa,
 * masiva mixta, filtro «Autoaprobadas», 403 de respaldo) y ADR-0099 F6a
 * (cola «Me toca · Todas», firma de paso con guardas, devolver, guarda 409).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import type {
  ApprovableItem,
  ApprovalBlock,
  SelfApprovalPolicy,
} from "@features/approvals/domain";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import { ApprovalInboxPage } from "@features/approvals/presentation/pages/ApprovalInboxPage";

const {
  mockList,
  mockApprove,
  mockReturn,
  mockBulk,
  mockGetAllPendingCounts,
  mockGetSelfApprovalPolicy,
  mockToast,
  mockAuthUser,
} = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockApprove: vi.fn(),
  mockReturn: vi.fn(),
  mockBulk: vi.fn(),
  mockGetAllPendingCounts: vi.fn(),
  mockGetSelfApprovalPolicy: vi.fn(),
  mockToast: vi.fn(),
  mockAuthUser: {
    current: { id: "user-approver-1", fullName: "Gerente Demo", role: "manager" },
  },
}));

vi.mock("@features/approvals/infrastructure/approvalsApi", () => ({
  approvalsApi: {
    list: (...args: unknown[]) => mockList(...args),
    approve: (...args: unknown[]) => mockApprove(...args),
    reject: vi.fn(),
    returnForCorrection: (...args: unknown[]) => mockReturn(...args),
    history: vi.fn().mockResolvedValue([]),
    bulk: (...args: unknown[]) => mockBulk(...args),
    getSelfApprovalPolicy: () => mockGetSelfApprovalPolicy(),
    getPendingCount: vi.fn().mockResolvedValue(1),
    getAllPendingCounts: () => mockGetAllPendingCounts(),
  },
}));

// Approve invalidates notifications with force unread fetch.
vi.mock("@features/notifications/infrastructure", () => ({
  notificationsApi: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
    list: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    dismiss: vi.fn(),
  },
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
    isLoading: false,
    isAuthenticated: true,
    role: mockAuthUser.current.role,
  }),
}));

vi.mock("@features/auth", () => ({
  useAuth: () => ({
    user: mockAuthUser.current,
    isAuthenticated: true,
  }),
}));

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return {
    ...actual,
    useToast: () => ({ toast: mockToast }),
  };
});

const selfCopy = approvalsCopy.selfApproval;
const ADMIN_ID = "user-admin-1";

type PolicyScenario = "admin_solo" | "admin_with_accountant" | "manager_solo";

/** Respuesta del endpoint de capacidades por escenario ADR-0098 §5. */
function makePolicy(scenario: PolicyScenario): SelfApprovalPolicy {
  const entry = (allowed: boolean, activeCounterpartCount: number) => ({
    allowed,
    activeCounterpartCount,
  });
  switch (scenario) {
    case "admin_solo":
      return {
        advanceApprove: entry(true, 1),
        advanceDisburse: entry(true, 1),
        settlementApprove: entry(true, 1),
        settlementDisburse: entry(true, 1),
        tripExpenseApprove: entry(true, 1),
      };
    case "admin_with_accountant":
      return {
        advanceApprove: entry(false, 2),
        advanceDisburse: entry(false, 2),
        settlementApprove: entry(false, 2),
        settlementDisburse: entry(false, 2),
        tripExpenseApprove: entry(false, 2),
      };
    case "manager_solo":
      return {
        advanceApprove: entry(false, 1),
        advanceDisburse: entry(false, 0),
        settlementApprove: entry(false, 1),
        settlementDisburse: entry(false, 0),
        tripExpenseApprove: entry(false, 1),
      };
  }
}

function createPendingItem(
  overrides: Partial<ApprovableItem> & { tripCode?: string } = {},
): ApprovableItem {
  const { tripCode = "V-SMOKE-001", ...rest } = overrides;
  return {
    approvableType: "trip_expense",
    id: "expense-smoke-1",
    amount: 1200,
    currency: "MXN",
    category: "fuel",
    status: "pending",
    submittedAt: "2026-06-01T10:00:00.000Z",
    submittedBy: "user-1",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    selfApproved: false,
    context: {
      approvableType: "trip_expense",
      tripId: `trip-${tripCode}`,
      tripCode,
      driverId: null,
      driverFullName: "Operador Demo",
      vehicleId: null,
      vehicleUnitNumber: "T-99",
      expenseCategory: "fuel",
      description: "Diesel ruta",
      occurredAt: "2026-06-01T09:00:00.000Z",
    },
    ...rest,
  };
}

function listResponse(items: ApprovableItem[]) {
  return {
    data: items,
    pagination: {
      page: 1,
      limit: 25,
      total: items.length,
      totalPages: items.length > 0 ? 1 : 0,
    },
  };
}

function pendingCounts(tripExpense: number) {
  return {
    trip_expense: tripExpense,
    driver_advance_request: 0,
    internal_staff_compensation: 0,
    total: tripExpense,
  };
}

function setUser(id: string, role: string) {
  mockAuthUser.current = { id, fullName: "Usuario Demo", role };
}

function renderInbox(
  initialEntry = "/finance/approvals?type=trip_expense&status=pending",
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <ApprovalInboxPage embedded />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("smoke approvals workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUser("user-approver-1", "manager");
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("manager_solo"));
    const item = createPendingItem();
    let approved = false;

    mockList.mockImplementation(async () =>
      listResponse(approved ? [] : [item]),
    );
    mockGetAllPendingCounts.mockImplementation(async () =>
      pendingCounts(approved ? 0 : 1),
    );

    mockApprove.mockImplementation(async () => {
      approved = true;
      return {
        data: { ...item, status: "approved" as const },
        message: "Gasto aprobado",
      };
    });
  });

  it("lists a pending expense, approves it, and clears the inbox", async () => {
    const user = userEvent.setup();
    renderInbox();

    expect(await screen.findByRole("link", { name: "V-SMOKE-001" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    await user.click(screen.getByRole("button", { name: "Aprobar gasto" }));

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith("trip_expense", "expense-smoke-1", {});
      expect(mockList.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await waitFor(() => {
      expect(screen.queryByRole("link", { name: "V-SMOKE-001" })).not.toBeInTheDocument();
      expect(screen.getByText("Bandeja al día")).toBeInTheDocument();
    });
  });
});

describe("smoke approvals ADR-0098 autoaprobación", () => {
  const ownItem = createPendingItem({
    id: "expense-own",
    tripCode: "V-OWN",
    submittedBy: ADMIN_ID,
  });
  const otherItem = createPendingItem({
    id: "expense-other",
    tripCode: "V-OTHER",
    submittedBy: "user-driver-9",
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setUser(ADMIN_ID, "admin");
    mockGetAllPendingCounts.mockResolvedValue(pendingCounts(1));
    mockList.mockResolvedValue(listResponse([ownItem]));
    mockApprove.mockResolvedValue({
      data: { ...ownItem, status: "approved" as const, selfApproved: true },
      message: "Gasto aprobado",
    });
  });

  it("a) admin único: Aprobar lo propio abre «¿Autorizar tu propia solicitud?» y aprueba", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("admin_solo"));
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-OWN" });
    expect(screen.queryByText(selfCopy.ownChip)).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(selfCopy.confirmTitle)).toBeInTheDocument();
    expect(within(dialog).getByText(/Tú enviaste este gasto/i)).toBeInTheDocument();
    expect(mockApprove).not.toHaveBeenCalled();

    await user.click(
      within(dialog).getByRole("button", { name: selfCopy.confirmAction }),
    );
    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith("trip_expense", "expense-own", {});
    });
  });

  it.each([
    ["admin con contador activo", "admin", "admin_with_accountant"],
    ["gerente único autorizador", "manager", "manager_solo"],
  ] as const)(
    "b) allowed:false (%s): «Enviada por ti», sin Aprobar ni selección",
    async (_label, role, scenario) => {
      setUser(ADMIN_ID, role);
      mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy(scenario));
      mockList.mockResolvedValue(listResponse([ownItem, otherItem]));
      renderInbox();

      await screen.findByRole("checkbox", { name: "Seleccionar V-OTHER" });
      await waitFor(() => expect(mockGetSelfApprovalPolicy).toHaveBeenCalled());

      expect(screen.getByText(selfCopy.ownChip)).toBeInTheDocument();
      expect(
        screen.queryByRole("checkbox", { name: "Seleccionar V-OWN" }),
      ).not.toBeInTheDocument();
      // Solo la fila ajena conserva Aprobar.
      expect(screen.getAllByRole("button", { name: "Aprobar" })).toHaveLength(1);
    },
  );

  it("c) masiva mixta con allowed:true: el diálogo avisa «Incluye 1 solicitud(es) enviadas por ti…»", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("admin_solo"));
    mockList.mockResolvedValue(listResponse([ownItem, otherItem]));
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-OWN" });
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar" }));
    expect(screen.getByText("2 seleccionado(s)")).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: approvalsCopy.inbox.bulk.approve }),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(selfCopy.bulkWarning(1));
  });

  it("c) masiva con fallo SELF_APPROVAL_FORBIDDEN: el diálogo muestra cuál falló y refresca la política", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("admin_solo"));
    mockList.mockResolvedValue(listResponse([ownItem, otherItem]));
    mockBulk.mockResolvedValue({
      data: {
        successes: [
          {
            type: "trip_expense",
            id: "expense-other",
            item: { ...otherItem, status: "approved" },
          },
        ],
        failures: [
          {
            type: "trip_expense",
            id: "expense-own",
            error: {
              code: "SELF_APPROVAL_FORBIDDEN",
              message: "Hay otro autorizador activo en la empresa; pídele que lo autorice",
            },
          },
        ],
      },
      message: "Operación masiva procesada",
    });
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-OWN" });
    expect(mockGetSelfApprovalPolicy).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("checkbox", { name: "Seleccionar" }));
    await user.click(
      screen.getByRole("button", { name: approvalsCopy.inbox.bulk.approve }),
    );
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: approvalsCopy.inbox.bulk.approve }),
    );

    await waitFor(() => {
      expect(mockBulk).toHaveBeenCalledWith([
        { type: "trip_expense", id: "expense-own", action: "approve" },
        { type: "trip_expense", id: "expense-other", action: "approve" },
      ]);
    });
    // ADR-0099 D10: con fallas el diálogo no se cierra; dice cuáles y por qué.
    const resultDialog = await screen.findByRole("alertdialog", {
      name: approvalsCopy.bulkFlow.resultTitle,
    });
    expect(resultDialog).toHaveTextContent(approvalsCopy.bulkFlow.failuresTitle(1, 2));
    expect(resultDialog).toHaveTextContent(
      /V-OWN · Diesel ruta · .+: Hay otro autorizador activo en la empresa; pídele que lo autorice/,
    );
    expect(resultDialog).toHaveTextContent("1 autorizadas");
    await waitFor(() => {
      expect(mockGetSelfApprovalPolicy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    await user.click(
      within(resultDialog).getByRole("button", { name: approvalsCopy.bulkFlow.close }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
  });

  it("d) filtro «Autoaprobadas»: lista con self_approved=true y estado aprobado", async () => {
    const user = userEvent.setup();
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("admin_solo"));
    const selfApprovedItem = createPendingItem({
      id: "expense-self-approved",
      tripCode: "V-AUTO",
      submittedBy: ADMIN_ID,
      status: "approved",
      approvedAt: "2026-06-02T10:00:00.000Z",
      approvedBy: ADMIN_ID,
      selfApproved: true,
    });
    mockList.mockImplementation(async (filters: { selfApproved?: boolean }) =>
      listResponse(filters.selfApproved ? [selfApprovedItem] : [ownItem]),
    );
    renderInbox();

    await screen.findByRole("link", { name: "V-OWN" });
    await user.click(screen.getByRole("button", { name: /Filtros/ }));
    await user.click(screen.getByRole("checkbox", { name: selfCopy.filterChip }));

    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.objectContaining({
          type: "trip_expense",
          selfApproved: true,
          status: "approved",
        }),
      );
    });
    expect(await screen.findByRole("link", { name: "V-AUTO" })).toBeInTheDocument();
    expect(screen.getByText(selfCopy.badge)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: `Quitar filtro ${selfCopy.filterChip}` }),
    );
    await waitFor(() => {
      expect(mockList).toHaveBeenLastCalledWith(
        expect.not.objectContaining({ selfApproved: true }),
      );
    });
  });

  it("e) 403 de respaldo: política obsoleta, toast con el mensaje del API y la fila pasa a «Enviada por ti»", async () => {
    const user = userEvent.setup();
    const apiMessage =
      "Hay otro autorizador activo en la empresa; pídele que lo autorice";
    mockGetSelfApprovalPolicy
      .mockResolvedValueOnce(makePolicy("admin_solo"))
      .mockResolvedValue(makePolicy("admin_with_accountant"));
    mockApprove.mockRejectedValue(
      new ApiError(apiMessage, 403, "SELF_APPROVAL_FORBIDDEN", {
        reason: "counterpart_available",
      }),
    );
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-OWN" });
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: selfCopy.confirmAction }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: approvalsCopy.inbox.toasts.approveError("trip_expense"),
          description: apiMessage,
          variant: "destructive",
        }),
      );
    });
    await waitFor(() => {
      expect(mockGetSelfApprovalPolicy).toHaveBeenCalledTimes(2);
    });

    await user.click(
      within(dialog).getByRole("button", { name: approvalsCopy.inbox.actions.cancel }),
    );
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    expect(await screen.findByText(selfCopy.ownChip)).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-OWN" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
  });
});

describe("smoke approvals ADR-0099 F6a bandeja", () => {
  const flowCopy = approvalsCopy.flow;

  function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
    return {
      flowStatus: "in_progress",
      stepCurrent: 1,
      stepsTotal: 2,
      pendingFor: { roles: ["manager"], users: [] },
      signedSteps: [],
      routedBy: {
        tierIndex: 1,
        minAmount: 5000,
        matchedConditions: [],
        policyVersion: 3,
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

  const stepOneItem = createPendingItem({
    id: "expense-step-1",
    tripCode: "V-STEP1",
    submittedBy: "user-driver-9",
    approvalRevision: "rev-1",
    approval: makeApproval(),
  });
  const waitingItem = createPendingItem({
    id: "expense-waiting",
    tripCode: "V-WAIT",
    submittedBy: "user-driver-9",
    approval: makeApproval({
      stepCurrent: 2,
      pendingFor: { roles: ["accountant"], users: [] },
      signedSteps: [
        {
          stepNo: 1,
          userId: "user-ana",
          fullName: "Ana López",
          role: "manager",
          decidedAt: "2026-10-01T18:00:00.000Z",
        },
      ],
      canAct: false,
      cannotActReason: "not_eligible",
    }),
  });
  const returnedItem = createPendingItem({
    id: "expense-returned",
    tripCode: "V-RET",
    submittedBy: "user-driver-9",
    approval: makeApproval({
      flowStatus: "returned",
      canAct: false,
      cannotActReason: "returned",
      returned: {
        reason: "Falta comprobante",
        reasonCode: "missing_receipt",
        returnedBy: "user-approver-1",
        returnedByName: "Gerente Demo",
        returnedAt: "2026-10-01T18:00:00.000Z",
      },
    }),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    setUser("user-approver-1", "manager");
    mockGetSelfApprovalPolicy.mockResolvedValue(makePolicy("manager_solo"));
    mockGetAllPendingCounts.mockResolvedValue(pendingCounts(1));
    mockList.mockImplementation(async (filters: { includeReturned?: boolean }) =>
      listResponse(
        filters.includeReturned ? [stepOneItem, waitingItem, returnedItem] : [stepOneItem],
      ),
    );
  });

  it("«Me toca» por defecto; «Todas» muestra lo que espera a otro y lo devuelto, sin casilla", async () => {
    const user = userEvent.setup();
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STEP1" });
    expect(mockList).toHaveBeenCalledWith(
      expect.objectContaining({ status: "pending", assignedToMe: true }),
    );
    expect(screen.getByRole("radio", { name: flowCopy.queue.mine })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByText(flowCopy.stepLine(1, 2, "Gerente"))).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: flowCopy.queue.all }));

    await screen.findByRole("link", { name: "V-WAIT" });
    expect(mockList).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: "pending", includeReturned: true }),
    );
    expect(screen.getByText(flowCopy.waitingChip("Contador"))).toBeInTheDocument();
    expect(screen.getByText(flowCopy.stepLine(2, 2, "Contador"))).toBeInTheDocument();
    expect(screen.getByText(/Firmó Ana López \(Gerente\) · /)).toBeInTheDocument();
    expect(screen.getByText(flowCopy.returnedChip)).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-WAIT" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-RET" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Seleccionar V-STEP1" })).toBeInTheDocument();
  });

  it("«Me toca» vacío con pendientes de otros: «Nada te toca por ahora» y CTA a «Todas»", async () => {
    const user = userEvent.setup();
    mockGetAllPendingCounts.mockResolvedValue(pendingCounts(2));
    mockList.mockImplementation(async (filters: { includeReturned?: boolean }) =>
      listResponse(filters.includeReturned ? [waitingItem, returnedItem] : []),
    );
    renderInbox();

    expect(await screen.findByText(flowCopy.emptyMine.title)).toBeInTheDocument();
    expect(screen.getByText(flowCopy.emptyMine.description(2))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: flowCopy.emptyMine.cta }));
    expect(await screen.findByRole("link", { name: "V-WAIT" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: flowCopy.queue.all })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("firmar el paso 1 de 2 envía las guardas y avisa que falta el paso 2", async () => {
    const user = userEvent.setup();
    mockApprove.mockResolvedValue({
      data: stepOneItem,
      outcome: "step_signed",
      message: "Gasto aprobado",
    });
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STEP1" });
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(within(dialog).getByText(flowCopy.stepConfirmTitle(1, 2))).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole("button", { name: flowCopy.stepConfirmAction }),
    );

    await waitFor(() => {
      expect(mockApprove).toHaveBeenCalledWith("trip_expense", "expense-step-1", {
        expectedStep: 1,
        expectedRevision: "rev-1",
      });
    });
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: flowCopy.stepSignedToast(1, 2) }),
      );
    });
  });

  it("guarda APPROVAL_STEP_CHANGED: cierra, avisa con el copy del handoff, refresca y no reintenta", async () => {
    const user = userEvent.setup();
    mockApprove.mockRejectedValue(
      new ApiError("step changed", 409, "APPROVAL_STEP_CHANGED"),
    );
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STEP1" });
    const listCallsBefore = mockList.mock.calls.length;
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    const dialog = await screen.findByRole("alertdialog");
    await user.click(
      within(dialog).getByRole("button", { name: flowCopy.stepConfirmAction }),
    );

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: approvalsCopy.guardErrors.APPROVAL_STEP_CHANGED,
          variant: "warning",
        }),
      );
    });
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockList.mock.calls.length).toBeGreaterThan(listCallsBefore);
    });
    expect(mockApprove).toHaveBeenCalledTimes(1);
  });

  it("devolver con «Falta comprobante» en 2 clics desde el menú ⋯", async () => {
    const user = userEvent.setup();
    mockReturn.mockResolvedValue({ data: stepOneItem, outcome: "returned" });
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STEP1" });
    await user.click(screen.getByRole("button", { name: flowCopy.menu.more }));
    await user.click(await screen.findByRole("menuitem", { name: flowCopy.menu.return }));

    const sheet = await screen.findByRole("dialog");
    await user.click(
      within(sheet).getByRole("radio", {
        name: approvalsCopy.returnSheet.reasonCodes.missing_receipt,
      }),
    );
    await user.click(
      within(sheet).getByRole("button", { name: approvalsCopy.returnSheet.submit }),
    );

    await waitFor(() => {
      expect(mockReturn).toHaveBeenCalledWith("trip_expense", "expense-step-1", {
        reason: approvalsCopy.returnSheet.reasonCodes.missing_receipt,
        reasonCode: "missing_receipt",
        expectedStep: 1,
        expectedRevision: "rev-1",
      });
    });
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: flowCopy.returnSuccess("trip_expense") }),
      );
    });
  });
});
