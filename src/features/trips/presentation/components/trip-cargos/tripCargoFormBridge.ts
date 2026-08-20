import type {
  CurrencyType,
  TripCargo,
  UpdateCargoInput,
} from "@features/trips/domain";
import { V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL } from "@features/trips/domain/v1CargoPlaceholderClient";
import type { TripCargoFormValues } from "../../pages/create/components/validation";

function nullToEmpty(value: string | null | undefined): string {
  return value ?? "";
}

function nullToUndefined<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Maps a persisted trip cargo into wizard sheet form values for edit.
 * Movements are included for sheet context/validation; update API does not rewrite them.
 */
export function tripCargoToFormValues(cargo: TripCargo): TripCargoFormValues {
  const currency: CurrencyType =
    cargo.currency === "USD" || cargo.currency === "EUR" ? cargo.currency : "MXN";

  return {
    id: cargo.id,
    clientId: cargo.clientId || V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
    description: cargo.description,
    weight: nullToUndefined(cargo.weight),
    units: nullToUndefined(cargo.units),
    weightInKg: nullToUndefined(cargo.weightInKg),
    currency,
    isInsured: Boolean(cargo.aseguraCarga?.trim() || cargo.polizaCarga?.trim()),
    declaredValue: nullToUndefined(cargo.declaredValue),
    aseguraCarga: nullToEmpty(cargo.aseguraCarga),
    polizaCarga: nullToEmpty(cargo.polizaCarga),
    satProductCode: nullToEmpty(cargo.satProductCode),
    satProductDescription: nullToEmpty(cargo.satProductDescription),
    satUnitCode: nullToEmpty(cargo.satUnitCode) || "H87",
    satUnitName: nullToEmpty(cargo.satUnitName) || "Pieza",
    hazardousMaterial: cargo.hazardousMaterial === true,
    requiresHazmat: cargo.requiresHazmat,
    hazardousMaterialCode: nullToEmpty(cargo.hazardousMaterialCode),
    packagingType: nullToEmpty(cargo.packagingType),
    packagingDescription: nullToEmpty(cargo.packagingDescription),
    sectorRequirements: cargo.sectorRequirements ?? {},
    sectorCofepris: nullToEmpty(cargo.sectorCofepris),
    nombreIngredienteActivo: nullToEmpty(cargo.nombreIngredienteActivo),
    nomQuimico: nullToEmpty(cargo.nomQuimico),
    denominacionGenericaProd: nullToEmpty(cargo.denominacionGenericaProd),
    denominacionDistintivaProd: nullToEmpty(cargo.denominacionDistintivaProd),
    fabricante: nullToEmpty(cargo.fabricante),
    fechaCaducidad: nullToEmpty(cargo.fechaCaducidad),
    loteMedicamento: nullToEmpty(cargo.loteMedicamento),
    formaFarmaceutica: nullToEmpty(cargo.formaFarmaceutica),
    condicionesEspTransp: nullToEmpty(cargo.condicionesEspTransp),
    registroSanitarioFolioAutorizacion: nullToEmpty(
      cargo.registroSanitarioFolioAutorizacion,
    ),
    permisoImportacion: nullToEmpty(cargo.permisoImportacion),
    folioImpoVucem: nullToEmpty(cargo.folioImpoVucem),
    numCas: nullToEmpty(cargo.numCas),
    razonSocialEmpImp: nullToEmpty(cargo.razonSocialEmpImp),
    numRegSanPlagCofepris: nullToEmpty(cargo.numRegSanPlagCofepris),
    datosFabricante: nullToEmpty(cargo.datosFabricante),
    datosFormulador: nullToEmpty(cargo.datosFormulador),
    datosMaquilador: nullToEmpty(cargo.datosMaquilador),
    usoAutorizado: nullToEmpty(cargo.usoAutorizado),
    movements: (cargo.movements ?? []).map((movement) => ({
      stopIndex: movement.stopIndex,
      movementType: movement.movementType,
      weight: nullToUndefined(movement.weight),
      units: nullToUndefined(movement.units),
      notes: nullToEmpty(movement.notes),
    })),
    notes: nullToEmpty(cargo.notes),
    specialInstructions: nullToEmpty(cargo.specialInstructions),
  };
}

/** Maps sheet form values to the existing update cargo contract (no movements). */
export function formValuesToUpdateCargoInput(
  values: TripCargoFormValues,
): UpdateCargoInput {
  return {
    description: values.description,
    weight: values.weight ?? null,
    units: values.units ?? null,
    declaredValue: values.declaredValue ?? null,
    aseguraCarga: values.isInsured ? emptyToNull(values.aseguraCarga) : null,
    polizaCarga: values.isInsured ? emptyToNull(values.polizaCarga) : null,
    currency: values.currency,
    notes: emptyToNull(values.notes),
    specialInstructions: emptyToNull(values.specialInstructions),
    satProductCode: emptyToNull(values.satProductCode),
    satProductDescription: emptyToNull(values.satProductDescription),
    satUnitCode: emptyToNull(values.satUnitCode),
    satUnitName: emptyToNull(values.satUnitName),
    weightInKg: values.weightInKg ?? null,
    hazardousMaterial: values.hazardousMaterial ?? null,
    requiresHazmat: values.requiresHazmat ?? null,
    hazardousMaterialCode: emptyToNull(values.hazardousMaterialCode),
    packagingType: emptyToNull(values.packagingType),
    packagingDescription: emptyToNull(values.packagingDescription),
    sectorRequirements: values.sectorRequirements ?? null,
    sectorCofepris: emptyToNull(values.sectorCofepris),
    nombreIngredienteActivo: emptyToNull(values.nombreIngredienteActivo),
    nomQuimico: emptyToNull(values.nomQuimico),
    denominacionGenericaProd: emptyToNull(values.denominacionGenericaProd),
    denominacionDistintivaProd: emptyToNull(values.denominacionDistintivaProd),
    fabricante: emptyToNull(values.fabricante),
    fechaCaducidad: emptyToNull(values.fechaCaducidad),
    loteMedicamento: emptyToNull(values.loteMedicamento),
    formaFarmaceutica: emptyToNull(values.formaFarmaceutica),
    condicionesEspTransp: emptyToNull(values.condicionesEspTransp),
    registroSanitarioFolioAutorizacion: emptyToNull(
      values.registroSanitarioFolioAutorizacion,
    ),
    permisoImportacion: emptyToNull(values.permisoImportacion),
    folioImpoVucem: emptyToNull(values.folioImpoVucem),
    numCas: emptyToNull(values.numCas),
    razonSocialEmpImp: emptyToNull(values.razonSocialEmpImp),
    numRegSanPlagCofepris: emptyToNull(values.numRegSanPlagCofepris),
    datosFabricante: emptyToNull(values.datosFabricante),
    datosFormulador: emptyToNull(values.datosFormulador),
    datosMaquilador: emptyToNull(values.datosMaquilador),
    usoAutorizado: emptyToNull(values.usoAutorizado),
  };
}
