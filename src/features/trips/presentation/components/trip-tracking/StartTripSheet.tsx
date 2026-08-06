import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Play } from "lucide-react";
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
import { Button } from "@shared/ui/button";
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

  const { data: vehicle, isLoading: isLoadingVehicle } = useVehicle(
    vehicleId ?? "",
    { enabled: !!vehicleId },
  );
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

  const isPending = startMutation.isPending;
  const startDisabled = isPending || !resourceStartCheck.canStart;
  const showAssignment = Boolean(vehicleId || driverId);
  const isLoadingAssignment =
    (Boolean(vehicleId) && isLoadingVehicle) ||
    (Boolean(driverId) && isLoadingDriver);

  const vehicleLine = vehicleId
    ? [
        vehicle?.unitNumber ?? null,
        vehicle?.licensePlate ? vehicle.licensePlate : null,
      ]
        .filter(Boolean)
        .join(" · ") || copy.sheet.loadingResource
    : null;

  const driverLine = driverId
    ? (driver?.employee?.fullName ?? copy.sheet.loadingResource)
    : null;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        {showAssignment ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {isLoadingAssignment ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {copy.sheet.loadingResource}
                </span>
              ) : (
                <>
                  {vehicleLine ? (
                    <span>
                      <span className="font-medium text-foreground">
                        {copy.sheet.vehicleLabel}
                      </span>
                      {` ${vehicleLine}`}
                    </span>
                  ) : null}
                  {vehicleLine && driverLine ? (
                    <span className="mx-1.5 text-border">·</span>
                  ) : null}
                  {driverLine ? (
                    <span>
                      <span className="font-medium text-foreground">
                        {copy.sheet.driverLabel}
                      </span>
                      {` ${driverLine}`}
                    </span>
                  ) : null}
                </>
              )}
            </p>
            {resourceStartCheck.message ? (
              <p
                role="alert"
                className="flex items-start gap-2 text-xs text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{resourceStartCheck.message}</span>
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="start-occurred-at">
            {copy.label.occurredAtDeparture}
          </Label>
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
          ) : null}
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
          ) : suggestedMileage != null ? (
            <p className="text-xs text-muted-foreground">
              {copy.sheet.suggestedMileageHint(
                suggestedMileage.toLocaleString("es-MX"),
              )}
            </p>
          ) : null}
        </div>

        <TrackingGpsCaptureSection
          stop={originStop}
          value={gps}
          onChange={setGps}
          disabled={isPending}
          variant="quiet"
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
            <span>{copy.action.start}</span>
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
