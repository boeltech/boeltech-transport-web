import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettlementReceiptPrintView } from "./SettlementReceiptPrintView";
import type { DriverSettlement } from "../../domain/entities";

const mockSettlement: DriverSettlement = {
  id: "settlement-uuid-1234",
  tenantId: "tenant-1",
  settlementNumber: "LIQ-2026-0088",
  employeeId: "emp-uuid-5678-abcd",
  employeeFullName: "Juan Pérez Morales",
  agreementSnapshot: {
    hasFixedSalary: true,
    fixedSalaryAmount: 5000,
    currency: "MXN",
  },
  periodStart: "2026-08-01",
  periodEnd: "2026-08-15",
  status: "approved",
  totalTripsCommission: 3500,
  totalBaseSalary: 5000,
  totalReimbursableExpenses: 650,
  totalBonuses: 0,
  totalAdvancesDeducted: 1500,
  totalOtherDeductions: 0,
  grossAmount: 9150,
  netAmount: 7650,
  tripsCount: 2,
  currency: "MXN",
  disbursedAt: "2026-08-16T10:00:00Z",
  disbursedBy: "user-admin",
  disbursedByName: "Lic. Roberto Garza",
  disbursementMethod: "bank_transfer",
  disbursementReference: "SPEI-889911",
  approvedAt: "2026-08-15T18:00:00Z",
  approvedBy: "user-approver",
  approvedByName: "Lic. Roberto Garza",
  rejectionReason: null,
  notes: "Ajuste de casetas incluido con ticket autorizado.",
  createdAt: "2026-08-15T12:00:00Z",
  updatedAt: "2026-08-16T10:00:00Z",
  items: [
    {
      id: "item-1",
      settlementId: "settlement-uuid-1234",
      itemType: "base_salary",
      tripId: null,
      tripExpenseId: null,
      advanceId: null,
      description: "Sueldo base quincenal",
      quantity: 1,
      unitRate: 5000,
      amount: 5000,
      isDeduction: false,
      createdAt: "2026-08-15T12:00:00Z",
    },
    {
      id: "item-2",
      settlementId: "settlement-uuid-1234",
      itemType: "trip_commission",
      tripId: "trip-1",
      tripCode: "TRP-101",
      tripExpenseId: null,
      advanceId: null,
      description: "Comisión por viaje (CDMX -> MTY)",
      quantity: 1,
      unitRate: 3500,
      amount: 3500,
      isDeduction: false,
      createdAt: "2026-08-15T12:00:00Z",
    },
    {
      id: "item-3",
      settlementId: "settlement-uuid-1234",
      itemType: "advance_deduction",
      tripId: null,
      tripExpenseId: null,
      advanceId: "adv-1",
      description: "Anticipo de combustible ANT-0042",
      quantity: 1,
      unitRate: 1500,
      amount: 1500,
      isDeduction: true,
      calculationDetails: {
        advanceFolio: "ANT-0042",
      },
      createdAt: "2026-08-15T12:00:00Z",
    },
  ],
};

describe("SettlementReceiptPrintView", () => {
  it("renders the document header, company info and folio without technical UUIDs", () => {
    render(
      <SettlementReceiptPrintView
        settlement={mockSettlement}
        companyName="Transportes Tlama"
        rfc="TTL200101XYZ"
      />,
    );

    expect(screen.getByText(/Transportes Tlama/i)).toBeInTheDocument();
    expect(screen.getByText(/RFC:\s*TTL200101XYZ/i)).toBeInTheDocument();
    expect(screen.getByText(/FOLIO:\s*LIQ-2026-0088/i)).toBeInTheDocument();
    expect(screen.getByText("Liquidación de Viajes y Pago a Operador")).toBeInTheDocument();

    // D1: No raw UUID slices
    expect(screen.queryByText(/emp-uuid/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/settlement-uuid/i)).not.toBeInTheDocument();
  });

  it("renders operator info, period, and payment details", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getAllByText("Juan Pérez Morales").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Transferencia bancaria \(SPEI\)/i)).toBeInTheDocument();
    expect(screen.getByText(/SPEI-889911/i)).toBeInTheDocument();
  });

  it("renders earnings and deductions items with human-friendly descriptions", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    // Earnings
    expect(screen.getByText(/1\. Ingresos del Período/i)).toBeInTheDocument();
    expect(screen.getByText("TRP-101")).toBeInTheDocument();

    // Deductions
    expect(screen.getByText(/2\. Descuentos y Anticipos de Viaje/i)).toBeInTheDocument();
    expect(screen.getAllByText("ANT-0042").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 3-block horizontal balance summary with correct totals", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getByText(/\(\+\) Total Ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/\(?[−-]\)? Total Descuentos/i)).toBeInTheDocument();
    expect(screen.getByText(/NETO A PAGAR AL OPERADOR/i)).toBeInTheDocument();
  });

  it("renders signatures section with operator and approver details", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getByText("Firma de Conformidad del Operador")).toBeInTheDocument();
    expect(
      screen.getByText(/Recibí a mi entera satisfacción la cantidad neta indicada/i),
    ).toBeInTheDocument();
    expect(screen.getByText("Lic. Roberto Garza")).toBeInTheDocument();
    expect(screen.getByText("Revisado y Autorizado / Empresa")).toBeInTheDocument();
    expect(screen.getByText("Recibo de pago")).toBeInTheDocument();
  });

  it("muestra PENDIENTE DE PAGO cuando está Autorizado sin dispersión", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          status: "approved",
          disbursedAt: null,
          disbursedBy: null,
          disbursementMethod: null,
          disbursementReference: null,
        }}
      />,
    );

    expect(screen.getByText("PENDIENTE DE PAGO")).toBeInTheDocument();
    expect(screen.queryByText("Recibo de pago")).not.toBeInTheDocument();
  });

  it("escapes malicious HTML payloads in companyName, notes, and employee name (XSS prevention)", () => {
    const maliciousSettlement: DriverSettlement = {
      ...mockSettlement,
      employeeFullName: "<script>alert('xss-employee')</script>Juan",
      notes: "<img src=x onerror=alert('xss-notes')>",
      settlementNumber: "<svg onload=alert(1)>LIQ-9999",
    };

    const { container } = render(
      <SettlementReceiptPrintView
        settlement={maliciousSettlement}
        companyName="</title><script>alert('xss-company')</script>Transportes"
        rfc="<script>RFC</script>"
      />,
    );

    // No raw unescaped script or svg tags in container
    expect(container.querySelectorAll("script")).toHaveLength(0);
    expect(container.querySelectorAll("svg[onload]")).toHaveLength(0);
    expect(container.querySelectorAll("img[onerror]")).toHaveLength(0);

    // Values are rendered as safe text content
    expect(screen.getAllByText(/xss-employee/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/xss-company/i)).toBeInTheDocument();
  });
});

