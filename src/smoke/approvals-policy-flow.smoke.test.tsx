/**
 * Smoke ADR-0099 F7 (AX-2…AX-9b) — bandeja con reglas de autorización: masiva
 * por paso, «Ya firmaste», reautorización, escalada / sin elegibles, historial,
 * guardas 409, rechazo terminal y tenant sin regla propia (UX5 enmendada).
 * Mock de API; no requiere backend ni Playwright.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { formatDateTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type {
  ApprovableItem,
  ApprovalBlock,
  ApprovalFieldChange,
  ApprovalHistoryEntry,
  SelfApprovalPolicy,
} from "@features/approvals/domain";
import { approvalsCopy } from "@features/approvals/presentation/copy/approvalsCopy";
import { ApprovalInboxPage } from "@features/approvals/presentation/pages/ApprovalInboxPage";

const {
  mockList,
  mockApprove,
  mockReject,
  mockBulk,
  mockHistory,
  mockGetAllPendingCounts,
  mockGetSelfApprovalPolicy,
  mockToast,
  mockAuthUser,
} = vi.hoisted(() => ({
  mockList: vi.fn(),
  mockApprove: vi.fn(),
  mockReject: vi.fn(),
  mockBulk: vi.fn(),
  mockHistory: vi.fn(),
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
    reject: (...args: unknown[]) => mockReject(...args),
    returnForCorrection: vi.fn(),
    history: (...args: unknown[]) => mockHistory(...args),
    bulk: (...args: unknown[]) => mockBulk(...args),
    getSelfApprovalPolicy: () => mockGetSelfApprovalPolicy(),
    getPendingCount: vi.fn().mockResolvedValue(1),
    getAllPendingCounts: () => mockGetAllPendingCounts(),
  },
}));

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

const flowCopy = approvalsCopy.flow;
const bulkCopy = approvalsCopy.bulkFlow;
const historyCopy = approvalsCopy.history;
const rejectCopy = approvalsCopy.rejectSheet;
const ME = "user-approver-1";

const MANAGER_POLICY: SelfApprovalPolicy = {
  advanceApprove: { allowed: false, activeCounterpartCount: 1 },
  advanceDisburse: { allowed: false, activeCounterpartCount: 0 },
  settlementApprove: { allowed: false, activeCounterpartCount: 1 },
  settlementDisburse: { allowed: false, activeCounterpartCount: 0 },
  tripExpenseApprove: { allowed: false, activeCounterpartCount: 1 },
};

function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return {
    flowStatus: "in_progress",
    stepCurrent: 1,
    stepsTotal: 2,
    pendingFor: { roles: ["manager"], users: [] },
    nextStep: { stepNo: 2, roles: ["accountant"], users: [] },
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

/** Un paso con regla propia (v3): firma única que autoriza. */
function singleStepApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
  return makeApproval({
    stepsTotal: 1,
    nextStep: null,
    routedBy: {
      tierIndex: 0,
      minAmount: 0,
      matchedConditions: [],
      policyVersion: 3,
      lazy: false,
    },
    ...overrides,
  });
}

function createItem(
  tripCode: string,
  overrides: Partial<ApprovableItem> = {},
): ApprovableItem {
  return {
    approvableType: "trip_expense",
    id: `expense-${tripCode}`,
    amount: 1200,
    currency: "MXN",
    category: "fuel",
    status: "pending",
    submittedAt: "2026-10-01T10:00:00.000Z",
    submittedBy: "user-driver-9",
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectionReason: null,
    selfApproved: false,
    approvalRevision: `rev-${tripCode}`,
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
      occurredAt: "2026-10-01T09:00:00.000Z",
    },
    ...overrides,
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

function renderInbox() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/finance/approvals?type=trip_expense&status=pending"]}>
        <ApprovalInboxPage embedded />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function folioOf(item: ApprovableItem): string {
  return `${item.context.approvableType === "trip_expense" ? item.context.tripCode : ""} · Diesel ruta · ${formatMxCurrency(item.amount)}`;
}

async function openRowMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: flowCopy.menu.more }));
  return screen.findByRole("menu");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser.current = { id: ME, fullName: "Gerente Demo", role: "manager" };
  mockGetSelfApprovalPolicy.mockResolvedValue(MANAGER_POLICY);
  mockGetAllPendingCounts.mockResolvedValue({
    trip_expense: 1,
    driver_advance_request: 0,
    internal_staff_compensation: 0,
    total: 1,
  });
  mockHistory.mockResolvedValue([]);
});

describe("AX-2 masiva por paso", () => {
  const singles = Array.from({ length: 10 }, (_, index) =>
    createItem(`V-B${String(index + 1).padStart(2, "0")}`, {
      approval: singleStepApproval(),
    }),
  );
  const twoStep = Array.from({ length: 4 }, (_, index) =>
    createItem(`V-S${index + 1}`, { approval: makeApproval() }),
  );

  async function selectAllAndConfirm(
    user: ReturnType<typeof userEvent.setup>,
    expectedPrediction: string,
  ) {
    await screen.findByRole("checkbox", { name: "Seleccionar V-S1" });
    await user.click(screen.getByRole("checkbox", { name: "Seleccionar" }));
    await user.click(
      within(screen.getByTestId("approvals-bulk-actions-bar")).getByRole(
        "button",
        { name: approvalsCopy.inbox.bulk.approve },
      ),
    );
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(expectedPrediction);
    await user.click(
      within(dialog).getByRole("button", { name: approvalsCopy.inbox.bulk.approve }),
    );
  }

  it("predicción exacta, guardas por fila y toast «8 autorizadas · 4 pasaron al paso 2»", async () => {
    const user = userEvent.setup();
    const targets = [...singles.slice(0, 8), ...twoStep];
    mockList.mockResolvedValue(listResponse(targets));
    mockBulk.mockImplementation(async (operations: Array<{ id: string }>) => ({
      data: {
        successes: operations.map((operation) => {
          const item = targets.find((candidate) => candidate.id === operation.id)!;
          return {
            type: "trip_expense",
            id: item.id,
            item,
            outcome: item.approval?.stepsTotal === 2 ? "step_signed" : "approved",
          };
        }),
        failures: [],
      },
      message: "Operación masiva procesada",
    }));
    renderInbox();

    const prediction = bulkCopy.prediction({
      total: 12,
      approve: 8,
      advance: 4,
      nextStep: 2,
      nextRole: "Contador",
    })!;
    expect(prediction).toBe(
      "12 seleccionadas: 8 quedan autorizadas y 4 pasan al paso 2 · Contador.",
    );
    await selectAllAndConfirm(user, prediction);

    await waitFor(() => expect(mockBulk).toHaveBeenCalledTimes(1));
    const operations = mockBulk.mock.calls[0][0] as Array<Record<string, unknown>>;
    expect(operations).toHaveLength(12);
    for (const item of targets) {
      expect(operations).toContainEqual({
        type: "trip_expense",
        id: item.id,
        action: "approve",
        expectedStep: 1,
        expectedRevision: item.approvalRevision,
      });
    }

    const summary = bulkCopy.successSummary({
      approved: 8,
      stepSigned: 4,
      returned: 0,
      rejected: 0,
      nextStep: 2,
      nextRole: "Contador",
    });
    expect(summary).toBe("8 autorizadas · 4 pasaron al paso 2 · Contador");
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: summary, variant: "success" }),
      );
    });
    expect(
      screen.queryByRole("alertdialog", { name: bulkCopy.resultTitle }),
    ).not.toBeInTheDocument();
  });

  it("2 fallas: el diálogo sigue abierto con folio + motivo y «Recargar bandeja» refresca", async () => {
    const user = userEvent.setup();
    const targets = [...singles, ...twoStep];
    const revisionFailed = singles[8];
    const otherFailed = singles[9];
    mockList.mockResolvedValue(listResponse(targets));
    mockBulk.mockImplementation(async (operations: Array<{ id: string }>) => ({
      data: {
        successes: operations
          .filter((operation) => ![revisionFailed.id, otherFailed.id].includes(operation.id))
          .map((operation) => {
            const item = targets.find((candidate) => candidate.id === operation.id)!;
            return {
              type: "trip_expense",
              id: item.id,
              item,
              outcome: item.approval?.stepsTotal === 2 ? "step_signed" : "approved",
            };
          }),
        failures: [
          {
            type: "trip_expense",
            id: revisionFailed.id,
            error: { code: "APPROVAL_REVISION_CHANGED", message: "revision changed" },
          },
          {
            type: "trip_expense",
            id: otherFailed.id,
            error: { code: "TRIP_EXPENSE_NOT_PENDING", message: "El gasto ya no está pendiente" },
          },
        ],
      },
      message: "Operación masiva procesada",
    }));
    renderInbox();

    await selectAllAndConfirm(
      user,
      bulkCopy.prediction({ total: 14, approve: 10, advance: 4, nextStep: 2, nextRole: "Contador" })!,
    );

    const resultDialog = await screen.findByRole("alertdialog", {
      name: bulkCopy.resultTitle,
    });
    expect(resultDialog).toHaveTextContent("8 autorizadas · 4 pasaron al paso 2 · Contador");
    expect(resultDialog).toHaveTextContent(bulkCopy.failuresTitle(2, 14));
    expect(resultDialog).toHaveTextContent(
      `${folioOf(revisionFailed)}: ${approvalsCopy.guardErrors.APPROVAL_REVISION_CHANGED}`,
    );
    expect(resultDialog).toHaveTextContent(
      `${folioOf(otherFailed)}: El gasto ya no está pendiente`,
    );
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({ variant: "success" }),
    );

    const listCallsBefore = mockList.mock.calls.length;
    await user.click(within(resultDialog).getByRole("button", { name: bulkCopy.reload }));
    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(mockList.mock.calls.length).toBeGreaterThan(listCallsBefore);
    });
  });
});

describe("AX-3 «Ya firmaste el paso 1»", () => {
  it("chip en lugar de Aprobar, sin casilla, y ⋯ solo ofrece «Ver historial»", async () => {
    const user = userEvent.setup();
    const signed = createItem("V-SIGNED", {
      approval: makeApproval({
        stepCurrent: 2,
        pendingFor: { roles: ["accountant"], users: [] },
        nextStep: null,
        signedSteps: [
          {
            stepNo: 1,
            userId: ME,
            fullName: "Gerente Demo",
            role: "manager",
            decidedAt: "2026-10-01T18:00:00.000Z",
          },
        ],
        canAct: false,
        cannotActReason: "already_signed",
      }),
    });
    mockList.mockResolvedValue(listResponse([signed]));
    renderInbox();

    expect(await screen.findByText(flowCopy.alreadySignedChip(1))).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-SIGNED" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();

    const menu = await openRowMenu(user);
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual([flowCopy.menu.history]);
  });
});

describe("AX-4 reautorización", () => {
  it("chip «Reautorización» con el cambio de monto en el tooltip", async () => {
    const user = userEvent.setup();
    const reapproval = createItem("V-REAP", {
      amount: 12000,
      approval: makeApproval({
        reapproval: {
          invalidatedAt: "2026-10-01T17:00:00.000Z",
          previousInstanceId: "instance-1",
          previousStatus: "approved",
          changes: [{ field: "amount", from: 8000, to: 12000 }],
        },
      }),
    });
    mockList.mockResolvedValue(listResponse([reapproval]));
    renderInbox();

    const chip = await screen.findByText(flowCopy.reapprovalChip);
    await user.hover(chip);
    const expected = flowCopy.reapprovalTooltip(
      `Monto: ${formatMxCurrency(8000)} → ${formatMxCurrency(12000)}`,
    );
    expect(expected).toBe(
      "Cambió desde la autorización anterior: Monto: $8,000.00 → $12,000.00",
    );
    expect(await screen.findByRole("tooltip")).toHaveTextContent(expected);
  });

  it("con regla propia y corrección antes de autorizar: «Cambió mientras esperaba autorización»", async () => {
    const user = userEvent.setup();
    const corrected = createItem("V-REAP-OPEN", {
      amount: 12000,
      approval: makeApproval({
        reapproval: {
          invalidatedAt: "2026-10-01T17:00:00.000Z",
          previousInstanceId: "instance-1",
          previousStatus: "in_progress",
          changes: [{ field: "amount", from: 8000, to: 12000 }],
        },
      }),
    });
    mockList.mockResolvedValue(listResponse([corrected]));
    renderInbox();

    await user.hover(await screen.findByText(flowCopy.reapprovalChip));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Cambió mientras esperaba autorización: Monto: $8,000.00 → $12,000.00",
    );
  });
});

describe("AX-5 escalada y sin elegibles", () => {
  it("«Escalada a administración» en el estado y «Sin autorizador activo» sin Aprobar", async () => {
    const escalated = createItem("V-ESC", {
      approval: makeApproval({
        escalated: true,
        pendingFor: { roles: ["admin"], users: [] },
        canAct: false,
        cannotActReason: "not_eligible",
      }),
    });
    const orphan = createItem("V-ORPHAN", {
      approval: makeApproval({
        pendingFor: { roles: [], users: [] },
        canAct: false,
        cannotActReason: "no_active_eligible",
      }),
    });
    mockList.mockResolvedValue(listResponse([escalated, orphan]));
    renderInbox();

    expect(await screen.findByText(flowCopy.escalatedChip)).toBeInTheDocument();
    expect(screen.getByText(flowCopy.noActiveChip)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "Seleccionar V-ESC" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Seleccionar V-ORPHAN" }),
    ).not.toBeInTheDocument();
  });
});

describe("AX-6 historial", () => {
  it("muestra actor, rol, paso, motivo, cambio y la versión de regla (vN o estándar)", async () => {
    const user = userEvent.setup();
    const item = createItem("V-HIST", { approval: makeApproval() });
    const entries: ApprovalHistoryEntry[] = [
      {
        id: "ev-1",
        instanceId: "instance-1",
        stepNo: 1,
        eventType: "step_approved",
        actorId: "user-ana",
        actorName: "Ana López",
        actorRole: "manager",
        reason: null,
        reasonCode: null,
        changes: [],
        policyVersionId: "policy-v3",
        policyVersion: 3,
        createdAt: "2026-10-01T15:00:00.000Z",
      },
      {
        id: "ev-2",
        instanceId: "instance-1",
        stepNo: 2,
        eventType: "returned",
        actorId: "user-luis",
        actorName: "Luis Pérez",
        actorRole: "accountant",
        reason: "No viene el ticket de la caseta",
        reasonCode: "missing_receipt",
        changes: [],
        policyVersionId: "policy-v3",
        policyVersion: 3,
        createdAt: "2026-10-01T16:00:00.000Z",
      },
      {
        id: "ev-3",
        instanceId: "instance-0",
        stepNo: null,
        eventType: "invalidated",
        actorId: null,
        actorName: null,
        actorRole: null,
        reason: null,
        reasonCode: "material_change",
        changes: [{ field: "amount", from: 8000, to: 12000 }],
        policyVersionId: null,
        policyVersion: null,
        createdAt: "2026-10-01T14:00:00.000Z",
      },
    ];
    mockList.mockResolvedValue(listResponse([item]));
    mockHistory.mockResolvedValue(entries);
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-HIST" });
    const menu = await openRowMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: flowCopy.menu.history }));

    const sheet = await screen.findByRole("dialog", { name: historyCopy.title });
    expect(mockHistory).toHaveBeenCalledWith("trip_expense", item.id);
    expect(await within(sheet).findByText(historyCopy.events.step_approved(1))).toBeInTheDocument();

    const lineOf = (text: string) =>
      within(sheet).getByText(
        (_content, element) => element?.tagName === "P" && element.textContent === text,
      );
    expect(
      lineOf(`Ana López (Gerente) · ${formatDateTime(entries[0].createdAt)} · ${historyCopy.policyVersion(3)}`),
    ).toBeInTheDocument();
    expect(
      lineOf(`Luis Pérez (Contador) · ${formatDateTime(entries[1].createdAt)} · ${historyCopy.policyVersion(3)}`),
    ).toBeInTheDocument();
    expect(
      lineOf(`${historyCopy.actorUnknown} · ${formatDateTime(entries[2].createdAt)} · ${historyCopy.policyStandard}`),
    ).toBeInTheDocument();

    expect(within(sheet).getByText(historyCopy.step(1))).toBeInTheDocument();
    expect(within(sheet).getByText(historyCopy.step(2))).toBeInTheDocument();
    expect(within(sheet).getByText(historyCopy.events.returned(2))).toBeInTheDocument();
    expect(
      within(sheet).getByText("Falta comprobante: No viene el ticket de la caseta"),
    ).toBeInTheDocument();
    expect(within(sheet).getByText(historyCopy.invalidated.material_change)).toBeInTheDocument();
    expect(within(sheet).getByText("Monto: $8,000.00 → $12,000.00")).toBeInTheDocument();
  });
});

describe("AX-7 guardas 409", () => {
  it.each(["APPROVAL_REVISION_CHANGED", "APPROVAL_REQUEST_RETURNED"] as const)(
    "%s: cierra, avisa con el copy, refresca y no reintenta",
    async (code) => {
      const user = userEvent.setup();
      const item = createItem("V-GUARD", { approval: makeApproval() });
      mockList.mockResolvedValue(listResponse([item]));
      mockApprove.mockRejectedValue(new ApiError("guard", 409, code));
      renderInbox();

      await screen.findByRole("checkbox", { name: "Seleccionar V-GUARD" });
      const listCallsBefore = mockList.mock.calls.length;
      await user.click(screen.getByRole("button", { name: "Aprobar" }));
      const dialog = await screen.findByRole("alertdialog");
      await user.click(
        within(dialog).getByRole("button", { name: flowCopy.stepConfirmAction }),
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: approvalsCopy.guardErrors[code],
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
      expect(mockApprove).toHaveBeenCalledWith("trip_expense", item.id, {
        expectedStep: 1,
        expectedRevision: "rev-V-GUARD",
      });
    },
  );
});

describe("AX-8 rechazar desde ⋯", () => {
  it("aviso terminal, motivo de 5 a 500 caracteres y guardas en la llamada", async () => {
    const user = userEvent.setup();
    const item = createItem("V-REJ", { approval: makeApproval() });
    mockList.mockResolvedValue(listResponse([item]));
    mockReject.mockResolvedValue({
      data: { ...item, status: "rejected" },
      outcome: "rejected",
      message: "Gasto rechazado",
    });
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-REJ" });
    const menu = await openRowMenu(user);
    await user.click(within(menu).getByRole("menuitem", { name: flowCopy.menu.reject }));

    const sheet = await screen.findByRole("dialog", { name: rejectCopy.title("trip_expense") });
    expect(within(sheet).getByText(rejectCopy.terminalWarning)).toBeInTheDocument();
    const reason = within(sheet).getByLabelText(rejectCopy.reasonLabel);
    const submit = within(sheet).getByRole("button", { name: rejectCopy.submit });

    await user.type(reason, "Dup");
    expect(submit).toBeDisabled();

    await user.clear(reason);
    await user.click(reason);
    await user.paste("x".repeat(600));
    expect(reason).toHaveValue("x".repeat(500));
    expect(within(sheet).getByText(rejectCopy.counter(500, 500))).toBeInTheDocument();

    await user.clear(reason);
    await user.type(reason, "Gasto duplicado");
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() => {
      expect(mockReject).toHaveBeenCalledWith("trip_expense", item.id, "Gasto duplicado", {
        expectedStep: 1,
        expectedRevision: "rev-V-REJ",
      });
    });
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Gasto rechazado", variant: "success" }),
      );
    });
  });
});

describe("AX-9 tenant sin regla propia (UX5)", () => {
  it("un paso con regla estándar: sin línea de paso, sin «¿Por qué te toca?» ni chips nuevos", async () => {
    const standard = createItem("V-STD", {
      approval: makeApproval({
        stepsTotal: 1,
        nextStep: null,
        routedBy: {
          tierIndex: null,
          minAmount: null,
          matchedConditions: [],
          policyVersion: null,
          lazy: true,
        },
        escalated: true,
        reapproval: {
          invalidatedAt: "2026-10-01T17:00:00.000Z",
          previousInstanceId: "instance-1",
          previousStatus: null,
          changes: [{ field: "amount", from: 8000, to: 12000 }],
        },
      }),
    });
    const legacy = createItem("V-LEGACY", { approval: null });
    mockList.mockResolvedValue(listResponse([standard, legacy]));
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STD" });
    expect(screen.getByRole("checkbox", { name: "Seleccionar V-LEGACY" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Aprobar" })).toHaveLength(2);

    expect(screen.queryByText(/Paso \d+ de \d+/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(flowCopy.whyHint)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.reapprovalChip)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.escalatedChip)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.noActiveChip)).not.toBeInTheDocument();
  });
});

describe("AX-9b regla estándar con autorización anulada (UX5 enmendada · UX8)", () => {
  const standardRoutedBy = {
    tierIndex: null,
    minAmount: null,
    matchedConditions: [],
    policyVersion: null,
    lazy: true,
  };

  function standardReapproval(
    tripCode: string,
    changes: ApprovalFieldChange[],
    previousStatus: "approved" | "in_progress" = "approved",
  ) {
    return createItem(tripCode, {
      amount: 12000,
      approval: makeApproval({
        stepsTotal: 1,
        nextStep: null,
        routedBy: standardRoutedBy,
        escalated: true,
        reapproval: {
          invalidatedAt: "2026-10-02T20:10:00.000Z",
          previousInstanceId: "instance-1",
          previousStatus,
          changes,
        },
      }),
    });
  }

  it("chip «Reautorización» con tooltip; escalada, línea de paso y «¿Por qué te toca?» siguen ocultas", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue(
      listResponse([
        standardReapproval("V-STD-REAP", [{ field: "amount", from: "8000.00", to: "12000.00" }]),
      ]),
    );
    renderInbox();

    const chip = await screen.findByText(flowCopy.reapprovalChip);
    expect(screen.queryByText(/Paso \d+ de \d+/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(flowCopy.whyHint)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.escalatedChip)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.noActiveChip)).not.toBeInTheDocument();

    await user.hover(chip);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Cambió desde la autorización anterior: Monto: $8,000.00 → $12,000.00",
    );
  });

  it("D5: la confirmación de Aprobar dice «Ya estaba autorizado. Cambió: …»", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue(
      listResponse([
        standardReapproval("V-STD-D5", [{ field: "amount", from: "8000.00", to: "12000.00" }]),
      ]),
    );
    renderInbox();

    await screen.findByText(flowCopy.reapprovalChip);
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent(
      "Ya estaba autorizado. Cambió: Monto: $8,000.00 → $12,000.00.",
    );
  });

  it("diff vacío: chip con tooltip sin lista y línea D5 sin cambios", async () => {
    const user = userEvent.setup();
    mockList.mockResolvedValue(listResponse([standardReapproval("V-STD-EMPTY", [])]));
    renderInbox();

    await user.hover(await screen.findByText(flowCopy.reapprovalChip));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      flowCopy.reapprovalTooltipNoChanges,
    );
    await user.unhover(screen.getByText(flowCopy.reapprovalChip));

    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(await screen.findByRole("alertdialog")).toHaveTextContent(
      "Ya estaba autorizado; se corrigió y requiere nueva firma.",
    );
  });

  it("sin autorización anulada (in_progress) no hay chip ni línea D5", async () => {
    const user = userEvent.setup();
    const item = standardReapproval(
      "V-STD-OPEN",
      [{ field: "amount", from: "8000.00", to: "12000.00" }],
      "in_progress",
    );
    mockList.mockResolvedValue(listResponse([item]));
    renderInbox();

    await screen.findByRole("checkbox", { name: "Seleccionar V-STD-OPEN" });
    expect(screen.queryByText(flowCopy.reapprovalChip)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(await screen.findByRole("alertdialog")).not.toHaveTextContent(/Ya estaba autorizado/);
  });
});
