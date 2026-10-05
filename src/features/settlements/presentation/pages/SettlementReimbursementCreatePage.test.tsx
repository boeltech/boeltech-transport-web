import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ApiError } from "@shared/api/interceptors/error-handler";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { SettlementPreview } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementReimbursementCreatePage } from "./SettlementReimbursementCreatePage";

const mockMutateAsync = vi.fn();
const mockRefetch = vi.fn();
const mockToast = vi.fn();
const mockPreviewHook = vi.fn();

vi.mock("../../application/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../application/hooks")>();
  return {
    ...actual,
    useReimbursementSettlementPreview: (employeeId: string | null) => mockPreviewHook(employeeId),
    useCreateReimbursementSettlement: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
    useSettlementDetail: (id: string) => ({
      data: id ? { id, settlementNumber: "LIQ-202610-0001" } : undefined,
    }),
    useSettlementSettings: () => ({
      data: { voboThresholdMxn: 0, activeApproverCount: 2, activeExecutorCount: 2 },
      isError: false,
    }),
  };
});

vi.mock("@features/employees", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/employees")>();
  return {
    ...actual,
    useEmployeeBasic: () => ({ data: { firstName: "Pedro", lastName: "Infante" } }),
  };
});

vi.mock("@features/approvals", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@features/approvals")>();
  return { ...actual, useSelfApprovalPolicy: () => ({ data: undefined }) };
});

vi.mock("@shared/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@shared/hooks")>();
  return { ...actual, useToast: () => ({ toast: mockToast }) };
});

const pageCopy = settlementsCopy.reimbursements.createPage;
const errorsCopy = settlementsCopy.reimbursements.errors;
const saveDraftBtn = settlementsCopy.createPage.summary.saveDraftBtn;

const readyLine = {
  tripExpenseId: "exp-ready",
  tripId: "trip-1",
  tripCode: "VJ-0001",
  category: "tolls",
  description: "Caseta",
  amount: 400,
  receiptNumber: null,
  approvedAt: "2026-10-02T10:00:00Z",
  isLate: true,
  tripSettledIn: { settlementId: "stl-prev", settlementNumber: "LIQ-202609-0004" },
};

const payeeLine = {
  tripExpenseId: "exp-payee",
  tripId: "trip-2",
  tripCode: "VJ-0002",
  category: "fuel",
  description: "Diésel",
  amount: 250,
  approvedAt: "2026-10-03T10:00:00Z",
  reason: "driver_reassigned" as const,
  tripSettledIn: null,
};

function makePreview(overrides: Partial<SettlementPreview> = {}): SettlementPreview {
  return {
    employeeId: "emp-1",
    settlementKind: "reimbursement_only",
    employeeName: "Pedro Infante",
    periodStart: "2026-10-05",
    periodEnd: "2026-10-05",
    agreement: { currency: "MXN" },
    eligibleTrips: [],
    openAdvances: [],
    reimbursements: [readyLine],
    reimbursementsRequiringPayee: [payeeLine],
    ...overrides,
  } as unknown as SettlementPreview;
}

function mockPreview(preview: SettlementPreview | undefined, state: Partial<{ isLoading: boolean; isError: boolean }> = {}) {
  mockPreviewHook.mockReturnValue({
    data: preview,
    isLoading: state.isLoading ?? false,
    isError: state.isError ?? false,
    error: null,
    refetch: mockRefetch,
  });
}

function renderPage(url = "/finance/settlements/new?kind=reimbursements&employeeId=emp-1") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/finance/settlements/new" element={<SettlementReimbursementCreatePage />} />
        <Route path="/finance/settlements/:id" element={<div data-testid="detail-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

const payeeCheckbox = () =>
  screen.getByRole("checkbox", {
    name: settlementsCopy.reimbursements.payeeSection.checkboxLabel(
      "Pedro Infante",
      formatMxCurrency(250),
      "VJ-0002",
    ),
  });

describe("SettlementReimbursementCreatePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPreview(makePreview());
    mockMutateAsync.mockResolvedValue({ id: "stl-new", status: "draft" });
  });

  it("muestra operador, reembolsos listos y por definir; sin período ni viajes", () => {
    renderPage();

    expect(screen.getByText(pageCopy.title)).toBeInTheDocument();
    expect(screen.getByTestId("reimbursement-operator")).toHaveTextContent("Pedro Infante");
    const ready = screen.getByTestId("reimbursements-ready-card");
    expect(within(ready).getByText(pageCopy.readyTitle(1))).toBeInTheDocument();
    expect(within(ready).getByText("VJ-0001")).toBeInTheDocument();
    expect(within(ready).getByText("Viaje VJ-0001 · comisión en LIQ-202609-0004")).toBeInTheDocument();
    expect(screen.getByTestId("reimbursements-payee-card")).toBeInTheDocument();
    expect(payeeCheckbox()).not.toBeChecked();
    expect(screen.queryByText(/Período/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Viajes elegibles/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("reimbursement-net-amount")).toHaveTextContent(formatMxCurrency(400));
  });

  it("marcar un gasto por definir lo suma al neto y lo envía como confirmado", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(payeeCheckbox());
    expect(screen.getByTestId("reimbursement-net-amount")).toHaveTextContent(formatMxCurrency(650));

    await user.click(screen.getByRole("button", { name: saveDraftBtn }));
    await waitFor(() => expect(mockMutateAsync).toHaveBeenCalledTimes(1));
    expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
      employeeId: "emp-1",
      confirmedReimbursementExpenseIds: ["exp-payee"],
      advancesToApply: [],
      submitForApproval: false,
    });
    expect(await screen.findByTestId("detail-page")).toBeInTheDocument();
  });

  it("sin reembolsos listos ni marcados no envía y pide marcar al menos uno", async () => {
    const user = userEvent.setup();
    mockPreview(makePreview({ reimbursements: [] }));
    renderPage();

    expect(screen.getByText(pageCopy.readyEmpty)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: saveDraftBtn }));

    expect(screen.getAllByText(pageCopy.requiresExpensesError).length).toBeGreaterThanOrEqual(1);
    expect(mockMutateAsync).not.toHaveBeenCalled();

    await user.click(payeeCheckbox());
    expect(screen.queryByText(pageCopy.requiresExpensesError)).not.toBeInTheDocument();
  });

  it("422 REIMBURSEMENT_PAYEE_NOT_TRIP_DRIVER: alerta, error en el renglón, desmarca y recalcula", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError("No manejó", 422, "REIMBURSEMENT_PAYEE_NOT_TRIP_DRIVER", {
        trip_expense_id: "exp-payee",
      }),
    );
    renderPage();

    await user.click(payeeCheckbox());
    await user.click(screen.getByRole("button", { name: saveDraftBtn }));

    const alert = await screen.findByTestId("reimbursement-error-alert");
    expect(within(alert).getByText(errorsCopy.payeeNotDriverTitle("VJ-0002"))).toBeInTheDocument();
    expect(screen.getByText(errorsCopy.payeeNotDriverRow)).toBeInTheDocument();
    expect(payeeCheckbox()).not.toBeChecked();
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("422 REIMBURSEMENT_NOT_ELIGIBLE: alerta con el viaje y recalcula", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError("No elegible", 422, "REIMBURSEMENT_NOT_ELIGIBLE", { trip_expense_id: "exp-ready" }),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: saveDraftBtn }));

    const alert = await screen.findByTestId("reimbursement-error-alert");
    expect(within(alert).getByText(errorsCopy.notEligibleTitle)).toBeInTheDocument();
    expect(within(alert).getByText(errorsCopy.notEligibleBody("VJ-0001"))).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("422 REIMBURSEMENT_ONLY_REQUIRES_EXPENSES: alerta y recalcula", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError("Sin gastos", 422, "REIMBURSEMENT_ONLY_REQUIRES_EXPENSES", {}),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: saveDraftBtn }));

    const alert = await screen.findByTestId("reimbursement-error-alert");
    expect(within(alert).getByText(errorsCopy.requiresExpensesTitle)).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("409 EXPENSE_IN_ACTIVE_SETTLEMENT: lista el folio que tomó el gasto", async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockRejectedValueOnce(
      new ApiError("En otro pago", 409, "EXPENSE_IN_ACTIVE_SETTLEMENT", {
        conflicts: [
          {
            trip_expense_id: "exp-ready",
            trip_code: "VJ-0001",
            settlement_id: "stl-other",
            settlement_number: "LIQ-202610-0007",
            status: "draft",
          },
        ],
      }),
    );
    renderPage();

    await user.click(screen.getByRole("button", { name: saveDraftBtn }));

    const alert = await screen.findByTestId("reimbursement-error-alert");
    expect(within(alert).getByText(errorsCopy.inActiveSettlementTitle)).toBeInTheDocument();
    expect(within(alert).getByRole("link", { name: "LIQ-202610-0007" })).toBeInTheDocument();
    expect(within(alert).getByText(errorsCopy.inActiveSettlementHint)).toBeInTheDocument();
    expect(mockRefetch).toHaveBeenCalled();
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("sin operador en la URL pide elegirlo desde Por pagar", () => {
    renderPage("/finance/settlements/new?kind=reimbursements");
    expect(screen.getByText(pageCopy.noEmployeeTitle)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: pageCopy.noEmployeeAction })).toBeInTheDocument();
  });

  it("operador sin reembolsos pendientes muestra el vacío", () => {
    mockPreview(makePreview({ reimbursements: [], reimbursementsRequiringPayee: [] }));
    renderPage();
    expect(screen.getByText(pageCopy.emptyTitle)).toBeInTheDocument();
  });

  it("al venir de un pago, el regreso apunta a su folio", () => {
    renderPage("/finance/settlements/new?kind=reimbursements&employeeId=emp-1&from=stl-prev");
    expect(screen.getByLabelText(pageCopy.backToFolio("LIQ-202610-0001"))).toBeInTheDocument();
  });
});
