import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { trackingCopy } from "../../copy";
import { RegisterTripArrivalSheet } from "./RegisterTripArrivalSheet";

vi.mock("@features/trips/application", () => ({
  useRegisterTrackingEvent: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderSheet(isDriverPortal = false) {
  return render(
    <RegisterTripArrivalSheet
      tripId="trip-1"
      tripCode="V-1"
      tripStartMileage={150_000}
      plannedDistanceKm={120}
      open
      onOpenChange={vi.fn()}
      isDriverPortal={isDriverPortal}
    />,
  );
}

function typeEndMileage(value: string) {
  fireEvent.change(screen.getByLabelText(trackingCopy.label.endMileage), {
    target: { value },
  });
}

describe("RegisterTripArrivalSheet — aviso de 0 km", () => {
  it("avisa cuando el km final es igual al de salida, sin bloquear", () => {
    renderSheet();
    typeEndMileage("150000");

    expect(screen.getByText(trackingCopy.sheet.closeZeroKmTitle)).toBeInTheDocument();
    expect(screen.getByText(trackingCopy.sheet.closeZeroKmBody)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: trackingCopy.action.close })).toBeEnabled();
  });

  it("no avisa con km final mayor al de salida", () => {
    renderSheet();
    typeEndMileage("150120");

    expect(screen.queryByText(trackingCopy.sheet.closeZeroKmTitle)).not.toBeInTheDocument();
  });

  it("conductor ve el aviso sin mencionar la liquidación", () => {
    renderSheet(true);
    typeEndMileage("150000");

    expect(
      screen.getByText(trackingCopy.sheet.closeZeroKmTitleDriver),
    ).toBeInTheDocument();
    expect(screen.getByText(trackingCopy.sheet.closeZeroKmBodyDriver)).toBeInTheDocument();
    expect(screen.queryByText(trackingCopy.sheet.closeZeroKmBody)).not.toBeInTheDocument();
  });
});
