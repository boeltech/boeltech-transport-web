import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TripListItem } from "@features/trips/domain";
import { tripInvoicingFixture } from "@features/trips/test/tripInvoicingFixture";
import { InvoiceableTripPickerSheet } from "./InvoiceableTripPickerSheet";

const mockUseTrips = vi.fn();

vi.mock("@features/trips/application", () => ({
  useTrips: (...args: unknown[]) => mockUseTrips(...args),
}));

const trip: TripListItem = {
  id: "trip-1",
  tripCode: "VJ-2026-001",
  vehicle: {
    id: "v1",
    unitNumber: "T-01",
    licensePlate: "ABC123",
  },
  driver: {
    id: "d1",
    fullName: "Juan Pérez",
  },
  client: {
    id: "c1",
    legalName: "Transportes Demo SA",
  },
  originCity: "Guadalajara",
  originState: "JAL",
  destinationCity: "CDMX",
  destinationState: "CMX",
  scheduledDeparture: new Date("2026-05-10T12:00:00.000Z"),
  scheduledArrival: new Date("2026-05-11T08:00:00.000Z"),
  status: "completed",
  cargoDescription: "Carga general",
  baseRate: 15000,
  totalCost: 8000,
  totalRevenue: 15000,
  estimatedProfit: 7000,
  cargoCount: 1,
  clientCount: 1,
  invoicing: tripInvoicingFixture({
    canGenerateInvoice: true,
  }),
  requiresFiscalAttention: false,
  createdAt: new Date(),
};

describe("InvoiceableTripPickerSheet", () => {
  beforeEach(() => {
    mockUseTrips.mockReturnValue({
      data: {
        data: [trip],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    });
  });

  it("requests invoiceable trips when open", () => {
    render(
      <InvoiceableTripPickerSheet
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(mockUseTrips).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.objectContaining({ invoiceableOnly: true }),
      }),
      expect.objectContaining({ enabled: true }),
    );
    expect(screen.getByText("VJ-2026-001")).toBeInTheDocument();
  });

  it("shows empty state when no trips", () => {
    mockUseTrips.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    });

    render(
      <InvoiceableTripPickerSheet
        open
        onOpenChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByText("No hay viajes facturables en este momento."),
    ).toBeInTheDocument();
  });

  it("calls onSelect with trip id", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <InvoiceableTripPickerSheet
        open
        onOpenChange={onOpenChange}
        onSelect={onSelect}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Facturar" }));

    expect(onSelect).toHaveBeenCalledWith("trip-1");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
