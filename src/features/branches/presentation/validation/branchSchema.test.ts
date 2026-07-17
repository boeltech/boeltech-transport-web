import { describe, expect, it } from "vitest";
import { BranchStatus } from "../../domain";
import {
  branchFormSchema,
  branchFormToCreateDTO,
  branchFormToUpdateDTO,
  defaultBranchFormValues,
} from "./branchSchema";
import { defaultBranchOperationalAddressValues } from "./branchOperationalAddressSchema";

const validAddress = {
  ...defaultBranchOperationalAddressValues,
  street: "Av. Principal",
  exteriorNumber: "100",
  postalCode: "64000",
  satStateCode: "19",
};

describe("branchFormSchema", () => {
  it("accepts valid form data with nested address", () => {
    const result = branchFormSchema.safeParse({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal Monterrey",
      address: validAddress,
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = branchFormSchema.safeParse({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal Monterrey",
      address: validAddress,
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });
});

describe("branchFormToCreateDTO", () => {
  it("maps nested address to API payload", () => {
    const dto = branchFormToCreateDTO({
      code: " MTY-01 ",
      name: " Sucursal Monterrey ",
      status: BranchStatus.ACTIVE,
      isMain: true,
      address: {
        ...validAddress,
        interiorNumber: null,
        neighborhoodName: "",
      },
      phone: "",
      email: "",
      managerName: "",
      notes: "",
    });

    expect(dto).toEqual({
      code: "MTY-01",
      name: "Sucursal Monterrey",
      status: BranchStatus.ACTIVE,
      isMain: true,
      address: {
        street: "Av. Principal",
        exterior_number: "100",
        interior_number: undefined,
        neighborhood_name: undefined,
        postal_code: "64000",
        sat_country_code: "MEX",
        sat_state_code: "19",
        sat_municipality_code: null,
        sat_locality_code: null,
        locality_name: null,
        sat_neighborhood_code: null,
        latitude: null,
        longitude: null,
        location_name: "Sucursal Monterrey",
        reference: null,
      },
    });
  });
});

describe("branchFormToUpdateDTO", () => {
  it("maps nested address for update", () => {
    const dto = branchFormToUpdateDTO({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal actualizada",
      address: validAddress,
      phone: "",
      email: "",
      managerName: "",
      notes: "",
    });

    expect(dto).toMatchObject({
      name: "Sucursal actualizada",
      phone: null,
      email: null,
      address: {
        sat_state_code: "19",
        postal_code: "64000",
      },
    });
  });
});
