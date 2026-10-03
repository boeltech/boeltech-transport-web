import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ApprovalBlock } from "@features/approvals";
import type { DriverSettlement } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementCorrectionSheet } from "./SettlementCorrectionSheet";

Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => undefined;
Element.prototype.releasePointerCapture ??= () => undefined;

const mockToast = vi.fn();
const mockUpdateSettlement = vi.fn();
const mockSubmitSettlement = vi.fn();
const mockPreviewSettlement = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../infrastructure/settlementsApi", () => ({
  settlementsApi: {
    updateSettlement: (...args: unknown[]) => mockUpdateSettlement(...args),
    submitSettlement: (...args: unknown[]) => mockSubmitSettlement(...args),
    previewSettlement: (...args: unknown[]) => mockPreviewSettlement(...args),
  },
}));

vi.mock("@features/approvals", async () => ({
  ...(await import("@features/approvals/testing/selfApprovalTestModule")),
  invalidateApprovalsRelatedQueries: vi.fn(),
}));

const flowCopy = settlementsCopy.settlementFlow;

const baseSettlement: DriverSettlement = {
  id: "set-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202610-0001",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { hasFixedSalary: false, currency: "MXN" },
  periodStart: "2026-10-01",
  periodEnd: "2026-10-15",
  status: "approved",
  totalTripsCommission: 1000,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 0,
  grossAmount: 1000,
  netAmount: 1000,
  tripsCount: 1,
  currency: "MXN",
  disbursedAt: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: "2026-10-16T10:00:00Z",
  approvedBy: "user-ana",
  approvedByName: "Ana López",
  rejectionReason: null,
  notes: null,
  createdAt: "2026-10-16T09:00:00Z",
  updatedAt: "2026-10-16T10:00:00Z",
  items: [
    {
      id: "item-1",
      settlementId: "set-1",
      itemType: "trip_commission",
      tripId: "trip-1",
      tripCode: "TRP-101",
      tripExpenseId: null,
      advanceId: null,
      description: "Comisión por viaje",
      quantity: 1,
      unitRate: 1000,
      amount: 1000,
      isDeduction: false,
      createdAt: "2026-10-16T09:00:00Z",
    },
  ],
};

const returnedApproval: ApprovalBlock = {
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
    returnedBy: "user-ana",
    returnedByName: "Ana",
    returnedAt: "2026-10-16T11:00:00Z",
  },
};

function renderSheet(settlement: DriverSettlement, onSaved = vi.fn(), onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SettlementCorrectionSheet
        open
        onOpenChange={onOpenChange}
        settlement={settlement}
        onSaved={onSaved}
      />
    </QueryClientProvider>,
  );
  return { onSaved, onOpenChange };
}

function amountInput(index = 0): HTMLInputElement {
  const input = document.getElementById(`settlement-correction-item-${index}-amount`);
  if (!input) throw new Error("amount input not found");
  return input as HTMLInputElement;
}

async function addPenalty(user: ReturnType<typeof userEvent.setup>, amount: string) {
  await user.click(screen.getByRole("button", { name: flowCopy.manualItems.add }));
  const typeTrigger = document.getElementById("settlement-correction-item-0-type");
  if (!typeTrigger) throw new Error("type trigger not found");
  await user.click(typeTrigger);
  await user.click(
    await screen.findByRole("option", { name: flowCopy.manualItems.types.penalty_deduction }),
  );
  await user.type(
    document.getElementById("settlement-correction-item-0-description") as HTMLElement,
    "Retraso en entrega",
  );
  await user.type(amountInput(), amount);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdateSettlement.mockImplementation((_id: string, payload: { expectedStatus: string }) =>
    Promise.resolve({
      settlement: baseSettlement,
      approvalEffect:
        payload.expectedStatus === "approved"
          ? "reapproval_required"
          : payload.expectedStatus === "pending_approval"
            ? "flow_restarted"
            : "none",
      changes: [],
    }),
  );
  mockSubmitSettlement.mockResolvedValue({ ...baseSettlement, status: "pending_approval" });
  mockPreviewSettlement.mockResolvedValue({
    openAdvances: [
      {
        advanceId: "adv-9",
        folio: "ANT-202610-0009",
        amount: 500,
        balanceRemaining: 500,
        availableBalance: 500,
      },
    ],
  });
});

describe("SettlementCorrectionSheet", () => {
  it("autorizada: solo partidas manuales y notas; anticipos bloqueados y aviso de reautorización", () => {
    renderSheet(baseSettlement);

    expect(screen.getByText(flowCopy.sheet.title("LIQ-202610-0001"))).toBeInTheDocument();
    expect(screen.getByTestId("settlement-advances-locked")).toHaveTextContent(
      flowCopy.sheet.advancesLockedHint,
    );
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("settlement-correction-consequence")).toHaveTextContent(
      flowCopy.sheet.consequence.approved,
    );
    expect(screen.getByRole("button", { name: flowCopy.sheet.saveCorrection })).toBeInTheDocument();
    expect(mockPreviewSettlement).not.toHaveBeenCalled();
  });

  it("criterios 2 y 3: una penalización de $300 baja el neto en vivo; al guardar confirma y vuelve a autorización", async () => {
    const user = userEvent.setup();
    const { onSaved } = renderSheet(baseSettlement);

    await addPenalty(user, "300");

    expect(screen.getByTestId("settlement-correction-totals")).toHaveTextContent(
      "Neto $1,000.00 → $700.00",
    );
    expect(screen.getByTestId("settlement-correction-item-0-sign")).toHaveTextContent("300");

    await user.click(screen.getByRole("button", { name: flowCopy.sheet.saveCorrection }));

    expect(await screen.findByText(flowCopy.confirm.title)).toBeInTheDocument();
    expect(screen.getByText("Neto: $1,000.00 → $700.00")).toBeInTheDocument();
    expect(mockUpdateSettlement).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: flowCopy.confirm.confirm }));

    await waitFor(() => expect(mockUpdateSettlement).toHaveBeenCalledTimes(1));
    const [id, payload] = mockUpdateSettlement.mock.calls[0] as [string, Record<string, unknown>];
    expect(id).toBe("set-1");
    expect(payload.expectedStatus).toBe("approved");
    expect(payload.customItems).toEqual([
      expect.objectContaining({
        itemType: "penalty_deduction",
        description: "Retraso en entrega",
        amount: 300,
      }),
    ]);
    expect(payload).not.toHaveProperty("advancesToApply");
    expect(payload).not.toHaveProperty("notes");
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: flowCopy.toasts.reapprovalRequired }),
      ),
    );
    expect(onSaved).toHaveBeenCalled();
    expect(mockSubmitSettlement).not.toHaveBeenCalled();
  });

  it("borrador: permite elegir anticipos y guarda sin confirmación", async () => {
    const user = userEvent.setup();
    renderSheet({ ...baseSettlement, status: "draft", approvedAt: null, approvedBy: null });

    const checkbox = await screen.findByRole("checkbox", { name: "ANT-202610-0009" });
    await user.click(checkbox);

    expect(screen.getByTestId("settlement-correction-totals")).toHaveTextContent(
      "Neto $1,000.00 → $500.00",
    );
    expect(screen.getByTestId("settlement-correction-consequence")).toHaveTextContent(
      flowCopy.sheet.consequence.draft,
    );

    await user.click(screen.getByRole("button", { name: flowCopy.sheet.save }));

    await waitFor(() => expect(mockUpdateSettlement).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(flowCopy.confirm.title)).not.toBeInTheDocument();
    const [, payload] = mockUpdateSettlement.mock.calls[0] as [string, Record<string, unknown>];
    expect(payload).toEqual({
      expectedStatus: "draft",
      advancesToApply: [{ advanceId: "adv-9", amountToDeduct: 500 }],
    });
  });

  it("criterio 1: devuelta muestra el motivo y «Guardar y reenviar» corrige y reenvía en un paso", async () => {
    const user = userEvent.setup();
    renderSheet({
      ...baseSettlement,
      status: "draft",
      advancesReserved: true,
      approval: returnedApproval,
    });

    expect(screen.getByText(/Falta el bono de puntualidad/)).toBeInTheDocument();

    await user.type(screen.getByLabelText(flowCopy.sheet.notesTitle), "Bono agregado");
    await user.click(screen.getByRole("button", { name: flowCopy.sheet.saveAndResubmit }));

    await waitFor(() => expect(mockSubmitSettlement).toHaveBeenCalledWith("set-1"));
    expect(mockUpdateSettlement).toHaveBeenCalledWith("set-1", {
      expectedStatus: "draft",
      notes: "Bono agregado",
    });
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: flowCopy.toasts.resubmitted }),
    );
  });

  it("si cambió de estado mientras se editaba, avisa y no reintenta", async () => {
    const user = userEvent.setup();
    mockUpdateSettlement.mockRejectedValueOnce(
      Object.assign(new Error("stale"), { code: "SETTLEMENT_NOT_MUTABLE" }),
    );
    const { onOpenChange } = renderSheet({
      ...baseSettlement,
      status: "draft",
      advancesReserved: true,
    });

    await user.type(screen.getByLabelText(flowCopy.sheet.notesTitle), "Nota");
    await user.click(screen.getByRole("button", { name: flowCopy.sheet.save }));

    expect(await screen.findByText(flowCopy.staleAlert.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: flowCopy.sheet.save })).toBeDisabled();
    expect(mockUpdateSettlement).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: new RegExp(flowCopy.staleAlert.action, "i") }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
