/**
 * BasicInfoStep - Paso 1 del Wizard (5 pasos)
 * Información básica: Asignaciones, Programación, Autotransporte y Figura de Transporte
 *
 * CARTA PORTE 3.1 - Este paso captura:
 * - Asignaciones (vehículo, conductor, cliente)
 * - Programación (fechas, kilometraje)
 * - Autotransporte Federal (permiso SCT, config vehicular, seguros)
 * - Figura de Transporte (operador con datos SAT)
 *
 * INTEGRACIÓN:
 * - useVehicle: Obtiene detalle del vehículo seleccionado para precargar datos de Carta Porte
 * - useDriver: (futuro) Obtener detalle del conductor para precargar datos de Figura
 *
 * Ubicación: src/features/trips/presentation/pages/create/components/steps/BasicInfoStep.tsx
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Controller, useFieldArray, type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { FormFieldShell, DateTimeField, getFieldErrorAriaProps } from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
} from "@shared/ui/select";
import { Input } from "@shared/ui/input";
import { Button } from "@shared/ui/button";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Truck,
  Users,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Label } from "@shared/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/ui/table";

import type { TripWizardFormValues } from "./validation";
import type { AssignableDriverItem } from "../tripAssignmentDrivers";
import type { BusyAssignmentResourceIds } from "../tripAssignmentBusyResources";
import {
  buildAssignableSupportStaffForTripWizard,
  type SupportStaffPositionFilter,
} from "../tripAssignmentSupportStaff";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import type { DriverListItem } from "@features/drivers/domain";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";
import { DetailAlertCard } from "@shared/ui/data-display";
import { useInternalStaffEntitlement } from "@features/billing";

// Hook para obtener detalle del vehículo (datos de Carta Porte para indicadores)
import { useVehicle } from "@features/vehicles/application";
import { useEmployees } from "@features/employees";
import type { EmployeeListItem } from "@features/employees";
import { wizardCopy } from "../../../copy";
import { tripScheduleDateTimeFieldProps } from "../../../scheduleDateTimeField";
import { TripAssignmentResourceFields } from "./TripAssignmentResourceFields";
import { OriginBranchField } from "./OriginBranchField";

const copy = wizardCopy.basicInfo;
const shellValidation = wizardCopy.shell.validation;
const scheduleFieldProps = tripScheduleDateTimeFieldProps(copy.preset);

// ============================================================================
// TYPES
// ============================================================================

interface VehicleMileageSource {
  currentMileage: number;
}

/** Valores alineados a `POSITION_OPTIONS` en empleados (catálogo local). */
const SUPPORT_STAFF_POSITION_FILTER_OPTIONS = [
  { value: "Conductor", label: copy.positionFilter.conductor },
  { value: "Ayudante general", label: copy.positionFilter.helper },
] as const satisfies ReadonlyArray<{
  value: SupportStaffPositionFilter;
  label: string;
}>;

const EMPTY_INTERNAL_STAFF: TripWizardFormValues["internalStaff"] = [];

function isEmployeeActive(employee: EmployeeListItem): boolean {
  return employee.isActive && employee.status === "active";
}

function extractVehicleDetail(
  source: unknown,
): VehicleMileageSource | undefined {
  if (!source || typeof source !== "object") return undefined;

  if ("data" in source) {
    const data = (source as { data?: unknown }).data;
    if (data && typeof data === "object") {
      return data as VehicleMileageSource;
    }
  }

  return source as VehicleMileageSource;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface BasicInfoStepProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<TripWizardFormValues, any, any>;
  vehicles: AssignableVehicleItem[];
  drivers: AssignableDriverItem[];
  fleetDrivers: DriverListItem[];
  busyResources: BusyAssignmentResourceIds;
  clients: Array<{ id: string; legalName: string }>;
  isLoadingVehicles: boolean;
  isLoadingDrivers: boolean;
  isLoadingClients: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BasicInfoStep({
  form,
  vehicles,
  drivers,
  fleetDrivers,
  busyResources,
  clients,
  isLoadingVehicles,
  isLoadingDrivers,
  isLoadingClients,
}: BasicInfoStepProps) {
  const { control } = form;
  const {
    hasModule: hasInternalStaffModule,
    isFetched: isInternalStaffEntitlementFetched,
  } = useInternalStaffEntitlement();
  const isInternalStaffPaywalled =
    isInternalStaffEntitlementFetched && !hasInternalStaffModule;

  const selectedVehicleId = form.watch("vehicleId");
  const selectedDriverId = form.watch("driverId");
  const watchedInternalStaff = form.watch("internalStaff");
  const internalStaffValues = useMemo(
    () =>
      watchedInternalStaff != null && watchedInternalStaff.length > 0
        ? watchedInternalStaff
        : EMPTY_INTERNAL_STAFF,
    [watchedInternalStaff],
  );

  const internalStaffFieldArray = useFieldArray({
    control: form.control,
    name: "internalStaff",
  });

  const [supportStaffPositionFilter, setSupportStaffPositionFilter] =
    useState<SupportStaffPositionFilter>("Conductor");
  const [draftEmployeeId, setDraftEmployeeId] = useState("");
  const [draftPaymentResponsible, setDraftPaymentResponsible] = useState(false);
  const [draftPaymentNotes, setDraftPaymentNotes] = useState("");
  const [addStaffError, setAddStaffError] = useState<string | null>(null);

  // Usado para precargar kilometraje inicial al seleccionar vehículo.
  const { data: vehicleResponse } = useVehicle(selectedVehicleId ?? "", {
    enabled: !!selectedVehicleId,
  });
  const vehicleDetail = extractVehicleDetail(vehicleResponse);
  const { data: employeesResult, isLoading: isLoadingEmployees } = useEmployees({
    page: 1,
    limit: 100,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const activeEmployees = useMemo(
    () => (employeesResult?.data ?? []).filter(isEmployeeActive),
    [employeesResult?.data],
  );

  const driversByEmployeeId = useMemo(() => {
    const map = new Map<string, DriverListItem>();
    for (const driver of fleetDrivers) {
      map.set(driver.employeeId, driver);
    }
    return map;
  }, [fleetDrivers]);

  const selectedDriverEmployeeId = useMemo(
    () =>
      drivers.find((driver) => driver.id === selectedDriverId)?.employeeId ??
      null,
    [drivers, selectedDriverId],
  );

  /** Empleados ya listados como equipo de apoyo (evita mismo conductor principal). */
  const supportStaffEmployeeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of internalStaffValues) {
      const id = row.employeeId?.trim();
      if (id) ids.add(id);
    }
    return ids;
  }, [internalStaffValues]);

  /** No listar como apoyo: ya en tabla + conductor principal actual. */
  const excludeEmployeeIdsForSupportDraft = useMemo(() => {
    const ids = new Set<string>(supportStaffEmployeeIds);
    const primaryEmp = selectedDriverEmployeeId?.trim();
    if (primaryEmp) ids.add(primaryEmp);
    return ids;
  }, [supportStaffEmployeeIds, selectedDriverEmployeeId]);

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECT: Precargar kilometraje cuando se selecciona un vehículo.
  // - Primera carga en edición: conserva startMileage persistido.
  // - Cambio de unidad o valor vacío: sugiere odómetro actual del vehículo.
  // ══════════════════════════════════════════════════════════════════════════
  const previousVehicleIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!vehicleDetail || !selectedVehicleId) return;
    form.setValue("vehicleCurrentMileage", vehicleDetail.currentMileage);
    const vehicleChanged =
      previousVehicleIdRef.current !== undefined &&
      previousVehicleIdRef.current !== selectedVehicleId;
    previousVehicleIdRef.current = selectedVehicleId;
    const currentStart = form.getValues("startMileage");
    if (currentStart == null || vehicleChanged) {
      form.setValue("startMileage", vehicleDetail.currentMileage);
    }
  }, [vehicleDetail, selectedVehicleId, form]);

  const draftEmployeeSelectValue =
    draftEmployeeId.trim() !== "" &&
    excludeEmployeeIdsForSupportDraft.has(draftEmployeeId.trim())
      ? ""
      : draftEmployeeId;

  const employeeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of activeEmployees) {
      m.set(e.id, e.fullName);
    }
    return m;
  }, [activeEmployees]);

  const supportStaffOptions = useMemo(
    () =>
      buildAssignableSupportStaffForTripWizard({
        employees: activeEmployees,
        driversByEmployeeId,
        busyResources,
        positionFilter: supportStaffPositionFilter,
        excludeEmployeeIds: excludeEmployeeIdsForSupportDraft,
      }),
    [
      activeEmployees,
      driversByEmployeeId,
      busyResources,
      supportStaffPositionFilter,
      excludeEmployeeIdsForSupportDraft,
    ],
  );

  const assignableSupportStaff = supportStaffOptions.filter(
    (item) => item.canBeAssigned,
  );
  const blockedSupportStaff = supportStaffOptions.filter(
    (item) => !item.canBeAssigned,
  );

  const selectedDraftSupportStaff = useMemo(
    () => supportStaffOptions.find((item) => item.employeeId === draftEmployeeId.trim()),
    [supportStaffOptions, draftEmployeeId],
  );

  const handleAddSupportStaff = useCallback(() => {
    const empId = draftEmployeeId.trim();
    if (!empId) {
      setAddStaffError(copy.error.selectEmployee);
      return;
    }
    const selected = selectedDraftSupportStaff;
    if (selected && !selected.canBeAssigned) {
      setAddStaffError(
        selected.blockReason
          ? shellValidation.supportStaffBlockedOnAdd(selected.blockReason)
          : copy.error.cannotAddEmployee,
      );
      return;
    }
    if (excludeEmployeeIdsForSupportDraft.has(empId)) {
      setDraftEmployeeId("");
      setAddStaffError(copy.error.employeeUnavailableForSupport);
      return;
    }
    if (
      internalStaffValues.some(
        (row) => row.employeeId && row.employeeId === empId,
      )
    ) {
      setAddStaffError(copy.error.alreadyInSupportStaff);
      return;
    }
    if (selectedDriverEmployeeId && empId === selectedDriverEmployeeId) {
      setAddStaffError(copy.error.driverInSupportStaff);
      return;
    }
    internalStaffFieldArray.append({
      employeeId: empId,
      internalRole: selected?.internalRole ?? "helper",
      isPaymentResponsible: draftPaymentResponsible,
      paymentNotes: draftPaymentNotes.trim() || "",
    });
    setDraftEmployeeId("");
    setDraftPaymentResponsible(false);
    setDraftPaymentNotes("");
    setAddStaffError(null);
    void form.trigger("internalStaff");
  }, [
    draftEmployeeId,
    draftPaymentResponsible,
    draftPaymentNotes,
    internalStaffValues,
    selectedDriverEmployeeId,
    selectedDraftSupportStaff,
    internalStaffFieldArray,
    form,
    excludeEmployeeIdsForSupportDraft,
  ]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* ASIGNACIONES                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" /> {copy.section.assignments}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{copy.hint.assignmentsScope}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <OriginBranchField form={form} />

          <TripAssignmentResourceFields
            form={form}
            vehicles={vehicles}
            drivers={drivers}
            isLoadingVehicles={isLoadingVehicles}
            isLoadingDrivers={isLoadingDrivers}
            excludedDriverEmployeeIds={supportStaffEmployeeIds}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="clientId"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="clientId"
                  label={
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={copy.label.client}
                      hintLabel={copy.hintLabel.client}
                      required
                      hint={<>{copy.hint.client}</>}
                    />
                  }
                  errorMessage={fieldState.error?.message}
                >
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value ?? ""}
                    disabled={isLoadingClients}
                  >
                    <SelectTrigger
                      id="clientId"
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "clientId",
                        fieldState.error?.message,
                      )}
                    >
                      {isLoadingClients ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                      )}
                      <SelectValue placeholder={copy.placeholder.selectClient} />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormFieldShell>
              )}
            />

            <Controller
              control={control}
              name="cfdiDocumentIntent"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="cfdiDocumentIntent"
                  label={
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={copy.label.cfdiDocumentIntent}
                      hintLabel={copy.hintLabel.cfdiDocumentIntent}
                      hint={<>{copy.hintLabel.cfdiDocumentIntentDetail}</>}
                    />
                  }
                  errorMessage={fieldState.error?.message}
                >
                  <Select
                    onValueChange={(value) =>
                      value && field.onChange(value as "ingreso" | "traslado")
                    }
                    value={field.value ?? "ingreso"}
                  >
                    <SelectTrigger
                      id="cfdiDocumentIntent"
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "cfdiDocumentIntent",
                        fieldState.error?.message,
                      )}
                    >
                      <SelectValue placeholder={copy.placeholder.cfdiDocumentIntent} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ingreso">{copy.cfdiIntent.ingreso}</SelectItem>
                      <SelectItem value="traslado">{copy.cfdiIntent.traslado}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormFieldShell>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* EQUIPO DE APOYO (INTERNO)                                          */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <SectionHeadingWithHint
              title={
                <>
                  <Users className="h-5 w-5 shrink-0" />
                  {copy.section.supportStaff}
                </>
              }
              titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
              hintLabel={copy.hintLabel.supportStaff}
              hint={<>{copy.hint.supportStaff}</>}
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isInternalStaffPaywalled ? (
            <DetailAlertCard severity="warning" title={copy.paywall.title}>
              <p className="text-sm text-muted-foreground">{copy.paywall.description}</p>
              <Button variant="link" className="mt-2 h-auto p-0" asChild>
                <Link to="/settings/subscription">{copy.paywall.cta}</Link>
              </Button>
            </DetailAlertCard>
          ) : null}

          <div
            className={
              isInternalStaffPaywalled
                ? "pointer-events-none space-y-4 opacity-60"
                : "space-y-4"
            }
          >
          <div className="rounded-md border p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="support-staff-position-filter">
                  {copy.label.supportStaffPositionFilter}
                </Label>
                <Select
                  value={supportStaffPositionFilter}
                  onValueChange={(v) => {
                    setAddStaffError(null);
                    setDraftEmployeeId("");
                    setSupportStaffPositionFilter(v as SupportStaffPositionFilter);
                  }}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger id="support-staff-position-filter">
                    <SelectValue placeholder={copy.placeholder.position} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_STAFF_POSITION_FILTER_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-staff-employee">{copy.label.supportStaffEmployee}</Label>
                <Select
                  value={draftEmployeeSelectValue}
                  onValueChange={(v) => {
                    setAddStaffError(null);
                    setDraftEmployeeId(v);
                  }}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger id="support-staff-employee">
                    {isLoadingEmployees ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    <SelectValue placeholder={copy.placeholder.selectEmployee} />
                  </SelectTrigger>
                  <SelectContent>
                    {supportStaffOptions.length === 0 && !isLoadingEmployees ? (
                      <SelectItem value="__none__" disabled>
                        {copy.state.noEmployeesForPosition}
                      </SelectItem>
                    ) : (
                      <>
                        {assignableSupportStaff.length > 0 && (
                          <SelectGroup>
                            <SelectLabel>{copy.state.available}</SelectLabel>
                            {assignableSupportStaff.map((item) => (
                              <SelectItem key={item.employeeId} value={item.employeeId}>
                                {item.fullName}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                        {blockedSupportStaff.length > 0 &&
                          assignableSupportStaff.length > 0 && (
                            <SelectSeparator />
                          )}
                        {blockedSupportStaff.length > 0 && (
                          <SelectGroup>
                            <SelectLabel className="flex items-center gap-1.5 text-warning">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {copy.state.notAssignable}
                            </SelectLabel>
                            {blockedSupportStaff.map((item) => (
                              <SelectItem
                                key={item.employeeId}
                                value={item.employeeId}
                                disabled
                                className="opacity-60"
                              >
                                <span className="flex items-center gap-2">
                                  {item.fullName}
                                  {item.blockReason ? (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {item.blockReason}
                                    </Badge>
                                  ) : null}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        )}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:gap-3">
              <div className="flex items-center gap-2 rounded-md border px-3 py-2 lg:shrink-0">
                <Checkbox
                  id="support-staff-payment"
                  checked={draftPaymentResponsible}
                  onCheckedChange={(checked) => {
                    setAddStaffError(null);
                    setDraftPaymentResponsible(Boolean(checked));
                  }}
                />
                <Label
                  htmlFor="support-staff-payment"
                  className="cursor-pointer font-normal"
                >
                  {copy.label.paymentResponsible}
                </Label>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="support-staff-notes">{copy.label.paymentNotes}</Label>
                <Input
                  id="support-staff-notes"
                  value={draftPaymentNotes}
                  onChange={(e) => {
                    setAddStaffError(null);
                    setDraftPaymentNotes(e.target.value);
                  }}
                  placeholder={copy.placeholder.paymentNotes}
                />
              </div>

              <Button
                type="button"
                className="lg:shrink-0"
                variant="secondary"
                onClick={handleAddSupportStaff}
              >
                <Plus className="mr-2 h-4 w-4" />
                {copy.action.add}
              </Button>
            </div>

            {addStaffError ? (
              <p className="text-xs text-destructive" role="alert">
                {addStaffError}
              </p>
            ) : null}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{copy.label.tableEmployee}</TableHead>
                  <TableHead className="w-[120px] whitespace-normal">
                    {copy.label.tablePaymentResponsible}
                  </TableHead>
                  <TableHead>{copy.label.tableNotes}</TableHead>
                  <TableHead className="w-[52px] text-right">
                    <span className="sr-only">{copy.action.tableRemoveSrOnly}</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {internalStaffFieldArray.fields.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="h-24 text-center text-muted-foreground"
                    >
                      {copy.state.emptySupportStaffTable}
                    </TableCell>
                  </TableRow>
                ) : (
                  internalStaffFieldArray.fields.map((field, index) => {
                    const row = internalStaffValues[index];
                    const empId = row?.employeeId ?? "";
                    const displayName =
                      (employeeNameById.get(empId) ?? empId) || copy.state.dash;
                    const notes = (row?.paymentNotes ?? "").trim();

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {displayName}
                        </TableCell>
                        <TableCell>
                          {row?.isPaymentResponsible ? copy.state.yes : copy.state.dash}
                        </TableCell>
                        <TableCell
                          className="max-w-[240px] truncate text-muted-foreground"
                          title={notes ? notes : undefined}
                        >
                          {notes || copy.state.dash}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              internalStaffFieldArray.remove(index);
                              void form.trigger("internalStaff");
                            }}
                            aria-label={copy.action.removeCollaborator}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PROGRAMACIÓN                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" /> {copy.section.scheduling}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Controller
              control={control}
              name="scheduledDeparture"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="scheduledDeparture"
                  label={copy.label.scheduledDeparture}
                  required
                  errorMessage={fieldState.error?.message}
                >
                  <DateTimeField
                    id="scheduledDeparture"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    {...scheduleFieldProps}
                    {...getFieldErrorAriaProps(
                      "scheduledDeparture",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />

            <Controller
              control={control}
              name="scheduledArrival"
              render={({ field, fieldState }) => (
                <FormFieldShell
                  fieldId="scheduledArrival"
                  label={
                    <SectionHeadingWithHint
                      noTitleWrap
                      title={copy.label.scheduledArrival}
                      hintLabel={copy.hintLabel.scheduledArrival}
                      hint={<>{copy.hint.scheduledArrival}</>}
                    />
                  }
                  errorMessage={fieldState.error?.message}
                >
                  <DateTimeField
                    id="scheduledArrival"
                    name={field.name}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    error={Boolean(fieldState.error)}
                    {...scheduleFieldProps}
                    {...getFieldErrorAriaProps(
                      "scheduledArrival",
                      fieldState.error?.message,
                    )}
                  />
                </FormFieldShell>
              )}
            />

            <Controller
              control={control}
              name="startMileage"
              render={({ field, fieldState }) => {
                const vehicleCurrentMileage = form.watch("vehicleCurrentMileage");
                return (
                  <FormFieldShell
                    fieldId="startMileage"
                    label={copy.label.startMileage}
                    required
                    errorMessage={fieldState.error?.message}
                    description={
                      vehicleCurrentMileage !== undefined
                        ? copy.format.currentMileage(vehicleCurrentMileage)
                        : undefined
                    }
                  >
                    <Input
                      id="startMileage"
                      type="number"
                      placeholder={copy.placeholder.startMileage}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(
                        "startMileage",
                        fieldState.error?.message,
                      )}
                    />
                  </FormFieldShell>
                );
              }}
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default BasicInfoStep;
