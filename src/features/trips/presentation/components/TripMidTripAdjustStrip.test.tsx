import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { tripDetailCopy } from "../copy";
import { TripMidTripAdjustStrip } from "./TripMidTripAdjustStrip";

const copy = tripDetailCopy.shell.midTripStrip;

const allLinks = [
  { id: "pending_stops" as const, tab: "route" as const },
  { id: "add_cargo" as const, tab: "cargo" as const },
  {
    id: "reassign_fleet" as const,
    tab: "overview" as const,
    openAssignFleet: true,
  },
];

describe("TripMidTripAdjustStrip (F4)", () => {
  it("renderiza título y los 3 deep-links", () => {
    render(
      <TripMidTripAdjustStrip links={allLinks} onNavigate={vi.fn()} />,
    );

    expect(screen.getByTestId("trip-mid-trip-adjust-strip")).toBeInTheDocument();
    expect(screen.getByText(copy.title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.pendingStops }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.addCargo }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: copy.reassignFleet }),
    ).toBeInTheDocument();
  });

  it("usa conteo en paradas pendientes cuando aplica", () => {
    render(
      <TripMidTripAdjustStrip
        links={[allLinks[0]]}
        pendingStopCount={2}
        onNavigate={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: copy.pendingStopsCount(2) }),
    ).toBeInTheDocument();
  });

  it("invoca onNavigate al pulsar un link", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <TripMidTripAdjustStrip links={allLinks} onNavigate={onNavigate} />,
    );

    await user.click(
      screen.getByRole("button", { name: copy.reassignFleet }),
    );
    expect(onNavigate).toHaveBeenCalledWith(allLinks[2]);
  });

  it("no monta nada sin links", () => {
    const { container } = render(
      <TripMidTripAdjustStrip links={[]} onNavigate={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
