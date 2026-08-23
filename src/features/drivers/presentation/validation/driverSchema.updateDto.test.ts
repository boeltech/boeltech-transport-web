import { describe, expect, it } from "vitest";
import {
  driverFormDataToUpdateDriverDTO,
  type DriverFormData,
} from "./driverSchema";
import { toApiUpdateDriver } from "../../infrastructure/mappers";

const baseForm: DriverFormData = {
  employeeId: "11111111-1111-4111-8111-111111111111",
  federalLicenseNumber: "LF-1",
  federalLicenseCategory: "B",
  federalLicenseExpiry: "2028-01-01",
  stateLicenseNumber: "",
  stateLicenseExpiry: "",
  stateIssuingState: "",
  medicalCertificateNumber: "",
  medicalCertificateExpiry: "",
  medicalCertificateIssuer: "",
  psychometricTestDate: "",
  psychometricTestResult: "",
  lastDrugTestDate: "",
  drugTestResult: "",
  assignedDeviceId: "",
  notes: "nota",
};

describe("driverFormDataToUpdateDriverDTO", () => {
  it("does not include status or isActive", () => {
    const dto = driverFormDataToUpdateDriverDTO(baseForm);
    expect(dto).not.toHaveProperty("status");
    expect(dto).not.toHaveProperty("isActive");
    expect(dto.notes).toBe("nota");
    expect(dto.medicalCertificateExpiry).toBeNull();
  });

  it("toApiUpdateDriver omits status and is_active", () => {
    const api = toApiUpdateDriver(driverFormDataToUpdateDriverDTO(baseForm));
    expect(api).not.toHaveProperty("status");
    expect(api).not.toHaveProperty("is_active");
    expect(api.medical_certificate_expiry).toBeNull();
  });
});
