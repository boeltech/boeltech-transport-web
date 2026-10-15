import { VehicleType } from "./entities";

/**
 * Coherencia soft tipo ERP ↔ ConfigVehicular SAT (pedido
 * `2026-10-14-vehiculos-coherencia-tipo-config`, handoff DOM).
 *
 * El SAT no exige esta coherencia: la regla solo clasifica para que la UI
 * avise sin bloquear, sin filtrar el catálogo y sin cambiar ningún campo.
 * Vive en la feature (PRD D1), no en `@boeltech/cfdi-domain`.
 */

/** Familia del motriz a la que pertenece un código de c_ConfigAutotransporte. */
export type VehicleConfigFamily = "tracto" | "torton" | "rabon" | "ligera";

export type VehicleTypeConfigCoherence =
  /** Sin expectativa: utilitario, config vacía, `OTRO*` / `GPL*` o código no clasificable. */
  | { readonly status: "no_expectation" }
  | {
      readonly status: "coherent";
      readonly configFamily: VehicleConfigFamily;
    }
  | {
      readonly status: "mismatch";
      /** Familia detectada en el código SAT capturado. */
      readonly configFamily: VehicleConfigFamily;
      /** Familias que el tipo ERP suele usar (tabla DOM). */
      readonly expectedFamilies: readonly VehicleConfigFamily[];
    };

/** Tabla DOM: tipo ERP → familias de ConfigVehicular esperadas. */
const EXPECTED_FAMILIES_BY_TYPE: Readonly<
  Record<string, readonly VehicleConfigFamily[]>
> = {
  [VehicleType.TRUCK]: ["tracto"],
  [VehicleType.TORTON]: ["torton"],
  [VehicleType.RABON]: ["rabon"],
  // Camioneta: VL; C2* sin aviso.
  [VehicleType.PICKUP]: ["ligera", "rabon"],
};

/** Prefijos de catálogo sin expectativa (DOM): otros / grúas y plataformas. */
const NO_EXPECTATION_PREFIXES = ["OTRO", "GPL"] as const;

/**
 * Familia de un código de ConfigVehicular. `null` si no se clasifica
 * (código vacío, `OTRO*`, `GPL*` o desconocido).
 */
export function classifyVehicleConfigFamily(
  configCode: string | null | undefined,
): VehicleConfigFamily | null {
  const code = configCode?.trim().toUpperCase();
  if (!code) return null;
  if (NO_EXPECTATION_PREFIXES.some((p) => code.startsWith(p))) return null;
  if (code.startsWith("T")) return "tracto";
  if (code === "C3" || code.startsWith("C3R")) return "torton";
  if (code === "C2" || code.startsWith("C2R")) return "rabon";
  if (code === "VL") return "ligera";
  return null;
}

export function assessVehicleTypeConfigCoherence(
  type: string | null | undefined,
  configCode: string | null | undefined,
): VehicleTypeConfigCoherence {
  const expectedFamilies = type ? EXPECTED_FAMILIES_BY_TYPE[type] : undefined;
  if (!expectedFamilies) return { status: "no_expectation" };

  const configFamily = classifyVehicleConfigFamily(configCode);
  if (!configFamily) return { status: "no_expectation" };

  if (expectedFamilies.includes(configFamily)) {
    return { status: "coherent", configFamily };
  }
  return { status: "mismatch", configFamily, expectedFamilies };
}
