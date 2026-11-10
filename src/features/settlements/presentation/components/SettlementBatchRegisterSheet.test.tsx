import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriverSettlement } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import {
  resolveBatchRegisterActorAlertKind,
  SettlementBatchRegisterSheet,
} from "./SettlementBatchRegisterSheet";

const mockMutateAsync = vi.fn();
const mockToast = vi.fn();

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock("../../application/hooks", () => ({
  useBatchDisburseSettlements: () => ({
    mutateAsync: mockMutateAsync,
    isPending: false,
  }),
}));

const copy = settlementsCopy.workbench.batchRegister;

function makeSettlement(
  overrides: Partial<DriverSettlement> & Pick<DriverSettlement, "id" | "employeeId">,
): DriverSettlement {
  return {
    tenantId: "t1",
    settlementNumber: `PAG-${overrides.id}`,
    settlementKind: "regular",
    employeeFullName: overrides.employeeFullName ?? "Operador",
    agreementSnapshot: {} as DriverSettlement["agreementSnapshot"],
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    status: "approved",
    totalTripsCommission: 0,
    totalBaseSalary: 0,
    totalReimbursableExpenses: 0,
    totalBonuses: 0,
    totalAdvancesDeducted: 0,
    totalOtherDeductions: 0,
    grossAmount: 10000,
    netAmount: overrides.netAmount ?? 10000,
    currency: "MXN",
    disbursedAt: null,
    disbursedBy: null,
    disbursementMethod: null,
    disbursementReference: null,
    approvedAt: "2026-11-09T10:00:00.000Z",
    approvedBy: "user-approver",
    approvedByName: "Mario López",
    rejectionReason: null,
    notes: null,
    createdAt: "2026-11-08T00:00:00.000Z",
    updatedAt: "2026-11-09T10:00:00.000Z",
    createdBy: "user-maker",
    createdByName: "Rosa Alcántara",
    submittedBy: "user-maker",
    submittedByName: "Rosa Alcántara",
    approvalRevision: "rev-1",
    ...overrides,
  };
}

function renderSheet(
  settlements: DriverSettlement[],
  hasClabeByEmployeeId: Map<string, boolean>,
  currentUserId?: string | null,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <SettlementBatchRegisterSheet
          open
          onOpenChange={vi.fn()}
          settlements={settlements}
          hasClabeByEmployeeId={hasClabeByEmployeeId}
          currentUserId={currentUserId}
          onSuccess={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("SettlementBatchRegisterSheet F7", () => {
  beforeEach(() => {
    mockMutateAsync.mockReset();
    mockToast.mockReset();
    mockMutateAsync.mockResolvedValue({ processed: [{ settlementId: "a" }], omitted: [] });
  });

  it("muestra SPEI vs efectivo y oculta Banamex; envía lote sin disbursementMethod", async () => {
    const user = userEvent.setup();
    const spei = makeSettlement({
      id: "a",
      employeeId: "e1",
      employeeFullName: "Juan Pérez",
      netAmount: 86000,
    });
    const cash = makeSettlement({
      id: "b",
      employeeId: "e2",
      employeeFullName: "Héctor Vázquez",
      netAmount: 10400,
      approvalRevision: "rev-2",
    });
    const clabe = new Map([
      ["e1", true],
      ["e2", false],
    ]);

    renderSheet([spei, cash], clabe);

    expect(screen.getByTestId("settlement-batch-register-sheet")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: copy.title(2) }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("batch-register-spei")).toHaveTextContent("SPEI");
    expect(screen.getByTestId("batch-register-cash")).toHaveTextContent("efectivo");
    expect(screen.getByTestId("batch-register-cash")).toHaveTextContent("Héctor Vázquez");
    expect(screen.queryByText(/BancaNet|Banamex|dispersión/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("batch-register-actor-alert")).toHaveTextContent(
      "Rosa Alcántara",
    );
    expect(screen.getByTestId("batch-register-actor-alert")).toHaveTextContent(
      "Tú no hiciste ninguno de esos pasos",
    );

    await user.type(screen.getByLabelText(copy.referenceLabel), "Semana 45");
    await user.click(screen.getByTestId("batch-register-submit"));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });

    const payload = mockMutateAsync.mock.calls[0]?.[0] as {
      settlementIds: string[];
      disbursementReference: string;
      disbursementMethod?: string;
      disbursedAt: string;
      expectedRevisions: Record<string, string>;
      generateDispersionFile?: boolean;
    };
    expect(payload.settlementIds).toEqual(["a", "b"]);
    expect(payload.disbursementReference).toBe("Semana 45");
    expect(payload.disbursementMethod).toBeUndefined();
    expect(payload.generateDispersionFile).toBeUndefined();
    expect(payload.expectedRevisions).toEqual({ a: "rev-1", b: "rev-2" });
    expect(payload.disbursedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("C23: si la sesión armó/autorizó, muestra un solo responsable (no miente)", () => {
    const own = makeSettlement({
      id: "a",
      employeeId: "e1",
      createdBy: "user-session",
      submittedBy: "user-session",
      approvedBy: "user-session",
      approvedByName: "Yo Mismo",
      createdByName: "Yo Mismo",
      submittedByName: "Yo Mismo",
    });
    renderSheet([own], new Map([["e1", true]]), "user-session");
    expect(screen.getByTestId("batch-register-actor-alert")).toHaveTextContent(
      copy.soleResponsibleAlertTitle,
    );
    expect(
      screen.queryByText(/Tú no hiciste ninguno de esos pasos/),
    ).not.toBeInTheDocument();
  });

  it("resolveBatchRegisterActorAlertKind distingue A/B/C", () => {
    const s = makeSettlement({
      id: "a",
      employeeId: "e1",
      createdBy: "maker",
      approvedBy: "approver",
    });
    expect(
      resolveBatchRegisterActorAlertKind({
        settlements: [s],
        userId: "other",
        armers: "Rosa",
        approvers: "Mario",
      }),
    ).toBe("separation_ok");
    expect(
      resolveBatchRegisterActorAlertKind({
        settlements: [s],
        userId: "maker",
        armers: "Rosa",
        approvers: "Mario",
      }),
    ).toBe("sole_responsible");
    expect(
      resolveBatchRegisterActorAlertKind({
        settlements: [s],
        userId: "other",
        armers: "",
        approvers: "Mario",
      }),
    ).toBe("none");
  });
});
