/**
 * VehicleForm
 *
 * Formulario reutilizable para crear/editar vehículos.
 * Incluye campos de Carta Porte 3.1.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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
import { FieldInlineError, FormValidationSummary, getFieldErrorAriaProps } from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { SatFieldLabel } from "@shared/ui/data-display";
import { RHFSelect } from "@shared/ui/form/RHFSelect";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { BranchStatus, useBranches } from "@features/branches";
import { buildBranchSelectOptionsWithEligibility } from "@shared/utils/branchSelectUtils";

import {
  createVehicleSchema,
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
import { VehicleEditIdentityBanner } from "./VehicleEditIdentityBanner";
import { vehiclesCopy } from "../copy";

const fc = vehiclesCopy.form;

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
  /** Callback para cancelar (modo edición) */
  onCancel?: () => void;
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
      parsePesoBrutoVehicularFormInput(vehicle.cartaPorte.pesoBrutoVehicular) ??
      (undefined as unknown as number),
    insuranceCompany: vehicle.cartaPorte.insuranceCompany ?? "",
    aseguraMedioAmbiente: vehicle.cartaPorte.aseguraMedioAmbiente ?? "",
    polizaMedioAmbiente: vehicle.cartaPorte.polizaMedioAmbiente ?? "",
    aseguraCarga: vehicle.cartaPorte.aseguraCarga ?? "",
    polizaCarga: vehicle.cartaPorte.polizaCarga ?? "",
    remolques: vehicle.cartaPorte.remolques.map((remolque) => ({
      satSubTipoRemCode: remolque.satSubTipoRemCode,
      licensePlate: remolque.licensePlate,
    })),
    branchId: vehicle.branchId ?? undefined,
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
      title={fc.section.review.title}
      icon={<ClipboardCheck className="h-4 w-4" />}
      description={fc.section.review.description}
      contentClassName="grid gap-4 text-sm sm:grid-cols-2"
    >
        <div>
          <p className="text-muted-foreground">{fc.label.reviewUnit}</p>
          <p className="font-medium">{v.unitNumber || fc.hint.reviewEmpty}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{fc.label.reviewPlate}</p>
          <p className="font-medium">{v.licensePlate || fc.hint.reviewEmpty}</p>
        </div>
        <div>
          <p className="text-muted-foreground">{fc.label.reviewBrandModel}</p>
          <p className="font-medium">
            {[v.brand, v.model, v.year].filter(Boolean).join(" · ") ||
              fc.hint.reviewEmpty}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{fc.label.reviewType}</p>
          <p className="font-medium">
            {v.type ? VEHICLE_TYPE_LABELS[v.type as VehicleTypeValue] : fc.hint.reviewEmpty}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{fc.label.reviewMileage}</p>
          <p className="font-medium">
            {typeof v.currentMileage === "number"
              ? vehiclesCopy.detail.format.statMileage(v.currentMileage)
              : fc.hint.reviewMileageDefault}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">{fc.label.reviewSct}</p>
          <p className="font-medium">
            {[v.satTipoPermisoCode, v.sctPermitNumber].filter(Boolean).join(" · ") ||
              fc.hint.reviewEmpty}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-muted-foreground">{fc.label.reviewTrailers}</p>
          <p className="font-medium">
            {v.remolques.length > 0
              ? v.remolques
                  .map(
                    (r, idx) =>
                      `#${idx + 1}: ${r.satSubTipoRemCode || fc.hint.reviewEmpty} · ${r.licensePlate || fc.hint.reviewEmpty}`,
                  )
                  .join(" | ")
              : fc.hint.noTrailers}
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
  pesoBrutoVehicular: undefined as unknown as number,
  insuranceCompany: "",
  aseguraMedioAmbiente: "",
  polizaMedioAmbiente: "",
  aseguraCarga: "",
  polizaCarga: "",
  remolques: [],
  branchId: undefined,
};

// ============================================================================
// COMPONENT
// ============================================================================

export const VehicleForm = forwardRef<VehicleFormRef, VehicleFormProps>(
  function VehicleForm(
    {
      vehicle,
      onSubmit,
      onCancel,
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

    // CP3.1: alta (y edición) exigen PermSCT/NumPermisoSCT/ConfigVehicular/PesoBruto/
    // AseguraRespCivil/PolizaRespCivil (SoT `validateVehicleForCartaPorteStamp`).
    // AnioModeloVM: year ≥ 1980 (piso del paquete).
    const requireCartaPorteFields = true;
    const activeSchema = createVehicleSchema;

    const form = useForm<CreateVehicleFormData, unknown, CreateVehicleFormData>({
      resolver: zodResolver(activeSchema) as Resolver<CreateVehicleFormData>,
      defaultValues: vehicle ? formDataFromVehicle(vehicle) : defaultValues,
      mode: "onChange",
    });
    // Destructurar `formState` arriba garantiza que RHF subscribe `errors` / `isValid`
    // (proxy lazy de v7): sin esto, accesos como `form.formState.isValid` en JSX
    // pueden no re-renderizar tras un `trigger()` fallido.
    const { control, handleSubmit: rhfHandleSubmit, trigger, formState } = form;
    const { errors, isDirty } = formState;
    const validationMessages = collectFieldErrorMessages(errors);
    const shouldShowValidationSummary =
      showValidationSummary && validationMessages.length > 0;

    const remolquesFieldArray = useFieldArray({
      control,
      name: "remolques",
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

    const branchOptions = useMemo(
      () =>
        buildBranchSelectOptionsWithEligibility(
          branchesResult?.data ?? [],
          branchesResult?.meta?.overQuota
            ? branchesResult.meta.planEligibleBranchIds
            : [],
          isEditMode ? (vehicle?.branchId ?? undefined) : undefined,
        ),
      [branchesResult, isEditMode, vehicle?.branchId],
    );
    const hasBranchOptions = branchOptions.length > 0;
    const currentBranchOutsidePlan =
      isEditMode &&
      Boolean(vehicle?.branchId) &&
      branchesResult?.meta?.overQuota &&
      !branchesResult.meta.planEligibleBranchIds.includes(
        vehicle?.branchId ?? "",
      );

    const onInvalid = () => {
      setShowValidationSummary(true);
    };

    const handleSubmit = rhfHandleSubmit((data) => {
      setShowValidationSummary(false);
      onSubmit(data);
    }, onInvalid);

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
          void rhfHandleSubmit((data) => {
            setShowValidationSummary(false);
            onSubmit(data);
          }, onInvalid)();
        },
      }),
      [trigger, rhfHandleSubmit, onSubmit],
    );

    const remolquesErrorMessage =
      typeof errors.remolques?.message === "string"
        ? errors.remolques.message
        : typeof errors.remolques?.root?.message === "string"
          ? errors.remolques.root.message
          : undefined;

    return (
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isEditMode && vehicle ? (
            <VehicleEditIdentityBanner vehicle={vehicle} />
          ) : null}

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
          title={fc.section.identification.title}
          icon={<Truck className="h-4 w-4" />}
          description={fc.section.identification.description}
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
            <VehicleGridInput
              control={control}
              name="unitNumber"
              label={fc.label.unitNumber}
              required
              placeholder={fc.placeholder.unitNumber}
              disabled={isEditMode}
            />
            <Controller
              control={control}
              name="licensePlate"
              render={({ field, fieldState }) => {
                const fieldId = "licensePlate";
                const errorMessage = fieldState.error?.message;
                return (
                  <VehicleGridField
                    fieldId={fieldId}
                    label={fc.label.licensePlate}
                    required
                    errorMessage={errorMessage}
                  >
                    <Input
                      id={fieldId}
                      placeholder={fc.placeholder.licensePlate}
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
            <VehicleGridInput
              control={control}
              name="vin"
              label={fc.label.vin}
              placeholder={fc.placeholder.vin}
            />
        </FormSectionCard>

        <FormSectionCard
          title={fc.section.characteristics.title}
          icon={<Settings className="h-4 w-4" />}
          description={fc.section.characteristics.description}
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            <VehicleGridInput
              control={control}
              name="brand"
              label={fc.label.brand}
              required
              placeholder={fc.placeholder.brand}
            />
            <VehicleGridInput
              control={control}
              name="model"
              label={fc.label.model}
              required
              placeholder={fc.placeholder.model}
            />
            <VehicleGridNumberInput
              control={control}
              name="year"
              label={fc.label.year}
              required
              min={1980}
              max={new Date().getFullYear() + 1}
            />
            <VehicleGridSelect
              control={control}
              name="type"
              label={fc.label.type}
              required
              placeholder={fc.placeholder.selectType}
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
              label={fc.label.color}
              placeholder={fc.placeholder.color}
            />
            <VehicleGridField
              fieldId="branchId"
              label={fc.label.baseBranch}
              className="sm:col-span-2"
            >
              <div className="space-y-2">
                {hasBranchOptions ? (
                  <RHFSelect
                    control={control}
                    name="branchId"
                    options={branchOptions}
                    placeholder={fc.placeholder.selectBranch}
                  />
                ) : (
                  <>
                    <Select disabled>
                      <SelectTrigger disabled>
                        <SelectValue placeholder={fc.placeholder.selectBranch} />
                      </SelectTrigger>
                      <SelectContent />
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {fc.hint.noBranches}
                    </p>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to="/branches/new">{fc.action.createBranch}</Link>
                    </Button>
                  </>
                )}
                {currentBranchOutsidePlan ? (
                  <p className="text-xs text-destructive">
                    La sucursal actual excede la capacidad de tu plan.{" "}
                    <Link to="/branches" className="underline underline-offset-4">
                      Ajusta sucursales
                    </Link>{" "}
                    o elige una sucursal incluida en el plan al guardar cambios.
                  </p>
                ) : null}
              </div>
            </VehicleGridField>
            <VehicleGridNumberInput
              control={control}
              name="currentMileage"
              label={fc.label.currentMileage}
              min={0}
              placeholder={fc.placeholder.currentMileage}
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
          title={fc.section.capacities.title}
          icon={<Gauge className="h-4 w-4" />}
          description={fc.section.capacities.description}
          contentClassName="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
            <VehicleGridNumberInput
              control={control}
              name="loadCapacity"
              label={fc.label.loadCapacity}
              step="0.01"
              min={0}
              placeholder={fc.placeholder.loadCapacity}
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="volumeCapacity"
              label={fc.label.volumeCapacity}
              step="0.01"
              min={0}
              placeholder={fc.placeholder.volumeCapacity}
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="fuelTankCapacity"
              label={fc.label.fuelTankCapacity}
              step="0.01"
              min={0}
              placeholder={fc.placeholder.fuelTankCapacity}
              parse={(val) => parseFloat(val)}
            />
            <VehicleGridNumberInput
              control={control}
              name="expectedFuelEfficiency"
              label={fc.label.expectedFuelEfficiency}
              step="0.01"
              min={0}
              placeholder={fc.placeholder.expectedFuelEfficiency}
              parse={(val) => parseFloat(val)}
            />
        </FormSectionCard>

        <FormSectionCard
          title={fc.section.documentation.title}
          icon={<ShieldCheck className="h-4 w-4" />}
          description={fc.section.documentation.description}
          contentClassName="space-y-4"
        >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {fc.section.documentation.groupRc}
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VehicleGridInput
                control={control}
                name="insuranceCompany"
                label={
                  <SatFieldLabel
                    label={fc.label.insuranceCompany}
                    satCode="AseguraRespCivil"
                    showSatCode={false}
                  />
                }
                placeholder={fc.placeholder.insuranceCompany}
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="insurancePolicy"
                label={
                  <SatFieldLabel
                    label={fc.label.insurancePolicy}
                    satCode="PolizaRespCivil"
                    showSatCode={false}
                  />
                }
                placeholder={fc.placeholder.insurancePolicy}
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="insuranceExpiry"
                label={
                  <SatFieldLabel
                    label={fc.label.insuranceExpiry}
                    showSatCode={false}
                  />
                }
                type="date"
              />
            </div>

            <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {fc.section.documentation.groupSct}
            </p>
            <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <VehicleGridCatalogSlot
                control={control}
                name="satTipoPermisoCode"
                label={
                  <SatFieldLabel
                    label={fc.label.satTipoPermiso}
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
                    placeholder={fc.placeholder.selectPermiso}
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
                    label={fc.label.sctPermitNumber}
                    satCode="NumPermisoSCT"
                    showSatCode={false}
                  />
                }
                placeholder={fc.placeholder.sctPermitNumber}
                required={requireCartaPorteFields}
              />
              <VehicleGridInput
                control={control}
                name="sctPermitExpiry"
                label={
                  <SatFieldLabel
                    label={fc.label.sctPermitExpiry}
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
              {fc.section.cartaPorte.title}
              <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-medium">
                SAT
              </Badge>
            </span>
          }
          icon={<FileText className="h-4 w-4" />}
          description={fc.section.cartaPorte.description}
          contentClassName="space-y-6"
        >
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                {isEditMode
                  ? fc.alert.cartaPorteEdit
                  : fc.alert.cartaPorteCreate}
              </AlertDescription>
            </Alert>

            <div>
              <p className="mb-3 text-sm font-medium">
                {fc.section.cartaPorte.groupVehicleId}
              </p>
              <div className="grid items-start gap-4 sm:grid-cols-2">
                <VehicleGridCatalogSlot
                  control={control}
                  name="satConfigAutotransporteCode"
                  label={
                    <SatFieldLabel
                      label={fc.label.satConfig}
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
                      placeholder={fc.placeholder.selectConfig}
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
                      label={fc.label.pesoBruto}
                      satCode="PesoBrutoVehicular"
                      showSatCode={false}
                    />
                  }
                  step="0.001"
                  min={0}
                  max={9999.999}
                  placeholder={fc.placeholder.loadCapacity}
                  parse={(val) => parsePesoBrutoVehicularFormInput(val)}
                  required={requireCartaPorteFields}
                />
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-medium">
                  {fc.section.cartaPorte.groupTrailers}
                </p>
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
                  {fc.action.addTrailer}
                </Button>
              </div>

              {remolquesFieldArray.fields.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {fc.hint.noTrailers}
                  </p>
                  <FieldInlineError
                    fieldId="remolques"
                    message={remolquesErrorMessage}
                  />
                </div>
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
                            label={fc.label.trailerSubtipo(index + 1)}
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
                            placeholder={fc.placeholder.selectSubtipoRem}
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
                                  label={fc.label.trailerPlate(index + 1)}
                                  satCode="Placa"
                                  showSatCode={false}
                                />
                              }
                              errorMessage={errorMessage}
                            >
                              <Input
                                id={fieldId}
                                placeholder={fc.placeholder.trailerPlate}
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
                          {fc.action.removeTrailer}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {fc.section.cartaPorte.groupOptionalInsurance}
              </p>
              <p className="mb-4 text-xs text-muted-foreground">
                {fc.section.cartaPorte.optionalInsuranceHint}
              </p>

              <div className="mb-4 grid items-start gap-4 sm:grid-cols-2">
                <VehicleGridInput
                  control={control}
                  name="aseguraMedioAmbiente"
                  label={
                    <SatFieldLabel
                      label={fc.label.aseguraMedioAmbiente}
                      satCode="AseguraMedioAmbiente"
                      showSatCode={false}
                    />
                  }
                  placeholder={fc.placeholder.optionalInsurer}
                />
                <VehicleGridInput
                  control={control}
                  name="polizaMedioAmbiente"
                  label={
                    <SatFieldLabel
                      label={fc.label.polizaMedioAmbiente}
                      satCode="PolizaMedioAmbiente"
                      showSatCode={false}
                    />
                  }
                  placeholder={fc.placeholder.optionalPolicy}
                />
              </div>

              <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {fc.section.cartaPorte.cargoInsuranceFootnote}
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
                  ? fc.validation.summaryWizard
                  : fc.validation.summaryEdit
              }
            />
          ) : null}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* SUBMIT (solo edición o formulario completo sin wizard) */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {!wizardActive && (
          <div className="flex items-center justify-end gap-4 border-t pt-4">
            {isEditMode && onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {fc.action.cancel}
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting || (isEditMode && !isDirty)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {fc.action.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditMode ? fc.action.save : fc.create.submit}
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
