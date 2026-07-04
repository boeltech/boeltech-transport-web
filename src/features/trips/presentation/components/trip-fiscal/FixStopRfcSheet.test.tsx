import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { TripStop } from "@features/trips/domain";
import { FixStopRfcSheet } from "./FixStopRfcSheet";

const mutate = vi.fn();

vi.mock("@features/trips/application/hooks/usePatchStopFiscal", () => ({
  usePatchStopFiscal: () => ({
    mutate,
    isPending: false,
  }),
}));

vi.mock("@shared/permissions", () => ({
  usePermissions: () => ({
    hasPermission: () => true,
  }),
}));

vi.mock("@shared/hooks", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
  useOverlayMutationFeedback: () => ({
    submissionError: null,
    showOverlayError: vi.fn(),
    clearOverlayError: vi.fn(),
    inlineThreshold: 160,
  }),
}));

const stop: TripStop = {
  id: "stop-1",
  tenantId: "t1",
  tripId: "trip-1",
  sequenceOrder: 2,
  stopType: ["waypoint"],
  addressId: "addr-1",
  clientId: null,
  clientAddressId: "client-addr-1",
  address: "Calle 1",
  city: "Monterrey",
  state: "NL",
  postalCode: "64000",
  latitude: null,
  longitude: null,
  locationName: null,
  contactName: null,
  contactPhone: null,
  estimatedArrival: null,
  actualArrival: null,
  estimatedDeparture: null,
  actualDeparture: null,
  status: "pending",
  notes: null,
  idUbicacion: null,
  street: null,
  exteriorNumber: null,
  interiorNumber: null,
  colonia: null,
  reference: null,
  satCountryCode: null,
  satEstadoCode: null,
  satMunicipioCode: null,
  satLocalidadCode: null,
  satColoniaCode: null,
  rfcRemitenteDestinatario: "CRN140902QW3",
  nombreRemitenteDestinatario: "Cliente",
  deliveryRfcRemitenteDestinatario: null,
  deliveryNombreRemitenteDestinatario: null,
  remitentePartnerId: null,
  destinatarioPartnerId: null,
  distanceFromPreviousKm: null,
  distanceSource: null,
  distanceProvider: null,
  distanceConfidence: null,
  distanceComputedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("FixStopRfcSheet", () => {
  beforeEach(() => {
    mutate.mockClear();
  });

  it("keeps submit enabled and shows validation when RFC or reason is incomplete", async () => {
    const user = userEvent.setup();

    render(
      <FixStopRfcSheet
        tripId="trip-1"
        stop={stop}
        open
        onOpenChange={vi.fn()}
      />,
    );

    const submitButton = screen.getByRole("button", {
      name: "Validar y retimbrar",
    });
    expect(submitButton).toBeEnabled();

    await user.click(submitButton);
    expect(
      screen.getByText("El motivo debe tener al menos 5 caracteres"),
    ).toBeInTheDocument();

    const rfcInput = screen.getByLabelText("RFC remitente/destinatario");
    await user.clear(rfcInput);
    await user.type(rfcInput, "INVALID");
    await user.click(submitButton);
    expect(screen.getByText("Formato SAT inválido")).toBeInTheDocument();

    await user.clear(rfcInput);
    await user.type(rfcInput, "EKU9003173C9");
    await user.type(screen.getByLabelText("Motivo del cambio"), "12345");
    expect(submitButton).toBeEnabled();
  });

  it("shows propagation checkbox only when stop has clientAddressId", () => {
    const { rerender } = render(
      <FixStopRfcSheet
        tripId="trip-1"
        stop={stop}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.getByLabelText(
        "También actualizar el RFC en la dirección guardada del cliente",
      ),
    ).toBeInTheDocument();

    rerender(
      <FixStopRfcSheet
        tripId="trip-1"
        stop={{ ...stop, clientAddressId: null }}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText(
        "También actualizar el RFC en la dirección guardada del cliente",
      ),
    ).not.toBeInTheDocument();
  });

  it("updates reason counter while typing", async () => {
    const user = userEvent.setup();

    render(
      <FixStopRfcSheet
        tripId="trip-1"
        stop={stop}
        open
        onOpenChange={vi.fn()}
      />,
    );

    await user.type(screen.getByLabelText("Motivo del cambio"), "abcde");
    expect(screen.getByText("5/500")).toBeInTheDocument();
  });
});
