import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { resolveMapboxToSat } from "@shared/geolocation/addressResolver";

import { LocationSheet } from "./LocationSheet";
import { LOCATION_FIELD_COPY } from "./locationFieldCopy";

vi.mock("@shared/geolocation/addressResolver", () => ({
  resolveMapboxToSat: vi.fn(),
}));

vi.mock("@shared/ui/address-input/AddressGeolocationPanel", () => ({
  default: ({
    onCoordinatesChange,
  }: {
    onCoordinatesChange?: (coords: {
      latitude: number;
      longitude: number;
    }) => void;
  }) => (
    <button
      type="button"
      data-testid="geo-panel-move-pin"
      onClick={() =>
        onCoordinatesChange?.({ latitude: 25.79, longitude: -100.19 })
      }
    >
      move-pin
    </button>
  ),
}));

describe("LocationSheet H3", () => {
  beforeEach(() => {
    vi.mocked(resolveMapboxToSat).mockReset();
  });

  it("disables save while resolving SAT", async () => {
    let resolveFn!: (value: unknown) => void;
    vi.mocked(resolveMapboxToSat).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFn = resolve;
        }),
    );

    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Bodega",
          postalCode: "66600",
          street: "Av Industria",
          exteriorNumber: "120",
        }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    const save = screen.getByRole("button", { name: LOCATION_FIELD_COPY.save });
    await waitFor(() => {
      expect(save).toBeDisabled();
    });

    resolveFn({
      resolved: { satStateCode: "19", satMunicipalityCode: "006" },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    await waitFor(() => {
      expect(save).not.toBeDisabled();
    });
  });

  it("does not overwrite user neighborhood when it differs from last auto", async () => {
    const user = userEvent.setup();
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: {
        satStateCode: "19",
        satMunicipalityCode: "006",
        neighborhoodName: "Centro",
        satNeighborhoodCode: "0002",
      },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    const onSave = vi.fn();
    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Bodega",
          postalCode: "66600",
          street: "Av Industria",
          exteriorNumber: "120",
          neighborhoodName: "Parque Industrial",
          satNeighborhoodCode: "0001",
          satStateCode: "19",
          satMunicipalityCode: "006",
        }}
        onSave={onSave}
        showMap={false}
      />,
    );

    await waitFor(() => {
      expect(resolveMapboxToSat).toHaveBeenCalled();
    });

    // Change street to re-trigger resolve; neighborhood should stay user value
    await user.type(
      screen.getByLabelText(LOCATION_FIELD_COPY.streetLabel),
      " Norte",
    );

    await waitFor(() => {
      expect(resolveMapboxToSat.mock.calls.length).toBeGreaterThan(1);
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: LOCATION_FIELD_COPY.save }),
      ).not.toBeDisabled();
    });

    await user.click(
      screen.getByRole("button", { name: LOCATION_FIELD_COPY.save }),
    );

    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0]![0];
    expect(saved.neighborhoodName).toBe("Parque Industrial");
    expect(saved.satNeighborhoodCode).toBe("0001");
  });

  it("shows ambiguity alert from satAmbiguities on open", () => {
    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Draft",
          postalCode: "66600",
          satAmbiguities: ["neighborhood"],
        }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    expect(
      screen.getByText(LOCATION_FIELD_COPY.ambiguityHint),
    ).toBeInTheDocument();
    expect(LOCATION_FIELD_COPY.ambiguityHint).toMatch(/Afinar domicilio/);
  });

  it("hides pin tip when ambiguity banner is shown (D4)", () => {
    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        preferMapPin
        value={{
          locationName: "Draft",
          postalCode: "66600",
          satAmbiguities: ["neighborhood"],
        }}
        onSave={vi.fn()}
        showMap
      />,
    );

    expect(
      screen.getByText(LOCATION_FIELD_COPY.ambiguityHint),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(LOCATION_FIELD_COPY.lowConfidenceSheetHint),
    ).not.toBeInTheDocument();
  });

  it("keeps a stable SAT status slot in the DOM (D2)", () => {
    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{ locationName: "Draft" }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    expect(screen.getByTestId("location-sheet-sat-status")).toBeInTheDocument();
  });

  it("debounces SAT resolve while typing street (D3)", async () => {
    const user = userEvent.setup();
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: { satStateCode: "19", satMunicipalityCode: "006" },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Bodega",
          postalCode: "66600",
          street: "Av",
        }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    await waitFor(
      () => {
        expect(resolveMapboxToSat).toHaveBeenCalled();
      },
      { timeout: 2000 },
    );
    vi.mocked(resolveMapboxToSat).mockClear();

    await user.type(
      screen.getByLabelText(LOCATION_FIELD_COPY.streetLabel),
      "x",
    );
    expect(resolveMapboxToSat).not.toHaveBeenCalled();

    await waitFor(
      () => {
        expect(resolveMapboxToSat).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 },
    );
  });

  it("does not pass fabricated 0,0 coordinates to resolver", async () => {
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: { satStateCode: "19" },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Sin coords",
          postalCode: "66600",
        }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    await waitFor(() => {
      expect(resolveMapboxToSat).toHaveBeenCalled();
    });

    expect(vi.mocked(resolveMapboxToSat).mock.calls[0]![0].position).toBeNull();
  });

  it("saves manual accuracy after pin move (H6)", async () => {
    const user = userEvent.setup();
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: { satStateCode: "19", satMunicipalityCode: "006" },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    const onSave = vi.fn();
    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Pin",
          postalCode: "66600",
          latitude: 25.78,
          longitude: -100.18,
          geocodingAccuracy: "approximate",
        }}
        onSave={onSave}
        showMap
      />,
    );

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: LOCATION_FIELD_COPY.save }),
      ).not.toBeDisabled();
    });

    await user.click(screen.getByTestId("geo-panel-move-pin"));
    await user.click(
      screen.getByRole("button", { name: LOCATION_FIELD_COPY.save }),
    );

    expect(onSave).toHaveBeenCalled();
    const saved = onSave.mock.calls[0]![0];
    expect(saved.geocodingAccuracy).toBe("manual");
    expect(saved.latitude).toBe(25.79);
    expect(saved.longitude).toBe(-100.19);
  });

  it("shows neighborhood line without summary card or accuracy badges", async () => {
    vi.mocked(resolveMapboxToSat).mockResolvedValue({
      resolved: {
        satStateCode: "19",
        satMunicipalityCode: "006",
        neighborhoodName: "Parque Industrial",
        satNeighborhoodCode: "0001",
      },
      confidence: "high",
      ambiguities: [],
      mapboxLabel: "",
    });

    render(
      <LocationSheet
        open
        onOpenChange={vi.fn()}
        value={{
          locationName: "Bodega",
          postalCode: "66600",
          street: "Av Industria",
          exteriorNumber: "120",
          geocodingAccuracy: "approximate",
          isCartaPorteReady: true,
        }}
        onSave={vi.fn()}
        showMap={false}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/Parque Industrial/)).toBeInTheDocument();
    });

    expect(screen.getByText(LOCATION_FIELD_COPY.sheetDescription)).toBeInTheDocument();
    expect(screen.queryByText("Resumen")).not.toBeInTheDocument();
    expect(screen.queryByText("Más detalles")).not.toBeInTheDocument();
    expect(screen.queryByText("Punto aproximado")).not.toBeInTheDocument();
    expect(screen.queryByText(LOCATION_FIELD_COPY.cartaPorteReady)).not.toBeInTheDocument();
  });
});