/**
 * Casos dorados del pago por viaje (ADR-0086 D1, enmienda 2026-10-09): matriz
 * entrada → monto, mínimo aplicado y dato faltante. Los usa
 * `simulateCompensation.test.ts` contra `computeRuleCommission`.
 *
 * Contraparte API: `boeltech-transport-api/src/modules/settlements/__fixtures__/commissionGoldenCases.ts`
 * (`computeTripCommissionBreakdown`). Ambos archivos deben tener los mismos casos
 * con los mismos valores; si cambias uno, cambia el otro.
 *
 * La ruta fija (corredor) reemplaza el cálculo antes de llegar aquí; su caso
 * vive en las pruebas del simulador.
 */

import type { AgreementCommissionType, TripRouteType } from "@features/settlements/domain";
import type { CommissionCalculationGap } from "./simulateCompensation";

export interface CommissionGoldenCase {
  id: string;
  description: string;
  trip: {
    routeType: TripRouteType;
    distanceKm: number;
    freightRevenue: number;
  };
  /** Regla de la clase de ruta del viaje; `null` = sin regla para esa clase. */
  rule: {
    commissionType: AgreementCommissionType;
    rateValue: number;
    minimumGuaranteedAmount: number;
  } | null;
  expected: {
    amount: number;
    minimumApplied: boolean;
    calculationGap: CommissionCalculationGap | null;
  };
}

export const COMMISSION_GOLDEN_CASES: readonly CommissionGoldenCase[] = [
  {
    id: "km-below-minimum",
    description: "Km > 0, cálculo menor al mínimo → mínimo",
    trip: { routeType: "long_haul", distanceKm: 100, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 3, minimumGuaranteedAmount: 500 },
    expected: { amount: 500, minimumApplied: true, calculationGap: null },
  },
  {
    id: "km-above-minimum",
    description: "Km > 0, cálculo mayor al mínimo → cálculo",
    trip: { routeType: "long_haul", distanceKm: 300, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 3, minimumGuaranteedAmount: 500 },
    expected: { amount: 900, minimumApplied: false, calculationGap: null },
  },
  {
    id: "km-zero-with-minimum",
    description: "Por km, 0 km, mínimo > 0 → mínimo con dato faltante",
    trip: { routeType: "long_haul", distanceKm: 0, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 3, minimumGuaranteedAmount: 400 },
    expected: { amount: 400, minimumApplied: true, calculationGap: "zero_km" },
  },
  {
    id: "km-zero-without-minimum",
    description: "Por km, 0 km, mínimo 0 → $0 con dato faltante",
    trip: { routeType: "long_haul", distanceKm: 0, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 3, minimumGuaranteedAmount: 0 },
    expected: { amount: 0, minimumApplied: false, calculationGap: "zero_km" },
  },
  {
    id: "freight-zero-with-minimum",
    description: "Porcentaje, flete $0, mínimo > 0 → mínimo con dato faltante",
    trip: { routeType: "local", distanceKm: 40, freightRevenue: 0 },
    rule: {
      commissionType: "percentage_of_freight",
      rateValue: 10,
      minimumGuaranteedAmount: 350,
    },
    expected: { amount: 350, minimumApplied: true, calculationGap: "zero_freight" },
  },
  {
    id: "freight-zero-without-minimum",
    description: "Porcentaje, flete $0, mínimo 0 → $0 con dato faltante",
    trip: { routeType: "local", distanceKm: 40, freightRevenue: 0 },
    rule: {
      commissionType: "percentage_of_freight",
      rateValue: 10,
      minimumGuaranteedAmount: 0,
    },
    expected: { amount: 0, minimumApplied: false, calculationGap: "zero_freight" },
  },
  {
    id: "fixed-rate-zero-with-minimum",
    description: "Tarifa fija en $0, mínimo > 0 → mínimo",
    trip: { routeType: "transfer", distanceKm: 10, freightRevenue: 2000 },
    rule: { commissionType: "fixed_per_trip", rateValue: 0, minimumGuaranteedAmount: 250 },
    expected: { amount: 250, minimumApplied: true, calculationGap: null },
  },
  {
    id: "km-rate-zero-with-minimum",
    description: "Tarifa por km en $0 con km, mínimo > 0 → mínimo",
    trip: { routeType: "long_haul", distanceKm: 100, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 0, minimumGuaranteedAmount: 250 },
    expected: { amount: 250, minimumApplied: true, calculationGap: null },
  },
  {
    id: "percentage-rate-zero-with-minimum",
    description: "Porcentaje en 0 % con flete, mínimo > 0 → mínimo",
    trip: { routeType: "local", distanceKm: 40, freightRevenue: 10000 },
    rule: {
      commissionType: "percentage_of_freight",
      rateValue: 0,
      minimumGuaranteedAmount: 250,
    },
    expected: { amount: 250, minimumApplied: true, calculationGap: null },
  },
  {
    id: "none-with-minimum",
    description: "Sin pago extra (`none`) con mínimo > 0 guardado → $0, el mínimo se ignora",
    trip: { routeType: "long_haul", distanceKm: 100, freightRevenue: 10000 },
    rule: { commissionType: "none", rateValue: 5, minimumGuaranteedAmount: 500 },
    expected: { amount: 0, minimumApplied: false, calculationGap: null },
  },
  {
    id: "no-rule",
    description: "Sin regla para la clase de ruta → $0",
    trip: { routeType: "long_haul", distanceKm: 100, freightRevenue: 10000 },
    rule: null,
    expected: { amount: 0, minimumApplied: false, calculationGap: null },
  },
  {
    id: "false-trip-zero-km-with-minimum",
    description: "Viaje en falso sin km, mínimo > 0 → mínimo con dato faltante",
    trip: { routeType: "long_haul", distanceKm: 0, freightRevenue: 32000 },
    rule: { commissionType: "rate_per_km", rateValue: 3, minimumGuaranteedAmount: 600 },
    expected: { amount: 600, minimumApplied: true, calculationGap: "zero_km" },
  },
  {
    id: "km-rounds-to-cents",
    description: "Por km redondea a centavos por viaje",
    trip: { routeType: "long_haul", distanceKm: 101, freightRevenue: 10000 },
    rule: { commissionType: "rate_per_km", rateValue: 3.333, minimumGuaranteedAmount: 0 },
    expected: { amount: 336.63, minimumApplied: false, calculationGap: null },
  },
  {
    id: "percentage-rounds-to-cents",
    description: "Porcentaje redondea a centavos por viaje",
    trip: { routeType: "local", distanceKm: 40, freightRevenue: 1234.57 },
    rule: {
      commissionType: "percentage_of_freight",
      rateValue: 7.5,
      minimumGuaranteedAmount: 0,
    },
    expected: { amount: 92.59, minimumApplied: false, calculationGap: null },
  },
];
