import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SettlementReceiptPrintView } from "./SettlementReceiptPrintView";
import type { DriverSettlement, ZeroCommissionReason } from "../../domain/entities";

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
  status: "disbursed",
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
  approvedByName: "Lic. Ana López",
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
    expect(screen.getByText("Pago a operador — Período")).toBeInTheDocument();

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
    expect(screen.getByText(/2\. Descuentos \(−\)/i)).toBeInTheDocument();
    expect(screen.getAllByText("ANT-0042").length).toBeGreaterThanOrEqual(1);
  });

  it("renders the 3-block horizontal balance summary with correct totals", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getByText(/\(\+\) Total Ingresos/i)).toBeInTheDocument();
    expect(screen.getByText(/\(?[−-]\)? Total Descuentos/i)).toBeInTheDocument();
    expect(screen.getByText(/NETO A PAGAR AL OPERADOR/i)).toBeInTheDocument();
  });

  it("renders signatures section with operator and disburser details when paid", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getByText("Firma de Conformidad del Operador")).toBeInTheDocument();
    expect(
      screen.getByText(/Recibí a mi entera satisfacción la cantidad neta indicada/i),
    ).toBeInTheDocument();
    expect(screen.getByTestId("receipt-company-signer-name")).toHaveTextContent(
      "Lic. Roberto Garza",
    );
    expect(screen.getByText("Pago registrado / Empresa")).toBeInTheDocument();
    expect(screen.getByText("Recibo de pago")).toBeInTheDocument();
    expect(screen.queryByText("Lic. Ana López")).not.toBeInTheDocument();
  });

  it("muestra PENDIENTE DE PAGO y autorizador cuando está Autorizado sin dispersión", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          status: "approved",
          disbursedAt: null,
          disbursedBy: null,
          disbursedByName: null,
          disbursementMethod: null,
          disbursementReference: null,
        }}
      />,
    );

    expect(screen.getByText("PENDIENTE DE PAGO")).toBeInTheDocument();
    expect(screen.queryByText("Recibo de pago")).not.toBeInTheDocument();
    expect(screen.getByTestId("receipt-company-signer-name")).toHaveTextContent(
      "Lic. Ana López",
    );
    expect(screen.getByText("Revisado y Autorizado / Empresa")).toBeInTheDocument();
  });

  it("R-05: cancelled + disbursedAt huérfano sigue con watermark (no firmable)", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          status: "cancelled",
          disbursedAt: "2026-08-16T10:00:00Z",
          disbursedByName: "Lic. Roberto Garza",
        }}
      />,
    );

    expect(screen.getByTestId("receipt-review-watermark")).toHaveTextContent(
      "NO VÁLIDO PARA FIRMA",
    );
    expect(screen.queryByText("Firma de Conformidad del Operador")).not.toBeInTheDocument();
    expect(screen.queryByText("Recibo de pago")).not.toBeInTheDocument();
  });

  it("R-04: rejected muestra watermark NO VÁLIDO PARA FIRMA", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          status: "rejected",
          approvedAt: null,
          approvedBy: null,
          approvedByName: null,
          disbursedAt: null,
          disbursedBy: null,
          disbursedByName: null,
          disbursementMethod: null,
          disbursementReference: null,
        }}
      />,
    );

    expect(screen.getByTestId("receipt-review-watermark")).toHaveTextContent(
      "NO VÁLIDO PARA FIRMA",
    );
    expect(screen.queryByText("Firma de Conformidad del Operador")).not.toBeInTheDocument();
  });

  it("R-03: con logoSrc muestra el logo en cabecera", () => {
    render(
      <SettlementReceiptPrintView
        settlement={mockSettlement}
        companyName="Transportes Tlama"
        logoSrc="https://cdn.example/logo.png?v=1"
      />,
    );

    const logo = screen.getByTestId("receipt-company-logo");
    expect(logo).toHaveAttribute("src", "https://cdn.example/logo.png?v=1");
    expect(screen.getByText(/Transportes Tlama/i)).toBeInTheDocument();
  });

  it("R-03: sin logoSrc no renderiza img rota", () => {
    render(
      <SettlementReceiptPrintView
        settlement={mockSettlement}
        companyName="Transportes Tlama"
      />,
    );

    expect(screen.queryByTestId("receipt-company-logo")).not.toBeInTheDocument();
  });

  it("branding: sin companyName usa fallback neutro (no inventa marca)", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.getByText(/Sin razón social configurada/i)).toBeInTheDocument();
    expect(screen.queryByText(/Empresa de Transporte/i)).not.toBeInTheDocument();
  });

  it("R-02: imprime evidencia self-segregated de autorización y dispersión", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          selfSegregatedApproval: true,
          approverCountAtApprove: 1,
          selfSegregatedDisbursement: true,
          executorCountAtDisburse: 1,
        }}
      />,
    );

    const evidence = screen.getByTestId("receipt-self-segregated-evidence");
    expect(evidence).toHaveTextContent(
      /Autorizado en modo un solo responsable \(1 autorizador al momento\)/,
    );
    expect(evidence).toHaveTextContent(
      /Pago registrado en modo un solo responsable \(1 ejecutor al momento\)/,
    );
  });

  it.each(["draft", "pending_approval"] as const)(
    "D28: en %s muestra «NO VÁLIDO PARA FIRMA» y no imprime firmas",
    (status) => {
      render(
        <SettlementReceiptPrintView
          settlement={{
            ...mockSettlement,
            status,
            approvedAt: null,
            approvedBy: null,
            approvedByName: null,
            disbursedAt: null,
            disbursedBy: null,
            disbursedByName: null,
            disbursementMethod: null,
            disbursementReference: null,
          }}
        />,
      );

      expect(screen.getByTestId("receipt-review-watermark")).toHaveTextContent(
        "NO VÁLIDO PARA FIRMA",
      );
      expect(screen.getByTestId("receipt-review-notice")).toHaveTextContent(
        /Documento de revisión\. No firmar/,
      );
      expect(screen.queryByText("Firma de Conformidad del Operador")).not.toBeInTheDocument();
      expect(screen.queryByText("Revisado y Autorizado / Empresa")).not.toBeInTheDocument();
      expect(screen.getByText(/Última modificación:/)).toBeInTheDocument();
    },
  );

  it("D28: autorizada y dispersada muestran «Última modificación» sin marca de agua", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);

    expect(screen.queryByTestId("receipt-review-watermark")).not.toBeInTheDocument();
    expect(screen.getByText(/Última modificación:/)).toBeInTheDocument();
  });

  it("E11: viajes en $0 salen aparte con su motivo y no en ingresos", () => {
    const zeroTrip = (id: string, tripCode: string, zeroReason?: "no_rule" | "scheme") => ({
      id,
      settlementId: "settlement-uuid-1234",
      itemType: "trip_commission" as const,
      tripId: `trip-${id}`,
      tripCode,
      tripExpenseId: null,
      advanceId: null,
      description: `Comisión de viaje ${tripCode}`,
      quantity: 1,
      unitRate: 0,
      amount: 0,
      isDeduction: false,
      calculationDetails: zeroReason ? { zeroReason } : {},
      createdAt: "2026-08-15T12:00:00Z",
    });
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          items: [
            ...(mockSettlement.items ?? []),
            zeroTrip("z1", "TRP-200", "no_rule"),
            zeroTrip("z2", "TRP-201", "scheme"),
            zeroTrip("z3", "TRP-202"),
          ],
        }}
      />,
    );

    const section = screen.getByTestId("receipt-zero-trips");
    expect(section).toHaveTextContent("Viajes incluidos sin comisión");
    expect(section).toHaveTextContent("TRP-200");
    expect(section).toHaveTextContent("La tarifa no tiene regla para este tipo de ruta");
    expect(section).toHaveTextContent("La tarifa no paga comisión en este viaje");
    expect(section).toHaveTextContent("Sin comisión");
    const earningsTable = screen
      .getByText(/1\. Ingresos del Período/i)
      .parentElement?.querySelector("table");
    expect(earningsTable?.textContent).toContain("TRP-101");
    expect(earningsTable?.textContent).not.toContain("TRP-200");
  });

  it("E11.2: motivo zero_freight y respaldo para un motivo desconocido", () => {
    const zeroTrip = (id: string, tripCode: string, zeroReason: ZeroCommissionReason) => ({
      id,
      settlementId: "settlement-uuid-1234",
      itemType: "trip_commission" as const,
      tripId: `trip-${id}`,
      tripCode,
      tripExpenseId: null,
      advanceId: null,
      description: `Comisión de viaje ${tripCode}`,
      quantity: 1,
      unitRate: 0,
      amount: 0,
      isDeduction: false,
      calculationDetails: { zeroReason },
      createdAt: "2026-08-15T12:00:00Z",
    });
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          items: [
            ...(mockSettlement.items ?? []),
            zeroTrip("z1", "TRP-300", "zero_freight"),
            // API más nuevo que la web: motivo que esta versión no conoce.
            zeroTrip("z2", "TRP-301", "motivo_futuro" as ZeroCommissionReason),
          ],
        }}
      />,
    );

    const rows = screen.getByTestId("receipt-zero-trips").querySelectorAll("tbody tr");
    expect(rows[0]).toHaveTextContent("TRP-300");
    expect(rows[0]).toHaveTextContent("Sin flete capturado (regla por porcentaje)");
    expect(rows[1]).toHaveTextContent("TRP-301");
    expect(rows[1]?.lastElementChild?.textContent).toBe("Sin comisión");
  });

  it("ADR-0086 D1: viaje pagado al mínimo va en ingresos con la leyenda del cálculo", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          items: [
            ...(mockSettlement.items ?? []),
            {
              id: "item-min",
              settlementId: "settlement-uuid-1234",
              itemType: "trip_commission",
              tripId: "trip-min",
              tripCode: "TRP-400",
              tripExpenseId: null,
              advanceId: null,
              description: "Comisión de viaje TRP-400 (CDMX → Puebla · Foráneo)",
              quantity: 1,
              unitRate: 350,
              amount: 350,
              isDeduction: false,
              calculationDetails: {
                routeType: "long_haul",
                commissionBeforeMinimum: 0,
                minimumGuaranteedAmount: 350,
                minimumGuaranteedApplied: true,
                calculationGap: "zero_km",
              },
              createdAt: "2026-08-15T12:00:00Z",
            },
          ],
        }}
      />,
    );

    expect(screen.queryByTestId("receipt-zero-trips")).not.toBeInTheDocument();
    const minRow = screen.getByText("TRP-400").closest("tr");
    expect(minRow).toHaveTextContent("Mínimo garantizado (cálculo: $0.00)");
    expect(minRow?.lastElementChild?.textContent).toBe("$350.00");
  });

  it("ADR-0086 D1: partida anterior al cambio (sin claves del mínimo) no muestra leyenda", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);
    expect(screen.queryByText(/Mínimo garantizado/)).not.toBeInTheDocument();
  });

  it("E11: sin viajes en $0 no muestra la sección", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);
    expect(screen.queryByTestId("receipt-zero-trips")).not.toBeInTheDocument();
  });

  it("criterio 3: una penalización manual aparece en deducciones", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          totalOtherDeductions: 300,
          netAmount: 7350,
          items: [
            ...(mockSettlement.items ?? []),
            {
              id: "item-4",
              settlementId: "settlement-uuid-1234",
              itemType: "penalty_deduction",
              tripId: null,
              tripExpenseId: null,
              advanceId: null,
              description: "Penalización por retraso",
              quantity: 1,
              unitRate: 300,
              amount: 300,
              isDeduction: true,
              createdAt: "2026-08-15T12:00:00Z",
            },
          ],
        }}
      />,
    );

    const deductionsTable = screen
      .getByText(/2\. Descuentos \(−\)/i)
      .parentElement?.querySelector("table");
    expect(deductionsTable?.textContent).toContain("-$300.00");
    expect(deductionsTable?.textContent).toContain("-$1,800.00");
  });

  it("D4: partidas de tarifa sin prefijo, con su categoría y anticipos primero", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          totalOtherDeductions: 200,
          grossAmount: 9450,
          netAmount: 7750,
          items: [
            {
              id: "item-fixed",
              settlementId: "settlement-uuid-1234",
              itemType: "bonus",
              tripId: null,
              tripExpenseId: null,
              advanceId: null,
              description: "Prestación fija: Viáticos",
              quantity: 1,
              unitRate: 300,
              amount: 300,
              isDeduction: false,
              calculationDetails: { source: "fixed_allowance" },
              createdAt: "2026-08-15T12:00:00Z",
            },
            {
              id: "item-template",
              settlementId: "settlement-uuid-1234",
              itemType: "adjustment",
              tripId: null,
              tripExpenseId: null,
              advanceId: null,
              description: "Deducción de plantilla: Fondo de ahorro",
              quantity: 1,
              unitRate: 200,
              amount: 200,
              isDeduction: true,
              calculationDetails: { source: "template_deduction" },
              createdAt: "2026-08-15T12:00:00Z",
            },
            ...(mockSettlement.items ?? []),
          ],
        }}
      />,
    );

    expect(screen.getByText("Viáticos")).toBeInTheDocument();
    expect(screen.getByText("Prestación fija")).toBeInTheDocument();
    expect(screen.getByText("Fondo de ahorro")).toBeInTheDocument();
    expect(screen.getByText("Deducción de tarifa")).toBeInTheDocument();
    expect(screen.queryByText(/Deducción de plantilla:/)).not.toBeInTheDocument();

    const deductionRows = screen
      .getByText(/2\. Descuentos \(−\)/i)
      .parentElement?.querySelectorAll("tbody tr");
    expect(deductionRows?.[0]?.textContent).toContain("Descuento de anticipo");
    expect(deductionRows?.[1]?.textContent).toContain("Fondo de ahorro");
  });

  it("tope de descuentos: histórico con $500 no cubiertos cuadra percepciones − deducciones + no cubierto = neto", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          totalTripsCommission: 2000,
          totalBaseSalary: 0,
          totalReimbursableExpenses: 0,
          totalAdvancesDeducted: 2500,
          grossAmount: 2000,
          netAmount: 0,
          uncoveredDeductionsAmount: 500,
        }}
      />,
    );

    const row = screen.getByTestId("receipt-uncovered-deductions");
    expect(row).toHaveTextContent("Descuento no cubierto");
    expect(row).toHaveTextContent("+$500.00");
    // 2,000 − 2,500 + 500 = 0
    expect(screen.getAllByText("-$2,500.00").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/NETO A PAGAR AL OPERADOR/i).parentElement).toHaveTextContent("$0.00");
  });

  it("tope de descuentos: sin descuento no cubierto no agrega la fila", () => {
    render(<SettlementReceiptPrintView settlement={mockSettlement} />);
    expect(screen.queryByTestId("receipt-uncovered-deductions")).not.toBeInTheDocument();
  });

  it("tope de descuentos: deducción de tarifa no aplicada se lista en $0.00 con el monto omitido", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          items: [
            ...(mockSettlement.items ?? []),
            {
              id: "item-fund",
              settlementId: "settlement-uuid-1234",
              itemType: "adjustment",
              tripId: null,
              tripExpenseId: null,
              advanceId: null,
              description: "Deducción de plantilla: Fondo de ahorro",
              quantity: 1,
              unitRate: 0,
              amount: 0,
              isDeduction: true,
              calculationDetails: {
                source: "template_deduction",
                requestedAmount: 300,
                omittedAmount: 300,
              },
              createdAt: "2026-08-15T12:00:00Z",
            },
          ],
        }}
      />,
    );

    const fundRow = screen.getByText("Fondo de ahorro").closest("tr");
    expect(fundRow).toHaveTextContent("No aplicado $300.00 por ingreso insuficiente");
    expect(fundRow?.lastElementChild?.textContent).toBe("$0.00");
  });

  it("E11-F3: pago de reembolsos usa su título, fecha de alta y la línea «comisión en {folio}»", () => {
    render(
      <SettlementReceiptPrintView
        settlement={{
          ...mockSettlement,
          settlementKind: "reimbursement_only",
          periodStart: "2026-08-16",
          periodEnd: "2026-08-16",
          createdAt: "2026-08-16T12:00:00Z",
          totalTripsCommission: 0,
          totalBaseSalary: 0,
          totalReimbursableExpenses: 650,
          totalAdvancesDeducted: 0,
          grossAmount: 650,
          netAmount: 650,
          tripsCount: 0,
          items: [
            {
              id: "item-r1",
              settlementId: "settlement-uuid-1234",
              itemType: "approved_expense_reimbursement",
              tripId: "trip-9",
              tripCode: "TRP-109",
              tripExpenseId: "exp-9",
              advanceId: null,
              description: "Caseta Arco Norte",
              quantity: 1,
              unitRate: 400,
              amount: 400,
              isDeduction: false,
              calculationDetails: {
                tripSettledIn: { settlementId: "stl-prev", settlementNumber: "LIQ-202608-0003" },
              },
              createdAt: "2026-08-16T12:00:00Z",
            },
            {
              id: "item-r2",
              settlementId: "settlement-uuid-1234",
              itemType: "approved_expense_reimbursement",
              tripId: "trip-10",
              tripCode: "TRP-110",
              tripExpenseId: "exp-10",
              advanceId: null,
              description: "Maniobra",
              quantity: 1,
              unitRate: 250,
              amount: 250,
              isDeduction: false,
              calculationDetails: { tripSettledIn: null, payeeResolution: "manual" },
              createdAt: "2026-08-16T12:00:00Z",
            },
          ],
        }}
      />,
    );

    expect(screen.getByText("Pago de reembolsos a operador")).toBeInTheDocument();
    expect(screen.queryByText("Pago a operador — Período")).not.toBeInTheDocument();
    expect(screen.getByText("1. Reembolsos de gastos de viaje (+)")).toBeInTheDocument();
    expect(screen.queryByText(/Período pagado:/)).not.toBeInTheDocument();
    const tripLines = screen.getAllByTestId("receipt-reimbursement-trip-line");
    expect(tripLines[0]).toHaveTextContent("Viaje TRP-109 · comisión en LIQ-202608-0003");
    expect(tripLines[1]).toHaveTextContent("Viaje TRP-110 · sin comisión en pagos de este operador");
    expect(screen.getByText("Asignado a este operador por cambio de conductor")).toBeInTheDocument();
    expect(
      screen.getByText(/por concepto de reembolso de gastos de viaje que pagué/),
    ).toBeInTheDocument();
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

