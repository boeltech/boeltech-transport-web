import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ClientCorridor } from "@features/trips/domain";
import { TooltipProvider } from "@shared/ui/tooltip";
import { CorridorPicker } from "./CorridorPicker";
import { canvasCopy } from "../../copy/canvasCopy";

function renderPicker(ui: ReactElement): ReturnType<typeof render> {
  return render(<TooltipProvider delayDuration={0}>{ui}</TooltipProvider>);
}

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
    renderPicker(
      <CorridorPicker corridors={[]} onSelect={vi.fn()} />,
    );
    expect(screen.getByText(canvasCopy.corridor.empty)).toBeInTheDocument();
  });

  it("shows short surface hint and keeps detail in hint-icon (PD5)", () => {
    renderPicker(<CorridorPicker corridors={[corridor()]} onSelect={vi.fn()} />);
    expect(screen.getByText(canvasCopy.corridor.hint)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: canvasCopy.corridor.label }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(canvasCopy.corridor.hintDetail),
    ).not.toBeInTheDocument();
  });

  it("calls onSelect when a corridor is chosen", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = corridor();
    renderPicker(<CorridorPicker corridors={[item]} onSelect={onSelect} />);

    await user.click(
      screen.getByRole("button", { name: /CDMX, CMX → MTY, NLE/i }),
    );
    expect(onSelect).toHaveBeenCalledWith(item);
  });

  it("disables corridor buttons when disabled", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const item = corridor();
    renderPicker(
      <CorridorPicker corridors={[item]} disabled onSelect={onSelect} />,
    );

    const button = screen.getByRole("button", {
      name: /CDMX, CMX → MTY, NLE/i,
    });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows Ya no se usa chip and Volver a usar (Q21 #5)", async () => {
    const user = userEvent.setup();
    const onRestore = vi.fn();
    const stale = corridor({ corridorKey: "stale-1", destinationCity: "Saltillo" });
    renderPicker(
      <CorridorPicker
        corridors={[corridor(), stale]}
        onSelect={vi.fn()}
        staleCorridor={stale}
        staleMessage={canvasCopy.corridor.noLongerUsed("destination")}
        onRestoreStale={onRestore}
      />,
    );

    expect(screen.getByTestId("corridor-stale")).toBeInTheDocument();
    expect(
      screen.getByText(canvasCopy.corridor.noLongerUsed("destination")),
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", { name: canvasCopy.corridor.restore }),
    );
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});

