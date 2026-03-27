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
import { Badge } from "@shared/ui/badge";
import { Separator } from "@shared/ui/separator";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Truck,
  User,
  Building2,
  Calendar,
  Loader2,
  AlertTriangle,
  FileText,
  Shield,
  IdCard,
  Globe,
} from "lucide-react";

// Catálogos SAT
import {
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
  TipoFiguraSelect,
} from "@features/catalogs";

// Hook para obtener detalle del vehículo
import { useVehicle } from "@features/vehicles/application";

import type { TripWizardFormValues } from "./validation";
import type { DriverListItem } from "@features/drivers/domain";
import type { AssignableVehicleItem } from "@features/vehicles/domain";
import { isExpiringSoon } from "@shared/utils/dateUtils";

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
  const isInternational = form.watch("transpInternac");

  // ══════════════════════════════════════════════════════════════════════════
  // VEHICLE DETAIL QUERY
  // React Query con enabled: se activa solo cuando hay vehículo seleccionado
  // ══════════════════════════════════════════════════════════════════════════
  const { data: vehicle, isLoading: isLoadingVehicleDetail } = useVehicle(
    selectedVehicleId ?? "",
    {
      enabled: !!selectedVehicleId,
    },
  );

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
  // EFFECT: Sincronizar datos del vehículo al formulario
  // Se ejecuta cuando vehicleDetail cambia (React Query ya tiene los datos)
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (vehicleDetail) {
      // Datos básicos del vehículo
      form.setValue("vehicleCurrentMileage", vehicleDetail.currentMileage);
      form.setValue("startMileage", vehicleDetail.currentMileage);

      // ── Autotransporte: Identificación Vehicular ──────────────────────────
      form.setValue("autotransporte.placaVm", vehicleDetail.licensePlate);
      form.setValue("autotransporte.anioModelo", vehicleDetail.year);

      // ── Autotransporte: Permiso SCT ───────────────────────────────────────
      if (vehicleDetail.documentation.sctPermitNumber) {
        form.setValue(
          "autotransporte.numPermisoSct",
          vehicleDetail.documentation.sctPermitNumber,
        );
      }

      // ── Autotransporte: Seguro ────────────────────────────────────────────
      // Si el vehículo tiene póliza de seguro, precargar en responsabilidad civil
      if (vehicleDetail.documentation.insurancePolicy) {
        form.setValue(
          "autotransporte.polizaRespCivil",
          vehicleDetail.documentation.insurancePolicy,
        );
      }

      // NOTA: Los siguientes campos requieren que la tabla vehicles
      // tenga columnas adicionales para Carta Porte. Si no existen,
      // los valores serán undefined y no se precargarán:
      //
      // - satConfigCode → autotransporte.configVehicular
      // - tipoPermisoSct → autotransporte.tipoPermisoSct
      // - aseguraRespCivil → autotransporte.aseguraRespCivil
      // - aseguraCarga → autotransporte.aseguraCarga
      // - polizaCarga → autotransporte.polizaCarga

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const vehicleData = vehicleDetail as any;

      // Configuración vehicular SAT (si existe en el vehículo)
      if (vehicleData.cartaPorte.satConfigAutotransporteCode) {
        form.setValue(
          "autotransporte.configVehicular",
          vehicleData.cartaPorte.satConfigAutotransporteCode,
        );
      }

      // Tipo de permiso SCT (si existe en el vehículo)
      if (vehicleData.cartaPorte.satTipoPermisoCode) {
        form.setValue(
          "autotransporte.tipoPermisoSct",
          vehicleData.cartaPorte.satTipoPermisoCode,
        );
      }

      // Aseguradora de responsabilidad civil (si existe)
      if (vehicleData.cartaPorte.insuranceCompany) {
        form.setValue(
          "autotransporte.aseguraRespCivil",
          vehicleData.cartaPorte.insuranceCompany,
        );
      }

      // Seguro de carga (si existe)
      if (vehicleData.aseguraCarga) {
        form.setValue("autotransporte.aseguraCarga", vehicleData.aseguraCarga);
      }
      if (vehicleData.polizaCarga) {
        form.setValue("autotransporte.polizaCarga", vehicleData.polizaCarga);
      }
    }
  }, [vehicleDetail, form]);

  // ══════════════════════════════════════════════════════════════════════════
  // EFFECT: Sincronizar datos del conductor al formulario
  // ══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    if (selectedDriverId && drivers.length > 0) {
      const driver = drivers.find((d) => d.id === selectedDriverId);
      if (driver) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const driverData = driver as any;

        // Tipo de figura por defecto: 01 (Operador)
        if (!form.getValues("figuraTransporte.tipoFigura")) {
          form.setValue("figuraTransporte.tipoFigura", "01");
        }

        // Nombre del operador
        form.setValue(
          "figuraTransporte.nombreFigura",
          getDriverDisplayName(driver),
        );

        // RFC del empleado
        if (driverData.employee?.rfc) {
          form.setValue("figuraTransporte.rfcFigura", driverData.employee.rfc);
        }

        // CURP del empleado
        if (driverData.employee?.curp) {
          form.setValue("figuraTransporte.curp", driverData.employee.curp);
        }

        // Número de licencia
        if (driver.licenseNumber) {
          form.setValue("figuraTransporte.numLicencia", driver.licenseNumber);
        }
      }
    }
  }, [selectedDriverId, drivers, form]);

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
      {/* AUTOTRANSPORTE FEDERAL — CARTA PORTE 3.1                            */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Autotransporte Federal
            <Badge variant="outline" className="ml-2 text-xs">
              Carta Porte 3.1
            </Badge>
            {isLoadingVehicleDetail && (
              <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Indicador de precarga */}
          {selectedVehicleId && isLoadingVehicleDetail && (
            <div className="rounded-lg bg-muted/50 p-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando datos del vehículo...
            </div>
          )}

          {/* Info del vehículo seleccionado */}
          {vehicleDetail && !isLoadingVehicleDetail && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Datos precargados del vehículo seleccionado:
              </p>
              <div className="grid gap-2 sm:grid-cols-4 text-sm">
                <div>
                  <span className="font-medium">Unidad:</span>{" "}
                  {vehicleDetail.unitNumber}
                </div>
                <div>
                  <span className="font-medium">Placa:</span>{" "}
                  {vehicleDetail.licensePlate}
                </div>
                <div>
                  <span className="font-medium">Año:</span> {vehicleDetail.year}
                </div>
                <div>
                  <span className="font-medium">Marca/Modelo:</span>{" "}
                  {vehicleDetail.brand} {vehicleDetail.model}
                </div>
              </div>
            </div>
          )}

          {/* Permiso SCT */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Permiso SCT
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="autotransporte.tipoPermisoSct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Permiso *</FormLabel>
                    <FormControl>
                      <TipoPermisoSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar tipo de permiso"
                      />
                    </FormControl>
                    <FormDescription>
                      Catálogo SAT c_TipoPermiso
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autotransporte.numPermisoSct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Permiso *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: TPAF01-2024-12345"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      {vehicleDetail?.documentation?.sctPermitNumber
                        ? "Precargado del vehículo"
                        : "Número otorgado por SCT"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Identificación Vehicular */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Truck className="h-4 w-4" /> Identificación Vehicular
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="autotransporte.configVehicular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuración Vehicular *</FormLabel>
                    <FormControl>
                      <ConfigAutotransporteSelect
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar configuración"
                      />
                    </FormControl>
                    <FormDescription>
                      Catálogo SAT c_ConfigAutotransporte
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autotransporte.placaVm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa del Vehículo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-123-A"
                        {...field}
                        value={field.value ?? ""}
                        disabled={!!vehicleDetail}
                        className={vehicleDetail ? "bg-muted" : ""}
                      />
                    </FormControl>
                    {vehicleDetail && (
                      <FormDescription>
                        Tomado del vehículo seleccionado
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autotransporte.anioModelo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año Modelo *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="2024"
                        min={1990}
                        max={new Date().getFullYear() + 1}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? Number(e.target.value) : undefined,
                          )
                        }
                        disabled={!!vehicleDetail}
                        className={vehicleDetail ? "bg-muted" : ""}
                      />
                    </FormControl>
                    {vehicleDetail && (
                      <FormDescription>
                        Tomado del vehículo seleccionado
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Seguros */}
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Shield className="h-4 w-4" /> Seguros (Obligatorios para Carta
              Porte)
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="autotransporte.aseguraRespCivil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora Resp. Civil *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nombre de la aseguradora"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autotransporte.polizaRespCivil"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Póliza Resp. Civil *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número de póliza"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    {vehicleDetail?.documentation?.insurancePolicy && (
                      <FormDescription>Precargado del vehículo</FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <FormField
                control={form.control}
                name="autotransporte.aseguraCarga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora de Carga</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Opcional - seguro de mercancías"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Requerido si el valor de la carga &gt; $0
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autotransporte.polizaCarga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Póliza de Carga</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número de póliza de carga"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* FIGURA DE TRANSPORTE (OPERADOR) — CARTA PORTE 3.1                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IdCard className="h-5 w-5" /> Figura de Transporte
            <Badge variant="outline" className="ml-2 text-xs">
              Operador
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info del conductor seleccionado */}
          {selectedDriver && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground mb-2">
                Datos obtenidos del conductor seleccionado:
              </p>
              <div className="grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <span className="font-medium">Nombre:</span>{" "}
                  {getDriverDisplayName(selectedDriver)}
                </div>
                <div>
                  <span className="font-medium">Licencia:</span>{" "}
                  {selectedDriver.licenseNumber}
                </div>
                <div>
                  <span className="font-medium">Tipo:</span>{" "}
                  {selectedDriver.licenseType}
                </div>
              </div>
            </div>
          )}

          {!selectedDriver && (
            <div className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">
              <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                Seleccione un conductor para ver los datos de la Figura de
                Transporte
              </p>
            </div>
          )}

          {selectedDriver && (
            <>
              {/* Tipo de Figura y Licencia */}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="figuraTransporte.tipoFigura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Figura *</FormLabel>
                      <FormControl>
                        <TipoFiguraSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          placeholder="Seleccionar tipo"
                        />
                      </FormControl>
                      <FormDescription>
                        Catálogo SAT c_TipoFigura (01 = Operador)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="figuraTransporte.numLicencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Licencia *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={
                            field.value ?? selectedDriver?.licenseNumber ?? ""
                          }
                          disabled={!!selectedDriver?.licenseNumber}
                          className={
                            selectedDriver?.licenseNumber ? "bg-muted" : ""
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Tomado del conductor seleccionado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Datos Fiscales */}
              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="figuraTransporte.rfcFigura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="XXXX000000XXX"
                          {...field}
                          value={field.value ?? ""}
                          className="uppercase"
                          maxLength={13}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="figuraTransporte.curp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CURP</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="18 caracteres"
                          {...field}
                          value={field.value ?? ""}
                          className="uppercase"
                          maxLength={18}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="figuraTransporte.nombreFigura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Completo *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ""}
                          disabled={!!selectedDriver}
                          className={selectedDriver ? "bg-muted" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Datos Internacionales (solo si transpInternac = true) */}
              {isInternational && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Globe className="h-4 w-4" /> Datos para Transporte
                      Internacional
                    </h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="figuraTransporte.residenciaFiscalFigura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>País de Residencia Fiscal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: MEX, USA"
                                {...field}
                                value={field.value ?? ""}
                                className="uppercase"
                                maxLength={3}
                              />
                            </FormControl>
                            <FormDescription>
                              Código ISO 3166-1 alpha-3
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="figuraTransporte.numRegIdTribFigura"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ID Tributario Extranjero</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Tax ID del país de residencia"
                                {...field}
                                value={field.value ?? ""}
                              />
                            </FormControl>
                            <FormDescription>
                              Solo si el operador es extranjero
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default BasicInfoStep;
