import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TooltipProvider } from "@shared/ui/tooltip";
import type { SettlementBacklogRow, SettlementBacklogRowType } from "../../domain/entities";
import { settlementsCopy } from "../copy/settlementsCopy";
import { SettlementBacklogTable } from "./SettlementBacklogTable";

const mockHasPermission = vi.fn();

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: (module: string, action: string) =>
      mockHasPermission(module, action),
  }),
}));

function makeRow(
  rowType: SettlementBacklogRowType,
  overrides: Partial<SettlementBacklogRow> = {},
): SettlementBacklogRow {
  return {
    employeeId: "emp-1",
    employeeFullName: "Xaime Weir Rojo",
    branchId: null,
    branchName: null,
    periodStart: "2026-08-17",
    periodEnd: "2026-08-23",
    pendingTripsCount: 3,
    oldestTripAgeDays: 5,
    estimatedNetAmount: 4523.14,
    rowType,
    warnings: [],
    ...overrides,
  };
}

function renderTable(
  rows: readonly SettlementBacklogRow[],
  viewMode: "table" | "cards" = "table",
  onNavigateCreate = vi.fn(),
) {
  return render(
    <TooltipProvider delayDuration={0}>
      <SettlementBacklogTable
        rows={rows}
        isLoading={false}
        viewMode={viewMode}
        onNavigateCreate={onNavigateCreate}
      />
    </TooltipProvider>,
  );
}

describe("SettlementBacklogTable period tooltip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it.each([
    ["trips_pending", settlementsCopy.workbench.backlog.periodTooltips.trips_pending],
    ["salary_close", settlementsCopy.workbench.backlog.periodTooltips.salary_close],
    ["mixed", settlementsCopy.workbench.backlog.periodTooltips.mixed],
  ] as const)("shows rowType-specific tooltip for %s", async (rowType, expectedText) => {
    const user = userEvent.setup();
    renderTable([makeRow(rowType)]);

    await user.hover(screen.getByText(/17 ago 2026/i));

    expect(
      await screen.findByRole("tooltip", { name: expectedText }),
    ).toBeInTheDocument();
  });
});

describe("SettlementBacklogTable density and warnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
  });

  it("does not repeat column headers as cell sub-labels in table mode (CA-1)", () => {
    renderTable([makeRow("trips_pending")]);

    const table = screen.getByRole("table");
    const body = within(table).getAllByRole("rowgroup")[1];
    expect(body).toBeTruthy();

    // Headers appear once in thead; body must not echo field labels.
    expect(within(body!).queryByText(settlementsCopy.fields.estimatedAmount)).toBeNull();
    expect(within(body!).queryByText(settlementsCopy.fields.period)).toBeNull();
    expect(within(body!).queryByText(settlementsCopy.fields.pendingConcept)).toBeNull();
  });

  it("renders primary amount, concept badge, and Armar pago CTA (CA-2)", () => {
    renderTable([makeRow("trips_pending")]);

    expect(screen.getByText(/\$4,523\.14/)).toBeInTheDocument();
    expect(screen.getByText("3 viajes pendientes")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: settlementsCopy.workbench.actions.settlePeriod,
      }),
    ).toBeInTheDocument();
  });

  it("hides no_client_invoice surface in table and cards (CA-3)", () => {
    const row = makeRow("trips_pending", {
      warnings: ["no_client_invoice", "period_overlap"],
    });

    const { unmount } = renderTable([row], "table");
    expect(screen.queryByText("Nota de factura")).toBeNull();
    expect(
      screen.queryByText(
        /El viaje aún no tiene factura al cliente/i,
      ),
    ).toBeNull();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
    unmount();

    renderTable([row], "cards");
    expect(screen.queryByText("Nota de factura")).toBeNull();
    expect(
      screen.queryByText(
        /El viaje aún no tiene factura al cliente/i,
      ),
    ).toBeNull();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
  });

  it("keeps period_overlap and open_advance badges visible (CA-4)", () => {
    renderTable([
      makeRow("mixed", {
        warnings: ["period_overlap", "open_advance", "no_client_invoice"],
      }),
    ]);

    expect(
      screen.getByText(settlementsCopy.workbench.warnings.period_overlap),
    ).toBeInTheDocument();
    expect(
      screen.getByText(settlementsCopy.workbench.warnings.open_advance),
    ).toBeInTheDocument();
    expect(screen.queryByText("Nota de factura")).toBeNull();
  });

  it("navigates Armar pago with employee and period (CA-6)", async () => {
    const user = userEvent.setup();
    const onNavigateCreate = vi.fn();
    renderTable([makeRow("salary_close")], "table", onNavigateCreate);

    await user.click(
      screen.getByRole("button", {
        name: settlementsCopy.workbench.actions.settlePeriod,
      }),
    );

    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/employeeId=emp-1/),
    );
    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/periodStart=2026-08-17/),
    );
    expect(onNavigateCreate).toHaveBeenCalledWith(
      expect.stringMatching(/periodEnd=2026-08-23/),
    );
  });
});
