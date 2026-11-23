/**
 * T-SC3 / C9: mapa path → sección del Sheet de carga.
 * Orden de prioridad = orden del cuerpo (D-PRD-1); con falta de recogida
 * «dónde va» gana (D-PRD-2).
 */

export type CargoSheetErrorSection =
  | "producto"
  | "cantidades"
  | "requisitos"
  | "seguro"
  | "donde_va"
  | "notas";

const PRODUCT_PATHS = [
  "satProductCode",
  "satProductDescription",
  "description",
] as const;

const QUANTITY_PATHS = [
  "satUnitCode",
  "satUnitName",
  "units",
  "weightInKg",
  "weight",
] as const;

const REQUIREMENTS_PATHS = [
  "hazardousMaterial",
  "hazardousMaterialCode",
  "packagingType",
  "packagingDescription",
  "requiresHazmat",
  "sectorCofepris",
  "nombreIngredienteActivo",
  "nomQuimico",
  "denominacionGenericaProd",
  "denominacionDistintivaProd",
  "fabricante",
  "fechaCaducidad",
  "loteMedicamento",
  "formaFarmaceutica",
  "condicionesEspTransp",
  "registroSanitarioFolioAutorizacion",
  "permisoImportacion",
  "folioImpoVucem",
  "numCas",
  "razonSocialEmpImp",
  "numRegSanPlagCofepris",
  "datosFabricante",
  "datosFormulador",
  "datosMaquilador",
  "usoAutorizado",
  "sectorRequirements",
] as const;

const INSURANCE_PATHS = [
  "isInsured",
  "declaredValue",
  "aseguraCarga",
  "polizaCarga",
] as const;

const NOTES_PATHS = ["notes", "specialInstructions"] as const;

const DEFAULT_ORDER: readonly CargoSheetErrorSection[] = [
  "producto",
  "cantidades",
  "donde_va",
  "requisitos",
  "seguro",
  "notas",
] as const;

const MISSING_PICKUP_ORDER: readonly CargoSheetErrorSection[] = [
  "donde_va",
  "producto",
  "cantidades",
  "requisitos",
  "seguro",
  "notas",
] as const;

function hasErrorOnPaths(
  formErrors: Record<string, unknown>,
  paths: readonly string[],
): boolean {
  return paths.some((path) => {
    const entry = formErrors[path];
    if (entry == null) return false;
    if (typeof entry === "object" && "message" in entry) {
      return Boolean((entry as { message?: unknown }).message);
    }
    return true;
  });
}

export function resolveCargoSheetErrorSection(args: {
  formErrors: Record<string, unknown>;
  deliveryStopError?: string | null;
  deliveryCoverageError?: string | null;
  /** Señales UI de recogida faltante (no path RHF). */
  missingPickup?: boolean;
}): CargoSheetErrorSection | null {
  const {
    formErrors,
    deliveryStopError,
    deliveryCoverageError,
    missingPickup = false,
  } = args;

  const hit = new Set<CargoSheetErrorSection>();

  if (hasErrorOnPaths(formErrors, PRODUCT_PATHS)) hit.add("producto");
  if (hasErrorOnPaths(formErrors, QUANTITY_PATHS)) hit.add("cantidades");
  if (hasErrorOnPaths(formErrors, REQUIREMENTS_PATHS)) hit.add("requisitos");
  if (hasErrorOnPaths(formErrors, INSURANCE_PATHS)) hit.add("seguro");
  if (hasErrorOnPaths(formErrors, NOTES_PATHS)) hit.add("notas");
  if (deliveryStopError || deliveryCoverageError || missingPickup) {
    hit.add("donde_va");
  }

  if (hit.size === 0) return null;

  const order = missingPickup ? MISSING_PICKUP_ORDER : DEFAULT_ORDER;
  for (const section of order) {
    if (hit.has(section)) return section;
  }
  return null;
}

/** Id de campo a enfocar al abrir la sección con error. */
export function focusFieldIdForCargoSheetSection(
  section: CargoSheetErrorSection,
  options?: { missingPickup?: boolean; hasDeliveryStopError?: boolean },
): string {
  switch (section) {
    case "producto":
      return "cargo-sat-product";
    case "cantidades":
      return "cargo-units";
    case "requisitos":
      return "cargo-hazmat-checkbox";
    case "seguro":
      return "cargo-is-insured";
    case "notas":
      return "cargo-notes";
    case "donde_va":
      if (options?.missingPickup) return "cargo-pickup-stop";
      if (options?.hasDeliveryStopError) return "cargo-delivery-stop-0";
      return "cargo-pickup-stop";
    default:
      return "cargo-sat-product";
  }
}
