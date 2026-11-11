import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithTheme } from "@/test/renderWithTheme";
import type { DriverAdvance } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { DriverAdvancesTable } from "./DriverAdvancesTable";

const advancesCopy = settlementsCopy.advancesList;

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

describe("DriverAdvancesTable layout Abiertos (D1–D6)", () => {
  beforeEach(() => {
    advanceActionsSpy.mockClear();
  });

  it("D6: Operador usa max-width (no esponja table-fixed)", () => {
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

  it("D3: Estado apila en columna; Repartir no vive ahí", () => {
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

  it("D4: Repartir inline solo si supera pago estimado", () => {
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

    // Inline para supera → menú sin onRepartir; no supera → menú con onRepartir.
    const calls = advanceActionsSpy.mock.calls.map(
      (c) => c[0] as { advance: DriverAdvance; onRepartir?: () => void },
    );
    const exceedsProps = calls.find((c) => c.advance.id === "adv-exceeds");
    const okProps = calls.find((c) => c.advance.id === "adv-ok");
    expect(exceedsProps?.onRepartir).toBeUndefined();
    expect(okProps?.onRepartir).toEqual(expect.any(Function));
  });

  it("D1: Categoría permite wrap (line-clamp-2); Saldo ink right", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance()]}
        isLoading={false}
        onRepartir={vi.fn()}
      />,
    );

    const row = screen.getByRole("row", { name: /ANT-202611-0001/i });
    const category = within(row).getByText("Anticipo de viaje");
    expect(category.className).toMatch(/line-clamp-2/);

    const balanceCell = within(row)
      .getAllByText(/\$5,000\.00/)[0]
      ?.closest("td");
    expect(balanceCell?.className).toMatch(/text-right/);
    expect(balanceCell?.className).toMatch(/text-foreground/);
  });

  it("D5: Acciones reserva ancho cuando hay onRepartir", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance()]}
        isLoading={false}
        onRepartir={vi.fn()}
      />,
    );

    const table = screen.getByRole("table", { name: /listado de anticipos/i });
    const headerRow = within(table).getAllByRole("row")[0]!;
    const actionHeader = within(headerRow).getAllByRole("columnheader").at(-1);
    expect(actionHeader?.className).toMatch(/w-\[10rem\]/);
  });

  it("D4 menú: callback de Repartir en ⋯ cuando no supera", async () => {
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

  it("muestra badge supera su pago cuando aplica", () => {
    renderWithTheme(
      <DriverAdvancesTable
        advances={[makeAdvance({ availableBalance: 9000, balanceRemaining: 9000 })]}
        isLoading={false}
        onRepartir={vi.fn()}
        estimatedByEmployee={new Map([["emp-1", 1000]])}
      />,
    );

    expect(screen.getByText(advancesCopy.exceedsBadge)).toBeInTheDocument();
  });
});
