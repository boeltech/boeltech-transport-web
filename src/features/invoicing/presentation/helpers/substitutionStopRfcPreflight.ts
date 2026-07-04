import {
  preflightTripStopsRfc,
  type StopRfcPreflightResult,
  type TripStopRfcPreflightInput,
} from "@boeltech/cfdi-domain";
import type { TripStop } from "@features/trips/domain";
import { mapTripStopToPreflightInput } from "@features/trips/presentation/components/trip-fiscal/tripFiscalHelpers";
import type { TripCorrectionFormEntry } from "../validation/substitutionCorrectionsSchema";

function correctionByStopId(
  entries: readonly TripCorrectionFormEntry[],
): Map<string, TripCorrectionFormEntry> {
  const map = new Map<string, TripCorrectionFormEntry>();
  for (const entry of entries) {
    if (!entry.stop_id) continue;
    map.set(entry.stop_id, entry);
  }
  return map;
}

function trimOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/** Proyecta RFC efectivo de parada tras una corrección pendiente en el sheet. */
export function projectStopRfcPreflightInput(
  stop: TripStop,
  entry?: TripCorrectionFormEntry,
): TripStopRfcPreflightInput {
  if (!entry) {
    return mapTripStopToPreflightInput(stop);
  }

  if (entry.rfc_remitente_destinatario) {
    return {
      id: stop.id,
      order: stop.sequenceOrder,
      stopType: stop.stopType,
      addressRemitenteRfc: entry.rfc_remitente_destinatario,
      addressDestinatarioRfc: stop.destinatarioRfc,
      deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario,
    };
  }

  if (entry.stop_address) {
    return {
      id: stop.id,
      order: stop.sequenceOrder,
      stopType: stop.stopType,
      addressRemitenteRfc:
        trimOrNull(entry.stop_address.rfc_remitente_destinatario) ??
        stop.rfcRemitenteDestinatario,
      addressDestinatarioRfc:
        trimOrNull(entry.stop_address.destinatario_rfc) ?? stop.destinatarioRfc,
      deliveryRfcRemitenteDestinatario: stop.deliveryRfcRemitenteDestinatario,
    };
  }

  return mapTripStopToPreflightInput(stop);
}

export function runSubstitutionStopsPreflight(
  stopsById: ReadonlyMap<string, TripStop>,
  tripCorrections: readonly TripCorrectionFormEntry[],
): StopRfcPreflightResult {
  const correctionsByStop = correctionByStopId(tripCorrections);
  const affectedStopIds = new Set<string>();

  for (const entry of tripCorrections) {
    if (entry.stop_id && (entry.stop_address || entry.rfc_remitente_destinatario)) {
      affectedStopIds.add(entry.stop_id);
    }
  }

  const inputs: TripStopRfcPreflightInput[] = [];

  for (const stopId of affectedStopIds) {
    const stop = stopsById.get(stopId);
    if (!stop) continue;
    inputs.push(projectStopRfcPreflightInput(stop, correctionsByStop.get(stopId)));
  }

  return preflightTripStopsRfc(inputs);
}

export function formatSubstitutionPreflightMessage(
  preflight: StopRfcPreflightResult,
  labels: {
    missing: string;
    invalid: string;
  },
): string[] {
  return preflight.invalidStops.map((item) => {
    const reason =
      item.reason === "RFC_MISSING" ? labels.missing : labels.invalid;
    return `Parada #${item.stopOrder + 1}: ${reason}`;
  });
}
