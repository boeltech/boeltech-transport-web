import {
  Children,
  cloneElement,
  forwardRef,
  useEffect,
  useImperativeHandle,
  isValidElement,
  useCallback,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  useForm,
  useWatch,
  Controller,
  type Resolver,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { FormSectionCard } from "@shared/ui/form-section-card";
import {
  FormFieldShell,
  FormValidationSummary,
  MoneyInput,
  getFieldErrorAriaProps,
  stripTrailingAsteriskFromLabel,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import { RHFSelect } from "@shared/ui/form/RHFSelect";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
} from "@shared/ui/wizard";
import type { WizardFormRef } from "@shared/ui/page-shells/WizardPageShell";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import {
  CheckCircle,
  Loader2,
  User,
  ShieldCheck,
  Phone,
  HeartHandshake,
  Briefcase,
  FileText,
  Wallet,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import {
  useCreateEmployee,
  useUpdateEmployee,
  employeeQueryKeys,
} from "../../application/hooks/useEmployees";
import type {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
  Employee,
} from "../../domain/entities";
import {
  createEmployeeAddress,
  updateEmployeeAddress,
} from "../../infrastructure/employeeAddressRepository";
import {
  AddressInput,
  EntityAddressForm,
  buildGeocodingEntityFormSection,
} from "@shared/ui/address-input";
import {
  employeePersonalFormToCreateDto,
  employeePersonalFormToUpdateDto,
  isEmployeeDomicilioDirty,
  validateEmployeePersonalAddressFormComplete,
} from "../validation/employeePersonalAddressSchema";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SALARY_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  BLOOD_TYPE_OPTIONS,
} from "../config/employeeConfig";
import {
  DEPARTMENT_OPTIONS,
  POSITION_OPTIONS,
  WORK_LOCATION_OPTIONS,
  EMERGENCY_RELATIONSHIP_OPTIONS,
  type EmployeeCatalogOption,
} from "../config/employeeCatalogs";
import {
  employeeSchema,
  defaultEmployeeDomicilio,
  defaultEmployeeFormValues,
  type EmployeeFormData,
} from "../validation/employeeSchema";
import { EMPLOYEE_WIZARD_STEPS } from "./employeeWizardSteps";

type EmployeeFormValues = EmployeeFormData;

type TabKey = "personal" | "contact" | "employment" | "compensation";

const TAB_ORDER: TabKey[] = ["personal", "contact", "employment", "compensation"];

const EDIT_SECTION_IDS: Record<TabKey, string> = {
  personal: "employee-edit-personal",
  contact: "employee-edit-contact",
  employment: "employee-edit-employment",
  compensation: "employee-edit-compensation",
};

const EMPLOYEE_REVIEW_STEP_INDEX = EMPLOYEE_WIZARD_STEPS.length - 1;

const TAB_FIELDS: Record<TabKey, string[]> = {
  personal: [
    "first_name", "last_name", "second_last_name", "birth_date",
    "gender", "marital_status", "nationality", "birth_place",
    "blood_type", "curp", "rfc", "nss", "infonavit_number",
  ],
  contact: [
    "email", "phone", "mobile_phone", "domicilio",
    "emergency_contact_name", "emergency_contact_phone",
    "emergency_contact_relationship",
  ],
  employment: [
    "hire_date", "employment_type", "department", "position",
    "job_title", "work_location", "notes", "medical_notes",
  ],
  compensation: [
    "base_salary", "salary_type", "payment_method",
    "bank_name", "bank_account_number", "bank_clabe",
  ],
};

const MARITAL_STATUS_VALUES = new Set([
  "single",
  "married",
  "divorced",
  "widowed",
  "cohabiting",
]);
const EMPLOYMENT_TYPE_VALUES = new Set(["permanent", "temporary", "contractor"]);
const SALARY_TYPE_VALUES = new Set(["monthly", "biweekly", "weekly", "daily"]);
const PAYMENT_METHOD_VALUES = new Set(["bank_transfer", "check", "cash"]);

function withLegacyCatalogOption(
  options: EmployeeCatalogOption[],
  currentValue: string | undefined,
): EmployeeCatalogOption[] {
  const current = (currentValue ?? "").trim();
  if (!current) return options;
  const exists = options.some(
    (option) => option.value.toLowerCase() === current.toLowerCase(),
  );
  if (exists) return options;
  return [{ value: current, label: `${current} (guardada)` }, ...options];
}

function EmployeeWizardReview({
  values,
}: {
  values: EmployeeFormValues;
}) {
  const d = values.domicilio;
  const addressLine = [
    d?.street,
    d?.exteriorNumber,
    d?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      contentClassName="space-y-3 text-sm"
    >
      <div>
        <p className="text-muted-foreground">Nombre</p>
        <p className="font-medium">
          {[values.first_name, values.last_name, values.second_last_name]
            .filter(Boolean)
            .join(" ")}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground">Ingreso / tipo</p>
        <p className="font-medium">
          {values.hire_date} · {values.employment_type}
        </p>
      </div>
      <div>
        <p className="text-muted-foreground">Correo</p>
        <p className="font-medium">{values.email || "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Domicilio</p>
        <p className="font-medium">{addressLine || "—"}</p>
      </div>
    </FormSectionCard>
  );
}

function FormField({
  label,
  error,
  fieldId,
  required: requiredProp,
  children,
}: {
  label: ReactNode;
  error?: string;
  fieldId?: string;
  /** Si no se pasa, se infiere de un `*` al final del `label` (solo en strings). */
  required?: boolean;
  children: ReactNode;
}) {
  const labelText = typeof label === "string" ? label : "";
  const resolvedId =
    fieldId ??
    (stripTrailingAsteriskFromLabel(labelText)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "field");

  const child = Children.only(children);
  const enhancedChild =
    isValidElement(child) && child.type !== RHFSelect
      ? cloneElement(child as ReactElement<Record<string, unknown>>, {
          id: (child.props as { id?: string }).id ?? resolvedId,
          ...getFieldErrorAriaProps(resolvedId, error),
          ...(error ? { error: true } : {}),
        })
      : child;

  return (
    <FormFieldShell
      fieldId={resolvedId}
      label={label}
      required={requiredProp}
      errorMessage={error}
    >
      {enhancedChild}
    </FormFieldShell>
  );
}

interface EmployeeFormInnerProps {
  id?: string;
  isEditing: boolean;
  existing?: Employee;
  /** Edición: cancelar y volver al detalle (footer, patrón Driver/Client). */
  onCancel?: () => void;
  /** Edición: tras guardado exitoso (empleado + domicilio). */
  onSaveSuccess?: () => void;
  /** Create: cuando el shell externo controla pasos y navegación. */
  embeddedInWizardShell?: boolean;
  /** Índice de paso del shell externo (create). */
  wizardStepIndex?: number;
  /** Notifica al contenedor estado de submit (para deshabilitar navegación shell). */
  onSubmittingChange?: (isSubmitting: boolean) => void;
}

export const EmployeeFormInner = forwardRef<WizardFormRef, EmployeeFormInnerProps>(function EmployeeFormInner({
  id,
  isEditing,
  existing,
  onCancel,
  onSaveSuccess,
  embeddedInWizardShell = false,
  wizardStepIndex = 0,
  onSubmittingChange,
}, ref) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentWizardStep, setCurrentWizardStep] = useState(0);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const wizardControlledByShell = !isEditing && embeddedInWizardShell;
  const activeWizardStep = wizardControlledByShell
    ? wizardStepIndex
    : currentWizardStep;

  /**
   * Solo `defaultValues` (no prop `values`): en edición el contenedor ya espera a `existing`
   * antes de montar este componente, así el primer render lleva el objeto completo y RHF +
   * Controller + Radix Select reciben el valor correcto desde el inicio (mismo patrón que
   * CompanySettingsForm). La prop `values` aquí podía dejar selects sin etiqueta aunque
   * `domicilio` vía `useController` sí se hidrataba.
   */
  const initialFormValues = useMemo((): EmployeeFormValues => {
    if (isEditing && existing) {
      return employeeToFormValues(existing);
    }
    return {
      ...defaultEmployeeFormValues,
      hire_date: new Date().toISOString().split("T")[0],
      domicilio: defaultEmployeeDomicilio,
    };
  }, [isEditing, existing]);

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(id!);

  const form = useForm<EmployeeFormValues, unknown, EmployeeFormValues>({
    resolver: zodResolver(employeeSchema) as Resolver<EmployeeFormValues>,
    defaultValues: initialFormValues,
    mode: "onChange",
  });
  const {
    formState: { errors: formErrors, isValid: isFormValid, isDirty, dirtyFields },
  } = form;

  useEffect(() => {
    onSubmittingChange?.(form.formState.isSubmitting);
  }, [form.formState.isSubmitting, onSubmittingChange]);
  const watchedFormValues = useWatch({ control: form.control });

  const watchedDepartment = useWatch({ control: form.control, name: "department" });
  const watchedPosition = useWatch({ control: form.control, name: "position" });
  const watchedWorkLocation = useWatch({ control: form.control, name: "work_location" });
  const watchedEmergencyRelationship = useWatch({
    control: form.control,
    name: "emergency_contact_relationship",
  });
  const domicilioSatStateCode = useWatch({
    control: form.control,
    name: "domicilio.satStateCode",
  });
  const domicilioSatMunicipalityCode = useWatch({
    control: form.control,
    name: "domicilio.satMunicipalityCode",
  });
  const domicilioPostalCode = useWatch({
    control: form.control,
    name: "domicilio.postalCode",
  });
  const domicilioValues = useWatch({
    control: form.control,
    name: "domicilio",
  });

  const onDomicilioCoordinatesChange = useCallback(
    (coords: { latitude: number; longitude: number }) => {
      form.setValue("domicilio.latitude", coords.latitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("domicilio.longitude", coords.longitude, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [form],
  );

  const domicilioPostAddressSections = useMemo(
    () => [
      buildGeocodingEntityFormSection({
        address: {
          street: domicilioValues?.street,
          exteriorNumber: domicilioValues?.exteriorNumber,
          interiorNumber: domicilioValues?.interiorNumber,
          postalCode: domicilioValues?.postalCode,
          satMunicipalityCode: domicilioValues?.satMunicipalityCode,
          satStateCode: domicilioValues?.satStateCode,
          satCountryCode: domicilioValues?.satCountryCode,
        },
        latitude: domicilioValues?.latitude,
        longitude: domicilioValues?.longitude,
        latitudeError: form.formState.errors.domicilio?.latitude?.message,
        onCoordinatesChange: onDomicilioCoordinatesChange,
        disabled: form.formState.isSubmitting,
      }),
    ],
    [
      domicilioValues,
      form.formState.errors.domicilio?.latitude?.message,
      form.formState.isSubmitting,
      onDomicilioCoordinatesChange,
    ],
  );
  const departmentOptions = useMemo(
    () => withLegacyCatalogOption(DEPARTMENT_OPTIONS, watchedDepartment),
    [watchedDepartment],
  );
  const positionOptions = useMemo(
    () => withLegacyCatalogOption(POSITION_OPTIONS, watchedPosition),
    [watchedPosition],
  );
  const workLocationOptions = useMemo(
    () => withLegacyCatalogOption(WORK_LOCATION_OPTIONS, watchedWorkLocation),
    [watchedWorkLocation],
  );
  const emergencyRelationshipOptions = useMemo(
    () =>
      withLegacyCatalogOption(
        EMERGENCY_RELATIONSHIP_OPTIONS,
        watchedEmergencyRelationship,
      ),
    [watchedEmergencyRelationship],
  );

  const applyDomicilioFieldErrors = useCallback(
    (fieldErrors: Record<string, string>) => {
      for (const [key, message] of Object.entries(fieldErrors)) {
        if (!key || !message) continue;
        form.setError(`domicilio.${key}` as `domicilio.${keyof EmployeeFormValues["domicilio"]}`, {
          type: "sat",
          message,
        });
      }
    },
    [form],
  );

  const validationMessages = collectFieldErrorMessages(formErrors);
  const shouldShowValidationSummary = showValidationSummary && !isFormValid;

  const scrollToEditSection = useCallback((tab: TabKey) => {
    document
      .getElementById(EDIT_SECTION_IDS[tab])
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleInvalidSubmit = useCallback(
    (errs: FieldErrors<EmployeeFormValues>) => {
      const errorKeys = Object.keys(errs);
      const firstErrorTab = TAB_ORDER.find((tab) =>
        TAB_FIELDS[tab].some(
          (f) => errorKeys.includes(f) || errorKeys.some((k) => k.startsWith(`${f}.`)),
        ),
      );
      if (firstErrorTab) {
        if (isEditing) {
          scrollToEditSection(firstErrorTab);
        } else if (!wizardControlledByShell) {
          setCurrentWizardStep(TAB_ORDER.indexOf(firstErrorTab));
        }
      }
      setShowValidationSummary(true);
    },
    [isEditing, scrollToEditSection, wizardControlledByShell],
  );

  const validateWizardStep = useCallback(
    async (stepIndex: number) => {
      if (stepIndex >= EMPLOYEE_REVIEW_STEP_INDEX) return true;
      const tab = TAB_ORDER[stepIndex];
      const fields = TAB_FIELDS[tab] as (keyof EmployeeFormValues)[];
      const ok = await form.trigger(fields, { shouldFocus: true });
      if (!ok) {
        setShowValidationSummary(true);
        return false;
      }

      if (tab === "contact") {
        const domicilioResult = await validateEmployeePersonalAddressFormComplete(
          form.getValues("domicilio"),
          { requireCoordinates: false },
        );
        if (!domicilioResult.ok) {
          applyDomicilioFieldErrors(domicilioResult.fieldErrors);
          setShowValidationSummary(true);
          return false;
        }
      }

      setShowValidationSummary(false);
      return true;
    },
    [applyDomicilioFieldErrors, form],
  );

  const handleWizardStepClick = useCallback(
    async (stepIndex: number) => {
      if (stepIndex <= currentWizardStep) {
        setCurrentWizardStep(stepIndex);
        return;
      }
      if (stepIndex === EMPLOYEE_REVIEW_STEP_INDEX) {
        for (let i = 0; i < TAB_ORDER.length; i++) {
          const ok = await validateWizardStep(i);
          if (!ok) {
            setCurrentWizardStep(i);
            return;
          }
        }
        setCurrentWizardStep(EMPLOYEE_REVIEW_STEP_INDEX);
        return;
      }
      const ok = await validateWizardStep(currentWizardStep);
      if (ok) setCurrentWizardStep(stepIndex);
    },
    [currentWizardStep, validateWizardStep],
  );

  const handleWizardNext = useCallback(async () => {
    if (currentWizardStep >= EMPLOYEE_REVIEW_STEP_INDEX) return;
    const ok = await validateWizardStep(currentWizardStep);
    if (ok) setCurrentWizardStep((s) => Math.min(s + 1, EMPLOYEE_REVIEW_STEP_INDEX));
  }, [currentWizardStep, validateWizardStep]);

  const handleWizardPrevious = useCallback(() => {
    setCurrentWizardStep((s) => Math.max(0, s - 1));
  }, []);

  const isWizardLastStep =
    !isEditing && activeWizardStep === EMPLOYEE_REVIEW_STEP_INDEX;

  const onSubmit = useCallback(async (values: EmployeeFormValues) => {
    const clean = <T extends Record<string, unknown>>(obj: T): T =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, v === "" ? undefined : v]),
      ) as T;
    const normalizeForApi = (obj: Record<string, unknown>): Record<string, unknown> => {
      const next: Record<string, unknown> = { ...obj };
      if (typeof next["curp"] === "string") next["curp"] = (next["curp"] as string).trim().toUpperCase();
      if (typeof next["rfc"] === "string") next["rfc"] = (next["rfc"] as string).trim().toUpperCase();
      return next;
    };

    const { domicilio, ...employeeRest } = values;
    const cleaned = normalizeForApi(
      clean(employeeRest as Record<string, unknown>),
    );

    const domicilioDirty = isEmployeeDomicilioDirty(dirtyFields);
    const shouldPersistDomicilio =
      !isEditing || domicilioDirty || !existing?.personalAddress?.id;

    if (shouldPersistDomicilio) {
      const domicilioResult = await validateEmployeePersonalAddressFormComplete(domicilio, {
        requireCoordinates: false,
      });
      if (!domicilioResult.ok) {
        applyDomicilioFieldErrors(domicilioResult.fieldErrors);
        if (isEditing) {
          scrollToEditSection("contact");
        } else if (!wizardControlledByShell) {
          setCurrentWizardStep(TAB_ORDER.indexOf("contact"));
        }
        setShowValidationSummary(true);
        return;
      }
    }
    const addressCreateDto = employeePersonalFormToCreateDto(domicilio);
    const addressUpdateDto = employeePersonalFormToUpdateDto(domicilio);

    try {
      if (isEditing) {
        const dto: UpdateEmployeeDTO = cleaned as UpdateEmployeeDTO;
        await updateMutation.mutateAsync(dto);

        try {
          const addrId = existing?.personalAddress?.id;
          if (shouldPersistDomicilio) {
            if (addrId) {
              await updateEmployeeAddress(id!, addrId, addressUpdateDto);
            } else {
              await createEmployeeAddress(id!, addressCreateDto);
            }
          }
        } catch (addressError) {
          const message =
            addressError instanceof Error ? addressError.message : undefined;
          toast({
            title: "Empleado actualizado, pero falló el domicilio",
            description:
              message ??
              "Se guardaron los datos del empleado, pero no se pudo guardar el domicilio. Reintenta desde edición.",
            variant: "destructive",
          });
          navigate(`/employees/${id}/edit`);
          return;
        }

        await queryClient.invalidateQueries({
          queryKey: employeeQueryKeys.detail(id!),
        });
        if (onSaveSuccess) {
          onSaveSuccess();
        } else {
          toast({ title: "Empleado actualizado correctamente" });
          navigate(`/employees/${id}`);
        }
        return;
      }

      const dto: CreateEmployeeDTO = {
        ...cleaned,
        first_name: values.first_name,
        last_name: values.last_name,
        hire_date: values.hire_date,
      } as CreateEmployeeDTO;
      const result = await createMutation.mutateAsync(dto);
      const newId = result.data.id;
      try {
        await createEmployeeAddress(newId, addressCreateDto);
        await queryClient.invalidateQueries({
          queryKey: employeeQueryKeys.detail(newId),
        });
        toast({ title: "Empleado registrado correctamente" });
        navigate(`/employees/${newId}`);
      } catch (addressError) {
        const message =
          addressError instanceof Error ? addressError.message : undefined;
        toast({
          title: "Empleado creado, pero falló el domicilio",
          description:
            message ??
            "El empleado se creó correctamente, pero no se pudo guardar el domicilio. Completa el domicilio desde edición.",
          variant: "destructive",
        });
        navigate(`/employees/${newId}/edit`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : undefined;
      toast({
        title: isEditing ? "Error al actualizar" : "Error al registrar",
        description: message,
        variant: "destructive",
      });
    }
  }, [
    applyDomicilioFieldErrors,
    createMutation,
    dirtyFields,
    existing,
    existing?.personalAddress?.id,
    id,
    isEditing,
    navigate,
    onSaveSuccess,
    queryClient,
    scrollToEditSection,
    toast,
    updateMutation,
    wizardControlledByShell,
  ]);

  const requestWizardSubmit = useCallback(() => {
    void form.handleSubmit(onSubmit, handleInvalidSubmit)();
  }, [form, onSubmit, handleInvalidSubmit]);

  useImperativeHandle(
    ref,
    () => ({
      triggerStepValidation: validateWizardStep,
      requestSubmit: requestWizardSubmit,
    }),
    [requestWizardSubmit, validateWizardStep],
  );

  const stepPanelClass = (stepIndex: number) => {
    if (isEditing) return "";
    if (stepIndex === EMPLOYEE_REVIEW_STEP_INDEX) {
      return cn(activeWizardStep !== EMPLOYEE_REVIEW_STEP_INDEX && "hidden");
    }
    return cn(activeWizardStep !== stepIndex && "hidden");
  };

  const showEditFormActions = isEditing && Boolean(onCancel);

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
      className="space-y-6"
    >
        {!isEditing && !wizardControlledByShell && (
          <WizardProgressCard>
            <WizardSteps
              steps={EMPLOYEE_WIZARD_STEPS}
              currentStep={activeWizardStep}
              onStepClick={handleWizardStepClick}
              allowNavigation
              ariaLabel="Pasos para registrar un empleado"
            />
          </WizardProgressCard>
        )}
        <div
          id="employee-edit-personal"
          className={cn("space-y-4", stepPanelClass(0))}
          aria-hidden={!isEditing && activeWizardStep !== 0}
        >
          <FormSectionCard
            title="Datos personales"
            icon={<User className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField
              label="Nombre(s)"
              required
              error={form.formState.errors.first_name?.message}
            >
              <Input {...form.register("first_name")} placeholder="Juan" />
            </FormField>
            <FormField
              label="Apellido paterno"
              required
              error={form.formState.errors.last_name?.message}
            >
              <Input {...form.register("last_name")} placeholder="García" />
            </FormField>
            <FormField label="Apellido materno">
              <Input
                {...form.register("second_last_name")}
                placeholder="López"
              />
            </FormField>

            <FormField label="Fecha de nacimiento">
              <Input type="date" {...form.register("birth_date")} />
            </FormField>
            <FormField label="Género">
              <RHFSelect control={form.control} name="gender" options={GENDER_OPTIONS} />
            </FormField>
            <FormField label="Estado civil">
              <RHFSelect
                control={form.control}
                name="marital_status"
                options={MARITAL_STATUS_OPTIONS}
              />
            </FormField>

            <FormField label="Tipo de sangre">
              <RHFSelect control={form.control} name="blood_type" options={BLOOD_TYPE_OPTIONS} />
            </FormField>
            <FormField label="Nacionalidad">
              <Input
                {...form.register("nationality")}
                placeholder="Mexicana"
              />
            </FormField>
            <FormField label="Lugar de nacimiento">
              <Input
                {...form.register("birth_place")}
                placeholder="Ciudad, Estado"
              />
            </FormField>
          </FormSectionCard>

          <FormSectionCard
            title="Datos fiscales / gobierno"
            icon={<ShieldCheck className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <FormField
              label="CURP"
              error={form.formState.errors.curp?.message}
            >
              <Input
                {...form.register("curp")}
                placeholder="GARC850101HDFRZN01"
                className="uppercase font-mono"
                maxLength={18}
              />
            </FormField>
            <FormField
              label="RFC"
              error={form.formState.errors.rfc?.message}
            >
              <Input
                {...form.register("rfc")}
                placeholder="GARJ850101AB1"
                className="uppercase font-mono"
                maxLength={13}
              />
            </FormField>
            <FormField
              label="NSS (IMSS)"
              error={form.formState.errors.nss?.message}
            >
              <Input
                {...form.register("nss")}
                placeholder="12345678901"
                className="font-mono"
                maxLength={11}
              />
            </FormField>
            <FormField label="No. Infonavit">
              <Input {...form.register("infonavit_number")} />
            </FormField>
          </FormSectionCard>
        </div>

        <div
          id="employee-edit-contact"
          className={cn("space-y-4", stepPanelClass(1))}
          aria-hidden={!isEditing && activeWizardStep !== 1}
        >
          <FormSectionCard
            title="Datos de contacto"
            icon={<Phone className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField
              label="Email"
              error={form.formState.errors.email?.message}
            >
              <Input
                type="email"
                {...form.register("email")}
                placeholder="correo@ejemplo.com"
              />
            </FormField>
            <FormField label="Teléfono">
              <Input
                {...form.register("phone")}
                placeholder="55 1234 5678"
              />
            </FormField>
            <FormField label="Celular">
              <Input
                {...form.register("mobile_phone")}
                placeholder="55 1234 5678"
              />
            </FormField>
          </FormSectionCard>

          <EntityAddressForm
            asForm={false}
            className="space-y-4"
            formContext="employeePersonal"
            addressVariant="personal"
            infoMessage="Captura el domicilio personal del empleado."
            satStateCode={domicilioSatStateCode}
            satMunicipalityCode={domicilioSatMunicipalityCode}
            postalCode={domicilioPostalCode}
            showGlobalNotice
            hideLocationSectionTitle={false}
            locationSectionTitle="Domicilio"
            addressInputSection={
              <AddressInput<EmployeeFormValues>
                variant="personal"
                formContext="employeePersonal"
                addressType="personal"
                control={form.control}
                setValue={form.setValue}
                namePrefix="domicilio"
                layout="compact"
                showPrimaryToggle={false}
                hideInformativeAlerts
                embedded
                disabled={form.formState.isSubmitting}
              />
            }
            postAddressSections={domicilioPostAddressSections}
          />

          <FormSectionCard
            title="Contacto de emergencia"
            icon={<HeartHandshake className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField label="Nombre completo">
              <Input
                {...form.register("emergency_contact_name")}
                placeholder="María García"
              />
            </FormField>
            <FormField label="Teléfono">
              <Input
                {...form.register("emergency_contact_phone")}
                placeholder="55 1234 5678"
              />
            </FormField>
            <FormField label="Parentesco">
              <RHFSelect
                control={form.control}
                name="emergency_contact_relationship"
                options={emergencyRelationshipOptions}
              />
            </FormField>
          </FormSectionCard>
        </div>

        <div
          id="employee-edit-employment"
          className={cn("space-y-4", stepPanelClass(2))}
          aria-hidden={!isEditing && activeWizardStep !== 2}
        >
          <FormSectionCard
            title="Información laboral"
            icon={<Briefcase className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField
              label="Fecha de ingreso"
              required
              error={form.formState.errors.hire_date?.message}
            >
              <Input type="date" {...form.register("hire_date")} />
            </FormField>
            <FormField label="Tipo de contrato" required>
              <RHFSelect
                control={form.control}
                name="employment_type"
                options={EMPLOYMENT_TYPE_OPTIONS}
                allowNone={false}
                placeholder="Seleccionar"
              />
            </FormField>
            <FormField label="Departamento">
              <RHFSelect
                control={form.control}
                name="department"
                options={departmentOptions}
              />
            </FormField>
            <FormField label="Puesto">
              <RHFSelect control={form.control} name="position" options={positionOptions} />
            </FormField>
            <FormField label="Título del trabajo">
              <Input
                {...form.register("job_title")}
                placeholder="Operador de transporte"
              />
            </FormField>
            <FormField label="Ubicación / Sucursal">
              <RHFSelect
                control={form.control}
                name="work_location"
                options={workLocationOptions}
              />
            </FormField>
          </FormSectionCard>

          <FormSectionCard
            title="Notas"
            icon={<FileText className="h-4 w-4" />}
            contentClassName="space-y-4"
          >
            <FormField label="Notas generales">
              <Textarea
                {...form.register("notes")}
                placeholder="Observaciones o notas adicionales..."
                rows={3}
              />
            </FormField>
            <FormField label="Notas médicas">
              <Textarea
                {...form.register("medical_notes")}
                placeholder="Alergias, condiciones especiales..."
                rows={3}
              />
            </FormField>
          </FormSectionCard>
        </div>

        <div
          id="employee-edit-compensation"
          className={cn("space-y-4", stepPanelClass(3))}
          aria-hidden={!isEditing && activeWizardStep !== 3}
        >
          <FormSectionCard
            title="Salario"
            icon={<Wallet className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField label="Salario base">
              <Controller
                control={form.control}
                name="base_salary"
                render={({ field, fieldState }) => (
                  <MoneyInput
                    id="base_salary"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="$0.00"
                    error={Boolean(fieldState.error)}
                    {...getFieldErrorAriaProps(
                      "base_salary",
                      fieldState.error?.message,
                    )}
                  />
                )}
              />
            </FormField>
            <FormField label="Periodicidad">
              <RHFSelect control={form.control} name="salary_type" options={SALARY_TYPE_OPTIONS} />
            </FormField>
            <FormField label="Método de pago">
              <RHFSelect
                control={form.control}
                name="payment_method"
                options={PAYMENT_METHOD_OPTIONS}
              />
            </FormField>
          </FormSectionCard>

          <FormSectionCard
            title="Datos bancarios"
            icon={<Building2 className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField label="Banco">
              <Input
                {...form.register("bank_name")}
                placeholder="BBVA"
              />
            </FormField>
            <FormField label="Número de cuenta">
              <Input
                {...form.register("bank_account_number")}
                placeholder="012345678901234"
              />
            </FormField>
            <FormField label="CLABE interbancaria">
              <Input
                {...form.register("bank_clabe")}
                placeholder="012345678901234567"
                maxLength={18}
              />
            </FormField>
          </FormSectionCard>
        </div>

        {!isEditing && (
          <div
            className={cn(stepPanelClass(EMPLOYEE_REVIEW_STEP_INDEX))}
            aria-hidden={activeWizardStep !== EMPLOYEE_REVIEW_STEP_INDEX}
          >
            <EmployeeWizardReview values={watchedFormValues as EmployeeFormValues} />
          </div>
        )}

        {shouldShowValidationSummary ? (
          <FormValidationSummary
            title={
              isEditing
                ? "Revisa los siguientes campos"
                : "Revisa los datos del empleado"
            }
            messages={validationMessages}
          />
        ) : null}

        {showEditFormActions ? (
          <div className="flex items-center justify-end gap-4 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={form.formState.isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={form.formState.isSubmitting || !isDirty}
            >
              {form.formState.isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar Cambios
            </Button>
          </div>
        ) : null}

        {!isEditing && !wizardControlledByShell && (
          <WizardNavigationBar
            canGoBack={activeWizardStep > 0}
            isLastStep={isWizardLastStep}
            onPrevious={handleWizardPrevious}
            onCancel={() => navigate("/employees")}
            onNext={handleWizardNext}
            onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)}
            isSubmitting={form.formState.isSubmitting}
            submitLabel="Registrar empleado"
            submittingContent={<Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            submitIcon={<CheckCircle className="mr-2 h-4 w-4" />}
          />
        )}
    </form>
  );
});

EmployeeFormInner.displayName = "EmployeeFormInner";

function employeeToFormValues(employee: Employee): EmployeeFormValues {
  const normalizeOptionalSelect = (value: string | null | undefined) => {
    const normalized = (value ?? "").trim();
    return normalized ? normalized : undefined;
  };
  const maritalStatusNormalized = (() => {
    const value = (employee.maritalStatus ?? "").toLowerCase();
    return MARITAL_STATUS_VALUES.has(value)
      ? (value as EmployeeFormValues["marital_status"])
      : undefined;
  })();
  const employmentTypeNormalized = (() => {
    const value = (employee.employmentType ?? "").toLowerCase();
    return EMPLOYMENT_TYPE_VALUES.has(value)
      ? (value as EmployeeFormValues["employment_type"])
      : "permanent";
  })();
  const salaryTypeNormalized = (() => {
    const value = (employee.salaryType ?? "").toLowerCase();
    return SALARY_TYPE_VALUES.has(value)
      ? (value as EmployeeFormValues["salary_type"])
      : undefined;
  })();
  const paymentMethodNormalized = (() => {
    const value = (employee.paymentMethod ?? "").toLowerCase();
    return PAYMENT_METHOD_VALUES.has(value)
      ? (value as EmployeeFormValues["payment_method"])
      : undefined;
  })();
  const bloodTypeNormalized = (() => {
    const value = (employee.bloodType ?? "").toUpperCase();
    return value || undefined;
  })();

  return {
    first_name: employee.firstName,
    last_name: employee.lastName,
    second_last_name: employee.secondLastName ?? "",
    birth_date: employee.birthDate ?? "",
    gender: employee.gender ?? undefined,
    marital_status: maritalStatusNormalized,
    nationality: employee.nationality ?? "",
    birth_place: employee.birthPlace ?? "",
    blood_type: bloodTypeNormalized,
    curp: employee.curp ?? "",
    rfc: employee.rfc ?? "",
    nss: employee.nss ?? "",
    infonavit_number: employee.infonavitNumber ?? "",
    email: employee.email ?? "",
    phone: employee.phone ?? "",
    mobile_phone: employee.mobilePhone ?? "",
    emergency_contact_name: employee.emergencyContactName ?? "",
    emergency_contact_phone: employee.emergencyContactPhone ?? "",
    emergency_contact_relationship: normalizeOptionalSelect(
      employee.emergencyContactRelationship,
    ),
    hire_date: employee.hireDate ?? "",
    employment_type: employmentTypeNormalized,
    department: normalizeOptionalSelect(employee.department),
    position: normalizeOptionalSelect(employee.position),
    job_title: employee.jobTitle ?? "",
    work_location: normalizeOptionalSelect(employee.workLocation),
    base_salary: employee.baseSalary ?? undefined,
    salary_type: salaryTypeNormalized,
    payment_method: paymentMethodNormalized,
    bank_name: employee.bankName ?? "",
    bank_account_number: employee.bankAccountNumber ?? "",
    bank_clabe: employee.bankClabe ?? "",
    medical_notes: employee.medicalNotes ?? "",
    notes: employee.notes ?? "",
    domicilio: employeeToDomicilioForm(employee),
  };
}

function employeeToDomicilioForm(
  employee: Employee,
): EmployeeFormValues["domicilio"] {
  const addr = employee.personalAddress;
  if (!addr) return defaultEmployeeDomicilio;
  return {
    addressType: "personal" as const,
    isPrimary: true as const,
    id: addr.id,
    street: addr.street ?? "",
    exteriorNumber: addr.exteriorNumber ?? "",
    interiorNumber: addr.interiorNumber ?? null,
    reference: addr.reference ?? null,
    postalCode: addr.postalCode ?? "",
    satCountryCode: addr.satCountryCode ?? "MEX",
    satStateCode: addr.satStateCode ?? "",
    satMunicipalityCode: addr.satMunicipalityCode ?? "",
    satLocalityCode: addr.satLocalityCode ?? null,
    localityName: addr.localityName ?? null,
    satNeighborhoodCode: addr.satNeighborhoodCode ?? null,
    neighborhoodName: addr.neighborhoodName ?? null,
    latitude: addr.latitude ?? null,
    longitude: addr.longitude ?? null,
  };
}
