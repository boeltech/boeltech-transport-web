import { useMemo, useState } from "react";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import {
  isDriverStartableStatus,
  isVehicleStartableStatus,
} from "@boeltech/cfdi-domain/reglas/trip-resource-sync";

import {
  useCreateTrackingEventBatch,
  useStartTrip,
} from "@features/trips/application";
import { useDriver } from "@features/drivers/application";
import { DRIVER_STATUS_LABELS } from "@features/drivers/domain";
import { useVehicle } from "@features/vehicles/application";
import { VEHICLE_STATUS_LABELS } from "@features/vehicles/domain";
import type {
  CfdiEmissionIntent,
  Trip,
  TripCargo,
  TripStop,
} from "@features/trips/domain";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { DetailAlertCard } from "@shared/ui/data-display";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
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
import { cfdiEmissionIntentCopy } from "../../copy/cfdiEmissionIntentCopy";
import { trackingCopy } from "../../copy";
import {
  resolveSinCfdiCargoApiErrorMessage,
  sinCfdiCargoBlockReason,
} from "../../utils/tripSinCfdiCargoGating";
import { TrackingGpsCaptureSection } from "./TrackingGpsCaptureSection";
import { TrackingOccurredAtField } from "./TrackingOccurredAtField";
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
import {
  buildAtDockDispatchBatchEvents,
  originStopAlreadyArrived,
  suggestDefaultDispatchLocationIntent,
  type DispatchLocationIntent,
} from "./resolveDispatchLocationIntent";

const copy = trackingCopy;
const cargoGateCopy = cfdiEmissionIntentCopy.cargoGate;

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
  /**
   * Parada origen (id + coords + señales PD6/PD7).
   * Coords para GPS; id/status/clientId para batch e intención.
   */
  originStop?: Pick<
    TripStop,
    | "id"
    | "latitude"
    | "longitude"
    | "actualArrival"
    | "status"
    | "clientId"
  > | null;
  /** Señal barata origen≈sucursal (PD6 default). */
  originBranchId?: string | null;
  /** ADR-0096 — defensa sheet si se abre sin cargas activas. */
  cfdiEmissionIntent?: CfdiEmissionIntent;
  cargos?: readonly TripCargo[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
  /** Conductor: Iniciar bloqueado escala a patio (D10). */
  isDriverPortal?: boolean;
};

type StartTripSheetBodyProps = Omit<StartTripSheetProps, "open">;

function StartTripSheetBody({
  tripId,
  tripCode,
  vehicleId,
  driverId,
  tripStartMileage,
  originStop,
  originBranchId,
  cfdiEmissionIntent,
  cargos = [],
  onOpenChange,
  onSuccess,
  isDriverPortal = false,
}: StartTripSheetBodyProps) {
  const { toast } = useToast();
  const [occurredAt, setOccurredAt] = useState(defaultOccurredAtLocal);
  const [gps, setGps] = useState<TrackingGpsCapture | null>(null);
  const [timeError, setTimeError] = useState<string | null>(null);
  const [mileageError, setMileageError] = useState<string | null>(null);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [cargoGateAlert, setCargoGateAlert] = useState(false);

  const suggestedIntent = useMemo(
    () =>
      suggestDefaultDispatchLocationIntent({
        originBranchId,
        originStop,
      }),
    [originBranchId, originStop],
  );
  const [locationIntent, setLocationIntent] =
    useState<DispatchLocationIntent>(suggestedIntent);

  const alreadyArrived = originStopAlreadyArrived(originStop);
  const dispatchIdempotencyKey = useMemo(
    () => createTrackingIdempotencyKey(),
    [],
  );
  const arriveIdempotencyKey = useMemo(
    () => createTrackingIdempotencyKey(),
    [],
  );

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

    const message = isDriverPortal
      ? `${issues.join(" ")} ${copy.hint.startBlockedEscalatePatio}`
      : issues.join(" ");
    return { canStart: false as const, message };
  }, [driver, isDriverPortal, isLoadingDriver, isLoadingVehicle, vehicle]);

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
        description:
          resolveSinCfdiCargoApiErrorMessage(error) ?? error.message,
        variant: "error",
      });
    },
  });

  const batchMutation = useCreateTrackingEventBatch({
    onSuccess: () => {
      toast({
        title: copy.toast.tripDispatchedAtDock,
        description: copy.toast.tripDispatchedAtDockDescription(tripCode),
        variant: "success",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: copy.toast.startFailed,
        description:
          resolveSinCfdiCargoApiErrorMessage(error) ?? error.message,
        variant: "error",
      });
    },
  });

  const handleConfirm = () => {
    if (!resourceStartCheck.canStart) return;

    if (sinCfdiCargoBlockReason(cfdiEmissionIntent, cargos, "start")) {
      setCargoGateAlert(true);
      return;
    }
    setCargoGateAlert(false);

    let hasError = false;
    const parsed = mileageField.parseValue();
    if (parsed === null) {
      setMileageError(copy.toast.startMileageRequiredDescription);
      hasError = true;
    } else {
      setMileageError(null);
    }

    if (!occurredAt.trim()) {
      setTimeError(copy.validation.departureRequired);
      hasError = true;
    } else {
      setTimeError(null);
    }

    if (!locationIntent) {
      setIntentError(copy.validation.dispatchIntentRequired);
      hasError = true;
    } else {
      setIntentError(null);
    }

    const useBatch =
      locationIntent === "at_dock" && !alreadyArrived && Boolean(originStop?.id);

    if (locationIntent === "at_dock" && !alreadyArrived && !originStop?.id) {
      setIntentError(copy.validation.dispatchOriginStopRequired);
      hasError = true;
    }

    if (hasError || parsed === null) return;

    const occurredAtIso = localInputToUtcIso(occurredAt);
    const gpsFields = trackingGpsToEventFields(gps);

    if (useBatch && originStop?.id) {
      // T-BATCH: un solo POST con trip_dispatched + stop_arrived (nunca trip_departed).
      batchMutation.mutate({
        tripId,
        events: buildAtDockDispatchBatchEvents({
          originStopId: originStop.id,
          occurredAtIso,
          mileage: parsed,
          latitude: gpsFields.latitude,
          longitude: gpsFields.longitude,
          accuracyMeters: gpsFields.accuracyMeters,
          dispatchIdempotencyKey,
          arriveIdempotencyKey,
        }),
      });
      return;
    }

    // T-START: va en camino, o ya en andén con llegada previa (PD7) → solo dispatch.
    startMutation.mutate({
      id: tripId,
      mileage: parsed,
      occurredAt: occurredAtIso,
      latitude: gpsFields.latitude,
      longitude: gpsFields.longitude,
      idempotencyKey: dispatchIdempotencyKey,
    });
  };

  const isPending = startMutation.isPending || batchMutation.isPending;
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

  const confirmLabel =
    locationIntent === "at_dock" && !alreadyArrived
      ? copy.action.dispatchAtDock
      : locationIntent === "en_route"
        ? copy.action.dispatchEnRoute
        : copy.action.start;

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        {cargoGateAlert ? (
          <DetailAlertCard
            severity="critical"
            title={cargoGateCopy.alertSheet}
          />
        ) : null}
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

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">
            {copy.label.dispatchLocationIntent}
          </legend>
          {(
            [
              {
                value: "at_dock" as const,
                title: copy.sheet.dispatchIntentAtDock,
                hint: copy.sheet.dispatchIntentAtDockHint,
                suggested: suggestedIntent === "at_dock",
              },
              {
                value: "en_route" as const,
                title: copy.sheet.dispatchIntentEnRoute,
                hint: copy.sheet.dispatchIntentEnRouteHint,
                suggested: suggestedIntent === "en_route",
              },
            ] as const
          ).map((option) => {
            const selected = locationIntent === option.value;
            const inputId = `dispatch-intent-${option.value}`;
            return (
              <label
                key={option.value}
                htmlFor={inputId}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                  isPending && "pointer-events-none opacity-60",
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name="dispatch-location-intent"
                  value={option.value}
                  checked={selected}
                  disabled={isPending}
                  className="mt-1"
                  onChange={() => {
                    setLocationIntent(option.value);
                    if (intentError) setIntentError(null);
                  }}
                />
                <span className="min-w-0 space-y-0.5">
                  <span className="flex flex-wrap items-center gap-2 font-medium text-foreground">
                    {option.title}
                    {option.suggested ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        ({copy.sheet.dispatchIntentSuggested})
                      </span>
                    ) : null}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.hint}
                  </span>
                </span>
              </label>
            );
          })}
          <FieldInlineError
            fieldId="dispatch-intent"
            message={intentError ?? undefined}
          />
        </fieldset>

        {alreadyArrived ? (
          <p
            role="status"
            className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          >
            {copy.hint.dispatchOriginAlreadyArrived}
          </p>
        ) : null}

        <TrackingOccurredAtField
          id="start-occurred-at"
          label={copy.label.occurredAtDispatch}
          value={occurredAt}
          onChange={(next) => {
            setOccurredAt(next);
            if (timeError) setTimeError(null);
          }}
          disabled={isPending}
          error={Boolean(timeError)}
          errorMessage={timeError}
        />

        <div className="space-y-2">
          <Label htmlFor="start-mileage">{copy.label.startMileage}</Label>
          <Input
            id="start-mileage"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={copy.sheet.startMileagePlaceholder}
            value={mileageField.value}
            onChange={(e) => {
              mileageField.onValueChange(e.target.value);
              if (mileageError) setMileageError(null);
            }}
            disabled={isPending}
            error={Boolean(mileageError)}
            {...getFieldErrorAriaProps("start-mileage", mileageError ?? undefined)}
          />
          <FieldInlineError
            fieldId="start-mileage"
            message={mileageError ?? undefined}
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
          {confirmLabel}
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
  originBranchId,
  cfdiEmissionIntent,
  cargos,
  open,
  onOpenChange,
  onSuccess,
  isDriverPortal = false,
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
            originBranchId={originBranchId}
            cfdiEmissionIntent={cfdiEmissionIntent}
            cargos={cargos}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
            isDriverPortal={isDriverPortal}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
