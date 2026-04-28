import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  useForm,
  useWatch,
  type Resolver,
  type FieldErrors,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { Label } from "@shared/ui/label";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { RHFSelect } from "@shared/ui/form/RHFSelect";
import {
  WizardNavigationBar,
  WizardProgressCard,
  WizardSteps,
} from "@shared/ui/wizard";
import type { WizardStep } from "@shared/ui/wizard";
import { useToast } from "@shared/hooks";
import { cn } from "@shared/lib/utils/cn";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  User,
  ShieldCheck,
  Phone,
  MapPin,
  HeartHandshake,
  Briefcase,
  FileText,
  Wallet,
  Building2,
  ClipboardCheck,
} from "lucide-react";
import { EmployeeEditHeader } from "./edit/EmployeeEditHeader";
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
import AddressInput from "@shared/ui/address-input/AddressInput";
import {
  clientAddressFormDataToCreateDto,
  defaultClientAddressFormValues,
  type ClientAddressFormData,
} from "@features/clients/presentation/validation/clientAddressSchema";
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

type EmployeeFormValues = EmployeeFormData;

type TabKey = "personal" | "contact" | "employment" | "compensation";

const TAB_ORDER: TabKey[] = ["personal", "contact", "employment", "compensation"];

const EMPLOYEE_WIZARD_STEPS: WizardStep[] = [
  { id: "personal", title: "Personal", description: "Identidad y datos fiscales" },
  { id: "contact", title: "Contacto", description: "Medios y domicilio" },
  { id: "employment", title: "Laboral", description: "Puesto y condiciones" },
  { id: "compensation", title: "Compensación", description: "Salario y banco" },
  { id: "review", title: "Revisión", description: "Confirmar antes de guardar" },
];

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
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function EmployeeFormInner({
  id,
  isEditing,
  existing,
}: {
  id?: string;
  isEditing: boolean;
  existing?: Employee;
}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentWizardStep, setCurrentWizardStep] = useState(0);

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
  });

  const watchedDepartment = useWatch({ control: form.control, name: "department" });
  const watchedPosition = useWatch({ control: form.control, name: "position" });
  const watchedWorkLocation = useWatch({ control: form.control, name: "work_location" });
  const watchedEmergencyRelationship = useWatch({
    control: form.control,
    name: "emergency_contact_relationship",
  });
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

  const handleInvalidSubmit = (errs: FieldErrors<EmployeeFormValues>) => {
    const errorKeys = Object.keys(errs);
    const firstErrorTab = TAB_ORDER.find((tab) =>
      TAB_FIELDS[tab].some((f) => errorKeys.includes(f)),
    );
    if (firstErrorTab) {
      setCurrentWizardStep(TAB_ORDER.indexOf(firstErrorTab));
    }
  };

  const validateWizardStep = useCallback(
    async (stepIndex: number) => {
      if (stepIndex >= EMPLOYEE_REVIEW_STEP_INDEX) return true;
      const tab = TAB_ORDER[stepIndex];
      const fields = TAB_FIELDS[tab] as (keyof EmployeeFormValues)[];
      return form.trigger(fields);
    },
    [form],
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
    !isEditing && currentWizardStep === EMPLOYEE_REVIEW_STEP_INDEX;

  const onSubmit = async (values: EmployeeFormValues) => {
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

    const addressDto = clientAddressFormDataToCreateDto({
      ...defaultClientAddressFormValues,
      ...domicilio,
      addressType: "personal",
      isPrimary: true,
    } as ClientAddressFormData);

    try {
      if (isEditing) {
        const dto: UpdateEmployeeDTO = cleaned as UpdateEmployeeDTO;
        await updateMutation.mutateAsync(dto);

        try {
          const addrId = existing?.personalAddress?.id;
          if (addrId) {
            await updateEmployeeAddress(id!, addrId, addressDto);
          } else {
            await createEmployeeAddress(id!, addressDto);
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
        toast({ title: "Empleado actualizado correctamente" });
        navigate(`/employees/${id}`);
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
        await createEmployeeAddress(newId, addressDto);
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
  };

  const stepPanelClass = (stepIndex: number) => {
    if (isEditing) return "";
    if (stepIndex === EMPLOYEE_REVIEW_STEP_INDEX) {
      return cn(currentWizardStep !== EMPLOYEE_REVIEW_STEP_INDEX && "hidden");
    }
    return cn(currentWizardStep !== stepIndex && "hidden");
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 p-6">
      {isEditing ? (
        <EmployeeEditHeader
          title="Editar empleado"
          subtitle={existing?.fullName}
          onBack={() => navigate(`/employees/${id}`)}
          isDirty={form.formState.isDirty}
          isSubmitting={form.formState.isSubmitting}
          onDiscard={() => {
            if (!existing) return;
            if (!form.formState.isDirty) return;
            if (!window.confirm("Se descartarán los cambios no guardados. ¿Deseas continuar?")) {
              return;
            }
            form.reset(employeeToFormValues(existing));
          }}
          onSave={() => {
            void form.handleSubmit(onSubmit, handleInvalidSubmit)();
          }}
        />
      ) : (
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/employees")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nuevo empleado</h1>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit, handleInvalidSubmit)} className="space-y-4">
        {!isEditing && (
          <WizardProgressCard>
            <WizardSteps
              steps={EMPLOYEE_WIZARD_STEPS}
              currentStep={currentWizardStep}
              onStepClick={handleWizardStepClick}
              allowNavigation
              ariaLabel="Pasos para registrar un empleado"
            />
          </WizardProgressCard>
        )}
        <div
          id="employee-edit-personal"
          className={cn("space-y-4", stepPanelClass(0))}
        >
          <FormSectionCard
            title="Datos personales"
            icon={<User className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField
              label="Nombre(s) *"
              error={form.formState.errors.first_name?.message}
            >
              <Input {...form.register("first_name")} placeholder="Juan" />
            </FormField>
            <FormField
              label="Apellido paterno *"
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

          <FormSectionCard title="Domicilio" icon={<MapPin className="h-4 w-4" />}>
            <AddressInput<EmployeeFormValues>
              mode="personal"
              control={form.control}
              namePrefix="domicilio"
              layout="compact"
              showLatLng
              showPrimaryToggle={false}
            />
          </FormSectionCard>

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
        >
          <FormSectionCard
            title="Información laboral"
            icon={<Briefcase className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField
              label="Fecha de ingreso *"
              error={form.formState.errors.hire_date?.message}
            >
              <Input type="date" {...form.register("hire_date")} />
            </FormField>
            <FormField label="Tipo de contrato *">
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
        >
          <FormSectionCard
            title="Salario"
            icon={<Wallet className="h-4 w-4" />}
            contentClassName="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <FormField label="Salario base">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  $
                </span>
                <Input
                  type="text"
                  inputMode="decimal"
                  className="pl-6"
                  placeholder="18,000"
                  {...form.register("base_salary", {
                    setValueAs: (v) => {
                      const cleaned = String(v).replace(/[^0-9.]/g, "");
                      return cleaned === "" ? undefined : parseFloat(cleaned);
                    },
                  })}
                />
              </div>
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
          <div className={cn(stepPanelClass(EMPLOYEE_REVIEW_STEP_INDEX))}>
            <EmployeeWizardReview values={form.watch()} />
          </div>
        )}

        {!isEditing && (
          <WizardNavigationBar
            canGoBack={currentWizardStep > 0}
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
    </div>
  );
}

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
    satNeighborhoodCode: addr.satNeighborhoodCode ?? null,
    neighborhoodName: addr.neighborhoodName ?? null,
    latitude: null,
    longitude: null,
  };
}
