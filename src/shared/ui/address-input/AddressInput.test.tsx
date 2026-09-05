import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AddressInput from "./AddressInput";
import type { PostalCodeLookupResult } from "./use-postal-code-lookup";

beforeEach(() => {
  // cmdk desplaza el item activo; jsdom no implementa scrollIntoView.
  Element.prototype.scrollIntoView = vi.fn();
});

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
      setValue={form.setValue}
      namePrefix="address"
      onCartaPorteReadyChange={props.onCartaPorteReadyChange}
      showPrimaryToggle
    />
  );
}

describe("AddressInput", () => {
  it("sin colonias en lookup: muestra combobox unificado, sin banner de validación", () => {
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

    expect(screen.getByRole("combobox", { name: /^colonia$/i })).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/captura colonia manual/i),
    ).not.toBeInTheDocument();
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

  it("shows unified colonia combobox with free-text displayName when lookup has neighborhoods", () => {
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

    const colonia = screen.getByRole("combobox", { name: /^colonia$/i });
    expect(colonia).toHaveTextContent("Colonia capturada manual");
    expect(
      screen.queryByPlaceholderText(/captura colonia manual/i),
    ).not.toBeInTheDocument();
  });

  it("commits free-text colonia and clears catalog code via unified combobox", async () => {
    const user = userEvent.setup();

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "44100",
        stateCode: "JAL",
        stateName: "Jalisco",
        municipalityCode: "039",
        municipalityName: "Guadalajara",
        localities: [],
        neighborhoods: [
          { code: "0001", name: "Moderna" },
          { code: "0002", name: "Centro" },
        ],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "JAL", name: "Jalisco" }],
      municipalities: [{ code: "JAL-039", name: "Guadalajara" }],
      neighborhoodsByPostalCode: [],
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
          satNeighborhoodCode: "0001",
          neighborhoodName: "Moderna",
        }}
      />,
    );

    const catalog = screen.getByRole("combobox", { name: /^colonia$/i });
    expect(catalog).toHaveTextContent("Moderna");

    await user.click(catalog);
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Ab Libre");
    await user.click(screen.getByText(/usar “ab libre” como texto libre/i));

    expect(catalog).toHaveTextContent("Ab Libre");
  });

  it("filters colonia combobox options by search text", async () => {
    const user = userEvent.setup();

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "44100",
        stateCode: "JAL",
        stateName: "Jalisco",
        municipalityCode: "039",
        municipalityName: "Guadalajara",
        localities: [],
        neighborhoods: [
          { code: "0001", name: "Moderna" },
          { code: "0003", name: "Francisco Zarco" },
        ],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "JAL", name: "Jalisco" }],
      municipalities: [{ code: "JAL-039", name: "Guadalajara" }],
      neighborhoodsByPostalCode: [],
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
        }}
      />,
    );

    await user.click(screen.getByRole("combobox", { name: /^colonia$/i }));
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "zarco");

    expect(screen.getByText("Francisco Zarco")).toBeInTheDocument();
    expect(screen.queryByText("Moderna")).not.toBeInTheDocument();
  });

  it("selects Real Solare with full catalog code and hides other-CP colonias", async () => {
    const user = userEvent.setup();
    let latest: AddressFormShape["address"] | null = null;

    function CaptureHarness() {
      const form = useForm<AddressFormShape>({
        defaultValues: {
          address: {
            addressType: "billing",
            street: "",
            exteriorNumber: "",
            interiorNumber: "",
            reference: "",
            postalCode: "76246",
            satCountryCode: "MEX",
            satStateCode: "QUE",
            satMunicipalityCode: "011",
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
      latest = form.watch("address");
      return (
        <AddressInput
          variant="carta-porte"
          control={form.control}
          setValue={form.setValue}
          namePrefix="address"
          showPrimaryToggle
        />
      );
    }

    vi.mocked(usePostalCodeLookup).mockReturnValue({
      data: {
        found: true,
        postalCode: "76246",
        stateCode: "QUE",
        stateName: "Querétaro",
        municipalityCode: "011",
        municipalityName: "El Marqués",
        localities: [],
        neighborhoods: [
          { code: "76240-0001", name: "Santa Rita" },
          { code: "76246-0042", name: "Real Solare" },
        ],
      } satisfies PostalCodeLookupResult,
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof usePostalCodeLookup>);

    vi.mocked(useSatCatalogs).mockReturnValue({
      countries: [{ code: "MEX", name: "Mexico" }],
      states: [{ code: "QUE", name: "Querétaro" }],
      municipalities: [{ code: "QUE-011", name: "El Marqués" }],
      neighborhoodsByPostalCode: [],
      isLoadingStates: false,
      isLoadingMunicipalities: false,
      isLoadingNeighborhoodsByPostalCode: false,
    });

    render(<CaptureHarness />);

    const catalog = screen.getByRole("combobox", { name: /^colonia$/i });
    await user.click(catalog);
    await user.type(screen.getByPlaceholderText(/buscar colonia/i), "Real So");

    expect(screen.getByText("Real Solare")).toBeInTheDocument();
    expect(screen.queryByText("Santa Rita")).not.toBeInTheDocument();

    await user.click(screen.getByText("Real Solare"));

    expect(catalog).toHaveTextContent("Real Solare");
    expect(latest?.satNeighborhoodCode).toBe("76246-0042");
    expect(latest?.neighborhoodName).toBe("Real Solare");
  });

  it("always shows locality and colonia comboboxes even when lookup has no catalog rows", () => {
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

    expect(screen.getByRole("combobox", { name: /^localidad$/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /^colonia$/i })).toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/captura localidad manual/i),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByPlaceholderText(/captura colonia manual/i),
    ).not.toBeInTheDocument();
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
          setValue={form.setValue}
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

    const postalCodeInput = screen.getByLabelText(/código postal/i);
    await user.type(postalCodeInput, "44A10B9");

    expect(postalCodeInput).toHaveValue("44109");
  });
});
