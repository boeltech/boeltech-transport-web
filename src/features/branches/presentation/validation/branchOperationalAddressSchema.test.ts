import { describe, expect, it } from "vitest";
import {
  branchOperationalAddressFormSchema,
  defaultBranchOperationalAddressValues,
  validateBranchOperationalAddressFormComplete,
} from "./branchOperationalAddressSchema";

const validAddress = {
  ...defaultBranchOperationalAddressValues,
  street: "Av. Principal",
  exteriorNumber: "100",
  postalCode: "64000",
  satStateCode: "19",
  satMunicipalityCode: "039",
};

describe("branchOperationalAddressFormSchema", () => {
  it("rejects empty street and exterior number with Spanish messages", () => {
    const result = branchOperationalAddressFormSchema.safeParse({
      ...defaultBranchOperationalAddressValues,
      postalCode: "64000",
      satStateCode: "19",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("La calle es requerido");
    expect(messages).toContain("El número exterior es requerido");
  });

  it("rejects invalid postal code and empty state", () => {
    const result = branchOperationalAddressFormSchema.safeParse({
      ...validAddress,
      satStateCode: "",
      postalCode: "640",
    });

    expect(result.success).toBe(false);
    if (result.success) return;

    const messages = result.error.issues.map((issue) => issue.message);
    expect(messages).toContain("El estado es requerido");
    expect(messages).toContain("El código postal debe tener 5 dígitos");
  });

  it("accepts minimal valid address without coordinates", () => {
    const result = branchOperationalAddressFormSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });
});

describe("validateBranchOperationalAddressFormComplete", () => {
  it("returns UX field errors before SAT parse when street is missing", async () => {
    const result = await validateBranchOperationalAddressFormComplete(
      {
        ...defaultBranchOperationalAddressValues,
        postalCode: "64000",
        satStateCode: "19",
      },
      { locationName: "Sucursal Test" },
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.fieldErrors.street).toBe("La calle es requerido");
    expect(result.fieldErrors.exteriorNumber).toBe("El número exterior es requerido");
  });
});
