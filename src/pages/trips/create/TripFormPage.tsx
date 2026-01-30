/**
 * TripFormPage
 * FSD: Pages Layer - Composition
 *
 * Formulario para crear y editar viajes.
 * Utiliza hooks de features para cargar vehículos, conductores y clientes.
 *
 * Ubicación: src/pages/trips/create/TripFormPage.tsx
 */

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import {
  Form,
  FormControl,
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
import { Skeleton } from "@shared/ui/skeleton";

// Feature hooks
import { useTrip, useCreateTrip, useUpdateTrip } from "@/features/trips";
import { useAvailableVehicles } from "@features/vehicles/application";
import { useAvailableDrivers } from "@features/drivers/application";
import { useActiveClients } from "@features/clients/application";

import { useToast } from "@shared/hooks";
import {
  ArrowLeft,
  Save,
  RefreshCw,
  Truck,
  User,
  Building2,
  Package,
  MapPin,
  Loader2,
} from "lucide-react";
import {
  isoToLocalDateTime,
  localDateTimeToISO,
} from "@shared/utils/dateHelpers";

// ============================================================================
// FORM SCHEMA
// ============================================================================

const tripFormSchema = z
  .object({
    // Asignaciones
    vehicleId: z.string().min(1, "Seleccione un vehículo"),
    driverId: z.string().min(1, "Seleccione un conductor"),
    clientId: z.string().optional(),

    // Programación
    scheduledDeparture: z.string().min(1, "Fecha de salida requerida"),
    scheduledArrival: z.string().optional(),
    startMileage: z.coerce.number().min(0).optional(),

    // Origen (requerido)
    originAddress: z.string().min(1, "Dirección de origen requerida"),
    originCity: z.string().min(1, "Ciudad de origen requerida"),
    originState: z.string().optional(),

    // Destino (requerido)
    destinationAddress: z.string().min(1, "Dirección de destino requerida"),
    destinationCity: z.string().min(1, "Ciudad de destino requerida"),
    destinationState: z.string().optional(),

    // Carga
    cargoDescription: z.string().max(500).optional(),
    cargoWeight: z.coerce.number().min(0).optional(),
    cargoVolume: z.coerce.number().min(0).optional(),
    cargoUnits: z.coerce.number().min(0).optional(),
    cargoValue: z.coerce.number().min(0).optional(),

    // Costos
    baseRate: z.coerce.number().min(0).optional(),

    // Notas
    notes: z.string().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.scheduledArrival && data.scheduledDeparture) {
        return (
          new Date(data.scheduledArrival) > new Date(data.scheduledDeparture)
        );
      }
      return true;
    },
    {
      message: "La fecha de llegada debe ser posterior a la de salida",
      path: ["scheduledArrival"],
    },
  );

type TripFormValues = z.infer<typeof tripFormSchema>;

// ============================================================================
// DEFAULT VALUES
// ============================================================================

const defaultFormValues: TripFormValues = {
  vehicleId: "",
  driverId: "",
  clientId: "",
  scheduledDeparture: "",
  scheduledArrival: "",
  startMileage: undefined,
  originAddress: "",
  originCity: "",
  originState: "",
  destinationAddress: "",
  destinationCity: "",
  destinationState: "",
  cargoDescription: "",
  cargoWeight: undefined,
  cargoVolume: undefined,
  cargoUnits: undefined,
  cargoValue: undefined,
  baseRate: undefined,
  notes: "",
};

// ============================================================================
// COMPONENT
// ============================================================================

function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!id;

  // ============================================
  // Queries para cargar datos de los selects
  // ============================================

  const { data: vehicles = [], isLoading: isLoadingVehicles } =
    useAvailableVehicles();

  const { data: drivers = [], isLoading: isLoadingDrivers } =
    useAvailableDrivers();

  const { data: clients = [], isLoading: isLoadingClients } =
    useActiveClients();

  // ============================================
  // Query para viaje existente (modo edición)
  // ============================================

  const { data: existingTrip, isLoading: isLoadingTrip } = useTrip(id || "", {
    enabled: isEditMode,
  });

  // ============================================
  // Form setup
  // ============================================

  const form = useForm<TripFormValues>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: defaultFormValues,
  });

  // Actualizar form cuando se carga un viaje existente
  useEffect(() => {
    if (existingTrip && isEditMode) {
      form.reset({
        vehicleId: existingTrip.vehicleId,
        driverId: existingTrip.driverId,
        clientId: existingTrip.clientId || "",
        scheduledDeparture: isoToLocalDateTime(existingTrip.scheduledDeparture),
        scheduledArrival: existingTrip.scheduledArrival
          ? isoToLocalDateTime(existingTrip.scheduledArrival)
          : "",
        startMileage: existingTrip.mileage.start ?? undefined,
        originAddress: existingTrip.originAddress,
        originCity: existingTrip.originCity,
        originState: existingTrip.originState || "",
        destinationAddress: existingTrip.destinationAddress,
        destinationCity: existingTrip.destinationCity,
        destinationState: existingTrip.destinationState || "",
        cargoDescription: existingTrip.cargo.description || "",
        cargoWeight: existingTrip.cargo.weight ?? undefined,
        cargoVolume: existingTrip.cargo.volume ?? undefined,
        cargoUnits: existingTrip.cargo.units ?? undefined,
        cargoValue: existingTrip.cargo.value ?? undefined,
        baseRate: existingTrip.costs.baseRate ?? undefined,
        notes: existingTrip.notes || "",
      });
    }
  }, [existingTrip, isEditMode, form]);

  // ============================================
  // Mutations
  // ============================================

  const createMutation = useCreateTrip({
    onSuccess: (response) => {
      toast({
        title: "Viaje creado",
        description: `Código: ${response.tripCode}`,
        variant: "success",
      });
      navigate(`/trips/${response.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al crear viaje",
        description: error.message,
        variant: "error",
      });
    },
  });

  const updateMutation = useUpdateTrip({
    onSuccess: () => {
      toast({ title: "Viaje actualizado", variant: "success" });
      navigate(`/trips/${id}`);
    },
    onError: (error) => {
      toast({
        title: "Error al actualizar",
        description: error.message,
        variant: "error",
      });
    },
  });

  // ============================================
  // Submit handler
  // ============================================

  const onSubmit = (data: TripFormValues) => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const preparedData = {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      clientId: data.clientId || undefined,
      scheduledDeparture: localDateTimeToISO(data.scheduledDeparture),
      scheduledArrival: data.scheduledArrival
        ? localDateTimeToISO(data.scheduledArrival)
        : undefined,
      startMileage: data.startMileage,
      originAddress: data.originAddress,
      originCity: data.originCity,
      originState: data.originState || undefined,
      destinationAddress: data.destinationAddress,
      destinationCity: data.destinationCity,
      destinationState: data.destinationState || undefined,
      cargoDescription: data.cargoDescription || undefined,
      cargoWeight: data.cargoWeight,
      cargoVolume: data.cargoVolume,
      cargoUnits: data.cargoUnits,
      cargoValue: data.cargoValue,
      baseRate: data.baseRate,
      notes: data.notes || undefined,
    };

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: preparedData });
    } else {
      createMutation.mutate(preparedData);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingTrip) {
    return <TripFormSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditMode ? "Editar Viaje" : "Nuevo Viaje"}
          </h1>
          <p className="text-muted-foreground">
            {isEditMode
              ? `Editando ${existingTrip?.tripCode}`
              : "Complete los datos del viaje"}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Asignaciones */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Asignaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {/* Vehículo */}
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
                            vehicles.map((vehicle) => (
                              <SelectItem key={vehicle.id} value={vehicle.id}>
                                {vehicle.unitNumber} - {vehicle.licensePlate}
                              </SelectItem>
                            ))
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
                            drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                {driver.fullName}
                              </SelectItem>
                            ))
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
                      <FormLabel>Cliente</FormLabel>
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

          {/* Programación */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Programación</CardTitle>
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
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kilometraje Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Origen */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" /> Origen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="originAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Calle, número, colonia..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="originCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="originState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Destino */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" /> Destino
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="destinationAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dirección *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Calle, número, colonia..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="destinationCity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ciudad" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="destinationState"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="Estado" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Información de Carga */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" /> Información de Carga
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="cargoDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describa la carga..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <FormField
                  control={form.control}
                  name="cargoWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
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
                  name="cargoVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Volumen (m³)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
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
                  name="cargoUnits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidades</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
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
                  name="cargoValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Costos y Notas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Costos y Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="baseRate"
                render={({ field }) => (
                  <FormItem className="sm:w-1/3">
                    <FormLabel>Tarifa Base ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
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
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              {isEditMode ? "Guardar Cambios" : "Crear Viaje"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function TripFormSkeleton() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default TripFormPage;
