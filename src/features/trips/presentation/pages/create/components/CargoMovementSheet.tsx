/**
 * CargoMovementSheet - Sheet lateral para agregar/editar mercancías
 * Clean Architecture - Presentation Layer (paso 3 del wizard de viajes)
 *
 * Patrón UI: Sheet lateral derecho en dos niveles. Arriba, lo obligatorio para
 * mover la mercancía (qué se transporta y cuánto). Debajo, lo que solo aplica a
 * veces: requisitos que exige el catálogo del producto, seguro, entregas y notas.
 * Las secciones opcionales se abren solas cuando la mercancía ya trae datos.
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
import {
  AlertTriangle,
  MessageSquare,
  Plus,
  ShieldCheck,
  Trash2,
  Truck,
} from "lucide-react";
import {
  CargoMovementSheetPickupContext,
  CargoMovementSheetProductSection,
  CargoMovementSheetQuantityWeightSection,
  CargoOptionalSection,
  CargoProductRequirementsSection,
} from "./cargo-movement";
import { useToast } from "@shared/hooks";

import {
  getMissingSectorRequiredFields,
  hasAnySectorFieldValue,
} from "./cargoRegulatory";
import { fetchRegulatoryFlagsForSatProductCp } from "@shared/cfdi";

import { V1_CARGO_PLACEHOLDER_CLIENT_SENTINEL } from "@features/trips/domain/v1CargoPlaceholderClient";
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
  /** Mercancías ya registradas en la parada activa. */
  stopCargoCount: number;
  /** Se llama con los valores validados Zod. */
  onSubmit: (
    values: TripCargoFormValues,
    editingIndex: number | null,
    options?: { keepOpen?: boolean },
  ) => void;
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
  stopCargoCount,
  onSubmit,
}: Omit<CargoMovementSheetProps, "open">) {
  const { error: showErrorToast, success: showSuccessToast } = useToast();
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
  const { control, handleSubmit, setValue, getValues, reset, formState } = form;

  // Estado fuera del schema: entregas posteriores
  const [deliveryAssignments, setDeliveryAssignments] = useState(
    () => initialDeliveryAssignments(initialValues),
  );
  const [showSummary, setShowSummary] = useState(false);

  // ============================================================================
  // Watchers
  // ============================================================================

  const satProductCode = useWatch({ control, name: "satProductCode" });
  const satUnitName = useWatch({ control, name: "satUnitName" }) || "unidades";
  const isInsured = useWatch({ control, name: "isInsured" });
  const insurerName = useWatch({ control, name: "aseguraCarga" });
  const notesValue = useWatch({ control, name: "notes" });
  const specialInstructionsValue = useWatch({
    control,
    name: "specialInstructions",
  });
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

  /** Solo se muestra el bloque si el catálogo exige algo o la mercancía ya trae datos. */
  const showRequirementsSection =
    hasSectorData || hazmatRequiredByCatalog || !!hazardousMaterial;

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
  };

  const handleRemoveDelivery = (index: number) => {
    setDeliveryAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleHazmatChange = useCallback(
    (checked: boolean) => {
      if (!checked && hazmatRequiredByCatalog) {
        showErrorToast(
          sheet.toast.hazmatRequiredTitle,
          sheet.toast.hazmatRequiredBody,
        );
        return;
      }
      setValue("hazardousMaterial", checked, { shouldDirty: true });
      if (!checked) {
        setValue("hazardousMaterialCode", "", { shouldDirty: true });
        setValue("packagingType", "", { shouldDirty: true });
        setValue("packagingDescription", "", { shouldDirty: true });
      }
    },
    [hazmatRequiredByCatalog, setValue, showErrorToast],
  );

  // ============================================================================
  // Submit
  // ============================================================================

  const pickupStopIndex = pickupStop?.index ?? 0;

  const buildResult = useCallback(
    (values: TripCargoFormValues): TripCargoFormValues => {
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
        // Cuando no es hazmat, limpiar campos hazmat
        hazardousMaterialCode: values.hazardousMaterial
          ? values.hazardousMaterialCode
          : undefined,
        packagingType: values.hazardousMaterial ? values.packagingType : undefined,
        packagingDescription: values.hazardousMaterial
          ? values.packagingDescription
          : undefined,
      };
    },
    [deliveryAssignments, pickupStopIndex],
  );

  const submitSheet = handleSubmit(
    (values) => {
      onSubmit(buildResult(values), editingIndex);
      onOpenChange(false);
    },
    () => {
      setShowSummary(true);
    },
  );

  /** Guarda la mercancía y deja el sheet listo para la siguiente de la misma parada. */
  const handleAddAnother = () => {
    void handleSubmit(
      (values) => {
        const result = buildResult(values);
        onSubmit(result, null, { keepOpen: true });
        reset(buildEmptyCargo(pickupStopIndex));
        setDeliveryAssignments([]);
        setShowSummary(false);
        catalogHydrateKeyRef.current = null;
        showSuccessToast(
          sheet.toast.addedTitle,
          sheet.toast.addedBody(result.description),
        );
      },
      () => {
        setShowSummary(true);
      },
    )();
  };

  const summaryMessages = useMemo(
    () => collectFormErrorMessages(formState.errors as Record<string, { message?: string }>),
    [formState.errors],
  );
  const isSummaryVisible = showSummary && summaryMessages.length > 0;

  const hasNotes =
    Boolean(notesValue?.trim()) || Boolean(specialInstructionsValue?.trim());

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
            {editingIndex !== null ? sheet.title.edit : sheet.title.create}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {sheet.description}
          </SheetDescription>
          <CargoMovementSheetPickupContext
            pickupStop={pickupStop}
            stopCargoCount={stopCargoCount}
            availableKg={availableKg}
          />
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
          <CargoMovementSheetProductSection
            control={control}
            setValue={setValue}
            getValues={getValues}
          />

          <CargoMovementSheetQuantityWeightSection
            control={control}
            satUnitName={satUnitName}
            wouldExceedCapacity={wouldExceedCapacity}
            isNearCapacityProjection={isNearCapacityProjection}
            vehicleCapacityKg={vehicleCapacityKg ?? undefined}
            projectedWeight={projectedWeight}
            availableKg={availableKg}
            formatWeight={formatWeight}
          />

          {/* Marca manual de material peligroso; el catálogo puede volverla obligatoria. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3">
            <Checkbox
              id="cargo-hazmat-checkbox"
              checked={!!hazardousMaterial}
              disabled={hazmatRequiredByCatalog}
              onCheckedChange={(checked) => handleHazmatChange(!!checked)}
            />
            <Label
              htmlFor="cargo-hazmat-checkbox"
              className="flex cursor-pointer items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-warning" />
              {sheet.label.isHazmat}
            </Label>
            {hazmatRequiredByCatalog && (
              <span className="text-xs text-muted-foreground">
                {sheet.hint.hazmatRequired}
              </span>
            )}
          </div>

          {showRequirementsSection && (
            <CargoProductRequirementsSection
              control={control}
              sectorRequirements={sectorRequirements}
              missingSectorFields={missingSectorFields}
              showHazmatFields={!!hazardousMaterial}
            />
          )}

          {/* ========== SECCIÓN OPCIONAL: SEGURO ========== */}
          <CargoOptionalSection
            title={sheet.section.insurance}
            icon={<ShieldCheck className="h-4 w-4" />}
            summary={
              isInsured
                ? sheet.sectionSummary.insuranceOn(insurerName || undefined)
                : sheet.sectionSummary.insuranceOff
            }
            defaultOpen={!!initialValues?.isInsured}
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
                <Controller
                  control={control}
                  name="declaredValue"
                  render={({ field, fieldState }) => {
                    const errorMessage = fieldState.error?.message;
                    return (
                      <FormFieldShell
                        fieldId="cargo-declared-value"
                        label={sheet.label.declaredValue}
                        required
                        errorMessage={errorMessage}
                      >
                        <Input
                          id="cargo-declared-value"
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder={sheet.placeholder.declaredValue}
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

          {/* ========== SECCIÓN OPCIONAL: ENTREGAS ========== */}
          {availableDeliveryStops.length > 0 && (
            <CargoOptionalSection
              title={sheet.section.deliveries}
              icon={<Truck className="h-4 w-4" />}
              summary={
                deliveryAssignments.length > 0
                  ? sheet.sectionSummary.deliveriesAssigned(
                      deliveryAssignments.length,
                    )
                  : sheet.sectionSummary.deliveriesNone
              }
              defaultOpen={initialDeliveryAssignments(initialValues).length > 0}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-xs text-muted-foreground sm:max-w-md">
                  {sheet.hint.deliveries}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddDelivery}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {sheet.action.addDelivery}
                </Button>
              </div>

              {deliveryAssignments.length === 0 ? (
                <div className="rounded-lg border border-dashed py-3 text-center text-xs text-muted-foreground">
                  {sheet.state.noDeliveries}
                </div>
              ) : (
                <div className="space-y-2">
                  {deliveryAssignments.map((delivery, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 rounded-lg border p-3"
                    >
                      <div className="flex-1 space-y-3">
                        <FormFieldShell
                          fieldId={`cargo-delivery-stop-${idx}`}
                          label={sheet.label.deliveryStop}
                        >
                          <Select
                            value={
                              delivery.stopIndex >= 0 ? String(delivery.stopIndex) : ""
                            }
                            onValueChange={(val) =>
                              handleUpdateDelivery(idx, "stopIndex", Number(val))
                            }
                          >
                            <SelectTrigger
                              id={`cargo-delivery-stop-${idx}`}
                              className="h-9"
                            >
                              <SelectValue placeholder={sheet.placeholder.deliveryStop} />
                            </SelectTrigger>
                            <SelectContent>
                              {availableDeliveryStops.map((s) => (
                                <SelectItem key={s.index} value={String(s.index)}>
                                  {sheet.format.deliveryStopOption(
                                    s.index,
                                    s.locationName || "",
                                    s.address,
                                    s.city,
                                  )}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormFieldShell>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FormFieldShell
                            fieldId={`cargo-delivery-weight-${idx}`}
                            label={sheet.label.deliveryWeight}
                          >
                            <Input
                              id={`cargo-delivery-weight-${idx}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={delivery.weight ?? ""}
                              onChange={(e) =>
                                handleUpdateDelivery(
                                  idx,
                                  "weight",
                                  e.target.value ? Number(e.target.value) : undefined,
                                )
                              }
                            />
                          </FormFieldShell>
                          <FormFieldShell
                            fieldId={`cargo-delivery-units-${idx}`}
                            label={sheet.label.deliveryUnits}
                          >
                            <Input
                              id={`cargo-delivery-units-${idx}`}
                              type="number"
                              min="0"
                              value={delivery.units ?? ""}
                              onChange={(e) =>
                                handleUpdateDelivery(
                                  idx,
                                  "units",
                                  e.target.value ? Number(e.target.value) : undefined,
                                )
                              }
                            />
                          </FormFieldShell>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 flex-shrink-0 text-destructive hover:text-destructive"
                        onClick={() => handleRemoveDelivery(idx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CargoOptionalSection>
          )}

          {/* ========== SECCIÓN OPCIONAL: NOTAS ========== */}
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

          {/* ========== VALIDATION SUMMARY ========== */}
          {isSummaryVisible && (
            <FormValidationSummary
              title={sheet.validation.missingRequiredTitle}
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
            {sheet.action.cancel}
          </Button>
          {editingIndex === null && (
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddAnother}
            >
              {sheet.action.addAnother}
            </Button>
          )}
          <Button type="button" onClick={() => void submitSheet()}>
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
