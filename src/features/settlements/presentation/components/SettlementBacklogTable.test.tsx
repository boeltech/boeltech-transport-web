import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
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

function makeRow(rowType: SettlementBacklogRowType): SettlementBacklogRow {
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
  };
}

function renderTable(rows: readonly SettlementBacklogRow[]) {
  return render(
    <TooltipProvider delayDuration={0}>
      <SettlementBacklogTable
        rows={rows}
        isLoading={false}
        viewMode="table"
        onNavigateCreate={vi.fn()}
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
