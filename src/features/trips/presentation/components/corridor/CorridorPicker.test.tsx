import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ClientCorridor } from "@features/trips/domain";
import { CorridorPicker } from "./CorridorPicker";
import { canvasCopy } from "../../copy/canvasCopy";

function corridor(
  overrides: Partial<ClientCorridor> = {},
): ClientCorridor {
  return {
    corridorKey: "key-1",
    originCity: "CDMX",
    originState: "CMX",
    destinationCity: "MTY",
    destinationState: "NLE",
    stopCount: 2,
    tripCount: 12,
    lastUsedAt: "2026-08-10T18:00:00.000Z",
    sampleTripId: "trip-1",
    stopsSnapshot: [],
    ...overrides,
  };
}

describe("CorridorPicker", () => {
  it("shows empty copy when there are no corridors", () => {
    render(
      <CorridorPicker corridors={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(canvasCopy.corridor.empty)).toBeInTheDocument();
  });

  it("shows clone hint when corridors are listed", () => {
    render(<CorridorPicker corridors={[corridor()]} onSelect={vi.fn()} />);
    expect(screen.getByText(canvasCopy.corridor.hint)).toBeInTheDocument();
  });

  it("calls onSelect when a corridor is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = corridor();
    render(<CorridorPicker corridors={[item]} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: /CDMX, CMX → MTY, NLE/i }),
    );
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it("disables corridor buttons when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = corridor();
    render(
      <CorridorPicker corridors={[item]} disabled onSelect={onSelect} />,
    );

    const button = screen.getByRole("button", {
      name: /CDMX, CMX → MTY, NLE/i,
    });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
