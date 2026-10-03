import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { trackingCopy } from "../../copy";
import { STOP_TRANSITION_COPY } from "./transitionCopy";
import { DeclareFalseTripSheet } from "./DeclareFalseTripSheet";

vi.mock("@features/trips/application", () => ({
  useRegisterTrackingEvent: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@features/vehicles/application", () => ({
  useVehicle: () => ({ data: undefined, isLoading: false }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function renderSheet(
  isDriverPortal: boolean,
  tripStartMileage?: number | null,
) {
  return render(
    <MemoryRouter>
      <DeclareFalseTripSheet
        tripId="trip-1"
        tripCode="V-1"
        open
        onOpenChange={vi.fn()}
        isDriverPortal={isDriverPortal}
        tripStartMileage={tripStartMileage}
      />
    </MemoryRouter>,
  );
}

describe("DeclareFalseTripSheet", () => {
  it("staff conserva gastos + facturar y el link a Costos", () => {
    renderSheet(false);

    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripDescription),
    ).toBeInTheDocument();
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripExpensesTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: trackingCopy.sheet.declareFalseTripExpensesCta,
      }),
    ).toHaveAttribute("href", "/trips/trip-1?tab=costs");
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripEffectInvoice),
    ).toBeInTheDocument();
    expect(
      screen.getByText(STOP_TRANSITION_COPY.declareFalseTrip),
    ).toBeInTheDocument();
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripMileagePaymentHint),
    ).toBeInTheDocument();
  });

  it("driver declara sin facturar ni link a Costos (D12)", () => {
    renderSheet(true);

    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripDescriptionDriver),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(trackingCopy.sheet.declareFalseTripExpensesTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", {
        name: trackingCopy.sheet.declareFalseTripExpensesCta,
      }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/facturar/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Dinero del viaje|\bCostos\b/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\?tab=costs/i)).not.toBeInTheDocument();
    expect(
      screen.getAllByText(STOP_TRANSITION_COPY.declareFalseTripDriver).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripMileagePaymentHintDriver),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(trackingCopy.sheet.declareFalseTripMileagePaymentHint),
    ).not.toBeInTheDocument();
  });

  it("muestra Alert de km sin recorrido cuando end === start", () => {
    renderSheet(false, 150_000);

    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripZeroKmTitle),
    ).toBeInTheDocument();
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripZeroKmBody),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: trackingCopy.action.declareFalseTrip,
      }),
    ).toBeEnabled();
  });

  it("sin tripStartMileage no muestra Alert de delta 0", () => {
    renderSheet(false, null);

    expect(
      screen.queryByText(trackingCopy.sheet.declareFalseTripZeroKmTitle),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(trackingCopy.sheet.declareFalseTripMileagePaymentHint),
    ).toBeInTheDocument();
  });
});
