/**
 * VehicleForm
 *
 * Formulario reutilizable para crear/editar vehículos.
 * Incluye campos de Carta Porte 3.1.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Loader2, Info } from "lucide-react";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { Alert, AlertDescription } from "@shared/ui/alert";

import { createVehicleSchema, type CreateVehicleFormData } from "../validation";
import {
  VEHICLE_TYPE_LABELS,
  VehicleType,
  type Vehicle,
} from "@features/vehicles/domain";

// Importar componentes de catálogo
import {
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
} from "@features/catalogs";

// ============================================================================
// TYPES
// ============================================================================

interface VehicleFormProps {
  /** Vehículo existente (para modo edición) */
  vehicle?: Vehicle;
  /** Callback al enviar el formulario */
  onSubmit: (data: CreateVehicleFormData) => void;
  /** Estado de carga del submit */
  isSubmitting?: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte una entidad Vehicle del dominio a datos del formulario.
 * Maneja la conversión de Value Objects a campos planos.
 */
function formDataFromVehicle(vehicle: Vehicle): CreateVehicleFormData {
  return {
    // Identification
    unitNumber: vehicle.unitNumber,
    licensePlate: vehicle.licensePlate,
    vin: vehicle.vin ?? "",

    // Characteristics
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year,
    type: vehicle.type,
    color: vehicle.color ?? "",

    // Capacities (from Value Object)
    loadCapacity: vehicle.capacities.loadCapacity ?? undefined,
    volumeCapacity: vehicle.capacities.volumeCapacity ?? undefined,
    fuelTankCapacity: vehicle.capacities.fuelTankCapacity ?? undefined,
    expectedFuelEfficiency:
      vehicle.capacities.expectedFuelEfficiency ?? undefined,

    // Mileage
    currentMileage: vehicle.currentMileage,

    // Documentation (from Value Object)
    insurancePolicy: vehicle.documentation.insurancePolicy ?? "",
    insuranceExpiry: vehicle.documentation.insuranceExpiry ?? "",
    sctPermitNumber: vehicle.documentation.sctPermitNumber ?? "",
    sctPermitExpiry: vehicle.documentation.sctPermitExpiry ?? "",

    // Carta Porte 3.1 (from Value Object)
    satTipoPermisoCode: vehicle.cartaPorte.satTipoPermisoCode ?? "",
    satConfigAutotransporteCode:
      vehicle.cartaPorte.satConfigAutotransporteCode ?? "",
    insuranceCompany: vehicle.cartaPorte.insuranceCompany ?? "",
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultValues: CreateVehicleFormData = {
  unitNumber: "",
  licensePlate: "",
  vin: "",
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  type: "truck",
  color: "",
  loadCapacity: undefined,
  volumeCapacity: undefined,
  fuelTankCapacity: undefined,
  expectedFuelEfficiency: undefined,
  currentMileage: 0,
  insurancePolicy: "",
  insuranceExpiry: "",
  sctPermitNumber: "",
  sctPermitExpiry: "",
  // Carta Porte 3.1
  satTipoPermisoCode: "",
  satConfigAutotransporteCode: "",
  insuranceCompany: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleForm({
  vehicle,
  onSubmit,
  isSubmitting = false,
}: VehicleFormProps) {
  const isEditMode = !!vehicle;

  const form = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: vehicle ? formDataFromVehicle(vehicle) : defaultValues,
  });

  const handleSubmit = form.handleSubmit((data) => {
    onSubmit(data);
  });

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* IDENTIFICACIÓN */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Identificación</CardTitle>
            <CardDescription>
              Datos básicos de identificación del vehículo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Número de Unidad */}
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Unidad *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: U-001"
                      {...field}
                      disabled={isEditMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Placa */}
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: ABC-123-A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* VIN */}
            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN / Serie</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número de serie del vehículo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARACTERÍSTICAS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
            <CardDescription>Especificaciones del vehículo</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Marca */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Kenworth" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Modelo */}
            <FormField
              control={form.control}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: T680" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Año */}
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1900}
                      max={new Date().getFullYear() + 1}
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      if (value) field.onChange(value);
                    }}
                    value={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(VehicleType).map(([key, value]) => (
                        <SelectItem key={value} value={value}>
                          {VEHICLE_TYPE_LABELS[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Color */}
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Blanco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Kilometraje */}
            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Kilometraje Actual{" "}
                    <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value !== "" ? Number(e.target.value) : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CAPACIDADES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Capacidades</CardTitle>
            <CardDescription>
              Capacidad de carga y consumo de combustible
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Capacidad de Carga */}
            <FormField
              control={form.control}
              name="loadCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad de Carga (ton)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacidad de Volumen */}
            <FormField
              control={form.control}
              name="volumeCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidad de Volumen (m³)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacidad del Tanque */}
            <FormField
              control={form.control}
              name="fuelTankCapacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanque de Combustible (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rendimiento Esperado */}
            <FormField
              control={form.control}
              name="expectedFuelEfficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rendimiento (km/L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      placeholder="0.00"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        // Mantener string vacío o número - Zod lo transformará
                        field.onChange(val === "" ? null : parseFloat(val));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DOCUMENTACIÓN Y SEGUROS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle>Documentación y Seguros</CardTitle>
            <CardDescription>
              Información de pólizas de seguro y permisos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Seguro */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Aseguradora */}
              <FormField
                control={form.control}
                name="insuranceCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Qualitas, GNP, HDI" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nombre de la compañía aseguradora
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Póliza de Seguro */}
              <FormField
                control={form.control}
                name="insurancePolicy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Póliza</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de póliza" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vencimiento Seguro */}
              <FormField
                control={form.control}
                name="insuranceExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del Seguro</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Permiso SCT */}
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Tipo de Permiso SCT (Catálogo SAT) */}
              <FormField
                control={form.control}
                name="satTipoPermisoCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Permiso SCT</FormLabel>
                    <FormControl>
                      <TipoPermisoSelect
                        value={field.value ?? ""}
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

              {/* Número de Permiso SCT */}
              <FormField
                control={form.control}
                name="sctPermitNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Permiso SCT</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de permiso" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Vencimiento Permiso SCT */}
              <FormField
                control={form.control}
                name="sctPermitExpiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vencimiento del Permiso</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARTA PORTE 3.1 */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Carta Porte 3.1
              <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-1 rounded">
                SAT
              </span>
            </CardTitle>
            <CardDescription>
              Datos requeridos para el complemento Carta Porte del CFDI
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Estos campos se utilizarán automáticamente al generar la Carta
                Porte en los viajes asignados a este vehículo.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Configuración Vehicular SAT */}
              <FormField
                control={form.control}
                name="satConfigAutotransporteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuración Vehicular</FormLabel>
                    <FormControl>
                      <ConfigAutotransporteSelect
                        value={field.value ?? ""}
                        onValueChange={field.onChange}
                        placeholder="Seleccionar configuración"
                      />
                    </FormControl>
                    <FormDescription>
                      Catálogo SAT c_ConfigAutotransporte (ej: C2, T3S2R4)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SUBMIT */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-end gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditMode ? "Guardar Cambios" : "Crear Vehículo"}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
