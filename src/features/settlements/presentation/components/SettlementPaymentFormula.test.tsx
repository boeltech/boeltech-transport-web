import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SettlementPaymentFormula } from "./SettlementPaymentFormula";
import type { DriverSettlement } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";

const copy = settlementsCopy.detailPage.formula;

function baseSettlement(
  overrides: Partial<DriverSettlement> = {},
): DriverSettlement {
  return {
    id: "s1",
    tenantId: "t1",
    settlementNumber: "PAG-1",
    settlementKind: "regular",
    employeeId: "e1",
    employeeFullName: "Juan Pérez",
    agreementSnapshot: { currency: "MXN" },
    periodStart: "2026-11-02",
    periodEnd: "2026-11-08",
    status: "approved",
    totalTripsCommission: 12_060,
    totalBaseSalary: 2500,
    totalReimbursableExpenses: 860,
    totalBonuses: 0,
    totalAdvancesDeducted: 3000,
    totalOtherDeductions: 350,
    grossAmount: 16_620,
    netAmount: 13_270,
    currency: "MXN",
    disbursedAt: null,
    disbursedBy: null,
    disbursementMethod: null,
    disbursementReference: null,
    approvedAt: null,
    approvedBy: null,
    rejectionReason: null,
    notes: null,
    items: [
      {
        id: "i1",
        settlementId: "s1",
        itemType: "trip_commission",
        tripId: "t1",
        tripCode: "TLX-1",
        tripExpenseId: null,
        advanceId: null,
        description: "Viaje",
        quantity: 1,
        unitRate: 6500,
        amount: 6500,
        isDeduction: false,
        calculationDetails: { appliedRule: "Ruta con tarifa fija" },
        createdAt: "2026-11-01T00:00:00.000Z",
      },
      {
        id: "i2",
        settlementId: "s1",
        itemType: "bonus",
        tripId: null,
        tripExpenseId: null,
        advanceId: null,
        description: "Comidas",
        quantity: 1,
        unitRate: 1200,
        amount: 1200,
        isDeduction: false,
        calculationDetails: { source: "fixed_allowance" },
        createdAt: "2026-11-01T00:00:00.000Z",
      },
    ],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("SettlementPaymentFormula", () => {
  it("renders 5 formula terms above the fold (CA F4.7)", () => {
    renderWithTheme(
      <SettlementPaymentFormula settlement={baseSettlement()} />,
    );
    expect(screen.getByTestId("settlement-payment-formula")).toBeInTheDocument();
    expect(screen.getByText(copy.trips)).toBeInTheDocument();
    expect(screen.getByText(copy.salaryAndFixed)).toBeInTheDocument();
    expect(screen.getByText(copy.reimbursements)).toBeInTheDocument();
    expect(screen.getByText(copy.deductions)).toBeInTheDocument();
    expect(screen.getByText(copy.netToPay)).toBeInTheDocument();
  });
});
