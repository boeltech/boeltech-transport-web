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

import { useCallback, useEffect, useMemo, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@shared/ui/form";
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
  User,
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
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";
import { SectionHeadingWithHint } from "@shared/ui/hint-icon";

// Hook para obtener detalle del vehículo (datos de Carta Porte para indicadores)
import { useVehicle } from "@features/vehicles/application";
import { useEmployees } from "@features/employees";
import type { EmployeeListItem } from "@features/employees";

// ============================================================================
// TYPES
// ============================================================================

interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
}

interface VehicleMileageSource {
  currentMileage: number;
}

/** Valores alineados a `POSITION_OPTIONS` en empleados (catálogo local). */
const SUPPORT_STAFF_POSITION_FILTER_OPTIONS = [
  { value: "Conductor", label: "Conductores" },
  { value: "Ayudante general", label: "Ayudantes generales" },
] as const;

type SupportStaffPositionFilterValue =
  (typeof SUPPORT_STAFF_POSITION_FILTER_OPTIONS)[number]["value"];

function employeePositionMatchesFilter(
  employee: EmployeeListItem,
  filter: SupportStaffPositionFilterValue,
): boolean {
  const pos = (employee.position ?? "").trim().toLowerCase();
  return pos === filter.trim().toLowerCase();
}

/**
 * Opciones del combo Empleado en equipo de apoyo: filtro por puesto y exclusión de
 * empleados ya en la tabla o ya asignados como conductor principal.
 */
function buildSupportStaffEmployeeOptions(
  allActive: EmployeeListItem[],
  filter: SupportStaffPositionFilterValue,
  excludeEmployeeIds: ReadonlySet<string>,
): EmployeeListItem[] {
  return allActive
    .filter((e) => employeePositionMatchesFilter(e, filter))
    .filter((e) => !excludeEmployeeIds.has(e.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "es"));
}

function isEmployeeActive(employee: EmployeeListItem): boolean {
  return employee.isActive && employee.status === "active";
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateDriverAssignability(
  driver: DriverListItem,
): Pick<AssignableDriverItem, "canBeAssigned" | "blockReason"> {
  if (driver.status !== "available") {
    const statusReasons: Record<string, string> = {
      on_trip: "En viaje",
      resting: "Descansando",
      on_vacation: "De vacaciones",
      on_leave: "Con permiso",
      terminated: "Dado de baja",
    };
    return {
      canBeAssigned: false,
      blockReason: statusReasons[driver.status] || driver.status,
    };
  }

  if (driver.isLicenseExpired) {
    return { canBeAssigned: false, blockReason: "Licencia vencida" };
  }

  if (isExpiringSoon(driver.licenseExpiry, 30)) {
    return { canBeAssigned: true, blockReason: undefined };
  }

  return { canBeAssigned: true, blockReason: undefined };
}

function getDriverDisplayName(driver: DriverListItem): string {
  if (driver.employee.fullName) return driver.employee.fullName;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverAny = driver as any;
  if (driverAny.employee?.firstName) {
    const { firstName, lastName, secondLastName } = driverAny.employee;
    return [firstName, lastName, secondLastName].filter(Boolean).join(" ");
  }

  // if (driver.firstName) {
  //   return [driver.firstName, driver.lastName, driver.secondLastName]
  //     .filter(Boolean)
  //     .join(" ");
  // }

  return "Sin nombre";
}

function processDriversForAssignment(
  drivers: DriverListItem[],
): AssignableDriverItem[] {
  return drivers.map((driver) => {
    const { canBeAssigned, blockReason } = calculateDriverAssignability(driver);
    return {
      ...driver,
      canBeAssigned,
      blockReason,
      displayName: getDriverDisplayName(driver),
    };
  });
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
  drivers: DriverListItem[];
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
  clients,
  isLoadingVehicles,
  isLoadingDrivers,
  isLoadingClients,
}: BasicInfoStepProps) {
  const selectedVehicleId = form.watch("vehicleId");
  const selectedDriverId = form.watch("driverId");
  const internalStaffValues = form.watch("internalStaff") ?? [];

  const internalStaffFieldArray = useFieldArray({
    control: form.control,
    name: "internalStaff",
  });

  const [supportStaffPositionFilter, setSupportStaffPositionFilter] =
    useState<SupportStaffPositionFilterValue>("Conductor");
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

  // ── Procesar vehículos ────────────────────────────────────────────────────
  const assignableVehicles = vehicles.filter((v) => v.canBeAssigned);
  const blockedVehicles = vehicles.filter((v) => !v.canBeAssigned);

  // ── Procesar conductores ──────────────────────────────────────────────────
  const processedDrivers = useMemo(
    () => processDriversForAssignment(drivers),
    [drivers],
  );
  const activeEmployees = useMemo(
    () => (employeesResult?.data ?? []).filter(isEmployeeActive),
    [employeesResult?.data],
  );

  const selectedDriverEmployeeId = useMemo(
    () =>
      processedDrivers.find((driver) => driver.id === selectedDriverId)
        ?.employeeId ?? null,
    [processedDrivers, selectedDriverId],
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

  const { assignableDriversForConductorSelect, blockedDriversForConductorSelect } =
    useMemo(() => {
      const keepInDriverSelect = (d: AssignableDriverItem) => {
        if (d.id === selectedDriverId) return true;
        return !supportStaffEmployeeIds.has(d.employeeId);
      };
      const assignable = processedDrivers.filter(
        (d) => d.canBeAssigned && keepInDriverSelect(d),
      );
      const blocked = processedDrivers.filter(
        (d) => !d.canBeAssigned && keepInDriverSelect(d),
      );
      return {
        assignableDriversForConductorSelect: assignable,
        blockedDriversForConductorSelect: blocked,
      };
    }, [processedDrivers, supportStaffEmployeeIds, selectedDriverId]);

  /** No listar como apoyo: ya en tabla + conductor principal actual. */
  const excludeEmployeeIdsForSupportDraft = useMemo(() => {
    const ids = new Set<string>(supportStaffEmployeeIds);
    const primaryEmp = selectedDriverEmployeeId?.trim();
    if (primaryEmp) ids.add(primaryEmp);
    return ids;
  }, [supportStaffEmployeeIds, selectedDriverEmployeeId]);

  // ── Obtener vehículo de la lista (para datos básicos) ─────────────────────
  // const selectedVehicleFromList = useMemo(
  //   () => vehicles.find((v) => v.id === selectedVehicleId),
  //   [vehicles, selectedVehicleId],
  // );

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECT: Precargar kilometraje cuando se selecciona un vehículo
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (vehicleDetail) {
      form.setValue("vehicleCurrentMileage", vehicleDetail.currentMileage);
      form.setValue("startMileage", vehicleDetail.currentMileage);
    }
  }, [vehicleDetail, form]);

  useEffect(() => {
    if (
      draftEmployeeId &&
      excludeEmployeeIdsForSupportDraft.has(draftEmployeeId)
    ) {
      setDraftEmployeeId("");
      setAddStaffError(null);
    }
  }, [draftEmployeeId, excludeEmployeeIdsForSupportDraft]);

  const employeeNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const e of activeEmployees) {
      m.set(e.id, e.fullName);
    }
    return m;
  }, [activeEmployees]);

  const draftEmployeeOptions = useMemo(
    () =>
      buildSupportStaffEmployeeOptions(
        activeEmployees,
        supportStaffPositionFilter,
        excludeEmployeeIdsForSupportDraft,
      ),
    [
      activeEmployees,
      supportStaffPositionFilter,
      excludeEmployeeIdsForSupportDraft,
    ],
  );

  const handleAddSupportStaff = useCallback(() => {
    const empId = draftEmployeeId.trim();
    if (!empId) {
      setAddStaffError("Selecciona un empleado.");
      return;
    }
    if (
      internalStaffValues.some(
        (row) => row.employeeId && row.employeeId === empId,
      )
    ) {
      setAddStaffError("Este empleado ya está en el equipo de apoyo.");
      return;
    }
    if (selectedDriverEmployeeId && empId === selectedDriverEmployeeId) {
      setAddStaffError(
        "El conductor principal no puede figurar en el equipo de apoyo.",
      );
      return;
    }
    internalStaffFieldArray.append({
      employeeId: empId,
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
    internalStaffFieldArray,
    form,
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
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="h-5 w-5" /> Asignaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Vehículo */}
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehículo *</FormLabel>
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value ?? ""}
                    disabled={isLoadingVehicles}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingVehicles ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <SelectValue placeholder="Seleccionar vehículo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.length === 0 && !isLoadingVehicles ? (
                        <SelectItem value="no-vehicles" disabled>
                          No hay vehículos disponibles
                        </SelectItem>
                      ) : (
                        <>
                          {assignableVehicles.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Disponibles</SelectLabel>
                              {assignableVehicles.map((v) => (
                                <SelectItem key={v.id} value={v.id}>
                                  {v.unitNumber} — {v.licensePlate}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {blockedVehicles.length > 0 &&
                            assignableVehicles.length > 0 && (
                              <SelectSeparator />
                            )}
                          {blockedVehicles.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-yellow-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                No asignables
                              </SelectLabel>
                              {blockedVehicles.map((v) => (
                                <SelectItem
                                  key={v.id}
                                  value={v.id}
                                  disabled
                                  className="opacity-60"
                                >
                                  <span className="flex items-center gap-2">
                                    {v.unitNumber} — {v.licensePlate}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {v.blockReason}
                                    </Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Conductor */}
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conductor *</FormLabel>
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value ?? ""}
                    disabled={isLoadingDrivers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingDrivers ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <User className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <SelectValue placeholder="Seleccionar conductor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {drivers.length === 0 && !isLoadingDrivers ? (
                        <SelectItem value="no-drivers" disabled>
                          No hay conductores disponibles
                        </SelectItem>
                      ) : assignableDriversForConductorSelect.length === 0 &&
                        blockedDriversForConductorSelect.length === 0 ? (
                        <SelectItem value="no-drivers-available" disabled>
                          No hay conductores fuera del equipo de apoyo. Quita
                          colaboradores de apoyo para poder asignarlos como
                          conductor principal.
                        </SelectItem>
                      ) : (
                        <>
                          {assignableDriversForConductorSelect.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Disponibles</SelectLabel>
                              {assignableDriversForConductorSelect.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.displayName}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {blockedDriversForConductorSelect.length > 0 &&
                            assignableDriversForConductorSelect.length > 0 && (
                              <SelectSeparator />
                            )}
                          {blockedDriversForConductorSelect.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-yellow-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                No asignables
                              </SelectLabel>
                              {blockedDriversForConductorSelect.map((d) => (
                                <SelectItem
                                  key={d.id}
                                  value={d.id}
                                  disabled
                                  className="opacity-60"
                                >
                                  <span className="flex items-center gap-2">
                                    {d.displayName}
                                    <Badge
                                      variant="outline"
                                      className="text-[10px]"
                                    >
                                      {d.blockReason}
                                    </Badge>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Cliente que contrata */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <SectionHeadingWithHint
                    noTitleWrap
                    title={<FormLabel>Cliente que contrata *</FormLabel>}
                    hintLabel="Cliente que contrata"
                    hint={
                      <>
                        Quién contrata el servicio de transporte. Quién entrega y quién recibe en cada ubicación se
                        captura por parada en el paso Ruta.
                      </>
                    }
                  />
                  <Select
                    onValueChange={(value) => value && field.onChange(value)}
                    value={field.value ?? ""}
                    disabled={isLoadingClients}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingClients ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                        )}
                        <SelectValue placeholder="Seleccionar cliente" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cfdiDocumentIntent"
              render={({ field }) => (
                <FormItem className="sm:col-span-3">
                  <SectionHeadingWithHint
                    noTitleWrap
                    title={<FormLabel>Tipo de comprobante del viaje</FormLabel>}
                    hintLabel="Tipo de comprobante del viaje"
                    hint={
                      <>
                        Indica si el servicio se documentará principalmente como ingreso (factura de servicio) o como
                        traslado (movimiento entre ubicaciones). Ajusta etiquetas en Ruta y paradas; el timbrado validará
                        los datos finos.
                      </>
                    }
                  />
                  <Select
                    onValueChange={(value) =>
                      value && field.onChange(value as "ingreso" | "traslado")
                    }
                    value={field.value ?? "ingreso"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de comprobante" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ingreso">Ingreso — factura de servicio</SelectItem>
                      <SelectItem value="traslado">Traslado — movimiento entre ubicaciones</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
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
                  Equipo de Apoyo
                </>
              }
              titleClassName="inline-flex items-center gap-2 text-lg font-semibold tracking-tight"
              hintLabel="Equipo de apoyo interno"
              hint={
                <>
                  Personal que acompaña la operación y puede marcarse como responsable de pago de honorarios o viáticos.
                  No sustituye al conductor principal del viaje.
                </>
              }
            />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          

          <div className="rounded-md border p-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="support-staff-position-filter">
                  Filtrar empleados por puesto
                </Label>
                <Select
                  value={supportStaffPositionFilter}
                  onValueChange={(v) => {
                    setAddStaffError(null);
                    setSupportStaffPositionFilter(
                      v as SupportStaffPositionFilterValue,
                    );
                  }}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger id="support-staff-position-filter">
                    <SelectValue placeholder="Puesto" />
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
                <Label htmlFor="support-staff-employee">Empleado</Label>
                <Select
                  value={draftEmployeeId}
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
                    <SelectValue placeholder="Seleccionar empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {draftEmployeeOptions.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No hay empleados activos con este puesto
                      </SelectItem>
                    ) : (
                      draftEmployeeOptions.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.fullName}
                        </SelectItem>
                      ))
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
                  Responsable de pago
                </Label>
              </div>

              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="support-staff-notes">Notas (opcional)</Label>
                <Input
                  id="support-staff-notes"
                  value={draftPaymentNotes}
                  onChange={(e) => {
                    setAddStaffError(null);
                    setDraftPaymentNotes(e.target.value);
                  }}
                  placeholder="Ej. pago por apoyo en turno nocturno"
                />
              </div>

              <Button
                type="button"
                className="lg:shrink-0"
                variant="secondary"
                onClick={handleAddSupportStaff}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar
              </Button>
            </div>

            {addStaffError && (
              <p className="text-sm text-destructive" role="alert">
                {addStaffError}
              </p>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empleado</TableHead>
                  <TableHead className="w-[120px] whitespace-normal">
                    Resp. pago
                  </TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-[52px] text-right">
                    <span className="sr-only">Quitar</span>
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
                      Completa el formulario superior y pulsa Agregar para
                      listar colaboradores aquí.
                    </TableCell>
                  </TableRow>
                ) : (
                  internalStaffFieldArray.fields.map((field, index) => {
                    const row = internalStaffValues[index];
                    const empId = row?.employeeId ?? "";
                    const displayName =
                      (employeeNameById.get(empId) ?? empId) || "—";
                    const notes = (row?.paymentNotes ?? "").trim();

                    return (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">
                          {displayName}
                        </TableCell>
                        <TableCell>
                          {row?.isPaymentResponsible ? "Sí" : "—"}
                        </TableCell>
                        <TableCell
                          className="max-w-[240px] truncate text-muted-foreground"
                          title={notes ? notes : undefined}
                        >
                          {notes || "—"}
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
                            aria-label="Quitar colaborador"
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
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* PROGRAMACIÓN                                                        */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Programación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={form.control}
              name="scheduledDeparture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Salida Programada *</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="scheduledArrival"
              render={({ field }) => (
                <FormItem>
                  <SectionHeadingWithHint
                    noTitleWrap
                    title={<FormLabel>Llegada estimada</FormLabel>}
                    hintLabel="Llegada estimada"
                    hint={
                      <>
                        Sincronizado con la parada de destino del paso Ruta. Si se modifica en cualquiera de los dos
                        puntos, se actualiza el otro.
                      </>
                    }
                  />
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="startMileage"
              render={({ field }) => {
                const vehicleCurrentMileage = form.watch(
                  "vehicleCurrentMileage",
                );
                return (
                  <FormItem>
                    <FormLabel>Kilometraje Inicial</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                      />
                    </FormControl>
                    {vehicleCurrentMileage !== undefined && (
                      <FormDescription>
                        Kilometraje actual:{" "}
                        {vehicleCurrentMileage.toLocaleString()} km
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
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
