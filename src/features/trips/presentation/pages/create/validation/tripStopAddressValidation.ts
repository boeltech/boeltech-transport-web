/**
 * Paradas del wizard — UX + SoT `@boeltech/cfdi-domain` (SAT inline + coords).
 * RFC/nombre remitente-destinatario: validación operativa web (sección fiscal del diálogo).
 */

import type { ValidationError } from "@boeltech/cfdi-domain";
import {
  validateTripStopFiscalFields,
  validationErrorsToRecord,
} from "@boeltech/cfdi-domain/validadores/address-payload-result";
import { validateTripStopInlineAddress } from "@shared/cfdi/addressPayloadBridge";
import type { StopCategory } from "../components/stopDialogAddressMapper";
import type { StopTypeValue } from "@features/trips/domain";

export type TripStopAddressValidationResult =
  | { ok: true }
  | { ok: false; errors: ValidationError[]; fieldErrors: Record<string, string> };

export interface TripStopFiscalInput {
  stopCategory?: StopCategory;
  stopType?: StopTypeValue[];
  rfcRemitenteDestinatario?: string | null;
  nombreRemitenteDestinatario?: string | null;
  deliveryRfcRemitenteDestinatario?: string | null;
  deliveryNombreRemitenteDestinatario?: string | null;
}

const FISCAL_FIELD_CAMEL: Record<string, string> = {
  rfc_remitente_destinatario: "rfcRemitenteDestinatario",
  nombre_remitente_destinatario: "nombreRemitenteDestinatario",
  delivery_rfc_remitente_destinatario: "deliveryRfcRemitenteDestinatario",
  delivery_nombre_remitente_destinatario: "deliveryNombreRemitenteDestinatario",
};

function stopCategoryToStopType(
  category: StopCategory | undefined,
  stopType: StopTypeValue[] | undefined,
): unknown {
  const st = stopType ?? [];
  if (category === "origin") return ["origin", ...st.filter((t) => t !== "origin")];
  if (category === "destination") {
    return ["destination", ...st.filter((t) => t !== "destination")];
  }
  if (category === "waypoint") return st.length > 0 ? st : ["waypoint"];
  return st;
}

/**
 * RFC y razón social obligatorios (SoT paquete `validateTripStopFiscalFields`).
 */
export function validateTripStopFiscalFieldErrors(
  stop: TripStopFiscalInput,
): Record<string, string> {
  const result = validateTripStopFiscalFields({
    stop_type: stopCategoryToStopType(stop.stopCategory, stop.stopType),
    rfc_remitente_destinatario: stop.rfcRemitenteDestinatario ?? "",
    nombre_remitente_destinatario: stop.nombreRemitenteDestinatario ?? "",
    delivery_rfc_remitente_destinatario:
      stop.deliveryRfcRemitenteDestinatario ?? "",
    delivery_nombre_remitente_destinatario:
      stop.deliveryNombreRemitenteDestinatario ?? "",
  });
  if (result.ok) return {};

  const snakeErrors = validationErrorsToRecord(result.error);
  const out: Record<string, string> = {};
  for (const [path, message] of Object.entries(snakeErrors)) {
    const camel = FISCAL_FIELD_CAMEL[path] ?? path;
    out[camel] = message;
  }
  return out;
}

/** Etiquetas legibles para el pie del diálogo (highlights). */
export function getTripStopFiscalMissingLabels(stop: TripStopFiscalInput): string[] {
  const fieldErrors = validateTripStopFiscalFieldErrors(stop);
  const labels: string[] = [];
  if (fieldErrors.rfcRemitenteDestinatario) {
    labels.push("RFC remitente/destinatario");
  }
  if (fieldErrors.nombreRemitenteDestinatario) {
    labels.push("Nombre remitente/destinatario");
  }
  if (fieldErrors.deliveryRfcRemitenteDestinatario) {
    labels.push("RFC destinatario (descarga)");
  }
  if (fieldErrors.deliveryNombreRemitenteDestinatario) {
    labels.push("Nombre destinatario (descarga)");
  }
  return labels;
}

/**
 * Validación al guardar parada: domicilio SAT + coords (paquete) y fiscal operativo.
 * Aplica con domicilio inline o reutilizando `addressId` del catálogo (revalidación en contexto parada).
 */
export async function validateTripStopAddressComplete(
  stop: Record<string, unknown>,
  options: { requireCoordinates?: boolean } = {},
): Promise<TripStopAddressValidationResult> {
  const sat = await validateTripStopInlineAddress(
    {
      addressType: "trip_stop",
      ...stop,
    },
    { requireCoordinates: options.requireCoordinates ?? true },
  );

  if (!sat.ok) {
    return sat;
  }

  const fiscalFieldErrors = validateTripStopFiscalFieldErrors({
    stopCategory: stop.stopCategory as StopCategory | undefined,
    stopType: stop.stopType as StopTypeValue[] | undefined,
    rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario as string | undefined,
    nombreRemitenteDestinatario: stop.nombreRemitenteDestinatario as string | undefined,
    deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario as
      | string
      | undefined,
    deliveryNombreRemitenteDestinatario: stop.deliveryNombreRemitenteDestinatario as
      | string
      | undefined,
  });

  if (Object.keys(fiscalFieldErrors).length > 0) {
    return {
      ok: false,
      errors: Object.entries(fiscalFieldErrors).map(([path, message]) => ({
        code: "TRIP_STOP_FISCAL_REQUIRED",
        message,
        path,
      })),
      fieldErrors: fiscalFieldErrors,
    };
  }

  return { ok: true };
}
