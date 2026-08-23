import { describe, expect, it } from "vitest";
import { resolveDriverFormField } from "./applyDriverApiFieldErrors";

describe("resolveDriverFormField", () => {
  it("maps snake_case API paths to form fields", () => {
    expect(resolveDriverFormField("employee_id")).toBe("employeeId");
    expect(resolveDriverFormField("federal_license_number")).toBe(
      "federalLicenseNumber",
    );
  });

  it("accepts camelCase and nested last segment", () => {
    expect(resolveDriverFormField("employeeId")).toBe("employeeId");
    expect(resolveDriverFormField("body.employee_id")).toBe("employeeId");
  });

  it("returns null for unknown or general fields", () => {
    expect(resolveDriverFormField("general")).toBeNull();
    expect(resolveDriverFormField("unknown_field")).toBeNull();
  });
});
