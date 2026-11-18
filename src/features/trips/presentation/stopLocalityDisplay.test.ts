import { describe, expect, it } from "vitest";

import {
  composeStopLocalityLine,
  formatTripListRouteCitiesOnly,
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

describe("formatTripListRouteCitiesOnly (F11 opción B)", () => {
  it("muestra solo ciudad; el label completo queda para tooltip", () => {
    const catalogs = {
      originMunicipalityOptions: [] as { code: string; name: string }[],
      destinationMunicipalityOptions: [] as { code: string; name: string }[],
      stateOptions: [
        { code: "NLE", name: "Nuevo León" },
        { code: "COA", name: "Coahuila de Zaragoza" },
      ],
    };
    expect(
      formatTripListRouteCitiesOnly(
        {
          originCity: "Monterrey",
          originState: "NLE",
          destinationCity: "Saltillo",
          destinationState: "COA",
        },
        catalogs,
      ),
    ).toBe("Monterrey → Saltillo");
    expect(
      formatTripListRouteLabel(
        {
          originCity: "Monterrey",
          originState: "NLE",
          destinationCity: "Saltillo",
          destinationState: "COA",
        },
        catalogs,
      ),
    ).toBe("Monterrey, Nuevo León → Saltillo, Coahuila de Zaragoza");
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
