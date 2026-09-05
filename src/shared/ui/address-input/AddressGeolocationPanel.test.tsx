import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { executeGeocode } = vi.hoisted(() => ({
  executeGeocode: vi.fn(),
}));

vi.mock("@shared/config", () => ({
  config: {
    geolocation: {
      mapboxPublicToken: "test-token",
    },
  },
}));

vi.mock("@shared/geolocation/useCoordinatesPostalCodeWarningValues", () => ({
  useCoordinatesPostalCodeWarningValues: () => null,
}));

vi.mock("@shared/geolocation/CoordinatesPostalCodeWarningAlert", () => ({
  CoordinatesPostalCodeWarningAlert: () => null,
}));

vi.mock("@shared/geolocation/coordinatesPostalCodeWarningCopy", () => ({
  coordinatesPostalCodeWarningCopy: {},
}));

vi.mock("./AddressGeolocationMap", () => ({
  AddressGeolocationMap: ({
    onCoordinatesChange,
  }: {
    onCoordinatesChange?: (coords: { latitude: number; longitude: number }) => void;
  }) => (
    <div data-testid="address-geolocation-map">
      <button
        type="button"
        data-testid="simulate-map-drag"
        onClick={() =>
          onCoordinatesChange?.({ latitude: 19.4321, longitude: -99.1332 })
        }
      >
        Simular arrastre
      </button>
    </div>
  ),
}));

vi.mock("@shared/geolocation", () => ({
  createGeoProviderBundle: () => ({
    providerId: "stub",
    geocodingProvider: {},
    distanceMatrixProvider: {},
  }),
  ResolveStopGeolocationUseCase: class {
    execute = executeGeocode;
  },
  CalculateSegmentDistanceUseCase: class {
    execute = vi.fn();
  },
}));

import { AddressGeolocationPanel } from "./AddressGeolocationPanel";
import {
  AddressGeocodingSectionContent,
  GEOCODING_REQUIRED_HINT,
} from "./AddressGeocodingFormSection";

const emptyAddress = {
  street: "",
  postalCode: "",
};

const readyAddress = {
  street: "Av. Reforma",
  postalCode: "06600",
  exteriorNumber: "222",
};

describe("AddressGeolocationPanel — mapa bajo demanda (D1–D5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    executeGeocode.mockResolvedValue({
      ok: true as const,
      data: {
        candidates: [
          {
            label: "Calle 1",
            position: { latitude: 19.4, longitude: -99.1 },
            confidence: "high" as const,
            provider: "stub" as const,
          },
        ],
      },
    });
  });

  it("en contexto opcional vacío no muestra mapa ni badge «Sin ubicación…»", () => {
    render(
      <AddressGeolocationPanel
        address={emptyAddress}
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("address-geolocation-map")).not.toBeInTheDocument();
    expect(screen.queryByText("Sin ubicación en el mapa")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ubicar en el mapa" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mostrar mapa" })).toBeInTheDocument();
    expect(screen.getByText(/Completa al menos CP y calle/)).toBeInTheDocument();
    expect(screen.getByText("Más opciones")).toBeInTheDocument();
  });

  it("muestra badge «Listo para ubicar» sin mapa letterbox hasta revelar", () => {
    render(
      <AddressGeolocationPanel
        address={readyAddress}
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Listo para ubicar")).toBeInTheDocument();
    expect(screen.queryByTestId("address-geolocation-map")).not.toBeInTheDocument();
  });

  it("revela el mapa al pulsar «Mostrar mapa»", async () => {
    const user = userEvent.setup();
    render(
      <AddressGeolocationPanel
        address={readyAddress}
        onCoordinatesChange={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Mostrar mapa" }));
    expect(screen.getByTestId("address-geolocation-map")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mostrar mapa" })).not.toBeInTheDocument();
  });

  it("con coordenadas muestra mapa y badge confirmado", () => {
    render(
      <AddressGeolocationPanel
        address={readyAddress}
        latitude={19.4}
        longitude={-99.1}
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("address-geolocation-map")).toBeInTheDocument();
    expect(screen.getByText("Ubicación confirmada")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mostrar mapa" })).not.toBeInTheDocument();
  });

  it("en contexto requerido siempre muestra mapa y badge vacío", () => {
    render(
      <AddressGeolocationPanel
        address={emptyAddress}
        required
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("address-geolocation-map")).toBeInTheDocument();
    expect(screen.getByText("Sin ubicación en el mapa")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mostrar mapa" })).not.toBeInTheDocument();
  });

  it("confirmationMode oculta «Más opciones» y mantiene el mapa", () => {
    render(
      <AddressGeolocationPanel
        address={readyAddress}
        confirmationMode
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("address-geolocation-map")).toBeInTheDocument();
    expect(screen.queryByText("Más opciones")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ubicar con la dirección" })).toBeInTheDocument();
  });

  it("al arrastrar el pin limpia coincidencias y no vuelve a «Elige una coincidencia»", async () => {
    const user = userEvent.setup();
    const onCoordinatesChange = vi.fn();
    executeGeocode.mockResolvedValue({
      ok: true as const,
      data: {
        candidates: [
          {
            label: "Calle Doroteo Arango 80",
            position: { latitude: 19.49, longitude: -99.18 },
            confidence: "high" as const,
            provider: "stub" as const,
          },
          {
            label: "Calle Doroteo Arango 120",
            position: { latitude: 19.491, longitude: -99.175 },
            confidence: "medium" as const,
            provider: "stub" as const,
          },
        ],
      },
    });

    const { rerender } = render(
      <AddressGeolocationPanel
        address={readyAddress}
        onCoordinatesChange={onCoordinatesChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Ubicar en el mapa" }));
    expect(await screen.findByText("Elige una coincidencia")).toBeInTheDocument();
    expect(screen.getByText("Coincidencias sugeridas")).toBeInTheDocument();

    await user.click(screen.getByTestId("simulate-map-drag"));
    expect(onCoordinatesChange).toHaveBeenCalledWith({
      latitude: 19.4321,
      longitude: -99.1332,
    });

    rerender(
      <AddressGeolocationPanel
        address={readyAddress}
        latitude={19.4321}
        longitude={-99.1332}
        onCoordinatesChange={onCoordinatesChange}
      />,
    );

    expect(screen.queryByText("Elige una coincidencia")).not.toBeInTheDocument();
    expect(screen.queryByText("Coincidencias sugeridas")).not.toBeInTheDocument();
    expect(screen.getByText("Ubicación confirmada")).toBeInTheDocument();
  });
});

describe("AddressGeocodingSectionContent — copy (D2/D6)", () => {
  it("no renderiza hint por defecto en opcional", () => {
    render(
      <AddressGeocodingSectionContent
        address={emptyAddress}
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByText(/Opcional\. Usa «Ubicar en el mapa»/),
    ).not.toBeInTheDocument();
  });

  it("renderiza hint corto cuando required", () => {
    render(
      <AddressGeocodingSectionContent
        address={emptyAddress}
        required
        geolocationRequired
        onCoordinatesChange={vi.fn()}
      />,
    );

    expect(screen.getByText(GEOCODING_REQUIRED_HINT)).toBeInTheDocument();
    expect(screen.getByTestId("address-geolocation-map")).toBeInTheDocument();
  });
});
