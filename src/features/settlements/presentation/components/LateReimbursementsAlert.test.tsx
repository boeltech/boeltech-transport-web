import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import type { DriverSettlement } from "../../domain/entities";
import type { SettlementStatus } from "../../domain/enums";
import { settlementsCopy } from "../copy/settlementsCopy";
import { shouldShowLateReimbursementsAlert } from "../utils/reimbursementLines";
import { LateReimbursementsAlert } from "./LateReimbursementsAlert";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const copy = settlementsCopy.reimbursements;

const baseSettlement: DriverSettlement = {
  id: "set-1",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-202610-0002",
  settlementKind: "regular",
  employeeId: "emp-1",
  employeeFullName: "Pedro Infante",
  agreementSnapshot: { currency: "MXN" },
  periodStart: "2026-10-01",
  periodEnd: "2026-10-15",
  status: "approved",
  totalTripsCommission: 2500,
  totalBaseSalary: 0,
  totalReimbursableExpenses: 0,
  totalBonuses: 0,
  totalAdvancesDeducted: 0,
  totalOtherDeductions: 0,
  grossAmount: 2500,
  netAmount: 2500,
  currency: "MXN",
  disbursedAt: null,
  disbursedBy: null,
  disbursementMethod: null,
  disbursementReference: null,
  approvedAt: "2026-10-15T10:00:00Z",
  approvedBy: "user-2",
  rejectionReason: null,
  notes: null,
  lateReimbursements: {
    count: 1,
    amount: 1250,
    tripExpenseIds: ["exp-1"],
    tripIds: ["trip-1"],
    reference: "approved",
    items: [
      {
        tripExpenseId: "exp-1",
        tripId: "trip-1",
        tripCode: "VJ-0042",
        description: "Caseta Arco Norte",
        amount: 1250,
        approvedAt: "2026-10-16T10:00:00Z",
      },
    ],
  },
  createdAt: "2026-10-15T09:00:00Z",
  updatedAt: "2026-10-15T10:00:00Z",
};

function withStatus(status: SettlementStatus): DriverSettlement {
  return { ...baseSettlement, status };
}

function renderAlert(settlement: DriverSettlement, canCreate = true) {
  return render(
    <MemoryRouter>
      <LateReimbursementsAlert settlement={settlement} canCreate={canCreate} />
    </MemoryRouter>,
  );
}

describe("LateReimbursementsAlert", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  it("autorizado: DetailAlertCard con CTA en action y frase del siguiente pago", () => {
    renderAlert(baseSettlement);
    const alert = screen.getByTestId("late-reimbursements-alert");
    expect(within(alert).getByText(copy.lateAlert.title)).toBeInTheDocument();
    expect(
      within(alert).getByText(copy.lateAlert.approvedBody(formatMxCurrency(1250))),
    ).toBeInTheDocument();
    expect(
      within(alert).getByText(/Si no armas un pago aparte, se sumarán al siguiente pago del operador\./),
    ).toBeInTheDocument();
    expect(within(alert).getByRole("button", { name: copy.createAction })).toBeInTheDocument();
    expect(
      within(alert).getByRole("button", { name: copy.lateAlert.viewExpenses }),
    ).toBeInTheDocument();
    expect(within(alert).queryByText(/Cancelar/)).not.toBeInTheDocument();
  });

  it.each<SettlementStatus>(["draft", "pending_approval"])(
    "%s: usa la variante de pago armado",
    (status) => {
      renderAlert(withStatus(status));
      expect(
        screen.getByText(copy.lateAlert.draftBody(formatMxCurrency(1250))),
      ).toBeInTheDocument();
    },
  );

  it.each<SettlementStatus>(["disbursed", "cancelled", "rejected"])(
    "%s: no muestra el aviso",
    (status) => {
      renderAlert(withStatus(status));
      expect(screen.queryByTestId("late-reimbursements-alert")).not.toBeInTheDocument();
    },
  );

  it("no muestra el aviso sin tardíos", () => {
    expect(shouldShowLateReimbursementsAlert({ ...baseSettlement, lateReimbursements: null })).toBe(false);
    expect(
      shouldShowLateReimbursementsAlert({
        ...baseSettlement,
        lateReimbursements: { ...baseSettlement.lateReimbursements!, count: 0 },
      }),
    ).toBe(false);
    renderAlert({ ...baseSettlement, lateReimbursements: null });
    expect(screen.queryByTestId("late-reimbursements-alert")).not.toBeInTheDocument();
  });

  it("con permiso de crear lleva al alta de pago de reembolsos con el origen", async () => {
    const user = userEvent.setup();
    renderAlert(baseSettlement);
    await user.click(screen.getByRole("button", { name: copy.createAction }));
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    const target = String(mockNavigate.mock.calls[0][0]);
    expect(target).toContain("kind=reimbursements");
    expect(target).toContain("employeeId=emp-1");
    expect(target).toContain("from=set-1");
  });

  it("sin permiso de crear oculta el botón para armar el pago", () => {
    renderAlert(baseSettlement, false);
    expect(screen.queryByRole("button", { name: copy.createAction })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: copy.lateAlert.viewExpenses })).toBeInTheDocument();
  });

  it("Ver gastos abre el panel con los gastos tardíos", async () => {
    const user = userEvent.setup();
    renderAlert(baseSettlement);
    await user.click(screen.getByRole("button", { name: copy.lateAlert.viewExpenses }));
    const sheet = await screen.findByTestId("late-reimbursements-sheet");
    expect(within(sheet).getByText(copy.lateSheet.title)).toBeInTheDocument();
    expect(within(sheet).getByText("VJ-0042")).toBeInTheDocument();
    expect(within(sheet).getByText(/Caseta Arco Norte/)).toBeInTheDocument();
    expect(within(sheet).getByRole("button", { name: copy.createAction })).toBeInTheDocument();
  });

  it("Ver gastos sin renglones muestra el mensaje de vacío", async () => {
    const user = userEvent.setup();
    renderAlert({
      ...baseSettlement,
      lateReimbursements: { ...baseSettlement.lateReimbursements!, items: [] },
    });
    await user.click(screen.getByRole("button", { name: copy.lateAlert.viewExpenses }));
    const sheet = await screen.findByTestId("late-reimbursements-sheet");
    expect(within(sheet).getByText(copy.lateSheet.empty)).toBeInTheDocument();
    expect(within(sheet).queryByRole("button", { name: copy.createAction })).not.toBeInTheDocument();
  });
});
