import type { PatchTripStopFiscalResult, TripStop } from "@features/trips/domain";
import { TripFiscalCorrectionSheet } from "./TripFiscalCorrectionSheet";

export interface FixStopRfcSheetProps {
  tripId: string;
  stop: TripStop;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (result: PatchTripStopFiscalResult) => void;
  submitLabel?: string;
  overlayError?: string | null;
}

/** @deprecated Prefer TripFiscalCorrectionSheet */
export function FixStopRfcSheet(props: FixStopRfcSheetProps) {
  return <TripFiscalCorrectionSheet mode="apply-now" correctionKind="rfc" {...props} />;
}
