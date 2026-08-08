import { describe, expect, it } from "vitest";
import {
  mapTenantActivationAccept,
  mapTenantActivationVerify,
} from "./mappers";

describe("tenant-activations mappers", () => {
  it("maps verify payload snake_case → camelCase", () => {
    const mapped = mapTenantActivationVerify({
      email_masked: "a***@empresa.mx",
      company_name: "Transportes Ejemplo",
      subdomain: "ejemplo",
      expires_at: "2026-08-14T18:00:00.000Z",
    });
    expect(mapped).toEqual({
      emailMasked: "a***@empresa.mx",
      companyName: "Transportes Ejemplo",
      subdomain: "ejemplo",
      expiresAt: "2026-08-14T18:00:00.000Z",
    });
  });

  it("maps accept payload", () => {
    expect(
      mapTenantActivationAccept({
        subdomain: "ejemplo",
        email_masked: "a***@empresa.mx",
      }),
    ).toEqual({
      subdomain: "ejemplo",
      emailMasked: "a***@empresa.mx",
    });
  });
});
