/**
 * Namespace: trips.copy.wizard.fiscal.*
 * Copy contextual de quién entrega / recibe por parada.
 */
import type { StopTypeValue } from "@features/trips/domain";

export const RFC_PUBLICO_GENERAL = "XAXX010101000";

export type CfdiDocumentIntent = "ingreso" | "traslado";

export type StopCategory = "origin" | "waypoint" | "destination";

/** Contexto de UI para la sección de contraparte de una parada. */
export type StopFiscalUiContext =
  | "origin"
  | "destination"
  | "waypoint_pickup_only"
  | "waypoint_delivery_only"
  | "waypoint_pickup_and_delivery";

const fiscalStrings = {
  origin: {
    ingreso: {
      sectionTitle: "Quién entrega aquí",
      sectionHint:
        "Quién entrega la mercancía al transportista en el origen (no es necesariamente el cliente que paga el flete).",
      rfcLabel: "RFC",
      rfcPlaceholder: "Ej. ABC123456789",
      nombrePlaceholder: "Nombre o razón social de quien entrega",
    },
    traslado: {
      sectionTitle: "Quién entrega aquí",
      sectionHint:
        "Quién despacha la mercancía en el origen (traslado propio o entre ubicaciones).",
      rfcLabel: "RFC",
      rfcPlaceholder: "Ej. ABC123456789",
      nombrePlaceholder: "Nombre o razón social de quien entrega",
    },
  },
  destination: {
    ingreso: {
      sectionTitle: "Quién recibe aquí",
      sectionHint: "Quién recibe la mercancía en el destino final.",
      rfcLabel: "RFC",
      rfcPlaceholder: "Ej. XYZ987654321",
      nombrePlaceholder: "Nombre o razón social de quien recibe",
    },
    traslado: {
      sectionTitle: "Quién recibe aquí",
      sectionHint:
        "Quién recibe en destino (puede coincidir con el del origen en traslados entre sucursales).",
      rfcLabel: "RFC",
      rfcPlaceholder: "Ej. XYZ987654321",
      nombrePlaceholder: "Nombre o razón social de quien recibe",
    },
  },
  waypointPickup: {
    sectionTitle: "Quién entrega aquí",
    sectionHint: "Quién entrega la mercancía en esta escala (operación de carga).",
    rfcLabel: "RFC",
    rfcPlaceholder: "Ej. ABC123456789",
    nombrePlaceholder: "Nombre o razón social de quien entrega",
  },
  waypointDelivery: {
    sectionTitle: "Quién recibe aquí",
    sectionHint: "Quién recibe la mercancía en esta escala (operación de entrega).",
    rfcLabel: "RFC",
    rfcPlaceholder: "Ej. XYZ987654321",
    nombrePlaceholder: "Nombre o razón social de quien recibe",
  },
  waypointBoth: {
    sectionTitle: "Quién entrega y quién recibe",
    sectionHint:
      "Captura quién entrega (carga) y quién recibe (entrega) cuando ambas operaciones aplican en la misma ubicación.",
    rfcLabel: "RFC de quien entrega",
    rfcPlaceholder: "Ej. ABC123456789",
    nombrePlaceholder: "Nombre de quien entrega",
  },
  default: {
    sectionTitle: "Quién entrega o recibe",
    sectionHint: "",
    rfcLabel: "RFC",
    rfcPlaceholder: "RFC de 12 o 13 caracteres",
    nombrePlaceholder: "Nombre o razón social",
  },
  deliveryBlock: {
    blockTitle: "Quién recibe en esta escala (entrega)",
    rfcLabel: "RFC de quien recibe",
    rfcPlaceholder: "Ej. XYZ987654321",
    nombrePlaceholder: "Nombre de quien recibe",
  },
  publicGeneralNotice:
    "Usas el RFC genérico de público en general. Verifica con tu área contable antes de facturar.",
  missingLabels: {
    primaryRfc: "RFC de quien entrega o recibe",
    primaryName: "Nombre de quien entrega o recibe",
    deliveryRfc: "RFC de quien recibe (entrega)",
    deliveryName: "Nombre de quien recibe (entrega)",
  },
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
