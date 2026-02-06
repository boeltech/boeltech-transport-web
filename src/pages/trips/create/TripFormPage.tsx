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
import { useTrip, useCreateTrip, useUpdateTrip } from "@/features/trips";
import { useAvailableVehicles } from "@features/vehicles/application";
import { useAvailableDrivers } from "@features/drivers/application";
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

function TripFormPage() {
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
      // Mapear stops del backend al formato del formulario
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

      // Mapear cargos del backend al formato del formulario
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
        pickupStopIndex: undefined,
        deliveryStopIndex: undefined,
        notes: cargo.notes || undefined,
        specialInstructions: cargo.specialInstructions || undefined,
      }));

      // Mapear expenses del backend al formato del formulario
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

  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    const currentStepConfig = WIZARD_STEPS[currentStep];
    const fieldsToValidate = currentStepConfig.fields;

    // Trigger validation solo para los campos del paso actual
    const result = await form.trigger(
      fieldsToValidate as (keyof TripWizardFormValues)[],
    );

    setStepErrors((prev) => ({
      ...prev,
      [currentStep]: !result,
    }));

    return result;
  }, [currentStep, form]);

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
    // Solo permitir ir a pasos anteriores o al actual
    if (stepIndex <= currentStep) {
      setCurrentStep(stepIndex);
    } else {
      // Para ir adelante, validar el paso actual primero
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

    // Extraer origen y destino desde las paradas
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
      // Origen desde la primera parada
      originAddress: originStop?.address || "",
      originCity: originStop?.city || "",
      originState: originStop?.state || undefined,
      // Destino desde la última parada
      destinationAddress: destinationStop?.address || "",
      destinationCity: destinationStop?.city || "",
      destinationState: destinationStop?.state || undefined,
      // Información legacy de carga (para compatibilidad)
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
      // Mapear stops al formato esperado por el backend
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
        cargoActionDescription: undefined,
        cargoWeight: undefined,
        cargoUnits: undefined,
        notes: stop.notes,
      })),
      // Mapear cargos al formato esperado por el backend
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
        pickupStopIndex: cargo.pickupStopIndex,
        deliveryStopIndex: cargo.deliveryStopIndex,
        notes: cargo.notes,
        specialInstructions: cargo.specialInstructions,
      })),
      // Mapear expenses al formato esperado por el backend
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
          {/* Step Content */}
          <div className="min-h-[400px]">{renderStepContent()}</div>

          {/* Error Alert */}
          {stepErrors[currentStep] && (
            <AlertWithIcon variant="destructive" className="mt-4">
              Por favor complete todos los campos requeridos antes de continuar.
            </AlertWithIcon>
          )}

          {/* Navigation Buttons */}
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

export default TripFormPage;
