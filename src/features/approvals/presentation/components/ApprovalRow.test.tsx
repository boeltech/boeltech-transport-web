import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import type { ApprovableItem, ApprovalBlock } from "../../domain";
import { approvalsCopy } from "../copy/approvalsCopy";
import { ApprovalRow } from "./ApprovalRow";

const tripExpenseItem: ApprovableItem = {
  approvableType: "trip_expense",
  id: "expense-1",
  amount: 500,
  currency: "MXN",
  category: "fuel",
  status: "pending",
  submittedAt: "2026-06-01T10:00:00.000Z",
  submittedBy: "user-1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "trip_expense",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    driverId: "driver-1",
    driverFullName: "Juan Pérez",
    vehicleId: "vehicle-1",
    vehicleUnitNumber: "T-101",
    expenseCategory: "fuel",
    description: "Diesel",
    occurredAt: "2026-06-01T09:00:00.000Z",
    hasInvoice: true,
  },
};

const advanceItem: ApprovableItem = {
  approvableType: "driver_advance_request",
  id: "adv-1",
  amount: 1500,
  currency: "MXN",
  category: "driver_advance_request",
  status: "pending",
  submittedAt: "2026-08-10T10:00:00.000Z",
  submittedBy: "user-1",
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectionReason: null,
  context: {
    approvableType: "driver_advance_request",
    advanceId: "adv-1",
    folio: "ANT-2026-001",
    employeeId: "emp-1",
    employeeFullName: "Roberto Garza",
    tripId: "trip-1",
    tripCode: "V-2026-001",
    paymentMethod: "transferencia",
    notes: "Anticipo casetas",
    openAdvancesBalance: 3200,
    openAdvancesCount: 2,
  },
};

describe("ApprovalRow", () => {
  it("renders trip expense row with trip code link and CFDI badge", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={tripExpenseItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    // El gasto aprobado vive en el tab de costos del viaje.
    expect(screen.getByRole("link", { name: "V-2026-001" })).toHaveAttribute(
      "href",
      "/trips/trip-1?tab=costs",
    );
    expect(screen.getByText("Combustible")).toBeInTheDocument();
    expect(screen.getByText("CFDI validado")).toBeInTheDocument();
  });

  it("renders driver_advance_request row with open debt warning", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={advanceItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText("ANT-2026-001")).toBeInTheDocument();
    expect(screen.getByText(/Roberto Garza/)).toBeInTheDocument();
    expect(screen.getByText(/Deuda abierta: \$3,200\.00 \(2 anticipos\)/)).toBeInTheDocument();
    expect(screen.getByText(/Método: transferencia/i)).toBeInTheDocument();
    expect(screen.getByText(/Viaje: V-2026-001/)).toBeInTheDocument();
  });

  it("anticipo sin viaje usa copy de cuenta del operador (no Costos)", () => {
    const withoutTrip: ApprovableItem = {
      ...advanceItem,
      context: {
        ...advanceItem.context,
        tripId: null,
        tripCode: null,
      } as ApprovableItem["context"],
    };
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={withoutTrip}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText(approvalsCopy.inbox.table.advanceNoTrip)).toBeInTheDocument();
    expect(screen.queryByText(/Gasto general/i)).not.toBeInTheDocument();
  });

  it("renders internal_staff_compensation row with settlement link", () => {
    const compensationItem: ApprovableItem = {
      approvableType: "internal_staff_compensation",
      id: "settlement-123",
      amount: 4500,
      currency: "MXN",
      category: "internal_staff_compensation",
      status: "pending",
      submittedAt: "2026-08-15T10:00:00.000Z",
      submittedBy: "user-1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "internal_staff_compensation",
        settlementId: "settlement-123",
        settlementNumber: "LIQ-202608-0001",
        employeeId: "emp-1",
        employeeFullName: "Carlos Mendoza",
        periodStart: "2026-08-01",
        periodEnd: "2026-08-15",
        tripsCount: 3,
        grossAmount: 5500,
        totalDeductions: 1000,
        netAmount: 4500,
      },
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={compensationItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("link", { name: "LIQ-202608-0001" }),
    ).toHaveAttribute("href", "/finance/settlements/settlement-123");
    expect(screen.getByText(/Carlos Mendoza/)).toBeInTheDocument();
    expect(screen.getAllByText("Liquidación").length).toBeGreaterThanOrEqual(1);
    expect(screen.queryByText(approvalsCopy.inbox.table.reimbursementSettlementBadge)).not.toBeInTheDocument();
  });

  it("E11-F3: pago de reembolsos lleva insignia, fecha de alta y sin conteo de viajes", () => {
    const reimbursementItem: ApprovableItem = {
      approvableType: "internal_staff_compensation",
      id: "settlement-456",
      amount: 650,
      currency: "MXN",
      category: "internal_staff_compensation",
      status: "pending",
      submittedAt: "2026-10-05T10:00:00.000Z",
      submittedBy: "user-1",
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectionReason: null,
      context: {
        approvableType: "internal_staff_compensation",
        settlementId: "settlement-456",
        settlementNumber: "LIQ-202610-0003",
        settlementKind: "reimbursement_only",
        createdAt: "2026-10-04T18:00:00.000Z",
        employeeId: "emp-1",
        employeeFullName: "Carlos Mendoza",
        periodStart: "2026-10-04",
        periodEnd: "2026-10-04",
        tripsCount: 0,
        grossAmount: 650,
        totalDeductions: 0,
        netAmount: 650,
      },
    };

    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={reimbursementItem}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText(approvalsCopy.inbox.table.reimbursementSettlementBadge)).toBeInTheDocument();
    expect(screen.queryByText(/0 viajes/)).not.toBeInTheDocument();
    expect(screen.getByText(/Reembolsos \$650\.00/)).toBeInTheDocument();
    expect(screen.queryByText(/–/)).not.toBeInTheDocument();
  });

  it("renders fallback for unsupported approvable types", () => {
    const unsupported: ApprovableItem = {
      ...tripExpenseItem,
      approvableType: "fuel_transaction",
      context: { approvableType: "fuel_transaction" } as unknown as ApprovableItem["context"],
    };

    render(
      <table>
        <tbody>
          <ApprovalRow
            item={unsupported}
            selected={false}
            selectable={false}
            canUpdate={false}
            onSelectChange={vi.fn()}
            onApprove={vi.fn()}
            onReject={vi.fn()}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText(/Tipo no soportado/i)).toBeInTheDocument();
  });

  it("ADR-0098 blocked_own: muestra «Enviada por ti» en lugar de aprobar/rechazar", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={advanceItem}
              selected={false}
              selectable={false}
              canUpdate
              selfActionUi="blocked_own"
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText("Enviada por ti")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
  });

  it("ADR-0098 self_confirm: conserva los botones de acción", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={tripExpenseItem}
              selected={false}
              selectable
              canUpdate
              selfActionUi="self_confirm"
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
    expect(screen.queryByText("Enviada por ti")).not.toBeInTheDocument();
  });

  it("ADR-0098: badge «Autoaprobado» cuando el API marca self_approved", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={{
                ...tripExpenseItem,
                status: "approved",
                approvedAt: "2026-06-02T10:00:00.000Z",
                approvedBy: "user-1",
                selfApproved: true,
              }}
              selected={false}
              selectable={false}
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.getByText("Autoaprobado")).toBeInTheDocument();
  });

  it("P2-2: sin badge «Autoaprobado» en un autorrechazo", () => {
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={{
                ...advanceItem,
                status: "rejected",
                rejectedAt: "2026-08-11T10:00:00.000Z",
                rejectionReason: "Duplicado",
                selfApproved: true,
              }}
              selected={false}
              selectable={false}
              canUpdate
              onSelectChange={vi.fn()}
              onApprove={vi.fn()}
              onReject={vi.fn()}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );

    expect(screen.queryByText("Autoaprobado")).not.toBeInTheDocument();
  });
});

describe("ApprovalRow · ADR-0099 F6a", () => {
  const flowCopy = approvalsCopy.flow;

  function makeApproval(overrides: Partial<ApprovalBlock> = {}): ApprovalBlock {
    return {
      flowStatus: "in_progress",
      stepCurrent: 2,
      stepsTotal: 2,
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

  function renderRow(
    item: ApprovableItem,
    extra: Partial<ComponentProps<typeof ApprovalRow>> = {},
  ) {
    const handlers = {
      onApprove: vi.fn(),
      onReject: vi.fn(),
      onReturn: vi.fn(),
      onHistory: vi.fn(),
    };
    render(
      <MemoryRouter>
        <table>
          <tbody>
            <ApprovalRow
              item={item}
              selected={false}
              selectable
              canUpdate
              onSelectChange={vi.fn()}
              {...handlers}
              {...extra}
            />
          </tbody>
        </table>
      </MemoryRouter>,
    );
    return handlers;
  }

  it("dos pasos: «Paso 2 de 2 · Falta: Contador» y quién firmó el paso 1", () => {
    renderRow({ ...tripExpenseItem, approval: makeApproval() });
    expect(screen.getByText(flowCopy.stepLine(2, 2, "Contador"))).toBeInTheDocument();
    expect(screen.getByText(/^Firmó Ana López \(Gerente\) · /)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: flowCopy.whyHint })).toBeInTheDocument();
  });

  it("UX5: un paso con regla estándar no agrega chips ni líneas", () => {
    renderRow({
      ...tripExpenseItem,
      approval: makeApproval({
        stepCurrent: 1,
        stepsTotal: 1,
        signedSteps: [],
        escalated: true,
        reapproval: {
          invalidatedAt: null,
          previousInstanceId: null,
          previousStatus: null,
          changes: [],
        },
        routedBy: {
          tierIndex: null,
          minAmount: null,
          matchedConditions: [],
          policyVersion: null,
          lazy: true,
        },
      }),
    });
    expect(screen.queryByText(/Paso \d de \d/)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.escalatedChip)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.reapprovalChip)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: flowCopy.whyHint })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Aprobar" })).toBeInTheDocument();
  });

  it("UX5 enmendada: regla estándar + autorización anulada muestra «Reautorización» enfocable", async () => {
    renderRow({
      ...tripExpenseItem,
      approval: makeApproval({
        stepCurrent: 1,
        stepsTotal: 1,
        signedSteps: [],
        escalated: true,
        reapproval: {
          invalidatedAt: "2026-10-02T20:10:00.000Z",
          previousInstanceId: "inst-0",
          previousStatus: "approved",
          changes: [{ field: "amount", from: "8000.00", to: "12000.00" }],
        },
        routedBy: {
          tierIndex: null,
          minAmount: null,
          matchedConditions: [],
          policyVersion: null,
          lazy: true,
        },
      }),
    });
    expect(screen.getByText(flowCopy.reapprovalChip)).toBeInTheDocument();
    expect(screen.queryByText(/Paso \d de \d/)).not.toBeInTheDocument();
    expect(screen.queryByText(flowCopy.escalatedChip)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: flowCopy.whyHint })).not.toBeInTheDocument();

    const trigger = screen.getByText(flowCopy.reapprovalChip).closest<HTMLElement>("[tabindex]");
    expect(trigger).toHaveAttribute("tabindex", "0");
    act(() => trigger?.focus());
    expect(await screen.findByRole("tooltip")).toHaveTextContent(
      "Cambió desde la autorización anterior: Monto: $8,000.00 → $12,000.00",
    );
  });

  it("«Ya firmaste el paso 1» sustituye las acciones", () => {
    renderRow(
      {
        ...tripExpenseItem,
        approval: makeApproval({ canAct: false, cannotActReason: "already_signed" }),
      },
      { selectable: false },
    );
    expect(screen.getByText(flowCopy.alreadySignedChip(1))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
  });

  it("«Espera a Contador» cuando no le toca", () => {
    renderRow(
      {
        ...tripExpenseItem,
        approval: makeApproval({ canAct: false, cannotActReason: "not_eligible" }),
      },
      { selectable: false },
    );
    expect(screen.getByText(flowCopy.waitingChip("Contador"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
  });

  it("CEO-4: Aprobar a un clic; Devolver, Rechazar e historial en el menú ⋯", async () => {
    const user = userEvent.setup();
    const handlers = renderRow({ ...tripExpenseItem, approval: makeApproval() });

    expect(screen.queryByRole("button", { name: "Rechazar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Aprobar" }));
    expect(handlers.onApprove).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: flowCopy.menu.more }));
    expect(
      await screen.findByRole("menuitem", { name: flowCopy.menu.return }),
    ).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: flowCopy.menu.reject })).toBeInTheDocument();
    await user.click(screen.getByRole("menuitem", { name: flowCopy.menu.history }));
    expect(handlers.onHistory).toHaveBeenCalledTimes(1);
  });

  it("«Devuelta» en Estado y sin acciones de decisión", () => {
    renderRow(
      {
        ...tripExpenseItem,
        approval: makeApproval({
          flowStatus: "returned",
          canAct: false,
          cannotActReason: "returned",
          returned: {
            reason: "Falta ticket",
            reasonCode: "missing_receipt",
            returnedBy: "user-ana",
            returnedByName: "Ana López",
            returnedAt: "2026-10-01T19:00:00.000Z",
          },
        }),
      },
      { selectable: false },
    );
    expect(screen.getByText(flowCopy.returnedChip)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument();
  });
});
