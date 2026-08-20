import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  useWatch,
  type Control,
  type FieldErrors,
  type Resolver,
} from "react-hook-form";
import { Building2, Loader2, MapPin, Pencil, Phone, Save } from "lucide-react";
import { Button } from "@shared/ui/button";
import { AlertWithIcon } from "@shared/ui/alert";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
  RHFSelectField,
  RHFTextField,
  RHFTextareaField,
} from "@shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FormSectionCard } from "@shared/ui/form-section-card";
import AddressInput from "@shared/ui/address-input/AddressInput";
import {
  AddressGeocodingSectionContent,
  AddressGeocodingSectionTitle,
} from "@shared/ui/address-input/AddressGeocodingFormSection";
import { setFormCoordinates } from "@shared/ui/address-input/setFormCoordinates";
import { ADDRESS_FORM_COPY } from "@shared/ui/address-input/addressFormCopy";
import type { LatLng } from "@shared/geolocation";
import { useToast } from "@shared/hooks";
import {
  collectFieldErrorMessages,
  formatFormValidationToastDescription,
} from "@shared/utils/formErrors";
import { branchesCopy } from "../copy/branchesCopy";
import type { Branch } from "../../domain";
import { BranchStatus, BRANCH_STATUS_LABELS } from "../../domain";
import {
  branchFormSchema,
  defaultBranchFormValues,
  type BranchFormData,
} from "../validation/branchSchema";
import { validateBranchOperationalAddressFormComplete } from "../validation/branchOperationalAddressSchema";
import { cn } from "@shared/lib/utils/cn";

export type BranchFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: BranchFormData) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  wizardMode?: boolean;
  wizardStepIndex?: number;
  /** Navega a un paso del wizard (usado por el resumen para «Editar»). */
  onEditStep?: (stepIndex: number) => void;
}

const WIZARD_ADDRESS_STEP_INDEX = 1;

const WIZARD_STEP_FIELDS: (keyof BranchFormData | `address.${string}`)[][] = [
  ["code", "name", "status", "isMain", "phone", "email", "managerName"],
  [
    "notes",
    "address.street",
    "address.exteriorNumber",
    "address.postalCode",
    "address.satCountryCode",
    "address.satStateCode",
    "address.satMunicipalityCode",
    "address.neighborhoodName",
  ],
];

function branchToFormData(branch: Branch): BranchFormData {
  return {
    code: branch.code,
    name: branch.name,
    status: branch.status,
    isMain: branch.isMain,
    address: {
      addressType: "branch",
      isPrimary: true,
      street: branch.address.street,
      exteriorNumber: branch.address.exteriorNumber ?? "",
      interiorNumber: branch.address.interiorNumber,
      reference: null,
      postalCode: branch.address.postalCode,
      satCountryCode: branch.address.satCountryCode ?? "MEX",
      satStateCode: branch.address.satStateCode ?? "",
      satMunicipalityCode: branch.address.satMunicipalityCode ?? "",
      satLocalityCode: branch.address.satLocalityCode ?? null,
      localityName: branch.address.localityName ?? null,
      satNeighborhoodCode: branch.address.satNeighborhoodCode ?? null,
      neighborhoodName: branch.address.neighborhood ?? null,
      latitude: branch.address.latitude ?? null,
      longitude: branch.address.longitude ?? null,
    },
    phone: branch.contact.phone ?? "",
    email: branch.contact.email ?? "",
    managerName: branch.contact.managerName ?? "",
    notes: branch.notes ?? "",
  };
}

function MainInactiveWarning({
  control,
  isEditing = false,
}: {
  control: Control<BranchFormData>;
  isEditing?: boolean;
}) {
  const isMain = useWatch({ control, name: "isMain" });
  const status = useWatch({ control, name: "status" });
  const warning = branchesCopy.form.mainInactiveWarning;

  if (!isMain || status !== BranchStatus.INACTIVE) return null;

  return (
    <AlertWithIcon
      variant="warning"
      className="sm:col-span-2"
      title={warning.title}
    >
      {isEditing ? warning.editText : warning.text}
    </AlertWithIcon>
  );
}

function BranchContactFields({
  control,
  fieldCopy,
}: {
  control: Control<BranchFormData>;
  fieldCopy: typeof branchesCopy.form.fields;
}) {
  return (
    <>
      <RHFTextField
        control={control}
        name="phone"
        label={fieldCopy.phone.label}
        placeholder={fieldCopy.phone.placeholder}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        maxLength={25}
      />
      <RHFTextField
        control={control}
        name="email"
        label={fieldCopy.email.label}
        placeholder={fieldCopy.email.placeholder}
        type="email"
        inputMode="email"
        autoComplete="email"
      />
      <div className="sm:col-span-2">
        <RHFTextField
          control={control}
          name="managerName"
          label={fieldCopy.managerName.label}
          placeholder={fieldCopy.managerName.placeholder}
          autoComplete="name"
          maxLength={120}
        />
      </div>
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SummaryEditButton({
  onClick,
}: {
  onClick?: () => void;
}) {
  if (!onClick) return null;
  return (
    <div className="flex justify-end">
      <Button type="button" variant="ghost" size="sm" onClick={onClick}>
        <Pencil className="mr-2 h-4 w-4" />
        {branchesCopy.form.review.editLabel}
      </Button>
    </div>
  );
}

function formatReviewCoordinates(
  latitude?: number | null,
  longitude?: number | null,
): string {
  if (latitude == null || longitude == null) {
    return branchesCopy.detail.map.noCoordinates;
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function BranchAddressGeocodingSection({
  disabled = false,
  embedded = false,
}: {
  disabled?: boolean;
  /** Sin card propia (va dentro de la sección Ubicación en edición). */
  embedded?: boolean;
}) {
  const {
    control,
    setValue,
    trigger,
    formState: { errors },
  } = useFormContext<BranchFormData>();
  const address = useWatch({ control, name: "address" });

  const onCoordinatesChange = useCallback(
    (coords: LatLng) => {
      void setFormCoordinates(setValue, trigger, coords, "address");
    },
    [setValue, trigger],
  );

  const content = (
    <AddressGeocodingSectionContent
      address={{
        street: address?.street,
        exteriorNumber: address?.exteriorNumber,
        interiorNumber: address?.interiorNumber,
        postalCode: address?.postalCode,
        satMunicipalityCode: address?.satMunicipalityCode,
        satStateCode: address?.satStateCode,
        satCountryCode: address?.satCountryCode,
      }}
      latitude={address?.latitude}
      longitude={address?.longitude}
      latitudeError={errors.address?.latitude?.message}
      onCoordinatesChange={onCoordinatesChange}
      disabled={disabled}
    />
  );

  if (embedded) {
    return (
      <div className="space-y-3 border-t pt-4">
        <div>
          <p className="text-sm font-medium">
            <AddressGeocodingSectionTitle />
          </p>
          <p className="text-xs text-muted-foreground">
            {branchesCopy.form.sections.geolocation.description}
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <FormSectionCard
      title={<AddressGeocodingSectionTitle />}
      icon={<MapPin className="h-4 w-4" />}
      description={branchesCopy.form.sections.geolocation.description}
      contentClassName="space-y-4"
    >
      {content}
    </FormSectionCard>
  );
}

function BranchWizardSummary({
  onEditStep,
}: {
  onEditStep?: (stepIndex: number) => void;
}) {
  const form = useFormContext<BranchFormData>();
  const values = form.getValues();
  const review = branchesCopy.form.review;

  const addressLine =
    [
      values.address.street,
      values.address.exteriorNumber,
      values.address.interiorNumber,
      values.address.neighborhoodName,
      values.address.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || "—";

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{review.hint}</p>

      <FormSectionCard
        title={review.general}
        icon={<Building2 className="h-4 w-4" />}
        contentClassName="space-y-3 text-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryRow label={review.code} value={values.code || review.empty} />
          <SummaryRow label={review.name} value={values.name || review.empty} />
          <SummaryRow
            label={review.status}
            value={BRANCH_STATUS_LABELS[values.status]}
          />
          <SummaryRow
            label={review.isMain}
            value={values.isMain ? review.isMainYes : review.isMainNo}
          />
        </div>
        <SummaryEditButton onClick={onEditStep ? () => onEditStep(0) : undefined} />
      </FormSectionCard>

      <FormSectionCard
        title={review.contact}
        icon={<Phone className="h-4 w-4" />}
        contentClassName="space-y-3 text-sm"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SummaryRow label={review.phone} value={values.phone || review.empty} />
          <SummaryRow label={review.email} value={values.email || review.empty} />
          <SummaryRow
            label={review.manager}
            value={values.managerName || review.empty}
          />
        </div>
        <SummaryEditButton onClick={onEditStep ? () => onEditStep(0) : undefined} />
      </FormSectionCard>

      <FormSectionCard
        title={review.address}
        icon={<MapPin className="h-4 w-4" />}
        contentClassName="space-y-3 text-sm"
      >
        <p className="font-medium">{addressLine}</p>
        <SummaryRow
          label={review.coordinates}
          value={formatReviewCoordinates(
            values.address.latitude,
            values.address.longitude,
          )}
        />
        <div>
          <p className="text-muted-foreground">{review.notes}</p>
          <p className="font-medium">{values.notes || review.notesEmpty}</p>
        </div>
        <SummaryEditButton onClick={onEditStep ? () => onEditStep(1) : undefined} />
      </FormSectionCard>
    </div>
  );
}

export const BranchForm = forwardRef<BranchFormRef, BranchFormProps>(
  function BranchForm(
    {
      branch,
      onSubmit,
      onCancel,
      isSubmitting = false,
      wizardMode = false,
      wizardStepIndex = 0,
      onEditStep,
    },
    ref,
  ) {
    const wizardActive = Boolean(wizardMode && !branch);
    const editLayout = Boolean(branch) && !wizardActive;
    const fieldCopy = branchesCopy.form.fields;
    const { toast } = useToast();
    const [showValidationSummary, setShowValidationSummary] = useState(false);

    const form = useForm<BranchFormData, unknown, BranchFormData>({
      resolver: zodResolver(branchFormSchema) as Resolver<BranchFormData>,
      defaultValues: branch ? branchToFormData(branch) : defaultBranchFormValues,
      mode: "onChange",
    });

    const {
      control,
      handleSubmit,
      trigger,
      setValue,
      setError,
      clearErrors,
      getValues,
      formState: { errors, isDirty, isValid },
    } = form;
    const validationMessages = collectFieldErrorMessages(errors);
    const shouldShowValidationSummary =
      showValidationSummary && !isValid;

    const applyAddressFieldErrors = useCallback(
      (fieldErrors: Record<string, string>) => {
        const keys = Object.keys(fieldErrors).filter(Boolean);
        if (!keys.length) return;
        clearErrors(
          keys.map(
            (key) =>
              `address.${key}` as `address.${keyof BranchFormData["address"]}`,
          ),
        );
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (!field || !message) continue;
          setError(
            `address.${field}` as `address.${keyof BranchFormData["address"]}`,
            {
              type: "manual",
              message,
            },
          );
        }
      },
      [clearErrors, setError],
    );

    const runStepValidation = useCallback(
      async (stepIndex: number) => {
        const fields = WIZARD_STEP_FIELDS[stepIndex];
        if (!fields?.length) return true;
        const ok = await trigger(fields as (keyof BranchFormData)[], {
          shouldFocus: true,
        });
        if (!ok) {
          setShowValidationSummary(true);
          return false;
        }

        if (stepIndex === WIZARD_ADDRESS_STEP_INDEX) {
          const addressResult =
            await validateBranchOperationalAddressFormComplete(
              getValues("address"),
              { locationName: getValues("name") },
            );
          if (!addressResult.ok) {
            applyAddressFieldErrors(addressResult.fieldErrors);
            setShowValidationSummary(true);
            return false;
          }
        }

        setShowValidationSummary(false);
        return true;
      },
      [applyAddressFieldErrors, getValues, trigger],
    );

    const handleInvalidSubmit = useCallback(
      (fieldErrors: FieldErrors<BranchFormData>) => {
        setShowValidationSummary(true);
        void trigger(undefined, { shouldFocus: true });
        // En edición: solo summary (evita toast duplicado). En alta/wizard: toast + summary.
        if (!editLayout) {
          toast({
            title: branchesCopy.form.validationToastTitle,
            description: formatFormValidationToastDescription(fieldErrors),
            variant: "destructive",
          });
        }
      },
      [editLayout, toast, trigger],
    );

    const handleValidSubmit = useCallback(
      async (data: BranchFormData) => {
        const addressResult = await validateBranchOperationalAddressFormComplete(
          data.address,
          { locationName: data.name },
        );

        if (!addressResult.ok) {
          setShowValidationSummary(true);
          applyAddressFieldErrors(addressResult.fieldErrors);
          if (!editLayout) {
            toast({
              title: branchesCopy.form.validationToastTitle,
              description: branchesCopy.form.validationAddressSummary,
              variant: "destructive",
            });
          }
          return;
        }

        setShowValidationSummary(false);
        onSubmit(data);
      },
      [applyAddressFieldErrors, editLayout, onSubmit, toast],
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerStepValidation: runStepValidation,
        requestSubmit: () => {
          void handleSubmit(handleValidSubmit, handleInvalidSubmit)();
        },
      }),
      [handleInvalidSubmit, handleSubmit, handleValidSubmit, runStepValidation],
    );

    return (
      <FormProvider {...form}>
      <form
        onSubmit={handleSubmit(handleValidSubmit, handleInvalidSubmit)}
        className="space-y-6"
      >
        <div
          className={cn("space-y-6", wizardActive && wizardStepIndex !== 0 && "hidden")}
          data-wizard-panel="0"
          aria-hidden={wizardActive && wizardStepIndex !== 0}
        >
          <FormSectionCard
            title={
              editLayout
                ? branchesCopy.form.sections.general.editTitle
                : branchesCopy.form.sections.general.title
            }
            icon={<Building2 className="h-4 w-4" />}
            description={
              editLayout
                ? branchesCopy.form.sections.general.editDescription
                : branchesCopy.form.sections.general.description
            }
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <RHFTextField
              control={control}
              name="code"
              label={fieldCopy.code.label}
              required
              placeholder={fieldCopy.code.placeholder}
              description={
                branch ? fieldCopy.code.hintLocked : fieldCopy.code.hint
              }
              autoComplete="off"
              maxLength={20}
              disabled={Boolean(branch)}
            />
            <RHFTextField
              control={control}
              name="name"
              label={fieldCopy.name.label}
              required
              placeholder={fieldCopy.name.placeholder}
              maxLength={120}
            />
            <RHFSelectField
              control={control}
              name="status"
              label={fieldCopy.status.label}
              required
              placeholder={fieldCopy.status.placeholder}
              options={[
                {
                  value: BranchStatus.ACTIVE,
                  label: BRANCH_STATUS_LABELS[BranchStatus.ACTIVE],
                },
                {
                  value: BranchStatus.INACTIVE,
                  label: BRANCH_STATUS_LABELS[BranchStatus.INACTIVE],
                },
              ]}
            />
            <Controller
              control={control}
              name="isMain"
              render={({ field, fieldState }) => {
                const errorMessage = fieldState.error?.message;
                return (
                  <FormFieldShell
                    fieldId="isMain"
                    label={fieldCopy.isMain.label}
                    description={fieldCopy.isMain.description}
                    errorMessage={errorMessage}
                  >
                    <Select
                      value={field.value ? "true" : "false"}
                      onValueChange={(value) => field.onChange(value === "true")}
                    >
                      <SelectTrigger
                        id="isMain"
                        error={Boolean(fieldState.error)}
                        {...getFieldErrorAriaProps("isMain", errorMessage)}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">
                          {fieldCopy.isMain.yes}
                        </SelectItem>
                        <SelectItem value="false">
                          {fieldCopy.isMain.no}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldShell>
                );
              }}
            />
            {!editLayout ? (
              <BranchContactFields control={control} fieldCopy={fieldCopy} />
            ) : null}
            <MainInactiveWarning control={control} isEditing={editLayout} />
          </FormSectionCard>
        </div>

        {editLayout ? (
          <FormSectionCard
            title={branchesCopy.form.sections.contact.title}
            icon={<Phone className="h-4 w-4" />}
            description={branchesCopy.form.sections.contact.description}
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <BranchContactFields control={control} fieldCopy={fieldCopy} />
          </FormSectionCard>
        ) : null}

        <div
          className={cn("space-y-6", wizardActive && wizardStepIndex !== 1 && "hidden")}
          data-wizard-panel="1"
          aria-hidden={wizardActive && wizardStepIndex !== 1}
        >
          <FormSectionCard
            title={
              editLayout
                ? branchesCopy.form.sections.address.editTitle
                : branchesCopy.form.sections.address.title
            }
            icon={<MapPin className="h-4 w-4" />}
            description={
              editLayout
                ? branchesCopy.form.sections.address.editDescription
                : wizardActive
                  ? ADDRESS_FORM_COPY.branchOperational.globalInfoMessage
                  : branchesCopy.form.sections.address.description
            }
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <AddressInput<BranchFormData>
                variant="carta-porte"
                formContext="branchOperational"
                addressType="branch"
                control={control}
                setValue={setValue}
                namePrefix="address"
                layout="compact"
                showLatLng={false}
                showPrimaryToggle={false}
                hideInformativeAlerts={false}
                embedded
                disabled={isSubmitting}
              />
            </div>
            {editLayout ? (
              <div className="sm:col-span-2">
                <BranchAddressGeocodingSection
                  disabled={isSubmitting}
                  embedded
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <RHFTextareaField
                control={control}
                name="notes"
                label={fieldCopy.notes.label}
                description={
                  editLayout
                    ? branchesCopy.form.sections.notes.description
                    : undefined
                }
                rows={editLayout ? 3 : 4}
                placeholder={fieldCopy.notes.placeholder}
                maxLength={1000}
              />
            </div>
          </FormSectionCard>

          {!editLayout ? (
            <BranchAddressGeocodingSection disabled={isSubmitting} />
          ) : null}
        </div>

        <div
          className={cn(!wizardActive || wizardStepIndex !== 2 ? "hidden" : undefined)}
          aria-hidden={!wizardActive || wizardStepIndex !== 2}
        >
          <BranchWizardSummary onEditStep={onEditStep} />
        </div>

        {shouldShowValidationSummary ? (
          <FormValidationSummary
            messages={validationMessages}
            title={
              wizardActive
                ? branchesCopy.form.validationSummaryWizard
                : branchesCopy.form.validationSummaryEdit
            }
          />
        ) : null}

        {!wizardActive ? (
          <div
            className={cn(
              "flex items-center justify-end gap-3 border-t pt-4",
              editLayout &&
                "sticky bottom-0 z-20 -mx-4 mt-6 border-border bg-background/95 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6",
            )}
          >
            {onCancel ? (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {branchesCopy.form.actions.cancel}
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={isSubmitting || (editLayout && !isDirty)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {branchesCopy.form.submit.saving}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {branch
                    ? branchesCopy.form.submit.saveChanges
                    : branchesCopy.form.submit.create}
                </>
              )}
            </Button>
          </div>
        ) : null}
      </form>
      </FormProvider>
    );
  },
);

BranchForm.displayName = "BranchForm";
