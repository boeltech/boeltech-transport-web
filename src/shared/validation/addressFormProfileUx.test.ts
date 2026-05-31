import { describe, expect, it } from "vitest";
import {
  resolveAddressFormFieldRequirements,
  resolveSharedAddressContext,
} from "./addressFormProfileUx";

describe("addressFormProfileUx", () => {
  it("maps UI contexts to SharedAddressContext", () => {
    expect(resolveSharedAddressContext({ formContext: "billingOnCreate" })).toBe(
      "billing",
    );
    expect(resolveSharedAddressContext({ formContext: "tripStop" })).toBe("trip_stop");
    expect(resolveSharedAddressContext({ formContext: "employeePersonal" })).toBe(
      "personal",
    );
  });

  it("prefers address_type over formContext default", () => {
    expect(
      resolveSharedAddressContext({
        formContext: "additional",
        addressType: "warehouse",
      }),
    ).toBe("warehouse");
    expect(
      resolveSharedAddressContext({
        formContext: "additional",
        addressType: "trip_destination",
      }),
    ).toBe("trip_stop");
  });

  it("derives street optional for CP31 carta-porte profiles", () => {
    const billing = resolveAddressFormFieldRequirements({
      formContext: "billingOnCreate",
      variant: "carta-porte",
    });
    expect(billing.requireStreetFields).toBe(false);
    expect(billing.requireCoordinates).toBe(false);
    expect(billing.requireLocationName).toBe(true);

    const trip = resolveAddressFormFieldRequirements({
      formContext: "tripStop",
      variant: "carta-porte",
    });
    expect(trip.requireStreetFields).toBe(false);
    expect(trip.requireCoordinates).toBe(true);

    const employee = resolveAddressFormFieldRequirements({
      formContext: "employeePersonal",
      variant: "personal",
    });
    expect(employee.requireStreetFields).toBe(false);
    expect(employee.requireLocationName).toBe(false);
  });

  it("requires street when context is branch and variant is carta-porte", () => {
    const req = resolveAddressFormFieldRequirements({
      addressType: "branch",
      variant: "carta-porte",
    });
    expect(req.requireStreetFields).toBe(true);
  });
});
