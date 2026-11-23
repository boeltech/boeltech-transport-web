/**
 * Cuerpo de «Dónde va» (C6 recogida + C7 entregas).
 */

import { AlertTriangle, Plus, Trash2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { FieldInlineError, FormFieldShell, MoneyInput } from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import { Progress } from "@shared/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { wizardCopy } from "../../../../copy";
import type { CargoMovementFormValues } from "../validation";
import type {
  CargoSheetDeliveryStop,
  CargoSheetPickupStop,
} from "../CargoMovementSheet";

const sheet = wizardCopy.cargo.sheet;

export interface CargoWhereSectionProps {
  pickupStop: CargoSheetPickupStop | null;
  availablePickupStops?: CargoSheetPickupStop[];
  onPickupStopChange?: (stop: CargoSheetPickupStop) => void;
  canChoosePickup: boolean;
  missingPickupMovement: boolean;
  pickupRowLabel: string;
  availableDeliveryStops: CargoSheetDeliveryStop[];
  deliveryAssignments: CargoMovementFormValues[];
  deliveriesReadOnly: boolean;
  allowAddDelivery: boolean;
  singleUnloadReadOnly: boolean;
  requiresDeliveryAssignment: boolean;
  isSubmitting: boolean;
  deliveryStopError: string | null;
  underAllocatedRemainderLine: string;
  overAllocatedRemainderLine: string;
  deliveryCoverageStatus: "n/a" | "ok" | "under" | "over";
  assignedMeterLabel: string | null;
  assignedMeterPct: number;
  unitsLabel: string;
  cargoUnits?: number;
  cargoWeightKg?: number;
  formatWeight: (value: number) => string;
  onAddDelivery: () => void;
  onUpdateDelivery: (
    index: number,
    field: keyof CargoMovementFormValues,
    value: string | number | undefined,
  ) => void;
  onRemoveDelivery: (index: number) => void;
}

function mutedStopRow({
  label,
  facts,
  badge,
}: {
  label: string;
  facts?: string;
  badge?: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/20 px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="min-w-0 truncate text-sm font-medium" title={label}>
          {label}
        </p>
        {facts ? (
          <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">
            {facts}
          </p>
        ) : null}
      </div>
      {badge ? (
        <Badge variant="neutral" tone="soft" className="shrink-0">
          {badge}
        </Badge>
      ) : null}
    </div>
  );
}

export function CargoWhereSection({
  pickupStop,
  availablePickupStops,
  onPickupStopChange,
  canChoosePickup,
  missingPickupMovement,
  pickupRowLabel,
  availableDeliveryStops,
  deliveryAssignments,
  deliveriesReadOnly,
  allowAddDelivery,
  singleUnloadReadOnly,
  requiresDeliveryAssignment,
  isSubmitting,
  deliveryStopError,
  underAllocatedRemainderLine,
  overAllocatedRemainderLine,
  deliveryCoverageStatus,
  assignedMeterLabel,
  assignedMeterPct,
  unitsLabel,
  cargoUnits,
  cargoWeightKg,
  formatWeight,
  onAddDelivery,
  onUpdateDelivery,
  onRemoveDelivery,
}: CargoWhereSectionProps) {
  const pickupBadge = missingPickupMovement
    ? sheet.badge.assignOnSave
    : pickupStop && !canChoosePickup
      ? sheet.badge.uniquePickup
      : undefined;

  const singleDeliveryStop = availableDeliveryStops[0];
  const singleDeliveryLabel = singleDeliveryStop
    ? `${singleDeliveryStop.index + 1} · ${
        singleDeliveryStop.locationName?.trim() ||
        singleDeliveryStop.address.trim()
      }`
    : "";
  const singleDeliveryFacts = [
    cargoUnits != null && cargoUnits > 0
      ? `${cargoUnits} ${unitsLabel}`
      : null,
    cargoWeightKg != null && cargoWeightKg > 0
      ? formatWeight(cargoWeightKg)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const showMultiEditors =
    !deliveriesReadOnly && !singleUnloadReadOnly && requiresDeliveryAssignment;

  const meterIndicatorClass =
    deliveryCoverageStatus === "under"
      ? "bg-warning"
      : deliveryCoverageStatus === "over"
        ? "bg-destructive"
        : undefined;

  return (
    <div className="space-y-4">
      {/* —— Recogida (C6) —— */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          {sheet.label.pickupStop}
        </p>
        {canChoosePickup && availablePickupStops ? (
          <FormFieldShell
            fieldId="cargo-pickup-stop"
            label={sheet.label.pickupStop}
            description={sheet.hint.pickupStop}
            className="min-w-0 [&_label]:sr-only"
          >
            <Select
              value={pickupStop ? String(pickupStop.index) : ""}
              onValueChange={(value) => {
                const next = availablePickupStops.find(
                  (stop) => String(stop.index) === value,
                );
                if (next) onPickupStopChange?.(next);
              }}
            >
              <SelectTrigger
                id="cargo-pickup-stop"
                className="h-9 min-w-0 bg-background"
                title={
                  pickupStop
                    ? sheet.format.deliveryStopOption(
                        pickupStop.index,
                        pickupStop.locationName || "",
                        pickupStop.address,
                        pickupStop.city,
                      )
                    : undefined
                }
              >
                <SelectValue placeholder={sheet.placeholder.pickupStop} />
              </SelectTrigger>
              <SelectContent>
                {availablePickupStops.map((stop) => (
                  <SelectItem key={stop.index} value={String(stop.index)}>
                    {sheet.format.deliveryStopOption(
                      stop.index,
                      stop.locationName || "",
                      stop.address,
                      stop.city,
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldShell>
        ) : pickupStop ? (
          mutedStopRow({
            label: pickupRowLabel,
            badge: pickupBadge,
          })
        ) : null}
      </div>

      {/* —— Entregas (C7) —— */}
      {availableDeliveryStops.length > 0 ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-xs text-muted-foreground sm:max-w-md">
              {deliveriesReadOnly
                ? sheet.hint.deliveriesReadOnly
                : singleUnloadReadOnly
                  ? sheet.hint.deliveriesSingleUnload
                  : requiresDeliveryAssignment
                    ? sheet.hint.deliveriesMultiUnload
                    : allowAddDelivery
                      ? sheet.hint.deliveries
                      : sheet.hint.deliveriesSingleUnload}
            </p>
            {!deliveriesReadOnly &&
            allowAddDelivery &&
            !singleUnloadReadOnly ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isSubmitting}
                onClick={onAddDelivery}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                {sheet.action.addDelivery}
              </Button>
            ) : null}
          </div>

          {singleUnloadReadOnly && !deliveriesReadOnly && singleDeliveryStop ? (
            mutedStopRow({
              label: singleDeliveryLabel,
              facts: singleDeliveryFacts || undefined,
            })
          ) : deliveriesReadOnly ? (
            <ul className="space-y-2">
              {deliveryAssignments.map((delivery, idx) => {
                const stop = availableDeliveryStops.find(
                  (s) => s.index === delivery.stopIndex,
                );
                const stopLabel = stop
                  ? sheet.format.deliveryStopOption(
                      stop.index,
                      stop.locationName || "",
                      stop.address,
                      stop.city,
                    )
                  : sheet.placeholder.deliveryStop;
                const facts = [
                  delivery.units != null && delivery.units > 0
                    ? `${delivery.units} ${unitsLabel}`
                    : null,
                  delivery.weight != null && delivery.weight > 0
                    ? formatWeight(delivery.weight)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`${delivery.stopIndex}-${idx}`}>
                    {mutedStopRow({
                      label: stopLabel,
                      facts: facts || undefined,
                    })}
                  </li>
                );
              })}
            </ul>
          ) : showMultiEditors ? (
            <div className="min-w-0 space-y-2">
              {deliveryAssignments.length === 0 ? (
                <div className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">
                  {sheet.state.noDeliveriesMultiUnload}
                </div>
              ) : (
                deliveryAssignments.map((delivery, idx) => {
                  const selectedDeliveryStop =
                    delivery.stopIndex >= 0
                      ? availableDeliveryStops.find(
                          (s) => s.index === delivery.stopIndex,
                        )
                      : undefined;
                  const selectedDeliveryLabel = selectedDeliveryStop
                    ? sheet.format.deliveryStopOption(
                        selectedDeliveryStop.index,
                        selectedDeliveryStop.locationName || "",
                        selectedDeliveryStop.address,
                        selectedDeliveryStop.city,
                      )
                    : undefined;
                  const stopError =
                    delivery.stopIndex < 0 && deliveryStopError
                      ? deliveryStopError
                      : undefined;
                  return (
                    <div key={idx} className="min-w-0 space-y-1">
                      {/*
                        Columna parada = 1fr (legible `n · lugar`);
                        cantidad/peso fijos + trash — ancla VIS C7.
                      */}
                      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.75rem_5.75rem_2.25rem] items-center gap-2">
                        <div className="min-w-0">
                          <Select
                            value={
                              delivery.stopIndex >= 0
                                ? String(delivery.stopIndex)
                                : ""
                            }
                            onValueChange={(val) =>
                              onUpdateDelivery(idx, "stopIndex", Number(val))
                            }
                            disabled={isSubmitting}
                          >
                            <SelectTrigger
                              id={`cargo-delivery-stop-${idx}`}
                              className="h-9 w-full min-w-0"
                              title={selectedDeliveryLabel}
                              error={Boolean(stopError)}
                              aria-label={sheet.label.deliveryStop}
                              aria-invalid={stopError ? true : undefined}
                              aria-describedby={
                                stopError
                                  ? `cargo-delivery-stop-${idx}-error`
                                  : undefined
                              }
                            >
                              <SelectValue
                                placeholder={sheet.placeholder.deliveryStop}
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDeliveryStops.map((s) => (
                                <SelectItem
                                  key={s.index}
                                  value={String(s.index)}
                                >
                                  {sheet.format.deliveryStopOption(
                                    s.index,
                                    s.locationName || "",
                                    s.address,
                                    s.city,
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Input
                          id={`cargo-delivery-units-${idx}`}
                          type="number"
                          min="0"
                          className="h-9 min-w-0 tabular-nums font-mono"
                          disabled={isSubmitting}
                          placeholder="0"
                          aria-label={sheet.label.deliveryUnits}
                          value={delivery.units ?? ""}
                          onChange={(e) =>
                            onUpdateDelivery(
                              idx,
                              "units",
                              e.target.value
                                ? Number(e.target.value)
                                : undefined,
                            )
                          }
                        />
                        <div className="min-w-0">
                          <MoneyInput
                            id={`cargo-delivery-weight-${idx}`}
                            currencyCode=""
                            decimals={2}
                            locale="es-MX"
                            className="h-9 min-w-0 w-full font-mono"
                            disabled={isSubmitting}
                            placeholder="0.00"
                            aria-label={sheet.label.deliveryWeight}
                            value={delivery.weight}
                            onValueChange={(next) =>
                              onUpdateDelivery(idx, "weight", next)
                            }
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={isSubmitting}
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => onRemoveDelivery(idx)}
                          aria-label="Quitar entrega"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <FieldInlineError
                        fieldId={`cargo-delivery-stop-${idx}`}
                        message={stopError}
                      />
                    </div>
                  );
                })
              )}

              {assignedMeterLabel ? (
                <div className="space-y-1.5">
                  <Progress
                    value={assignedMeterPct}
                    className="h-1.5"
                    indicatorClassName={meterIndicatorClass}
                  />
                  <p className="text-xs tabular-nums text-muted-foreground">
                    {assignedMeterLabel}
                  </p>
                </div>
              ) : null}

              {deliveryCoverageStatus === "under" &&
              underAllocatedRemainderLine ? (
                <Alert variant="warning">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{sheet.alert.underAllocatedTitle}</AlertTitle>
                  <AlertDescription>
                    {sheet.alert.underAllocatedBody(underAllocatedRemainderLine)}
                  </AlertDescription>
                </Alert>
              ) : null}

              {deliveryCoverageStatus === "over" &&
              overAllocatedRemainderLine ? (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>{sheet.alert.overAllocatedTitle}</AlertTitle>
                  <AlertDescription>
                    {sheet.alert.overAllocatedBody(overAllocatedRemainderLine)}
                  </AlertDescription>
                </Alert>
              ) : null}
            </div>
          ) : deliveryAssignments.length === 0 && allowAddDelivery ? (
            <div className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">
              {sheet.state.noDeliveries}
            </div>
          ) : deliveryAssignments.length === 0 && !allowAddDelivery ? (
            <div className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">
              {sheet.state.noDeliveriesSingleUnload}
            </div>
          ) : (
            <ul className="space-y-2">
              {deliveryAssignments.map((delivery, idx) => {
                const stop = availableDeliveryStops.find(
                  (s) => s.index === delivery.stopIndex,
                );
                const stopLabel = stop
                  ? sheet.format.deliveryStopOption(
                      stop.index,
                      stop.locationName || "",
                      stop.address,
                      stop.city,
                    )
                  : sheet.placeholder.deliveryStop;
                const facts = [
                  delivery.units != null && delivery.units > 0
                    ? `${delivery.units} ${unitsLabel}`
                    : null,
                  delivery.weight != null && delivery.weight > 0
                    ? formatWeight(delivery.weight)
                    : null,
                ]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <li key={`${delivery.stopIndex}-${idx}`}>
                    {mutedStopRow({
                      label: stopLabel,
                      facts: facts || undefined,
                    })}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
