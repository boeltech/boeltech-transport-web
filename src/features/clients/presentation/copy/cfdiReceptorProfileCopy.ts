/**
 * Copy ADR-0096 — perfil de facturación (cliente).
 * Sentence-case; PRD agent c6ed85df.
 */

export const cfdiReceptorProfileCopy = {
  field: {
    label: "Perfil de facturación",
    hintReceptor:
      "RFC, régimen y domicilio fiscal son obligatorios para timbrar.",
    hintComercial:
      "Para abasto u operación sin factura. RFC y domicilio fiscal no son obligatorios.",
  },
  options: {
    receptor_cfdi: "Receptor CFDI",
    comercial_only: "Solo comercial",
  },
  badge: {
    comercialOnly: "Solo comercial",
    receptorCfdi: "Receptor CFDI",
    rfcNotReady: "RFC no listo para timbrar",
  },
  defaultLiquidacion: {
    label: "Liquidación por defecto",
    emitir: "Emitir CFDI",
    sinCfdi: "Sin CFDI · efectivo",
  },
  paymentTermsHint:
    "Contado o crédito. No define si el viaje se factura.",
  complianceNotice:
    "Este modo no emite CFDI. La responsabilidad fiscal queda en tu operación.",
  addressStep: {
    optionalTitle: "Dirección fiscal (opcional)",
    optionalHint:
      "Puedes omitir el domicilio fiscal. Agrégalo después si el cliente pasa a Receptor CFDI.",
    skipLabel: "Continuar sin domicilio fiscal",
  },
  completeProfileGuide:
    "Completa el perfil Receptor CFDI (RFC y régimen) antes de emitir factura en un viaje.",
} as const;
