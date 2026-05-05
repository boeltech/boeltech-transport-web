/**
 * TripFormPage - Wizard para crear viajes
 * FSD: Pages Layer - Composition
 *
 * Formulario tipo wizard para crear y editar viajes.
 * Incluye pasos para: información básica, ruta, cargas, costos y resumen.
 *
 * ACTUALIZADO: Campos de dirección unificados con Carta Porte 3.1
 * - Eliminados campos legacy en stops (address, city, state como texto libre)
 * - Todos los campos de ubicación usan catálogos SAT
 * - createInput y updateInput adaptados para nuevos campos
 *
 * GARANTÍAS:
 * - Atomicidad: Todo se crea o nada se crea
 * - Una sola llamada HTTP
 * - No hay datos huérfanos si algo falla
 *
 * Ubicación: src/pages/trips/create/TripFormPage.tsx
 */

import { useState, useEffect, useCallback, useRef, useLayoutEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useFieldArray, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@shared/ui/card";
import {
  WizardPageShell,
  type WizardFormRef,
} from "@shared/ui/page-shells/WizardPageShell";
import { Form } from "@shared/ui/form";
import { Skeleton } from "@shared/ui/skeleton";
import { AlertWithIcon } from "@shared/ui/alert";

// Feature hooks
import {
  useTrip,
  useCreateTrip,
  useUpdateTrip,
  StopType,
  TripCreationError,
} from "@/features/trips";
import type { CurrencyType } from "@features/trips/domain";
import { useAssignableVehicles } from "@features/vehicles/application";
import { useDrivers } from "@features/drivers/application";
import { useActiveClients } from "@features/clients/application";

import { useToast } from "@shared/hooks";
import { Route } from "lucide-react";

// Wizard components
import {
  tripWizardSchema,
  WIZARD_STEPS,
  defaultWizardFormValues,
  BasicInfoStep,
  RouteStep,
  CargoStep,
  CostsStep,
  SummaryStep,
  validateRouteStep,
  stopHasUnifiedAddressId,
} from "./components";
import type { TripWizardFormValues } from "./components";
import {
  localInputToUtcIso,
  utcIsoToLocalInput,
} from "@shared/utils/dateUtils";

import {
  buildLegacyAddress,
  mapWizardStopsToCreateInput,
} from "./wizardStopPayload";

// ============================================================================
// HELPERS
// ============================================================================

function getRouteValidationMessages(formValues: TripWizardFormValues): string[] {
  const messages: string[] = [];

  formValues.stops.forEach((stop, index) => {
    const missing: string[] = [];

    if (!stopHasUnifiedAddressId(stop)) {
      if (!stop.satEstadoCode?.trim()) missing.push("estado SAT");
      if (!stop.satMunicipioCode?.trim()) missing.push("municipio SAT");
      if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) {
        missing.push("codigo postal");
      }
    }

    const isDestination = stop.stopType.includes("destination");
    if (isDestination && !stop.estimatedArrival) {
      missing.push("hora estimada de llegada");
    }

    const isOrigin = stop.stopType.includes("origin");
    if (!isOrigin && (stop.distanceFromPreviousKm ?? null) === null) {
      missing.push("distancia desde parada anterior");
    }

    if (missing.length > 0) {
      const stopLabel = stop.locationName || `Parada ${index + 1}`;
      messages.push(`${stopLabel}: completa ${missing.join(", ")}`);
    }
  });

  return messages;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TripFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditMode = !!id;
  const formRef = useRef<WizardFormRef | null>(null);

  // Estado del wizard
  const [stepErrors, setStepErrors] = useState<Record<number, boolean>>({});

  // ============================================
  // Queries para cargar datos de los selects
  // ============================================
  const { data: vehicles = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles();

  const { data: drivers, isLoading: isLoadingDrivers } = useDrivers();
  const availableDrivers = useMemo(() => drivers?.data ?? [], [drivers?.data]);

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
    resolver: zodResolver(tripWizardSchema) as never,
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

  // ============================================
  // Actualizar form cuando se carga un viaje existente
  // ============================================
  useEffect(() => {
    if (existingTrip && isEditMode) {
      // Mapear stops del backend (adaptado para campos SAT)
      const mappedStops = (existingTrip.stops || []).map((stop) => ({
        id: stop.id,
        sequenceOrder: stop.sequenceOrder,
        stopType: (Array.isArray(stop.stopType) ? stop.stopType : [stop.stopType]) as (
          | "origin"
          | "pickup"
          | "delivery"
          | "waypoint"
          | "destination"
        )[],
        clientId: stop.clientId ?? "",
        clientAddressId: stop.clientAddressId ?? stop.addressId ?? "",
        addressId: stop.addressId ?? "",
        locationName: stop.locationName || undefined,
        // Campos Carta Porte (SAT)
        satEstadoCode: stop.satEstadoCode || "",
        satMunicipioCode: stop.satMunicipioCode || "",
        postalCode: stop.postalCode || "",
        satLocalidadCode: stop.satLocalidadCode || undefined,
        satColoniaCode: stop.satColoniaCode || undefined,
        colonia: stop.colonia || undefined,
        street: stop.street || undefined,
        exteriorNumber: stop.exteriorNumber || undefined,
        interiorNumber: stop.interiorNumber || undefined,
        reference: stop.reference || undefined,
        rfcRemitenteDestinatario: stop.rfcRemitenteDestinatario || undefined,
        nombreRemitenteDestinatario:
          stop.nombreRemitenteDestinatario || undefined,
        distanceFromPreviousKm: stop.distanceFromPreviousKm || undefined,
        // Contacto
        contactName: stop.contactName || undefined,
        contactPhone: stop.contactPhone || undefined,
        notes: stop.notes || undefined,
        // Coordenadas
        latitude: stop.latitude || undefined,
        longitude: stop.longitude || undefined,
        estimatedArrival: stop.estimatedArrival
          ? utcIsoToLocalInput(stop.estimatedArrival.toISOString())
          : undefined,
      }));

      // Mapear cargos del backend con movements
      const mappedCargos = (existingTrip.cargos || []).map((cargo) => ({
        id: cargo.id,
        clientId: cargo.clientId,
        description: cargo.description,
        weight: cargo.weight ?? undefined,
        units: cargo.units ?? undefined,
        weightInKg: cargo.weightInKg ?? undefined,
        declaredValue: cargo.declaredValue ?? undefined,
        isInsured:
          (cargo.declaredValue ?? 0) > 0 ||
          !!cargo.aseguraCarga ||
          !!cargo.polizaCarga,
        aseguraCarga: cargo.aseguraCarga ?? undefined,
        polizaCarga: cargo.polizaCarga ?? undefined,
        movements: (cargo.movements || []).map((m) => ({
          stopIndex: m.stopIndex,
          movementType: m.movementType,
          weight: m.weight ?? undefined,
          units: m.units ?? undefined,
          notes: m.notes ?? undefined,
        })),
        notes: cargo.notes ?? undefined,
        specialInstructions: cargo.specialInstructions ?? undefined,
        // Carta Porte
        satProductCode: cargo.satProductCode ?? undefined,
        satProductDescription: cargo.satProductDescription ?? undefined,
        satUnitCode: cargo.satUnitCode ?? undefined,
        satUnitName: cargo.satUnitName ?? undefined,
        hazardousMaterial: cargo.hazardousMaterial ?? false,
        hazardousMaterialCode: cargo.hazardousMaterialCode ?? undefined,
        packagingType: cargo.packagingType ?? undefined,
        packagingDescription: cargo.packagingDescription ?? undefined,
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
          ? utcIsoToLocalInput(expense.expenseDate.toISOString())
          : undefined,
        location: expense.location || undefined,
        vendorName: expense.vendorName || undefined,
        notes: expense.notes || undefined,
        isEstimated: true,
      }));
      const mappedInternalStaff = (existingTrip.internalStaff || []).map(
        (member) => ({
          employeeId: member.employeeId,
          isPaymentResponsible: member.isPaymentResponsible ?? false,
          paymentNotes: member.paymentNotes ?? undefined,
        }),
      );

      form.reset({
        vehicleId: existingTrip.vehicleId,
        driverId: existingTrip.driverId,
        clientId: existingTrip.clientId || "",
        scheduledDeparture: utcIsoToLocalInput(
          existingTrip.scheduledDeparture.toISOString(),
        ),
        scheduledArrival: existingTrip.scheduledArrival
          ? utcIsoToLocalInput(existingTrip.scheduledArrival.toISOString())
          : "",
        startMileage: existingTrip.mileage.start ?? undefined,
        stops: mappedStops,
        cargos: mappedCargos,
        expenses: mappedExpenses,
        internalStaff: mappedInternalStaff,
        baseRate: existingTrip.costs.baseRate ?? undefined,
        notes: existingTrip.notes || "",
      });
    }
  }, [existingTrip, isEditMode, form]);

  // ============================================
  // Mutations
  // ============================================

  /**
   * useCreateTrip: Usa endpoint transaccional POST /api/v1/trips/with-details
   */
  const createMutation = useCreateTrip();

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
  // Validación del paso de Ruta (paso 1)
  // ============================================

  const validateRouteStepHandler = useCallback((): {
    isValid: boolean;
    message?: string;
  } => {
    const currentStops = form.getValues("stops");
    const validation = validateRouteStep(currentStops);

    if (!validation.isValid) {
      return {
        isValid: false,
        message: validation.errors.join(". "),
      };
    }

    // Mostrar advertencias si las hay (no bloquean)
    if (validation.warnings.length > 0) {
      validation.warnings.forEach((warning) => {
        toast({
          title: "Información",
          description: warning,
          variant: "warning",
        });
      });
    }

    return { isValid: true };
  }, [form, toast]);

  // ============================================
  // Validación del paso de Cargas (paso 2)
  // ============================================

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
        label: stop.locationName || `Parada #${index + 1}`,
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
        cargosWithoutDeliveries.push(cargo.description);
        continue;
      }

      // Validar concordancia de peso
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

      // Validar concordancia de unidades
      // if (cargo.units != null && cargo.units > 0) {
      //   const totalDeliveryUnits = deliveries.reduce(
      //     (sum, d) => sum + (d.units || 0),
      //     0,
      //   );

      //   if (totalDeliveryUnits > cargo.units) {
      //     errors.push(
      //       `"${cargo.description}": las unidades de entregas (${totalDeliveryUnits}) exceden las unidades de la carga (${cargo.units})`,
      //     );
      //   } else if (totalDeliveryUnits < cargo.units) {
      //     const pendingUnits = cargo.units - totalDeliveryUnits;
      //     errors.push(
      //       `"${cargo.description}": faltan ${pendingUnits} unidades por asignar a puntos de entrega (${totalDeliveryUnits}/${cargo.units})`,
      //     );
      //   }
      // }
    }

    if (errors.length > 0) {
      return {
        isValid: false,
        message: errors.join(". "),
      };
    }

    if (cargosWithoutDeliveries.length > 0) {
      if (deliveryStopCount === 1) {
        const cargoNames = cargosWithoutDeliveries.join(", ");
        return {
          isValid: true,
          warning:
            cargosWithoutDeliveries.length === 1
              ? `La carga "${cargoNames}" no tiene punto de entrega asignado. Se entregará en la única parada de descarga del viaje.`
              : `Las cargas ${cargoNames} no tienen punto de entrega asignado. Se entregarán en la única parada de descarga del viaje.`,
        };
      }

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

  // ============================================
  // Validación general por paso
  // ============================================

  const validateCurrentStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const currentStepConfig = WIZARD_STEPS[stepIndex];
    const fieldsToValidate = currentStepConfig.fields;

    // Validación de campos del schema
    const result = await form.trigger(
      fieldsToValidate as (keyof TripWizardFormValues)[],
    );

    // Regla de negocio: el cliente principal siempre es obligatorio.
    if (stepIndex === 0) {
      const selectedClientId = form.getValues("clientId");
      if (!selectedClientId || selectedClientId === "no-client") {
        form.setError("clientId", {
          type: "manual",
          message: "Cliente principal requerido",
        });
        toast({
          title: "Cliente requerido",
          description:
            "Debe seleccionar un cliente principal antes de continuar.",
          variant: "error",
        });
        setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
        return false;
      }

      const selectedDriverId = form.getValues("driverId");
      const primaryDriverEmployeeId =
        availableDrivers.find((driver) => driver.id === selectedDriverId)
          ?.employeeId ?? null;
      const internalStaffRows = form.getValues("internalStaff") ?? [];

      const seenEmployeeIds = new Set<string>();
      for (const row of internalStaffRows) {
        const empId = row.employeeId?.trim();
        if (!empId) continue;

        if (seenEmployeeIds.has(empId)) {
          toast({
            title: "Equipo de apoyo inválido",
            description:
              "No puedes agregar el mismo empleado dos veces en el equipo de apoyo.",
            variant: "error",
          });
          setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
          return false;
        }
        seenEmployeeIds.add(empId);

        if (
          primaryDriverEmployeeId &&
          empId === primaryDriverEmployeeId
        ) {
          toast({
            title: "Equipo de apoyo inválido",
            description:
              "El conductor principal no puede figurar también en el equipo de apoyo.",
            variant: "error",
          });
          setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
          return false;
        }
      }
    }

    // Validación adicional para el paso de RUTA (step 1)
    if (stepIndex === 1) {
      const routeValidation = validateRouteStepHandler();

      if (!routeValidation.isValid) {
        toast({
          title: "Ruta pendiente",
          description: routeValidation.message,
          variant: "error",
        });
        setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
        return false;
      }

      if (!result) {
        const routeMessages = getRouteValidationMessages(form.getValues());
        toast({
          title: "Completa las paradas para continuar",
          description:
            routeMessages.length > 0
              ? `${routeMessages.slice(0, 2).join(". ")}. Abre cada parada con el boton Completar.`
              : "Hay campos requeridos sin completar. Abre cada parada con el boton Completar.",
          variant: "error",
        });
        setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
        return false;
      }
    }

    // Validación adicional para el paso de CARGAS (step 2)
    if (stepIndex === 2) {
      const cargoValidation = validateCargoStep();

      if (!cargoValidation.isValid) {
        toast({
          title: "Cargas incompletas",
          description: cargoValidation.message,
          variant: "error",
        });
        setStepErrors((prev) => ({ ...prev, [stepIndex]: true }));
        return false;
      }

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
      [stepIndex]: !result,
    }));

    return result;
  }, [form, validateRouteStepHandler, validateCargoStep, toast, availableDrivers]);

  // ============================================
  // Submit handler
  // ============================================

  const onSubmit = useCallback(async (data: TripWizardFormValues) => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    // Encontrar origen y destino por stopType (no por posición)
    const originStop = data.stops?.find((stop) =>
      stop.stopType.includes("origin"),
    );
    const destinationStop = data.stops?.find((stop) =>
      stop.stopType.includes("destination"),
    );

    // Construir direcciones legacy para el viaje (compatibilidad)
    const originAddress = originStop ? buildLegacyAddress(originStop) : null;
    const destAddress = destinationStop
      ? buildLegacyAddress(destinationStop)
      : null;

    // ════════════════════════════════════════════════════════════════════════
    // MODO EDICIÓN: Usar updateMutation
    // ════════════════════════════════════════════════════════════════════════
    if (isEditMode && id) {
      const preparedData = {
        vehicleId: data.vehicleId,
        driverId: data.driverId,
        clientId: data.clientId,
        scheduledDeparture: localInputToUtcIso(data.scheduledDeparture),
        scheduledArrival: data.scheduledArrival
          ? localInputToUtcIso(data.scheduledArrival)
          : undefined,
        startMileage: data.startMileage,
        // Direcciones legacy construidas desde campos SAT
        originAddress: originAddress?.address || "",
        originCity: originAddress?.city || "",
        originState: originAddress?.state || undefined,
        destinationAddress: destAddress?.address || "",
        destinationCity: destAddress?.city || "",
        destinationState: destAddress?.state || undefined,
        cargoDescription: data.cargos?.[0]?.description,
        cargoWeight: data.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0),
        // cargoVolume: data.cargos?.reduce((sum, c) => sum + (c.volume || 0), 0),
        // cargoUnits: data.cargos?.reduce((sum, c) => sum + (c.units || 0), 0),
        cargoValue: data.cargos?.reduce(
          (sum, c) => sum + (c.declaredValue || 0),
          0,
        ),
        baseRate: data.baseRate,
        internalStaff: data.internalStaff?.map((member) => ({
          employeeId: member.employeeId,
          isPaymentResponsible: member.isPaymentResponsible ?? false,
          paymentNotes: member.paymentNotes || undefined,
        })),
        notes: data.notes || undefined,
        stops: mapWizardStopsToCreateInput(data.stops),
        cargos: data.cargos?.map((cargo) => ({
          clientId: cargo.clientId || "",
          description: cargo.description,
          weight: cargo.weight,
          units: cargo.units,
          declaredValue: cargo.declaredValue,
          aseguraCarga: cargo.aseguraCarga || undefined,
          polizaCarga: cargo.polizaCarga || undefined,
          notes: cargo.notes || undefined,
          specialInstructions: cargo.specialInstructions || undefined,
          movements: cargo.movements?.map((m) => ({
            stopIndex: m.stopIndex,
            movementType: m.movementType,
            weight: m.weight,
            units: m.units,
            notes: m.notes,
          })),
          satProductCode: cargo.satProductCode || undefined,
          satProductDescription: cargo.satProductDescription || undefined,
          satUnitCode: cargo.satUnitCode || undefined,
          satUnitName: cargo.satUnitName || undefined,
          weightInKg: cargo.weightInKg,
          hazardousMaterial: cargo.hazardousMaterial,
          hazardousMaterialCode: cargo.hazardousMaterialCode || undefined,
          packagingType: cargo.packagingType || undefined,
          packagingDescription: cargo.packagingDescription || undefined,
        })),
        estimatedExpenses: data.expenses?.map((expense) => ({
          category: expense.category,
          description: expense.description,
          amount: expense.amount,
          currency: expense.currency as CurrencyType,
          vendorName: expense.vendorName || undefined,
          notes: expense.notes || undefined,
          isEstimated: true,
        })),
      };

      updateMutation.mutate({ id, data: preparedData });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO CREACIÓN: Endpoint transaccional
    // ════════════════════════════════════════════════════════════════════════

    const createInput = {
      // Datos del viaje
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      clientId: data.clientId,
      scheduledDeparture: localInputToUtcIso(data.scheduledDeparture),
      scheduledArrival: data.scheduledArrival
        ? localInputToUtcIso(data.scheduledArrival)
        : undefined,
      startMileage: data.startMileage,
      // Direcciones legacy construidas desde campos SAT
      originAddress: originAddress?.address || "",
      originCity: originAddress?.city || "",
      originState: originAddress?.state || undefined,
      destinationAddress: destAddress?.address || "",
      destinationCity: destAddress?.city || "",
      destinationState: destAddress?.state || undefined,
      // Información legacy de carga (compatibilidad)
      cargoDescription: data.cargos?.[0]?.description,
      cargoWeight: data.cargos?.reduce((sum, c) => sum + (c.weight || 0), 0),
      // cargoVolume: data.cargos?.reduce((sum, c) => sum + (c.volume || 0), 0),
      // cargoUnits: data.cargos?.reduce((sum, c) => sum + (c.units || 0), 0),
      cargoValue: data.cargos?.reduce(
        (sum, c) => sum + (c.declaredValue || 0),
        0,
      ),
      baseRate: data.baseRate,
      internalStaff: data.internalStaff?.map((member) => ({
        employeeId: member.employeeId,
        isPaymentResponsible: member.isPaymentResponsible ?? false,
        paymentNotes: member.paymentNotes || undefined,
      })),
      notes: data.notes || undefined,

      // Paradas — camelCase, apiClient hace deepToSnake automáticamente
      stops: mapWizardStopsToCreateInput(data.stops),

      // Cargas — camelCase, apiClient hace deepToSnake automáticamente
      // NOTA: El campo `rate` fue eliminado; prorrateo por carga pendiente para módulo futuro.
      cargos: data.cargos?.map((cargo) => ({
        clientId: cargo.clientId || "",
        description: cargo.description,
        weight: cargo.weight,
        units: cargo.units,
        declaredValue: cargo.declaredValue,
        aseguraCarga: cargo.aseguraCarga || undefined,
        polizaCarga: cargo.polizaCarga || undefined,
        notes: cargo.notes || undefined,
        specialInstructions: cargo.specialInstructions || undefined,
        movements: cargo.movements?.map((m) => ({
          stopIndex: m.stopIndex,
          movementType: m.movementType,
          weight: m.weight,
          units: m.units,
          notes: m.notes,
        })),
        // Carta Porte 3.1
        satProductCode: cargo.satProductCode || undefined,
        satProductDescription: cargo.satProductDescription || undefined,
        satUnitCode: cargo.satUnitCode || undefined,
        satUnitName: cargo.satUnitName || undefined,
        weightInKg: cargo.weightInKg,
        hazardousMaterial: cargo.hazardousMaterial,
        hazardousMaterialCode: cargo.hazardousMaterialCode || undefined,
        packagingType: cargo.packagingType || undefined,
        packagingDescription: cargo.packagingDescription || undefined,
      })),

      // Gastos estimados — camelCase, apiClient hace deepToSnake automáticamente
      estimatedExpenses: data.expenses?.map((expense) => ({
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency as import("@features/trips/domain").CurrencyType,
        vendorName: expense.vendorName || undefined,
        notes: expense.notes || undefined,
        isEstimated: true,
      })),
    };

    try {
      const result = await createMutation.mutateAsync(createInput);

      toast({
        title: "Viaje creado exitosamente",
        variant: "success",
      });

      navigate(`/trips/${result.trip.id}`);
    } catch (error) {
      if (error instanceof TripCreationError) {
        toast({
          title: "Error al crear viaje",
          description: error.message,
          variant: "error",
        });
      } else {
        toast({
          title: "Error al crear viaje",
          description:
            error instanceof Error ? error.message : "Error desconocido",
          variant: "error",
        });
      }
    }
  }, [
    createMutation,
    updateMutation,
    isEditMode,
    id,
    toast,
    navigate,
  ]);

  const handleSubmit = useCallback(async () => {
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
  }, [form, onSubmit, toast]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const shellSteps = useMemo(
    () =>
      WIZARD_STEPS.map((step) => ({
        id: step.id,
        title: step.title,
        description: step.description,
      })),
    [],
  );

  const shellHeader = useMemo(
    () => ({
      backHref: "/trips",
      backLabel: "Volver",
      icon: <Route className="h-5 w-5" />,
      title: isEditMode ? "Editar Viaje" : "Nuevo Viaje",
      subtitle: isEditMode
        ? `Editando ${existingTrip?.tripCode ?? ""}`.trim()
        : "Complete los pasos para crear un viaje",
    }),
    [isEditMode, existingTrip?.tripCode],
  );

  useLayoutEffect(() => {
    formRef.current = {
      triggerStepValidation: validateCurrentStep,
      requestSubmit: () => {
        void handleSubmit();
      },
    };
    return () => {
      formRef.current = null;
    };
  }, [validateCurrentStep, handleSubmit]);

  if (isEditMode && isLoadingTrip) {
    return <TripFormSkeleton />;
  }

  // ============================================
  // Render step content
  // ============================================

  const renderStepContent = (currentStep: number) => {
    switch (currentStep) {
      case 0:
        return (
          <BasicInfoStep
            form={form}
            vehicles={vehicles}
            drivers={availableDrivers}
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
          <CostsStep
            form={form as UseFormReturn<TripWizardFormValues, unknown, TripWizardFormValues>}
            expensesFieldArray={expensesFieldArray}
          />
        );
      case 4:
        return (
          <SummaryStep
            form={form}
            vehicles={vehicles}
            drivers={availableDrivers}
            clients={clients}
          />
        );
      default:
        return null;
    }
  };

  const renderStep = (currentStep: number) => (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="min-h-[400px]">{renderStepContent(currentStep)}</div>

        {stepErrors[currentStep] ? (
          <AlertWithIcon variant="destructive" className="mt-4">
            Aun hay paradas con datos pendientes. Usa el boton Completar en cada una para continuar.
          </AlertWithIcon>
        ) : null}
      </form>
    </Form>
  );

  return (
    <WizardPageShell
      steps={shellSteps}
      formRef={formRef}
      header={shellHeader}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel={isEditMode ? "Guardar Cambios" : "Crear Viaje"}
      submittingLabel={isEditMode ? "Guardando..." : "Creando..."}
      stepsAriaLabel="Pasos para crear o editar un viaje"
      onCancel={() => navigate(-1)}
      onHeaderBack={() => navigate(-1)}
      headerBackMode="exit"
      className="pb-8"
    />
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
