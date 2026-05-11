import { describe, expect, it } from "vitest";

import {
  buildMercanciasHeaderSummary,
  mapWizardCargosToCreateInput,
} from "./wizardCargoPayload";
import type { TripCargoFormValues } from "./components/validation";

function baseCargo(overrides: Partial<TripCargoFormValues> = {}): TripCargoFormValues {
  return {
    id: undefined,
    clientId: "client-1",
    satProductCode: "10101501",
    satProductDescription: "Producto prueba",
    satUnitCode: "H87",
    satUnitName: "Pieza",
    currency: "MXN",
    description: "Carga de prueba",
    units: 10,
    weight: 100,
    weightInKg: 100,
    isInsured: false,
    declaredValue: undefined,
    aseguraCarga: undefined,
    polizaCarga: undefined,
    hazardousMaterial: false,
    requiresHazmat: false,
    hazardousMaterialCode: undefined,
    packagingType: undefined,
    packagingDescription: undefined,
    sectorRequirements: {},
    sectorCofepris: undefined,
    nombreIngredienteActivo: undefined,
    nomQuimico: undefined,
    denominacionGenericaProd: undefined,
    denominacionDistintivaProd: undefined,
    fabricante: undefined,
    fechaCaducidad: undefined,
    loteMedicamento: undefined,
    formaFarmaceutica: undefined,
    condicionesEspTransp: undefined,
    registroSanitarioFolioAutorizacion: undefined,
    permisoImportacion: undefined,
    folioImpoVucem: undefined,
    numCas: undefined,
    razonSocialEmpImp: undefined,
    numRegSanPlagCofepris: undefined,
    datosFabricante: undefined,
    datosFormulador: undefined,
    datosMaquilador: undefined,
    usoAutorizado: undefined,
    movements: [{ stopIndex: 0, movementType: "pickup", weight: 100, units: 10 }],
    notes: undefined,
    specialInstructions: undefined,
    ...overrides,
  };
}

describe("wizardCargoPayload", () => {
  it("maps cargo preserving CP 3.1 fields and defaults currency to MXN", () => {
    const mapped = mapWizardCargosToCreateInput([
      baseCargo({
        currency: undefined,
        hazardousMaterial: true,
        requiresHazmat: true,
        hazardousMaterialCode: "UN1263",
        packagingType: "4G",
        packagingDescription: "Caja UN",
        sectorCofepris: "01",
      }),
    ]);

    expect(mapped).toHaveLength(1);
    expect(mapped?.[0]).toMatchObject({
      currency: "MXN",
      hazardousMaterial: true,
      requiresHazmat: true,
      hazardousMaterialCode: "UN1263",
      sectorCofepris: "01",
    });
  });

  it("builds mercancias header summary from cargos", () => {
    const summary = buildMercanciasHeaderSummary([
      baseCargo({ weightInKg: 100 }),
      baseCargo({ weightInKg: 200, description: "Segunda carga" }),
    ]);

    expect(summary).toEqual({
      numTotalMercancias: 2,
      pesoBrutoTotal: 300,
      unidadPeso: "KGM",
    });
  });
});
