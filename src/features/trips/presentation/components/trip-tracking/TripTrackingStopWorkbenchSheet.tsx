import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";

import type { CargoStatusType, TripCargo, TripStatusType, TripStop } from "@features/trips/domain";
import type { CargoManualAction } from "../../utils/cargoStatusActions";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
} from "./trackingSheetLayout";
import type { TrackingItineraryRow } from "./trackingOperationalHelpers";
import { TripTrackingStopOperationDetail } from "./TripTrackingStopOperationDetail";
import { trackingCopy } from "./trackingCopy";

export type TripTrackingStopWorkbenchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: TrackingItineraryRow | null;
  tripStatus: TripStatusType;
  orderedStops: readonly TripStop[];
  cargos: readonly TripCargo[];
  tripInProgress: boolean;
  pendingCargoAction?: { cargoId: string; action: CargoManualAction } | null;
  getCargoStatusVariant: (
    status: CargoStatusType,
  ) => "default" | "secondary" | "destructive" | "outline";
  onCargoAction: (cargoId: string, action: CargoManualAction) => void;
  canMutateCargo?: boolean;
};

/**
 * F6: Sheet del workbench solo para la parada en curso (cargas + gating).
 */
export function TripTrackingStopWorkbenchSheet({
  open,
  onOpenChange,
  row,
  tripStatus,
  orderedStops,
  cargos,
  tripInProgress,
  pendingCargoAction,
  getCargoStatusVariant,
  onCargoAction,
  canMutateCargo = true,
}: TripTrackingStopWorkbenchSheetProps) {
  return (
    <Sheet open={open && row != null} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle>{trackingCopy.sheet.stopWorkbenchTitle}</SheetTitle>
          <SheetDescription>
            {trackingCopy.sheet.stopWorkbenchDescription}
          </SheetDescription>
        </SheetHeader>
        <div className={TRACKING_SHEET_BODY_CLASS}>
          {row ? (
            <TripTrackingStopOperationDetail
              row={row}
              tripStatus={tripStatus}
              orderedStops={orderedStops}
              cargos={cargos}
              showHints={tripInProgress}
              tripInProgress={tripInProgress}
              pendingCargoAction={pendingCargoAction}
              getCargoStatusVariant={getCargoStatusVariant}
              onCargoAction={onCargoAction}
              canMutateCargo={canMutateCargo}
              compactDetailHeader
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
