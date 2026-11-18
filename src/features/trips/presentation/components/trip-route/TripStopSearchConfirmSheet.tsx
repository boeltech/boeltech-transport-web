/**
 * F9c/F9d — Panel único Buscar→Confirmar del alta de ruta como Sheet overlay.
 * Dueño del Sheet DS (dim + panel derecho; ancho canónico LocationSheet).
 * En Confirmar, StopFormSheet es cuerpo inline (sin Sheet anidado).
 * Conserva F9b: selectionConfirm=immediate. F9d: seed solo al abrir.
 */

import { useEffect, useCallback, useRef, useState, type ReactNode } from "react";
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
import { estimateRoadDistanceKm } from "@shared/utils/geoUtils";

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

/** Ancho canónico denso lugar (D-F9d-1 / paridad LocationSheet). */
const SHEET_CONTENT_CLASS =
  "flex w-full flex-col gap-0 p-0 sm:max-w-xl md:max-w-2xl";

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
  /**
   * Labels del extremo vecino (nunca el stop en edición).
   * El lado editado sale del draft Confirmar (F9i / D-EP-1).
   */
  consequenceFromLabel?: string | null;
  consequenceToLabel?: string | null;
  /**
   * Coords del vecino fijo para preview O↔D (origen edit → dest; destino edit → origin).
   * Escala: omitir → pending «al guardar» (D-EP-4).
   */
  consequenceNeighborLatitude?: number | null;
  consequenceNeighborLongitude?: number | null;
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

function primaryActionForCategory(
  category: RouteStopCategory | undefined,
): string {
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

function formatConsequenceKm(km: number): string {
  return copy.panel.consequenceDistance(
    km.toLocaleString("es-MX", { maximumFractionDigits: 0 }),
  );
}

/** Preview de distancia del candidato (nunca total persistido stale). */
function consequenceDistanceCopy(args: {
  category: RouteStopCategory;
  draftLat: number | null | undefined;
  draftLng: number | null | undefined;
  neighborLat: number | null | undefined;
  neighborLng: number | null | undefined;
}): string {
  if (args.category === "waypoint") {
    return copy.panel.consequenceDistancePendingSave;
  }
  const estimated = estimateRoadDistanceKm(
    args.draftLat,
    args.draftLng,
    args.neighborLat,
    args.neighborLng,
  );
  if (estimated != null && Number.isFinite(estimated)) {
    return formatConsequenceKm(estimated);
  }
  const hasDraftGeo = args.draftLat != null && args.draftLng != null;
  const hasNeighborGeo = args.neighborLat != null && args.neighborLng != null;
  if (!hasDraftGeo || !hasNeighborGeo) {
    return copy.panel.consequenceDistancePending;
  }
  return copy.panel.consequenceDistancePendingSave;
}

/**
 * Seed desde LocationValue — F9h: no sembrar city desde cityHint comercial.
 * Preferir locality SAT del slice.
 */
function seedFromLocationValue(
  category: RouteStopCategory,
  value: LocationValue,
): StopFormData {
  const item =
    locationValueToAddressSearchListItem(value) ??
    synthesizeSearchItemFromLocationValue(value);
  const slice = item
    ? addressSearchItemToDialogSlice(item)
    : locationValueToDialogSlice(value);
  const satCity =
    slice.localityName?.trim() ||
    value.localityName?.trim() ||
    slice.cityName?.trim() ||
    "";
  return {
    ...dialogToStopFormData({
      ...getEmptyStopDialogValues(),
      ...slice,
      stopCategory: category,
      stopType: composerStopTypes(category),
      cityName: satCity,
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
  consequenceNeighborLatitude = null,
  consequenceNeighborLongitude = null,
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
  /** Key de sesión del form: solo cambia al abrir (no por locationName/CP). */
  const [formSessionKey, setFormSessionKey] = useState(0);
  const wasOpenRef = useRef(false);

  // F9d O1: seed solo en transición open false→true. No re-sembrar mientras
  // el Sheet está abierto aunque initialData sea un objeto nuevo cada render.
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setStep(initialStep);
      setConfirmSeed(initialData);
      setFormSessionKey((key) => key + 1);
    }
    wasOpenRef.current = open;
  }, [open, initialStep, initialData]);

  const title = panelTitle(resolvedCategory, heading, mode);
  const panelDescription = description ?? copy.panel.chooseDescription;

  /** F9i — lado editado = draft/form; vecino = props; km = preview o pending. */
  const renderConsequences = useCallback(
    (live: {
      locationName: string;
      latitude: number | null;
      longitude: number | null;
    }): ReactNode => {
      if (step !== "confirm") return null;
      const draftLabel =
        live.locationName?.trim() ||
        confirmSeed?.locationName?.trim() ||
        "";
      const from =
        resolvedCategory === "origin"
          ? draftLabel || copy.composer.originSlot
          : consequenceFromLabel?.trim() || copy.composer.originSlot;
      const to =
        resolvedCategory === "destination"
          ? draftLabel || copy.composer.destinationSlot
          : consequenceToLabel?.trim() || copy.composer.destinationSlot;
      const draftLat = live.latitude ?? confirmSeed?.latitude ?? null;
      const draftLng = live.longitude ?? confirmSeed?.longitude ?? null;
      const km = consequenceDistanceCopy({
        category: resolvedCategory,
        draftLat,
        draftLng,
        neighborLat: consequenceNeighborLatitude,
        neighborLng: consequenceNeighborLongitude,
      });
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
          <p className="mt-2 text-muted-foreground">
            {copy.hint.routeSavedVsCartaPorte}
          </p>
        </div>
      );
    },
    [
      step,
      consequenceFromLabel,
      consequenceToLabel,
      consequenceNeighborLatitude,
      consequenceNeighborLongitude,
      resolvedCategory,
      confirmSeed?.locationName,
      confirmSeed?.latitude,
      confirmSeed?.longitude,
    ],
  );

  const handleSearchSelect = (value: LocationValue) => {
    setConfirmSeed(seedFromLocationValue(resolvedCategory, value));
    setStep("confirm");
  };

  const handleCreateRequest = () => {
    setConfirmSeed(
      seedFromLocationValue(resolvedCategory, {
        locationName: null,
        geolocationPending: true,
      }),
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
              key={`stop-form-session-${formSessionKey}`}
              open
              onOpenChange={onOpenChange}
              onSubmit={onSubmit}
              initialData={confirmSeed}
              mode={mode}
              heading={title}
              description={panelDescription}
              variant="inline"
              selectionConfirm="immediate"
              primaryActionLabel={primaryActionForCategory(resolvedCategory)}
              consequences={renderConsequences}
              hideChromeHeader
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
