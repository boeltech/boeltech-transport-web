/**
 * DriverForm
 * Clean Architecture - Presentation Layer (Components)
 *
 * Formulario reutilizable para crear y editar conductores.
 * Usa React Hook Form + Zod para validación.
 *
 * Ubicación: src/features/drivers/presentation/components/DriverForm.tsx
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import {
  Loader2,
  User,
  CreditCard,
  Heart,
  Users,
  FileText,
} from "lucide-react";

import { LICENSE_TYPE_LABELS, type Driver } from "../../domain";
import {
  driverSchema,
  type DriverFormData,
  defaultDriverFormValues,
  BLOOD_TYPE_OPTIONS,
  RELATIONSHIP_OPTIONS,
  MEXICAN_STATES,
} from "../validation/driverSchema";

// ============================================================================
// TYPES
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

interface EmployeeOption {
  id: string;
  employeeNumber: string;
  fullName: string;
}

interface EmployeeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

// ============================================================================
// EMPLOYEE SELECTOR (Placeholder - Implementar con useAvailableEmployees)
// ============================================================================

function EmployeeSelector({
  value,
  onChange,
  error,
  disabled,
}: EmployeeSelectorProps) {
  // TODO: Implementar con hook useAvailableEmployees
  // Por ahora es un input de texto para el ID
  return (
    <div className="space-y-2">
      <Label htmlFor="employeeId">
        Empleado <span className="text-destructive">*</span>
      </Label>
      <Input
        id="employeeId"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="ID del empleado (UUID)"
        disabled={disabled}
        className={error ? "border-destructive" : ""}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Seleccione el empleado que será registrado como conductor
      </p>
    </div>
  );
}

// ============================================================================
// FORM FIELD COMPONENT
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
// MAIN COMPONENT
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
  const watchedBloodType = watch("bloodType");
  const watchedIssuingState = watch("licenseIssuingState");
  const watchedRelationship = watch("emergencyContactRelationship");

  // Populate form when editing
  useEffect(() => {
    if (driver && mode === "edit") {
      reset({
        employeeId: driver.employeeId,
        licenseNumber: driver.licenseNumber,
        licenseType: driver.licenseType,
        licenseExpiration: driver.licenseExpiration
          ? new Date(driver.licenseExpiration).toISOString().split("T")[0]
          : "",
        licenseIssuedDate: driver.licenseIssuedDate
          ? new Date(driver.licenseIssuedDate).toISOString().split("T")[0]
          : "",
        licenseIssuingState: driver.licenseIssuingState || "",
        yearsOfExperience: driver.yearsOfExperience || 0,
        bloodType: driver.bloodType || "",
        medicalCertificateExpiration: driver.medicalCertificateExpiration
          ? new Date(driver.medicalCertificateExpiration)
              .toISOString()
              .split("T")[0]
          : "",
        notes: driver.notes || "",
        emergencyContactName: driver.emergencyContactName || "",
        emergencyContactPhone: driver.emergencyContactPhone || "",
        emergencyContactRelationship: driver.emergencyContactRelationship || "",
      });
    }
  }, [driver, mode, reset]);

  const handleFormSubmit = (data: DriverFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
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
            onChange={(value) => setValue("employeeId", value)}
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
            <CreditCard className="h-5 w-5" /> Información de Licencia
          </CardTitle>
          <CardDescription>
            Datos de la licencia de conducir del operador
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
                value={watchedLicenseType}
                onValueChange={(value) =>
                  setValue("licenseType", value as typeof watchedLicenseType)
                }
              >
                <SelectTrigger
                  className={errors.licenseType ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LICENSE_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Fecha de emisión */}
            <FormField
              label="Fecha de emisión"
              htmlFor="licenseIssuedDate"
              error={errors.licenseIssuedDate?.message}
            >
              <Input
                id="licenseIssuedDate"
                type="date"
                {...register("licenseIssuedDate")}
              />
            </FormField>

            {/* Fecha de vencimiento */}
            <FormField
              label="Fecha de vencimiento"
              htmlFor="licenseExpiration"
              required
              error={errors.licenseExpiration?.message}
            >
              <Input
                id="licenseExpiration"
                type="date"
                {...register("licenseExpiration")}
                className={errors.licenseExpiration ? "border-destructive" : ""}
              />
            </FormField>

            {/* Estado emisor */}
            <FormField
              label="Estado emisor"
              htmlFor="licenseIssuingState"
              error={errors.licenseIssuingState?.message}
            >
              <Select
                value={watchedIssuingState || ""}
                onValueChange={(value) =>
                  setValue("licenseIssuingState", value)
                }
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

            {/* Años de experiencia */}
            <FormField
              label="Años de experiencia"
              htmlFor="yearsOfExperience"
              error={errors.yearsOfExperience?.message}
            >
              <Input
                id="yearsOfExperience"
                type="number"
                min={0}
                max={60}
                {...register("yearsOfExperience", { valueAsNumber: true })}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: INFORMACIÓN MÉDICA                                        */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5" /> Información Médica
          </CardTitle>
          <CardDescription>
            Datos médicos relevantes del conductor (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Tipo de sangre */}
            <FormField
              label="Tipo de sangre"
              htmlFor="bloodType"
              error={errors.bloodType?.message}
            >
              <Select
                value={watchedBloodType || ""}
                onValueChange={(value) => setValue("bloodType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {BLOOD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Vencimiento certificado médico */}
            <FormField
              label="Vencimiento certificado médico"
              htmlFor="medicalCertificateExpiration"
              error={errors.medicalCertificateExpiration?.message}
            >
              <Input
                id="medicalCertificateExpiration"
                type="date"
                {...register("medicalCertificateExpiration")}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* SECCIÓN: CONTACTO DE EMERGENCIA                                    */}
      {/* ================================================================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="h-5 w-5" /> Contacto de Emergencia
          </CardTitle>
          <CardDescription>
            Persona a contactar en caso de emergencia (opcional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Nombre */}
            <FormField
              label="Nombre"
              htmlFor="emergencyContactName"
              error={errors.emergencyContactName?.message}
            >
              <Input
                id="emergencyContactName"
                {...register("emergencyContactName")}
                placeholder="Nombre completo"
              />
            </FormField>

            {/* Teléfono */}
            <FormField
              label="Teléfono"
              htmlFor="emergencyContactPhone"
              error={errors.emergencyContactPhone?.message}
            >
              <Input
                id="emergencyContactPhone"
                {...register("emergencyContactPhone")}
                placeholder="Ej: +52 55 1234 5678"
              />
            </FormField>

            {/* Parentesco */}
            <FormField
              label="Parentesco"
              htmlFor="emergencyContactRelationship"
              error={errors.emergencyContactRelationship?.message}
            >
              <Select
                value={watchedRelationship || ""}
                onValueChange={(value) =>
                  setValue("emergencyContactRelationship", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            description="Información adicional sobre el conductor"
          >
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Observaciones, restricciones, etc..."
              rows={4}
            />
          </FormField>
        </CardContent>
      </Card>

      {/* ================================================================== */}
      {/* ACCIONES                                                           */}
      {/* ================================================================== */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
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
          {mode === "create" ? "Crear Conductor" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}

export default DriverForm;
