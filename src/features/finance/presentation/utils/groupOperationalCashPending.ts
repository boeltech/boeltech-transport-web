/**
 * Agrupa viajes de la página actual por cliente, alineando subtotales de meta.by_client.
 */

import type {
  OperationalCashPendingByClient,
  OperationalCashPendingTrip,
} from "@features/finance/domain/operationalCashPending";

export interface OperationalCashPendingClientGroup {
  clientId: string | null;
  clientName: string | null;
  /** Subtotal del universo filtrado (meta.by_client), no solo la página. */
  pendingAmount: number;
  tripCount: number;
  trips: OperationalCashPendingTrip[];
}

function clientKey(clientId: string | null): string {
  return clientId ?? "__none__";
}

/**
 * Respeta el orden de `byClient` (API); viajes de la página caen en su grupo.
 * Clientes sin filas en la página actual no se muestran (solo aparecen si hay viaje en data).
 */
export function groupOperationalCashPendingByClient(
  trips: OperationalCashPendingTrip[],
  byClient: OperationalCashPendingByClient[],
): OperationalCashPendingClientGroup[] {
  const tripsByKey = new Map<string, OperationalCashPendingTrip[]>();
  for (const trip of trips) {
    const key = clientKey(trip.clientId);
    const list = tripsByKey.get(key);
    if (list) {
      list.push(trip);
    } else {
      tripsByKey.set(key, [trip]);
    }
  }

  const groups: OperationalCashPendingClientGroup[] = [];
  const seen = new Set<string>();

  for (const client of byClient) {
    const key = clientKey(client.clientId);
    const pageTrips = tripsByKey.get(key);
    if (!pageTrips?.length) continue;
    seen.add(key);
    groups.push({
      clientId: client.clientId,
      clientName: client.clientName,
      pendingAmount: client.pendingAmount,
      tripCount: client.tripCount,
      trips: pageTrips,
    });
  }

  for (const [key, pageTrips] of tripsByKey) {
    if (seen.has(key)) continue;
    const first = pageTrips[0]!;
    groups.push({
      clientId: first.clientId,
      clientName: first.clientName,
      pendingAmount: pageTrips.reduce(
        (sum, t) => sum + t.operationalCash.pendingAmount,
        0,
      ),
      tripCount: pageTrips.length,
      trips: pageTrips,
    });
  }

  return groups;
}
