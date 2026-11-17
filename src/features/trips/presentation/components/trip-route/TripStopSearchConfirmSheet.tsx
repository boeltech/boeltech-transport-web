/**
 * F9c — Panel único Buscar→Confirmar del alta de ruta como Sheet overlay (artboard).
 * Dueño del Sheet DS (dim + panel derecho ~480px). En Confirmar, StopFormSheet es
 * cuerpo inline (sin Sheet anidado). Conserva F9b: selectionConfirm=immediate.
 */

import { useEffect, useMemo, useState } from "react";
import { Check } from "lucide-react";

import type { LatLng } from "@shared/geolocation/contracts/geoPorts";
import { Button } from "@shared/ui/button";
import { cn } from "@shared/lib/utils/cn";
import {
  LocationPicker,
  locationValueToAddressSearchListItem,
  synthesizeSearchItemFromLocationValue,
  type LocationValue,
} from "@shared/ui/location";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";

import { tripDetailCopy } from "../../copy";
import {
  StopFormSheet,
  type StopFormSheetProps,
} from "../../pages/create/components/StopFormSheet";
import {
  addressSearchItemToDialogSlice,
  dialogToStopFormData,
  getEmptyStopDialogValues,
  locationValueToDialogSlice,
  type StopFormData,
} from "../../pages/create/components/stopDialogAddressMapper";
import { composerStopTypes } from "./buildReplaceStopsPayload";
import { ownerTypesForRouteSlot, isAllowedRoutePickerItem } from "./routeAddressPickerOwnerTypes";
import { type RouteStopCategory } from "./tripRouteDetailHelpers";

const copy = tripDetailCopy.route;

/** Ancho del artboard Operate-Viaje-Alta-Confirmar (~480px). */
const SHEET_CONTENT_CLASS =
  "flex w-full flex-col gap-0 p-0 sm:max-w-[480px]";

export type TripStopSearchConfirmStep = "search" | "confirm";

export type TripStopSearchConfirmSheetProps = Omit<
  StopFormSheetProps,
  "variant" | "hideChromeHeader" | "selectionConfirm" | "primaryActionLabel" | "consequences"
> & {
  /** Paso inicial al abrir. Completar domicilio → confirm; captura vacía → search. */
  initialStep?: TripStopSearchConfirmStep;
  category?: RouteStopCategory;
  proximity?: LatLng | null;
  cityHint?: string | null;
  clientId?: string | null;
  /** Labels para la caja de consecuencias (origen / destino / km). */
  consequenceFromLabel?: string | null;
  consequenceToLabel?: string | null;
  estimatedDistanceKm?: number | null;
  /**
   * Ctx del header (artboard): `{código viaje} · parada N de M · {rol}`.
   * Si falta, el header solo muestra título + descripción.
   */
  contextLine?: string | null;
};

function panelTitle(
  category: RouteStopCategory | undefined,
  heading: string | undefined,
  mode: "create" | "edit" | undefined,
): string {
  if (heading) return heading;
  if (mode === "edit") return copy.action.completeAddress;
  if (category === "origin") return copy.panel.chooseOrigin;
  if (category === "destination") return copy.panel.chooseDestination;
  if (category === "waypoint") return copy.panel.chooseWaypoint;
  return copy.action.completeAddress;
}

function useAsLabel(category: RouteStopCategory | undefined): string {
  if (category === "origin") return copy.panel.useAsOrigin;
  if (category === "destination") return copy.panel.useAsDestination;
  if (category === "waypoint") return copy.panel.useAsWaypoint;
  return copy.panel.useAsDestination;
}

function consequencesTitle(category: RouteStopCategory | undefined): string {
  if (category === "origin") return copy.panel.consequencesTitleOrigin;
  if (category === "destination") return copy.panel.consequencesTitleDestination;
  return copy.panel.consequencesTitleWaypoint;
}

function seedFromLocationValue(
  category: RouteStopCategory,
  value: LocationValue,
  cityHint?: string | null,
): StopFormData {
  const item =
    locationValueToAddressSearchListItem(value) ??
    synthesizeSearchItemFromLocationValue(value);
  const slice = item
    ? addressSearchItemToDialogSlice(item)
    : locationValueToDialogSlice(value);
  return {
    ...dialogToStopFormData({
      ...getEmptyStopDialogValues(),
      ...slice,
      stopCategory: category,
      stopType: composerStopTypes(category),
      cityName: cityHint?.trim() || slice.cityName || "",
      locationName:
        value.locationName?.trim() ||
        item?.locationName?.trim() ||
        slice.locationName ||
        "",
    }),
    stopCategory: category,
    stopType: composerStopTypes(category),
  };
}

function Stepper({ step }: { step: TripStopSearchConfirmStep }) {
  const searchDone = step === "confirm";
  return (
    <ol
      className="flex items-center gap-3"
      aria-label={`${copy.panel.stepSearch}, ${copy.panel.stepConfirm}`}
      data-testid="trip-stop-panel-stepper"
    >
      <li className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            searchDone
              ? "bg-success text-success-foreground"
              : step === "search"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
          )}
          aria-current={step === "search" ? "step" : undefined}
        >
          {searchDone ? <Check className="h-3.5 w-3.5" aria-hidden /> : "1"}
        </span>
        <span
          className={cn(
            "text-sm",
            step === "search" ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {copy.panel.stepSearch}
        </span>
      </li>
      <li className="h-px w-6 bg-border" aria-hidden />
      <li className="flex items-center gap-2">
        <span
          className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
            step === "confirm"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
          aria-current={step === "confirm" ? "step" : undefined}
        >
          2
        </span>
        <span
          className={cn(
            "text-sm",
            step === "confirm" ? "font-medium text-foreground" : "text-muted-foreground",
          )}
        >
          {copy.panel.stepConfirm}
        </span>
      </li>
    </ol>
  );
}

/**
 * Panel único del alta: Sheet overlay Buscar → Confirmar (StopFormSheet body).
 * No monta LocationSheet ADR-0092 ni un segundo Sheet.
 */
export function TripStopSearchConfirmSheet({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  mode = "create",
  heading,
  description,
  initialStep = "confirm",
  category,
  proximity = null,
  cityHint = null,
  clientId = null,
  consequenceFromLabel = null,
  consequenceToLabel = null,
  estimatedDistanceKm = null,
  contextLine = null,
  ...stopFormProps
}: TripStopSearchConfirmSheetProps) {
  const resolvedCategory: RouteStopCategory =
    category ??
    initialData?.stopCategory ??
    "destination";
  const [step, setStep] = useState<TripStopSearchConfirmStep>(initialStep);
  const [confirmSeed, setConfirmSeed] = useState<StopFormData | undefined>(
    initialData,
  );

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
    setConfirmSeed(initialData);
  }, [open, initialStep, initialData]);

  const title = panelTitle(resolvedCategory, heading, mode);
  const panelDescription = description ?? copy.panel.chooseDescription;

  const consequences = useMemo(() => {
    if (step !== "confirm") return null;
    const from =
      consequenceFromLabel?.trim() ||
      (resolvedCategory === "origin"
        ? confirmSeed?.locationName?.trim() || copy.composer.originSlot
        : consequenceFromLabel) ||
      copy.composer.originSlot;
    const to =
      consequenceToLabel?.trim() ||
      (resolvedCategory === "destination"
        ? confirmSeed?.locationName?.trim() || copy.composer.destinationSlot
        : consequenceToLabel) ||
      copy.composer.destinationSlot;
    const km =
      estimatedDistanceKm != null && Number.isFinite(estimatedDistanceKm)
        ? copy.panel.consequenceDistance(
            estimatedDistanceKm.toLocaleString("es-MX", {
              maximumFractionDigits: 0,
            }),
          )
        : copy.panel.consequenceDistancePending;
    return (
      <div
        className="w-full rounded-lg border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground"
        data-testid="trip-stop-confirm-consequences"
      >
        <p className="mb-1.5 font-medium text-foreground">
          {consequencesTitle(resolvedCategory)}
        </p>
        <ul className="list-disc space-y-1 pl-4">
          <li>{copy.panel.consequenceSaveRoute(from || "—", to || "—")}</li>
          <li>{km}</li>
          <li>{copy.panel.consequenceCartaPorte}</li>
        </ul>
        <p className="mt-2 text-muted-foreground">{copy.hint.routeSavedVsCartaPorte}</p>
      </div>
    );
  }, [
    step,
    consequenceFromLabel,
    consequenceToLabel,
    estimatedDistanceKm,
    resolvedCategory,
    confirmSeed?.locationName,
  ]);

  const handleSearchSelect = (value: LocationValue) => {
    setConfirmSeed(seedFromLocationValue(resolvedCategory, value, cityHint));
    setStep("confirm");
  };

  const handleCreateRequest = () => {
    setConfirmSeed(
      seedFromLocationValue(
        resolvedCategory,
        { locationName: null, geolocationPending: true },
        cityHint,
      ),
    );
    setStep("confirm");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={SHEET_CONTENT_CLASS}
        data-testid="trip-stop-search-confirm-panel"
        data-step={step}
        data-variant="sheet"
        onFocusOutside={(event) => event.preventDefault()}
      >
        <SheetHeader className="shrink-0 space-y-1 border-b px-6 py-4 text-left">
          {contextLine?.trim() ? (
            <p
              className="text-xs font-semibold text-muted-foreground"
              data-testid="trip-stop-panel-context"
            >
              {contextLine.trim()}
            </p>
          ) : null}
          <SheetTitle className="pr-8">{title}</SheetTitle>
          <SheetDescription>{panelDescription}</SheetDescription>
          <div className="pt-3">
            <Stepper step={step} />
          </div>
        </SheetHeader>

        {step === "search" ? (
          <>
            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
              {cityHint?.trim() ? (
                <p className="text-xs text-muted-foreground">
                  {copy.composer.cityHint(cityHint.trim())}
                </p>
              ) : null}
              <LocationPicker
                onSelect={handleSearchSelect}
                onCreateRequest={handleCreateRequest}
                clientId={clientId}
                ownerTypes={ownerTypesForRouteSlot(resolvedCategory)}
                filterItem={isAllowedRoutePickerItem}
                proximity={proximity}
                ariaLabel={`${title}: ${copy.composer.pickerLabel}`}
                onlyGeolocated
              />
              <p className="text-xs text-muted-foreground">
                {copy.panel.searchFooterHint}
              </p>
            </div>
            <SheetFooter className="shrink-0 flex-row justify-end gap-2 border-t bg-background px-6 py-4 sm:flex-row sm:space-x-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {copy.action.cancel}
              </Button>
              <Button type="button" disabled>
                {copy.action.continueSearch}
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-4">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
              <p className="text-xs text-muted-foreground">
                {copy.hint.routeSavedVsCartaPorte}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setStep("search")}
              >
                {copy.action.changeLocation}
              </Button>
            </div>
            <StopFormSheet
              {...stopFormProps}
              key={
                confirmSeed?.locationName ||
                confirmSeed?.postalCode ||
                `${resolvedCategory}-confirm`
              }
              open
              onOpenChange={onOpenChange}
              onSubmit={onSubmit}
              initialData={confirmSeed}
              mode={mode}
              heading={title}
              description={panelDescription}
              variant="inline"
              selectionConfirm="immediate"
              primaryActionLabel={useAsLabel(resolvedCategory)}
              consequences={consequences}
              hideChromeHeader
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
