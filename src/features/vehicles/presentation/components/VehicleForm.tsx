/**
 * VehicleForm
 *
 * Formulario reutilizable para crear/editar vehículos.
 * Incluye campos de Carta Porte 3.1.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
  useFormContext,
  type Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Save,
  Loader2,
  Info,
  Truck,
  Settings,
  Gauge,
  ShieldCheck,
  FileText,
  ClipboardCheck,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import { FormValidationSummary } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { SatFieldLabel } from "@shared/ui/data-display";
import { getFieldErrorAriaProps } from "@shared/ui/form";

import {
  createVehicleSchema,
  editVehicleFormSchema,
  parsePesoBrutoVehicularFormInput,
  VEHICLE_CREATE_WIZARD_STEP_FIELDS,
  type CreateVehicleFormData,
} from "../validation";
import {
  VEHICLE_TYPE_LABELS,
  VehicleType,
  type VehicleTypeValue,
  type Vehicle,
} from "@features/vehicles/domain";

// Importar componentes de catálogo
import {
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
  SubTipoRemSelect,
} from "@features/catalogs";
import { cn } from "@shared/lib/utils/cn";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  VehicleGridCatalogSlot,
  VehicleGridField,
  VehicleGridInput,
  VehicleGridNumberInput,
  VehicleGridSelect,
} from "./VehicleFormFields";

// ============================================================================
// TYPES
// ============================================================================

export type VehicleFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface VehicleFormProps {
  /** Vehículo existente (para modo edición) */
  vehicle?: Vehicle;
  /** Callback al enviar el formulario */
  onSubmit: (data: CreateVehicleFormData) => void;
  /** Estado de carga del submit */
  isSubmitting?: boolean;
  /** Wizard de alta (solo creación); mantiene campos montados con `hidden` */
  wizardMode?: boolean;
  /** Índice de paso visible (0–3). El 3 es revisión. */
  wizardStepIndex?: number;
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
    pesoBrutoVehicular:
      parsePesoBrutoVehicularFormInput(vehicle.cartaPorte.pesoBrutoVehicular),
    insuranceCompany: vehicle.cartaPorte.insuranceCompany ?? "",
    aseguraMedioAmbiente: vehicle.cartaPorte.aseguraMedioAmbiente ?? "",
    polizaMedioAmbiente: vehicle.cartaPorte.polizaMedioAmbiente ?? "",
    aseguraCarga: vehicle.cartaPorte.aseguraCarga ?? "",
    polizaCarga: vehicle.cartaPorte.polizaCarga ?? "",
    remolques: vehicle.cartaPorte.remolques.map((remolque) => ({
      satSubTipoRemCode: remolque.satSubTipoRemCode,
      licensePlate: remolque.licensePlate,
    })),
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function VehicleCreateWizardSummary() {
  const form = useFormContext<CreateVehicleFormData>();
  const v = form.getValues();
  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      description="Confirma los datos antes de registrar el vehículo en la flota"
      contentClassName="grid gap-4 text-sm sm:grid-cols-2"
    >
        <div>
          <p className="text-muted-foreground">Número de unidad</p>
          <p className="font-medium">{v.unitNumber || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Placa</p>
          <p className="font-medium">{v.licensePlate || "—"}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Marca / Modelo / Año</p>
          <p className="font-medium">
            {[v.brand, v.model, v.year].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Tipo</p>
          <p className="font-medium">
            {v.type ? VEHICLE_TYPE_LABELS[v.type as VehicleTypeValue] : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Kilometraje actual</p>
          <p className="font-medium">
            {typeof v.currentMileage === "number"
              ? `${new Intl.NumberFormat("es-MX").format(v.currentMileage)} km`
              : "Sin captura (se registrará 0 km)"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">Permiso SCT / Número</p>
          <p className="font-medium">
            {[v.satTipoPermisoCode, v.sctPermitNumber].filter(Boolean).join(" · ") ||
              "—"}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">Remolques</p>
          <p className="font-medium">
            {v.remolques.length > 0
              ? v.remolques
                  .map(
                    (r, idx) =>
                      `#${idx + 1}: ${r.satSubTipoRemCode || "—"} · ${r.licensePlate || "—"}`,
                  )
                  .join(" | ")
              : "Sin remolques"}
          </p>
        </div>
    </FormSectionCard>
  );
}

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
  currentMileage: undefined,
  insurancePolicy: "",
  insuranceExpiry: "",
  sctPermitNumber: "",
  sctPermitExpiry: "",
  // Carta Porte 3.1
  satTipoPermisoCode: "",
  satConfigAutotransporteCode: "",
  pesoBrutoVehicular: undefined,
  insuranceCompany: "",
  aseguraMedioAmbiente: "",
  polizaMedioAmbiente: "",
  aseguraCarga: "",
  polizaCarga: "",
  remolques: [],
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VehicleForm = forwardRef<VehicleFormRef, VehicleFormProps>(
  function VehicleForm(
    {
      vehicle,
      onSubmit,
      isSubmitting = false,
      wizardMode = false,
      wizardStepIndex = 0,
    },
    ref,
  ) {
    const isEditMode = !!vehicle;
    const wizardActive = Boolean(wizardMode && !isEditMode);
    const ws = wizardStepIndex;
    const [showValidationSummary, setShowValidationSummary] = useState(false);

    // CP3.1: alta exige PermSCT/NumPermisoSCT/ConfigVehicular/PesoBruto/AseguraRespCivil/PolizaRespCivil
    // (SoT paquete `validateVehicleForCartaPorteStamp`). En edición usamos el
    // schema laxo para no bloquear ediciones puntuales sobre vehículos legacy.
    const requireCartaPorteFields = !isEditMode;
    const activeSchema = requireCartaPorteFields
      ? createVehicleSchema
      : editVehicleFormSchema;

    const form = useForm<CreateVehicleFormData, unknown, CreateVehicleFormData>({
      resolver: zodResolver(activeSchema) as Resolver<CreateVehicleFormData>,
      defaultValues: vehicle ? formDataFromVehicle(vehicle) : defaultValues,
      mode: "onChange",
    });
    // Destructurar `formState` arriba garantiza que RHF subscribe `errors` / `isValid`
    // (proxy lazy de v7): sin esto, accesos como `form.formState.isValid` en JSX
    // pueden no re-renderizar tras un `trigger()` fallido.
    const { control, handleSubmit: rhfHandleSubmit, trigger, formState } = form;
    const validationMessages = collectFieldErrorMessages(formState.errors);
    const shouldShowValidationSummary =
      showValidationSummary && validationMessages.length > 0;

    const remolquesFieldArray = useFieldArray({
      control,
      name: "remolques",
    });

    const handleSubmit = rhfHandleSubmit((data) => {
      onSubmit(data);
    });

    useImperativeHandle(
      ref,
      () => ({
        triggerStepValidation: async (stepIndex: number) => {
          const fields = VEHICLE_CREATE_WIZARD_STEP_FIELDS[stepIndex];
          if (!fields?.length) return true;
          const ok = await trigger(fields, { shouldFocus: true });
          if (!ok) setShowValidationSummary(true);
          else setShowValidationSummary(false);
          return ok;
        },
        requestSubmit: () => {
          void rhfHandleSubmit(onSubmit)();
        },
      }),
      [trigger, rhfHandleSubmit, onSubmit],
    );

    return (
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 0 && "hidden",
            )}
            data-wizard-panel="0"
            aria-hidden={wizardActive && ws !== 0}
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* IDENTIFICACIÓN */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Identificación"
          icon={<Truck className="h-4 w-4" />}
          description="Datos básicos de identificación del vehículo"
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <VehicleGridInput
              control={control}
              name="unitNumber"
              label="Número de Unidad"
              required
              placeholder="Ej: U-001"
              disabled={isEditMode}
            />
            <VehicleGridInput
              control={control}
              name="licensePlate"
              label="Placa"
              required
              placeholder="Ej: ABC-123-A"
            />
            <VehicleGridInput
              control={control}
              name="vin"
              label="VIN / Serie"
              placeholder="Número de serie del vehículo"
            />
        </FormSectionCard>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARACTERÍSTICAS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Características"
          icon={<Settings className="h-4 w-4" />}
          description="Especificaciones del vehículo"
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            <VehicleGridInput
              control={control}
              name="brand"
              label="Marca"
              required
              placeholder="Ej: Kenworth"
            />
            <VehicleGridInput
              control={control}
              name="model"
              label="Modelo"
              required
              placeholder="Ej: T680"
            />
            <VehicleGridNumberInput
              control={control}
              name="year"
              label="Año"
              required
              min={1900}
              max={new Date().getFullYear() + 1}
            />
            <VehicleGridSelect
              control={control}
              name="type"
              label="Tipo"
              required
              placeholder="Seleccionar tipo"
              options={(Object.values(VehicleType) as VehicleTypeValue[]).map(
                (value) => ({
                  value,
                  label: VEHICLE_TYPE_LABELS[value],
                }),
              )}
            />
            <VehicleGridInput
              control={control}
              name="color"
              label="Color"
              placeholder="Ej: Blanco"
            />
            <VehicleGridNumberInput
              control={control}
              name="currentMileage"
              label="Kilometraje actual"
              min={0}
              placeholder="Opcional — 0 si nuevo"
            />
        </FormSectionCard>
          </div>

          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 1 && "hidden",
            )}
            data-wizard-panel="1"
            aria-hidden={wizardActive && ws !== 1}
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CAPACIDADES */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Capacidades"
          icon={<Gauge className="h-4 w-4" />}
          description="Capacidad de carga y consumo de combustible"
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            <VehicleGridNumberInput
              control={control}
              name="loadCapacity"
              label="Carga (ton)"
              step="0.01"
              min={0}
              placeholder="Ej: 28.5"
              emptyAs="null"
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="volumeCapacity"
              label="Volumen (m3)"
              step="0.01"
              min={0}
              placeholder="Ej: 120"
              emptyAs="null"
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="fuelTankCapacity"
              label="Tanque (L)"
              step="0.01"
              min={0}
              placeholder="Ej: 750"
              emptyAs="null"
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="expectedFuelEfficiency"
              label="Rendimiento (km/L)"
              step="0.01"
              min={0}
              placeholder="Ej: 2.8"
              emptyAs="null"
              parse={(val) => parseFloat(val)}
            />
        </FormSectionCard>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* DOCUMENTACIÓN Y SEGUROS */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title="Documentación y Seguros"
          icon={<ShieldCheck className="h-4 w-4" />}
          description="Datos administrativos para operación y Carta Porte"
          contentClassName="space-y-4"
        >
            {/* Seguro Responsabilidad Civil */}
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Responsabilidad civil
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <VehicleGridInput
                control={control}
                name="insuranceCompany"
                label={
                  <SatFieldLabel
                    label="Aseguradora Resp. Civil"
                    satCode="AseguraRespCivil"
                    showSatCode={false}
                  />
                }
                placeholder="Ej: Qualitas, GNP, HDI"
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="insurancePolicy"
                label={
                  <SatFieldLabel
                    label="Póliza Resp. Civil"
                    satCode="PolizaRespCivil"
                    showSatCode={false}
                  />
                }
                placeholder="Número de póliza"
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="insuranceExpiry"
                label={
                  <SatFieldLabel
                    label="Vencimiento del Seguro"
                    showSatCode={false}
                  />
                }
                type="date"
              />
            </div>

            {/* Permiso SCT — PermSCT + NumPermisoSCT */}
            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Permiso SCT
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-3">
              <VehicleGridCatalogSlot
                control={control}
                name="satTipoPermisoCode"
                label={
                  <SatFieldLabel
                    label="Tipo de Permiso SCT"
                    satCode="PermSCT"
                    showSatCode={false}
                  />
                }
                required={requireCartaPorteFields}
              >
                {({ field, fieldState, resolvedId, errorMessage }) => (
                  <TipoPermisoSelect
                    triggerId={resolvedId}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Seleccionar tipo de permiso"
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                  />
                )}
              </VehicleGridCatalogSlot>
              <VehicleGridInput
                control={control}
                name="sctPermitNumber"
                label={
                  <SatFieldLabel
                    label="Número de Permiso SCT"
                    satCode="NumPermisoSCT"
                    showSatCode={false}
                  />
                }
                placeholder="Número de permiso"
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="sctPermitExpiry"
                label={
                  <SatFieldLabel
                    label="Vencimiento del Permiso"
                    showSatCode={false}
                  />
                }
                type="date"
              />
            </div>
        </FormSectionCard>
          </div>

          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 2 && "hidden",
            )}
            data-wizard-panel="2"
            aria-hidden={wizardActive && ws !== 2}
          >
        {/* ════════════════════════════════════════════════════════════════ */}
        {/* CARTA PORTE 3.1 — AUTOTRANSPORTE */}
        {/* ════════════════════════════════════════════════════════════════ */}
        <FormSectionCard
          title={
            <span className="inline-flex items-center gap-2">
              Carta Porte 3.1 — Autotransporte
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                SAT
              </Badge>
            </span>
          }
          icon={<FileText className="h-4 w-4" />}
          description="Datos SAT base del vehículo (se pueden complementar por viaje/carga)"
          contentClassName="space-y-6"
        >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {requireCartaPorteFields
                  ? "Los campos marcados con * son obligatorios para que el vehículo sea timbrable en Carta Porte 3.1. Placa y año del vehículo se reutilizan en el XML."
                  : "Se usa automáticamente al generar Carta Porte. Placa y año se toman del vehículo. Completa los campos vacíos para que el vehículo sea timbrable."}
              </AlertDescription>
            </Alert>

            {/* ── IdentificacionVehicular ─────────────────────────────────── */}
            <div>
              <p className="text-sm font-medium mb-3">
                Identificación Vehicular
              </p>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <VehicleGridCatalogSlot
                  control={control}
                  name="satConfigAutotransporteCode"
                  label={
                    <SatFieldLabel
                      label="Configuración Vehicular"
                      satCode="ConfigVehicular"
                      showSatCode={false}
                    />
                  }
                  required={requireCartaPorteFields}
                >
                  {({ field, fieldState, resolvedId, errorMessage }) => (
                    <ConfigAutotransporteSelect
                      triggerId={resolvedId}
                      value={field.value}
                      onValueChange={field.onChange}
                      placeholder="Seleccionar configuración"
                      error={Boolean(fieldState.error)}
                      {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                    />
                  )}
                </VehicleGridCatalogSlot>
                <VehicleGridNumberInput
                  control={control}
                  name="pesoBrutoVehicular"
                  label={
                    <SatFieldLabel
                      label="Peso Bruto Vehicular (ton)"
                      satCode="PesoBrutoVehicular"
                      showSatCode={false}
                    />
                  }
                  step="0.001"
                  min={0}
                  max={9999.999}
                  placeholder="Ej: 35"
                  parse={(val) => parsePesoBrutoVehicularFormInput(val)}
                  required={requireCartaPorteFields}
                />
              </div>
            </div>

            {/* ── Remolques ──────────────────────────────────────────────────── */}
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">Remolques (máx. 2)</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    remolquesFieldArray.append({
                      satSubTipoRemCode: "",
                      licensePlate: "",
                    })
                  }
                  disabled={remolquesFieldArray.fields.length >= 2}
                >
                  Agregar remolque
                </Button>
              </div>

              {remolquesFieldArray.fields.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Sin remolques registrados para este vehículo.
                </p>
              ) : (
                <div className="space-y-3">
                  {remolquesFieldArray.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="grid items-start gap-4 rounded-md border p-3 sm:grid-cols-2"
                    >
                      <VehicleGridCatalogSlot
                        control={control}
                        name={`remolques.${index}.satSubTipoRemCode`}
                        label={
                          <SatFieldLabel
                            label={`SubTipoRem #${index + 1}`}
                            satCode="SubTipoRem"
                            showSatCode={false}
                          />
                        }
                      >
                        {({ field, fieldState, resolvedId, errorMessage }) => (
                          <SubTipoRemSelect
                            triggerId={resolvedId}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Seleccionar subtipo"
                            error={Boolean(fieldState.error)}
                            {...getFieldErrorAriaProps(resolvedId, errorMessage)}
                          />
                        )}
                      </VehicleGridCatalogSlot>
                      <Controller
                        control={control}
                        name={`remolques.${index}.licensePlate`}
                        render={({ field, fieldState }) => {
                          const fieldId = `remolques.${index}.licensePlate`;
                          const errorMessage = fieldState.error?.message;
                          return (
                            <VehicleGridField
                              fieldId={fieldId}
                              label={
                                <SatFieldLabel
                                  label={`Placa remolque #${index + 1}`}
                                  satCode="Placa"
                                  showSatCode={false}
                                />
                              }
                              errorMessage={errorMessage}
                            >
                              <Input
                                id={fieldId}
                                placeholder="Ej: REM1234"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9]/g, ""),
                                  )
                                }
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                                error={Boolean(fieldState.error)}
                                {...getFieldErrorAriaProps(fieldId, errorMessage)}
                              />
                            </VehicleGridField>
                          );
                        }}
                      />

                      <div className="sm:col-span-2 flex justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remolquesFieldArray.remove(index)}
                        >
                          Quitar remolque
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Seguros Opcionales ──────────────────────────────────────── */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Seguros adicionales predeterminados (opcionales)
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                Estos datos funcionan como base para Carta Porte; si un viaje o
                carga requiere un seguro distinto, se captura en ese flujo.
              </p>

              {/* Medio Ambiente */}
              <div className="grid items-start gap-4 sm:grid-cols-2 mb-4">
                <VehicleGridInput
                  control={control}
                  name="aseguraMedioAmbiente"
                  label={
                    <SatFieldLabel
                      label="Aseguradora Medio Ambiente"
                      satCode="AseguraMedioAmbiente"
                      showSatCode={false}
                    />
                  }
                  placeholder="Aseguradora por defecto"
                />
                <VehicleGridInput
                  control={control}
                  name="polizaMedioAmbiente"
                  label={
                    <SatFieldLabel
                      label="Póliza Medio Ambiente"
                      satCode="PolizaMedioAmbiente"
                      showSatCode={false}
                    />
                  }
                  placeholder="Póliza por defecto"
                />
              </div>

              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                El seguro de carga (aseguradora y póliza) se captura por
                mercancía en el wizard de viajes, no a nivel de vehículo.
              </div>
            </div>
        </FormSectionCard>
          </div>

          <div
            className={cn(!wizardActive || ws !== 3 ? "hidden" : undefined)}
            data-wizard-panel="3"
            aria-hidden={!wizardActive || ws !== 3}
          >
            <VehicleCreateWizardSummary />
          </div>

          {shouldShowValidationSummary ? (
            <FormValidationSummary
              messages={validationMessages}
              title={
                wizardActive
                  ? "Revisa la información del vehículo"
                  : "Revisa los siguientes campos"
              }
            />
          ) : null}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SUBMIT (solo edición o formulario completo sin wizard) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {!wizardActive && (
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
        )}
      </form>
      </FormProvider>
  );
  },
);

VehicleForm.displayName = "VehicleForm";

export default VehicleForm;
