import { canDeclareFalseTrip as domainCanDeclareFalseTrip } from "@boeltech/cfdi-domain";

import type {
  CfdiEmissionIntent,
  TripCargo,
  TripOperationalOutcomeType,
  TripStatusType,
  TripStop,
} from "@features/trips/domain";

export type CanDeclareFalseTripUxInput = {
  tripStatus: TripStatusType;
  stops: readonly TripStop[];
  cargos?: readonly TripCargo[];
  /** ADR-0081 / T4-043: prorrateo `active`. */
  hasActiveRevenueSplit?: boolean;
  /** ADR-0096: `sin_cfdi_efectivo` → deny (mutex con falso). */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  operationalOutcome?: TripOperationalOutcomeType;
};

/**
 * Adapter UX → `@boeltech/cfdi-domain` `canDeclareFalseTrip` (T-FALSE / PD11).
 * No reimplementa reglas; solo mapea Result → boolean para ocultar el CTA.
 */
export function canDeclareFalseTrip(input: CanDeclareFalseTripUxInput): boolean {
  const result = domainCanDeclareFalseTrip({
    trip: { status: input.tripStatus },
    stops: input.stops,
    cargos: input.cargos,
    hasActiveRevenueSplit: input.hasActiveRevenueSplit,
    cfdiEmissionIntent: input.cfdiEmissionIntent,
    operationalOutcome: input.operationalOutcome,
  });
  return result.ok;
}
