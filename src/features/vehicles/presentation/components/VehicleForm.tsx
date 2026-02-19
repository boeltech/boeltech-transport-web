/**
 * VehicleForm Component
 *
 * Formulario de creación/edición de vehículos.
 * Usa Zod para validación y React Hook Form para manejo de estado.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@shared/ui/form";
import { Input } from "@shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Loader2 } from "lucide-react";
import { createVehicleSchema, type CreateVehicleFormData } from "../validation";
import type { Vehicle, VehicleTypeValue } from "@features/vehicles/domain";
import { VEHICLE_TYPE_LABELS } from "@features/vehicles/domain";

// ============================================================================
// TYPES
// ============================================================================

interface VehicleFormProps {
  /** Existing vehicle for edit mode */
  vehicle?: Vehicle;
  /** Callback on form submit */
  onSubmit: (data: CreateVehicleFormData) => void;
  /** Mutation loading state */
  isSubmitting: boolean;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convierte Date | null a string ISO date (YYYY-MM-DD) para input[type=date]
 */
function dateToInputValue(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().split("T")[0];
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VehicleForm({
  vehicle,
  onSubmit,
  isSubmitting,
}: VehicleFormProps) {
  const navigate = useNavigate();
  const isEditMode = !!vehicle;

  const form = useForm<CreateVehicleFormData>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: vehicle
      ? {
          unitNumber: vehicle.unitNumber,
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin || "",
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year,
          type: vehicle.type,
          color: vehicle.color || "",
          loadCapacity: vehicle.capacities.loadCapacity ?? undefined,
          volumeCapacity: vehicle.capacities.volumeCapacity ?? undefined,
          fuelTankCapacity: vehicle.capacities.fuelTankCapacity ?? undefined,
          expectedFuelEfficiency:
            vehicle.capacities.expectedFuelEfficiency ?? undefined,
          currentMileage: vehicle.currentMileage,
          insurancePolicy: vehicle.documentation.insurancePolicy || "",
          insuranceExpiry: dateToInputValue(
            vehicle.documentation.insuranceExpiry,
          ),
          sctPermitNumber: vehicle.documentation.sctPermitNumber || "",
          sctPermitExpiry: dateToInputValue(
            vehicle.documentation.sctPermitExpiry,
          ),
        }
      : {
          unitNumber: "",
          licensePlate: "",
          vin: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          type: "truck" as VehicleTypeValue,
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
        },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* ── Identification ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Identificación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Unidad *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: U-045"
                      disabled={isEditMode}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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

            <FormField
              control={form.control}
              name="vin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VIN (Número de Serie)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Vehicle Identification Number"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Vehicle Info ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información del Vehículo</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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

            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(
                        Object.entries(VEHICLE_TYPE_LABELS) as [
                          VehicleTypeValue,
                          string,
                        ][]
                      ).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
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
          </CardContent>
        </Card>

        {/* ── Capacities & Mileage ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Capacidades y Kilometraje</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expectedFuelEfficiency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rendimiento (Km/L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined,
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="currentMileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kilometraje Actual</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Documentation ── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Documentación</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="insurancePolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Póliza de Seguro</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de póliza" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="insuranceExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vigencia del Seguro</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sctPermitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Permiso SCT</FormLabel>
                  <FormControl>
                    <Input placeholder="Permiso SCT" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sctPermitExpiry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vigencia del Permiso SCT</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* ── Actions ── */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/vehicles")}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Actualizar Vehículo" : "Crear Vehículo"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
