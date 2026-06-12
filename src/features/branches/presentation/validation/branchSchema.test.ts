import { describe, expect, it } from "vitest";
import { BranchStatus } from "../../domain";
import {
  branchFormSchema,
  branchFormToCreateDTO,
  branchFormToUpdateDTO,
  defaultBranchFormValues,
} from "./branchSchema";

describe("branchFormSchema", () => {
  it("accepts valid form data", () => {
    const result = branchFormSchema.safeParse({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal Monterrey",
      street: "Av. Principal",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing required street", () => {
    const result = branchFormSchema.safeParse({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal Monterrey",
      street: "",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = branchFormSchema.safeParse({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal Monterrey",
      street: "Av. Principal",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      email: "invalid-email",
    });

    expect(result.success).toBe(false);
  });
});

describe("branchFormToCreateDTO", () => {
  it("trims strings and omits empty optional fields", () => {
    const dto = branchFormToCreateDTO({
      code: " MTY-01 ",
      name: " Sucursal Monterrey ",
      status: BranchStatus.ACTIVE,
      isMain: true,
      street: " Av. Principal ",
      exteriorNumber: "",
      interiorNumber: "",
      neighborhood: "",
      city: " Monterrey ",
      state: " Nuevo León ",
      postalCode: " 64000 ",
      country: " México ",
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
      street: "Av. Principal",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      country: "México",
    });
  });
});

describe("branchFormToUpdateDTO", () => {
  it("maps empty optional strings to null for update", () => {
    const dto = branchFormToUpdateDTO({
      ...defaultBranchFormValues,
      code: "MTY-01",
      name: "Sucursal actualizada",
      street: "Av. Principal",
      city: "Monterrey",
      state: "Nuevo León",
      postalCode: "64000",
      phone: "",
      email: "",
      managerName: "",
      notes: "",
    });

    expect(dto).toMatchObject({
      name: "Sucursal actualizada",
      phone: null,
      email: null,
      managerName: null,
      notes: null,
    });
  });
});
