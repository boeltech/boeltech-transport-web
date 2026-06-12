import type { TripStop } from "./entities";

export interface PatchTripStopFiscalPayload {
  readonly rfcRemitenteDestinatario: string;
  readonly nombreRemitenteDestinatario?: string;
  readonly reason: string;
  readonly propagateToClient?: boolean;
}

export interface PatchTripStopFiscalResult {
  readonly stop: TripStop;
  readonly clientUpdated: boolean;
  readonly message: string;
}
