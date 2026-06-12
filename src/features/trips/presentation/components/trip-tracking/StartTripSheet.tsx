import { useMemo, useState } from "react";
import { Loader2, Play } from "lucide-react";
import {
  isDriverStartableStatus,
  isVehicleStartableStatus,
} from "@boeltech/cfdi-domain/reglas/trip-resource-sync";

import { useStartTrip } from "@features/trips/application";
import { useDriver } from "@features/drivers/application";
import { DRIVER_STATUS_LABELS } from "@features/drivers/domain";
import { useVehicle } from "@features/vehicles/application";
import { VEHICLE_STATUS_LABELS } from "@features/vehicles/domain";
import type { Trip, TripStop } from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { HintIcon } from "@shared/ui/hint-icon";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { localInputToUtcIso, utcIsoToLocalInput } from "@shared/utils/dateUtils";

import {
  resolveSuggestedStartMileage,
  useSuggestedMileageField,
} from "../startTripMileage";
import { trackingCopy } from "../../copy";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";
import {
  trackingGpsToEventFields,
  type TrackingGpsCapture,
} from "./trackingGpsCapture";
import { createTrackingIdempotencyKey } from "./trackingIdempotency";

const copy = trackingCopy;

function defaultOccurredAtLocal(): string {
  return utcIsoToLocalInput(new Date().toISOString());
}

export type StartTripSheetProps = {
  tripId: string;
  tripCode: string;
  vehicleId?: string;
  driverId?: string;
  /** Kilometraje inicial ya persistido en el viaje (wizard / edición). */
  tripStartMileage?: number | null;
  /** Parada origen para ofrecer coords. guardadas al iniciar. */
  originStop?: Pick<TripStop, "latitude" | "longitude"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
};

type StartTripSheetBodyProps = Omit<StartTripSheetProps, "open">;

function StartTripSheetBody({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  originStop,
  onOpenChange,
  onSuccess,
}: StartTripSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const idempotencyKey = useMemo(() => createTrackingIdempotencyKey(), []);

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(vehicleId ?? "", {
    enabled: !!vehicleId,
  });
  const { data: driver, isLoading: isLoadingDriver } = useDriver(driverId ?? "", {
    enabled: !!driverId,
  });

  const resourceStartCheck = useMemo(() => {
    if (isLoadingVehicle || isLoadingDriver) {
      return { canStart: true as const, message: null as string | null };
    }

    const issues: string[] = [];
    if (vehicle && !isVehicleStartableStatus(vehicle.status)) {
      issues.push(
        copy.sheet.resourceBlockedVehicle(
          VEHICLE_STATUS_LABELS[vehicle.status] ?? vehicle.status,
        ),
      );
    }
    if (driver && !isDriverStartableStatus(driver.status)) {
      issues.push(
        copy.sheet.resourceBlockedDriver(
          DRIVER_STATUS_LABELS[driver.status] ?? driver.status,
        ),
      );
    }

    if (issues.length === 0) {
      return { canStart: true as const, message: null };
    }

    return { canStart: false as const, message: issues.join(" ") };
  }, [driver, isLoadingDriver, isLoadingVehicle, vehicle]);

  const suggestedMileage = resolveSuggestedStartMileage(
    vehicle?.currentMileage,
    tripStartMileage,
  );
  const mileageField = useSuggestedMileageField(suggestedMileage);

  const startMutation = useStartTrip({
    onSuccess: (trip) => {
      toast({
        title: copy.toast.tripStarted,
        description: copy.toast.tripStartedDescription(tripCode),
        variant: "success",
      });
      onSuccess?.(trip);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.startFailed,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirm = () => {
    if (!resourceStartCheck.canStart) return;

    const parsed = mileageField.parseValue();
    if (parsed === null) {
      toast({
        title: copy.toast.startMileageRequired,
        description: copy.toast.startMileageRequiredDescription,
        variant: "destructive",
      });
      return;
    }

    if (!occurredAt.trim()) {
      setTimeError(copy.validation.departureRequired);
      return;
    }
    setTimeError(null);

    const gpsFields = trackingGpsToEventFields(gps);
    startMutation.mutate({
      id: tripId,
      mileage: parsed,
      occurredAt: localInputToUtcIso(occurredAt),
      latitude: gpsFields.latitude,
      longitude: gpsFields.longitude,
      idempotencyKey,
    });
  };

  const mileageSourceHint =
    vehicle?.currentMileage != null
      ? copy.sheet.vehicleMileageHint(
          vehicle.currentMileage.toLocaleString("es-MX"),
        )
      : tripStartMileage != null
        ? copy.sheet.tripMileageHint(tripStartMileage.toLocaleString("es-MX"))
        : null;

  const isPending = startMutation.isPending;
  const startDisabled = isPending || !resourceStartCheck.canStart;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        {(vehicleId || driverId) && (
          <div className="space-y-2 rounded-md border bg-muted/30 p-3">
            <p className="text-sm font-medium">{copy.sheet.resourcesTitle}</p>
            {vehicleId ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">{copy.sheet.vehicleLabel}</span>
                <span>
                  {vehicle?.unitNumber ?? copy.sheet.loadingResource}
                  {vehicle?.licensePlate ? ` · ${vehicle.licensePlate}` : ""}
                </span>
                {vehicle ? (
                  <Badge variant="secondary">
                    {VEHICLE_STATUS_LABELS[vehicle.status] ?? vehicle.status}
                  </Badge>
                ) : isLoadingVehicle ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            ) : null}
            {driverId ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">{copy.sheet.driverLabel}</span>
                <span>
                  {driver?.employee?.fullName ?? copy.sheet.loadingResource}
                </span>
                {driver ? (
                  <Badge variant="secondary">
                    {DRIVER_STATUS_LABELS[driver.status] ?? driver.status}
                  </Badge>
                ) : isLoadingDriver ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                ) : null}
              </div>
            ) : null}
            {resourceStartCheck.message ? (
              <p className="text-xs text-destructive">{resourceStartCheck.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">{copy.sheet.resourcesHint}</p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="start-occurred-at">{copy.label.departureAt}</Label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="start-occurred-at"
              type="datetime-local"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
              disabled={isPending}
              aria-invalid={timeError ? true : undefined}
              className="min-w-[220px] flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOccurredAt(defaultOccurredAtLocal())}
              disabled={isPending}
            >
              {copy.action.now}
            </Button>
          </div>
          {timeError ? (
            <p className="text-xs text-destructive">{timeError}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {copy.validation.civilTimeHint}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="start-mileage">{copy.label.startMileage}</Label>
          <Input
            id="start-mileage"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={copy.sheet.startMileagePlaceholder}
            value={mileageField.value}
            onChange={(e) => mileageField.onValueChange(e.target.value)}
            disabled={isPending}
          />
          {isLoadingVehicle ? (
            <p className="text-xs text-muted-foreground">
              {copy.sheet.loadingVehicleMileage}
            </p>
          ) : mileageSourceHint ? (
            <p className="text-xs text-muted-foreground">{mileageSourceHint}</p>
          ) : null}
        </div>

        <TrackingGpsCaptureSection
          stop={originStop}
          value={gps}
          onChange={setGps}
          disabled={isPending}
        />
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
        <Button
          variant="outline"
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          {copy.action.cancel}
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={startDisabled}
          className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {copy.action.start}
        </Button>
      </SheetFooter>
    </>
  );
}

export function StartTripSheet({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  originStop,
  open,
  onOpenChange,
  onSuccess,
}: StartTripSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={TRACKING_SHEET_CONTENT_CLASS}>
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-start gap-2 pr-6">
            <Play className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="inline-flex items-center gap-1.5">
              {copy.action.start}
              <HintIcon label={copy.sheet.startHintLabel}>
                {copy.sheet.startHint(tripCode)}
              </HintIcon>
            </span>
          </SheetTitle>
          <SheetDescription>{copy.sheet.startDescription}</SheetDescription>
        </SheetHeader>

        {open ? (
          <StartTripSheetBody
            key={tripId}
            tripId={tripId}
            tripCode={tripCode}
            vehicleId={vehicleId}
            driverId={driverId}
            tripStartMileage={tripStartMileage}
            originStop={originStop}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
