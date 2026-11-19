import { useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Edit2,
  Plus,
  Trash2,
} from "lucide-react";

import {
  type CargoStatusType,
  type TripCargo,
  type TripStatusType,
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
import { cn } from "@shared/lib/utils/cn";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import {
  EntityListTable,
  type EntityListColumnDef,
  type EntityListStackedValue,
} from "@shared/ui/table";
import { formatTime } from "@shared/utils/dateUtils";

import { tripDetailCopy } from "../../copy";
import {
  canShowAddDeliveryInCargoEdit,
  getCargoPlanningStops,
  getCargoWeightKg,
  isCargoHazmat,
  isCargoInsured,
  isCargoPlanningGapMuted,
  resolveCargoStatusLabel,
  resolveMissingDeliveryAlert,
  resolveUnderAllocatedAlert,
  summarizeUnderAllocatedDeliveries,
} from "./tripCargoDetailHelpers";
import { sumCargoUnits } from "./tripCargoSummaryHelpers";
import { resolveStopForMovement } from "../../utils/stopCargoCorrelation";

const copy = tripDetailCopy.cargo;

export type TripDetailCargoMasterDetailProps = {
  cargos: readonly TripCargo[];
  orderedStops: readonly TripStop[];
  /** Para alias UI «Planeada» (pending en draft/scheduled). */
  tripStatus?: TripStatusType;
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
  /** Q6: append con CFDI de flete vigente → aviso Atención fiscal. */
  appendMarksFiscalAttention?: boolean;
  onAddCargo: () => void;
  onEditCargo: (cargoId: string) => void;
  onRemoveCargo: (cargoId: string) => void;
  onGoToRoute?: () => void;
  isRemoving?: boolean;
};

function cargoSecondaryFacts(cargo: TripCargo): string | null {
  const parts = [
    cargo.units != null && cargo.units > 0
      ? copy.format.unitsCount(cargo.units)
      : null,
    cargo.packagingType?.trim() || cargo.packagingDescription?.trim() || null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function cargoStatusBadgeVariant(
  status: CargoStatusType | TripCargo["status"],
): "info" | "success" | "neutral" | "warning" {
  if (status === "in_transit") return "info";
  if (status === "delivered") return "success";
  if (status === "returned" || status === "cancelled") return "warning";
  return "neutral";
}

function movementStatusLine(
  completedAt: Date | string | null | undefined,
  completedLabel: string,
): string {
  if (completedAt == null) return copy.format.movementPending;
  const iso =
    completedAt instanceof Date
      ? completedAt.toISOString()
      : String(completedAt);
  const time = formatTime(iso);
  if (time === "—") return completedLabel;
  return copy.format.movementCompletedAt(completedLabel, time);
}

function buildCargoColumns(
  orderedStops: readonly TripStop[],
  tripStatus: TripStatusType | undefined,
): EntityListColumnDef<TripCargo>[] {
  return [
    {
      id: "cargo",
      header: copy.table.cargo,
      kind: "stacked",
      accessor: (cargo): EntityListStackedValue => {
        const hazmat = isCargoHazmat(cargo);
        const planning = getCargoPlanningStops(cargo, orderedStops);
        const planningGapMuted = isCargoPlanningGapMuted(cargo.status);
        const missingPickup =
          !planningGapMuted &&
          (!planning.hasPickupMovement || planning.pickupLabel == null);
        const missingDelivery =
          !planningGapMuted &&
          (!planning.hasDeliveryMovement || planning.deliveryLabels.length === 0);
        return {
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="text-primary">{cargo.description}</span>
              {hazmat ? (
                <Badge variant="warning" tone="soft">
                  {copy.label.hazardous}
                </Badge>
              ) : null}
              {missingPickup ? (
                <Badge variant="warning" tone="soft">
                  {copy.state.missingPickup}
                </Badge>
              ) : null}
              {missingDelivery ? (
                <Badge variant="outline">{copy.state.missingDelivery}</Badge>
              ) : null}
            </span>
          ),
          secondary: cargoSecondaryFacts(cargo) ?? undefined,
        };
      },
    },
    {
      id: "weight",
      header: copy.table.weightKg,
      kind: "number",
      className: "w-[7rem]",
      accessor: (cargo) => {
        const kg = getCargoWeightKg(cargo);
        return kg > 0 ? kg : null;
      },
    },
    {
      id: "route",
      header: copy.table.route,
      kind: "stacked",
      accessor: (cargo): EntityListStackedValue => {
        const planning = getCargoPlanningStops(cargo, orderedStops);
        const planningGapMuted = isCargoPlanningGapMuted(cargo.status);
        const pickupMissing =
          !planningGapMuted &&
          (!planning.hasPickupMovement || planning.pickupLabel == null);
        const deliveryMissing =
          !planningGapMuted &&
          (!planning.hasDeliveryMovement || planning.deliveryLabels.length === 0);
        return {
          primary: (
            <span className="inline-flex flex-wrap items-center gap-1">
              <span className="text-muted-foreground">{copy.section.pickup}</span>
              {pickupMissing ? (
                <Badge variant="warning" tone="soft">
                  {copy.state.missingPickup}
                </Badge>
              ) : (
                <span>{planning.pickupLabel ?? "—"}</span>
              )}
            </span>
          ),
          secondary: (
            <span className="inline-flex flex-wrap items-center gap-1">
              <span>{copy.section.delivery}</span>
              {deliveryMissing ? (
                <Badge variant="outline">{copy.state.missingDelivery}</Badge>
              ) : planning.deliveryLabels.length > 0 ? (
                <span>{planning.deliveryLabels.join(", ")}</span>
              ) : (
                <span>—</span>
              )}
            </span>
          ),
        };
      },
    },
    {
      id: "status",
      header: copy.table.status,
      kind: "status",
      className: "w-[7.5rem]",
      accessor: (cargo) => (
        <Badge
          variant={cargoStatusBadgeVariant(cargo.status)}
          tone="soft"
          title={copy.hint.statusInTracking}
        >
          {resolveCargoStatusLabel(cargo.status, tripStatus)}
        </Badge>
      ),
    },
  ];
}

function DetailKvRow({
  label,
  children,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  valueClassName?: string;
}) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("min-w-0", valueClassName)}>{children}</dd>
    </>
  );
}

function CargoReadPanel({
  cargo,
  orderedStops,
  canEditStructural,
  canDeleteCargo,
  onEdit,
  onRequestRemove,
}: {
  cargo: TripCargo;
  orderedStops: readonly TripStop[];
  tripStatus?: TripStatusType;
  canEditStructural: boolean;
  canDeleteCargo: boolean;
  onEdit: () => void;
  onRequestRemove: () => void;
}) {
  const planning = getCargoPlanningStops(cargo, orderedStops);
  const hazmat = isCargoHazmat(cargo);
  const insured = isCargoInsured(cargo);
  const weightKg = getCargoWeightKg(cargo);

  const planningGapMuted = isCargoPlanningGapMuted(cargo.status);
  const pickupMissing = planning.pickupLabel == null;
  const deliveryMissing = planning.deliveryLabels.length === 0;
  const deliveryMissingHistorical = planningGapMuted && deliveryMissing;

  const hazmatCode = cargo.hazardousMaterialCode?.trim() || null;
  const packagingType = cargo.packagingType?.trim() || null;
  const packagingDescription = cargo.packagingDescription?.trim() || null;
  const packagingLabel =
    packagingDescription || packagingType || null;
  const showHazmatDetail =
    hazmat && Boolean(hazmatCode || packagingType || packagingDescription);

  const pickupMovement = (cargo.movements ?? []).find(
    (movement) => movement.movementType === "pickup",
  );
  const deliveryMovements = (cargo.movements ?? []).filter(
    (movement) => movement.movementType === "delivery",
  );

  const notesText =
    cargo.specialInstructions?.trim() || cargo.notes?.trim() || null;
  const showActions = canEditStructural || canDeleteCargo;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <section className="space-y-2" aria-label={copy.section.route}>
          <p className="text-xs font-semibold text-foreground">
            {copy.section.route}
          </p>
          <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            <DetailKvRow
              label={copy.section.pickup}
              valueClassName={cn(
                pickupMissing && !planningGapMuted && "text-warning",
                pickupMissing &&
                  planningGapMuted &&
                  "text-muted-foreground",
              )}
            >
              <span className="font-medium leading-snug">
                {planning.pickupLabel ?? copy.state.missingPickup}
              </span>
              {!pickupMissing ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {movementStatusLine(
                    pickupMovement?.completedAt ?? cargo.pickedUpAt,
                    copy.label.pickupCompleted,
                  )}
                </span>
              ) : null}
            </DetailKvRow>

            <DetailKvRow
              label={copy.section.delivery}
              valueClassName={cn(
                deliveryMissing && !planningGapMuted && "text-warning",
                deliveryMissingHistorical && "text-muted-foreground",
              )}
            >
              {deliveryMissingHistorical ? (
                <span className="font-medium">
                  {copy.state.missingDeliveryHistorical}
                </span>
              ) : deliveryMissing ? (
                <span className="font-medium">{copy.state.missingDelivery}</span>
              ) : (
                <ul className="space-y-2">
                  {planning.deliveryLabels.map((label, index) => {
                    const movement = deliveryMovements[index];
                    const stop = movement
                      ? resolveStopForMovement(movement, orderedStops)
                      : null;
                    return (
                      <li key={`${label}-${index}`} className="leading-snug">
                        <span className="font-medium">{label}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {movementStatusLine(
                            movement?.completedAt ??
                              (stop && cargo.deliveredAt
                                ? cargo.deliveredAt
                                : null),
                            copy.label.deliveryCompleted,
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </DetailKvRow>
          </dl>
        </section>

        <section className="space-y-2" aria-label={copy.section.quantities}>
          <p className="text-xs font-semibold text-foreground">
            {copy.section.quantities}
          </p>
          <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
            {cargo.units != null && cargo.units > 0 ? (
              <DetailKvRow label={copy.label.units}>
                <span className="font-medium">
                  {copy.format.unitsCount(cargo.units)}
                </span>
              </DetailKvRow>
            ) : null}
            {weightKg > 0 ? (
              <DetailKvRow label={copy.label.weight}>
                <span className="font-medium tabular-nums">
                  {copy.format.weightKg(weightKg)}
                </span>
              </DetailKvRow>
            ) : null}
            {packagingLabel ? (
              <DetailKvRow label={copy.label.packagingType}>
                <span className="font-medium">{packagingLabel}</span>
              </DetailKvRow>
            ) : null}
            {cargo.volume != null && Number(cargo.volume) > 0 ? (
              <DetailKvRow label={copy.label.volume}>
                <span className="font-medium tabular-nums">
                  {copy.format.volume(cargo.volume)}
                </span>
              </DetailKvRow>
            ) : null}
          </dl>
        </section>

        {showHazmatDetail ? (
          <section
            className="space-y-2 rounded-lg border border-warning/40 bg-warning-soft/40 px-3 py-2.5"
            aria-label={copy.label.hazardous}
          >
            <p className="text-xs font-semibold text-warning-soft-foreground">
              {copy.label.hazardous}
            </p>
            <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-sm">
              {hazmatCode ? (
                <DetailKvRow label={copy.label.hazardousCode}>
                  <span className="font-medium tabular-nums">{hazmatCode}</span>
                </DetailKvRow>
              ) : null}
              {packagingType && packagingDescription ? (
                <DetailKvRow label={copy.label.packagingDescription}>
                  <span className="font-medium">{packagingDescription}</span>
                </DetailKvRow>
              ) : null}
            </dl>
          </section>
        ) : null}

        {insured ? (
          <section className="space-y-2" aria-label={copy.section.insurance}>
            <p className="text-xs font-semibold text-foreground">
              {copy.section.insurance}
            </p>
            <dl className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 text-sm">
              {cargo.declaredValue != null && cargo.declaredValue > 0 ? (
                <DetailKvRow label={copy.label.insuranceValue}>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(cargo.declaredValue)}
                  </span>
                </DetailKvRow>
              ) : null}
              {cargo.aseguraCarga?.trim() ? (
                <DetailKvRow label={copy.label.insurer}>
                  <span className="font-medium">{cargo.aseguraCarga}</span>
                </DetailKvRow>
              ) : null}
              {cargo.polizaCarga?.trim() ? (
                <DetailKvRow label={copy.label.policy}>
                  <span className="font-medium tabular-nums">
                    {cargo.polizaCarga}
                  </span>
                </DetailKvRow>
              ) : null}
            </dl>
          </section>
        ) : null}

        {notesText ? (
          <div className="rounded-md bg-muted px-3 py-2.5 text-sm leading-relaxed text-foreground">
            <span className="font-medium">{copy.label.specialInstructions}: </span>
            {notesText}
          </div>
        ) : null}
      </div>

      {showActions ? (
        <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border/60 pt-3">
          {canDeleteCargo ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-destructive"
              onClick={onRequestRemove}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.action.removeCargo}
            </Button>
          ) : null}
          {canEditStructural ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={onEdit}
            >
              <Edit2 className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              {copy.action.editCargo}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function TripDetailCargoMasterDetail({
  cargos,
  orderedStops,
  tripStatus,
  canEditStructural,
  canDeleteCargo = false,
  canAppendCargo = false,
  showAppendOnlyBanner = false,
  appendMarksFiscalAttention = false,
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

  const columns = useMemo(
    () => buildCargoColumns(orderedStops, tripStatus),
    [orderedStops, tripStatus],
  );

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
  const totalUnits = sumCargoUnits(cargos);

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

  const underAllocatedSummary = summarizeUnderAllocatedDeliveries(cargos);
  const underAllocatedAlert =
    underAllocatedSummary != null
      ? resolveUnderAllocatedAlert({
          summary: underAllocatedSummary,
          canEditStructural,
        })
      : null;
  const underAllocatedFocusCargoId = underAllocatedSummary?.cargoIds[0] ?? null;

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

  const listSubtitle = showAppendOnlyBanner
    ? copy.hint.appendOnlyBanner
    : copy.hint.list;

  const detail =
    selectedCargo != null ? (
      <CargoReadPanel
        cargo={selectedCargo}
        orderedStops={orderedStops}
        tripStatus={tripStatus}
        canEditStructural={canEditStructural}
        canDeleteCargo={canDeleteCargo}
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

  const tableFooter = (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm font-semibold tabular-nums text-foreground">
      <span>
        {copy.format.tableFooterPrimary(cargos.length, totalUnits, totalWeightKg)}
      </span>
      <span>
        {totalWeightKg > 0 ? copy.format.kgNumber(totalWeightKg) : "—"}
      </span>
    </div>
  );

  return (
    <div className="space-y-4">
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

      {underAllocatedAlert ? (
        <DetailAlertCard
          severity={underAllocatedAlert.severity}
          icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
          title={underAllocatedAlert.title}
          items={[{ text: underAllocatedAlert.body }]}
          action={
            underAllocatedAlert.showEditAction && underAllocatedFocusCargoId ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => focusAndEditCargo(underAllocatedFocusCargoId)}
              >
                {copy.action.fixFirstCargo}
              </Button>
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

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,21rem)] lg:items-start">
        <section
          className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
          aria-label={copy.section.list}
        >
          <div className="flex flex-col gap-3 px-5 pt-3.5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-base font-semibold leading-6">
                {copy.section.list}
              </h3>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                {listSubtitle}
              </p>
              {showAppendOnlyBanner && appendMarksFiscalAttention ? (
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {copy.hint.appendFiscalAttentionHint}
                </p>
              ) : null}
            </div>
            {canAppendCargo ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                onClick={onAddCargo}
              >
                <Plus className="mr-2 h-4 w-4" aria-hidden />
                {copy.action.addCargo}
              </Button>
            ) : null}
          </div>

          <div className="mt-3">
            <EntityListTable
              aria-label={copy.table.ariaLabel}
              columns={columns}
              rows={[...cargos]}
              getRowId={(row) => row.id}
              density="compact"
              framed={false}
              onRowActivate={(row) => handleSelect(row.id)}
              getRowClassName={(row) =>
                resolvedViewId === row.id ? "bg-primary-50" : undefined
              }
              footer={tableFooter}
            />
          </div>
        </section>

        {!isMobile ? (
          <aside
            className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
            aria-label={copy.section.detail}
          >
            <div className="px-5 pt-3.5">
              <h3 className="text-base font-semibold leading-6">
                {copy.section.detail}
              </h3>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
                {selectedCargo?.description ?? copy.hint.selectCargo}
              </p>
            </div>
            <div className="max-h-[min(32rem,70vh)] overflow-y-auto px-5 py-4">
              {detail}
            </div>
          </aside>
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
            <SheetDescription>
              {selectedCargo?.description ?? copy.hint.mobileDetailSheet}
            </SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-4">
            {selectedCargo ? (
              <CargoReadPanel
                cargo={selectedCargo}
                orderedStops={orderedStops}
                tripStatus={tripStatus}
                canEditStructural={canEditStructural}
                canDeleteCargo={canDeleteCargo}
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
