/**
 * Datos para Carta Porte del viaje.
 * GET /trips/:tripId/fleet-snapshot · POST /trips/:tripId/fleet-snapshot:refresh
 */
import { apiClient, deepToCamel } from "@shared/api";
import type {
  RefreshTripFleetSnapshotInput,
  RefreshTripFleetSnapshotResult,
  TripFleetSnapshotData,
  TripFleetSnapshotView,
} from "@features/trips/domain";

const fleetSnapshotEndpoint = (tripId: string) => `/trips/${tripId}/fleet-snapshot`;

type Envelope = { data: unknown; message?: string };

export function mapTripFleetSnapshotView(raw: unknown): TripFleetSnapshotView {
  return deepToCamel(raw) as TripFleetSnapshotView;
}

export function mapRefreshTripFleetSnapshotResult(
  envelope: Envelope,
): RefreshTripFleetSnapshotResult {
  const data = deepToCamel(envelope.data) as {
    fleetSnapshot: TripFleetSnapshotData;
    refreshedBlocks?: RefreshTripFleetSnapshotResult["refreshedBlocks"];
    changedFields?: string[];
    requiresFiscalAttention?: boolean;
    auditLogId?: string | null;
  };
  return {
    fleetSnapshot: data.fleetSnapshot,
    refreshedBlocks: data.refreshedBlocks ?? [],
    changedFields: data.changedFields ?? [],
    requiresFiscalAttention: Boolean(data.requiresFiscalAttention),
    auditLogId: data.auditLogId ?? null,
    message: envelope.message ?? "",
  };
}

/** Solo manda la huella de los bloques pedidos (el API ignora las demás). */
export function buildRefreshTripFleetSnapshotBody(input: RefreshTripFleetSnapshotInput) {
  const masterFingerprint: Partial<Record<"vehicle" | "driver", string>> = {};
  if (input.blocks.vehicle && input.expected.masterFingerprint.vehicle) {
    masterFingerprint.vehicle = input.expected.masterFingerprint.vehicle;
  }
  if (input.blocks.driver && input.expected.masterFingerprint.driver) {
    masterFingerprint.driver = input.expected.masterFingerprint.driver;
  }
  return {
    blocks: { vehicle: input.blocks.vehicle, driver: input.blocks.driver },
    reason: input.reason.trim(),
    expected: {
      snapshotUpdatedAt: input.expected.snapshotUpdatedAt,
      masterFingerprint,
    },
  };
}

export const tripFleetSnapshotApi = {
  async get(tripId: string): Promise<TripFleetSnapshotView> {
    const response = await apiClient.get<Envelope>(fleetSnapshotEndpoint(tripId));
    return mapTripFleetSnapshotView(response.data);
  },

  async refresh(
    tripId: string,
    input: RefreshTripFleetSnapshotInput,
  ): Promise<RefreshTripFleetSnapshotResult> {
    const response = await apiClient.post<Envelope>(
      `${fleetSnapshotEndpoint(tripId)}:refresh`,
      buildRefreshTripFleetSnapshotBody(input),
    );
    return mapRefreshTripFleetSnapshotResult(response);
  },
};
