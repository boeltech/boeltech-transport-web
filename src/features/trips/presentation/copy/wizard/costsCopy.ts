/**
 * Namespace: trips.copy.wizard.costs.*
 * Reutiliza taxonomía del detalle donde aplica; hints específicos del wizard.
 */
import { costsCopy as detailCostsCopy } from "../tripDetail/costsCopy";

export const costsCopy = {
  section: {
    income: detailCostsCopy.section.baseRate,
    operational: detailCostsCopy.section.operational,
    indirect: detailCostsCopy.section.indirect,
  },
  label: {
    baseRate: detailCostsCopy.label.baseRateInput,
  },
  hint: {
    baseRateTraslado: detailCostsCopy.hint.baseRateTraslado,
    baseRateRequired: detailCostsCopy.hint.baseRateIngresoRequired,
    baseRateNoClient:
      "Opcional si aún no hay cliente en el paso de información.",
  },
  action: {
    addCost: detailCostsCopy.action.addCost,
    addExpense: detailCostsCopy.action.addExpense,
  },
  state: {
    emptyOperationalTitle: detailCostsCopy.state.emptyOperationalTitle,
    emptyOperationalDescription:
      'Use "Agregar costo" para registrar combustible, casetas y otros costos directos del servicio.',
    emptyIndirectTitle: detailCostsCopy.state.emptyIndirectTitle,
    emptyIndirectDescription:
      'Use "Agregar gasto" para viáticos, hospedaje, estacionamiento y otros conceptos indirectos.',
  },
  alert: {
    marginCriticalTitle: detailCostsCopy.alert.marginCriticalTitle,
    marginCriticalBody:
      "El margen está por debajo del 10%. Revisa tarifa o conceptos antes de continuar.",
  },
  financialSummary: detailCostsCopy.financialSummary,
} as const;
