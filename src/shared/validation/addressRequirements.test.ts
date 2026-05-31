import { describe, expect, it } from "vitest";

import { getCp31DomicilioUxRequirements, isCp31DomicilioReady } from "./addressRequirements";

describe("addressRequirements (carta-porte / personal = XSD CP31)", () => {
  it("personal no exige municipio", () => {
    const req = getCp31DomicilioUxRequirements("personal");
    expect(req.requireMunicipality).toBe(false);
    expect(req.recommendMunicipality).toBe(true);
  });

  it("carta-porte no exige municipio/localidad/colonia (XSD)", () => {
    const req = getCp31DomicilioUxRequirements("carta-porte");
    expect(req.requireMunicipality).toBe(false);
    expect(req.requireLocality).toBe(false);
    expect(req.requireNeighborhood).toBe(false);
    expect(req.recommendMunicipality).toBe(true);
  });

  it("is ready with país/estado/CP when lookup succeeded (sin localidad/colonia)", () => {
    const ready = isCp31DomicilioReady({
      variant: "carta-porte",
      satCountryCode: "MEX",
      satStateCode: "JAL",
      postalCode: "44100",
      postalLookupStatus: "success",
    });
    expect(ready).toBe(true);
  });

  it("personal no exige gate de lookup de CP", () => {
    const ready = isCp31DomicilioReady({
      variant: "personal",
      satCountryCode: "MEX",
      satStateCode: "JAL",
      postalCode: "44100",
      postalLookupStatus: "idle",
    });
    expect(ready).toBe(true);
  });
});
