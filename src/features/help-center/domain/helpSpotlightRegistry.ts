/**
 * TEC Ola A §3.2 — mapa artículo → anclas DOM (solo web; no metadato API).
 */

export type HelpSpotlightTarget = {
  anchorId: string;
  /** Etiqueta corta junto al CTA (no sustituye el guide). */
  stepLabel: string;
  /** Rutas donde el CTA tiene sentido; default = article.screens vía matchHelpScreen. */
  screens?: string[];
};

export type HelpSpotlightRegistry = Record<string, HelpSpotlightTarget[]>;

/** Piloto A1 — ≥3 de 5 con ancla funcional; meta los 5. */
export const helpSpotlightRegistry: HelpSpotlightRegistry = {
  "facturar-viaje": [
    {
      anchorId: "inv-facturar-row",
      stepLabel: "Botón Facturar en la fila",
      screens: ["/finance/invoiceable"],
    },
  ],
  "reservar-viaje": [
    {
      anchorId: "trip-reservar-cta",
      stepLabel: "Reservar viaje",
      screens: ["/trips", "/trips/new"],
    },
  ],
  "aprobar-cola": [
    {
      anchorId: "appr-approve-action",
      stepLabel: "Acción Aprobar",
      screens: ["/finance/approvals"],
    },
  ],
  "liquidar-viaje": [
    {
      anchorId: "stl-liquidar-periodo",
      stepLabel: "Liquidar período / Armar pago",
      screens: [
        "/finance/settlements",
        "/finance/settlements/new",
        "/finance/settlements/:id",
      ],
    },
  ],
  "enviar-factura": [
    {
      anchorId: "send-enviar-factura",
      stepLabel: "Enviar factura",
      screens: ["/finance/invoices", "/invoices/:id", "/finance/dispatch"],
    },
  ],
};

export function getHelpSpotlightTargets(
  articleId: string,
): HelpSpotlightTarget[] {
  return helpSpotlightRegistry[articleId] ?? [];
}

/** Target primario = primero del registry (DoD mínimo OA-3). */
export function getPrimaryHelpSpotlightTarget(
  articleId: string,
): HelpSpotlightTarget | null {
  const targets = getHelpSpotlightTargets(articleId);
  return targets[0] ?? null;
}
