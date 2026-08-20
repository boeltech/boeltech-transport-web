/**
 * Paradas del wizard / StopFormSheet ? UX + SoT `@boeltech/cfdi-domain` (SAT inline + coords).
 * RFC/nombre remitente-destinatario: validaci?n operativa web (secci?n fiscal del di?logo).
 *
 * El Sheet del tab Ruta no usa zodResolver: este m?dulo + gate UX en StopFormSheet
 * son la SoT al guardar (`requireFiscal: false` con keepBillingCollapsed).
 */

import type { ValidationError } from "@boeltech/cfdi-domain";
import {
  validateTripStopFiscalFields,
  validationErrorsToRecord,
} from "@boeltech/cfdi-domain/validadores/address-payload-result";
import { validateTripStopInlineAddress } from "@shared/cfdi/addressPayloadBridge";
import { fiscalCopy } from "../../../copy/wizard/fiscalCopy";
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
 * RFC y raz?n social obligatorios (SoT paquete `validateTripStopFiscalFields`).
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

/** Etiquetas del resumen de validaci?n (alineadas a FieldInlineError). */
export const TRIP_STOP_FISCAL_MISSING_LABELS = fiscalCopy.missingLabels;

export type TripStopFiscalFieldName =
  | "rfcRemitenteDestinatario"
  | "nombreRemitenteDestinatario"
  | "deliveryRfcRemitenteDestinatario"
  | "deliveryNombreRemitenteDestinatario";

export function fiscalMissingLabelToFieldName(
  label: string,
): TripStopFiscalFieldName | null {
  switch (label) {
    case TRIP_STOP_FISCAL_MISSING_LABELS.primaryRfc:
      return "rfcRemitenteDestinatario";
    case TRIP_STOP_FISCAL_MISSING_LABELS.primaryName:
      return "nombreRemitenteDestinatario";
    case TRIP_STOP_FISCAL_MISSING_LABELS.deliveryRfc:
      return "deliveryRfcRemitenteDestinatario";
    case TRIP_STOP_FISCAL_MISSING_LABELS.deliveryName:
      return "deliveryNombreRemitenteDestinatario";
    default:
      return null;
  }
}

/** Abre el bloque de RFC de parada si el intento de guardar fall? por RFC/raz?n social. */
export function shouldExpandStopBillingOnValidation(args: {
  attemptedSubmit: boolean;
  missingLabels: readonly string[];
  hasFiscalFieldError: boolean;
}): boolean {
  if (!args.attemptedSubmit) return false;
  if (args.hasFiscalFieldError) return true;
  return args.missingLabels.some(
    (label) => fiscalMissingLabelToFieldName(label) != null,
  );
}

/** Etiquetas legibles para el pie del di?logo (highlights). */
export function getTripStopFiscalMissingLabels(stop: TripStopFiscalInput): string[] {
  const fieldErrors = validateTripStopFiscalFieldErrors(stop);
  const labels: string[] = [];
  if (fieldErrors.rfcRemitenteDestinatario) {
    labels.push(TRIP_STOP_FISCAL_MISSING_LABELS.primaryRfc);
  }
  if (fieldErrors.nombreRemitenteDestinatario) {
    labels.push(TRIP_STOP_FISCAL_MISSING_LABELS.primaryName);
  }
  if (fieldErrors.deliveryRfcRemitenteDestinatario) {
    labels.push(TRIP_STOP_FISCAL_MISSING_LABELS.deliveryRfc);
  }
  if (fieldErrors.deliveryNombreRemitenteDestinatario) {
    labels.push(TRIP_STOP_FISCAL_MISSING_LABELS.deliveryName);
  }
  return labels;
}

/**
 * Validaci?n al guardar parada: domicilio SAT + coords (paquete) y fiscal operativo.
 * Aplica con domicilio inline o reutilizando `addressId` del cat?logo (revalidaci?n en contexto parada).
 *
 * `requireFiscal: false` (tab Ruta / keepBillingCollapsed): propaga al paquete v?a
 * `validateTripStopInlineAddress` ? no exige RFC/nombre en este guardado diferible.
 */
export async function validateTripStopAddressComplete(
  stop: Record<string, unknown>,
  options: { requireCoordinates?: boolean; requireFiscal?: boolean } = {},
): Promise<TripStopAddressValidationResult> {
  const requireFiscal = options.requireFiscal ?? true;
  const sat = await validateTripStopInlineAddress(
    {
      addressType: "trip_stop",
      ...stop,
    },
    {
      requireCoordinates: options.requireCoordinates ?? true,
      requireFiscal,
    },
  );

  if (!sat.ok) {
    return sat;
  }

  if (!requireFiscal) {
    return { ok: true };
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
