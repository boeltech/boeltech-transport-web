/**
 * CargoMovementSheet - Sheet lateral para agregar/editar cargas
 * Clean Architecture - Presentation Layer (wizard + tab Cargas del detalle)
 *
 * F1: shell Operate, copy «carga», Qué/Cuánto, plegables, hazmat, pie.
 * F2: Dónde va (C6/C7) + error→sección (C9). POST pickup si falta → tab.
 *
 * Validación: `useForm(tripCargoSchema)` con `zodResolver`. SoT CP3.1 en
 * `tripCargoSchema.superRefine`. `deliveryAssignments` fuera del schema.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch, type Resolver, type UseFormSetValue } from "react-hook-form";
import type { MaterialPeligrosoCatalogRequirement } from "@boeltech/cfdi-domain";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@shared/ui/sheet";
import { Button } from "@shared/ui/button";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  FormValidationSummary,
  RHFMoneyField,
  RHFTextField,
  RHFTextareaField,
} from "@shared/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@shared/ui/alert";
import { MessageSquare, ShieldCheck, MapPin } from "lucide-react";
import {
  CargoMovementSheetPickupContext,
  CargoMovementSheetProductSection,
  CargoMovementSheetQuantityWeightSection,
  CargoOptionalSection,
  CargoProductRequirementsSection,
  CargoWhereSection,
  focusFieldIdForCargoSheetSection,
  resolveCargoSheetErrorSection,
  type CargoSheetErrorSection,
} from "./cargo-movement";
import {
  TRACKING_SHEET_BODY_CLASS,
  CARGO_SHEET_CONTENT_CLASS,
  TRACKING_SHEET_FOOTER_CLASS,
  TRACKING_SHEET_HEADER_CLASS,
  TRACKING_SHEET_PRIMARY_BUTTON_CLASS,
} from "../../../components/trip-tracking/trackingSheetLayout";
import { TrackingSheetConfirmEffects } from "../../../components/trip-tracking/TrackingSheetConfirmEffects";
import { useOverlayMutationFeedback, useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";

import {
  getMissingSectorRequiredFields,
  hasAnySectorFieldValue,
} from "./cargoRegulatory";
import {
  materialPeligrosoSheetHint,
  materialPeligrosoSwitchLock,
} from "./materialPeligrosoSheet";
import { fetchRegulatoryFlagsForSatProductCp } from "@shared/cfdi";

import { V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL } from "@features/trips/domain/v1CargoPlaceholderClient";
import {
  applySingleDeliveryQtyInherit,
  computeCargoDeliveryCoverage,
  formatDeliveryRemainderLine,
} from "../../../utils/cargoDeliveryCoverage";
import { cargoRequiresExplicitDeliveryAssignment } from "../../../utils/tripCargoDeliveryAssignment";
import {
  tripCargoSchema,
  type CargoMovementFormValues,
  type TripCargoFormValues,
} from "./validation";
import { wizardCopy } from "../../../copy";

const sheet = wizardCopy.cargo.sheet;
const formatWeight = wizardCopy.cargo.format.weight;

// ============================================================================
// TYPES
// ============================================================================

export interface CargoSheetPickupStop {
  index: number;
  address: string;
  city: string;
  state?: string;
  clientId?: string;
  clientName?: string;
  locationName?: string;
}

export interface CargoSheetDeliveryStop {
  index: number;
  address: string;
  city: string;
  locationName?: string;
  clientId?: string;
  clientName?: string;
}

export type CargoSheetTripPhase = "draft_or_scheduled" | "in_progress";

export interface CargoMovementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parada `pickup` desde la que se abrió el sheet; `null` mientras está cerrado. */
  pickupStop: CargoSheetPickupStop | null;
  /**
   * Paradas de recogida elegibles en alta (detalle con varios pickups).
   * Si hay más de una y se pasa `onPickupStopChange`, el sheet muestra selector.
   */
  availablePickupStops?: CargoSheetPickupStop[];
  /** Cambia la parada de recogida en alta sin cerrar el sheet. */
  onPickupStopChange?: (stop: CargoSheetPickupStop) => void;
  /** Paradas `delivery` posteriores donde puede asignarse esta carga. */
  availableDeliveryStops: CargoSheetDeliveryStop[];
  /** Si es edición, los valores iniciales; si es alta, `null`. */
  initialValues: TripCargoFormValues | null;
  /** Índice en `cargosFieldArray`; `null` cuando es alta. */
  editingIndex: number | null;
  /** Capacidad del vehículo (kg) — opcional, solo para advertencia proyectada. */
  vehicleCapacityKg: number | null;
  /** Peso de las demás cargas (excluyendo la actual si está editando). */
  baselineWeightKg: number;
  /** Cargas ya registradas en la parada activa. */
  stopCargoCount: number;
  /**
   * Cuando es true, la sección de entregas es solo lectura (p. ej. edit en
   * detalle de viaje con entregas ya completadas en patio).
   */
  deliveriesReadOnly?: boolean;
  /**
   * Muestra el CTA «Agregar entrega». En edición del detalle solo con ≥2
   * paradas descarga (CEO). Default: `!deliveriesReadOnly`.
   */
  allowAddDelivery?: boolean;
  /**
   * Título del toast/alert cuando `onSubmit` rechaza (API).
   * Por defecto usa el copy del sheet de wizard.
   */
  submitErrorTitle?: string;
  /** Fase del viaje — regla bajo el título (C3). Default: reserva. */
  tripPhase?: CargoSheetTripPhase;
  /** Número económico de la unidad para la fila resumen. */
  vehicleUnitNumber?: string | null;
  /**
   * D-PRD-3: bloque «Al confirmar» solo en append mid-trip.
   * La viñeta fiscal se añade si `confirmEffectsIncludeFiscal`.
   */
  showConfirmEffects?: boolean;
  confirmEffectsIncludeFiscal?: boolean;
  /**
   * C6 / D-PRD-2: editar una carga sin movimiento de recogida.
   * Abre «Dónde va» arriba, en ámbar; al guardar el tab hace POST pickup.
   */
  missingPickupMovement?: boolean;
  /** Se llama con los valores validados Zod. Puede ser async (detalle → API). */
  onSubmit: (
    values: TripCargoFormValues,
    editingIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => void | Promise<void>;
}

// ============================================================================
// HELPERS
// ============================================================================

function clearDeclaredHazmat(
  setValue: UseFormSetValue<TripCargoFormValues>,
  shouldDirty: boolean,
) {
  const opts = { shouldDirty } as const;
  setValue("hazardousMaterial", false, opts);
  setValue("hazardousMaterialCode", "", opts);
  setValue("packagingType", "", opts);
  setValue("packagingDescription", "", opts);
}

function buildEmptyCargo(pickupStopIndex: number): TripCargoFormValues {
  return {
    id: undefined,
    clientId: V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
    description: "",
    weight: undefined,
    units: undefined,
    weightInKg: undefined,
    currency: "MXN",
    isInsured: false,
    declaredValue: undefined,
    aseguraCarga: undefined,
    polizaCarga: undefined,
    satProductCode: "",
    satProductDescription: "",
    satUnitCode: "H87",
    satUnitName: "Pieza",
    hazardousMaterial: false,
    requiresHazmat: false,
    hazardousMaterialCode: "",
    packagingType: "",
    packagingDescription: "",
    sectorRequirements: {},
    sectorCofepris: "",
    nombreIngredienteActivo: "",
    nomQuimico: "",
    denominacionGenericaProd: "",
    denominacionDistintivaProd: "",
    fabricante: "",
    fechaCaducidad: "",
    loteMedicamento: "",
    formaFarmaceutica: "",
    condicionesEspTransp: "",
    registroSanitarioFolioAutorizacion: "",
    permisoImportacion: "",
    folioImpoVucem: "",
    numCas: "",
    razonSocialEmpImp: "",
    numRegSanPlagCofepris: "",
    datosFabricante: "",
    datosFormulador: "",
    datosMaquilador: "",
    usoAutorizado: "",
    movements: [{ stopIndex: pickupStopIndex, movementType: "pickup" }],
    notes: "",
    specialInstructions: "",
  };
}

function buildEditDefaults(cargo: TripCargoFormValues): TripCargoFormValues {
  return {
    ...cargo,
    currency: cargo.currency || "MXN",
    requiresHazmat: cargo.requiresHazmat ?? false,
    sectorRequirements: cargo.sectorRequirements ?? {},
    sectorCofepris: cargo.sectorCofepris ?? "",
    nombreIngredienteActivo: cargo.nombreIngredienteActivo ?? "",
    nomQuimico: cargo.nomQuimico ?? "",
    denominacionGenericaProd: cargo.denominacionGenericaProd ?? "",
    denominacionDistintivaProd: cargo.denominacionDistintivaProd ?? "",
    fabricante: cargo.fabricante ?? "",
    fechaCaducidad: cargo.fechaCaducidad ?? "",
    loteMedicamento: cargo.loteMedicamento ?? "",
    formaFarmaceutica: cargo.formaFarmaceutica ?? "",
    condicionesEspTransp: cargo.condicionesEspTransp ?? "",
    registroSanitarioFolioAutorizacion: cargo.registroSanitarioFolioAutorizacion ?? "",
    permisoImportacion: cargo.permisoImportacion ?? "",
    folioImpoVucem: cargo.folioImpoVucem ?? "",
    numCas: cargo.numCas ?? "",
    razonSocialEmpImp: cargo.razonSocialEmpImp ?? "",
    numRegSanPlagCofepris: cargo.numRegSanPlagCofepris ?? "",
    datosFabricante: cargo.datosFabricante ?? "",
    datosFormulador: cargo.datosFormulador ?? "",
    datosMaquilador: cargo.datosMaquilador ?? "",
    usoAutorizado: cargo.usoAutorizado ?? "",
  };
}

function collectFormErrorMessages(
  errors: Record<string, { message?: string } | undefined>,
): string[] {
  const messages: string[] = [];
  const seen = new Set<string>();
  for (const key of Object.keys(errors)) {
    const msg = errors[key]?.message;
    if (typeof msg === "string" && msg.length > 0 && !seen.has(msg)) {
      seen.add(msg);
      messages.push(msg);
    }
  }
  return messages;
}

// ============================================================================
// COMPONENT
// ============================================================================

function initialDeliveryAssignments(
  initialValues: TripCargoFormValues | null | undefined,
): CargoMovementFormValues[] {
  if (!initialValues) return [];
  // Herencia D-F7-8 no se escribe en el estado: cobertura + buildResult.
  // Prefill en inputs rompería edición de totales de mercancía con delivery vacío.
  return (initialValues.movements ?? []).filter(
    (m) => m.movementType === "delivery",
  );
}

function CargoMovementSheetSession({
  onOpenChange,
  pickupStop,
  availablePickupStops,
  onPickupStopChange,
  availableDeliveryStops,
  initialValues,
  editingIndex,
  vehicleCapacityKg,
  baselineWeightKg,
  stopCargoCount,
  deliveriesReadOnly = false,
  allowAddDelivery: allowAddDeliveryProp,
  submitErrorTitle,
  tripPhase = "draft_or_scheduled",
  vehicleUnitNumber = null,
  showConfirmEffects = false,
  confirmEffectsIncludeFiscal = false,
  missingPickupMovement = false,
  onSubmit,
  onSubmittingChange,
}: Omit<CargoMovementSheetProps, "open"> & {
  onSubmittingChange: (submitting: boolean) => void;
}) {
  const allowAddDelivery =
    allowAddDeliveryProp ?? !deliveriesReadOnly;
  /** F5d-c: ≥2 descargas disponibles → delivery obligatorio (F5a 1 unload intacto). */
  const requiresDeliveryAssignment = availableDeliveryStops.length >= 2;
  /** C7.1: una sola descarga → fila solo lectura (sin editores ni Agregar). */
  const singleUnloadReadOnly =
    availableDeliveryStops.length === 1 && !requiresDeliveryAssignment;
  const { error: showErrorToast, toast } = useToast();
  const { submissionError, showOverlayError, clearOverlayError } =
    useOverlayMutationFeedback({
      errorTitle: submitErrorTitle ?? sheet.toast.saveErrorTitle,
      seeInlineCopy: sheet.toast.saveErrorSeeInline,
      toast,
    });
  const catalogRequirementRef = useRef<MaterialPeligrosoCatalogRequirement | null>(
    null,
  );
  const [catalogRequirement, setCatalogRequirement] =
    useState<MaterialPeligrosoCatalogRequirement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deliveryStopError, setDeliveryStopError] = useState<string | null>(
    null,
  );
  const [deliveryCoverageError, setDeliveryCoverageError] = useState<
    string | null
  >(null);
  const [errorSection, setErrorSection] = useState<CargoSheetErrorSection | null>(
    null,
  );

  const setSubmitting = useCallback(
    (next: boolean) => {
      setIsSubmitting(next);
      onSubmittingChange(next);
    },
    [onSubmittingChange],
  );

  const defaultValues = useMemo<TripCargoFormValues>(() => {
    if (initialValues) return buildEditDefaults(initialValues);
    return buildEmptyCargo(pickupStop?.index ?? 0);
  }, [initialValues, pickupStop]);

  const form = useForm<TripCargoFormValues>({
    // `tripCargoSchema` usa `.default()` en varios campos (currency, isInsured,
    // hazardousMaterial, …) lo que provoca que el tipo de **input** del schema sea
    // distinto al de salida (`TripCargoFormValues`). El cast del resolver es la
    // práctica recomendada por `@hookform/resolvers/zod` en ese escenario.
    resolver: zodResolver(tripCargoSchema) as Resolver<TripCargoFormValues>,
    defaultValues,
    mode: "onChange",
    shouldUnregister: false,
  });
  const { control, handleSubmit, setValue, getValues, reset, formState } = form;

  const applyMaterialPeligrosoRequirement = useCallback(
    (
      requirement: MaterialPeligrosoCatalogRequirement | null,
      mode: "choose" | "sync" | "clear",
    ) => {
      catalogRequirementRef.current = requirement;
      setCatalogRequirement(requirement);

      if (requirement == null) {
        setValue("requiresHazmat", false, {
          shouldDirty: mode !== "sync",
        });
        return;
      }

      setValue("requiresHazmat", requirement === "declare_required_si", {
        shouldDirty: mode === "choose",
      });

      const lock = materialPeligrosoSwitchLock(requirement);
      if (lock === "on") {
        setValue("hazardousMaterial", true, { shouldDirty: true });
        return;
      }
      if (lock === "off") {
        clearDeclaredHazmat(setValue, true);
        return;
      }
      // Marca 0,1 recién elegida: arranca apagada. Al reabrir, se conserva.
      if (mode === "choose" && requirement === "declare_optional") {
        clearDeclaredHazmat(setValue, true);
      }
    },
    [setValue],
  );

  const pickupStopIndex = pickupStop?.index ?? 0;

  // Estado fuera del schema: entregas posteriores
  const [deliveryAssignments, setDeliveryAssignments] = useState(
    () => initialDeliveryAssignments(initialValues),
  );
  const [showSummary, setShowSummary] = useState(false);

  // Al cambiar pickup en alta, descarta entregas que ya no son posteriores.
  useEffect(() => {
    if (deliveriesReadOnly) return;
    setDeliveryAssignments((prev) =>
      prev.map((assignment) =>
        assignment.stopIndex >= 0 && assignment.stopIndex <= pickupStopIndex
          ? { ...assignment, stopIndex: -1 }
          : assignment,
      ),
    );
  }, [deliveriesReadOnly, pickupStopIndex]);

  // ============================================================================
  // Watchers
  // ============================================================================

  const satProductCode = useWatch({ control, name: "satProductCode" });
  const satUnitCode = useWatch({ control, name: "satUnitCode" }) ?? "";
  const satUnitNameWatch = useWatch({ control, name: "satUnitName" });
  const descriptionWatch = useWatch({ control, name: "description" });
  const isInsured = useWatch({ control, name: "isInsured" });
  const insurerName = useWatch({ control, name: "aseguraCarga" });
  const polizaWatch = useWatch({ control, name: "polizaCarga" });
  const notesValue = useWatch({ control, name: "notes" });
  const specialInstructionsValue = useWatch({
    control,
    name: "specialInstructions",
  });
  const hazardousMaterial = useWatch({ control, name: "hazardousMaterial" });
  const sectorRequirements = useWatch({ control, name: "sectorRequirements" });
  const weightInKgWatch = useWatch({ control, name: "weightInKg" });
  const unitsWatch = useWatch({ control, name: "units" });
  const sectorValues = useWatch({
    control,
    name: [
      "sectorCofepris",
      "nombreIngredienteActivo",
      "nomQuimico",
      "denominacionGenericaProd",
      "denominacionDistintivaProd",
      "fabricante",
      "fechaCaducidad",
      "loteMedicamento",
      "formaFarmaceutica",
      "condicionesEspTransp",
      "registroSanitarioFolioAutorizacion",
      "permisoImportacion",
      "folioImpoVucem",
      "numCas",
      "razonSocialEmpImp",
      "numRegSanPlagCofepris",
      "datosFabricante",
      "datosFormulador",
      "datosMaquilador",
      "usoAutorizado",
    ],
  });

  const hasSectorData = useMemo(() => {
    const hasAnyFlag = Object.values(sectorRequirements ?? {}).some(Boolean);
    const [
      sectorCofepris,
      nombreIngredienteActivo,
      nomQuimico,
      denominacionGenericaProd,
      denominacionDistintivaProd,
      fabricante,
      fechaCaducidad,
      loteMedicamento,
      formaFarmaceutica,
      condicionesEspTransp,
      registroSanitarioFolioAutorizacion,
      permisoImportacion,
      folioImpoVucem,
      numCas,
      razonSocialEmpImp,
      numRegSanPlagCofepris,
      datosFabricante,
      datosFormulador,
      datosMaquilador,
      usoAutorizado,
    ] = sectorValues ?? [];
    const hasAnyValue = hasAnySectorFieldValue({
      sectorCofepris,
      nombreIngredienteActivo,
      nomQuimico,
      denominacionGenericaProd,
      denominacionDistintivaProd,
      fabricante,
      fechaCaducidad,
      loteMedicamento,
      formaFarmaceutica,
      condicionesEspTransp,
      registroSanitarioFolioAutorizacion,
      permisoImportacion,
      folioImpoVucem,
      numCas,
      razonSocialEmpImp,
      numRegSanPlagCofepris,
      datosFabricante,
      datosFormulador,
      datosMaquilador,
      usoAutorizado,
    });
    return hasAnyFlag || hasAnyValue;
  }, [sectorRequirements, sectorValues]);

  /** Requisitos siempre visibles (plegable); se abre con datos / hazmat / sector. */
  const requirementsDefaultOpen =
    hasSectorData ||
    !!hazardousMaterial ||
    !!initialValues?.hazardousMaterial ||
    catalogRequirement === "declare_required_si";

  const missingSectorFields = useMemo(() => {
    const [
      sectorCofepris,
      nombreIngredienteActivo,
      nomQuimico,
      denominacionGenericaProd,
      denominacionDistintivaProd,
      fabricante,
      fechaCaducidad,
      loteMedicamento,
      formaFarmaceutica,
      condicionesEspTransp,
      registroSanitarioFolioAutorizacion,
      permisoImportacion,
      folioImpoVucem,
      numCas,
      razonSocialEmpImp,
      numRegSanPlagCofepris,
      datosFabricante,
      datosFormulador,
      datosMaquilador,
      usoAutorizado,
    ] = sectorValues ?? [];
    return getMissingSectorRequiredFields({
      requirements: sectorRequirements,
      values: {
        sectorCofepris,
        nombreIngredienteActivo,
        nomQuimico,
        denominacionGenericaProd,
        denominacionDistintivaProd,
        fabricante,
        fechaCaducidad,
        loteMedicamento,
        formaFarmaceutica,
        condicionesEspTransp,
        registroSanitarioFolioAutorizacion,
        permisoImportacion,
        folioImpoVucem,
        numCas,
        razonSocialEmpImp,
        numRegSanPlagCofepris,
        datosFabricante,
        datosFormulador,
        datosMaquilador,
        usoAutorizado,
      },
    });
  }, [sectorRequirements, sectorValues]);

  // Clave con la que se abrió el sheet. La misma → sync (no apaga un 0,1 ya
  // encendido). Otra → choose. No vive en un ref del efecto: en StrictMode el
  // primer pase se cancela y el segundo tiene que aplicar el mismo resultado.
  const openedProductCode = (initialValues?.satProductCode ?? "").trim();

  // Hidrata la marca de material peligroso y, si aún no hay, los flags de sector.
  // El buscador no clasifica: un hit sin metadata no puede dejar `unknown`.
  useEffect(() => {
    const code = satProductCode?.trim();
    if (!code) {
      catalogRequirementRef.current = null;
      setCatalogRequirement(null);
      return;
    }

    catalogRequirementRef.current = null;
    setCatalogRequirement(null);

    let cancelled = false;
    void (async () => {
      try {
        const flags = await fetchRegulatoryFlagsForSatProductCp(code);
        if (cancelled) return;
        if (getValues("satProductCode")?.trim() !== code) return;
        applyMaterialPeligrosoRequirement(
          flags.materialPeligrosoRequirement,
          code === openedProductCode ? "sync" : "choose",
        );
        const stillEmpty = !Object.values(
          getValues("sectorRequirements") ?? {},
        ).some(Boolean);
        if (!stillEmpty) return;
        setValue(
          "sectorRequirements",
          {
            ...(getValues("sectorRequirements") ?? {}),
            ...flags.sectorRequirements,
          },
          { shouldDirty: true },
        );
      } catch {
        // Sin respuesta del catálogo no hay marca: el aviso no se inventa.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    satProductCode,
    openedProductCode,
    getValues,
    setValue,
    applyMaterialPeligrosoRequirement,
  ]);

  // ============================================================================
  // Capacity projection
  // ============================================================================

  const hasCapacity = vehicleCapacityKg != null && vehicleCapacityKg > 0;
  const availableKg = hasCapacity ? vehicleCapacityKg - baselineWeightKg : null;
  const projectedWeight =
    baselineWeightKg + (typeof weightInKgWatch === "number" ? weightInKgWatch : 0);
  const wouldExceedCapacity =
    hasCapacity &&
    typeof weightInKgWatch === "number" &&
    weightInKgWatch > 0 &&
    projectedWeight > vehicleCapacityKg;
  const isNearCapacityProjection =
    hasCapacity &&
    typeof weightInKgWatch === "number" &&
    weightInKgWatch > 0 &&
    !wouldExceedCapacity &&
    projectedWeight / vehicleCapacityKg >= 0.9;

  // ============================================================================
  // Delivery assignments handlers
  // ============================================================================

  const handleAddDelivery = () => {
    setDeliveryAssignments((prev) => [
      ...prev,
      { stopIndex: -1, movementType: "delivery" as const },
    ]);
  };

  const handleUpdateDelivery = (
    index: number,
    field: keyof CargoMovementFormValues,
    value: string | number | undefined,
  ) => {
    setDeliveryAssignments((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d)),
    );
    if (field === "stopIndex" && typeof value === "number" && value >= 0) {
      setDeliveryStopError(null);
    }
    if (field === "weight" || field === "units") {
      setDeliveryCoverageError(null);
    }
  };

  const handleRemoveDelivery = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
    setDeliveryCoverageError(null);
  };

  const explicitDeliveries = useMemo(
    () => deliveryAssignments.filter((assignment) => assignment.stopIndex >= 0),
    [deliveryAssignments],
  );

  const deliveryCoverage = useMemo(() => {
    const cargoWeightKg =
      typeof weightInKgWatch === "number" && weightInKgWatch > 0
        ? weightInKgWatch
        : null;
    const cargoUnits =
      typeof unitsWatch === "number" && unitsWatch > 0 ? unitsWatch : null;
    // D-F7-8: 1 delivery vacío cuenta como cobertura 100 % (misma herencia).
    const deliveriesForCoverage = applySingleDeliveryQtyInherit({
      cargoWeightKg,
      cargoUnits,
      deliveries: explicitDeliveries,
    });
    return computeCargoDeliveryCoverage({
      cargoWeightKg,
      cargoUnits,
      deliveries: deliveriesForCoverage,
    });
  }, [explicitDeliveries, unitsWatch, weightInKgWatch]);

  const underAllocatedRemainderLine =
    deliveryCoverage.status === "under"
      ? formatDeliveryRemainderLine(
          deliveryCoverage.pendingWeight,
          deliveryCoverage.pendingUnits,
        )
      : "";

  const overAllocatedRemainderLine =
    deliveryCoverage.status === "over"
      ? formatDeliveryRemainderLine(
          deliveryCoverage.excessWeight,
          deliveryCoverage.excessUnits,
        )
      : "";

  useEffect(() => {
    if (deliveryCoverage.status !== "over") {
      setDeliveryCoverageError(null);
    }
  }, [deliveryCoverage.status]);

  const resolveOverAllocationMessage = useCallback((): string | null => {
    if (deliveryCoverage.status !== "over") return null;
    const messages: string[] = [];
    if (
      deliveryCoverage.excessWeight != null &&
      deliveryCoverage.cargoWeight != null
    ) {
      messages.push(
        sheet.validation.deliveryWeightExceeded(
          deliveryCoverage.allocatedWeight,
          deliveryCoverage.cargoWeight,
        ),
      );
    }
    if (
      deliveryCoverage.excessUnits != null &&
      deliveryCoverage.cargoUnits != null
    ) {
      messages.push(
        sheet.validation.deliveryUnitsExceeded(
          deliveryCoverage.allocatedUnits,
          deliveryCoverage.cargoUnits,
        ),
      );
    }
    return messages[0] ?? sheet.alert.overAllocatedTitle;
  }, [deliveryCoverage]);

  const handleHazmatChange = useCallback(
    (checked: boolean) => {
      const lock = materialPeligrosoSwitchLock(catalogRequirementRef.current);
      if (lock === "on" && !checked) {
        showErrorToast(
          sheet.toast.hazmatRequiredTitle,
          sheet.toast.hazmatRequiredBody,
        );
        return;
      }
      if (lock != null) return;
      setValue("hazardousMaterial", checked, { shouldDirty: true });
      if (!checked) {
        setValue("hazardousMaterialCode", "", { shouldDirty: true });
        setValue("packagingType", "", { shouldDirty: true });
        setValue("packagingDescription", "", { shouldDirty: true });
      }
    },
    [setValue, showErrorToast],
  );

  // ============================================================================
  // Submit
  // ============================================================================

  const hasIncompleteDeliveries = useCallback(
    () =>
      !deliveriesReadOnly &&
      deliveryAssignments.some((assignment) => assignment.stopIndex < 0),
    [deliveriesReadOnly, deliveryAssignments],
  );

  /** Hard F5d-c: unload≥2 y 0 deliveries válidos (predicados del paquete). */
  const hasMissingRequiredDelivery = useCallback(() => {
    if (deliveriesReadOnly || !requiresDeliveryAssignment) return false;
    const draftMovements = [
      { stopIndex: pickupStopIndex, movementType: "pickup" as const },
      ...deliveryAssignments
        .filter((assignment) => assignment.stopIndex >= 0)
        .map((assignment) => ({
          stopIndex: assignment.stopIndex,
          movementType: "delivery" as const,
        })),
    ];
    return cargoRequiresExplicitDeliveryAssignment({
      unloadCount: availableDeliveryStops.length,
      cargo: { status: "pending", movements: draftMovements },
    });
  }, [
    availableDeliveryStops.length,
    deliveryAssignments,
    deliveriesReadOnly,
    pickupStopIndex,
    requiresDeliveryAssignment,
  ]);

  const focusSectionField = useCallback(
    (section: CargoSheetErrorSection, deliveryErr: string | null) => {
      const fieldId = focusFieldIdForCargoSheetSection(section, {
        missingPickup: missingPickupMovement,
        hasDeliveryStopError: Boolean(deliveryErr),
      });
      requestAnimationFrame(() => {
        const el = document.getElementById(fieldId);
        if (el && "focus" in el && typeof el.focus === "function") {
          (el as HTMLElement).focus();
        }
      });
    },
    [missingPickupMovement],
  );

  const openSectionForError = useCallback((section: CargoSheetErrorSection) => {
    setErrorSection(section);
  }, []);

  const buildResult = useCallback(
    (values: TripCargoFormValues): TripCargoFormValues => {
      const pickupMovement: CargoMovementFormValues = {
        stopIndex: pickupStopIndex,
        movementType: "pickup",
      };
      const cargoWeightKg = values.weightInKg ?? values.weight;
      const explicit = deliveryAssignments
        .filter((d) => d.stopIndex >= 0)
        .map((d) => ({
          stopIndex: d.stopIndex,
          movementType: "delivery" as const,
          weight: d.weight,
          units: d.units,
          notes: d.notes,
        }));
      // D-F7-8: al persistir, 1 delivery vacío hereda totales.
      const validDeliveries = applySingleDeliveryQtyInherit({
        cargoWeightKg,
        cargoUnits: values.units,
        deliveries: explicit,
      });
      const requirement = catalogRequirementRef.current;
      // Marca 0: no persistir el interruptor ni la clave/embalaje.
      const persistHazmat =
        requirement === "omit" ? false : Boolean(values.hazardousMaterial);
      const requiresHazmat =
        requirement === "declare_required_si"
          ? true
          : requirement == null
            ? Boolean(values.requiresHazmat)
            : false;
      return {
        ...values,
        clientId: V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
        movements: [pickupMovement, ...validDeliveries],
        // Asegurar coherencia weight ↔ weightInKg (legacy)
        weight: values.weightInKg ?? values.weight,
        // Cuando no está asegurada, limpiar campos de seguro
        declaredValue: values.isInsured ? values.declaredValue : undefined,
        aseguraCarga: values.isInsured ? values.aseguraCarga : undefined,
        polizaCarga: values.isInsured ? values.polizaCarga : undefined,
        hazardousMaterial: persistHazmat,
        requiresHazmat,
        hazardousMaterialCode: persistHazmat
          ? values.hazardousMaterialCode
          : undefined,
        packagingType: persistHazmat ? values.packagingType : undefined,
        packagingDescription: persistHazmat
          ? values.packagingDescription
          : undefined,
      };
    },
    [deliveryAssignments, pickupStopIndex],
  );

  const runValidatedSubmit = useCallback(
    async (
      values: TripCargoFormValues,
      options?: { keepOpen?: boolean },
    ) => {
      if (isSubmitting) return;
      if (hasIncompleteDeliveries()) {
        const msg = sheet.validation.deliveryStopRequired;
        setDeliveryStopError(msg);
        openSectionForError("donde_va");
        focusSectionField("donde_va", msg);
        setShowSummary(true);
        return;
      }
      if (hasMissingRequiredDelivery()) {
        const msg = sheet.validation.deliveryAssignmentRequired;
        setDeliveryStopError(msg);
        openSectionForError("donde_va");
        focusSectionField("donde_va", msg);
        setShowSummary(true);
        return;
      }
      const overMessage = resolveOverAllocationMessage();
      if (overMessage) {
        setDeliveryCoverageError(overMessage);
        openSectionForError("donde_va");
        focusSectionField("donde_va", null);
        setShowSummary(true);
        return;
      }
      setDeliveryStopError(null);
      setDeliveryCoverageError(null);
      setErrorSection(null);
      clearOverlayError();
      setSubmitting(true);
      try {
        await onSubmit(
          buildResult(values),
          options?.keepOpen ? null : editingIndex,
          options,
        );
        if (options?.keepOpen) {
          reset(buildEmptyCargo(pickupStopIndex));
          setDeliveryAssignments([]);
          setShowSummary(false);
        } else {
          onOpenChange(false);
        }
      } catch (error) {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : sheet.toast.saveErrorTitle;
        showOverlayError(message);
      } finally {
        setSubmitting(false);
      }
    },
    [
      buildResult,
      clearOverlayError,
      editingIndex,
      focusSectionField,
      hasIncompleteDeliveries,
      hasMissingRequiredDelivery,
      isSubmitting,
      onOpenChange,
      onSubmit,
      openSectionForError,
      pickupStopIndex,
      reset,
      resolveOverAllocationMessage,
      setSubmitting,
      showOverlayError,
    ],
  );

  const applyDeliveryValidationOnInvalid = (
    formErrors: Record<string, unknown>,
  ) => {
    let nextDeliveryError: string | null = null;
    if (hasIncompleteDeliveries()) {
      nextDeliveryError = sheet.validation.deliveryStopRequired;
      setDeliveryStopError(nextDeliveryError);
    } else if (hasMissingRequiredDelivery()) {
      nextDeliveryError = sheet.validation.deliveryAssignmentRequired;
      setDeliveryStopError(nextDeliveryError);
    }
    const section = resolveCargoSheetErrorSection({
      formErrors,
      deliveryStopError: nextDeliveryError,
      deliveryCoverageError,
      missingPickup: missingPickupMovement,
    });
    if (section) {
      openSectionForError(section);
      focusSectionField(section, nextDeliveryError);
    }
    setShowSummary(true);
  };

  const submitSheet = handleSubmit(
    async (values) => {
      await runValidatedSubmit(values);
    },
    (errors) =>
      applyDeliveryValidationOnInvalid(
        errors as Record<string, unknown>,
      ),
  );

  /** Guarda la carga y deja el sheet listo para la siguiente de la misma parada. */
  const handleAddAnother = () => {
    void handleSubmit(
      async (values) => {
        await runValidatedSubmit(values, { keepOpen: true });
      },
      (errors) =>
        applyDeliveryValidationOnInvalid(
          errors as Record<string, unknown>,
        ),
    )();
  };

  const summaryMessages = useMemo(() => {
    const zodMessages = collectFormErrorMessages(
      formState.errors as Record<string, { message?: string } | undefined>,
    );
    const extras = [deliveryStopError, deliveryCoverageError].filter(
      (message): message is string => Boolean(message),
    );
    const merged = [...zodMessages];
    for (const message of extras) {
      if (!merged.includes(message)) merged.push(message);
    }
    return merged;
  }, [deliveryCoverageError, deliveryStopError, formState.errors]);
  const isSummaryVisible = showSummary && summaryMessages.length > 0;

  const hazmatErrorMessage = formState.errors.hazardousMaterial?.message;
  const catalogHint =
    catalogRequirement != null
      ? materialPeligrosoSheetHint(catalogRequirement, !!hazardousMaterial)
      : null;
  const hazmatSwitchDisabled =
    materialPeligrosoSwitchLock(catalogRequirement) != null;
  const hazmatDescribedBy =
    [
      catalogHint ? "cargo-hazmat-catalog-hint" : null,
      hazmatErrorMessage ? "cargo-hazmat-checkbox-error" : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  const hasNotes =
    Boolean(notesValue?.trim()) || Boolean(specialInstructionsValue?.trim());

  const pickupLugar =
    pickupStop?.locationName?.trim() ||
    pickupStop?.address?.trim() ||
    "";
  const pickupN = pickupStop ? pickupStop.index + 1 : 0;

  const headerContextLine =
    editingIndex !== null
      ? sheet.context.editSummary(
          (descriptionWatch || initialValues?.description || "Carga").trim(),
          String(unitsWatch ?? initialValues?.units ?? "—"),
          (satUnitNameWatch || satUnitCode || initialValues?.satUnitName || "uds").trim(),
          String(
            typeof weightInKgWatch === "number"
              ? weightInKgWatch
              : (initialValues?.weightInKg ?? "—"),
          ),
        )
      : pickupStop
        ? sheet.context.seCargaEn(pickupN, pickupLugar)
        : null;

  const phaseRuleText =
    tripPhase === "in_progress"
      ? sheet.phaseRule.inProgress
      : editingIndex !== null
        ? sheet.phaseRule.draftOrScheduled.edit
        : sheet.phaseRule.draftOrScheduled.create;

  const pickupStopCount = availablePickupStops?.length ?? (pickupStop ? 1 : 0);
  const canChoosePickup =
    Boolean(onPickupStopChange) && pickupStopCount > 1;

  const firstDeliveryStop =
    explicitDeliveries.length > 0
      ? availableDeliveryStops.find(
          (s) => s.index === explicitDeliveries[0]!.stopIndex,
        )
      : availableDeliveryStops.length === 1
        ? availableDeliveryStops[0]
        : undefined;

  const whereSummary = (() => {
    if (missingPickupMovement || !pickupStop) {
      return sheet.sectionSummary.whereMissingPickup;
    }
    if (explicitDeliveries.length > 1) {
      return sheet.sectionSummary.whereMulti(
        pickupN,
        pickupLugar,
        explicitDeliveries.length,
      );
    }
    if (firstDeliveryStop) {
      const deliveryLugar =
        firstDeliveryStop.locationName?.trim() ||
        firstDeliveryStop.address.trim();
      return sheet.sectionSummary.whereOk(
        pickupN,
        pickupLugar,
        firstDeliveryStop.index + 1,
        deliveryLugar,
      );
    }
    return sheet.sectionSummary.deliveriesNone;
  })();

  const whereTone =
    errorSection === "donde_va"
      ? "destructive"
      : missingPickupMovement
        ? "warning"
        : "default";

  const showWhereSection =
    Boolean(pickupStop) ||
    availableDeliveryStops.length > 0 ||
    missingPickupMovement ||
    canChoosePickup;

  const whereBeforeProduct =
    editingIndex !== null && missingPickupMovement;

  const whereDefaultOpen =
    missingPickupMovement ||
    deliveriesReadOnly ||
    !allowAddDelivery ||
    requiresDeliveryAssignment ||
    canChoosePickup ||
    initialDeliveryAssignments(initialValues).length > 0;

  const pickupRowLabel = pickupStop
    ? `${pickupStop.index + 1} · ${
        pickupStop.locationName?.trim() ||
        pickupStop.address.trim() ||
        pickupStop.city
      }`
    : "";

  const assignedMeterLabel = (() => {
    if (
      deliveryCoverage.status !== "ok" &&
      deliveryCoverage.status !== "under" &&
      deliveryCoverage.status !== "over"
    ) {
      return null;
    }
    const unitLabel = (satUnitNameWatch || satUnitCode || "uds").trim();
    const cargoUnits =
      typeof unitsWatch === "number" && unitsWatch > 0 ? unitsWatch : 0;
    const cargoWeight =
      typeof weightInKgWatch === "number" && weightInKgWatch > 0
        ? weightInKgWatch
        : 0;
    return sheet.format.assignedMeter(
      String(deliveryCoverage.allocatedUnits),
      String(cargoUnits),
      unitLabel,
      Math.round(deliveryCoverage.allocatedWeight).toLocaleString("es-MX"),
      Math.round(cargoWeight).toLocaleString("es-MX"),
    );
  })();

  const assignedMeterPct = (() => {
    if (
      deliveryCoverage.status !== "ok" &&
      deliveryCoverage.status !== "under" &&
      deliveryCoverage.status !== "over"
    ) {
      return 0;
    }
    const cargoUnits =
      typeof unitsWatch === "number" && unitsWatch > 0 ? unitsWatch : null;
    const cargoWeight =
      typeof weightInKgWatch === "number" && weightInKgWatch > 0
        ? weightInKgWatch
        : null;
    if (cargoUnits != null && cargoUnits > 0) {
      return Math.min(
        100,
        Math.round((deliveryCoverage.allocatedUnits / cargoUnits) * 100),
      );
    }
    if (cargoWeight != null && cargoWeight > 0) {
      return Math.min(
        100,
        Math.round((deliveryCoverage.allocatedWeight / cargoWeight) * 100),
      );
    }
    return 0;
  })();

  const requirementsSummary = hazardousMaterial
    ? sheet.label.isHazmat
    : hasSectorData
      ? sheet.hint.requirements
      : sheet.sectionSummary.requirementsNone;

  const confirmEffectItems = useMemo(() => {
    if (!showConfirmEffects || !pickupStop) return [] as string[];
    const delivery =
      firstDeliveryStop ??
      (availableDeliveryStops.length > 0 ? availableDeliveryStops[0] : null);
    if (!delivery) return [] as string[];
    const items = [
      sheet.effects.routeLine(
        pickupN,
        pickupLugar,
        delivery.index + 1,
        delivery.locationName?.trim() || delivery.address.trim(),
      ),
    ];
    if (confirmEffectsIncludeFiscal) {
      items.push(sheet.effects.fiscalLine);
    }
    return items;
  }, [
    availableDeliveryStops,
    confirmEffectsIncludeFiscal,
    firstDeliveryStop,
    pickupLugar,
    pickupN,
    pickupStop,
    showConfirmEffects,
  ]);

  // ============================================================================
  // Render
  // ============================================================================

  return (
      <SheetContent
        side="right"
        className={cn(CARGO_SHEET_CONTENT_CLASS, "gap-0 p-0")}
        onFocusOutside={(e) => e.preventDefault()}
      >
        <SheetHeader
          className={cn(
            TRACKING_SHEET_HEADER_CLASS,
            "space-y-1.5 border-b px-6 py-4",
          )}
        >
          {headerContextLine ? (
            <p className="min-w-0 truncate text-xs text-muted-foreground">
              {headerContextLine}
            </p>
          ) : null}
          <SheetTitle className="pr-8">
            {editingIndex !== null ? sheet.title.edit : sheet.title.create}
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            {phaseRuleText}
          </SheetDescription>
        </SheetHeader>

        <div className={cn(TRACKING_SHEET_BODY_CLASS, "px-6")}>
          <CargoMovementSheetPickupContext
            stopCargoCount={stopCargoCount}
            availableKg={availableKg}
            vehicleUnitNumber={vehicleUnitNumber}
          />

          {(() => {
            const productBlock = (
              <CargoMovementSheetProductSection
                control={control}
                setValue={setValue}
                getValues={getValues}
                className={
                  errorSection === "producto"
                    ? "border-destructive/60 bg-destructive/5"
                    : undefined
                }
              />
            );
            const quantityBlock = (
              <CargoMovementSheetQuantityWeightSection
                control={control}
                setValue={setValue}
                wouldExceedCapacity={wouldExceedCapacity}
                isNearCapacityProjection={isNearCapacityProjection}
                vehicleCapacityKg={vehicleCapacityKg ?? undefined}
                vehicleUnitNumber={vehicleUnitNumber}
                projectedWeight={projectedWeight}
                availableKg={availableKg}
                formatWeight={formatWeight}
                className={
                  errorSection === "cantidades"
                    ? "border-destructive/60 bg-destructive/5"
                    : undefined
                }
              />
            );
            const whereBlock = showWhereSection ? (
              <CargoOptionalSection
                title={sheet.section.where}
                icon={<MapPin className="h-4 w-4" />}
                summary={whereSummary}
                defaultOpen={whereDefaultOpen}
                forceOpen={
                  missingPickupMovement || errorSection === "donde_va"
                }
                tone={whereTone}
              >
                <CargoWhereSection
                  pickupStop={pickupStop}
                  availablePickupStops={availablePickupStops}
                  onPickupStopChange={onPickupStopChange}
                  canChoosePickup={canChoosePickup}
                  missingPickupMovement={missingPickupMovement}
                  pickupRowLabel={pickupRowLabel}
                  availableDeliveryStops={availableDeliveryStops}
                  deliveryAssignments={deliveryAssignments}
                  deliveriesReadOnly={deliveriesReadOnly}
                  allowAddDelivery={allowAddDelivery}
                  singleUnloadReadOnly={singleUnloadReadOnly}
                  requiresDeliveryAssignment={requiresDeliveryAssignment}
                  isSubmitting={isSubmitting}
                  deliveryStopError={deliveryStopError}
                  underAllocatedRemainderLine={underAllocatedRemainderLine}
                  overAllocatedRemainderLine={overAllocatedRemainderLine}
                  deliveryCoverageStatus={deliveryCoverage.status}
                  assignedMeterLabel={assignedMeterLabel}
                  assignedMeterPct={assignedMeterPct}
                  unitsLabel={(satUnitNameWatch || satUnitCode || "uds").trim()}
                  cargoUnits={
                    typeof unitsWatch === "number" ? unitsWatch : undefined
                  }
                  cargoWeightKg={
                    typeof weightInKgWatch === "number"
                      ? weightInKgWatch
                      : undefined
                  }
                  formatWeight={formatWeight}
                  onAddDelivery={handleAddDelivery}
                  onUpdateDelivery={handleUpdateDelivery}
                  onRemoveDelivery={handleRemoveDelivery}
                />
              </CargoOptionalSection>
            ) : null;

            return whereBeforeProduct ? (
              <>
                {whereBlock}
                {productBlock}
                {quantityBlock}
              </>
            ) : (
              <>
                {productBlock}
                {quantityBlock}
                {whereBlock}
              </>
            );
          })()}

          {/* ========== REQUISITOS (C8: hazmat primero) ========== */}
          <CargoOptionalSection
            title={sheet.section.requirements}
            summary={requirementsSummary}
            defaultOpen={requirementsDefaultOpen}
            forceOpen={
              // C5/C8: se abre sola cuando el catálogo exige hazmat (defaultOpen
              // solo aplica al montar; el fetch del catálogo llega después).
              requirementsDefaultOpen || errorSection === "requisitos"
            }
            tone={errorSection === "requisitos" ? "destructive" : "default"}
          >
            <CargoProductRequirementsSection
              control={control}
              sectorRequirements={sectorRequirements}
              missingSectorFields={missingSectorFields}
              showHazmatFields={!!hazardousMaterial}
              hazardousMaterial={!!hazardousMaterial}
              hazmatSwitchDisabled={hazmatSwitchDisabled}
              onHazmatChange={handleHazmatChange}
              hazmatErrorMessage={hazmatErrorMessage}
              hazmatDescribedBy={hazmatDescribedBy}
              catalogHint={catalogHint}
              catalogRequirementUnknown={catalogRequirement === "unknown"}
            />
          </CargoOptionalSection>

          {/* ========== SEGURO ========== */}
          <CargoOptionalSection
            title={sheet.section.insurance}
            icon={<ShieldCheck className="h-4 w-4" />}
            summary={
              isInsured
                ? sheet.sectionSummary.insuranceOn(
                    insurerName || undefined,
                    polizaWatch || undefined,
                  )
                : sheet.sectionSummary.insuranceOff
            }
            defaultOpen={!!initialValues?.isInsured}
            forceOpen={errorSection === "seguro"}
            tone={errorSection === "seguro" ? "destructive" : "default"}
          >
            <Controller
              control={control}
              name="isInsured"
              render={({ field }) => (
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="cargo-is-insured"
                    checked={!!field.value}
                    onCheckedChange={(checked) => {
                      const value = !!checked;
                      field.onChange(value);
                      if (!value) {
                        setValue("declaredValue", undefined, { shouldDirty: true });
                        setValue("aseguraCarga", undefined, { shouldDirty: true });
                        setValue("polizaCarga", undefined, { shouldDirty: true });
                      }
                    }}
                  />
                  <Label htmlFor="cargo-is-insured" className="cursor-pointer">
                    {sheet.label.isInsured}
                  </Label>
                </div>
              )}
            />

            {isInsured && (
              <div className="space-y-3">
                <RHFMoneyField
                  control={control}
                  name="declaredValue"
                  fieldId="cargo-declared-value"
                  label={sheet.label.declaredValue}
                  required
                  placeholder={sheet.placeholder.declaredValue}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <RHFTextField
                    control={control}
                    name="aseguraCarga"
                    fieldId="cargo-asegura"
                    label={sheet.label.insurer}
                    required
                    placeholder={sheet.placeholder.insurer}
                  />
                  <RHFTextField
                    control={control}
                    name="polizaCarga"
                    fieldId="cargo-poliza"
                    label={sheet.label.policy}
                    required
                    placeholder={sheet.placeholder.policy}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {sheet.hint.insurance}
                </p>
              </div>
            )}
          </CargoOptionalSection>

          {/* ========== NOTAS ========== */}
          <CargoOptionalSection
            title={sheet.section.notes}
            icon={<MessageSquare className="h-4 w-4" />}
            summary={
              hasNotes
                ? sheet.sectionSummary.notesFilled
                : sheet.sectionSummary.notesEmpty
            }
            defaultOpen={
              Boolean(initialValues?.notes?.trim()) ||
              Boolean(initialValues?.specialInstructions?.trim())
            }
            forceOpen={errorSection === "notas"}
            tone={errorSection === "notas" ? "destructive" : "default"}
          >
            <RHFTextareaField
              control={control}
              name="notes"
              fieldId="cargo-notes"
              label={sheet.label.notes}
              placeholder={sheet.placeholder.notes}
            />
            <RHFTextareaField
              control={control}
              name="specialInstructions"
              fieldId="cargo-special-instructions"
              label={sheet.label.specialInstructions}
              placeholder={sheet.placeholder.specialInstructions}
            />
          </CargoOptionalSection>

          {confirmEffectItems.length > 0 ? (
            <TrackingSheetConfirmEffects
              title={sheet.effects.title}
              items={confirmEffectItems}
            />
          ) : null}

          {/* ========== VALIDATION SUMMARY ========== */}
          {isSummaryVisible && (
            <FormValidationSummary
              title={sheet.validation.missingRequiredTitle}
              messages={summaryMessages}
            />
          )}
          {submissionError ? (
            <Alert variant="destructive">
              <AlertTitle>
                {submitErrorTitle ?? sheet.toast.saveErrorTitle}
              </AlertTitle>
              <AlertDescription className="select-text whitespace-pre-wrap break-words">
                {submissionError}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        <SheetFooter
          className={cn(
            TRACKING_SHEET_FOOTER_CLASS,
            "bg-background px-6 pb-4 sm:flex-wrap sm:gap-2 sm:space-x-0",
          )}
        >
          <Button
            type="button"
            variant="outline"
            className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
            disabled={isSubmitting}
            onClick={() => onOpenChange(false)}
          >
            {sheet.action.cancel}
          </Button>
          {editingIndex === null && (
            <Button
              type="button"
              variant="secondary"
              className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
              disabled={isSubmitting}
              onClick={handleAddAnother}
            >
              {sheet.action.addAnother}
            </Button>
          )}
          <Button
            type="button"
            className={TRACKING_SHEET_PRIMARY_BUTTON_CLASS}
            disabled={isSubmitting}
            onClick={() => void submitSheet()}
          >
            {editingIndex !== null ? sheet.action.save : sheet.action.add}
          </Button>
        </SheetFooter>
      </SheetContent>
  );
}

export function CargoMovementSheet({
  open,
  onOpenChange,
  pickupStop,
  initialValues,
  editingIndex,
  ...rest
}: CargoMovementSheetProps) {
  // Remount al cambiar entidad (edit id) o al abrir alta; no al cambiar pickup en el selector.
  const sessionKey = `${editingIndex ?? "new"}-${initialValues?.id ?? "draft"}`;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next && isSubmitting) return;
      onOpenChange(next);
    },
    [isSubmitting, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {open ? (
        <CargoMovementSheetSession
          key={sessionKey}
          onOpenChange={handleOpenChange}
          pickupStop={pickupStop}
          initialValues={initialValues}
          editingIndex={editingIndex}
          onSubmittingChange={setIsSubmitting}
          {...rest}
        />
      ) : null}
    </Sheet>
  );
}
