import { describe, expect, it } from "vitest";

import {
  composeStopLocalityLine,
  formatTripListRouteLabel,
  resolveCatalogNameByCode,
} from "./stopLocalityDisplay";

describe("composeStopLocalityLine", () => {
  it("keeps stored city and state when present", () => {
    expect(
      composeStopLocalityLine({
        city: "Monterrey",
        state: "Nuevo León",
        postalCode: "64060",
        addressId: null,
      }),
    ).toBe("Monterrey, Nuevo León, C.P. 64060");
  });

  it("resolves municipality and state from catalogs when labels are missing", () => {
    expect(
      composeStopLocalityLine(
        {
          city: "",
          state: null,
          postalCode: "64060",
          addressId: "44477840-8be1-4361-948f-ccf1f71d9fa2",
        },
        {
          municipalityName: "Monterrey",
          stateName: "Nuevo León",
        },
      ),
    ).toBe("Monterrey, Nuevo León, C.P. 64060");
  });

  it("formats bare municipality codes when catalogs are unavailable", () => {
    expect(
      composeStopLocalityLine({
        city: "039",
        state: "JAL",
        postalCode: null,
        addressId: null,
      }),
    ).toBe("Municipio 039, JAL");
  });
});

describe("formatTripListRouteLabel", () => {
  it("resolves bare municipality codes with catalog labels", () => {
    expect(
      formatTripListRouteLabel(
        {
          originCity: "039",
          originState: "JAL",
          destinationCity: "060",
          destinationState: "JAL",
        },
        {
          originMunicipalityOptions: [{ code: "JAL-039", name: "Guadalajara" }],
          destinationMunicipalityOptions: [
            { code: "JAL-060", name: "Zapopan" },
          ],
          stateOptions: [{ code: "JAL", name: "Jalisco" }],
        },
      ),
    ).toBe("Guadalajara, Jalisco → Zapopan, Jalisco");
  });
});

describe("resolveCatalogNameByCode", () => {
  it("matches short municipality codes against composite catalog codes", () => {
    expect(
      resolveCatalogNameByCode("039", [
        { code: "JAL-039", name: "Guadalajara" },
      ]),
    ).toBe("Guadalajara");
  });
});
