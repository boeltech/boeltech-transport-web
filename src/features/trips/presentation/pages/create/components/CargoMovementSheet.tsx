/**
 * CargoMovementSheet - Sheet lateral para agregar/editar mercancías
 * Clean Architecture - Presentation Layer (paso 3 del wizard de viajes)
 *
 * Patrón UI: Sheet lateral derecho con secciones en `FormSectionCard`, alineado con
 * `StopFormSheet` (paradas) y los formularios de clientes/empleados.
 *
 * Validación: `useForm(tripCargoSchema)` con `zodResolver`. La SoT de obligatoriedad
 * CP3.1 vive en `tripCargoSchema.superRefine` (`validation.ts`) y refleja la matriz
 * `docs/carta-porte-3.1/matriz-reglas-cp31-por-capas.md` (atributos del nodo
 * `Mercancia`: BienesTransp, Descripcion, Cantidad, ClaveUnidad, PesoEnKg,
 * MaterialPeligroso + Embalaje/CveMaterialPeligroso cuando aplique + datos sectoriales).
 *
 * Estado fuera del schema: `deliveryAssignments` (entregas posteriores en otras
 * paradas) se modela aparte porque no son atributos del nodo `Mercancia` sino del
 * modelo operativo de movimientos; se integran al payload en el `onSubmit`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch, type Resolver } from "react-hook-form";
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
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Checkbox } from "@shared/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  FormFieldShell,
  FormValidationSummary,
  RHFTextField,
  RHFTextareaField,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  AlertTriangle,
  ChevronDown,
  FileText,
  MessageSquare,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";
import { CargoMovementSheetPickupContext, CargoMovementSheetProductSection, CargoMovementSheetQuantityWeightSection } from "./cargo-movement";
import { useToast } from "@shared/hooks";

import {
  MaterialPeligrosoSearch,
  TipoEmbalajeSelect,
} from "@features/catalogs";
import {
  getMissingSectorRequiredFields,
  hasAnySectorFieldValue,
  sectorFieldLabels,
} from "./cargoRegulatory";
import { fetchRegulatoryFlagsForSatProductCp } from "@shared/cfdi";

import { V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL } from "@features/trips/domain/v1CargoPlaceholderClient";
import {
  tripCargoSchema,
  type CargoMovementFormValues,
  type TripCargoFormValues,
} from "./validation";

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

export interface CargoMovementSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Parada `pickup` desde la que se abrió el sheet; `null` mientras está cerrado. */
  pickupStop: CargoSheetPickupStop | null;
  /** Paradas `delivery` posteriores donde puede asignarse esta mercancía. */
  availableDeliveryStops: CargoSheetDeliveryStop[];
  /** Si es edición, los valores iniciales; si es alta, `null`. */
  initialValues: TripCargoFormValues | null;
  /** Índice en `cargosFieldArray`; `null` cuando es alta. */
  editingIndex: number | null;
  /** Capacidad del vehículo (kg) — opcional, solo para advertencia proyectada. */
  vehicleCapacityKg: number | null;
  /** Peso de las demás cargas (excluyendo la actual si está editando). */
  baselineWeightKg: number;
  /** Se llama con los valores validados Zod. */
  onSubmit: (values: TripCargoFormValues, editingIndex: number | null) => void;
}

// ============================================================================
// HELPERS
// ============================================================================

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

function formatWeight(weightKg: number): string {
  if (weightKg >= 1000) {
    return `${(weightKg / 1000).toLocaleString("es-MX", { maximumFractionDigits: 2 })} t`;
  }
  return `${weightKg.toLocaleString("es-MX")} kg`;
}

/** Recolecta mensajes de error del form para el `FormValidationSummary`. */
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
  return (initialValues.movements ?? []).filter((m) => m.movementType === "delivery");
}

function CargoMovementSheetSession({
  onOpenChange,
  pickupStop,
  availableDeliveryStops,
  initialValues,
  editingIndex,
  vehicleCapacityKg,
  baselineWeightKg,
  onSubmit,
}: Omit<CargoMovementSheetProps, "open">) {
  const { error: showErrorToast } = useToast();
  const catalogHydrateKeyRef = useRef<string | null>(null);

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
    mode: "onSubmit",
    shouldUnregister: false,
  });
  const { control, handleSubmit, setValue, getValues, formState } = form;

  // Estado fuera del schema: entregas posteriores
  const [deliveryAssignments, setDeliveryAssignments] = useState(
    () => initialDeliveryAssignments(initialValues),
  );
  const [hazmatSectionOpen, setHazmatSectionOpen] = useState(
    () => !!initialValues?.hazardousMaterial,
  );
  const [showSummary, setShowSummary] = useState(false);

  // ============================================================================
  // Watchers
  // ============================================================================

  const satProductCode = useWatch({ control, name: "satProductCode" });
  const satUnitName = useWatch({ control, name: "satUnitName" }) || "unidades";
  const isInsured = useWatch({ control, name: "isInsured" });
  const hazardousMaterial = useWatch({ control, name: "hazardousMaterial" });
  const requiresHazmatFromCatalog = useWatch({ control, name: "requiresHazmat" });
  const sectorRequirements = useWatch({ control, name: "sectorRequirements" });
  const weightInKgWatch = useWatch({ control, name: "weightInKg" });
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

  /** Solo el catálogo SAT puede bloquear desmarcar; la elección manual del usuario es reversible. */
  const hazmatRequiredByCatalog = !!requiresHazmatFromCatalog;

  const shouldShowSectorSection = useMemo(() => {
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

  // Hidrata flags regulatorios al cambiar el producto SAT seleccionado.
  useEffect(() => {
    const code = satProductCode?.trim();
    if (!code) return;
    const currentRequirements = getValues("sectorRequirements") ?? {};
    const noActiveFlags = !Object.values(currentRequirements).some(Boolean);
    if (!noActiveFlags) return;

    const key = `${editingIndex ?? "new"}:${code}`;
    if (catalogHydrateKeyRef.current === key) return;
    catalogHydrateKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      try {
        const flags = await fetchRegulatoryFlagsForSatProductCp(code);
        if (cancelled) return;
        if (getValues("satProductCode")?.trim() !== code) return;
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
        if (flags.requiresHazmat) {
          setValue("requiresHazmat", true, { shouldDirty: true });
          setValue("hazardousMaterial", true, { shouldDirty: true });
          setHazmatSectionOpen(true);
        }
      } catch {
        catalogHydrateKeyRef.current = null;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [satProductCode, editingIndex, getValues, setValue]);

  // ============================================================================
  // Capacity projection
  // ============================================================================

  const projectedWeight =
    baselineWeightKg + (typeof weightInKgWatch === "number" ? weightInKgWatch : 0);
  const wouldExceedCapacity =
    vehicleCapacityKg != null &&
    vehicleCapacityKg > 0 &&
    typeof weightInKgWatch === "number" &&
    weightInKgWatch > 0 &&
    projectedWeight > vehicleCapacityKg;
  const isNearCapacityProjection =
    vehicleCapacityKg != null &&
    vehicleCapacityKg > 0 &&
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
  };

  const handleRemoveDelivery = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHazmatChange = useCallback(
    (checked: boolean) => {
      if (!checked && hazmatRequiredByCatalog) {
        showErrorToast(
          "Material peligroso requerido",
          "El producto seleccionado exige capturar información de material peligroso según catálogo SAT.",
        );
        return;
      }
      setValue("hazardousMaterial", checked, { shouldDirty: true });
      if (!checked) {
        setValue("hazardousMaterialCode", "", { shouldDirty: true });
        setValue("packagingType", "", { shouldDirty: true });
        setValue("packagingDescription", "", { shouldDirty: true });
      }
      setHazmatSectionOpen(checked);
    },
    [hazmatRequiredByCatalog, setValue, showErrorToast],
  );

  // ============================================================================
  // Submit
  // ============================================================================

  const pickupStopIndex = pickupStop?.index ?? 0;

  const submitSheet = handleSubmit(
    (values) => {
      const pickupMovement: CargoMovementFormValues = {
        stopIndex: pickupStopIndex,
        movementType: "pickup",
      };
      const validDeliveries: CargoMovementFormValues[] = deliveryAssignments
        .filter((d) => d.stopIndex >= 0)
        .map((d) => ({
          stopIndex: d.stopIndex,
          movementType: "delivery" as const,
          weight: d.weight,
          units: d.units,
          notes: d.notes,
        }));
      const result: TripCargoFormValues = {
        ...values,
        clientId: V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL,
        movements: [pickupMovement, ...validDeliveries],
        // Asegurar coherencia weight ↔ weightInKg (legacy)
        weight: values.weightInKg ?? values.weight,
        // Cuando no está asegurada, limpiar campos de seguro
        declaredValue: values.isInsured ? values.declaredValue : undefined,
        aseguraCarga: values.isInsured ? values.aseguraCarga : undefined,
        polizaCarga: values.isInsured ? values.polizaCarga : undefined,
        // Cuando no es hazmat, limpiar campos hazmat
        hazardousMaterialCode: values.hazardousMaterial
          ? values.hazardousMaterialCode
          : undefined,
        packagingType: values.hazardousMaterial ? values.packagingType : undefined,
        packagingDescription: values.hazardousMaterial
          ? values.packagingDescription
          : undefined,
      };
      onSubmit(result, editingIndex);
      onOpenChange(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  const summaryMessages = useMemo(
    () => collectFormErrorMessages(formState.errors as Record<string, { message?: string }>),
    [formState.errors],
  );
  const isSummaryVisible = showSummary && summaryMessages.length > 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl"
      >
        <SheetHeader className="shrink-0 space-y-2 border-b px-6 py-4">
          <SheetTitle className="pr-8">
            {editingIndex !== null ? "Editar mercancía" : "Agregar mercancía"}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Formulario de mercancía: producto y unidad de medida, cantidad y
            peso, seguro, material peligroso, entregas y observaciones.
          </SheetDescription>
          <CargoMovementSheetPickupContext pickupStop={pickupStop} />
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <CargoMovementSheetProductSection
            control={control}
            setValue={setValue}
            getValues={getValues}
            onHazmatSectionOpen={() => setHazmatSectionOpen(true)}
          />

          <CargoMovementSheetQuantityWeightSection
            control={control}
            satUnitName={satUnitName}
            wouldExceedCapacity={wouldExceedCapacity}
            isNearCapacityProjection={isNearCapacityProjection}
            vehicleCapacityKg={vehicleCapacityKg ?? undefined}
            projectedWeight={projectedWeight}
            formatWeight={formatWeight}
          />

          {/* ========== SECCIÓN: SEGURO ========== */}
          <FormSectionCard
            title="Seguro de mercancía"
            icon={<ShieldCheck className="h-4 w-4" />}
            contentClassName="space-y-4"
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
                    Esta mercancía está asegurada
                  </Label>
                </div>
              )}
            />

            {isInsured && (
              <div className="space-y-3">
                <Controller
                  control={control}
                  name="declaredValue"
                  render={({ field, fieldState }) => {
                    const errorMessage = fieldState.error?.message;
                    return (
                      <FormFieldShell
                        fieldId="cargo-declared-value"
                        label="Valor declarado (MXN)"
                        required
                        errorMessage={errorMessage}
                      >
                        <Input
                          id="cargo-declared-value"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value ? Number(e.target.value) : undefined,
                            )
                          }
                          onBlur={field.onBlur}
                          error={Boolean(fieldState.error)}
                          {...getFieldErrorAriaProps(
                            "cargo-declared-value",
                            errorMessage,
                          )}
                        />
                      </FormFieldShell>
                    );
                  }}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <RHFTextField
                    control={control}
                    name="aseguraCarga"
                    fieldId="cargo-asegura"
                    label="Aseguradora de la carga"
                    required
                    placeholder="Ej: Qualitas"
                  />
                  <RHFTextField
                    control={control}
                    name="polizaCarga"
                    fieldId="cargo-poliza"
                    label="Póliza de la carga"
                    required
                    placeholder="Ej: CARGA-123456"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Captura la aseguradora y póliza específicas de esta mercancía para el
                  viaje.
                </p>
              </div>
            )}
          </FormSectionCard>

          {/* ========== SECCIÓN: MATERIAL PELIGROSO ========== */}
          <FormSectionCard
            title="Material peligroso"
            icon={<AlertTriangle className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <Collapsible
              open={hazmatSectionOpen}
              onOpenChange={setHazmatSectionOpen}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="cargo-hazmat-checkbox"
                    checked={!!hazardousMaterial}
                    disabled={hazmatRequiredByCatalog}
                    onCheckedChange={(checked) => handleHazmatChange(!!checked)}
                  />
                  <Label
                    htmlFor="cargo-hazmat-checkbox"
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Esta mercancía es material peligroso
                  </Label>
                </div>
                {hazmatRequiredByCatalog && (
                  <p className="text-xs text-warning-soft-foreground">
                    Este producto obliga captura de material peligroso según catálogo
                    SAT.
                  </p>
                )}
                {hazardousMaterial && (
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 transition-transform",
                          hazmatSectionOpen && "rotate-180",
                        )}
                      />
                    </Button>
                  </CollapsibleTrigger>
                )}
              </div>

              <CollapsibleContent className="space-y-4 mt-4">
                <div className="p-4 border border-warning/30 rounded-lg bg-warning-soft/50 space-y-4">
                  <p className="text-sm text-warning-soft-foreground">
                    Completa la información de material peligroso según catálogo oficial.
                  </p>

                  <Controller
                    control={control}
                    name="hazardousMaterialCode"
                    render={({ field, fieldState }) => {
                      const errorMessage = fieldState.error?.message;
                      return (
                        <FormFieldShell
                          fieldId="cargo-hazmat-code"
                          label="Clave Material Peligroso"
                          required
                          errorMessage={errorMessage}
                        >
                          <MaterialPeligrosoSearch
                            value={field.value || null}
                            onSelect={(item) => field.onChange(item.code)}
                            onClear={() => field.onChange("")}
                          />
                        </FormFieldShell>
                      );
                    }}
                  />

                  <Controller
                    control={control}
                    name="packagingType"
                    render={({ field, fieldState }) => {
                      const errorMessage = fieldState.error?.message;
                      return (
                        <FormFieldShell
                          fieldId="cargo-packaging-type"
                          label="Tipo de Embalaje"
                          required
                          errorMessage={errorMessage}
                        >
                          <TipoEmbalajeSelect
                            value={field.value || ""}
                            onValueChange={(value) => field.onChange(value)}
                            placeholder="Seleccionar tipo de embalaje"
                          />
                        </FormFieldShell>
                      );
                    }}
                  />

                  <RHFTextField
                    control={control}
                    name="packagingDescription"
                    fieldId="cargo-packaging-description"
                    label="Descripción del Embalaje"
                    required
                    placeholder="Ej: Bidones de 20L, Tanque de 1000L..."
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          </FormSectionCard>

          {/* ========== SECCIÓN: SECTORES REGULADOS ========== */}
          {shouldShowSectorSection && (
            <FormSectionCard
              title="Sectores regulados"
              icon={<FileText className="h-4 w-4" />}
              contentClassName="space-y-4"
            >
              <p className="text-xs text-muted-foreground">
                Complete solo los campos regulatorios que marque el catálogo del
                producto. Si no aplica, puede dejarlos vacíos.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    ["sectorCofepris", "Sector COFEPRIS"],
                    ["nombreIngredienteActivo", "Ingrediente activo"],
                    ["nomQuimico", "Nombre químico"],
                    ["denominacionGenericaProd", "Denominación genérica"],
                    ["denominacionDistintivaProd", "Denominación distintiva"],
                    ["fabricante", "Fabricante"],
                    ["loteMedicamento", "Lote medicamento"],
                    ["formaFarmaceutica", "Forma farmacéutica"],
                    ["condicionesEspTransp", "Condiciones especiales de transporte"],
                    [
                      "registroSanitarioFolioAutorizacion",
                      "Registro sanitario / folio autorización",
                    ],
                    ["permisoImportacion", "Permiso importación"],
                    ["folioImpoVucem", "Folio VUCEM"],
                    ["numCas", "Número CAS"],
                    ["razonSocialEmpImp", "Razón social empresa importadora"],
                    [
                      "numRegSanPlagCofepris",
                      "Registro sanitario plaguicida COFEPRIS",
                    ],
                    ["datosFabricante", "Datos fabricante"],
                    ["datosFormulador", "Datos formulador"],
                    ["datosMaquilador", "Datos maquilador"],
                    ["usoAutorizado", "Uso autorizado"],
                  ] as const
                ).map(([fieldName, label]) => (
                  <RHFTextField
                    key={fieldName}
                    control={control}
                    name={fieldName}
                    fieldId={`cargo-${fieldName}`}
                    label={label}
                    required={Boolean(sectorRequirements?.[fieldName])}
                  />
                ))}

                <Controller
                  control={control}
                  name="fechaCaducidad"
                  render={({ field, fieldState }) => {
                    const errorMessage = fieldState.error?.message;
                    return (
                      <FormFieldShell
                        fieldId="cargo-fecha-caducidad"
                        label="Fecha de caducidad"
                        required={Boolean(sectorRequirements?.fechaCaducidad)}
                        errorMessage={errorMessage}
                      >
                        <Input
                          id="cargo-fecha-caducidad"
                          type="date"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          error={Boolean(fieldState.error)}
                          {...getFieldErrorAriaProps(
                            "cargo-fecha-caducidad",
                            errorMessage,
                          )}
                        />
                      </FormFieldShell>
                    );
                  }}
                />
              </div>

              {missingSectorFields.length > 0 && (
                <p className="text-xs text-warning">
                  Campos pendientes:{" "}
                  {missingSectorFields
                    .map((field) => sectorFieldLabels[field])
                    .join(", ")}
                </p>
              )}
            </FormSectionCard>
          )}

          {/* ========== SECCIÓN: ENTREGAS ========== */}
          {availableDeliveryStops.length > 0 && (
            <FormSectionCard
              title="Entregas en la ruta"
              icon={<Truck className="h-4 w-4" />}
              contentClassName="space-y-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Descargas posteriores en otras paradas
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDelivery}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Agregar Entrega
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Opcional: indique en qué paradas se entregará esta mercancía. Para
                entregas parciales, especifique peso o unidades por punto.
              </p>

              {deliveryAssignments.length === 0 ? (
                <div className="text-center py-3 border border-dashed rounded-lg text-xs text-muted-foreground">
                  Sin entregas asignadas. Puede asignarlas después.
                </div>
              ) : (
                <div className="space-y-2">
                  {deliveryAssignments.map((delivery, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-3 border rounded-lg bg-warning-soft/30"
                    >
                      <div className="flex-1 space-y-2">
                        <Select
                          value={
                            delivery.stopIndex >= 0 ? String(delivery.stopIndex) : ""
                          }
                          onValueChange={(val) =>
                            handleUpdateDelivery(idx, "stopIndex", Number(val))
                          }
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Seleccionar parada..." />
                          </SelectTrigger>
                          <SelectContent>
                            {availableDeliveryStops.map((s) => (
                              <SelectItem key={s.index} value={String(s.index)}>
                                #{s.index + 1} {s.locationName || s.address} ({s.city})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            type="number"
                            placeholder="Peso (kg)"
                            className="h-8 text-xs"
                            value={delivery.weight ?? ""}
                            onChange={(e) =>
                              handleUpdateDelivery(
                                idx,
                                "weight",
                                e.target.value ? Number(e.target.value) : undefined,
                              )
                            }
                          />
                          <Input
                            type="number"
                            placeholder="Unidades"
                            className="h-8 text-xs"
                            value={delivery.units ?? ""}
                            onChange={(e) =>
                              handleUpdateDelivery(
                                idx,
                                "units",
                                e.target.value ? Number(e.target.value) : undefined,
                              )
                            }
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                        onClick={() => handleRemoveDelivery(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </FormSectionCard>
          )}

          {/* ========== SECCIÓN: NOTAS ========== */}
          <FormSectionCard
            title="Notas y observaciones"
            icon={<MessageSquare className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <RHFTextareaField
              control={control}
              name="notes"
              fieldId="cargo-notes"
              label="Notas"
              placeholder="Observaciones sobre la carga..."
            />
            <RHFTextareaField
              control={control}
              name="specialInstructions"
              fieldId="cargo-special-instructions"
              label="Instrucciones especiales"
              placeholder="Manejo especial, temperatura, fragilidad..."
            />
          </FormSectionCard>

          {/* ========== VALIDATION SUMMARY ========== */}
          {isSummaryVisible && (
            <FormValidationSummary
              title="Faltan datos obligatorios en la mercancía"
              messages={summaryMessages}
            />
          )}
        </div>

        <SheetFooter className="shrink-0 gap-2 border-t bg-background px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button type="button" onClick={() => void submitSheet()}>
            {editingIndex !== null ? "Guardar cambios" : "Agregar mercancía"}
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
  const sessionKey = `${editingIndex ?? "new"}-${pickupStop?.index ?? 0}-${initialValues?.satProductCode ?? ""}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {open ? (
        <CargoMovementSheetSession
          key={sessionKey}
          onOpenChange={onOpenChange}
          pickupStop={pickupStop}
          initialValues={initialValues}
          editingIndex={editingIndex}
          {...rest}
        />
      ) : null}
    </Sheet>
  );
}
