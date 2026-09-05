import { describe, expect, it } from "vitest";
import { mapBillingServiceConceptForTest } from "./billingServiceConceptsApi";

describe("mapBillingServiceConceptForTest", () => {
  it("mapea campos camelCase del API al dominio", () => {
    const mapped = mapBillingServiceConceptForTest({
      id: "svc-1",
      name: "Maniobra",
      description: null,
      claveProdServ: "78121603",
      claveUnidad: "E48",
      unidad: "Servicio",
      defaultUnitPrice: 250,
      objectImp: "02",
      ivaAplica: true,
      retencionAplica: false,
      isActive: true,
      sortOrder: 0,
    });

    expect(mapped).toEqual({
      id: "svc-1",
      name: "Maniobra",
      description: null,
      claveProdServ: "78121603",
      claveUnidad: "E48",
      unidad: "Servicio",
      defaultUnitPrice: 250,
      objectImp: "02",
      ivaAplica: true,
      retencionAplica: false,
      isActive: true,
      sortOrder: 0,
    });
  });

  it("default objectImp a 02 cuando viene ausente", () => {
    const mapped = mapBillingServiceConceptForTest({
      id: "svc-2",
      name: "Resguardo",
      description: null,
      claveProdServ: "78121603",
      claveUnidad: "E48",
      unidad: "Servicio",
      defaultUnitPrice: null,
      objectImp: undefined as unknown as string,
      ivaAplica: true,
      retencionAplica: false,
      isActive: false,
      sortOrder: 1,
    });

    expect(mapped.objectImp).toBe("02");
    expect(mapped.isActive).toBe(false);
  });
});
