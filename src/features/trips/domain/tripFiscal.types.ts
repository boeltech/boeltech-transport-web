import type { Trip } from "./entities";

export interface PatchTripFiscalPayload {
  readonly driverId?: string;
  readonly vehicleId?: string;
  readonly reason: string;
}

export interface PatchTripFiscalResult {
  readonly trip: Trip;
  readonly message: string;
}
