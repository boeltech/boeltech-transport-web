/**
 * SummaryStep - Paso 5 del wizard de viajes
 * Revisión tipo checkout: secciones por paso + rail financiero sticky.
 */

import { useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import {
  Truck,
  User,
  Building2,
  Calendar,
  MapPin,
  Package,
  FileText,
  Navigation,
  Flag,
  AlertTriangle,
  FileCheck,
  Scale,
  Milestone,
  Users,
  Gauge,
  AlertCircle,
  CircleDollarSign,
  Receipt,
  Box,
} from "lucide-react";

import type { DriverListItem } from "@features/drivers";
import { formatDateTimeFromLocalInput } from "@shared/utils/dateUtils";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { DetailAlertCard, InfoRow } from "@shared/ui/data-display";
import { EmptyState } from "@shared/ui/feedback-states";
import { FormFieldShell, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Textarea } from "@shared/ui/text-area";
import { cn } from "@shared/lib/utils/cn";

import type { TripWizardFormValues } from "./validation";
import { wizardHasContractingClient } from "./validation";
import {
  buildTripWizardFinancialSnapshot,
  formatMxCurrency,
  TripWizardFinancialSummary,
} from "../../../components/trip-financial";
import { SummaryReviewSection } from "./SummaryReviewSection";
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

const CFDI_INTENT_LABELS: Record<"ingreso" | "traslado", string> = {
  ingreso: "Ingreso",
  traslado: "Traslado",
};

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
  const internalStaff = useWatch({ control: form.control, name: "internalStaff" }) ?? [];

  const intent = cfdiDocumentIntent === "traslado" ? "traslado" : "ingreso";
  const hasContractingClient = wizardHasContractingClient(clientId);

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
    (c) => (c.declaredValue ?? 0) > 0 || !!c.aseguraCarga || !!c.polizaCarga,
  ).length;

  const missingBaseRateForIngreso =
    intent === "ingreso" &&
    hasContractingClient &&
    (baseRate == null || baseRate < 0.01);

  const marginChipClass =
    financial.health === "healthy"
      ? "border-success/40 bg-success-soft text-success-soft-foreground"
      : financial.health === "warning"
        ? "border-warning/40 bg-warning-soft text-warning-soft-foreground"
        : financial.health === "critical"
          ? "border-destructive/40 bg-destructive-soft text-destructive-soft-foreground"
          : "border-border bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">Confirmar viaje</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Revisa cada sección antes de crear o guardar. Usa Editar para corregir un paso.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">{CFDI_INTENT_LABELS[intent]}</Badge>
        <Badge variant="outline" className="max-w-[200px] truncate">
          {getClientName(clientId)}
        </Badge>
        <Badge variant="outline">
          {stops.length} parada{stops.length !== 1 ? "s" : ""}
          {totalDistanceKm > 0
            ? ` · ${totalDistanceKm.toLocaleString("es-MX")} km`
            : ""}
        </Badge>
        <Badge variant="outline">
          {cargos.length} carga{cargos.length !== 1 ? "s" : ""}
          {totalWeightKg > 0
            ? ` · ${totalWeightKg.toLocaleString("es-MX")} kg`
            : ""}
        </Badge>
        {financial.marginPct != null ? (
          <Badge variant="outline" className={marginChipClass}>
            Margen {financial.marginPct.toFixed(1)}%
          </Badge>
        ) : null}
        {hasHazmat ? (
          <Badge variant="outline" className="border-warning/40 text-warning">
            Material peligroso
          </Badge>
        ) : null}
      </div>

      {(missingBaseRateForIngreso || financial.health === "critical") && (
        <div className="space-y-3">
          {missingBaseRateForIngreso ? (
            <DetailAlertCard
              severity="warning"
              icon={<AlertCircle className="h-4 w-4" />}
              title={summary.alert.baseRatePendingTitle}
              items={[{ text: summary.alert.baseRatePendingBody }]}
            />
          ) : null}
          {financial.health === "critical" ? (
            <DetailAlertCard
              severity="critical"
              icon={<AlertCircle className="h-4 w-4" />}
              title={summary.alert.marginCriticalTitle}
              items={[{ text: summary.alert.marginCriticalBody }]}
            />
          ) : null}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <SummaryReviewSection
            title={summary.section.info}
            icon={<FileText className="h-4 w-4" />}
            stepIndex={WIZARD_STEP.info}
            onGoToStep={onGoToStep}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <InfoRow
                variant="stacked"
                icon={<Truck className="h-4 w-4" />}
                label="Unidad"
                value={getVehicleName(vehicleId)}
              />
              <InfoRow
                variant="stacked"
                icon={<User className="h-4 w-4" />}
                label="Conductor"
                value={getDriverName(driverId)}
              />
              <InfoRow
                variant="stacked"
                icon={<Building2 className="h-4 w-4" />}
                label={summary.label.mainClient}
                value={getClientName(clientId)}
              />
              <InfoRow
                variant="stacked"
                icon={<FileText className="h-4 w-4" />}
                label={summary.label.cfdiDocument}
                value={
                  intent === "traslado"
                    ? summary.format.trasladoDocument
                    : summary.format.ingresoDocument
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                  Equipo de apoyo ({internalStaff.length})
                </div>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {internalStaff.map((row, index) => (
                    <li key={row.employeeId ?? index}>
                      {getSupportEmployeeLabel(row.employeeId)}
                      {row.isPaymentResponsible ? (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Responsable de pago
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
              <EmptyState icon={<MapPin />} size="sm" title={summary.state.noStops} />
            ) : (
              <div className="space-y-0">
                {stops.map((stop, index) => {
                  const { primary, operation } = getWizardStopRoleLabel(stop.stopType);
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
                          <div className="my-1 w-px min-h-6 flex-1 bg-border" aria-hidden />
                        ) : null}
                      </div>
                      <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium">
                            {stop.locationName || formatWizardStopAddressLine(stop)}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {primary}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {operation}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatWizardStopCityLine(stop)}
                          {stop.postalCode ? ` · CP ${stop.postalCode}` : ""}
                          {index > 0 && stop.distanceFromPreviousKm != null
                            ? ` · ${stop.distanceFromPreviousKm} km desde anterior`
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
              <EmptyState icon={<Package />} size="sm" title={summary.state.noCargo} />
            ) : pickupStops.length === 0 ? (
              <div className="space-y-2">
                {cargos.map((cargo, index) => (
                  <p key={cargo.id ?? index} className="text-sm">
                    {cargo.description}
                  </p>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pickupStops.map((pickupStop) => {
                  const stopCargos = getCargosForPickupStop(cargos, pickupStop.index);
                  const StopIcon =
                    pickupStop.category === "origin"
                      ? Navigation
                      : pickupStop.category === "destination"
                        ? Flag
                        : MapPin;

                  return (
                    <div
                      key={pickupStop.index}
                      className={cn(
                        "rounded-lg border p-3",
                        pickupStop.category === "origin" && "border-success/30",
                        pickupStop.category === "destination" && "border-destructive/30",
                      )}
                    >
                      <div className="mb-2 flex items-start gap-2">
                        <StopIcon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            Parada #{pickupStop.index + 1}
                            {pickupStop.locationName
                              ? ` · ${pickupStop.locationName}`
                              : ""}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {pickupStop.address} · {pickupStop.city}
                          </p>
                        </div>
                        <Badge variant="secondary" className="ml-auto shrink-0 text-xs">
                          {stopCargos.length}
                        </Badge>
                      </div>

                      {stopCargos.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          Sin mercancías en esta parada de carga.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {stopCargos.map((cargo, cargoIndex) => {
                            const deliveries = (cargo.movements ?? []).filter(
                              (m) => m.movementType === "delivery",
                            );
                            return (
                              <div
                                key={cargo.id ?? cargoIndex}
                                className={cn(
                                  "rounded-md bg-muted/50 p-2",
                                  cargo.hazardousMaterial &&
                                    "border border-warning/30 bg-warning-soft/20",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <p className="flex-1 truncate text-sm font-medium">
                                    {cargo.description}
                                  </p>
                                  {cargo.hazardousMaterial ? (
                                    <Badge variant="destructive" className="text-xs">
                                      Peligroso
                                    </Badge>
                                  ) : null}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  {cargo.satProductCode ? (
                                    <span className="font-mono">{cargo.satProductCode}</span>
                                  ) : null}
                                  {cargo.weightInKg != null && cargo.weightInKg > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Scale className="h-3 w-3" />
                                      {cargo.weightInKg} kg
                                    </span>
                                  ) : null}
                                  {cargo.units != null && cargo.units > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Box className="h-3 w-3" />
                                      {cargo.units} {cargo.satUnitName || "uds"}
                                    </span>
                                  ) : null}
                                </div>
                                {deliveries.length > 0 ? (
                                  <div className="mt-1.5 flex flex-wrap gap-1">
                                    {deliveries.map((delivery, delIdx) => (
                                      <Badge
                                        key={delIdx}
                                        variant="outline"
                                        className="text-xs font-normal"
                                      >
                                        Entrega:{" "}
                                        {formatSummaryStopHeaderLabel(
                                          delivery.stopIndex,
                                          stops,
                                        )}
                                        {delivery.weight != null
                                          ? ` · ${delivery.weight} kg`
                                          : ""}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
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
                label={summary.label.totalGrossWeight}
                value={`${totalWeightKg.toLocaleString("es-MX")} kg`}
              />
            ) : null}
            {hasHazmat ? (
              <p className="flex items-center gap-2 text-xs text-warning">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Incluye material peligroso — verifique documentación.
              </p>
            ) : null}
            {insuredCargos > 0 ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileCheck className="h-3.5 w-3.5 shrink-0" />
                {insuredCargos} carga{insuredCargos !== 1 ? "s" : ""} con seguro de carga.
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
                  Costos operativos
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {financialSnapshot.operationalCosts.length === 0
                    ? "—"
                    : formatMxCurrency(financialSnapshot.totalOperationalCosts)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {financialSnapshot.operationalCosts.length} concepto
                  {financialSnapshot.operationalCosts.length !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="rounded-lg border border-warning/30 bg-warning-soft/30 px-3 py-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Receipt className="h-4 w-4" />
                  Gastos indirectos
                </div>
                <p className="mt-1 text-lg font-semibold">
                  {financialSnapshot.indirectExpenses.length === 0
                    ? "—"
                    : formatMxCurrency(financialSnapshot.totalIndirectExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {financialSnapshot.indirectExpenses.length} concepto
                  {financialSnapshot.indirectExpenses.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Tarifa base</span>
              <span className="font-medium">
                {financial.baseRate > 0
                  ? formatMxCurrency(financial.baseRate)
                  : intent === "traslado"
                    ? summary.state.optionalTraslado
                    : summary.state.notCaptured}
              </span>
            </div>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm"
              onClick={() => onGoToStep(WIZARD_STEP.costs)}
            >
              Ver detalle de conceptos en Costos
            </Button>
          </SummaryReviewSection>

          <FormSectionCard title={summary.section.notes} contentClassName="space-y-4">
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
                    {...getFieldErrorAriaProps("notes", fieldState.error?.message)}
                  />
                </FormFieldShell>
              )}
            />
          </FormSectionCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:self-start">
          <TripWizardFinancialSummary snapshot={financialSnapshot} />
          <div className="rounded-lg border bg-muted/20 px-3 py-3 text-sm">
            <p className="font-medium">Totales de carga</p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <div className="flex justify-between gap-2">
                <span>Mercancías</span>
                <span className="font-medium text-foreground">{cargos.length}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Peso bruto</span>
                <span className="font-medium text-foreground">
                  {totalWeightKg > 0
                    ? `${totalWeightKg.toLocaleString("es-MX")} kg`
                    : "—"}
                </span>
              </div>
              {totalDistanceKm > 0 ? (
                <div className="flex justify-between gap-2">
                  <span className="inline-flex items-center gap-1">
                    <Milestone className="h-3.5 w-3.5" />
                    Distancia
                  </span>
                  <span className="font-medium text-foreground">
                    {totalDistanceKm.toLocaleString("es-MX")} km
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
