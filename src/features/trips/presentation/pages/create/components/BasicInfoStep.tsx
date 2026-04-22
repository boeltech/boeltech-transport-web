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

import { useEffect, useMemo } from "react";
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
import { Separator } from "@shared/ui/separator";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Truck,
  User,
  Users,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
  Globe,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";

import type { TripWizardFormValues } from "./validation";
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";

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

const INTERNAL_ROLE_LABELS = {
  secondary_driver: "Conductor adicional",
  helper: "Ayudante general",
} as const;

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
  const assignableDrivers = processedDrivers.filter((d) => d.canBeAssigned);
  const blockedDrivers = processedDrivers.filter((d) => !d.canBeAssigned);
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
  const driverEmployeeIds = useMemo(
    () => new Set(processedDrivers.map((driver) => driver.employeeId)),
    [processedDrivers],
  );

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
                      ) : (
                        <>
                          {assignableDrivers.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Disponibles</SelectLabel>
                              {assignableDrivers.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {d.displayName}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {blockedDrivers.length > 0 &&
                            assignableDrivers.length > 0 && <SelectSeparator />}
                          {blockedDrivers.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-yellow-600">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                No asignables
                              </SelectLabel>
                              {blockedDrivers.map((d) => (
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

            {/* Cliente */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente Principal *</FormLabel>
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
                  <FormDescription>
                    Requerido para facturacion del viaje.
                  </FormDescription>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" /> Equipo de Apoyo (Interno)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            No se incluye en Carta Porte. Solo para control interno y nomina.
          </p>

          {internalStaffFieldArray.fields.length === 0 ? (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              Agrega personal de apoyo cuando el viaje requiera conductor adicional
              o ayudante general.
            </div>
          ) : (
            <div className="space-y-3">
              {internalStaffFieldArray.fields.map((field, index) => {
                const currentRow = internalStaffValues[index];
                const selectedRole = currentRow?.internalRole;
                const selectedEmployeeId = currentRow?.employeeId;
                const duplicateByRole = internalStaffValues.some(
                  (item, itemIndex) =>
                    itemIndex !== index &&
                    item.employeeId &&
                    item.employeeId === selectedEmployeeId &&
                    item.internalRole === selectedRole,
                );
                const isPrincipalDriverConflict =
                  selectedRole === "secondary_driver" &&
                  !!selectedDriverEmployeeId &&
                  selectedEmployeeId === selectedDriverEmployeeId;
                const isSecondaryDriverWithoutProfile =
                  selectedRole === "secondary_driver" &&
                  !!selectedEmployeeId &&
                  !driverEmployeeIds.has(selectedEmployeeId);

                return (
                  <div key={field.id} className="rounded-md border p-3 space-y-3">
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                      <FormField
                        control={form.control}
                        name={`internalStaff.${index}.employeeId`}
                        render={({ field: employeeField }) => (
                          <FormItem>
                            <FormLabel>Empleado</FormLabel>
                            <Select
                              value={employeeField.value ?? ""}
                              onValueChange={employeeField.onChange}
                              disabled={isLoadingEmployees}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  {isLoadingEmployees ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                  )}
                                  <SelectValue placeholder="Seleccionar empleado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {activeEmployees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id}>
                                    {employee.fullName}
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
                        name={`internalStaff.${index}.internalRole`}
                        render={({ field: roleField }) => (
                          <FormItem>
                            <FormLabel>Rol interno</FormLabel>
                            <Select
                              value={roleField.value ?? ""}
                              onValueChange={roleField.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Seleccionar rol" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.entries(INTERNAL_ROLE_LABELS).map(
                                  ([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => internalStaffFieldArray.remove(index)}
                          aria-label="Quitar colaborador"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[220px_1fr]">
                      <FormField
                        control={form.control}
                        name={`internalStaff.${index}.isPaymentResponsible`}
                        render={({ field: paymentField }) => (
                          <FormItem className="flex items-center gap-2 rounded-md border px-3 py-2">
                            <FormControl>
                              <Checkbox
                                checked={!!paymentField.value}
                                onCheckedChange={(checked) =>
                                  paymentField.onChange(Boolean(checked))
                                }
                              />
                            </FormControl>
                            <div className="space-y-0.5">
                              <FormLabel className="text-sm">
                                Responsable de pago
                              </FormLabel>
                              <FormDescription className="text-xs">
                                Marca si este colaborador requiere control
                                especial.
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`internalStaff.${index}.paymentNotes`}
                        render={({ field: notesField }) => (
                          <FormItem>
                            <FormLabel>Notas de pago (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...notesField}
                                value={notesField.value ?? ""}
                                placeholder="Ej. pago por apoyo en turno nocturno"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {(duplicateByRole ||
                      isPrincipalDriverConflict ||
                      isSecondaryDriverWithoutProfile) && (
                      <p className="text-xs text-destructive">
                        {isPrincipalDriverConflict
                          ? "El conductor principal no puede asignarse como conductor adicional."
                          : isSecondaryDriverWithoutProfile
                            ? "Este empleado no tiene perfil de conductor activo."
                            : "Este empleado ya tiene el mismo rol en el viaje."}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              internalStaffFieldArray.append({
                employeeId: "",
                internalRole: "helper",
                isPaymentResponsible: false,
                paymentNotes: "",
              })
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar colaborador
          </Button>
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
                  <FormLabel>Llegada Estimada</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormDescription>
                    Sincronizado con la parada de destino del paso Ruta. Si se
                    modifica en cualquiera de los dos puntos, se actualiza el otro.
                  </FormDescription>
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

          <Separator />

          {/* Transporte Internacional */}
          <FormField
            control={form.control}
            name="transpInternac"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Transporte Internacional
                  </FormLabel>
                  <FormDescription>
                    Marcar si el viaje cruza fronteras internacionales
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

    </div>
  );
}

export default BasicInfoStep;
