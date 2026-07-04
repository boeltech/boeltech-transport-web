import type { TripCorrectionStopAddress } from "@boeltech/cfdi-domain/validadores/trip-stop-fiscal";
import type { TripStop } from "./entities";

export interface PatchTripStopFiscalPayload {
  readonly rfcRemitenteDestinatario?: string;
  readonly nombreRemitenteDestinatario?: string;
  readonly addressId?: string;
  readonly stopAddress?: TripCorrectionStopAddress;
  readonly reason: string;
  readonly propagateToClient?: boolean;
}

export interface PatchTripStopFiscalResult {
  readonly stop: TripStop;
  readonly clientUpdated: boolean;
  readonly message: string;
}
