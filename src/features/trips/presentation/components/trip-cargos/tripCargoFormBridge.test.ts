import { describe, expect, it } from "vitest";

import type { TripCargo } from "@features/trips/domain";
import {
  formValuesToUpdateCargoInput,
  tripCargoToFormValues,
} from "./tripCargoFormBridge";

function baseCargo(overrides: Partial<TripCargo> = {}): TripCargo {
  return {
    id: "cargo-1",
    tenantId: "t1",
    tripId: "trip-1",
    clientId: "client-1",
    description: "Cajas de refacciones",
    productType: null,
    weight: 120,
    volume: null,
    units: 10,
    declaredValue: 5000,
    aseguraCarga: "AXA",
    polizaCarga: "POL-99",
    rate: 0,
    currency: "MXN",
    movements: [
      {
        stopIndex: 0,
        movementType: "pickup",
        weight: 120,
        units: 10,
        completedAt: null,
        notes: null,
      },
      {
        stopIndex: 2,
        movementType: "delivery",
        weight: 120,
        units: 10,
        completedAt: null,
        notes: null,
      },
    ],
    status: "pending",
    pickedUpAt: null,
    deliveredAt: null,
    notes: "Fragil",
    specialInstructions: null,
    satProductCode: "50192100",
    satProductDescription: "Refacciones",
    satUnitCode: "H87",
    satUnitName: "Pieza",
    weightInKg: 120,
    dimensions: null,
    hazardousMaterial: false,
    requiresHazmat: false,
    hazardousMaterialCode: null,
    packagingType: null,
    packagingDescription: null,
    sectorRequirements: null,
    sectorCofepris: null,
    nombreIngredienteActivo: null,
    nomQuimico: null,
    denominacionGenericaProd: null,
    denominacionDistintivaProd: null,
    fabricante: null,
    fechaCaducidad: null,
    loteMedicamento: null,
    formaFarmaceutica: null,
    condicionesEspTransp: null,
    registroSanitarioFolioAutorizacion: null,
    permisoImportacion: null,
    folioImpoVucem: null,
    numCas: null,
    razonSocialEmpImp: null,
    numRegSanPlagCofepris: null,
    datosFabricante: null,
    datosFormulador: null,
    datosMaquilador: null,
    usoAutorizado: null,
    fraccionArancelaria: null,
    uuidComercioExterior: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: null,
    updatedBy: null,
    ...overrides,
  } as TripCargo;
}

describe("tripCargoFormBridge", () => {
  it("maps entity SAT and insurance into sheet form values", () => {
    const form = tripCargoToFormValues(baseCargo());

    expect(form.description).toBe("Cajas de refacciones");
    expect(form.satProductCode).toBe("50192100");
    expect(form.satUnitCode).toBe("H87");
    expect(form.isInsured).toBe(true);
    expect(form.aseguraCarga).toBe("AXA");
    expect(form.polizaCarga).toBe("POL-99");
    expect(form.movements).toHaveLength(2);
  });

  it("maps form values to update input without movements", () => {
    const form = tripCargoToFormValues(baseCargo());
    const update = formValuesToUpdateCargoInput(form);

    expect(update.description).toBe("Cajas de refacciones");
    expect(update.satProductCode).toBe("50192100");
    expect(update.polizaCarga).toBe("POL-99");
    expect(update).not.toHaveProperty("movements");
  });

  it("clears insurance fields on update when not insured", () => {
    const form = tripCargoToFormValues(baseCargo());
    form.isInsured = false;
    const update = formValuesToUpdateCargoInput(form);

    expect(update.aseguraCarga).toBeNull();
    expect(update.polizaCarga).toBeNull();
  });
});
