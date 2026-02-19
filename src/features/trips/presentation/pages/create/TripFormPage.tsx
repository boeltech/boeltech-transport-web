/**
 * TripFormPage - Wizard para crear viajes
 * FSD: Pages Layer - Composition
 *
 * Formulario tipo wizard para crear y editar viajes.
 * Incluye pasos para: información básica, ruta, cargas, costos y resumen.
 *
 * Ubicación: src/pages/trips/create/TripFormPage.tsx
 */

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/ui/button";
import { Card, CardContent } from "@shared/ui/card";
import { Form } from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import { AlertWithIcon } from "@shared/ui/alert";

// Feature hooks
import {
  useTrip,
  useCreateTrip,
  useUpdateTrip,
  StopType,
} from "@/features/trips";
import { useAssignableVehicles } from "@features/vehicles/application";
import { useAssignableDrivers } from "@features/drivers/application";
import { useActiveClients } from "@features/clients/application";

import { useToast } from "@shared/hooks";
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle } from "lucide-react";
import {
  isoToLocalDateTime,
  localDateTimeToISO,
} from "@shared/utils/dateHelpers";

// Wizard components
import {
  WizardSteps,
  tripWizardFormSchema,
  WIZARD_STEPS,
  defaultWizardFormValues,
  BasicInfoStep,
  RouteStep,
  CargoStep,
  CostsStep,
  SummaryStep,
} from "./components";
import type { TripWizardFormValues } from "./components";

// ============================================================================
// COMPONENT
// ============================================================================

export function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!id;

  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});

  // ============================================
  // Queries para cargar datos de los selects
  // ============================================
  const { data: vehicles = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles();

  const { data: drivers = [], isLoading: isLoadingDrivers } =
    useAssignableDrivers();

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

  const form = useForm<TripWizardFormValues>({
    resolver: zodResolver(tripWizardFormSchema) as never,
    defaultValues: defaultWizardFormValues,
    mode: "onChange",
  });

  // Field arrays para stops, cargos y expenses
  const stopsFieldArray = useFieldArray({
    control: form.control,
    name: "stops",
  });

  const cargosFieldArray = useFieldArray({
    control: form.control,
    name: "cargos",
  });

  const expensesFieldArray = useFieldArray({
    control: form.control,
    name: "expenses",
  });

  // Actualizar form cuando se carga un viaje existente
  useEffect(() => {
    if (existingTrip && isEditMode) {
      const mappedStops = (existingTrip.stops || []).map((stop) => ({
        id: stop.id,
        sequenceOrder: stop.sequenceOrder,
        stopType: stop.stopType as
          | "origin"
          | "pickup"
          | "delivery"
          | "waypoint"
          | "destination",
        address: stop.address,
        city: stop.city,
        state: stop.state || undefined,
        postalCode: stop.postalCode || undefined,
        latitude: stop.latitude || undefined,
        longitude: stop.longitude || undefined,
        locationName: stop.locationName || undefined,
        contactName: stop.contactName || undefined,
        contactPhone: stop.contactPhone || undefined,
        estimatedArrival: stop.estimatedArrival
          ? isoToLocalDateTime(stop.estimatedArrival)
          : undefined,
        notes: stop.notes || undefined,
      }));

      // Mapear cargos del backend con movements
      const mappedCargos = (existingTrip.cargos || []).map((cargo) => ({
        id: cargo.id,
        clientId: cargo.clientId,
        description: cargo.description,
        productType: cargo.productType || undefined,
        weight: cargo.weight || undefined,
        volume: cargo.volume || undefined,
        units: cargo.units || undefined,
        declaredValue: cargo.declaredValue || undefined,
        rate: cargo.rate,
        currency: cargo.currency,
        movements: cargo.movements || [],
        notes: cargo.notes || undefined,
        specialInstructions: cargo.specialInstructions || undefined,
      }));

      const mappedExpenses = (existingTrip.expenses || []).map((expense) => ({
        id: expense.id,
        category: expense.category as
          | "fuel"
          | "tolls"
          | "driver_allowance"
          | "lodging"
          | "loading_unloading"
          | "parking"
          | "maintenance"
          | "insurance"
          | "permits"
          | "other",
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        expenseDate: expense.expenseDate
          ? isoToLocalDateTime(expense.expenseDate)
          : undefined,
        location: expense.location || undefined,
        vendorName: expense.vendorName || undefined,
        notes: expense.notes || undefined,
        isEstimated: true,
      }));

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
        stops: mappedStops,
        cargos: mappedCargos,
        expenses: mappedExpenses,
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
        title: "Viaje creado exitosamente",
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
  // Validación por paso
  // ============================================

  /**
   * Valida el paso de cargas:
   *
   * 1. Cada parada pickup debe tener al menos una carga.
   * 2. Si una carga tiene deliveries asignados:
   *    a. Suma de peso en deliveries NO debe exceder el peso de la carga.
   *    b. Suma de unidades en deliveries NO debe exceder las unidades de la carga.
   *    c. Suma de peso/unidades debe ser IGUAL al total (asignación completa).
   * 3. Si una carga NO tiene deliveries asignados:
   *    a. Solo se permite si existe exactamente 1 parada con operación de descarga
   *       (destino implícito). Se notifica al usuario.
   *    b. Si hay más de 1 parada de descarga → bloquea (ambigüedad).
   *
   * Retorna:
   * - isValid: si se permite avanzar
   * - message: mensaje de error (cuando isValid = false)
   * - warning: mensaje de advertencia (cuando isValid = true pero hay destino implícito)
   */
  const validateCargoStep = useCallback((): {
    isValid: boolean;
    message?: string;
    warning?: string;
  } => {
    const currentStops = form.getValues("stops");
    const currentCargos = form.getValues("cargos");

    // ------------------------------------------------------------------
    // 1. Verificar que existan paradas pickup
    // ------------------------------------------------------------------

    const pickupStopIndices = currentStops
      .map((stop, index) => ({
        index,
        hasPickup: stop.stopType.includes(StopType.PICKUP),
        label: stop.locationName || stop.address || `Parada #${index + 1}`,
      }))
      .filter((s) => s.hasPickup);

    if (pickupStopIndices.length === 0) {
      return {
        isValid: false,
        message:
          "No hay paradas con operación de carga. Regrese al paso de Ruta para configurarlas.",
      };
    }

    // ------------------------------------------------------------------
    // 2. Verificar que cada parada pickup tenga al menos una carga
    // ------------------------------------------------------------------

    const stopsWithoutCargos = pickupStopIndices.filter((stop) => {
      const cargosForStop = currentCargos.filter((cargo) =>
        cargo.movements?.some(
          (m) => m.movementType === "pickup" && m.stopIndex === stop.index,
        ),
      );
      return cargosForStop.length === 0;
    });

    if (stopsWithoutCargos.length > 0) {
      const stopLabels = stopsWithoutCargos
        .map((s) => `Parada #${s.index + 1} (${s.label})`)
        .join(", ");
      return {
        isValid: false,
        message: `Las siguientes paradas de carga no tienen mercancías registradas: ${stopLabels}`,
      };
    }

    // ------------------------------------------------------------------
    // 3. Contar paradas con operación de descarga (delivery)
    // ------------------------------------------------------------------

    const deliveryStopCount = currentStops.filter((stop) =>
      stop.stopType.includes(StopType.DELIVERY),
    ).length;

    // ------------------------------------------------------------------
    // 4. Validar movimientos de entrega por cada carga
    // ------------------------------------------------------------------

    const cargosWithoutDeliveries: string[] = [];
    const errors: string[] = [];

    for (const cargo of currentCargos) {
      const movements = cargo.movements || [];
      const deliveries = movements.filter((m) => m.movementType === "delivery");

      if (deliveries.length === 0) {
        // Carga sin entregas asignadas → verificar destino implícito
        cargosWithoutDeliveries.push(cargo.description);
        continue;
      }

      // Validar concordancia de peso (si la carga tiene peso definido)
      if (cargo.weight != null && cargo.weight > 0) {
        const totalDeliveryWeight = deliveries.reduce(
          (sum, d) => sum + (d.weight || 0),
          0,
        );

        if (totalDeliveryWeight > cargo.weight) {
          errors.push(
            `"${cargo.description}": el peso total de entregas (${totalDeliveryWeight} kg) excede el peso de la carga (${cargo.weight} kg)`,
          );
        } else if (totalDeliveryWeight < cargo.weight) {
          const pendingWeight = cargo.weight - totalDeliveryWeight;
          errors.push(
            `"${cargo.description}": faltan ${pendingWeight} kg por asignar a puntos de entrega (${totalDeliveryWeight}/${cargo.weight} kg)`,
          );
        }
      }

      // Validar concordancia de unidades (si la carga tiene unidades definidas)
      if (cargo.units != null && cargo.units > 0) {
        const totalDeliveryUnits = deliveries.reduce(
          (sum, d) => sum + (d.units || 0),
          0,
        );

        if (totalDeliveryUnits > cargo.units) {
          errors.push(
            `"${cargo.description}": las unidades de entregas (${totalDeliveryUnits}) exceden las unidades de la carga (${cargo.units})`,
          );
        } else if (totalDeliveryUnits < cargo.units) {
          const pendingUnits = cargo.units - totalDeliveryUnits;
          errors.push(
            `"${cargo.description}": faltan ${pendingUnits} unidades por asignar a puntos de entrega (${totalDeliveryUnits}/${cargo.units})`,
          );
        }
      }
    }

    // ------------------------------------------------------------------
    // 5. Evaluar errores de concordancia
    // ------------------------------------------------------------------

    if (errors.length > 0) {
      return {
        isValid: false,
        message: errors.join(". "),
      };
    }

    // ------------------------------------------------------------------
    // 6. Evaluar cargas sin deliveries asignados
    // ------------------------------------------------------------------

    if (cargosWithoutDeliveries.length > 0) {
      if (deliveryStopCount === 1) {
        // Exactamente 1 parada de descarga → destino implícito, permitir con aviso
        const cargoNames = cargosWithoutDeliveries.join(", ");
        return {
          isValid: true,
          warning:
            cargosWithoutDeliveries.length === 1
              ? `La carga "${cargoNames}" no tiene punto de entrega asignado. Se entregará en la única parada de descarga del viaje.`
              : `Las cargas ${cargoNames} no tienen punto de entrega asignado. Se entregarán en la única parada de descarga del viaje.`,
        };
      }

      // Más de 1 parada de descarga → ambigüedad, bloquear
      const cargoNames = cargosWithoutDeliveries
        .map((name) => `"${name}"`)
        .join(", ");
      return {
        isValid: false,
        message: `${cargosWithoutDeliveries.length === 1 ? "La carga" : "Las cargas"} ${cargoNames} ${cargosWithoutDeliveries.length === 1 ? "no tiene" : "no tienen"} puntos de entrega asignados. Existen ${deliveryStopCount} paradas de descarga en la ruta, por lo que debe especificar a cuál ${cargosWithoutDeliveries.length === 1 ? "se entregará" : "se entregarán"}.`,
      };
    }

    return { isValid: true };
  }, [form]);

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentStepConfig = WIZARD_STEPS[currentStep];
    const fieldsToValidate = currentStepConfig.fields;

    const result = await form.trigger(
      fieldsToValidate as (keyof TripWizardFormValues)[],
    );

    // Validación adicional para el paso de Cargas (step 2)
    if (currentStep === 2) {
      const cargoValidation = validateCargoStep();

      if (!cargoValidation.isValid) {
        toast({
          title: "Cargas incompletas",
          description: cargoValidation.message,
          variant: "error",
        });
        setStepErrors((prev) => ({ ...prev, [currentStep]: true }));
        return false;
      }

      // Notificar destino implícito (válido pero con advertencia)
      if (cargoValidation.warning) {
        toast({
          title: "Entrega con destino implícito",
          description: cargoValidation.warning,
          variant: "warning",
        });
      }
    }

    setStepErrors((prev) => ({
      ...prev,
      [currentStep]: !result,
    }));

    return result;
  }, [currentStep, form, validateCargoStep, toast]);

  // ============================================
  // Navegación del wizard
  // ============================================

  const handleNext = async () => {
    const isValid = await validateCurrentStep();
    if (isValid && currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleStepClick = async (stepIndex: number) => {
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    } else {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setCurrentStep(stepIndex);
      }
    }
  };

  // ============================================
  // Submit handler
  // ============================================

  const onSubmit = async (data: TripWizardFormValues) => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const originStop = data.stops?.[0];
    const destinationStop = data.stops?.[data.stops.length - 1];

    const preparedData = {
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      clientId: data.clientId || undefined,
      scheduledDeparture: localDateTimeToISO(data.scheduledDeparture),
      scheduledArrival: data.scheduledArrival
        ? localDateTimeToISO(data.scheduledArrival)
        : undefined,
      startMileage: data.startMileage,
      originAddress: originStop?.address || "",
      originCity: originStop?.city || "",
      originState: originStop?.state || undefined,
      destinationAddress: destinationStop?.address || "",
      destinationCity: destinationStop?.city || "",
      destinationState: destinationStop?.state || undefined,
      // Información legacy de carga (compatibilidad)
      cargoDescription: data.cargos?.[0]?.description,
      cargoWeight: data.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0),
      cargoVolume: data.cargos?.reduce((sum, c) => sum + (c.volume || 0), 0),
      cargoUnits: data.cargos?.reduce((sum, c) => sum + (c.units || 0), 0),
      cargoValue: data.cargos?.reduce(
        (sum, c) => sum + (c.declaredValue || 0),
        0,
      ),
      baseRate: data.baseRate,
      notes: data.notes || undefined,
      stops: data.stops?.map((stop) => ({
        sequenceOrder: stop.sequenceOrder,
        stopType: stop.stopType,
        address: stop.address,
        city: stop.city,
        state: stop.state,
        postalCode: stop.postalCode,
        latitude: stop.latitude,
        longitude: stop.longitude,
        locationName: stop.locationName,
        contactName: stop.contactName,
        contactPhone: stop.contactPhone,
        estimatedArrival: stop.estimatedArrival
          ? localDateTimeToISO(stop.estimatedArrival)
          : undefined,
        notes: stop.notes,
        // Carta Porte 3.1
        street: stop.street,
        exteriorNumber: stop.exteriorNumber,
        interiorNumber: stop.interiorNumber,
        colonia: stop.colonia,
        reference: stop.reference,
        satEstadoCode: stop.satEstadoCode,
        satMunicipioCode: stop.satMunicipioCode,
        satLocalidadCode: stop.satLocalidadCode,
        satColoniaCode: stop.satColoniaCode,
        rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario,
        distanceToNextKm: stop.distanceToNextKm,
      })),
      // Mapear cargos con movements
      cargos: data.cargos?.map((cargo) => ({
        clientId: cargo.clientId,
        description: cargo.description,
        productType: cargo.productType,
        weight: cargo.weight,
        volume: cargo.volume,
        units: cargo.units,
        declaredValue: cargo.declaredValue,
        rate: cargo.rate,
        currency: cargo.currency,
        movements: cargo.movements.map((m) => ({
          stopIndex: m.stopIndex,
          movementType: m.movementType,
          weight: m.weight,
          units: m.units,
          notes: m.notes,
        })),
        notes: cargo.notes,
        specialInstructions: cargo.specialInstructions,
        // Carta Porte 3.1
        satProductCode: cargo.satProductCode,
        satUnitCode: cargo.satUnitCode,
        satUnitName: cargo.satUnitName,
        weightInKg: cargo.weightInKg,
        dimensions: cargo.dimensions,
        hazardousMaterial: cargo.hazardousMaterial,
        hazardousMaterialCode: cargo.hazardousMaterialCode,
        packagingType: cargo.packagingType,
        packagingDescription: cargo.packagingDescription,
      })),
      expenses: data.expenses?.map((expense) => ({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        expenseDate: expense.expenseDate
          ? localDateTimeToISO(expense.expenseDate)
          : undefined,
        location: expense.location,
        vendorName: expense.vendorName,
        notes: expense.notes,
        isEstimated: expense.isEstimated,
      })),
    };

    if (isEditMode && id) {
      updateMutation.mutate({ id, data: preparedData });
    } else {
      createMutation.mutate(preparedData);
    }
  };

  const handleSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      const data = form.getValues();
      await onSubmit(data);
    } else {
      toast({
        title: "Formulario incompleto",
        description: "Por favor complete todos los campos requeridos",
        variant: "error",
      });
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isLastStep = currentStep === WIZARD_STEPS.length - 1;

  if (isEditMode && isLoadingTrip) {
    return <TripFormSkeleton />;
  }

  // ============================================
  // Render step content
  // ============================================

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            form={form}
            vehicles={vehicles}
            drivers={drivers}
            clients={clients}
            isLoadingVehicles={isLoadingVehicles}
            isLoadingDrivers={isLoadingDrivers}
            isLoadingClients={isLoadingClients}
          />
        );
      case 1:
        return <RouteStep form={form} stopsFieldArray={stopsFieldArray} />;
      case 2:
        return (
          <CargoStep
            form={form}
            cargosFieldArray={cargosFieldArray}
            clients={clients}
            isLoadingClients={isLoadingClients}
          />
        );
      case 3:
        return (
          <CostsStep form={form} expensesFieldArray={expensesFieldArray} />
        );
      case 4:
        return (
          <SummaryStep
            form={form}
            vehicles={vehicles}
            drivers={drivers}
            clients={clients}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
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
              : "Complete los pasos para crear un viaje"}
          </p>
        </div>
      </div>

      {/* Wizard Steps Indicator */}
      <Card>
        <CardContent className="pt-6">
          <WizardSteps
            steps={WIZARD_STEPS.map((step) => ({
              id: step.id,
              title: step.title,
              description: step.description,
            }))}
            currentStep={currentStep}
            onStepClick={handleStepClick}
            allowNavigation={true}
          />
        </CardContent>
      </Card>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {stepErrors[currentStep] && (
            <AlertWithIcon variant="destructive" className="mt-4">
              Por favor complete todos los campos requeridos antes de continuar.
            </AlertWithIcon>
          )}

          <div className="flex items-center justify-between pt-6 mt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
              >
                Cancelar
              </Button>

              {isLastStep ? (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {isEditMode ? "Guardar Cambios" : "Crear Viaje"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext}>
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
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

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-16 mt-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {[1, 2].map((i) => (
        <Card key={i}>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-6 w-40" />
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
