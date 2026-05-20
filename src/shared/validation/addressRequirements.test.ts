import { describe, expect, it } from "vitest";

import type { PostalCodeLookupResult } from "@shared/ui/address-input/use-postal-code-lookup";
import {
  getAddressRequirementsFromPostalLookup,
  isAddressReadyForMode,
} from "./addressRequirements";

const lookup44100: PostalCodeLookupResult = {
  postalCode: "44100",
  found: true,
  stateCode: "JAL",
  stateName: "Jalisco",
  municipalityCode: "039",
  municipalityName: "Guadalajara",
  localities: [{ code: "01", name: "Guadalajara" }],
  neighborhoods: [{ code: "0441", name: "Americana" }],
};

describe("addressRequirements (CP condicional)", () => {
  it("requires municipality/locality/neighborhood for carta-porte when lookup has them", () => {
    const req = getAddressRequirementsFromPostalLookup(lookup44100, "carta-porte");
    expect(req.requireMunicipality).toBe(true);
    expect(req.requireLocality).toBe(true);
    expect(req.requireNeighborhood).toBe(true);
  });

  it("is not ready until locality/neighborhood filled when required", () => {
    const ready = isAddressReadyForMode(
      {
        mode: "carta-porte",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        postalCode: "44100",
        postalLookupStatus: "success",
      },
      lookup44100,
    );
    expect(ready).toBe(false);

    const readyFull = isAddressReadyForMode(
      {
        mode: "carta-porte",
        satCountryCode: "MEX",
        satStateCode: "JAL",
        satMunicipalityCode: "039",
        satLocalityCode: "01",
        satNeighborhoodCode: "0441",
        postalCode: "44100",
        postalLookupStatus: "success",
      },
      lookup44100,
    );
    expect(readyFull).toBe(true);
  });
});
