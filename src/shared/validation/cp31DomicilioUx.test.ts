import { describe, expect, it } from "vitest";
import { getCp31DomicilioConditionalRequirements } from "@boeltech/cfdi-domain/reglas/address-readiness";

import { getCp31DomicilioUxRequirements } from "./cp31DomicilioUx";

describe("cp31DomicilioUx (alineado a cfdi-domain XSD)", () => {
  const cp31 = getCp31DomicilioConditionalRequirements();

  it("carta-porte y personal usan obligatoriedad XSD CP31", () => {
    for (const variant of ["personal", "carta-porte"] as const) {
      const req = getCp31DomicilioUxRequirements(variant);
      expect(req.requireMunicipality).toBe(cp31.require_municipality);
      expect(req.requireLocality).toBe(cp31.require_locality);
      expect(req.requireNeighborhood).toBe(cp31.require_neighborhood);
      expect(req.recommendMunicipality).toBe(true);
    }
  });
});
