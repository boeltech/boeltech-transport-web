import type { CreditExposureStatus } from "@features/clients/domain/entities";

export const creditExposureCopy = {
  title: "Crédito disponible",
  description: "Cuánto puede usar el cliente antes de llegar a su límite.",
  noCreditTerms: "Cliente de contado — sin crédito asignado",
  noLimit: "Sin límite definido",
  configureLimit: "Configurar límite",
  overLimit: "Sobre el límite",
  used: "Usado",
  usedOfLimit: (usedLabel: string, limitLabel: string) =>
    `Usado ${usedLabel} de ${limitLabel}`,
  utilization: "Utilización del límite",
  breakdownTitle: "En qué está usado",
  breakdown: {
    invoiced: "Facturas por cobrar",
    unbilled: "Viajes por facturar",
    pendingDraft: "Facturas en borrador",
  },
  nextDue: (dateLabel: string) => `Próximo vencimiento: ${dateLabel}`,
  loading: "Calculando crédito disponible…",
  unavailable: "No se pudo cargar el crédito disponible",
  statusLabel: {
    no_credit_terms: "Contado",
    no_limit: "Sin límite",
    ok: "Disponible",
    warn: "Alto",
    exceeded: "Sobre límite",
  } satisfies Record<CreditExposureStatus, string>,
  wizardWarning: {
    ok: "",
    warn: "El cliente tiene utilización alta de crédito (≥80%). Puedes continuar; no hay bloqueo.",
    exceeded:
      "El cliente excede su límite de crédito. Puedes continuar; no hay bloqueo en este plan.",
    no_limit:
      "El cliente está en crédito sin límite definido. Considera registrar un monto en su ficha.",
    no_credit_terms: "",
  } satisfies Record<CreditExposureStatus, string>,
  alerts: {
    warnTitle: "Utilización alta de crédito",
    warnBody:
      "El cliente ha usado al menos el 80% de su límite. Revisa el detalle en Crédito disponible.",
    exceededTitle: "Cliente excede su límite de crédito",
    exceededBody:
      "Lo usado supera el límite autorizado. Revisa facturas por cobrar, viajes por facturar y borradores.",
  },
} as const;
