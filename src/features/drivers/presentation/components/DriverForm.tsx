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

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
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
} from "lucide-react";

import type { Driver } from "../../domain";
import { EmployeeSelector } from "./EmployeeSelector";
import {
  driverSchema,
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
}

// ============================================================================
// Form Field Component
// ============================================================================

interface FormFieldProps {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}

function FormField({
  label,
  htmlFor,
  required,
  error,
  description,
  children,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DriverForm({
  driver,
  onSubmit,
  onCancel,
  isSubmitting = false,
  mode,
}: DriverFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
    defaultValues: defaultDriverFormValues,
  });

  // Watch values for controlled components
  const watchedEmployeeId = watch("employeeId");
  const watchedLicenseType = watch("licenseType");
  const watchedLicenseState = watch("licenseState");
  const watchedPsychometricResult = watch("psychometricTestResult");
  const watchedDrugTestResult = watch("drugTestResult");

  // Populate form when editing
  useEffect(() => {
    if (driver && mode === "edit") {
      // Normalizar licenseType a mayúsculas (el backend puede devolver minúsculas)
      const normalizedLicenseType = (driver.licenseType?.toUpperCase() ||
        "E") as DriverFormData["licenseType"];

      // Validar que psychometricTestResult sea un valor válido
      const validPsychometricResults = PSYCHOMETRIC_RESULTS.map((r) => r.value);
      const normalizedPsychometricResult = validPsychometricResults.includes(
        driver.psychometricTestResult as any,
      )
        ? driver.psychometricTestResult
        : "";

      // Validar que drugTestResult sea un valor válido
      const validDrugTestResults = DRUG_TEST_RESULTS.map((r) => r.value);
      const normalizedDrugTestResult = validDrugTestResults.includes(
        driver.drugTestResult as any,
      )
        ? driver.drugTestResult
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

  const handleFormSubmit = (data: DriverFormData) => {
    onSubmit(data);
  };

  // Handler para Select que maneja el valor vacío
  const handleSelectChange = (field: keyof DriverFormData, value: string) => {
    setValue(field, value as any, { shouldValidate: true, shouldDirty: true });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5" /> Empleado
          </CardTitle>
          <CardDescription>
            Seleccione el empleado que será registrado como conductor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeSelector
            value={watchedEmployeeId || ""}
            onChange={(value) =>
              setValue("employeeId", value, { shouldValidate: true })
            }
            error={errors.employeeId?.message}
            disabled={mode === "edit"}
          />
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: LICENCIA                                                  */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5" /> Licencia de Conducir
          </CardTitle>
          <CardDescription>
            Información de la licencia federal de conducir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Número de licencia */}
            <FormField
              label="Número de licencia"
              htmlFor="licenseNumber"
              required
              error={errors.licenseNumber?.message}
            >
              <Input
                id="licenseNumber"
                {...register("licenseNumber")}
                placeholder="Ej: ABC123456"
                className={errors.licenseNumber ? "border-destructive" : ""}
              />
            </FormField>

            {/* Tipo de licencia */}
            <FormField
              label="Tipo de licencia"
              htmlFor="licenseType"
              required
              error={errors.licenseType?.message}
            >
              <Select
                value={watchedLicenseType ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("licenseType", value);
                  }
                }}
              >
                <SelectTrigger
                  className={errors.licenseType ? "border-destructive" : ""}
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
            </FormField>

            {/* Fecha de vencimiento */}
            <FormField
              label="Fecha de vencimiento"
              htmlFor="licenseExpiry"
              required
              error={errors.licenseExpiry?.message}
            >
              <Input
                id="licenseExpiry"
                type="date"
                {...register("licenseExpiry")}
                className={errors.licenseExpiry ? "border-destructive" : ""}
              />
            </FormField>

            {/* Estado emisor */}
            <FormField
              label="Estado emisor"
              htmlFor="licenseState"
              error={errors.licenseState?.message}
            >
              <Select
                value={watchedLicenseState ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("licenseState", value);
                  }
                }}
              >
                <SelectTrigger>
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
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: CERTIFICADO MÉDICO                                        */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Stethoscope className="h-5 w-5" /> Certificado Médico
          </CardTitle>
          <CardDescription>
            Certificado de aptitud médica para conducir
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Número de certificado */}
            <FormField
              label="Número de certificado"
              htmlFor="medicalCertificateNumber"
              error={errors.medicalCertificateNumber?.message}
            >
              <Input
                id="medicalCertificateNumber"
                {...register("medicalCertificateNumber")}
                placeholder="Ej: CM-2024-001234"
              />
            </FormField>

            {/* Fecha de vencimiento */}
            <FormField
              label="Fecha de vencimiento"
              htmlFor="medicalCertificateExpiry"
              error={errors.medicalCertificateExpiry?.message}
            >
              <Input
                id="medicalCertificateExpiry"
                type="date"
                {...register("medicalCertificateExpiry")}
              />
            </FormField>

            {/* Institución emisora */}
            <FormField
              label="Institución emisora"
              htmlFor="medicalCertificateIssuer"
              error={errors.medicalCertificateIssuer?.message}
            >
              <Input
                id="medicalCertificateIssuer"
                {...register("medicalCertificateIssuer")}
                placeholder="Ej: IMSS, Hospital General, etc."
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: EXAMEN PSICOMÉTRICO                                       */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="h-5 w-5" /> Examen Psicométrico
          </CardTitle>
          <CardDescription>
            Evaluación psicológica y de aptitudes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha del examen */}
            <FormField
              label="Fecha del examen"
              htmlFor="psychometricTestDate"
              error={errors.psychometricTestDate?.message}
            >
              <Input
                id="psychometricTestDate"
                type="date"
                {...register("psychometricTestDate")}
              />
            </FormField>

            {/* Resultado */}
            <FormField
              label="Resultado"
              htmlFor="psychometricTestResult"
              error={errors.psychometricTestResult?.message}
            >
              <Select
                value={watchedPsychometricResult ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("psychometricTestResult", value);
                  }
                }}
              >
                <SelectTrigger>
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
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: EXAMEN ANTIDOPING                                         */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-5 w-5" /> Examen Antidoping
          </CardTitle>
          <CardDescription>
            Prueba de detección de sustancias prohibidas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Fecha del examen */}
            <FormField
              label="Fecha del último examen"
              htmlFor="lastDrugTestDate"
              error={errors.lastDrugTestDate?.message}
            >
              <Input
                id="lastDrugTestDate"
                type="date"
                {...register("lastDrugTestDate")}
              />
            </FormField>

            {/* Resultado */}
            <FormField
              label="Resultado"
              htmlFor="drugTestResult"
              error={errors.drugTestResult?.message}
            >
              <Select
                value={watchedDrugTestResult ?? ""}
                onValueChange={(value) => {
                  if (value) {
                    handleSelectChange("drugTestResult", value);
                  }
                }}
              >
                <SelectTrigger>
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
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: DISPOSITIVO GPS/TELEMETRÍA                                */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cpu className="h-5 w-5" /> Dispositivo GPS / Telemetría
          </CardTitle>
          <CardDescription>
            Dispositivo de rastreo asignado al conductor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              label="ID del dispositivo"
              htmlFor="assignedDeviceId"
              error={errors.assignedDeviceId?.message}
              description="Identificador único del dispositivo GPS asignado"
            >
              <Input
                id="assignedDeviceId"
                {...register("assignedDeviceId")}
                placeholder="Ej: GPS-001, TLM-A1234"
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: NOTAS                                                     */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" /> Notas Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            label="Notas"
            htmlFor="notes"
            error={errors.notes?.message}
            description="Información adicional sobre el conductor (restricciones, observaciones, etc.)"
          >
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observaciones, restricciones, certificaciones adicionales..."
              rows={4}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* ACCIONES                                                           */}
      {/* ================================================================== */}
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
    </form>
  );
}

export default DriverForm;
