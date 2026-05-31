import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  FormProvider,
  useForm,
  useFormContext,
  type Resolver,
} from "react-hook-form";
import { Building2, ClipboardCheck, Loader2, Save } from "lucide-react";
import { Button } from "@shared/ui/button";
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
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { Branch } from "../../domain";
import { BranchStatus, BRANCH_STATUS_LABELS } from "../../domain";
import {
  branchFormSchema,
  defaultBranchFormValues,
  type BranchFormData,
} from "../validation/branchSchema";
import { cn } from "@shared/lib/utils/cn";

export type BranchFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface BranchFormProps {
  branch?: Branch;
  onSubmit: (data: BranchFormData) => void;
  isSubmitting?: boolean;
  wizardMode?: boolean;
  wizardStepIndex?: number;
}

const WIZARD_STEP_FIELDS: (keyof BranchFormData)[][] = [
  ["code", "name", "status", "isMain", "phone", "email", "managerName"],
  [
    "street",
    "exteriorNumber",
    "interiorNumber",
    "neighborhood",
    "city",
    "state",
    "postalCode",
    "country",
    "notes",
  ],
];

function branchToFormData(branch: Branch): BranchFormData {
  return {
    code: branch.code,
    name: branch.name,
    status: branch.status,
    isMain: branch.isMain,
    street: branch.address.street,
    exteriorNumber: branch.address.exteriorNumber ?? "",
    interiorNumber: branch.address.interiorNumber ?? "",
    neighborhood: branch.address.neighborhood ?? "",
    city: branch.address.city,
    state: branch.address.state,
    postalCode: branch.address.postalCode,
    country: branch.address.country,
    phone: branch.contact.phone ?? "",
    email: branch.contact.email ?? "",
    managerName: branch.contact.managerName ?? "",
    notes: branch.notes ?? "",
  };
}

function BranchWizardSummary() {
  const form = useFormContext<BranchFormData>();
  const values = form.getValues();

  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      description="Confirma los datos antes de registrar la sucursal"
      contentClassName="grid gap-4 text-sm sm:grid-cols-2"
    >
      <div>
        <p className="text-muted-foreground">Código</p>
        <p className="font-medium">{values.code || "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Nombre</p>
        <p className="font-medium">{values.name || "—"}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Estado</p>
        <p className="font-medium">{BRANCH_STATUS_LABELS[values.status]}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Sucursal principal</p>
        <p className="font-medium">{values.isMain ? "Sí" : "No"}</p>
      </div>
      <div className="sm:col-span-2">
        <p className="text-muted-foreground">Dirección</p>
        <p className="font-medium">
          {[
            values.street,
            values.exteriorNumber,
            values.interiorNumber,
            values.neighborhood,
            values.city,
            values.state,
            values.postalCode,
            values.country,
          ]
            .filter(Boolean)
            .join(", ") || "—"}
        </p>
      </div>
    </FormSectionCard>
  );
}

export const BranchForm = forwardRef<BranchFormRef, BranchFormProps>(
  function BranchForm(
    { branch, onSubmit, isSubmitting = false, wizardMode = false, wizardStepIndex = 0 },
    ref,
  ) {
    const wizardActive = Boolean(wizardMode && !branch);
    const [showValidationSummary, setShowValidationSummary] = useState(false);

    const form = useForm<BranchFormData, unknown, BranchFormData>({
      resolver: zodResolver(branchFormSchema) as Resolver<BranchFormData>,
      defaultValues: branch ? branchToFormData(branch) : defaultBranchFormValues,
      mode: "onChange",
    });

    const { control, handleSubmit, trigger, formState } = form;
    const validationMessages = collectFieldErrorMessages(formState.errors);
    const shouldShowValidationSummary =
      showValidationSummary && !formState.isValid;

    const runStepValidation = useCallback(
      async (stepIndex: number) => {
        const fields = WIZARD_STEP_FIELDS[stepIndex];
        if (!fields?.length) return true;
        const ok = await trigger(fields, { shouldFocus: true });
        if (!ok) setShowValidationSummary(true);
        else setShowValidationSummary(false);
        return ok;
      },
      [trigger],
    );

    useImperativeHandle(
      ref,
      () => ({
        triggerStepValidation: runStepValidation,
        requestSubmit: () => {
          void handleSubmit(onSubmit)();
        },
      }),
      [handleSubmit, onSubmit, runStepValidation],
    );

    return (
      <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div
          className={cn("space-y-6", wizardActive && wizardStepIndex !== 0 && "hidden")}
          data-wizard-panel="0"
          aria-hidden={wizardActive && wizardStepIndex !== 0}
        >
          <FormSectionCard
            title="Datos generales"
            icon={<Building2 className="h-4 w-4" />}
            description="Información principal y datos de contacto"
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <RHFTextField
              control={control}
              name="code"
              label="Código"
              required
              placeholder="Ej: MTY-01"
              disabled={Boolean(branch)}
            />
            <RHFTextField
              control={control}
              name="name"
              label="Nombre"
              required
              placeholder="Sucursal Monterrey"
            />
            <RHFSelectField
              control={control}
              name="status"
              label="Estado"
              required
              placeholder="Selecciona estado"
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
                    label="Sucursal principal"
                    description="Marca esta opción solo para la sucursal matriz."
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
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormFieldShell>
                );
              }}
            />
            <RHFTextField
              control={control}
              name="phone"
              label="Teléfono"
              placeholder="81 1234 5678"
            />
            <RHFTextField
              control={control}
              name="email"
              label="Correo"
              placeholder="sucursal@empresa.com"
            />
            <div className="sm:col-span-2">
              <RHFTextField
                control={control}
                name="managerName"
                label="Responsable"
                placeholder="Nombre del responsable de sucursal"
              />
            </div>
          </FormSectionCard>
        </div>

        <div
          className={cn("space-y-6", wizardActive && wizardStepIndex !== 1 && "hidden")}
          data-wizard-panel="1"
          aria-hidden={wizardActive && wizardStepIndex !== 1}
        >
          <FormSectionCard
            title="Dirección y notas"
            icon={<Building2 className="h-4 w-4" />}
            description="Ubicación física de la sucursal"
            contentClassName="grid gap-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <RHFTextField
                control={control}
                name="street"
                label="Calle"
                required
                placeholder="Av. Principal"
              />
            </div>
            <RHFTextField
              control={control}
              name="exteriorNumber"
              label="Número exterior"
              placeholder="123"
            />
            <RHFTextField
              control={control}
              name="interiorNumber"
              label="Número interior"
              placeholder="A-2"
            />
            <RHFTextField
              control={control}
              name="neighborhood"
              label="Colonia"
              placeholder="Centro"
            />
            <RHFTextField
              control={control}
              name="city"
              label="Ciudad"
              required
              placeholder="Monterrey"
            />
            <RHFTextField
              control={control}
              name="state"
              label="Estado"
              required
              placeholder="Nuevo León"
            />
            <RHFTextField
              control={control}
              name="postalCode"
              label="Código postal"
              required
              placeholder="64000"
            />
            <RHFTextField
              control={control}
              name="country"
              label="País"
              required
              placeholder="México"
            />
            <div className="sm:col-span-2">
              <RHFTextareaField
                control={control}
                name="notes"
                label="Notas"
                rows={4}
                placeholder="Notas operativas de la sucursal"
              />
            </div>
          </FormSectionCard>
        </div>

        <div
          className={cn(!wizardActive || wizardStepIndex !== 2 ? "hidden" : undefined)}
          aria-hidden={!wizardActive || wizardStepIndex !== 2}
        >
          <BranchWizardSummary />
        </div>

        {shouldShowValidationSummary ? (
          <FormValidationSummary
            messages={validationMessages}
            title={
              wizardActive
                ? "Revisa la información de la sucursal"
                : "Revisa los siguientes campos"
            }
          />
        ) : null}

        {!wizardActive ? (
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {branch ? "Guardar cambios" : "Crear sucursal"}
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
