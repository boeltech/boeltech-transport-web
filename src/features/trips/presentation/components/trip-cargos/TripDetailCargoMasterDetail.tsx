import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  Edit2,
  Package,
  Plus,
  Trash2,
} from "lucide-react";

import {
  CARGO_STATUS_LABELS,
  type TripCargo,
  type TripStop,
} from "@features/trips/domain";
import { formatCurrency } from "@features/trips";
import { useMediaQuery } from "@shared/hooks";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@shared/ui/alert-dialog";
import { DetailAlertCard } from "@shared/ui/data-display";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { cn } from "@shared/lib/utils/cn";

import { tripDetailCopy } from "../../copy";
import {
  canShowAddDeliveryInCargoEdit,
  formatCargoRouteLine,
  getCargoPlanningStops,
  getCargoWeightKg,
  isCargoHazmat,
  isCargoInsured,
  isCargoPlanningGapMuted,
  resolveMissingDeliveryAlert,
} from "./tripCargoDetailHelpers";

const copy = tripDetailCopy.cargo;

export type TripDetailCargoMasterDetailProps = {
  cargos: readonly TripCargo[];
  orderedStops: readonly TripStop[];
  canEditStructural: boolean;
  /**
   * Eliminar carga: exige `trips.delete` (admin/manager). Independiente de
   * `canEditStructural` / `trips.update` — Opción A PRD.
   */
  canDeleteCargo?: boolean;
  /** ADR-0093 — CTA agregar carga mid-trip. */
  canAppendCargo?: boolean;
  /** Mid-trip: solo append (sin editar/eliminar estructurales). */
  showAppendOnlyBanner?: boolean;
  onAddCargo: () => void;
  onEditCargo: (cargoId: string) => void;
  onRemoveCargo: (cargoId: string) => void;
  onGoToRoute?: () => void;
  isRemoving?: boolean;
};

function CargoMasterRow({
  cargo,
  orderedStops,
  selected,
  onClick,
}: {
  cargo: TripCargo;
  orderedStops: readonly TripStop[];
  selected: boolean;
  onClick: () => void;
}) {
  const hazmat = isCargoHazmat(cargo);
  const weightKg = getCargoWeightKg(cargo);
  const routeLine = formatCargoRouteLine(cargo, orderedStops);
  const planning = getCargoPlanningStops(cargo, orderedStops);
  const planningGapMuted = isCargoPlanningGapMuted(cargo.status);
  const missingPickup =
    !planningGapMuted &&
    (!planning.hasPickupMovement || planning.pickupLabel == null);
  const missingDelivery =
    !planningGapMuted &&
    (!planning.hasDeliveryMovement || planning.deliveryLabels.length === 0);
  const facts = [
    weightKg > 0 ? copy.format.weightKg(weightKg) : null,
    cargo.units != null && cargo.units > 0
      ? copy.format.unitsCount(cargo.units)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group w-full rounded-md border p-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected
          ? "border-primary bg-background shadow-sm"
          : "border-transparent bg-card hover:border-border",
        hazmat && !selected ? "border-warning/30 bg-warning-soft/20" : null,
      )}
    >
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 truncate text-sm font-medium">
            {cargo.description}
          </span>
          {hazmat ? (
            <Badge
              variant="warning"
              tone="soft"
              className="text-[10px] font-normal"
            >
              {copy.label.hazardous}
            </Badge>
          ) : null}
          {missingPickup ? (
            <Badge
              variant="warning"
              tone="soft"
              className="text-[10px] font-normal"
            >
              {copy.state.missingPickup}
            </Badge>
          ) : null}
          {missingDelivery ? (
            <Badge
              variant="outline"
              className="text-[10px] font-normal text-muted-foreground"
            >
              {copy.state.missingDelivery}
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">{routeLine}</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {facts ? (
            <p className="text-xs text-muted-foreground tabular-nums">{facts}</p>
          ) : null}
          <Badge
            variant="outline"
            className="text-[10px] font-normal text-muted-foreground"
            title={copy.hint.statusInTracking}
          >
            {CARGO_STATUS_LABELS[cargo.status] || cargo.status}
          </Badge>
        </div>
      </div>
    </button>
  );
}

function CargoReadPanel({
  cargo,
  orderedStops,
  canEditStructural,
  canDeleteCargo,
  showTrackingFooter,
  onEdit,
  onRequestRemove,
}: {
  cargo: TripCargo;
  orderedStops: readonly TripStop[];
  canEditStructural: boolean;
  canDeleteCargo: boolean;
  /** Pie «estado en Seguimiento» solo cuando aporta (p. ej. mid-trip). */
  showTrackingFooter?: boolean;
  onEdit: () => void;
  onRequestRemove: () => void;
}) {
  const planning = getCargoPlanningStops(cargo, orderedStops);
  const hazmat = isCargoHazmat(cargo);
  const insured = isCargoInsured(cargo);
  const weightKg = getCargoWeightKg(cargo);

  const planningGapMuted = isCargoPlanningGapMuted(cargo.status);
  const pickupValue = planning.pickupLabel ?? copy.state.missingPickup;
  const pickupMissing = planning.pickupLabel == null;
  const deliveryMissing = planning.deliveryLabels.length === 0;
  const deliveryMissingHistorical = planningGapMuted && deliveryMissing;

  const hazmatCode = cargo.hazardousMaterialCode?.trim() || null;
  const packagingType = cargo.packagingType?.trim() || null;
  const packagingDescription = cargo.packagingDescription?.trim() || null;
  const showHazmatDetail =
    hazmat && Boolean(hazmatCode || packagingType || packagingDescription);

  const quantityParts = [
    weightKg > 0 ? copy.format.weightKg(weightKg) : null,
    cargo.units != null && cargo.units > 0
      ? copy.format.unitsCount(cargo.units)
      : null,
    cargo.volume != null && Number(cargo.volume) > 0
      ? copy.format.volume(cargo.volume)
      : null,
  ].filter((part): part is string => Boolean(part));

  const hasNotes =
    Boolean(cargo.notes?.trim()) || Boolean(cargo.specialInstructions?.trim());

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        {/* Cabecera: qué es + acciones secundarias */}
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 space-y-2">
            <h3 className="text-base font-semibold leading-snug tracking-tight">
              {cargo.description}
            </h3>
            <div className="flex flex-wrap items-center gap-1.5">
              {hazmat ? (
                <Badge
                  variant="warning"
                  tone="soft"
                  className="text-xs font-normal"
                >
                  {copy.label.hazardous}
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">
                {copy.hint.statusInTracking}:{" "}
                <Badge
                  variant="outline"
                  className="align-middle text-[10px] font-normal text-muted-foreground"
                >
                  {CARGO_STATUS_LABELS[cargo.status] || cargo.status}
                </Badge>
              </span>
            </div>
          </div>
          {canEditStructural || canDeleteCargo ? (
            <div className="flex shrink-0 items-center gap-0.5">
              {canEditStructural ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 text-muted-foreground"
                  onClick={onEdit}
                >
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                  {copy.action.editCargo}
                </Button>
              ) : null}
              {canDeleteCargo ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={onRequestRemove}
                  aria-label={copy.action.removeCargo}
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {/* Bloque principal: de → a */}
        <section className="space-y-2" aria-label={copy.section.route}>
          <p className="text-xs font-medium text-muted-foreground">
            {copy.section.route}
          </p>
          <div className="rounded-lg border bg-muted/30 px-3 py-3 sm:px-4">
            <div className="space-y-1">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {copy.section.pickup}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium leading-snug",
                    pickupMissing && !planningGapMuted && "text-warning",
                    pickupMissing && planningGapMuted && "text-muted-foreground",
                  )}
                >
                  {pickupValue}
                </p>
              </div>

              <div
                className="flex items-center gap-2 py-1 text-muted-foreground"
                aria-hidden
              >
                <span className="h-px flex-1 bg-border" />
                <ArrowDown className="h-3.5 w-3.5 shrink-0" />
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">
                  {copy.section.delivery}
                </p>
                {deliveryMissingHistorical ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    {copy.state.missingDeliveryHistorical}
                  </p>
                ) : deliveryMissing ? (
                  <p className="text-sm font-medium text-warning">
                    {copy.state.missingDelivery}
                  </p>
                ) : (
                  <ul className="space-y-1">
                    {planning.deliveryLabels.map((label) => (
                      <li
                        key={label}
                        className="text-sm font-medium leading-snug"
                      >
                        {label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Cantidades: una línea escaneable */}
        {quantityParts.length > 0 ? (
          <p className="text-sm font-medium tabular-nums tracking-tight text-foreground">
            {copy.format.quantitiesLine(quantityParts)}
          </p>
        ) : null}

        {showHazmatDetail ? (
          <section
            className="space-y-2 rounded-lg border border-warning/40 bg-warning-soft/40 px-3 py-2.5"
            aria-label={copy.label.hazardous}
          >
            <p className="text-xs font-semibold text-warning-soft-foreground">
              {copy.label.hazardous}
            </p>
            <dl className="space-y-1.5 text-sm">
              {hazmatCode ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {copy.label.hazardousCode}
                  </dt>
                  <dd className="font-medium tabular-nums">{hazmatCode}</dd>
                </div>
              ) : null}
              {packagingType ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {copy.label.packagingType}
                  </dt>
                  <dd className="font-medium tabular-nums">{packagingType}</dd>
                </div>
              ) : null}
              {packagingDescription ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {copy.label.packagingDescription}
                  </dt>
                  <dd className="text-right font-medium">
                    {packagingDescription}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {/* Anexos: seguro / notas */}
        {insured ? (
          <section className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.section.insurance}
            </p>
            <dl className="space-y-1.5 text-sm">
              {cargo.declaredValue != null && cargo.declaredValue > 0 ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">
                    {copy.label.insuranceValue}
                  </dt>
                  <dd className="tabular-nums font-medium">
                    {formatCurrency(cargo.declaredValue)}
                  </dd>
                </div>
              ) : null}
              {cargo.aseguraCarga?.trim() ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">{copy.label.insurer}</dt>
                  <dd className="text-right font-medium">
                    {cargo.aseguraCarga}
                  </dd>
                </div>
              ) : null}
              {cargo.polizaCarga?.trim() ? (
                <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5">
                  <dt className="text-muted-foreground">{copy.label.policy}</dt>
                  <dd className="font-medium tabular-nums">{cargo.polizaCarga}</dd>
                </div>
              ) : null}
            </dl>
          </section>
        ) : null}

        {hasNotes ? (
          <section className="space-y-2 border-t border-border/60 pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              {copy.section.notes}
            </p>
            <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {cargo.notes?.trim() ? <p>{cargo.notes}</p> : null}
              {cargo.specialInstructions?.trim() ? (
                <p>
                  <span className="font-medium text-foreground/80">
                    {copy.label.specialInstructions}:{" "}
                  </span>
                  {cargo.specialInstructions}
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>

      {showTrackingFooter ? (
        <p className="mt-5 border-t border-border/60 pt-3 text-xs text-muted-foreground">
          {copy.hint.manageInTracking}
        </p>
      ) : null}
    </div>
  );
}

export function TripDetailCargoMasterDetail({
  cargos,
  orderedStops,
  canEditStructural,
  canDeleteCargo = false,
  canAppendCargo = false,
  showAppendOnlyBanner = false,
  onAddCargo,
  onEditCargo,
  onRemoveCargo,
  onGoToRoute,
  isRemoving = false,
}: TripDetailCargoMasterDetailProps) {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);

  const resolvedViewId = useMemo(() => {
    if (cargos.length === 0) return null;
    if (selectedId != null && cargos.some((c) => c.id === selectedId)) {
      return selectedId;
    }
    return cargos[0]?.id ?? null;
  }, [cargos, selectedId]);

  const selectedCargo =
    cargos.find((c) => c.id === resolvedViewId) ?? null;

  const totalWeightKg = cargos.reduce(
    (sum, cargo) => sum + getCargoWeightKg(cargo),
    0,
  );

  const cargosWithoutPickup = cargos.filter((cargo) => {
    if (isCargoPlanningGapMuted(cargo.status)) return false;
    const planning = getCargoPlanningStops(cargo, orderedStops);
    return !planning.hasPickupMovement || planning.pickupLabel == null;
  });
  const cargosWithoutDelivery = cargos.filter((cargo) => {
    if (isCargoPlanningGapMuted(cargo.status)) return false;
    const planning = getCargoPlanningStops(cargo, orderedStops);
    return (
      !planning.hasDeliveryMovement || planning.deliveryLabels.length === 0
    );
  });
  const cargosWithUnresolved = cargos.filter((cargo) => {
    if (isCargoPlanningGapMuted(cargo.status)) return false;
    return (
      getCargoPlanningStops(cargo, orderedStops).unresolvedMovementCount > 0
    );
  });
  const unresolvedMovementCount = cargosWithUnresolved.reduce((count, cargo) => {
    return (
      count + getCargoPlanningStops(cargo, orderedStops).unresolvedMovementCount
    );
  }, 0);

  const canAddDeliveryInEdit = canShowAddDeliveryInCargoEdit(orderedStops);
  const missingDeliveryAlert =
    cargosWithoutDelivery.length > 0
      ? resolveMissingDeliveryAlert({
          count: cargosWithoutDelivery.length,
          canAddDeliveryInEdit,
          canEditStructural,
          canAppendCargo,
          hasGoToRoute: onGoToRoute != null,
        })
      : null;

  const handleSelect = (cargoId: string) => {
    setSelectedId(cargoId);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  };

  const focusAndEditCargo = (cargoId: string) => {
    setSelectedId(cargoId);
    if (isMobile) setMobileSheetOpen(false);
    onEditCargo(cargoId);
  };

  const pendingRemoveCargo =
    pendingRemoveId != null
      ? (cargos.find((c) => c.id === pendingRemoveId) ?? null)
      : null;

  const detail =
    selectedCargo != null ? (
      <CargoReadPanel
        cargo={selectedCargo}
        orderedStops={orderedStops}
        canEditStructural={canEditStructural}
        canDeleteCargo={canDeleteCargo}
        showTrackingFooter={showAppendOnlyBanner}
        onEdit={() => {
          setSelectedId((prev) => prev ?? resolvedViewId);
          onEditCargo(selectedCargo.id);
        }}
        onRequestRemove={() => setPendingRemoveId(selectedCargo.id)}
      />
    ) : (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        {copy.hint.selectCargo}
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold flex items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-primary" aria-hidden />
            {copy.section.list}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{copy.hint.list}</p>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {copy.format.metaLine(cargos.length, totalWeightKg)}
          </p>
        </div>
        {canAppendCargo ? (
          <Button type="button" size="sm" variant="outline" onClick={onAddCargo}>
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            {copy.action.addCargo}
          </Button>
        ) : null}
      </div>

      {showAppendOnlyBanner ? (
        <p
          className="rounded-md border border-border/80 bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
          role="status"
        >
          {copy.hint.appendOnlyBanner}
        </p>
      ) : null}

      {cargosWithoutPickup.length > 0 ? (
        <DetailAlertCard
          severity="warning"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          title={copy.alert.noPickupTitle}
          items={[
            { text: copy.alert.noPickupBody(cargosWithoutPickup.length) },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              {onGoToRoute ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onGoToRoute}
                >
                  {copy.action.goToRoute}
                </Button>
              ) : null}
              {canEditStructural && cargosWithoutPickup[0] ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    focusAndEditCargo(cargosWithoutPickup[0]!.id)
                  }
                >
                  {copy.action.fixFirstCargo}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}

      {missingDeliveryAlert ? (
        <DetailAlertCard
          severity="info"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          title={copy.alert.noDeliveryTitle}
          items={[{ text: missingDeliveryAlert.body }]}
          action={
            missingDeliveryAlert.showEditAction ||
            missingDeliveryAlert.showAddCargoAction ||
            missingDeliveryAlert.showGoToRouteAction ? (
              <div className="flex flex-wrap gap-2">
                {missingDeliveryAlert.showGoToRouteAction && onGoToRoute ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onGoToRoute}
                  >
                    {copy.action.goToRoute}
                  </Button>
                ) : null}
                {missingDeliveryAlert.showAddCargoAction ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onAddCargo}
                  >
                    {copy.action.addCargo}
                  </Button>
                ) : null}
                {missingDeliveryAlert.showEditAction &&
                cargosWithoutDelivery[0] ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      focusAndEditCargo(cargosWithoutDelivery[0]!.id)
                    }
                  >
                    {copy.action.fixFirstCargo}
                  </Button>
                ) : null}
              </div>
            ) : null
          }
        />
      ) : null}

      {unresolvedMovementCount > 0 ? (
        <DetailAlertCard
          severity="info"
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          title={copy.alert.unresolvedTitle}
          items={[
            {
              text: copy.alert.unresolvedMovementBody(unresolvedMovementCount),
            },
          ]}
          action={
            <div className="flex flex-wrap gap-2">
              {onGoToRoute ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onGoToRoute}
                >
                  {copy.action.goToRoute}
                </Button>
              ) : null}
              {canEditStructural && cargosWithUnresolved[0] ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    focusAndEditCargo(cargosWithUnresolved[0]!.id)
                  }
                >
                  {copy.action.fixFirstCargo}
                </Button>
              ) : null}
            </div>
          }
        />
      ) : null}

      <div className="grid gap-4 rounded-md border bg-muted/30 p-2 md:grid-cols-[280px_1fr] md:items-stretch md:gap-0">
        <div className="flex flex-col gap-1.5 md:max-h-[min(28rem,65vh)] md:overflow-y-auto md:border-r md:p-2">
          {cargos.map((cargo) => (
            <CargoMasterRow
              key={cargo.id}
              cargo={cargo}
              orderedStops={orderedStops}
              selected={resolvedViewId === cargo.id}
              onClick={() => handleSelect(cargo.id)}
            />
          ))}
        </div>

        {!isMobile ? (
          <div className="min-h-0 overflow-y-auto bg-background md:max-h-[min(28rem,65vh)] md:rounded-r-md md:p-5">
            {detail}
          </div>
        ) : null}
      </div>

      <Sheet
        open={isMobile && mobileSheetOpen && selectedCargo != null}
        onOpenChange={(open) => {
          if (!open) setMobileSheetOpen(false);
        }}
      >
        <SheetContent className="flex w-full flex-col sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{copy.section.detail}</SheetTitle>
            <SheetDescription>{copy.hint.mobileDetailSheet}</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
            {selectedCargo ? (
              <CargoReadPanel
                cargo={selectedCargo}
                orderedStops={orderedStops}
                canEditStructural={canEditStructural}
                canDeleteCargo={canDeleteCargo}
                showTrackingFooter={showAppendOnlyBanner}
                onEdit={() => {
                  onEditCargo(selectedCargo.id);
                  setMobileSheetOpen(false);
                }}
                onRequestRemove={() => setPendingRemoveId(selectedCargo.id)}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={pendingRemoveId != null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoveId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{copy.action.confirmRemoveTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoveCargo
                ? `${copy.action.confirmRemoveBody} («${pendingRemoveCargo.description}»).`
                : copy.action.confirmRemoveBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>
              {copy.action.keepCargo}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemoving || !pendingRemoveId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault();
                if (!pendingRemoveId) return;
                onRemoveCargo(pendingRemoveId);
                setPendingRemoveId(null);
                if (selectedId === pendingRemoveId) {
                  setSelectedId(null);
                }
                setMobileSheetOpen(false);
              }}
            >
              {copy.action.confirmRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
