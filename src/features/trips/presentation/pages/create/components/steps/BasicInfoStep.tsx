/**
 * BasicInfoStep - Paso 1 del Wizard
 * Información básica: Asignaciones y Programación
 *
 * ACTUALIZADO: Select de conductores con misma UX que vehículos
 * - Muestra todos los conductores activos
 * - Los no asignables aparecen deshabilitados con razón del bloqueo
 * - Calcula canBeAssigned y blockReason en frontend
 */

import { useEffect, useMemo } from "react";
import type { UseFormReturn } from "react-hook-form";
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
import {
  Truck,
  User,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import type { TripWizardFormValues } from "../validation";
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Driver con información de asignabilidad calculada
 */
interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calcula si un conductor puede ser asignado a un viaje
 * y la razón por la que no puede (si aplica)
 *
 * Reglas de negocio:
 * 1. Debe estar activo (isActive = true)
 * 2. Debe estar disponible (status = "available")
 * 3. Su licencia NO debe estar vencida
 */
function calculateDriverAssignability(
  driver: DriverListItem,
): Pick<AssignableDriverItem, "canBeAssigned" | "blockReason"> {
  // Verificar si está activo
  // if (!driver.isActive) {
  //   return {
  //     canBeAssigned: false,
  //     blockReason: "Inactivo",
  //   };
  // }
  // Backend manda por default is_active = true

  // Verificar status
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

  // Verificar licencia vencida
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // const licenseExpiry =
  //   driver.licenseExpiry instanceof Date
  //     ? driver.licenseExpiry
  //     : new Date(driver.licenseExpiry);

  // if (licenseExpiry < today) {
  if (driver.isLicenseExpired) {
    return {
      canBeAssigned: false,
      blockReason: "Licencia vencida",
    };
  }

  // Verificar si la licencia está próxima a vencer (30 días)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // if (licenseExpiry <= thirtyDaysFromNow) {
  if (driver.licenseExpiration <= thirtyDaysFromNow) {
    // Permitir asignar pero con advertencia (no bloqueamos)
    return {
      canBeAssigned: true,
      blockReason: undefined,
    };
  }

  // Puede ser asignado
  return {
    canBeAssigned: true,
    blockReason: undefined,
  };
}

/**
 * Obtiene el nombre completo del conductor
 * Soporta tanto la estructura plana (fullName) como la anidada (employee.firstName)
 */
function getDriverDisplayName(driver: DriverListItem): string {
  // Si tiene fullName directo, usarlo
  if (driver.fullName) {
    return driver.fullName;
  }

  // Si tiene estructura anidada con employee
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const driverAny = driver as any;
  if (driverAny.employee?.firstName) {
    const { firstName, lastName, secondLastName } = driverAny.employee;
    return [firstName, lastName, secondLastName].filter(Boolean).join(" ");
  }

  // Fallback a firstName/lastName directos
  if (driver.firstName) {
    return [driver.firstName, driver.lastName, driver.secondLastName]
      .filter(Boolean)
      .join(" ");
  }

  return "Sin nombre";
}

/**
 * Procesa la lista de conductores y calcula asignabilidad
 */
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

  // ── Procesar vehículos ────────────────────────────────────────────────────
  const assignableVehicles = vehicles.filter((v) => v.canBeAssigned);
  const blockedVehicles = vehicles.filter((v) => !v.canBeAssigned);

  // ── Procesar conductores (calcular asignabilidad) ─────────────────────────
  const processedDrivers = useMemo(
    () => processDriversForAssignment(drivers),
    [drivers],
  );

  const assignableDrivers = processedDrivers.filter((d) => d.canBeAssigned);
  const blockedDrivers = processedDrivers.filter((d) => !d.canBeAssigned);

  // ── Efecto para precargar kilometraje ─────────────────────────────────────
  useEffect(() => {
    if (selectedVehicleId && vehicles.length > 0) {
      const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);
      if (selectedVehicle) {
        form.setValue("vehicleCurrentMileage", selectedVehicle.currentMileage);
        form.setValue("startMileage", selectedVehicle.currentMileage);
      }
    }
  }, [selectedVehicleId, vehicles, form]);

  return (
    <div className="space-y-6">
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* ASIGNACIONES                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Asignaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* ── Vehículo ─────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
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
                          {/* Vehículos asignables */}
                          {assignableVehicles.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Disponibles</SelectLabel>
                              {assignableVehicles.map((vehicle) => (
                                <SelectItem key={vehicle.id} value={vehicle.id}>
                                  {vehicle.unitNumber} — {vehicle.licensePlate}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}

                          {/* Separador si hay bloqueados */}
                          {blockedVehicles.length > 0 &&
                            assignableVehicles.length > 0 && (
                              <SelectSeparator />
                            )}

                          {/* Vehículos bloqueados */}
                          {blockedVehicles.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                No asignables
                              </SelectLabel>
                              {blockedVehicles.map((vehicle) => (
                                <SelectItem
                                  key={vehicle.id}
                                  value={vehicle.id}
                                  disabled
                                  className="opacity-60"
                                >
                                  <span className="flex items-center gap-2">
                                    {vehicle.unitNumber} —{" "}
                                    {vehicle.licensePlate}
                                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400">
                                      {vehicle.blockReason}
                                    </span>
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

            {/* ── Conductor ────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="driverId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conductor *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
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
                          {/* Conductores asignables */}
                          {assignableDrivers.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>Disponibles</SelectLabel>
                              {assignableDrivers.map((driver) => (
                                <SelectItem key={driver.id} value={driver.id}>
                                  {driver.displayName}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}

                          {/* Separador si hay bloqueados */}
                          {blockedDrivers.length > 0 &&
                            assignableDrivers.length > 0 && <SelectSeparator />}

                          {/* Conductores bloqueados */}
                          {blockedDrivers.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-500">
                                <AlertTriangle className="h-3.5 w-3.5" />
                                No asignables
                              </SelectLabel>
                              {blockedDrivers.map((driver) => (
                                <SelectItem
                                  key={driver.id}
                                  value={driver.id}
                                  disabled
                                  className="opacity-60"
                                >
                                  <span className="flex items-center gap-2">
                                    {driver.displayName}
                                    <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400">
                                      {driver.blockReason}
                                    </span>
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

            {/* ── Cliente ──────────────────────────────────────────────────── */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cliente Principal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
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
                      <SelectItem value="no-client">Sin cliente</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* PROGRAMACIÓN                                                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
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
                    <Input type="datetime-local" {...field} />
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
                        Kilometraje actual del vehículo:{" "}
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
