import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardVehicleExpenseRanking } from "./DashboardVehicleExpenseRanking";

const rows = Array.from({ length: 6 }, (_, index) => ({
  key: `vehicle-${index + 1}`,
  label: `U-00${index + 1} · AAA-00${index + 1}`,
  tripCount: index + 1,
  totalExpenses: 6000 - index * 500,
  avgExpensePerTrip: 1000,
}));

describe("DashboardVehicleExpenseRanking", () => {
  it("shows only the top five and opens unit or canonical analysis", async () => {
    const user = userEvent.setup();
    const onViewVehicle = vi.fn();
    const onViewAnalysis = vi.fn();

    render(
      <DashboardVehicleExpenseRanking
        rows={rows}
        isLoading={false}
        onViewAnalysis={onViewAnalysis}
        onViewVehicle={onViewVehicle}
      />,
    );

    expect(screen.getByText("U-001 · AAA-001")).toBeInTheDocument();
    expect(screen.queryByText("U-006 · AAA-006")).not.toBeInTheDocument();

    await user.click(screen.getByText("U-001 · AAA-001"));
    expect(onViewVehicle).toHaveBeenCalledWith("vehicle-1");

    await user.click(screen.getByRole("button", { name: "Ver análisis" }));
    expect(onViewAnalysis).toHaveBeenCalledOnce();
  });
});

