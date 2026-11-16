import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import { formatDate } from "@shared/utils/dateUtils";
import { DISBURSEMENT_METHOD_LABELS } from "../../domain/enums";
import type { DriverAdvance } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DriverAdvancesTable } from "./DriverAdvancesTable";

const advancesCopy = settlementsCopy.advancesList;
const fieldsCopy = settlementsCopy.fields;

const advanceActionsSpy = vi.fn();

vi.mock("./AdvanceActions", () => ({
  AdvanceActions: (props: {
    advance: DriverAdvance;
    onRepartir?: () => void;
  }) => {
    advanceActionsSpy(props);
    return (
      <button
        type="button"
        aria-label="Abrir menú de acciones"
        data-testid={`advance-actions-${props.advance.id}`}
        data-has-repartir={props.onRepartir ? "true" : "false"}
        onClick={() => props.onRepartir?.()}
      />
    );
  },
}));

vi.mock("@features/approvals/presentation/components", () => ({
  ApprovalFlowLines: () => <div data-testid="approval-flow-lines" />,
  SelfApprovedBadge: () => <span data-testid="self-approved-badge">Autoaprobado</span>,
}));

vi.mock("@features/approvals/domain", () => ({
  showsSelfApprovedBadge: () => false,
}));

function makeAdvance(overrides: Partial<DriverAdvance> = {}): DriverAdvance {
  return {
    id: "adv-1",
    tenantId: "tenant-1",
    folio: "ANT-202611-0001",
    employeeId: "emp-1",
    employeeFullName: "Pedro Infante García López",
    tripId: "trip-1",
    tripCode: "TRP-101",
    amount: 5000,
    balanceRemaining: 5000,
    availableBalance: 5000,
    currency: "MXN",
    category: "travel_advance",
    status: "disbursed",
    disbursedAt: "2026-11-01T12:00:00Z",
    paymentMethod: "bank_transfer",
    bankReference: "REF-99",
    notes: null,
    createdAt: "2026-11-01T10:00:00Z",
    updatedAt: "2026-11-01T12:00:00Z",
    ...overrides,
  };
}

describe("DriverAdvancesTable polish Conform (D1–D5)", () => {
  beforeEach(() => {
    advanceActionsSpy.mockClear();
  });

  it("D1: Folio es code puro (sin text-primary / font-semibold)", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance()]}
        isLoading={false}
        onRepartir={vi.fn()}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const folioCell = within(row).getByText("ANT-202611-0001").closest("td");
    expect(folioCell?.className).not.toMatch(/text-primary/);
    expect(folioCell?.className).not.toMatch(/font-semibold/);
    expect(folioCell?.className).toMatch(/font-mono/);
  });

  it("D2: Saldo stacked normal; secundaria solo plan; sin entregado ni badge supera", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[
          makeAdvance({
            availableBalance: 9000,
            balanceRemaining: 9000,
            amount: 9000,
            periodDeductionCap: 1000,
          }),
        ]}
        isLoading={false}
        onRepartir={vi.fn()}
        estimatedByEmployee={new Map([["emp-1", 1000]])}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const balanceCell = within(row)
      .getByText(/\$9,000\.00/)
      .closest("td");
    expect(balanceCell?.className).toMatch(/text-right/);

    const primary = within(balanceCell as HTMLElement).getByText(/\$9,000\.00/);
    expect(primary.className).toMatch(/font-mono/);
    expect(primary.className).toMatch(/tabular-nums/);
    expect(primary.className).not.toMatch(/font-medium|font-semibold/);

    expect(
      within(balanceCell as HTMLElement).getByText(
        advancesCopy.planPerPeriod("$1,000.00", 9),
      ),
    ).toBeInTheDocument();
    expect(
      within(balanceCell as HTMLElement).queryByText(/entregado/i),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(advancesCopy.exceedsBadge)).not.toBeInTheDocument();
  });

  it("D2: sin plan → solo saldo", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance({ periodDeductionCap: null })]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const balanceCell = within(row)
      .getByText(/\$5,000\.00/)
      .closest("td");
    expect(within(balanceCell as HTMLElement).getByText(/\$5,000\.00/)).toBeInTheDocument();
    expect(screen.queryByText(/por corte/i)).not.toBeInTheDocument();
    expect(
      within(balanceCell as HTMLElement).queryByText(/entregado/i),
    ).not.toBeInTheDocument();
  });

  it("D3: Categoría text 1 línea (truncate DS, sin line-clamp-2)", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance()]}
        isLoading={false}
        onRepartir={vi.fn()}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const category = within(row).getByText("Anticipo de viaje");
    expect(category.className).toMatch(/truncate/);
    expect(category.className).not.toMatch(/line-clamp-2/);
  });

  it("D5: Acciones w-12 por defecto; amplía solo si hay Repartir inline", () => {
    const { rerender } = renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance({ availableBalance: 500, balanceRemaining: 500 })]}
        isLoading={false}
        onRepartir={vi.fn()}
        estimatedByEmployee={new Map([["emp-1", 2000]])}
      />,
    );

    const table = screen.getByRole("table", { name: /listado de anticipos/i });
    let headerRow = within(table).getAllByRole("row")[0]!;
    let actionHeader = within(headerRow).getAllByRole("columnheader").at(-1);
    expect(actionHeader?.className).toMatch(/w-12/);
    expect(actionHeader?.className).not.toMatch(/w-\[10rem\]/);

    rerender(
      <DriverAdvancesTable
        advances={[
          makeAdvance({
            id: "adv-exceeds",
            availableBalance: 8000,
            balanceRemaining: 8000,
          }),
        ]}
        isLoading={false}
        onRepartir={vi.fn()}
        estimatedByEmployee={new Map([["emp-1", 2000]])}
      />,
    );

    headerRow = within(
      screen.getByRole("table", { name: /listado de anticipos/i }),
    ).getAllByRole("row")[0]!;
    actionHeader = within(headerRow).getAllByRole("columnheader").at(-1);
    expect(actionHeader?.className).toMatch(/w-\[10rem\]/);
    expect(screen.getByTestId("advance-repartir-adv-exceeds")).toBeInTheDocument();
  });

  it("Operador usa max-width (no esponja table-fixed)", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance()]}
        isLoading={false}
        onRepartir={vi.fn()}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const operatorCell = within(row).getByText("Pedro Infante García López").closest("td");
    expect(operatorCell?.className).toMatch(/max-w-\[20ch\]/);
  });

  it("Estado apila en columna; Repartir no vive ahí", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance({ selfSegregatedApproval: true })]}
        isLoading={false}
        onRepartir={vi.fn()}
        estimatedByEmployee={new Map([["emp-1", 1000]])}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const statusStack = within(row)
      .getByTestId("approval-flow-lines")
      .closest("div.flex");
    expect(statusStack?.className).toMatch(/flex-col/);
    expect(
      within(statusStack as HTMLElement).queryByTestId("advance-repartir-adv-1"),
    ).not.toBeInTheDocument();
  });

  it("Repartir inline solo si supera pago estimado", () => {
    const onRepartir = vi.fn();
    const exceeds = makeAdvance({
      id: "adv-exceeds",
      availableBalance: 8000,
      balanceRemaining: 8000,
    });
    const withinCap = makeAdvance({
      id: "adv-ok",
      folio: "ANT-202611-0002",
      availableBalance: 500,
      balanceRemaining: 500,
    });

    renderWithTheme(
      <DriverAdvancesTable
        advances={[exceeds, withinCap]}
        isLoading={false}
        onRepartir={onRepartir}
        estimatedByEmployee={new Map([["emp-1", 2000]])}
      />,
    );

    expect(screen.getByTestId("advance-repartir-adv-exceeds")).toBeInTheDocument();
    expect(screen.queryByTestId("advance-repartir-adv-ok")).not.toBeInTheDocument();

    const calls = advanceActionsSpy.mock.calls.map(
      (c) => c[0] as { advance: DriverAdvance; onRepartir?: () => void },
    );
    const exceedsProps = calls.find((c) => c.advance.id === "adv-exceeds");
    const okProps = calls.find((c) => c.advance.id === "adv-ok");
    expect(exceedsProps?.onRepartir).toBeUndefined();
    expect(okProps?.onRepartir).toEqual(expect.any(Function));
  });

  it("callback de Repartir en ⋯ cuando no supera", async () => {
    const user = userEvent.setup();
    const onRepartir = vi.fn();
    const withinCap = makeAdvance({
      id: "adv-menu",
      availableBalance: 500,
      balanceRemaining: 500,
    });

    renderWithTheme(
      <DriverAdvancesTable
        advances={[withinCap]}
        isLoading={false}
        onRepartir={onRepartir}
        estimatedByEmployee={new Map([["emp-1", 2000]])}
      />,
    );

    expect(screen.queryByTestId("advance-repartir-adv-menu")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("advance-actions-adv-menu"));
    expect(onRepartir).toHaveBeenCalledWith(
      expect.objectContaining({ id: "adv-menu" }),
    );
  });
});

describe("DriverAdvancesTable Entrega column (D1–D5)", () => {
  function deliveryCell(row: HTMLElement): HTMLElement {
    return within(row).getByText(fieldsCopy.deliveryPending).closest("td") as HTMLElement;
  }

  it("D3: header es «Entrega» (no «Fecha de entrega»)", () => {
    renderWithTheme(
      <DriverAdvancesTable advances={[makeAdvance()]} isLoading={false} />,
    );

    const table = screen.getByRole("table", { name: /listado de anticipos/i });
    const headerRow = within(table).getAllByRole("row")[0]!;
    expect(
      within(headerRow).getByRole("columnheader", { name: fieldsCopy.deliveryDate }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /fecha de entrega/i })).not.toBeInTheDocument();
  });

  it("D1+D2+D4: sin disbursedAt → primary «Pendiente»; secondary método (+ ref); sin «—»", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[
          makeAdvance({
            status: "pending_approval",
            disbursedAt: null,
            paymentMethod: "cash",
            bankReference: null,
          }),
        ]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const cell = deliveryCell(row);
    const primary = within(cell).getByText(fieldsCopy.deliveryPending);
    expect(primary).toBeInTheDocument();
    expect(within(cell).queryByText("—")).not.toBeInTheDocument();
    expect(
      within(cell).getByText(DISBURSEMENT_METHOD_LABELS.cash),
    ).toBeInTheDocument();
  });

  it("D2: secondary incluye método · ref SPEI cuando hay bankReference", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[
          makeAdvance({
            status: "pending_disbursement",
            disbursedAt: null,
            paymentMethod: "bank_transfer",
            bankReference: "SPEI-123",
          }),
        ]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const cell = deliveryCell(row);
    expect(within(cell).getByText(fieldsCopy.deliveryPending)).toBeInTheDocument();
    expect(
      within(cell).getByText(
        `${DISBURSEMENT_METHOD_LABELS.bank_transfer} · SPEI-123`,
      ),
    ).toBeInTheDocument();
  });

  it("D5: con disbursedAt → primary formatDate; secondary método", () => {
    const disbursedAt = "2026-11-01T12:00:00Z";
    renderWithTheme(
      <DriverAdvancesTable
        advances={[
          makeAdvance({
            status: "disbursed",
            disbursedAt,
            paymentMethod: "bank_transfer",
            bankReference: "REF-99",
          }),
        ]}
        isLoading={false}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const expectedDate = formatDate(disbursedAt);
    const cell = within(row).getByText(expectedDate).closest("td") as HTMLElement;
    expect(within(cell).getByText(expectedDate)).toBeInTheDocument();
    expect(within(cell).queryByText(fieldsCopy.deliveryPending)).not.toBeInTheDocument();
    expect(
      within(cell).getByText(
        `${DISBURSEMENT_METHOD_LABELS.bank_transfer} · REF-99`,
      ),
    ).toBeInTheDocument();
  });
});
