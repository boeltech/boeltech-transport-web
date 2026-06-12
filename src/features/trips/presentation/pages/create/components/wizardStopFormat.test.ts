import { describe, expect, it } from "vitest";

import { formatWizardStopAddressDisplay } from "./wizardStopFormat";
import type { TripStopFormValues } from "./validation";

function stop(
  overrides: Partial<TripStopFormValues>,
): TripStopFormValues {
  return {
    sequenceOrder: 0,
    stopType: ["origin", "pickup"],
    locationName: "Lugar",
    satCountryCode: "MEX",
    satStateCode: "QUE",
    satMunicipalityCode: "009",
    postalCode: "76343",
    ...overrides,
  } as TripStopFormValues;
}

describe("formatWizardStopAddressDisplay", () => {
  it("does not show noAddress when locationName exists with fiscal data only", () => {
    const result = formatWizardStopAddressDisplay(
      stop({
        locationName: "Corporativo Qro",
        street: undefined,
        cityName: undefined,
      }),
    );

    expect(result.showNoAddress).toBe(false);
    expect(result.streetLine).toBeNull();
    expect(result.localityLine).toBe("C.P. 76343, Municipio 009, Estado QUE");
  });

  it("shows street line when available under locationName", () => {
    const result = formatWizardStopAddressDisplay(
      stop({
        locationName: "Matriz Durango",
        street: "Av. Principal",
        exteriorNumber: "100",
      }),
    );

    expect(result.streetLine).toBe("Av. Principal #100");
    expect(result.showNoAddress).toBe(false);
  });

  it("shows noAddress only when there is no usable address data", () => {
    const result = formatWizardStopAddressDisplay(
      stop({
        locationName: "",
        street: "",
        postalCode: "",
        satStateCode: "",
        satMunicipalityCode: "",
        addressId: "",
      }),
    );

    expect(result.showNoAddress).toBe(true);
    expect(result.streetLine).toBeNull();
    expect(result.localityLine).toBeNull();
  });

  it("uses catalog placeholder when only addressId is present", () => {
    const result = formatWizardStopAddressDisplay(
      stop({
        locationName: "",
        street: "",
        postalCode: "",
        satStateCode: "",
        satMunicipalityCode: "",
        addressId: "11111111-1111-4111-8111-111111111111",
      }),
    );

    expect(result.showNoAddress).toBe(false);
    expect(result.streetLine).toBe("Domicilio en catálogo");
  });
});
