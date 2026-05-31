/**
 * DriverForm
 * Clean Architecture - Presentation Layer (Components)
 *
 * Formulario para crear y editar conductores.
 *
 * IMPORTANTE: Los datos personales del conductor están en el módulo employees.
 * Este formulario solo captura:
 * - Selección del empleado
 * - Datos de licencia
 * - Certificado médico
 * - Exámenes (psicométrico y antidoping)
 * - Dispositivo GPS/Telemetría
 * - Notas
 */

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { FormSectionCard } from "@shared/ui/form-section-card";
import { Alert, AlertDescription } from "@shared/ui/alert";
import {
  Loader2,
  User,
  CreditCard,
  Stethoscope,
  Brain,
  FlaskConical,
  Cpu,
  FileText,
  Info,
  ExternalLink,
  ClipboardCheck,
} from "lucide-react";

import { cn } from "@shared/lib/utils/cn";
import {
  FormFieldShell,
  FormValidationSummary,
  getFieldErrorAriaProps,
} from "@shared/ui/form";
import { collectFieldErrorMessages } from "@shared/utils/formErrors";
import type { Driver } from "../../domain";
import { EmployeeSelector } from "./EmployeeSelector";
import {
  driverSchema,
  DRIVER_CREATE_WIZARD_STEP_FIELDS,
  type DriverFormData,
  defaultDriverFormValues,
  LICENSE_TYPES,
  MEXICAN_STATES,
  PSYCHOMETRIC_RESULTS,
  DRUG_TEST_RESULTS,
} from "../validation/driverSchema";

// ============================================================================
// Types
// ============================================================================

export type DriverFormRef = {
  triggerStepValidation: (stepIndex: number) => Promise<boolean>;
  requestSubmit: () => void;
};

interface DriverFormProps {
  /** Driver existente para edición (undefined para creación) */
  driver?: Driver;
  /** Callback cuando se envía el formulario */
  onSubmit: (data: DriverFormData) => void;
  /** Callback para cancelar */
  onCancel: () => void;
  /** Estado de carga del submit */
  isSubmitting?: boolean;
  /** Modo del formulario */
  mode: "create" | "edit";
  /** Wizard de alta (solo creación) */
  wizardMode?: boolean;
  wizardStepIndex?: number;
}

function reviewLine(label: string, value: string) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words font-medium">{value.trim() ? value : "—"}</p>
    </div>
  );
}

function DriverReviewSummary({ getValues }: { getValues: () => DriverFormData }) {
  const v = getValues();
  const licenseLabel =
    LICENSE_TYPES.find((t) => t.value === v.licenseType)?.label ?? v.licenseType;
  const psychLabel =
    PSYCHOMETRIC_RESULTS.find((r) => r.value === v.psychometricTestResult)
      ?.label ?? (v.psychometricTestResult || "—");
  const drugLabel =
    DRUG_TEST_RESULTS.find((r) => r.value === v.drugTestResult)?.label ??
    (v.drugTestResult || "—");

  return (
    <FormSectionCard
      title="Revisión"
      icon={<ClipboardCheck className="h-4 w-4" />}
      description="Confirma los datos antes de registrar al conductor"
      contentClassName="space-y-6 text-sm"
    >
      <div className="space-y-2 border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Empleado
        </p>
        {reviewLine(
          "ID de empleado vinculado",
          v.employeeId ? v.employeeId : "",
        )}
      </div>

      <div className="space-y-3 border-b pb-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Licencia y certificado médico
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {reviewLine("Número de licencia", v.licenseNumber)}
          {reviewLine("Tipo", licenseLabel)}
          {reviewLine("Vencimiento licencia", v.licenseExpiry)}
          {reviewLine(
            "Estado emisor",
            v.licenseState
              ? v.licenseState
              : "No especificado",
          )}
          {reviewLine(
            "Número certificado médico",
            v.medicalCertificateNumber ?? "",
          )}
          {reviewLine(
            "Vencimiento certificado médico",
            v.medicalCertificateExpiry ?? "",
          )}
          {reviewLine(
            "Institución emisora (médico)",
            v.medicalCertificateIssuer ?? "",
          )}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Exámenes, dispositivo y notas
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {reviewLine("Fecha examen psicométrico", v.psychometricTestDate ?? "")}
          {reviewLine("Resultado psicométrico", psychLabel)}
          {reviewLine("Fecha último antidoping", v.lastDrugTestDate ?? "")}
          {reviewLine("Resultado antidoping", drugLabel)}
          {reviewLine("ID dispositivo GPS", v.assignedDeviceId ?? "")}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Notas</p>
          <p className="whitespace-pre-wrap break-words text-sm font-medium">
            {v.notes?.trim() ? v.notes : "—"}
          </p>
        </div>
      </div>
    </FormSectionCard>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export const DriverForm = forwardRef<DriverFormRef, DriverFormProps>(
  function DriverForm(
    {
      driver,
      onSubmit,
      onCancel,
      isSubmitting = false,
      mode,
      wizardMode = false,
      wizardStepIndex = 0,
    },
    ref,
  ) {
  const wizardActive = Boolean(wizardMode && mode === "create");
  const ws = wizardStepIndex;
  const [showValidationSummary, setShowValidationSummary] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    getValues,
    trigger,
    formState: { errors, isDirty, isValid },
    reset,
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: defaultDriverFormValues,
    mode: "onChange",
  });

  const validationMessages = collectFieldErrorMessages(errors);
  const shouldShowValidationSummary = showValidationSummary && !isValid;

  const handleFormSubmit = useCallback(
    (data: DriverFormData) => {
      onSubmit(data);
    },
    [onSubmit],
  );

  useImperativeHandle(
    ref,
    () => ({
      triggerStepValidation: async (stepIndex: number) => {
        const fields = DRIVER_CREATE_WIZARD_STEP_FIELDS[stepIndex];
        if (!fields?.length) return true;
        const ok = await trigger(fields, { shouldFocus: true });
        if (!ok) setShowValidationSummary(true);
        else setShowValidationSummary(false);
        return ok;
      },
      requestSubmit: () => {
        void handleSubmit(handleFormSubmit)();
      },
    }),
    [trigger, handleSubmit, handleFormSubmit],
  );

  // Watch values for controlled components
  const watchedEmployeeId = useWatch({ control, name: "employeeId" });
  const watchedLicenseType = useWatch({ control, name: "licenseType" });
  const watchedLicenseState = useWatch({ control, name: "licenseState" });
  const watchedPsychometricResult = useWatch({
    control,
    name: "psychometricTestResult",
  });
  const watchedDrugTestResult = useWatch({ control, name: "drugTestResult" });

  // Populate form when editing
  useEffect(() => {
    if (driver && mode === "edit") {
      // Normalizar licenseType a mayúsculas (el backend puede devolver minúsculas)
      const normalizedLicenseType = (driver.licenseType?.toUpperCase() ||
        "E") as DriverFormData["licenseType"];

      // Validar que psychometricTestResult sea un valor válido
      const validPsychometricResults = PSYCHOMETRIC_RESULTS.map((r) => r.value);
      const psychometricValue = driver.psychometricTestResult ?? "";
      const normalizedPsychometricResult = validPsychometricResults.includes(
        psychometricValue as (typeof validPsychometricResults)[number],
      )
        ? psychometricValue
        : "";

      // Validar que drugTestResult sea un valor válido
      const validDrugTestResults = DRUG_TEST_RESULTS.map((r) => r.value);
      const drugTestValue = driver.drugTestResult ?? "";
      const normalizedDrugTestResult = validDrugTestResults.includes(
        drugTestValue as (typeof validDrugTestResults)[number],
      )
        ? drugTestValue
        : "";

      // Usar reset con valores explícitos
      const formValues: DriverFormData = {
        employeeId: driver.employeeId,
        licenseNumber: driver.licenseNumber || "",
        licenseType: normalizedLicenseType,
        licenseExpiry: driver.licenseExpiry,
        licenseState: driver.licenseIssuingState || "",
        medicalCertificateNumber: driver.medicalCertificateNumber || "",
        medicalCertificateExpiry: driver.medicalCertificateExpiry || undefined,
        medicalCertificateIssuer: driver.medicalCertificateIssuer || "",
        psychometricTestDate: driver.psychometricTestDate || undefined,
        psychometricTestResult: normalizedPsychometricResult || "",
        lastDrugTestDate: driver.lastDrugTestDate || undefined,
        drugTestResult: normalizedDrugTestResult || "",
        assignedDeviceId: driver.assignedDeviceId || "",
        notes: driver.notes || "",
      };

      reset(formValues);
    }
  }, [driver, mode, reset]);

  // Handler para Select que maneja el valor vacío
  const handleSelectChange = <K extends keyof DriverFormData>(
    field: K,
    value: DriverFormData[K],
  ) => {
    setValue(field, value as never, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Alta: vínculo a empleado. En edición el empleado no cambia (no hay selector). */}
      {mode !== "edit" ? (
      <div
        className={cn("space-y-6", wizardActive && ws !== 0 && "hidden")}
        data-wizard-panel="0"
        aria-hidden={wizardActive && ws !== 0}
      >
      {/* ================================================================== */}
      {/* INFO BANNER - Solo en modo crear                                   */}
      {/* ================================================================== */}
      {mode === "create" && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Para registrar un conductor, primero debe existir como empleado en
            el sistema.{" "}
            <Link
              to="/employees/new"
              className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
            >
              Crear empleado <ExternalLink className="h-3 w-3" />
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* ================================================================== */}
      {/* SECCIÓN: EMPLEADO                                                  */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Empleado"
        icon={<User className="h-4 w-4" />}
        description="Seleccione el empleado que será registrado como conductor"
      >
          <EmployeeSelector
            value={watchedEmployeeId || ""}
            onChange={(value) =>
              setValue("employeeId", value, { shouldValidate: true })
            }
            error={errors.employeeId?.message}
            positionEquals={mode === "create" ? "Conductor" : undefined}
          />
      </FormSectionCard>
      </div>
      ) : null}

      <div
        className={cn("space-y-6", wizardActive && ws !== 1 && "hidden")}
        data-wizard-panel="1"
        aria-hidden={wizardActive && ws !== 1}
      >
      {/* ================================================================== */}
      {/* SECCIÓN: LICENCIA                                                  */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Licencia de Conducir"
        icon={<CreditCard className="h-4 w-4" />}
        description="Información de la licencia federal de conducir"
        contentClassName="space-y-4"
      >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Número de licencia */}
            <FormFieldShell
              label="Número de licencia"
              fieldId="licenseNumber"
              required
              errorMessage={errors.licenseNumber?.message}
            >
              <Input
                id="licenseNumber"
                {...register("licenseNumber")}
                placeholder="Ej: ABC123456"
                error={Boolean(errors.licenseNumber)}
                {...getFieldErrorAriaProps(
                  "licenseNumber",
                  errors.licenseNumber?.message,
                )}
              />
            </FormFieldShell>

            {/* Tipo de licencia */}
            <FormFieldShell
              label="Tipo de licencia"
              fieldId="licenseType"
              required
              errorMessage={errors.licenseType?.message}
            >
              <Select
                value={watchedLicenseType ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange(
                      "licenseType",
                      value as DriverFormData["licenseType"],
                    );
                  }
                }}
              >
                <SelectTrigger
                  id="licenseType"
                  error={Boolean(errors.licenseType)}
                  {...getFieldErrorAriaProps(
                    "licenseType",
                    errors.licenseType?.message,
                  )}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>

            {/* Fecha de vencimiento */}
            <FormFieldShell
              label="Fecha de vencimiento"
              fieldId="licenseExpiry"
              required
              errorMessage={errors.licenseExpiry?.message}
            >
              <Input
                id="licenseExpiry"
                type="date"
                {...register("licenseExpiry")}
                error={Boolean(errors.licenseExpiry)}
                {...getFieldErrorAriaProps(
                  "licenseExpiry",
                  errors.licenseExpiry?.message,
                )}
              />
            </FormFieldShell>

            {/* Estado emisor */}
            <FormFieldShell
              label="Estado emisor"
              fieldId="licenseState"
              errorMessage={errors.licenseState?.message}
            >
              <Select
                value={watchedLicenseState ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("licenseState", value);
                  }
                }}
              >
                <SelectTrigger
                  id="licenseState"
                  error={Boolean(errors.licenseState)}
                  {...getFieldErrorAriaProps(
                    "licenseState",
                    errors.licenseState?.message,
                  )}
                >
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {MEXICAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>
          </div>
      </FormSectionCard>

      {/* ================================================================== */}
      {/* SECCIÓN: CERTIFICADO MÉDICO                                        */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Certificado Médico"
        icon={<Stethoscope className="h-4 w-4" />}
        description="Certificado de aptitud médica para conducir"
        contentClassName="space-y-4"
      >
          <div className="grid gap-4 md:grid-cols-3">
            {/* Número de certificado */}
            <FormFieldShell
              label="Número de certificado"
              fieldId="medicalCertificateNumber"
              errorMessage={errors.medicalCertificateNumber?.message}
            >
              <Input
                id="medicalCertificateNumber"
                {...register("medicalCertificateNumber")}
                placeholder="Ej: CM-2024-001234"
                error={Boolean(errors.medicalCertificateNumber)}
                {...getFieldErrorAriaProps(
                  "medicalCertificateNumber",
                  errors.medicalCertificateNumber?.message,
                )}
              />
            </FormFieldShell>

            {/* Fecha de vencimiento */}
            <FormFieldShell
              label="Fecha de vencimiento"
              fieldId="medicalCertificateExpiry"
              errorMessage={errors.medicalCertificateExpiry?.message}
            >
              <Input
                id="medicalCertificateExpiry"
                type="date"
                {...register("medicalCertificateExpiry")}
                error={Boolean(errors.medicalCertificateExpiry)}
                {...getFieldErrorAriaProps(
                  "medicalCertificateExpiry",
                  errors.medicalCertificateExpiry?.message,
                )}
              />
            </FormFieldShell>

            {/* Institución emisora */}
            <FormFieldShell
              label="Institución emisora"
              fieldId="medicalCertificateIssuer"
              errorMessage={errors.medicalCertificateIssuer?.message}
            >
              <Input
                id="medicalCertificateIssuer"
                {...register("medicalCertificateIssuer")}
                placeholder="Ej: IMSS, Hospital General, etc."
                error={Boolean(errors.medicalCertificateIssuer)}
                {...getFieldErrorAriaProps(
                  "medicalCertificateIssuer",
                  errors.medicalCertificateIssuer?.message,
                )}
              />
            </FormFieldShell>
          </div>
      </FormSectionCard>
      </div>

      <div
        className={cn("space-y-6", wizardActive && ws !== 2 && "hidden")}
        data-wizard-panel="2"
        aria-hidden={wizardActive && ws !== 2}
      >
      {/* ================================================================== */}
      {/* SECCIÓN: EXAMEN PSICOMÉTRICO                                       */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Examen Psicométrico"
        icon={<Brain className="h-4 w-4" />}
        description="Evaluación psicológica y de aptitudes"
        contentClassName="space-y-4"
      >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha del examen */}
            <FormFieldShell
              label="Fecha del examen"
              fieldId="psychometricTestDate"
              errorMessage={errors.psychometricTestDate?.message}
            >
              <Input
                id="psychometricTestDate"
                type="date"
                {...register("psychometricTestDate")}
                error={Boolean(errors.psychometricTestDate)}
                {...getFieldErrorAriaProps(
                  "psychometricTestDate",
                  errors.psychometricTestDate?.message,
                )}
              />
            </FormFieldShell>

            {/* Resultado */}
            <FormFieldShell
              label="Resultado"
              fieldId="psychometricTestResult"
              errorMessage={errors.psychometricTestResult?.message}
            >
              <Select
                value={watchedPsychometricResult ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("psychometricTestResult", value);
                  }
                }}
              >
                <SelectTrigger
                  id="psychometricTestResult"
                  error={Boolean(errors.psychometricTestResult)}
                  {...getFieldErrorAriaProps(
                    "psychometricTestResult",
                    errors.psychometricTestResult?.message,
                  )}
                >
                  <SelectValue placeholder="Seleccionar resultado" />
                </SelectTrigger>
                <SelectContent>
                  {PSYCHOMETRIC_RESULTS.map((result) => (
                    <SelectItem key={result.value} value={result.value}>
                      {result.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>
          </div>
      </FormSectionCard>

      {/* ================================================================== */}
      {/* SECCIÓN: EXAMEN ANTIDOPING                                         */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Examen Antidoping"
        icon={<FlaskConical className="h-4 w-4" />}
        description="Prueba de detección de sustancias prohibidas"
        contentClassName="space-y-4"
      >
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha del examen */}
            <FormFieldShell
              label="Fecha del último examen"
              fieldId="lastDrugTestDate"
              errorMessage={errors.lastDrugTestDate?.message}
            >
              <Input
                id="lastDrugTestDate"
                type="date"
                {...register("lastDrugTestDate")}
                error={Boolean(errors.lastDrugTestDate)}
                {...getFieldErrorAriaProps(
                  "lastDrugTestDate",
                  errors.lastDrugTestDate?.message,
                )}
              />
            </FormFieldShell>

            {/* Resultado */}
            <FormFieldShell
              label="Resultado"
              fieldId="drugTestResult"
              errorMessage={errors.drugTestResult?.message}
            >
              <Select
                value={watchedDrugTestResult ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("drugTestResult", value);
                  }
                }}
              >
                <SelectTrigger
                  id="drugTestResult"
                  error={Boolean(errors.drugTestResult)}
                  {...getFieldErrorAriaProps(
                    "drugTestResult",
                    errors.drugTestResult?.message,
                  )}
                >
                  <SelectValue placeholder="Seleccionar resultado" />
                </SelectTrigger>
                <SelectContent>
                  {DRUG_TEST_RESULTS.map((result) => (
                    <SelectItem key={result.value} value={result.value}>
                      {result.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormFieldShell>
          </div>
      </FormSectionCard>

      {/* ================================================================== */}
      {/* SECCIÓN: DISPOSITIVO GPS/TELEMETRÍA                                */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Dispositivo GPS / Telemetría"
        icon={<Cpu className="h-4 w-4" />}
        description="Dispositivo de rastreo asignado al conductor"
      >
          <div className="grid gap-4 md:grid-cols-2">
            <FormFieldShell
              label="ID del dispositivo"
              fieldId="assignedDeviceId"
              errorMessage={errors.assignedDeviceId?.message}
              description="Identificador único del dispositivo GPS asignado"
            >
              <Input
                id="assignedDeviceId"
                {...register("assignedDeviceId")}
                placeholder="Ej: GPS-001, TLM-A1234"
                error={Boolean(errors.assignedDeviceId)}
                {...getFieldErrorAriaProps(
                  "assignedDeviceId",
                  errors.assignedDeviceId?.message,
                )}
              />
            </FormFieldShell>
          </div>
      </FormSectionCard>

      {/* ================================================================== */}
      {/* SECCIÓN: NOTAS                                                     */}
      {/* ================================================================== */}
      <FormSectionCard
        title="Notas Adicionales"
        icon={<FileText className="h-4 w-4" />}
      >
          <FormFieldShell
            label="Notas"
            fieldId="notes"
            errorMessage={errors.notes?.message}
            description="Información adicional sobre el conductor (restricciones, observaciones, etc.)"
          >
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observaciones, restricciones, certificaciones adicionales..."
              rows={4}
              error={Boolean(errors.notes)}
              {...getFieldErrorAriaProps("notes", errors.notes?.message)}
            />
          </FormFieldShell>
      </FormSectionCard>
      </div>

      <div
        className={cn(!wizardActive || ws !== 3 ? "hidden" : undefined)}
        data-wizard-panel="3"
        aria-hidden={!wizardActive || ws !== 3}
      >
        <DriverReviewSummary getValues={getValues} />
      </div>

      {shouldShowValidationSummary ? (
        <FormValidationSummary
          messages={validationMessages}
          title={
            wizardActive
              ? "Revisa la información del conductor"
              : "Revisa los siguientes campos"
          }
        />
      ) : null}

      {/* ================================================================== */}
      {/* ACCIONES                                                           */}
      {/* ================================================================== */}
      {!wizardActive && (
        <div className="flex items-center justify-end gap-4 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || (!isDirty && mode === "edit")}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Registrar Conductor" : "Guardar Cambios"}
          </Button>
        </div>
      )}
    </form>
  );
  },
);

DriverForm.displayName = "DriverForm";

export default DriverForm;
