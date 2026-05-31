/**
 * Namespace: trips.copy.wizard.fiscal.*
 * Copy contextual RFC / razón social Carta Porte 3.1 (nodo Ubicacion).
 */
import type { StopTypeValue } from "@features/trips/domain";

export const RFC_PUBLICO_GENERAL = "XAXX010101000";

export type CfdiDocumentIntent = "ingreso" | "traslado";

export type StopCategory = "origin" | "waypoint" | "destination";

/** Contexto de UI para la sección fiscal de una parada. */
export type StopFiscalUiContext =
  | "origin"
  | "destination"
  | "waypoint_pickup_only"
  | "waypoint_delivery_only"
  | "waypoint_pickup_and_delivery";

const fiscalStrings = {
  origin: {
    ingreso: {
      sectionTitle: "Datos del remitente en este punto",
      sectionHint:
        "RFC de quien entrega la mercancía al transportista en el origen (no es necesariamente el cliente que paga el flete).",
      rfcLabel: "RFC del remitente",
      rfcPlaceholder: "Ej. ABC123456789",
      nombrePlaceholder: "Razón social o nombre del remitente",
    },
    traslado: {
      sectionTitle: "Datos del remitente en este punto",
      sectionHint:
        "RFC de quien despacha la mercancía en el origen (traspaso / traslado propio).",
      rfcLabel: "RFC del remitente",
      rfcPlaceholder: "Ej. ABC123456789",
      nombrePlaceholder: "Razón social o nombre del remitente",
    },
  },
  destination: {
    ingreso: {
      sectionTitle: "Datos del destinatario en este punto",
      sectionHint: "RFC de quien recibe la mercancía en el destino final.",
      rfcLabel: "RFC del destinatario",
      rfcPlaceholder: "Ej. XYZ987654321",
      nombrePlaceholder: "Razón social o nombre del destinatario",
    },
    traslado: {
      sectionTitle: "Datos del destinatario en este punto",
      sectionHint:
        "RFC de quien recibe en destino (puede coincidir con el del origen en traslados entre sucursales).",
      rfcLabel: "RFC del destinatario",
      rfcPlaceholder: "Ej. XYZ987654321",
      nombrePlaceholder: "Razón social o nombre del destinatario",
    },
  },
  waypointPickup: {
    sectionTitle: "Datos del remitente en esta escala",
    sectionHint:
      "RFC de la contraparte fiscal en la carga en este punto (Carta Porte: ubicación con operación de recogida).",
    rfcLabel: "RFC del remitente",
    rfcPlaceholder: "Ej. ABC123456789",
    nombrePlaceholder: "Razón social o nombre del remitente",
  },
  waypointDelivery: {
    sectionTitle: "Datos del destinatario en esta escala",
    sectionHint:
      "RFC de la contraparte fiscal en la descarga en este punto (Carta Porte: ubicación con entrega).",
    rfcLabel: "RFC del destinatario",
    rfcPlaceholder: "Ej. XYZ987654321",
    nombrePlaceholder: "Razón social o nombre del destinatario",
  },
  waypointBoth: {
    sectionTitle: "Contrapartes fiscales en esta escala",
    sectionHint:
      "Captura remitente (carga) y destinatario (descarga) cuando ambas operaciones aplican en la misma ubicación.",
    rfcLabel: "RFC del remitente (carga)",
    rfcPlaceholder: "Ej. ABC123456789",
    nombrePlaceholder: "Razón social remitente",
  },
  default: {
    sectionTitle: "Datos fiscales de la ubicación",
    sectionHint: "",
    rfcLabel: "RFC",
    rfcPlaceholder: "RFC de 12 o 13 caracteres",
    nombrePlaceholder: "Nombre o razón social",
  },
  deliveryBlock: {
    blockTitle: "Destinatario en esta escala (descarga)",
    rfcLabel: "RFC del destinatario (descarga)",
    rfcPlaceholder: "Ej. XYZ987654321",
    nombrePlaceholder: "Razón social del destinatario",
  },
  publicGeneralNotice:
    "Usas el RFC genérico de público en general. El SAT puede ser restrictivo en Carta Porte por trazabilidad; valida con tu PAC antes de timbrar. El PAC (Profact) validará RFC contra el padrón.",
} as const;

export function resolveStopFiscalUiContext(
  category: StopCategory | undefined,
  stopType: StopTypeValue[] | undefined,
): StopFiscalUiContext {
  const st = stopType ?? [];
  const hasPickup = st.includes("pickup");
  const hasDelivery = st.includes("delivery");

  if (category === "origin") return "origin";
  if (category === "destination") return "destination";
  if (category === "waypoint") {
    if (hasPickup && hasDelivery) return "waypoint_pickup_and_delivery";
    if (hasPickup) return "waypoint_pickup_only";
    if (hasDelivery) return "waypoint_delivery_only";
  }
  return "waypoint_pickup_only";
}

export function getPrimaryFiscalSectionCopy(
  ctx: StopFiscalUiContext,
  cfdiIntent: CfdiDocumentIntent | undefined,
): {
  sectionTitle: string;
  sectionHint: string;
  rfcLabel: string;
  rfcPlaceholder: string;
  nombrePlaceholder: string;
} {
  const intentKey = cfdiIntent === "traslado" ? "traslado" : "ingreso";

  switch (ctx) {
    case "origin":
      return fiscalStrings.origin[intentKey];
    case "destination":
      return fiscalStrings.destination[intentKey];
    case "waypoint_pickup_only":
      return fiscalStrings.waypointPickup;
    case "waypoint_delivery_only":
      return fiscalStrings.waypointDelivery;
    case "waypoint_pickup_and_delivery":
      return fiscalStrings.waypointBoth;
    default:
      return fiscalStrings.default;
  }
}

export function getDeliveryFiscalCopy(): {
  rfcLabel: string;
  rfcPlaceholder: string;
  nombrePlaceholder: string;
  blockTitle: string;
} {
  return fiscalStrings.deliveryBlock;
}

export function publicGeneralRfcNotice(): string {
  return fiscalStrings.publicGeneralNotice;
}

export const fiscalCopy = fiscalStrings;
