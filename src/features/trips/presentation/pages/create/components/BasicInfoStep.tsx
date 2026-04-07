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
import { Separator } from "@shared/ui/separator";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Truck,
  User,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
  Globe,
} from "lucide-react";
import { Badge } from "@shared/ui/badge";

import type { TripWizardFormValues } from "./validation";
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";

// Hook para obtener detalle del vehículo (datos de Carta Porte para indicadores)
import { useVehicle } from "@features/vehicles/application";

// ============================================================================
// TYPES
// ============================================================================

interface AssignableDriverItem extends DriverListItem {
  canBeAssigned: boolean;
  blockReason?: string;
  displayName: string;
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

  // ══════════════════════════════════════════════════════════════════════════
  // VEHICLE DETAIL QUERY — para mostrar indicador de datos Carta Porte
  // ══════════════════════════════════════════════════════════════════════════
  const { data: vehicle } = useVehicle(selectedVehicleId ?? "", {
    enabled: !!selectedVehicleId,
  });

  const vehicleDetail = vehicle?.data;

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

  // ── Obtener vehículo de la lista (para datos básicos) ─────────────────────
  // const selectedVehicleFromList = useMemo(
  //   () => vehicles.find((v) => v.id === selectedVehicleId),
  //   [vehicles, selectedVehicleId],
  // );

  // ── Obtener conductor seleccionado ────────────────────────────────────────
  const selectedDriver = useMemo(
    () => drivers.find((d) => d.id === selectedDriverId),
    [drivers, selectedDriverId],
  );

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
                  <FormLabel>Cliente Principal</FormLabel>
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
                      <SelectItem value="no-client">Sin cliente</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.legalName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Opcional. Puede asignar clientes por carga en el paso 3.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* INDICADOR CARTA PORTE — datos derivados del vehículo/conductor      */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {(vehicleDetail || selectedDriver) && (
        <Card className="border-blue-500/30">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5" />
              Los datos de <strong>Autotransporte</strong> y{" "}
              <strong>Figura de Transporte</strong> para la Carta Porte 3.1 se
              derivarán automáticamente del vehículo y conductor seleccionados
              al generar el XML del CFDI.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              {vehicleDetail && (
                <div className="space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                    Vehículo
                  </p>
                  <p>
                    {vehicleDetail.brand} {vehicleDetail.model}{" "}
                    {vehicleDetail.year} — {vehicleDetail.licensePlate}
                  </p>
                  {vehicleDetail.cartaPorte.satTipoPermisoCode && (
                    <p className="text-muted-foreground">
                      Permiso: {vehicleDetail.cartaPorte.satTipoPermisoCode} ·{" "}
                      {vehicleDetail.cartaPorte.satConfigAutotransporteCode}
                    </p>
                  )}
                  {vehicleDetail.cartaPorte.insuranceCompany && (
                    <p className="text-muted-foreground">
                      Seguro RC: {vehicleDetail.cartaPorte.insuranceCompany}
                    </p>
                  )}
                </div>
              )}
              {selectedDriver && (
                <div className="space-y-1">
                  <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
                    Conductor
                  </p>
                  <p>{getDriverDisplayName(selectedDriver)}</p>
                  {selectedDriver.licenseNumber && (
                    <p className="text-muted-foreground">
                      Licencia: {selectedDriver.licenseNumber} (
                      {selectedDriver.licenseType})
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BasicInfoStep;
