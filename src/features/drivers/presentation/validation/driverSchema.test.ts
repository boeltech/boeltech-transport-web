import { describe, expect, it } from "vitest";
import {
  defaultDriverFormValues,
  driverFormDataToCreateDriverDTO,
  driverSchema,
  driverToFormValues,
  type DriverFormData,
} from "./driverSchema";
import type { Driver } from "../../domain";

const EMPLOYEE_ID = "11111111-1111-4111-8111-111111111111";

function baseValid(overrides: Partial<DriverFormData> = {}): DriverFormData {
  return {
    ...defaultDriverFormValues,
    employeeId: EMPLOYEE_ID,
    federalLicenseNumber: "SICT-123",
    federalLicenseCategory: "B",
    federalLicenseExpiry: "2027-06-01",
    ...overrides,
  };
}

describe("driverSchema", () => {
  it("requiere empleado y al menos una licencia completa", () => {
    const empty = driverSchema.safeParse(defaultDriverFormValues);
    expect(empty.success).toBe(false);

    const onlyEmployee = driverSchema.safeParse({
      ...defaultDriverFormValues,
      employeeId: EMPLOYEE_ID,
    });
    expect(onlyEmployee.success).toBe(false);
    if (!onlyEmployee.success) {
      expect(
        onlyEmployee.error.issues.some((i) =>
          i.message.includes("al menos una licencia"),
        ),
      ).toBe(true);
    }
  });

  it("acepta licencia federal completa", () => {
    const result = driverSchema.safeParse(baseValid());
    expect(result.success).toBe(true);
  });

  it("acepta licencia estatal completa sin federal", () => {
    const result = driverSchema.safeParse(
      baseValid({
        federalLicenseNumber: "",
        federalLicenseCategory: undefined,
        federalLicenseExpiry: "",
        stateLicenseNumber: "EST-9",
        stateLicenseExpiry: "2027-01-15",
        stateIssuingState: "Jalisco",
      }),
    );
    expect(result.success).toBe(true);
  });

  it("rechaza grupo federal incompleto", () => {
    const result = driverSchema.safeParse(
      baseValid({
        federalLicenseNumber: "SICT-1",
        federalLicenseCategory: undefined,
        federalLicenseExpiry: "",
        stateLicenseNumber: "",
        stateLicenseExpiry: "",
        stateIssuingState: "",
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("licencia federal"),
        ),
      ).toBe(true);
    }
  });

  it("rechaza grupo estatal incompleto", () => {
    const result = driverSchema.safeParse(
      baseValid({
        federalLicenseNumber: "",
        federalLicenseCategory: undefined,
        federalLicenseExpiry: "",
        stateLicenseNumber: "EST-1",
        stateLicenseExpiry: "",
        stateIssuingState: "",
      }),
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) =>
          i.message.includes("licencia estatal"),
        ),
      ).toBe(true);
    }
  });

  it("rechaza resultados de examen fuera del catálogo", () => {
    const psych = driverSchema.safeParse({
      ...baseValid(),
      psychometricTestResult: "weird",
    });
    expect(psych.success).toBe(false);

    const drug = driverSchema.safeParse({
      ...baseValid(),
      drugTestResult: "weird",
    });
    expect(drug.success).toBe(false);
  });

  it("acepta resultados de examen del catálogo o vacío", () => {
    expect(
      driverSchema.safeParse(baseValid({ psychometricTestResult: "approved" }))
        .success,
    ).toBe(true);
    expect(
      driverSchema.safeParse(baseValid({ drugTestResult: "negative" })).success,
    ).toBe(true);
    expect(
      driverSchema.safeParse(baseValid({ psychometricTestResult: "" })).success,
    ).toBe(true);
  });
});

describe("driverToFormValues", () => {
  it("hidrata fechas nulas como string vacío (paridad DateField)", () => {
    const values = driverToFormValues({
      id: "d1",
      employeeId: EMPLOYEE_ID,
      federalLicenseNumber: "F-1",
      federalLicenseCategory: "B",
      federalLicenseExpiry: "2028-01-01",
      stateLicenseNumber: null,
      stateLicenseExpiry: null,
      stateIssuingState: null,
      medicalCertificateExpiry: null,
      psychometricTestDate: null,
      lastDrugTestDate: null,
      psychometricTestResult: null,
      drugTestResult: null,
    } as Driver);

    expect(values.medicalCertificateExpiry).toBe("");
    expect(values.psychometricTestDate).toBe("");
    expect(values.lastDrugTestDate).toBe("");
    expect(values.psychometricTestResult).toBe("");
    expect(values.drugTestResult).toBe("");
  });
});

describe("driverFormDataToCreateDriverDTO", () => {
  it("normaliza strings vacíos a null/undefined (no envía \"\")", () => {
    const dto = driverFormDataToCreateDriverDTO(
      baseValid({
        medicalCertificateNumber: "  ",
        medicalCertificateExpiry: "",
        medicalCertificateIssuer: "  IMSS  ",
        psychometricTestDate: "",
        psychometricTestResult: "",
        lastDrugTestDate: "",
        drugTestResult: "",
        assignedDeviceId: "",
        notes: "  nota  ",
        stateLicenseNumber: "",
        stateLicenseExpiry: "",
        stateIssuingState: "",
      }),
    );

    expect(dto.employeeId).toBe(EMPLOYEE_ID);
    expect(dto.federalLicenseNumber).toBe("SICT-123");
    expect(dto.federalLicenseCategory).toBe("B");
    expect(dto.federalLicenseExpiry).toBe("2027-06-01");
    expect(dto.stateLicenseNumber).toBeNull();
    expect(dto.stateLicenseExpiry).toBeNull();
    expect(dto.stateIssuingState).toBeNull();
    expect(dto.medicalCertificateNumber).toBeUndefined();
    expect(dto.medicalCertificateExpiry).toBeUndefined();
    expect(dto.medicalCertificateIssuer).toBe("IMSS");
    expect(dto.psychometricTestDate).toBeUndefined();
    expect(dto.psychometricTestResult).toBeUndefined();
    expect(dto.lastDrugTestDate).toBeUndefined();
    expect(dto.drugTestResult).toBeUndefined();
    expect(dto.assignedDeviceId).toBeUndefined();
    expect(dto.notes).toBe("nota");
  });
});
