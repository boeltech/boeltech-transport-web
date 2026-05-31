import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FileWarning, MapPin, Save } from "lucide-react";

import type { Trip, UpdateTripInput } from "@features/trips/domain";
import { Badge } from "@shared/ui/badge";
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
import { ScrollArea } from "@shared/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { HintIcon } from "@shared/ui/hint-icon";

import {
  buildStopOperationalUpdateInput,
  getStopFiscalStatus,
  mapTripStopToOperationalValues,
  validateStopOperationalFields,
  type StopFiscalStatus,
  type TripStopOperationalValues,
} from "../trip-detail-patch";
import {
  formatTripApiValidationForUser,
  validateUpdateTripApiPayload,
} from "../../pages/create/validateTripApiPayload";
import {
  getRouteStopCategory,
  getStopOperationalEditTimeFields,
} from "./tripRouteDetailHelpers";
import { tripDetailCopy } from "../../copy";

const copy = tripDetailCopy.route;

type TripStopOperationalEditSheetProps = {
  trip: Trip;
  stopId: string | null;
  open: boolean;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateTripInput) => Promise<void>;
};

function fiscalStatusCopy(status: StopFiscalStatus): {
  label: string;
  variant: "default" | "secondary" | "destructive";
} {
  if (status === "ok") {
    return { label: copy.label.fiscalOk, variant: "default" };
  }
  if (status === "invalid") {
    return { label: copy.label.fiscalInvalid, variant: "destructive" };
  }
  return { label: copy.label.fiscalPending, variant: "secondary" };
}

function normalizeRfc(value: string): string {
  return value.trim().toUpperCase();
}

function TripStopOperationalEditSheetContent({
  trip,
  stopId,
  isSaving,
  onOpenChange,
  onSubmit,
}: Omit<TripStopOperationalEditSheetProps, "open">) {
  const sourceStop = useMemo(
    () => (trip.stops ?? []).find((stop) => stop.id === stopId),
    [trip.stops, stopId],
  );

  const [values, setValues] = useState<TripStopOperationalValues | null>(() =>
    sourceStop ? mapTripStopToOperationalValues(sourceStop) : null,
  );
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);

  if (!sourceStop || !values) {
    return (
      <Alert variant="destructive">
        <FileWarning className="h-4 w-4" />
        <AlertTitle>{copy.alert.stopNotFoundTitle}</AlertTitle>
        <AlertDescription>{copy.alert.stopNotFoundBody}</AlertDescription>
      </Alert>
    );
  }

  const category = getRouteStopCategory(sourceStop);
  const timeFields = getStopOperationalEditTimeFields(category);
  const status = getStopFiscalStatus(values);
  const statusUi = fiscalStatusCopy(status);

  const sheetDescription =
    category === "origin"
      ? copy.hint.sheetDescriptionOrigin
      : category === "destination"
        ? copy.hint.sheetDescriptionDestination
        : copy.hint.sheetDescriptionWaypoint;

  const handleSave = async () => {
    setGlobalError(null);
    setFieldErrors([]);

    const issues = validateStopOperationalFields(values);
    if (issues.length > 0) {
      setFieldErrors(issues);
      setGlobalError(copy.alert.stopValidationSummary);
      return;
    }

    const payload = buildStopOperationalUpdateInput(trip, stopId!, values);
    const apiValidation = validateUpdateTripApiPayload(payload);
    if (!apiValidation.ok) {
      setGlobalError(formatTripApiValidationForUser(apiValidation.fieldErrors, 4));
      return;
    }

    await onSubmit(payload);
  };

  return (
    <>
      <SheetHeader className="shrink-0">
        <SheetTitle className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {copy.format.editStopTitle(values.sequenceOrder + 1)}
        </SheetTitle>
        <SheetDescription>{sheetDescription}</SheetDescription>
      </SheetHeader>

      <ScrollArea className="min-h-0 flex-1 pr-2">
        <div className="space-y-4 pb-1">
          {globalError ? (
            <Alert variant="destructive">
              <FileWarning className="h-4 w-4" />
              <AlertTitle>{copy.alert.stopSaveFailedTitle}</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          ) : null}

          <section className="space-y-3 rounded-lg border p-3">
            <header className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">
                  {sourceStop.locationName ||
                    copy.format.stopFallbackName(values.sequenceOrder + 1)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {copy.format.stopOrderInRoute(values.sequenceOrder + 1)}
                </p>
              </div>
              <Badge variant={statusUi.variant}>{statusUi.label}</Badge>
            </header>

            {category === "origin" ? (
              <Alert>
                <AlertTitle>{copy.alert.stopDepartureTitle}</AlertTitle>
                <AlertDescription>{copy.hint.sheetOriginDeparture}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              {timeFields.showEstimatedArrival ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label>
                    {category === "destination"
                      ? copy.label.estimatedArrivalDestination
                      : copy.label.estimatedArrivalWaypoint}
                  </Label>
                  <Input
                    type="datetime-local"
                    value={values.estimatedArrival}
                    onChange={(event) =>
                      setValues((prev) =>
                        prev ? { ...prev, estimatedArrival: event.target.value } : prev,
                      )
                    }
                  />
                </div>
              ) : null}
              {timeFields.showEstimatedDeparture ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{copy.label.estimatedDepartureWaypoint}</Label>
                  <Input
                    type="datetime-local"
                    value={values.estimatedDeparture}
                    onChange={(event) =>
                      setValues((prev) =>
                        prev ? { ...prev, estimatedDeparture: event.target.value } : prev,
                      )
                    }
                  />
                </div>
              ) : null}
              {values.sequenceOrder > 0 ? (
                <div className="space-y-1.5 md:col-span-2">
                  <Label>{copy.label.distanceFromPreviousKm}</Label>
                  <Input
                    inputMode="decimal"
                    value={values.distanceFromPreviousKm}
                    onChange={(event) =>
                      setValues((prev) =>
                        prev
                          ? { ...prev, distanceFromPreviousKm: event.target.value }
                          : prev,
                      )
                    }
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{copy.label.rfcRemitenteDestinatario}</Label>
                <Input
                  value={values.rfcRemitenteDestinatario}
                  onChange={(event) =>
                    setValues((prev) =>
                      prev
                        ? {
                            ...prev,
                            rfcRemitenteDestinatario: normalizeRfc(event.target.value),
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>{copy.label.nombreRemitenteDestinatario}</Label>
                <Input
                  value={values.nombreRemitenteDestinatario}
                  onChange={(event) =>
                    setValues((prev) =>
                      prev
                        ? { ...prev, nombreRemitenteDestinatario: event.target.value }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`stop-${stopId}-delivery-rfc`}>
                    {copy.label.deliveryRfcOptional}
                  </Label>
                  <HintIcon label={copy.label.deliveryRfcOptional} side="top">
                    {copy.hint.deliveryRfc}
                  </HintIcon>
                </div>
                <Input
                  id={`stop-${stopId}-delivery-rfc`}
                  value={values.deliveryRfcRemitenteDestinatario}
                  onChange={(event) =>
                    setValues((prev) =>
                      prev
                        ? {
                            ...prev,
                            deliveryRfcRemitenteDestinatario: normalizeRfc(event.target.value),
                          }
                        : prev,
                    )
                  }
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`stop-${stopId}-delivery-name`}>
                    {copy.label.deliveryNameOptional}
                  </Label>
                  <HintIcon label={copy.label.deliveryNameOptional} side="top">
                    {copy.hint.deliveryName}
                  </HintIcon>
                </div>
                <Input
                  id={`stop-${stopId}-delivery-name`}
                  value={values.deliveryNombreRemitenteDestinatario}
                  onChange={(event) =>
                    setValues((prev) =>
                      prev
                        ? {
                            ...prev,
                            deliveryNombreRemitenteDestinatario: event.target.value,
                          }
                        : prev,
                    )
                  }
                />
              </div>
            </div>

            {fieldErrors.length > 0 ? (
              <ul className="space-y-1 text-xs text-destructive">
                {fieldErrors.map((issue) => (
                  <li key={issue}>- {issue}</li>
                ))}
              </ul>
            ) : null}
          </section>
        </div>
      </ScrollArea>

      <SheetFooter className="shrink-0 gap-2 border-t border-border bg-background pt-4 sm:justify-between">
        <Button variant="outline" asChild>
          <Link to={`/trips/${trip.id}/edit`}>{copy.action.openFullEdit}</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            {copy.action.cancel}
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {copy.action.saveChanges}
          </Button>
        </div>
      </SheetFooter>
    </>
  );
}

export function TripStopOperationalEditSheet({
  trip,
  stopId,
  open,
  isSaving,
  onOpenChange,
  onSubmit,
}: TripStopOperationalEditSheetProps) {
  const sourceStop = stopId
    ? (trip.stops ?? []).find((stop) => stop.id === stopId)
    : undefined;
  const contentKey = sourceStop
    ? `${trip.id}-${stopId}-${trip.updatedAt.toISOString()}`
    : "empty";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full max-h-[100dvh] flex-col overflow-hidden sm:max-w-2xl">
        {open && stopId ? (
          <TripStopOperationalEditSheetContent
            key={contentKey}
            trip={trip}
            stopId={stopId}
            isSaving={isSaving}
            onOpenChange={onOpenChange}
            onSubmit={onSubmit}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
