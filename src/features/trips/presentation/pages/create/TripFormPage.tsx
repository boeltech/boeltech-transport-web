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

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FormProvider,
  useForm,
  useFieldArray,
  type UseFormReturn,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent } from "@shared/ui/card";
import {
  WizardPageShell,
  type WizardFormRef,
  type WizardStepRenderHelpers,
} from "@shared/ui/page-shells/WizardPageShell";
import { useWizardFormRef } from "@shared/ui/page-shells/useWizardFormRef";
import { Skeleton } from "@shared/ui/skeleton";
import { FormValidationSummary } from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";

// Feature hooks
import {
  useTrip,
  useCreateTrip,
  useUpdateTrip,
  useTrips,
  StopType,
  TripCreationError,
  TripStatus,
} from "@features/trips";
import { useAssignableVehicles } from "@features/vehicles/application";
import { useDrivers } from "@features/drivers/application";
import { useActiveClients } from "@features/clients/application";
import { BranchStatus, useBranches } from "@features/branches";
import { useEmployees } from "@features/employees";
import type { EmployeeListItem } from "@features/employees";
import type { DriverListItem } from "@features/drivers/domain";

import {
  applyBusyResourcesToVehicles,
  buildBusyAssignmentResourceIds,
} from "./tripAssignmentBusyResources";
import {
  buildAssignableDriversForTripWizard,
  type AssignableDriverItem,
} from "./tripAssignmentDrivers";
import { findSupportStaffAssignability } from "./tripAssignmentSupportStaff";

import { useToast } from "@shared/hooks";
import { Route } from "lucide-react";

// Wizard components
import {
  tripWizardSchemaWithCreateApiAlignment,
  tripWizardSchemaWithUpdateApiAlignment,
  WIZARD_STEPS,
  WIZARD_STEP_FIELDS,
  defaultWizardFormValues,
  BasicInfoStep,
  RouteStep,
  CargoStep,
  CostsStep,
  SummaryStep,
  validateRouteStep,
  validateCostsStep,
  stopHasUnifiedAddressId,
} from "./components";
import type { TripWizardFormValues } from "./components";
import { wizardCopy } from "../../copy";

const shell = wizardCopy.shell;
const route = wizardCopy.route;
const cargo = wizardCopy.cargo;

import { buildCreateTripInputFromWizardValues } from "./wizardToCreateTripInput";
import { buildUpdateTripInputFromWizardValues } from "./wizardToUpdateTripInput";
import { buildTripAssignmentContext } from "./tripAssignmentExpiredDocs";
import { mapTripToWizardFormValues } from "./tripFormMappers";
import {
  summarizeTripApiPayloadErrors,
  validateCreateTripApiPayload,
  validateUpdateTripApiPayload,
} from "./validateTripApiPayload";

// ============================================================================
// HELPERS
// ============================================================================

function getRouteValidationMessages(formValues: TripWizardFormValues): string[] {
  const messages: string[] = [];

  formValues.stops.forEach((stop, index) => {
    const missing: string[] = [];

    if (!stopHasUnifiedAddressId(stop)) {
      if (!stop.satCountryCode?.trim()) missing.push(route.label.country);
      if (!stop.satStateCode?.trim()) missing.push(route.label.state);
      if (!stop.satMunicipalityCode?.trim()) {
        missing.push(route.label.municipality);
      }
      if (!/^\d{5}$/.test(stop.postalCode?.trim() ?? "")) {
        missing.push(route.label.postalCode);
      }
    }

    const isDestination = stop.stopType.includes("destination");
    if (isDestination && !stop.estimatedArrival) {
      missing.push(route.label.estimatedArrival);
    }

    if (stop.latitude == null || stop.longitude == null) {
      missing.push(route.label.geolocation);
    }

    if (missing.length > 0) {
      const stopLabel = stop.locationName || route.format.stopFallback(index);
      messages.push(route.format.stopCompleteMissing(stopLabel, missing.join(", ")));
    }
  });

  return messages;
}

function validateStopsCpReady(stops: TripWizardFormValues["stops"]): string[] {
  const issues: string[] = [];
  stops.forEach((stop, index) => {
    const stopLabel = stop.locationName || route.format.stopFallback(index);
    if (stop.latitude == null || stop.longitude == null) {
      issues.push(route.format.stopMissingGeolocation(stopLabel));
    }
    if (
      index > 0 &&
      stop.distanceFromPreviousKm === undefined &&
      stop.distanceFromPreviousKm !== 0
    ) {
      issues.push(route.format.stopMissingDistance(stopLabel));
    }
  });
  return issues;
}

function getStepValidationSummaryTitle(stepIndex: number): string {
  return (
    shell.validation.stepSummaryTitles[stepIndex] ??
    shell.validation.stepSummaryFallback
  );
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

  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [extraValidationMessages, setExtraValidationMessages] = useState<string[]>(
    [],
  );

  // ============================================
  // Queries para cargar datos de los selects
  // ============================================
  const { data: vehiclesRaw = [], isLoading: isLoadingVehicles } =
    useAssignableVehicles({ refetchOnMount: "always" });

  const { data: driversPage, isLoading: isLoadingDrivers } = useDrivers(
    { page: 1, limit: 100 },
    { refetchOnMount: "always" },
  );

  const { data: activeTripsPage } = useTrips(
    {
      page: 1,
      // tripQuerySchema (cfdi-domain) permite máximo 100 por página
      limit: 100,
      filters: {
        status: [TripStatus.IN_PROGRESS, TripStatus.SCHEDULED],
      },
    },
    { enabled: true, refetchOnMount: "always" },
  );

  const busyResources = useMemo(
    () =>
      buildBusyAssignmentResourceIds(
        activeTripsPage?.data ?? [],
        isEditMode ? id : undefined,
      ),
    [activeTripsPage?.data, id, isEditMode],
  );

  const vehicles = useMemo(
    () => applyBusyResourcesToVehicles(vehiclesRaw, busyResources.vehicleIds),
    [vehiclesRaw, busyResources.vehicleIds],
  );

  const assignableDrivers = useMemo(
    (): AssignableDriverItem[] =>
      buildAssignableDriversForTripWizard(
        driversPage?.data ?? [],
        busyResources.driverIds,
      ),
    [driversPage?.data, busyResources.driverIds],
  );

  const fleetDrivers = useMemo(
    (): DriverListItem[] => driversPage?.data ?? [],
    [driversPage?.data],
  );

  const driversByEmployeeId = useMemo(() => {
    const map = new Map<string, DriverListItem>();
    for (const driver of fleetDrivers) {
      map.set(driver.employeeId, driver);
    }
    return map;
  }, [fleetDrivers]);

  const { data: employeesResult } = useEmployees({
    page: 1,
    limit: 100,
    sortBy: "created_at",
    sortOrder: "desc",
  });

  const activeEmployees = useMemo((): EmployeeListItem[] => {
    return (employeesResult?.data ?? []).filter(
      (employee) => employee.isActive && employee.status === "active",
    );
  }, [employeesResult?.data]);

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

  const wizardResolverSchema = isEditMode
    ? tripWizardSchemaWithUpdateApiAlignment
    : tripWizardSchemaWithCreateApiAlignment;

  const form = useForm<TripWizardFormValues>({
    resolver: zodResolver(wizardResolverSchema) as never,
    defaultValues: defaultWizardFormValues,
    mode: "onChange",
  });

  const { data: branchesResult } = useBranches({
    page: 1,
    limit: 100,
    filters: {
      isActive: true,
      status: BranchStatus.ACTIVE,
    },
    sort: {
      field: "name",
      direction: "asc",
    },
  });

  useEffect(() => {
    if (isEditMode) return;
    const branches = branchesResult?.data ?? [];
    if (branches.length === 0) return;
    const currentOriginBranchId = form.getValues("originBranchId")?.trim();
    if (currentOriginBranchId) return;
    const mainBranch = branches.find((branch) => branch.isMain);
    const defaultBranchId = mainBranch?.id ?? branches[0]?.id;
    if (defaultBranchId) {
      form.setValue("originBranchId", defaultBranchId, { shouldDirty: false });
    }
  }, [isEditMode, branchesResult?.data, form]);

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
      form.reset(mapTripToWizardFormValues(existingTrip));
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
      toast({ title: shell.toast.tripUpdated, variant: "success" });
      navigate(`/trips/${id}`);
    },
    onError: (error) => {
      toast({
        title: shell.toast.updateError,
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
          title: shell.toast.infoTitle,
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

    if (!currentCargos.length) {
      return {
        isValid: false,
        message: cargo.validation.requireCargo,
      };
    }

    const totalGrossWeight = currentCargos.reduce(
      (sum, cargo) => sum + (cargo.weightInKg || cargo.weight || 0),
      0,
    );
    if (totalGrossWeight <= 0) {
      return {
        isValid: false,
        message: cargo.validation.requireWeight,
      };
    }

    // ------------------------------------------------------------------
    // 1. Verificar que existan paradas pickup
    // ------------------------------------------------------------------

    const pickupStopIndices = currentStops
      .map((stop, index) => ({
        index,
        hasPickup: stop.stopType.includes(StopType.PICKUP),
        label: stop.locationName || route.format.stopHash(index),
      }))
      .filter((s) => s.hasPickup);

    if (pickupStopIndices.length === 0) {
      return {
        isValid: false,
        message: cargo.validation.noPickupStops,
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
        .map((s) => cargo.format.stopPickupLabel(s.index, s.label))
        .join(", ");
      return {
        isValid: false,
        message: cargo.validation.pickupWithoutCargo(stopLabels),
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

    for (const cargoRow of currentCargos) {
      const movements = cargoRow.movements || [];
      const deliveries = movements.filter((m) => m.movementType === "delivery");

      if (deliveries.length === 0) {
        cargosWithoutDeliveries.push(cargoRow.description);
        continue;
      }

      // Validar concordancia de peso
      if (cargoRow.weight != null && cargoRow.weight > 0) {
        const totalDeliveryWeight = deliveries.reduce(
          (sum, d) => sum + (d.weight || 0),
          0,
        );

        if (totalDeliveryWeight > cargoRow.weight) {
          errors.push(
            cargo.validation.weightExceeded(
              cargoRow.description,
              totalDeliveryWeight,
              cargoRow.weight,
            ),
          );
        } else if (totalDeliveryWeight < cargoRow.weight) {
          const pendingWeight = cargoRow.weight - totalDeliveryWeight;
          errors.push(
            cargo.validation.weightPending(
              cargoRow.description,
              pendingWeight,
              totalDeliveryWeight,
              cargoRow.weight,
            ),
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
              ? cargo.validation.implicitDeliverySingle(cargoNames)
              : cargo.validation.implicitDeliveryMultiple(cargoNames),
        };
      }

      const cargoNames = cargosWithoutDeliveries
        .map((name) => cargo.format.quotedName(name))
        .join(", ");
      return {
        isValid: false,
        message: cargo.validation.missingDeliveryPoints(
          cargoNames,
          cargosWithoutDeliveries.length === 1,
          deliveryStopCount,
        ),
      };
    }

    return { isValid: true };
  }, [form]);

  // ============================================
  // Validación general por paso
  // ============================================

  const validateCurrentStep = useCallback(async (stepIndex: number): Promise<boolean> => {
    const fieldsToValidate = WIZARD_STEP_FIELDS[stepIndex] ?? [];
    const extraMessages: string[] = [];

    const result = await form.trigger(
      fieldsToValidate as (keyof TripWizardFormValues)[],
      { shouldFocus: true },
    );

    if (stepIndex === 0) {
      const selectedClientId = form.getValues("clientId");
      if (!selectedClientId || selectedClientId === "no-client") {
        form.setError("clientId", {
          type: "manual",
          message: shell.validation.selectClient,
        });
      }

      const selectedDriverId = form.getValues("driverId");
      const primaryDriverEmployeeId =
        assignableDrivers.find((driver) => driver.id === selectedDriverId)
          ?.employeeId ?? null;
      const internalStaffRows = form.getValues("internalStaff") ?? [];

      const seenEmployeeIds = new Set<string>();
      for (const row of internalStaffRows) {
        const empId = row.employeeId?.trim();
        if (!empId) continue;

        if (seenEmployeeIds.has(empId)) {
          extraMessages.push(shell.validation.duplicateSupportStaff);
          break;
        }
        seenEmployeeIds.add(empId);

        if (primaryDriverEmployeeId && empId === primaryDriverEmployeeId) {
          extraMessages.push(shell.validation.driverInSupportStaff);
          break;
        }

        const supportExcludeIds = new Set(seenEmployeeIds);
        if (primaryDriverEmployeeId) {
          supportExcludeIds.add(primaryDriverEmployeeId);
        }
        const assignability = findSupportStaffAssignability(empId, {
          employees: activeEmployees,
          driversByEmployeeId,
          busyResources,
          excludeEmployeeIds: supportExcludeIds,
        });
        if (assignability && !assignability.canBeAssigned) {
          const name =
            assignability.fullName ||
            activeEmployees.find((e) => e.id === empId)?.fullName ||
            "Empleado";
          extraMessages.push(
            shell.validation.supportStaffUnavailable(
              name,
              assignability.blockReason ?? "no disponible",
            ),
          );
          break;
        }
      }
    }

    if (stepIndex === 1) {
      const routeValidation = validateRouteStepHandler();

      if (!routeValidation.isValid) {
        extraMessages.push(
          routeValidation.message ?? shell.validation.routeIncomplete,
        );
      } else if (!result) {
        const routeMessages = getRouteValidationMessages(form.getValues());
        if (routeMessages.length > 0) {
          extraMessages.push(...routeMessages.slice(0, 4));
        } else {
          extraMessages.push(shell.validation.routeFieldsIncomplete);
        }
      }
    }

    if (stepIndex === 2) {
      const cargoValidation = validateCargoStep();

      if (!cargoValidation.isValid) {
        extraMessages.push(
          cargoValidation.message ?? shell.validation.cargoIncomplete,
        );
      } else if (cargoValidation.warning) {
        toast({
          title: shell.toast.implicitDeliveryTitle,
          description: cargoValidation.warning,
          variant: "warning",
        });
      }
    }

    if (stepIndex === 3) {
      const costsValidation = validateCostsStep(form.getValues());

      if (!costsValidation.isValid) {
        if (costsValidation.message) {
          form.setError("baseRate", {
            type: "manual",
            message: costsValidation.message,
          });
          extraMessages.push(costsValidation.message);
        }
      } else if (costsValidation.warning) {
        toast({
          title: shell.toast.marginWarningTitle,
          description: costsValidation.warning,
          variant: "warning",
        });
      }
    }

    const clientId = form.getValues("clientId");
    const clientMissing =
      stepIndex === 0 && (!clientId || clientId === "no-client");
    const isValid =
      result && extraMessages.length === 0 && !clientMissing;

    if (!isValid) {
      setExtraValidationMessages(extraMessages);
      setShowValidationSummary(true);
      return false;
    }

    setExtraValidationMessages([]);
    setShowValidationSummary(false);
    return true;
  }, [
    form,
    validateRouteStepHandler,
    validateCargoStep,
    toast,
    assignableDrivers,
    activeEmployees,
    driversByEmployeeId,
    busyResources,
  ]);

  // ============================================
  // Submit handler
  // ============================================

  const onSubmit = useCallback(async (data: TripWizardFormValues) => {
    if (createMutation.isPending || updateMutation.isPending) {
      return;
    }

    const cpReadinessIssues = validateStopsCpReady(data.stops || []);
    if (cpReadinessIssues.length > 0) {
      toast({
        title: shell.toast.routeCpIncompleteTitle,
        description: cpReadinessIssues.slice(0, 2).join(". "),
        variant: "error",
      });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO EDICIÓN: Usar updateMutation
    // ════════════════════════════════════════════════════════════════════════
    if (isEditMode && id) {
      const assignmentContext = buildTripAssignmentContext(
        data,
        vehicles,
        assignableDrivers,
      );
      const preparedData = buildUpdateTripInputFromWizardValues(
        data,
        assignmentContext,
      );

      const updateApiCheck = validateUpdateTripApiPayload(preparedData);
      if (!updateApiCheck.ok) {
        toast({
          title: shell.toast.serverValidationTitle,
          description: summarizeTripApiPayloadErrors(updateApiCheck.fieldErrors),
          variant: "error",
        });
        return;
      }

      updateMutation.mutate({ id, data: preparedData });
      return;
    }

    // ════════════════════════════════════════════════════════════════════════
    // MODO CREACIÓN: Endpoint transaccional
    // ════════════════════════════════════════════════════════════════════════

    const assignmentContext = buildTripAssignmentContext(
      data,
      vehicles,
      assignableDrivers,
    );
    const wizardPayload = buildCreateTripInputFromWizardValues(
      data,
      assignmentContext,
    );

    const createApiCheck = validateCreateTripApiPayload(wizardPayload);
    if (!createApiCheck.ok) {
      toast({
        title: shell.toast.serverValidationTitle,
        description: summarizeTripApiPayloadErrors(createApiCheck.fieldErrors),
        variant: "error",
      });
      return;
    }

    try {
      const result = await createMutation.mutateAsync(wizardPayload);

      toast({
        title: shell.toast.tripCreated,
        variant: "success",
      });

      navigate(`/trips/${result.trip.id}`);
    } catch (error) {
      if (error instanceof TripCreationError) {
        toast({
          title: shell.toast.createError,
          description: error.message,
          variant: "error",
        });
      } else {
        toast({
          title: shell.toast.createError,
          description:
            error instanceof Error ? error.message : shell.toast.unknownError,
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
    vehicles,
    assignableDrivers,
  ]);

  const handleSubmit = useCallback(async () => {
    const isValid = await form.trigger(undefined, { shouldFocus: true });
    if (isValid) {
      setShowValidationSummary(false);
      setExtraValidationMessages([]);
      const data = form.getValues();
      await onSubmit(data);
    } else {
      setShowValidationSummary(true);
    }
  }, [form, onSubmit]);

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
      backLabel: shell.page.backLabel,
      icon: <Route className="h-5 w-5" />,
      title: isEditMode ? shell.page.editTitle : shell.page.createTitle,
      subtitle: isEditMode
        ? shell.page.editSubtitle(existingTrip?.tripCode ?? "")
        : shell.page.createSubtitle,
    }),
    [isEditMode, existingTrip?.tripCode],
  );

  const requestWizardSubmit = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  useWizardFormRef({
    formRef,
    triggerStepValidation: validateCurrentStep,
    requestSubmit: requestWizardSubmit,
  });

  // ============================================
  // Render step content
  // ============================================

  const renderStepContent = useCallback(
    (currentStep: number, helpers?: WizardStepRenderHelpers) => {
      switch (currentStep) {
        case 0:
          return (
            <BasicInfoStep
              form={form}
              vehicles={vehicles}
              drivers={assignableDrivers}
              fleetDrivers={fleetDrivers}
              busyResources={busyResources}
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
            />
          );
        case 3:
          return (
            <CostsStep
              form={
                form as UseFormReturn<
                  TripWizardFormValues,
                  unknown,
                  TripWizardFormValues
                >
              }
              expensesFieldArray={expensesFieldArray}
            />
          );
        case 4:
          return (
            <SummaryStep
              form={form}
              vehicles={vehicles}
              drivers={assignableDrivers}
              clients={clients}
              onGoToStep={helpers?.goToStep ?? (() => undefined)}
            />
          );
        default:
          return null;
      }
    },
    [
      cargosFieldArray,
      clients,
      expensesFieldArray,
      form,
      isLoadingClients,
      isLoadingDrivers,
      isLoadingVehicles,
      stopsFieldArray,
      assignableDrivers,
      fleetDrivers,
      busyResources,
      vehicles,
    ],
  );

  const validationSummaryMessages = useMemo(() => {
    const fieldMessages = collectFieldErrorMessages(form.formState.errors);
    const merged = [...fieldMessages, ...extraValidationMessages];
    return [...new Set(merged)];
  }, [form.formState.errors, extraValidationMessages]);

  const renderStep = useCallback(
    (currentStep: number, helpers?: WizardStepRenderHelpers) => (
      <FormProvider key={id ?? "create"} {...form}>
        <form onSubmit={(e) => e.preventDefault()}>
          {currentStep < WIZARD_STEPS.length - 1 ? (
            <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
              Completa los campos obligatorios del paso para continuar.
            </p>
          ) : null}
          <div className="min-h-[400px]">
            {renderStepContent(currentStep, helpers)}
          </div>

          {showValidationSummary && validationSummaryMessages.length > 0 ? (
            <div
              className="mt-6 border-t border-border/60 pt-6"
              role="region"
              aria-label={shell.submit.validationAriaLabel}
            >
              <FormValidationSummary
                className="mb-0"
                title={getStepValidationSummaryTitle(currentStep)}
                messages={validationSummaryMessages}
              />
            </div>
          ) : null}
        </form>
      </FormProvider>
    ),
    [form, renderStepContent, id, showValidationSummary, validationSummaryMessages],
  );

  if (isEditMode && isLoadingTrip) {
    return <TripFormSkeleton />;
  }

  return (
    <WizardPageShell
      steps={shellSteps}
      formRef={formRef}
      header={shellHeader}
      renderStep={renderStep}
      isSubmitting={isSubmitting}
      submitLabel={isEditMode ? shell.submit.save : shell.submit.create}
      submittingLabel={isEditMode ? shell.submit.saving : shell.submit.creating}
      stepsAriaLabel={shell.submit.stepsAriaLabel}
      onCancel={() => navigate(-1)}
      onHeaderBack={() => navigate(-1)}
      headerBackMode="exit"
      className="pb-8"
      resolveContainerClassName={(step) =>
        step === WIZARD_STEPS.length - 1 ? "max-w-6xl" : undefined
      }
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
