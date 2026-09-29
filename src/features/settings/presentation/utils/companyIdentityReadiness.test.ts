import { describe, expect, it } from "vitest";

import { isCompanyIdentityReady } from "./companyIdentityReadiness";

const ready = {
  legalName: "Transportes ABC S.A. de C.V.",
  rfc: "TAB123456XYZ",
  regimenFiscal: "601",
  lugarExpedicion: "03100",
  fiscalAddress: { postalCode: "03100" },
};

describe("isCompanyIdentityReady", () => {
  it("acepta RFC, razón, régimen y CP de 5 dígitos", () => {
    expect(isCompanyIdentityReady(ready)).toBe(true);
  });

  it("falla si falta identidad o el CP", () => {
    expect(isCompanyIdentityReady({ ...ready, rfc: "" })).toBe(false);
    expect(isCompanyIdentityReady({ ...ready, legalName: "  " })).toBe(false);
    expect(isCompanyIdentityReady({ ...ready, regimenFiscal: null })).toBe(
      false,
    );
    expect(
      isCompanyIdentityReady({
        ...ready,
        fiscalAddress: null,
        lugarExpedicion: "",
        legacyCompanyAddress: null,
      }),
    ).toBe(false);
  });
});
