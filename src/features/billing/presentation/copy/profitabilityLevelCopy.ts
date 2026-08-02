/**
 * Niveles de análisis de rentabilidad (L0 → L4).
 *
 * `label` es SoT comercial: se copia literal de
 * `billing-saas/pricing/propuesta-planes-v3.md` §7 «Termómetro L0 → L4».
 * `includes` / `pending` derivan de `design/roadmaps/full-profitability/roadmap.md` §3.
 *
 * Reglas duras del modelo (roadmap §3):
 * - «real» y «neto» solo se usan desde L3.
 * - No reusar la etiqueta de un nivel para describir otro.
 * - L2 es «margen vehicular operativo», nunca «completo» ni «total».
 * - Los porcentajes de cobertura del roadmap son calibración interna: no se muestran al tenant.
 */

import type { ProfitabilityLevel } from "../../domain/entities";

export interface ProfitabilityLevelCopy {
  /** Etiqueta comercial oficial del nivel. */
  label: string;
  /** Qué costos entran hoy en el cálculo. */
  includes: string;
  /** Qué falta por cubrir. Ausente desde L3. */
  pending?: string;
}

export const PROFITABILITY_LEVEL_COPY: Record<
  ProfitabilityLevel,
  ProfitabilityLevelCopy
> = {
  L0: {
    label: "Margen operativo",
    includes:
      "Al ingreso de cada viaje se le restan los gastos del viaje ya aprobados.",
    pending: "Todavía no considera depreciación, combustible ni sueldos.",
  },
  "L0.5": {
    label: "Margen operativo pleno",
    includes:
      "Además del gasto del viaje, se incluye lo que pagas al equipo de apoyo asignado.",
    pending: "Todavía no considera depreciación, combustible ni sueldos.",
  },
  L1: {
    label: "Margen operativo ajustado",
    includes: "Se suma la depreciación mensual de tus unidades.",
    pending: "Todavía no considera combustible, mantenimiento ni sueldos.",
  },
  L2: {
    label: "Margen vehicular operativo",
    includes:
      "Se suman el combustible y el mantenimiento programado de cada unidad.",
    pending: "Todavía no considera sueldos ni gastos generales de la empresa.",
  },
  L3: {
    label: "Margen con nómina",
    includes:
      "Se suman los sueldos prorrateados de operadores y personal administrativo.",
  },
  L4: {
    label: "Margen neto del negocio",
    includes:
      "Se suman los gastos generales de la empresa y el costo de documentación de las unidades.",
  },
};

/** Fallback al código crudo si el API enviara un nivel que la UI no conoce. */
export function getProfitabilityLevelCopy(level: string): ProfitabilityLevelCopy {
  return (
    PROFITABILITY_LEVEL_COPY[level as ProfitabilityLevel] ?? {
      label: level,
      includes: "",
    }
  );
}
