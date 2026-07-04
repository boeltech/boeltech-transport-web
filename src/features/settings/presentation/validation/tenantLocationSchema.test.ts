import { describe, expect, it } from "vitest";
import {
  defaultTenantLocationFormValues,
  tenantLocationFormDataToCreateDto,
  tenantLocationFormSchema,
} from "./tenantLocationSchema";

describe("tenantLocationSchema", () => {
  it("requires locationName", () => {
    const result = tenantLocationFormSchema.safeParse({
      ...defaultTenantLocationFormValues,
      locationName: "",
    });
    expect(result.success).toBe(false);
  });

  it("maps create dto with warehouse type", () => {
    const dto = tenantLocationFormDataToCreateDto({
      ...defaultTenantLocationFormValues,
      locationName: "Bodega Norte",
      street: "Av Industria",
      exteriorNumber: "10",
      postalCode: "66600",
      satStateCode: "NLE",
      satMunicipalityCode: "039",
    });
    expect(dto.addressType).toBe("warehouse");
    expect(dto.locationName).toBe("Bodega Norte");
    expect(dto.isPrimary).toBe(false);
  });
});
