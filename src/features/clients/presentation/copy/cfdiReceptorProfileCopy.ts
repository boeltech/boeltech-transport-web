/**
 * Copy ADR-0096 — perfil de facturación (cliente).
 * Pareja D3′: Con factura / Sin factura.
 */

export const cfdiReceptorProfileCopy = {
  field: {
    label: "Perfil de facturación",
    hintReceptor:
      "Exige RFC y régimen. Si el cobro es en efectivo y necesitas Carta Porte, el efectivo va en el CFDI.",
    hintComercial:
      "No hay Carta Porte. Si hace falta Carta Porte, el camino es Con factura.",
  },
  options: {
    receptor_cfdi: "Con factura",
    comercial_only: "Sin factura",
  },
  badge: {
    comercialOnly: "Sin factura",
    receptorCfdi: "Con factura",
    rfcNotReady: "RFC no listo para timbrar",
  },
  defaultLiquidacion: {
    label: "Factura del viaje",
    emitir: "Con factura",
    sinCfdi: "Sin factura",
  },
  paymentTermsHint:
    "Contado o crédito. No define si el viaje se factura.",
  complianceNotice:
    "Este modo no emite CFDI. La responsabilidad fiscal queda en tu operación.",
  addressStep: {
    optionalTitle: "Dirección fiscal (opcional)",
    optionalHint:
      "Puedes omitir el domicilio fiscal. Agrégalo después si el cliente pasa a Con factura.",
    skipLabel: "Continuar sin domicilio fiscal",
  },
  completeProfileGuide:
    "Completa RFC y régimen (Con factura) antes de facturar un viaje.",
} as const;
