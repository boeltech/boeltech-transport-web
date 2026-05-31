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
    localityName: string;
    satNeighborhoodCode: string;
    neighborhoodName: string;
    latitude: number | null;
    longitude: number | null;
    isPrimary: boolean;
  };
};

function TestHarness(props: {
  onCartaPorteReadyChange?: (ready: boolean) => void;
  initialAddress?: Partial<AddressFormShape["address"]>;
  formContext?: "billingOnCreate";
  addressType?: string;
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
        localityName: "",
        satNeighborhoodCode: "",
        neighborhoodName: "",
        latitude: null,
        longitude: null,
        isPrimary: false,
        ...props.initialAddress,
      },
    },
  });

  return (
    <AddressInput
      variant="carta-porte"
      formContext={props.formContext}
      addressType={props.addressType}
      control={form.control}
      namePrefix="address"
      onCartaPorteReadyChange={props.onCartaPorteReadyChange}
      showPrimaryToggle
    />
  );
}

describe("AddressInput", () => {
  it("sin colonias en lookup: guía por placeholder manual, sin banner de validación", () => {
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
      screen.getByPlaceholderText(/captura colonia manual/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/si tampoco hay resultados, captura colonia manual/i),
    ).not.toBeInTheDocument();
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

  it("keeps carta porte readiness false while SAT lookup is loading", () => {
    const onReadyChange = vi.fn();

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: undefined,
      isLoading: true,
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

    render(<TestHarness onCartaPorteReadyChange={onReadyChange} />);

    expect(onReadyChange).toHaveBeenCalled();
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("shows catalog colonia select and manual input when lookup has neighborhoods", () => {
    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "44100",
        stateCode: "JAL",
        stateName: "Jalisco",
        municipalityCode: "039",
        municipalityName: "Guadalajara",
        localities: [],
        neighborhoods: [{ code: "0001", name: "Moderna" }],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "JAL", name: "Jalisco" }],
      municipalities: [{ code: "JAL-039", name: "Guadalajara" }],
      neighborhoodsByPostalCode: [{ code: "0001", name: "Moderna" }],
      isLoadingStates: false,
      isLoadingMunicipalities: false,
      isLoadingNeighborhoodsByPostalCode: false,
    });

    render(
      <TestHarness
        initialAddress={{
          postalCode: "44100",
          satStateCode: "JAL",
          satMunicipalityCode: "039",
          neighborhoodName: "Colonia capturada manual",
        }}
      />,
    );

    expect(screen.getByDisplayValue("Colonia capturada manual")).toBeInTheDocument();
    expect(screen.getByText(/selecciona colonia/i)).toBeInTheDocument();
  });

  it("always shows manual locality input even when lookup has no localities", () => {
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

    expect(screen.getByPlaceholderText(/captura localidad manual/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/captura colonia manual/i)).toBeInTheDocument();
  });

  it("does not mark street as required in carta-porte billing profile", () => {
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

    render(
      <TestHarness
        formContext="billingOnCreate"
        addressType="billing"
      />,
    );

    const streetLabel = document.querySelector('label[for="address-street"]');
    expect(streetLabel?.textContent?.trim()).toBe("Calle");
    expect(streetLabel?.textContent).not.toMatch(/\*/);
  });

  it("marks street as required for branch context with carta-porte variant", () => {
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

    function BranchHarness() {
      const form = useForm<AddressFormShape>({
        defaultValues: {
          address: {
            addressType: "branch",
            street: "",
            exteriorNumber: "",
            interiorNumber: "",
            reference: "",
            postalCode: "",
            satCountryCode: "MEX",
            satStateCode: "",
            satMunicipalityCode: "",
            satLocalityCode: "",
            localityName: "",
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
          variant="carta-porte"
          addressType="branch"
          control={form.control}
          namePrefix="address"
          showPrimaryToggle
        />
      );
    }

    render(<BranchHarness />);
    expect(screen.getByText(/^Calle \*$/)).toBeInTheDocument();
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
