/**
 * Variante UX de captura de domicilio → obligatoriedad XSD Domicilio CP31 (ADR-0043).
 *
 * - **variant** (`carta-porte` | `personal`): asteriscos, readiness en vivo, recomendación de municipio.
 * - **context** (`SharedAddressContext` / `formContext`): parseo API, coords, calle, location_name — ver `addressFormProfileUx`.
 *
 * SoT SAT: `@boeltech/cfdi-domain/reglas/address-readiness` + `cp31-domicilio-xsd.ts`
 */

import { getCp31DomicilioConditionalRequirements } from "@boeltech/cfdi-domain/reglas/address-readiness";

/** Variantes de `AddressInput` (solo UX; parseo siempre `carta_porte_31`). */
export type AddressUxVariant = "carta-porte" | "personal";

export interface Cp31DomicilioUxRequirements {
  requireMunicipality: boolean;
  requireLocality: boolean;
  requireNeighborhood: boolean;
  /** UX: sugerir captura sin bloquear (municipio opcional en XSD). */
  recommendMunicipality?: boolean;
}

export function getCp31DomicilioUxRequirements(
  _variant?: AddressUxVariant,
): Cp31DomicilioUxRequirements {
  void _variant;
  const cp31 = getCp31DomicilioConditionalRequirements();
  return {
    requireMunicipality: cp31.require_municipality,
    requireLocality: cp31.require_locality,
    requireNeighborhood: cp31.require_neighborhood,
    recommendMunicipality: true,
  };
}
