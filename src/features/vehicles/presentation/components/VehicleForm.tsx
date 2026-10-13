/**
 * VehicleForm
 *
 * Formulario reutilizable para crear/editar vehículos.
 * Incluye campos de Carta Porte 3.1.
 *
 * Ubicación: src/features/vehicles/presentation/components/VehicleForm.tsx
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { Link } from "react-router-dom";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type Control,
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
  ChevronDown,
} from "lucide-react";

import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Input } from "@shared/ui/input";
import {
  FormStickyActions,
  FormValidationSummary,
  LongFormEditLayout,
  LongFormSectionNav,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  VEHICLE_EDIT_SECTION_IDS,
  VEHICLE_EDIT_SECTIONS,
  countVehicleEditSectionErrors,
} from "./vehicleEditSections";
import { Alert, AlertDescription } from "@shared/ui/alert";
import { SatFieldLabel } from "@shared/ui/data-display";
import { RHFSelect } from "@shared/ui/form/RHFSelect";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@shared/ui/collapsible";
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
  isBillableMotrizType,
  type VehicleTypeValue,
  type Vehicle,
} from "@features/vehicles/domain";

// Importar componentes de catálogo
import {
  TipoPermisoSelect,
  ConfigAutotransporteSelect,
} from "@features/catalogs";
import { cn } from "@shared/lib/utils/cn";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import {
  VehicleGridCatalogSlot,
  VehicleGridDateField,
  VehicleGridField,
  VehicleGridInput,
  VehicleGridNumberInput,
  VehicleGridSelect,
} from "./VehicleFormFields";
import { VehicleEditIdentityBanner } from "./VehicleEditIdentityBanner";
import { VehicleBillingPolicyNote } from "./VehicleBillingPolicyNote";
import { useVehicleCatalogLabels } from "../hooks/useVehicleCatalogLabels";
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
  /** Notifica dirty a la página para `useUnsavedChangesGuard` (D11). */
  onDirtyChange?: (isDirty: boolean) => void;
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
    remolques: [],
    branchId: vehicle.branchId ?? undefined,
  };
}

// ============================================================================
// DEFAULT VALUES
// ============================================================================

function VehicleOptionalInsuranceFields({
  control,
}: {
  control: Control<CreateVehicleFormData>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="space-y-3">
      <CollapsibleTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full justify-between px-0 py-1 text-left hover:bg-transparent"
        >
          <span className="text-sm font-medium">
            {fc.section.cartaPorte.optionalInsuranceLabel}
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            {fc.section.cartaPorte.groupOptionalInsurance}
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
          </span>
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          {fc.section.cartaPorte.optionalInsuranceHint}
        </p>
        <div className="grid items-start gap-4 sm:grid-cols-2">
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
      </CollapsibleContent>
    </Collapsible>
  );
}

function VehicleCreateWizardSummary() {
  const form = useFormContext<CreateVehicleFormData>();
  const v = form.watch();
  const showBillingNotice = isBillableMotrizType(v.type);
  const { tipoPermisoLabel, configVehicularLabel, isLoading } =
    useVehicleCatalogLabels();
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
  const branchLabel = v.branchId
    ? (branchesResult?.data ?? []).find((b) => b.id === v.branchId)?.name
    : undefined;
  const permisoLabel =
    tipoPermisoLabel(v.satTipoPermisoCode) ?? v.satTipoPermisoCode;
  const configLabel =
    configVehicularLabel(v.satConfigAutotransporteCode) ??
    v.satConfigAutotransporteCode;
  const rcLine = [v.insuranceCompany, v.insurancePolicy]
    .filter(Boolean)
    .join(" · ");
  const sctLine = [permisoLabel, v.sctPermitNumber].filter(Boolean).join(" · ");
  const pesoLabel =
    typeof v.pesoBrutoVehicular === "number"
      ? vehiclesCopy.detail.format.pesoBruto(v.pesoBrutoVehicular)
      : fc.hint.reviewEmpty;

  return (
    <div className="space-y-4">
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
              {v.type
                ? VEHICLE_TYPE_LABELS[v.type as VehicleTypeValue]
                : fc.hint.reviewEmpty}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewBranch}</p>
            <p className="font-medium">{branchLabel || fc.hint.reviewEmpty}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewMileage}</p>
            <p className="font-medium">
              {typeof v.currentMileage === "number"
                ? vehiclesCopy.detail.format.statMileage(v.currentMileage)
                : fc.hint.reviewMileageDefault}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewRc}</p>
            <p className="font-medium">{rcLine || fc.hint.reviewEmpty}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewSct}</p>
            <p className="font-medium">
              {sctLine ||
                (isLoading
                  ? vehiclesCopy.detail.hint.catalogLoading
                  : fc.hint.reviewEmpty)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewConfig}</p>
            <p className="font-medium">
              {configLabel ||
                (isLoading
                  ? vehiclesCopy.detail.hint.catalogLoading
                  : fc.hint.reviewEmpty)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">{fc.label.reviewPeso}</p>
            <p className="font-medium">{pesoLabel}</p>
          </div>
      </FormSectionCard>
      {showBillingNotice ? (
        <Alert variant="info">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <VehicleBillingPolicyNote kind="create" />
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
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
      onDirtyChange,
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
    const { control, handleSubmit: rhfHandleSubmit, trigger, formState, watch } =
      form;
    const { errors, isDirty } = formState;

    useEffect(() => {
      onDirtyChange?.(isDirty);
    }, [isDirty, onDirtyChange]);

    const selectedType = watch("type");
    const typeBillingHint = isBillableMotrizType(selectedType)
      ? vehiclesCopy.billingPolicy.create
      : selectedType === VehicleType.UTILITY
        ? vehiclesCopy.billingPolicy.utilityNotAssignable
        : undefined;
    const validationMessages = collectFieldErrorMessages(errors);

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

    const shouldShowValidationSummary =
      showValidationSummary && validationMessages.length > 0;

    const [activeSectionId, setActiveSectionId] = useState<string>(
      VEHICLE_EDIT_SECTION_IDS.identification,
    );

    const errorCountBySection = useMemo(
      () => countVehicleEditSectionErrors(errors),
      [errors],
    );

    const handleEditSectionSelect = useCallback((sectionId: string) => {
      setActiveSectionId(sectionId);
      document
        .getElementById(sectionId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, []);

    const sectionPanels = (
      <>
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
        <div
          id={
            isEditMode
              ? VEHICLE_EDIT_SECTION_IDS.identification
              : undefined
          }
          className={isEditMode ? "scroll-mt-28" : undefined}
        >
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
        </div>

        <div
          id={
            isEditMode
              ? VEHICLE_EDIT_SECTION_IDS.characteristics
              : undefined
          }
          className={isEditMode ? "scroll-mt-28" : undefined}
        >
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
              hint={typeBillingHint}
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
                    {fc.hint.branchOverQuotaLead}{" "}
                    <Link to="/branches" className="underline underline-offset-4">
                      {fc.hint.branchOverQuotaAdjust}
                    </Link>{" "}
                    {fc.hint.branchOverQuotaTail}
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
          </div>

          <div
            className={cn(
              "space-y-6",
              wizardActive && ws !== 1 && "hidden",
            )}
            data-wizard-panel="1"
            aria-hidden={wizardActive && ws !== 1}
          >
        {/* D7 edit: Capacidades antes de Documentación; wizard las deja sub-bloque en docs (D9). */}
        {!wizardActive ? (
          <div
            id={VEHICLE_EDIT_SECTION_IDS.capacities}
            className="scroll-mt-28"
          >
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
          </div>
        ) : null}

        <div
          id={
            isEditMode
              ? VEHICLE_EDIT_SECTION_IDS.documentation
              : undefined
          }
          className={isEditMode ? "scroll-mt-28" : undefined}
        >
        <FormSectionCard
          title={fc.section.documentation.title}
          icon={<ShieldCheck className="h-4 w-4" />}
          description={fc.section.documentation.description}
          contentClassName="space-y-4"
        >
            <p className="text-sm font-medium text-muted-foreground">
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
              <VehicleGridDateField
                control={control}
                name="insuranceExpiry"
                label={
                  <SatFieldLabel
                    label={fc.label.insuranceExpiry}
                    showSatCode={false}
                  />
                }
              />
            </div>

            <p className="pt-1 text-sm font-medium text-muted-foreground">
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
              <VehicleGridDateField
                control={control}
                name="sctPermitExpiry"
                label={
                  <SatFieldLabel
                    label={fc.label.sctPermitExpiry}
                    showSatCode={false}
                  />
                }
              />
            </div>

            {wizardActive ? (
              <div className="space-y-3 border-t pt-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium">
                    {fc.section.capacities.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fc.section.capacities.optionalHint}
                  </p>
                </div>
                <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                </div>
              </div>
            ) : null}
        </FormSectionCard>
        </div>
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
        <div
          id={
            isEditMode ? VEHICLE_EDIT_SECTION_IDS.cartaPorte : undefined
          }
          className={isEditMode ? "scroll-mt-28" : undefined}
        >
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
                <div className="space-y-2">
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
                  <p className="text-xs text-muted-foreground">
                    {fc.hint.trailerAssignedOnTrip}{" "}
                    {fc.hint.trailerCatalogPrefix}
                    <Link
                      to="/trailers"
                      className="font-medium underline underline-offset-2"
                    >
                      {fc.hint.trailerCatalogLink}
                    </Link>
                    .
                  </p>
                </div>
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

            <VehicleOptionalInsuranceFields control={control} />

            <div className="rounded-md border border-dashed bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              {fc.section.cartaPorte.cargoInsuranceFootnote}
            </div>
        </FormSectionCard>
        </div>
          </div>

          <div
            className={cn(!wizardActive || ws !== 3 ? "hidden" : undefined)}
            data-wizard-panel="3"
            aria-hidden={!wizardActive || ws !== 3}
          >
            <VehicleCreateWizardSummary />
          </div>
      </>
    );

    return (
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isEditMode && vehicle ? (
            <VehicleEditIdentityBanner vehicle={vehicle} />
          ) : null}

          {isEditMode ? (
            <LongFormEditLayout
              nav={
                <LongFormSectionNav
                  sections={VEHICLE_EDIT_SECTIONS}
                  activeSectionId={activeSectionId}
                  errorCountBySection={errorCountBySection}
                  onSelectSection={handleEditSectionSelect}
                  title={fc.edit.sidebar.title}
                  errorsTitle={fc.edit.sidebar.errorsTitle}
                  errorsAria={fc.edit.sidebar.errorsAria}
                />
              }
            >
              {sectionPanels}
            </LongFormEditLayout>
          ) : (
            sectionPanels
          )}

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

          {!wizardActive ? (
            <FormStickyActions sticky={isEditMode}>
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
            </FormStickyActions>
          ) : null}
        </form>
      </FormProvider>
    );
  },
);

VehicleForm.displayName = "VehicleForm";

export default VehicleForm;
