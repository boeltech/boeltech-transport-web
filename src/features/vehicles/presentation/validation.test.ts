/**
 * Tests de los schemas de vehículos.
 *
 * Cubre:
 * - Alta y edición exigen campos CP3.1 Autotransporte.
 * - PlacaVM SAT 5–7 vía normalizeCp31Placa / isValidCp31Placa.
 * - Refine de remolques cuando ConfigVehicular S/R.
 */

import { describe, expect, it } from "vitest";
import {
  createVehicleSchema,
  editVehicleFormSchema,
} from "./validation";

const baseAlta = {
  unitNumber: "U-001",
  licensePlate: "ABC123A",
  vin: "",
  brand: "Kenworth",
  model: "T680",
  year: 2024,
  type: "truck" as const,
  color: "",
  loadCapacity: undefined,
  volumeCapacity: undefined,
  fuelTankCapacity: undefined,
  expectedFuelEfficiency: undefined,
  currentMileage: undefined,
  insurancePolicy: "POL-001",
  insuranceExpiry: "",
  sctPermitNumber: "PERM-001",
  sctPermitExpiry: "",
  satTipoPermisoCode: "TPAF01",
  satConfigAutotransporteCode: "C2",
  pesoBrutoVehicular: 14.5,
  insuranceCompany: "Qualitas",
  aseguraMedioAmbiente: "",
  polizaMedioAmbiente: "",
  aseguraCarga: "",
  polizaCarga: "",
  remolques: [],
};

describe("createVehicleSchema — Carta Porte 3.1 (alta)", () => {
  it("acepta payload completo con todos los CP3.1", () => {
    const result = createVehicleSchema.safeParse(baseAlta);
    expect(result.success).toBe(true);
  });

  it("rechaza year anterior a 1980 (piso stamp AnioModeloVM)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      year: 1979,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "year")).toBe(true);
    }
  });

  it("acepta year 1980 (piso stamp AnioModeloVM)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      year: 1980,
    });
    expect(result.success).toBe(true);
  });

  it("normaliza placa con guiones", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      licensePlate: "abc-123a",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.licensePlate).toBe("ABC123A");
    }
  });

  it("rechaza placa fuera de 5–7 tras normalizar", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      licensePlate: "AB-1",
    });
    expect(result.success).toBe(false);
  });

  it("rechaza alta sin PermSCT (satTipoPermisoCode)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      satTipoPermisoCode: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "satTipoPermisoCode"),
      ).toBe(true);
    }
  });

  it("rechaza alta sin NumPermisoSCT (sctPermitNumber)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      sctPermitNumber: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "sctPermitNumber"),
      ).toBe(true);
    }
  });

  it("rechaza alta sin ConfigVehicular (satConfigAutotransporteCode)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      satConfigAutotransporteCode: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) => i.path[0] === "satConfigAutotransporteCode",
        ),
      ).toBe(true);
    }
  });

  it("rechaza alta sin PesoBrutoVehicular", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      pesoBrutoVehicular: undefined,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "pesoBrutoVehicular"),
      ).toBe(true);
    }
  });

  it("rechaza alta sin AseguraRespCivil (insuranceCompany)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      insuranceCompany: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "insuranceCompany"),
      ).toBe(true);
    }
  });

  it("rechaza alta sin PolizaRespCivil (insurancePolicy)", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      insurancePolicy: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "insurancePolicy"),
      ).toBe(true);
    }
  });

  it("rechaza alta con ConfigVehicular tipo S/R y sin remolques", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      satConfigAutotransporteCode: "T3S2",
      remolques: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (i) =>
            i.path[0] === "remolques" &&
            typeof i.message === "string" &&
            i.message.toLowerCase().includes("remolque"),
        ),
      ).toBe(true);
    }
  });

  it("acepta alta con ConfigVehicular tipo S y un remolque válido", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      satConfigAutotransporteCode: "T3S2",
      remolques: [
        {
          satSubTipoRemCode: "CTR001",
          licensePlate: "REM1234",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("acepta alta con ConfigVehicular sin remolques cuando no es S/R", () => {
    const result = createVehicleSchema.safeParse({
      ...baseAlta,
      satConfigAutotransporteCode: "C2",
      remolques: [],
    });
    expect(result.success).toBe(true);
  });
});

describe("editVehicleFormSchema — mismo set CP que alta", () => {
  it("rechaza edición de vehículo legacy sin CP3.1", () => {
    const legacyData = {
      ...baseAlta,
      satTipoPermisoCode: "",
      sctPermitNumber: "",
      satConfigAutotransporteCode: "",
      pesoBrutoVehicular: undefined,
      insuranceCompany: "",
      insurancePolicy: "",
    };
    const result = editVehicleFormSchema.safeParse(legacyData);
    expect(result.success).toBe(false);
  });

  it("acepta capacidades en null (input vacío) sin tumbar el submit", () => {
    const result = editVehicleFormSchema.safeParse({
      ...baseAlta,
      loadCapacity: null,
      volumeCapacity: null,
      fuelTankCapacity: null,
      expectedFuelEfficiency: null,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loadCapacity).toBeUndefined();
      expect(result.data.volumeCapacity).toBeUndefined();
    }
  });

  it("rechaza edición con ConfigVehicular S/R sin remolques (refine aplica)", () => {
    const result = editVehicleFormSchema.safeParse({
      ...baseAlta,
      satConfigAutotransporteCode: "T3R3",
      remolques: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((i) => i.path[0] === "remolques"),
      ).toBe(true);
    }
  });
});
