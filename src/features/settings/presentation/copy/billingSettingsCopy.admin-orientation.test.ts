import { describe, expect, it } from "vitest";

import { billingSettingsCopy } from "./billingSettingsCopy";

describe("billingSettingsCopy.adminOrientation", () => {
  it("enseña sello y numeración, no Stripe ni esquemas", () => {
    const copy = billingSettingsCopy.adminOrientation;
    expect(copy.body).toMatch(/sello/i);
    expect(copy.body).toMatch(/folio|serie|numeración/i);
    expect(copy.body).not.toMatch(/Stripe|esquema|PAC|Tu plan/i);
    expect(copy.identityMissing).toMatch(/RFC/i);
    expect(copy.identityLink).toBe("Ir a General");
  });
});
