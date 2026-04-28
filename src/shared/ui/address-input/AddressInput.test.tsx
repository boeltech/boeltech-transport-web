import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import AddressInput from "./AddressInput";
import type { PostalCodeLookupResult } from "./use-postal-code-lookup";

vi.mock("./use-postal-code-lookup", () => ({
  usePostalCodeLookup: vi.fn(),
}));

vi.mock("./use-sat-catalogs", () => ({
  useSatCatalogs: vi.fn(),
}));

import { usePostalCodeLookup } from "./use-postal-code-lookup";
import { useSatCatalogs } from "./use-sat-catalogs";

type AddressFormShape = {
  address: {
    addressType: string;
    street: string;
    exteriorNumber: string;
    interiorNumber: string;
    reference: string;
    postalCode: string;
    satCountryCode: string;
    satStateCode: string;
    satMunicipalityCode: string;
    satLocalityCode: string;
    satNeighborhoodCode: string;
    neighborhoodName: string;
    latitude: number | null;
    longitude: number | null;
    isPrimary: boolean;
  };
};

function TestHarness(props: {
  onCartaPorteReadyChange?: (ready: boolean) => void;
}) {
  const form = useForm<AddressFormShape>({
    defaultValues: {
      address: {
        addressType: "billing",
        street: "",
        exteriorNumber: "",
        interiorNumber: "",
        reference: "",
        postalCode: "",
        satCountryCode: "MEX",
        satStateCode: "",
        satMunicipalityCode: "",
        satLocalityCode: "",
        satNeighborhoodCode: "",
        neighborhoodName: "",
        latitude: null,
        longitude: null,
        isPrimary: false,
      },
    },
  });

  return (
    <AddressInput
      mode="carta-porte"
      control={form.control}
      namePrefix="address"
      onCartaPorteReadyChange={props.onCartaPorteReadyChange}
      showPrimaryToggle
    />
  );
}

describe("AddressInput", () => {
  it("shows warning when SAT lookup has no complete neighborhood data", () => {
    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "44100",
        stateCode: "JAL",
        stateName: "Jalisco",
        municipalityCode: "039",
        municipalityName: "Guadalajara",
        localities: [],
        neighborhoods: [],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "JAL", name: "Jalisco" }],
      municipalities: [{ code: "039", name: "Guadalajara" }],
      neighborhoodsByPostalCode: [],
      isLoadingStates: false,
      isLoadingMunicipalities: false,
      isLoadingNeighborhoodsByPostalCode: false,
    });

    render(<TestHarness />);

    expect(
      screen.getByText(
        /si tampoco hay resultados, captura colonia manual/i,
      ),
    ).toBeInTheDocument();
  });

  it("emits carta porte readiness callback", async () => {
    const onReadyChange = vi.fn();

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "44100",
        stateCode: "JAL",
        stateName: "Jalisco",
        municipalityCode: "039",
        municipalityName: "Guadalajara",
        localities: [{ code: "01", name: "Guadalajara" }],
        neighborhoods: [{ code: "0001", name: "Moderna" }],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "JAL", name: "Jalisco" }],
      municipalities: [{ code: "039", name: "Guadalajara" }],
      neighborhoodsByPostalCode: [{ code: "0001", name: "Moderna" }],
      isLoadingStates: false,
      isLoadingMunicipalities: false,
      isLoadingNeighborhoodsByPostalCode: false,
    });

    render(<TestHarness onCartaPorteReadyChange={onReadyChange} />);

    expect(onReadyChange).toHaveBeenCalled();
  });

  it("keeps only numeric values in postal code input", async () => {
    const user = userEvent.setup();

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [],
      municipalities: [],
      neighborhoodsByPostalCode: [],
      isLoadingStates: false,
      isLoadingMunicipalities: false,
      isLoadingNeighborhoodsByPostalCode: false,
    });

    render(<TestHarness />);

    const postalCodeInput = screen.getByLabelText(/codigo postal/i);
    await user.type(postalCodeInput, "44A10B9");

    expect(postalCodeInput).toHaveValue("44109");
  });
});
