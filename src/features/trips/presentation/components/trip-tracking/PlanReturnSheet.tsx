/**
 * F4b / F4d-c — Sheet «Planear retorno» (~480 px, mismo shell que Finalizar en destino).
 * Guarda con stops:replan (+ patchBaseRate opcional) + Bitácora `return_planned`.
 * Sin FK de retorno (Q-R1).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Lock, RotateCcw } from "lucide-react";

import { useAuth } from "@features/auth";
import {
  usePatchTripBaseRate,
  useRegisterTrackingEvent,
  useReplanTripStops,
} from "@features/trips/application";
import type { CreateStopInput, Trip, TripCargo, TripStop } from "@features/trips/domain";
import { Alert } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import { FieldInlineError, getFieldErrorAriaProps } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { cn } from "@shared/lib/utils/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { formatDateTime, formatTime } from "@shared/utils/dateUtils";
import { formatMxCurrency } from "@shared/utils/formatMxCurrency";
import { useToast } from "@shared/hooks";

import { trackingCopy } from "../../copy";
import { formatRouteStopPlaceLabel } from "../../helpers/routeStopPlaceLabel";
import { stopFormDataToCreateInput } from "../trip-route/buildReplaceStopsPayload";
import { TripStopSearchConfirmSheet } from "../trip-route/TripStopSearchConfirmSheet";
import type { StopFormData } from "../../pages/create/components/stopDialogAddressMapper";
import {
  buildPlanReturnPendingStops,
  destinationFromCreateInput,
  destinationFromPickupStop,
  estimatePlanReturnImpact,
  hasMultiUnloadActiveCargoWithoutDelivery,
  listPendingDeliveriesForOtherCargos,
  mapPlanReturnTimingToDomain,
  resolveCargoPickupStop,
  resolvePlanReturnTargetCargo,
  resolveReturnStopForCargo,
  type PlanReturnDestination,
  type PlanReturnTiming,
} from "./planReturnHelpers";
import { createTrackingIdempotencyKey } from "./trackingIdempotency";
import {
  TRACKING_SHEET_BODY_CLASS,
  TRACKING_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "./trackingSheetLayout";

const copy = trackingCopy.planReturnSheet;
const planCopy = trackingCopy.planReturn;

export type PlanReturnSheetProps = {
  trip: Trip;
  cargos: readonly TripCargo[];
  orderedStops: readonly TripStop[];
  /** Q-R3: finance.read ∩ canEditBaseRate */
  canAdjustRate: boolean;
  vehicleLabel?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditInRoute: () => void;
  /** F5d-c: CTA cuando hay gap multi-unload (Ir a Cargas). */
  onGoToCargos?: () => void;
  onSuccess?: () => void;
};

function cargoQuantityLabel(cargo: TripCargo): string {
  if (cargo.units != null && Number.isFinite(cargo.units)) {
    return `${cargo.units.toLocaleString("es-MX")} uds`;
  }
  return "";
}

function cargoWeightLabel(cargo: TripCargo): string {
  const kg = cargo.weightInKg ?? cargo.weight;
  if (kg != null && Number.isFinite(kg)) {
    return `${kg.toLocaleString("es-MX")} kg`;
  }
  return "";
}

function PlanReturnSheetBody({
  trip,
  cargos,
  orderedStops,
  canAdjustRate,
  vehicleLabel,
  onOpenChange,
  onEditInRoute,
  onGoToCargos,
  onSuccess,
}: Omit<PlanReturnSheetProps, "open">) {
  const { toast } = useToast();
  const { user } = useAuth();
  const replan = useReplanTripStops(trip.id);
  const patchRate = usePatchTripBaseRate(trip.id);
  const registerEvent = useRegisterTrackingEvent();
  const returnPreviewRef = useRef<HTMLLIElement | null>(null);

  const targetCargo = useMemo(
    () => resolvePlanReturnTargetCargo(cargos),
    [cargos],
  );
  const pickupStop = useMemo(
    () =>
      targetCargo
        ? resolveCargoPickupStop(targetCargo, orderedStops)
        : null,
    [targetCargo, orderedStops],
  );
  const pendingDeliveries = useMemo(
    () =>
      targetCargo
        ? listPendingDeliveriesForOtherCargos(
            cargos,
            orderedStops,
            targetCargo.id,
          )
        : [],
    [cargos, orderedStops, targetCargo],
  );
  const hasPendingDeliveries = pendingDeliveries.length > 0;
  const nextPending = pendingDeliveries[0] ?? null;
  const multiUnloadDeliveryGap = useMemo(
    () => hasMultiUnloadActiveCargoWithoutDelivery(cargos, orderedStops),
    [cargos, orderedStops],
  );

  const [destination, setDestination] = useState<PlanReturnDestination | null>(
    () => (pickupStop ? destinationFromPickupStop(pickupStop) : null),
  );
  const [timing, setTiming] = useState<PlanReturnTiming>("at_end");
  const [adjustRate, setAdjustRate] = useState(false);
  const [rateDraft, setRateDraft] = useState(
    () => String(trip.costs.baseRate ?? ""),
  );
  const [destinationError, setDestinationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const impact = useMemo(() => {
    if (!destination) return null;
    return estimatePlanReturnImpact({
      orderedStops,
      returnDestination: destination,
      timing: hasPendingDeliveries ? timing : "at_end",
      hasPendingDeliveries,
      pendingDeliveries,
    });
  }, [
    destination,
    orderedStops,
    timing,
    hasPendingDeliveries,
    pendingDeliveries,
  ]);

  const rejectedStopLabel = useMemo(() => {
    if (!targetCargo) return "esta parada";
    const delivery = targetCargo.movements.find(
      (m) => m.movementType === "delivery",
    );
    const stop =
      (delivery?.stopId
        ? orderedStops.find((s) => s.id === delivery.stopId)
        : undefined) ??
      (delivery ? orderedStops[delivery.stopIndex] : undefined);
    return stop ? formatRouteStopPlaceLabel(stop) : "esta parada";
  }, [targetCargo, orderedStops]);

  const rejectedAtLabel = formatTime(new Date().toISOString());

  const invoiceStamped =
    trip.invoicing.invoiceStatus === "stamped" &&
    Boolean(trip.invoicing.invoiceFolio);
  const folio = trip.invoicing.invoiceFolio
    ? trip.invoicing.invoiceFolio.startsWith("F-")
      ? trip.invoicing.invoiceFolio
      : `F-${trip.invoicing.invoiceFolio}`
    : null;

  const isPending =
    replan.isPending || patchRate.isPending || registerEvent.isPending;

  useEffect(() => {
    if (!destination || !impact) return;
    returnPreviewRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [destination, timing, hasPendingDeliveries, impact]);

  const handleSelectPickup = () => {
    if (!pickupStop) {
      setDestinationError(copy.missingPickup);
      return;
    }
    setDestination(destinationFromPickupStop(pickupStop));
    setDestinationError(null);
  };

  const handleLocationConfirm = async (data: StopFormData) => {
    const input: CreateStopInput = stopFormDataToCreateInput(
      { ...data, stopCategory: "destination", stopType: ["destination", "delivery"] },
      orderedStops.length + 1,
    );
    setDestination(destinationFromCreateInput(input));
    setDestinationError(null);
    setLocationPickerOpen(false);
  };

  const handleSave = async () => {
    if (!destination) {
      setDestinationError(copy.missingDestination);
      return;
    }
    if (!targetCargo) {
      setSubmitError(copy.missingPickup);
      return;
    }
    setSubmitError(null);
    const uiTiming: PlanReturnTiming = hasPendingDeliveries
      ? timing
      : "at_end";
    const domainTiming = mapPlanReturnTimingToDomain({
      timing: uiTiming,
      hasPendingDeliveries,
    });
    const whenLabel =
      domainTiming === "before_continuing"
        ? planCopy.bitacoraWhenBefore
        : planCopy.bitacoraWhenAtEnd;
    const actorName = user?.getFullName()?.trim() || "tú";
    const deltaKm =
      impact?.deltaKm != null && Number.isFinite(impact.deltaKm)
        ? Math.max(0, impact.deltaKm)
        : null;
    const deltaLabel =
      deltaKm != null && deltaKm > 0 ? String(deltaKm) : "0";

    try {
      const pending = buildPlanReturnPendingStops({
        orderedStops,
        returnDestination: destination,
        timing: uiTiming,
        hasPendingDeliveries,
      });
      const updatedTrip = await replan.mutateAsync(pending);
      if (canAdjustRate && adjustRate) {
        const parsed = Number(rateDraft.replace(/,/g, ""));
        if (Number.isFinite(parsed) && parsed >= 0) {
          await patchRate.mutateAsync(parsed);
        }
      }

      const stopsAfter = updatedTrip.stops ?? orderedStops;
      const returnStop = resolveReturnStopForCargo(
        targetCargo,
        stopsAfter,
      );
      let bitacoraOk = false;
      try {
        await registerEvent.mutateAsync({
          tripId: trip.id,
          event: {
            eventType: "return_planned",
            occurredAt: new Date().toISOString(),
            capturedVia: "web",
            idempotencyKey: createTrackingIdempotencyKey(),
            ...(returnStop?.id ? { stopId: returnStop.id } : {}),
            payload: {
              cargo_id: targetCargo.id,
              destination_label: destination.locationName,
              timing: domainTiming,
              ...(deltaKm != null
                ? {
                    estimated_extra_km: deltaKm,
                    delta_km: deltaKm,
                  }
                : {}),
              ...(returnStop?.id
                ? { return_stop_id: returnStop.id }
                : {}),
            },
          },
        });
        bitacoraOk = true;
      } catch {
        bitacoraOk = false;
      }

      if (bitacoraOk) {
        toast({
          title: planCopy.toastSaved,
          description: `${planCopy.bitacora(destination.locationName, whenLabel)} · ${planCopy.bitacoraMeta(deltaLabel, actorName)}`,
          variant: "success",
        });
      } else {
        toast({
          title: planCopy.toastBitacoraPending,
          description: planCopy.toastBitacoraPendingDescription,
          variant: "warning",
        });
      }
      onOpenChange(false);
      onSuccess?.();
    } catch {
      setSubmitError(copy.saveError);
    }
  };

  if (!targetCargo) {
    return (
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <p className="text-sm text-muted-foreground">{copy.missingPickup}</p>
      </div>
    );
  }

  const cantidad = cargoQuantityLabel(targetCargo);
  const peso = cargoWeightLabel(targetCargo);
  const unit = vehicleLabel?.trim() || "la unidad";

  return (
    <>
      <div className={TRACKING_SHEET_BODY_CLASS}>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            {copy.cargoLine(targetCargo.description, cantidad, peso)}
          </p>
          <p className="text-xs text-muted-foreground">
            {copy.rejectedSubtitle(rejectedStopLabel, rejectedAtLabel, unit)}
          </p>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground">
            {copy.whereSection}
          </legend>
          <label
            className={cn(
              "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
              destination?.source === "pickup"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40",
              !pickupStop && "pointer-events-none opacity-60",
            )}
          >
            <input
              type="radio"
              name="plan-return-where"
              className="mt-1"
              checked={destination?.source === "pickup"}
              disabled={!pickupStop || isPending}
              onChange={handleSelectPickup}
            />
            <span className="min-w-0 space-y-1">
              <span className="flex flex-wrap items-center gap-2 font-medium">
                {pickupStop
                  ? formatRouteStopPlaceLabel(pickupStop)
                  : copy.missingPickup}
                {pickupStop ? (
                  <Badge variant="neutral" tone="soft" className="text-[10px]">
                    {copy.wherePickedUpBadge}
                  </Badge>
                ) : null}
              </span>
              {destination?.source === "pickup" ? (
                <span className="block text-xs text-muted-foreground">
                  {destination.addressLine}
                </span>
              ) : pickupStop ? (
                <span className="block text-xs text-muted-foreground">
                  {destinationFromPickupStop(pickupStop).addressLine}
                </span>
              ) : null}
            </span>
          </label>

          <button
            type="button"
            disabled={isPending}
            onClick={() => setLocationPickerOpen(true)}
            className={cn(
              "flex w-full gap-3 rounded-lg border p-3 text-left text-sm transition-colors",
              destination?.source === "other"
                ? "border-primary bg-primary/5"
                : "border-border hover:bg-muted/40",
            )}
            data-tracking-section="plan-return-other-place"
          >
            <span
              className={cn(
                "mt-1 h-3.5 w-3.5 shrink-0 rounded-full border",
                destination?.source === "other"
                  ? "border-primary bg-primary"
                  : "border-muted-foreground",
              )}
              aria-hidden
            />
            <span className="min-w-0 space-y-0.5">
              <span className="font-medium text-foreground">
                {destination?.source === "other"
                  ? destination.locationName
                  : copy.whereOther}
              </span>
              <span className="block text-xs text-muted-foreground">
                {destination?.source === "other"
                  ? destination.addressLine
                  : copy.whereOtherHint}
              </span>
            </span>
          </button>
          <FieldInlineError
            fieldId="plan-return-where"
            message={destinationError ?? undefined}
          />
        </fieldset>

        {hasPendingDeliveries && nextPending && destination ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">
              {copy.whenSection}
            </legend>
            {(
              [
                {
                  value: "at_end" as const,
                  title: copy.whenAtEnd,
                  effect: copy.whenAtEndEffect(
                    nextPending.cargo.description,
                    nextPending.placeLabel,
                    destination.locationName,
                  ),
                },
                {
                  value: "before_next" as const,
                  title: copy.whenBeforeNext(nextPending.placeLabel),
                  effect: copy.whenBeforeNextEffect(
                    destination.locationName,
                    nextPending.placeLabel,
                  ),
                },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex cursor-pointer gap-3 rounded-lg border p-3 text-sm transition-colors",
                  timing === option.value
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/40",
                )}
              >
                <input
                  type="radio"
                  name="plan-return-when"
                  className="mt-1"
                  checked={timing === option.value}
                  disabled={isPending}
                  onChange={() => setTiming(option.value)}
                />
                <span className="min-w-0 space-y-0.5">
                  <span className="font-medium text-foreground">
                    {option.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.effect}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
        ) : multiUnloadDeliveryGap && destination ? (
          <div className="space-y-3 rounded-lg border border-warning/40 bg-warning/5 p-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {copy.missingDeliveryTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {copy.missingDeliveryBody}
              </p>
            </div>
            {onGoToCargos ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={onGoToCargos}
                data-tracking-section="plan-return-go-to-cargos"
              >
                {copy.goToCargos}
              </Button>
            ) : null}
          </div>
        ) : destination ? (
          <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-sm font-semibold text-foreground">
              {copy.noPendingTitle}
            </p>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              <li>{copy.noPendingEffectDestination(destination.locationName)}</li>
              <li>{copy.noPendingEffectRejected(rejectedStopLabel)}</li>
              <li>{copy.noPendingEffectClose(destination.locationName)}</li>
            </ul>
          </div>
        ) : null}

        {canAdjustRate ? (
          <div
            className="space-y-2 rounded-lg border border-border p-3"
            data-testid="plan-return-adjust-rate"
          >
            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={adjustRate}
                disabled={isPending}
                onCheckedChange={(v) => setAdjustRate(v === true)}
                className="mt-0.5"
              />
              <span className="min-w-0 space-y-0.5">
                <span className="font-medium">{copy.adjustRate}</span>
                <span className="block text-xs text-muted-foreground">
                  {copy.adjustRateHint}{" "}
                  {copy.adjustRateCurrent(
                    formatMxCurrency(trip.costs.baseRate ?? 0),
                  )}
                </span>
              </span>
            </label>
            {adjustRate ? (
              <div className="space-y-1 pl-6">
                <Label htmlFor="plan-return-rate">{copy.rateField}</Label>
                <Input
                  id="plan-return-rate"
                  inputMode="decimal"
                  className="font-mono"
                  value={rateDraft}
                  disabled={isPending}
                  onChange={(e) => setRateDraft(e.target.value)}
                  {...getFieldErrorAriaProps("plan-return-rate")}
                />
                <p className="text-xs text-muted-foreground">
                  {copy.rateBefore(formatMxCurrency(trip.costs.baseRate ?? 0))}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {impact && destination ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-2">
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {copy.impactDistance}
                </p>
                <p className="text-xs font-semibold tabular-nums">
                  {impact.totalKm != null
                    ? `${impact.totalKm.toLocaleString("es-MX")} km`
                    : "—"}
                </p>
                {impact.deltaKm != null && impact.deltaKm !== 0 ? (
                  <p className="text-[10px] text-muted-foreground">
                    {impact.deltaKm > 0 ? "+" : ""}
                    {impact.deltaKm.toLocaleString("es-MX")} km
                  </p>
                ) : null}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {copy.impactArrival(destination.locationName)}
                </p>
                <p className="text-xs font-semibold tabular-nums">
                  {impact.arrivalAtReturn
                    ? formatDateTime(impact.arrivalAtReturn.toISOString())
                    : "—"}
                </p>
                {impact.nextPendingPlaceLabel &&
                impact.nextPendingArrival &&
                timing === "at_end" ? (
                  <p className="text-[10px] text-muted-foreground">
                    {impact.nextPendingPlaceLabel}{" "}
                    {formatDateTime(impact.nextPendingArrival.toISOString())}
                  </p>
                ) : null}
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {copy.impactStops}
                </p>
                <p className="text-xs font-semibold tabular-nums">
                  {impact.nextStopCount}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {copy.impactStopsBefore(impact.previousStopCount)}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {copy.impactEstimatedHint}
            </p>

            <div className="space-y-1.5">
              <p className="text-sm font-semibold">{copy.routePreviewTitle}</p>
              <ol className="space-y-1">
                {impact.previewStops.map((stop, index) => (
                  <li
                    key={stop.key}
                    ref={stop.isReturn ? returnPreviewRef : undefined}
                    data-testid={
                      stop.isReturn ? "plan-return-preview-return-row" : undefined
                    }
                    className={cn(
                      "flex gap-2 rounded-md px-1.5 py-1 text-xs",
                      stop.isReturn && "bg-primary/5 ring-1 ring-primary/30",
                    )}
                  >
                    <span className="w-4 shrink-0 text-[10px] text-muted-foreground tabular-nums">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="font-medium leading-snug">
                          {stop.placeLabel}
                        </span>
                        {stop.isReturn ? (
                          <Badge
                            variant="info"
                            tone="soft"
                            className="text-[10px]"
                          >
                            {copy.stopReturnLabel}
                          </Badge>
                        ) : null}
                      </div>
                      {stop.isReturn ? (
                        <p className="text-[10px] leading-snug text-muted-foreground">
                          {copy.stopReceivesShort(targetCargo.description)}
                        </p>
                      ) : null}
                    </div>
                    {stop.estimatedArrival ? (
                      <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                        {formatTime(stop.estimatedArrival.toISOString())}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}

        {invoiceStamped && folio ? (
          <Alert variant="info" className="text-sm">
            {copy.fiscalStamped(folio)}
          </Alert>
        ) : null}

        {submitError ? (
          <Alert variant="destructive" className="text-sm">
            {submitError}
          </Alert>
        ) : null}
      </div>

      <SheetFooter className={TRACKING_SHEET_FOOTER_CLASS}>
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="justify-start px-0 text-muted-foreground sm:px-2"
            disabled={isPending}
            onClick={onEditInRoute}
            data-tracking-section="plan-return-edit-route"
          >
            {copy.footerEditRoute}
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => onOpenChange(false)}
            >
              {copy.footerCancel}
            </Button>
            <Button
              type="button"
              className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
              disabled={isPending || !destination}
              onClick={() => void handleSave()}
              data-tracking-section="plan-return-save"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              {copy.footerSave}
            </Button>
          </div>
        </div>
      </SheetFooter>

      <TripStopSearchConfirmSheet
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        mode="create"
        category="destination"
        initialStep="search"
        heading={copy.whereOther}
        description={copy.whereOtherHint}
        clientId={trip.clientId}
        initialData={{
          stopCategory: "destination",
          stopType: ["destination", "delivery"],
        }}
        onSubmit={handleLocationConfirm}
      />
    </>
  );
}

export function PlanReturnSheet({
  open,
  onOpenChange,
  ...bodyProps
}: PlanReturnSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={TRACKING_SHEET_CONTENT_CLASS}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader className={TRACKING_SHEET_HEADER_CLASS}>
          <SheetTitle className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden />
            {copy.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {copy.title}
          </SheetDescription>
        </SheetHeader>
        {open ? (
          <PlanReturnSheetBody
            key={`${bodyProps.trip.id}-${resolvePlanReturnTargetCargo(bodyProps.cargos)?.id ?? "none"}`}
            {...bodyProps}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

/** Candado visible en destino (R9) — exportado para timeline. */
export function PlanReturnDestinationLock({ cargoName }: { cargoName: string }) {
  return (
    <p
      className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground"
      data-tracking-section="plan-return-lock"
    >
      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
      <span>{planCopy.lockDestination(cargoName)}</span>
    </p>
  );
}
