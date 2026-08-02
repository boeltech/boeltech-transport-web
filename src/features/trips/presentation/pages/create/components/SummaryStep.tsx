/**
 * SummaryStep - Paso 5 del wizard de viajes
 * Checkout operativo: franja de confirmación + digests por paso + rail de totales.
 */

import { useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import {
  Truck,
  User,
  Calendar,
  MapPin,
  Package,
  Navigation,
  Flag,
  AlertTriangle,
  FileCheck,
  Scale,
  Users,
  Gauge,
  CircleDollarSign,
  Receipt,
  ShieldCheck,
  ChevronDown,
  MessageSquare,
} from "lucide-react";

import type { DriverListItem } from "@features/drivers";
import { formatDateTimeFromLocalInput } from "@shared/utils/dateUtils";
import { Badge } from "@shared/ui/badge";
import { InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { Card, CardContent } from "@shared/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import { Textarea } from "@shared/ui/text-area";
import { cn } from "@shared/lib/utils/cn";

import type { TripWizardFormValues } from "./validation";
import {
  buildTripWizardFinancialSnapshot,
  formatMxCurrency,
  TripWizardFinancialSummary,
} from "../../../components/trip-financial";
import { SummaryReviewSection } from "./SummaryReviewSection";
import { TripConfirmStrip } from "./TripConfirmStrip";
import { wizardCopy } from "../../../copy";
import {
  buildSummaryPickupStops,
  formatSummaryStopHeaderLabel,
  getCargosForPickupStop,
} from "./summaryWizardHelpers";
import {
  formatWizardStopAddressLine,
  formatWizardStopCityLine,
  getWizardStopRoleLabel,
} from "./wizardStopFormat";

const summary = wizardCopy.summary;

const WIZARD_STEP = {
  info: 0,
  route: 1,
  cargo: 2,
  costs: 3,
} as const;

export interface SummaryStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: Array<{ id: string; unitNumber: string; licensePlate: string }>;
  drivers: DriverListItem[];
  clients: Array<{ id: string; legalName: string }>;
  onGoToStep: (stepIndex: number) => void;
}

export function SummaryStep({
  form,
  vehicles,
  drivers,
  clients,
  onGoToStep,
}: SummaryStepProps) {
  const vehicleId = useWatch({ control: form.control, name: "vehicleId" });
  const driverId = useWatch({ control: form.control, name: "driverId" });
  const clientId = useWatch({ control: form.control, name: "clientId" });
  const cfdiDocumentIntent = useWatch({
    control: form.control,
    name: "cfdiDocumentIntent",
  });
  const scheduledDeparture = useWatch({
    control: form.control,
    name: "scheduledDeparture",
  });
  const scheduledArrival = useWatch({
    control: form.control,
    name: "scheduledArrival",
  });
  const startMileage = useWatch({ control: form.control, name: "startMileage" });
  const stops = useWatch({ control: form.control, name: "stops" }) ?? [];
  const cargos = useWatch({ control: form.control, name: "cargos" }) ?? [];
  const expenses = useWatch({ control: form.control, name: "expenses" }) ?? [];
  const baseRate = useWatch({ control: form.control, name: "baseRate" });
  const notes = useWatch({ control: form.control, name: "notes" });
  const internalStaff =
    useWatch({ control: form.control, name: "internalStaff" }) ?? [];

  const [notesOpen, setNotesOpen] = useState(() => Boolean(notes?.trim()));

  const intent = cfdiDocumentIntent === "traslado" ? "traslado" : "ingreso";
  const tripTypeLabel =
    intent === "traslado"
      ? summary.format.trasladoDocument
      : summary.format.ingresoDocument;

  const getVehicleName = (id: string) => {
    const vehicle = vehicles.find((v) => v.id === id);
    return vehicle ? `${vehicle.unitNumber} · ${vehicle.licensePlate}` : "—";
  };

  const getDriverName = (id: string) => {
    const driver = drivers.find((d) => d.id === id);
    return driver
      ? `${driver.employee.firstName} ${driver.employee.lastName}`
      : "—";
  };

  const getClientName = (id?: string) => {
    if (!id || id === "no-client") return summary.label.noClient;
    return clients.find((c) => c.id === id)?.legalName ?? "—";
  };

  const getSupportEmployeeLabel = (employeeId: string) => {
    const asDriver = drivers.find((d) => d.employeeId === employeeId);
    if (asDriver) {
      return `${asDriver.employee.firstName} ${asDriver.employee.lastName}`;
    }
    return summary.label.supportStaff;
  };

  const totalDistanceKm = useMemo(
    () =>
      stops.reduce(
        (sum, stop, index) =>
          index > 0 ? sum + (stop.distanceFromPreviousKm || 0) : sum,
        0,
      ),
    [stops],
  );

  const pickupStops = useMemo(
    () => buildSummaryPickupStops(stops, clients),
    [stops, clients],
  );

  const financialSnapshot = useMemo(
    () => buildTripWizardFinancialSnapshot(baseRate, expenses),
    [baseRate, expenses],
  );

  const { financial } = financialSnapshot;
  const totalWeightKg = cargos.reduce((sum, c) => sum + (c.weightInKg || 0), 0);
  const hasHazmat = cargos.some((c) => c.hazardousMaterial);
  const insuredCargos = cargos.filter(
    (c) => c.isInsured || (c.declaredValue ?? 0) > 0 || !!c.aseguraCarga || !!c.polizaCarga,
  ).length;

  const hasNotes = Boolean(notes?.trim());

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          {summary.page.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {summary.page.subtitle}
        </p>
      </div>

      <TripConfirmStrip
        clientLabel={getClientName(clientId)}
        tripTypeLabel={tripTypeLabel}
        unitLabel={getVehicleName(vehicleId)}
        driverLabel={getDriverName(driverId)}
        departureLabel={formatDateTimeFromLocalInput(scheduledDeparture)}
        stopsLabel={summary.confirm.stops(
          stops.length,
          totalDistanceKm > 0
            ? summary.format.distanceKm(totalDistanceKm)
            : undefined,
        )}
        merchandiseLabel={summary.confirm.merchandise(
          cargos.length,
          totalWeightKg > 0
            ? summary.format.weightKg(totalWeightKg)
            : undefined,
        )}
        utilityLabel={
          financial.marginPct != null
            ? summary.confirm.utility(
                formatMxCurrency(financial.margin),
                summary.confirm.marginPct(financial.marginPct),
              )
            : financial.baseRate > 0
              ? summary.confirm.utility(formatMxCurrency(financial.margin))
              : null
        }
        health={financial.health}
        hasHazmat={hasHazmat}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <SummaryReviewSection
            title={summary.section.info}
            icon={<Truck className="h-4 w-4" />}
            stepIndex={WIZARD_STEP.info}
            onGoToStep={onGoToStep}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                variant="stacked"
                icon={<Truck className="h-4 w-4" />}
                label={summary.label.unit}
                value={getVehicleName(vehicleId)}
              />
              <InfoRow
                variant="stacked"
                icon={<User className="h-4 w-4" />}
                label={summary.label.driver}
                value={getDriverName(driverId)}
              />
              <InfoRow
                variant="stacked"
                icon={<Calendar className="h-4 w-4" />}
                label={summary.label.scheduledDeparture}
                value={formatDateTimeFromLocalInput(scheduledDeparture)}
              />
              <InfoRow
                variant="stacked"
                icon={<Calendar className="h-4 w-4" />}
                label={summary.label.estimatedArrival}
                value={
                  scheduledArrival
                    ? formatDateTimeFromLocalInput(scheduledArrival)
                    : summary.state.captureAtDestination
                }
              />
            </div>

            {startMileage != null && startMileage > 0 ? (
              <InfoRow
                variant="inline"
                icon={<Gauge className="h-4 w-4" />}
                label={summary.label.startMileage}
                value={`${startMileage.toLocaleString("es-MX")} km`}
              />
            ) : null}

            {internalStaff.length > 0 ? (
              <div className="rounded-lg border bg-muted/20 px-3 py-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {summary.label.supportTeam(internalStaff.length)}
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {internalStaff.map((row, index) => (
                    <li key={row.employeeId ?? index}>
                      {getSupportEmployeeLabel(row.employeeId)}
                      {row.internalRole === "secondary_driver" ? (
                        <Badge
                          variant="neutral"
                          tone="soft"
                          className="ml-2 font-normal"
                        >
                          {summary.label.supportStaffSecondaryDriver}
                        </Badge>
                      ) : row.internalRole === "helper" ? (
                        <Badge
                          variant="neutral"
                          tone="soft"
                          className="ml-2 font-normal"
                        >
                          {summary.label.supportStaffHelper}
                        </Badge>
                      ) : null}
                      {row.isPaymentResponsible ? (
                        <Badge
                          variant="outline"
                          className="ml-2 font-normal"
                        >
                          {summary.label.paymentResponsible}
                        </Badge>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </SummaryReviewSection>

          <SummaryReviewSection
            title={summary.section.route}
            icon={<MapPin className="h-4 w-4" />}
            count={stops.length}
            stepIndex={WIZARD_STEP.route}
            onGoToStep={onGoToStep}
          >
            {stops.length === 0 ? (
              <EmptyState
                icon={<MapPin />}
                size="sm"
                title={summary.state.noStops}
              />
            ) : (
              <div className="space-y-0">
                {stops.map((stop, index) => {
                  const { primary, operation } = getWizardStopRoleLabel(
                    stop.stopType,
                  );
                  const isOrigin = stop.stopType.includes("origin");
                  const isDestination = stop.stopType.includes("destination");
                  const isLast = index === stops.length - 1;

                  return (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            "shrink-0 rounded-full p-1.5",
                            isOrigin
                              ? "bg-success-soft"
                              : isDestination
                                ? "bg-destructive-soft"
                                : "bg-muted",
                          )}
                        >
                          {isOrigin ? (
                            <Navigation className="h-3.5 w-3.5 text-success" />
                          ) : isDestination ? (
                            <Flag className="h-3.5 w-3.5 text-destructive" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </div>
                        {!isLast ? (
                          <div
                            className="my-1 min-h-6 w-px flex-1 bg-border"
                            aria-hidden
                          />
                        ) : null}
                      </div>
                      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {stop.locationName ||
                              formatWizardStopAddressLine(stop)}
                          </p>
                          <Badge
                            variant="neutral"
                            tone="soft"
                            className="font-normal"
                          >
                            {primary}
                          </Badge>
                          {operation ? (
                            <Badge
                              variant="secondary"
                              className="font-normal"
                            >
                              {operation}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatWizardStopCityLine(stop)}
                          {index > 0 && stop.distanceFromPreviousKm != null
                            ? ` · ${summary.format.kmFromPrevious(stop.distanceFromPreviousKm)}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SummaryReviewSection>

          <SummaryReviewSection
            title={summary.section.cargo}
            icon={<Package className="h-4 w-4" />}
            count={cargos.length}
            stepIndex={WIZARD_STEP.cargo}
            onGoToStep={onGoToStep}
          >
            {cargos.length === 0 ? (
              <EmptyState
                icon={<Package />}
                size="sm"
                title={summary.state.noCargo}
              />
            ) : pickupStops.length === 0 ? (
              <div className="space-y-2">
                {cargos.map((cargo, index) => (
                  <MerchandiseDigestRow
                    key={cargo.id ?? index}
                    description={cargo.description}
                    units={cargo.units}
                    unitName={cargo.satUnitName}
                    weightInKg={cargo.weightInKg}
                    hazardousMaterial={cargo.hazardousMaterial}
                    isInsured={
                      Boolean(cargo.isInsured) ||
                      (cargo.declaredValue ?? 0) > 0 ||
                      Boolean(cargo.aseguraCarga)
                    }
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pickupStops.map((pickupStop) => {
                  const stopCargos = getCargosForPickupStop(
                    cargos,
                    pickupStop.index,
                  );

                  return (
                    <div key={pickupStop.index} className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">
                          {summary.format.stopGroup(
                            pickupStop.index,
                            pickupStop.locationName,
                            stopCargos.length,
                          )}
                        </p>
                        {stopCargos.length === 0 ? (
                          <Badge
                            variant="warning"
                            tone="soft"
                            className="font-normal"
                          >
                            {summary.badge.emptyStop}
                          </Badge>
                        ) : null}
                      </div>

                      {stopCargos.length === 0 ? null : (
                        <div className="space-y-2">
                          {stopCargos.map((cargo, cargoIndex) => {
                            const deliveries = (cargo.movements ?? []).filter(
                              (m) => m.movementType === "delivery",
                            );
                            return (
                              <MerchandiseDigestRow
                                key={cargo.id ?? cargoIndex}
                                description={cargo.description}
                                units={cargo.units}
                                unitName={cargo.satUnitName}
                                weightInKg={cargo.weightInKg}
                                hazardousMaterial={cargo.hazardousMaterial}
                                isInsured={
                                  Boolean(cargo.isInsured) ||
                                  (cargo.declaredValue ?? 0) > 0 ||
                                  Boolean(cargo.aseguraCarga)
                                }
                                deliveries={deliveries.map((delivery) =>
                                  summary.format.deliveryBadge(
                                    formatSummaryStopHeaderLabel(
                                      delivery.stopIndex,
                                      stops,
                                    ),
                                    delivery.weight,
                                  ),
                                )}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {totalWeightKg > 0 ? (
              <InfoRow
                variant="inline"
                icon={<Scale className="h-4 w-4" />}
                label={summary.label.totalWeight}
                value={summary.format.weightKg(totalWeightKg)}
              />
            ) : null}
            {hasHazmat ? (
              <p className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {summary.hint.hazmat}
              </p>
            ) : null}
            {insuredCargos > 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileCheck className="h-3.5 w-3.5 shrink-0" />
                {summary.hint.insured(insuredCargos)}
              </p>
            ) : null}
          </SummaryReviewSection>

          <SummaryReviewSection
            title={summary.section.costs}
            icon={<CircleDollarSign className="h-4 w-4" />}
            count={expenses.length}
            stepIndex={WIZARD_STEP.costs}
            onGoToStep={onGoToStep}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-info/30 bg-info-soft/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CircleDollarSign className="h-4 w-4" />
                  {summary.label.operational}
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {financialSnapshot.operationalCosts.length === 0
                    ? "—"
                    : formatMxCurrency(
                        financialSnapshot.totalOperationalCosts,
                      )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.label.concepts(
                    financialSnapshot.operationalCosts.length,
                  )}
                </p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning-soft/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Receipt className="h-4 w-4" />
                  {summary.label.indirect}
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {financialSnapshot.indirectExpenses.length === 0
                    ? "—"
                    : formatMxCurrency(
                        financialSnapshot.totalIndirectExpenses,
                      )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.label.concepts(
                    financialSnapshot.indirectExpenses.length,
                  )}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {summary.label.baseRate}
              </span>
              <span className="font-medium">
                {financial.baseRate > 0
                  ? formatMxCurrency(financial.baseRate)
                  : intent === "traslado"
                    ? summary.state.optionalTraslado
                    : summary.state.notCaptured}
              </span>
            </div>
          </SummaryReviewSection>

          <Card>
            <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
              <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 px-6 py-4 text-left">
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-base font-semibold leading-none tracking-tight">
                    <span className="text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                    </span>
                    {summary.section.notes}
                  </span>
                  <span className="mt-1 block truncate text-sm font-normal text-muted-foreground">
                    {hasNotes
                      ? summary.sectionSummary.notesFilled
                      : summary.sectionSummary.notesEmpty}
                  </span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                    notesOpen && "rotate-180",
                  )}
                  aria-hidden
                />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <Controller
                    control={form.control}
                    name="notes"
                    render={({ field, fieldState }) => (
                      <FormFieldShell
                        fieldId="notes"
                        label={summary.label.tripNotes}
                        errorMessage={fieldState.error?.message}
                      >
                        <Textarea
                          id="notes"
                          placeholder={summary.placeholder.notes}
                          className="min-h-[100px]"
                          {...field}
                          error={Boolean(fieldState.error)}
                          {...getFieldErrorAriaProps(
                            "notes",
                            fieldState.error?.message,
                          )}
                        />
                      </FormFieldShell>
                    )}
                  />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>

        <aside className="xl:sticky xl:top-36 xl:self-start">
          <TripWizardFinancialSummary
            snapshot={financialSnapshot}
            variant="totals"
          />
        </aside>
      </div>
    </div>
  );
}

function MerchandiseDigestRow({
  description,
  units,
  unitName,
  weightInKg,
  hazardousMaterial,
  isInsured,
  deliveries = [],
}: {
  description: string;
  units?: number | null;
  unitName?: string | null;
  weightInKg?: number | null;
  hazardousMaterial?: boolean;
  isInsured?: boolean;
  deliveries?: string[];
}) {
  const qtyWeight = [
    units != null && units > 0
      ? summary.format.units(units, unitName || "unidades")
      : null,
    weightInKg != null && weightInKg > 0
      ? summary.format.weightKg(weightInKg)
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className={cn(
        "rounded-md border bg-muted/30 p-2.5",
        hazardousMaterial && "border-warning/30 bg-warning-soft/20",
      )}
    >
      <p className="truncate text-sm font-medium">{description}</p>
      {qtyWeight ? (
        <p className="mt-0.5 text-sm text-muted-foreground">{qtyWeight}</p>
      ) : null}
      {(hazardousMaterial || isInsured || deliveries.length > 0) && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {hazardousMaterial ? (
            <Badge
              variant="warning"
              tone="soft"
              className="gap-1 font-normal"
            >
              <AlertTriangle className="h-3 w-3" />
              {summary.badge.hazmatShort}
            </Badge>
          ) : null}
          {isInsured ? (
            <Badge variant="info" tone="soft" className="gap-1 font-normal">
              <ShieldCheck className="h-3 w-3" />
              {summary.badge.insured}
            </Badge>
          ) : null}
          {deliveries.map((label) => (
            <Badge
              key={label}
              variant="neutral"
              tone="soft"
              className="font-normal"
            >
              {label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
