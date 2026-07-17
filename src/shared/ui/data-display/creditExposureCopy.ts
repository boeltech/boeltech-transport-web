import type { CreditExposureStatus } from "@features/clients/domain/entities";

export const creditExposureCopy = {
  title: "Crédito disponible",
  noCreditTerms: "Cliente de contado — sin crédito asignado",
  noLimit: "Sin límite definido",
  configureLimit: "Configurar límite",
  available: "Monto disponible",
  utilization: "Utilización",
  breakdown: {
    invoiced: "Facturado",
    unbilled: "Sin facturar",
    pendingDraft: "Borrador",
  },
  nextDue: (dateLabel: string) => `Próx. vencimiento: ${dateLabel}`,
  loading: "Calculando exposición de crédito…",
  unavailable: "No se pudo cargar la exposición de crédito",
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
      "El cliente ha consumido al menos el 80% de su límite. Revisa el desglose en Términos comerciales.",
    exceededTitle: "Cliente excede su límite de crédito",
    exceededBody:
      "La exposición actual supera el límite autorizado. Revisa facturado, viajes sin facturar y borradores.",
  },
} as const;
