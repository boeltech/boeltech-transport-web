import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripDetailCopy } from "../../copy";
import { TripNextStepBlock } from "./TripNextStepBlock";

const copy = tripDetailCopy.shell.nextStep;

describe("TripNextStepBlock", () => {
  it("renders one primary and up to two secondaries for draft incomplete", async () => {
    const user = userEvent.setup();
    const onNavigateTab = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "draft_incomplete",
          primary: { id: "complete_route_cargo", tab: "route" },
          secondaries: [{ id: "go_to_cargo", tab: "cargo" }],
        }}
        onNavigateTab={onNavigateTab}
      />,
    );

    expect(screen.getByTestId("trip-next-step-block")).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: copy.completeRouteCargo }),
    );
    expect(onNavigateTab).toHaveBeenCalledWith("route");
  });

  it("Programado billable: Facturar primary + Seguimiento secondary", async () => {
    const user = userEvent.setup();
    const onInvoice = vi.fn();
    const onNavigateTab = vi.fn();
    render(
      <TripNextStepBlock
        plan={{
          phase: "scheduled",
          primary: { id: "invoice" },
          secondaries: [{ id: "go_to_tracking", tab: "tracking" }],
        }}
        onNavigateTab={onNavigateTab}
        onInvoice={onInvoice}
      />,
    );

    await user.click(screen.getByRole("button", { name: copy.invoice }));
    expect(onInvoice).toHaveBeenCalledOnce();
    await user.click(screen.getByRole("button", { name: copy.goToTracking }));
    expect(onNavigateTab).toHaveBeenCalledWith("tracking");
  });
});
