import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@shared/hooks", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@features/trips/application", () => ({
  useCreateTrip: () => ({ mutateAsync: vi.fn(), isPending: false }),
  useClientCorridors: () => ({ data: [], isLoading: false }),
  useRouteEstimate: () => ({ data: null }),
  useTrips: () => ({ data: { data: [] } }),
  TripCreationError: class TripCreationError extends Error {},
}));

vi.mock("@features/vehicles/application", () => ({
  useAssignableVehicles: () => ({ data: [], isLoading: false }),
}));

vi.mock("@features/drivers/application", () => ({
  useDrivers: () => ({ data: { data: [] }, isLoading: false }),
}));

vi.mock("@features/clients/application", () => ({
  useActiveClients: () => ({ data: [], isLoading: false }),
}));

vi.mock("./components/ReservePedidoStep", () => ({
  ReservePedidoStep: ({ afterClient }: { afterClient?: unknown }) => (
    <div>
      <div>pedido-step</div>
      {afterClient}
    </div>
  ),
}));

vi.mock("./components/ReserveAsignarStep", () => ({
  ReserveAsignarStep: () => <div>flota-step</div>,
}));

import { TripCanvasPage } from "./TripCanvasPage";
import { canvasCopy } from "../../copy/canvasCopy";

describe("TripCanvasPage", () => {
  it("renders a one-screen canvas without wizard steps", () => {
    render(
      <MemoryRouter>
        <TripCanvasPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: canvasCopy.page.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(canvasCopy.columns.pedido)).toBeInTheDocument();
    expect(screen.getByText(canvasCopy.columns.flota)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: canvasCopy.submit.label })).toBeInTheDocument();
    expect(screen.getByText(canvasCopy.confirmLater.title)).toBeInTheDocument();
    expect(screen.queryByText(/Siguiente/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Pasos para crear/i)).not.toBeInTheDocument();
  });
});
