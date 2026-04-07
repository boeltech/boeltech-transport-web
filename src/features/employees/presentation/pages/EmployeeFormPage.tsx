import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Textarea } from "@shared/ui/text-area";
import { Label } from "@shared/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { useToast } from "@shared/hooks";
import {
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Briefcase,
  CreditCard,
} from "lucide-react";

import {
  useEmployee,
  useCreateEmployee,
  useUpdateEmployee,
} from "../../application/hooks/useEmployees";
import type {
  CreateEmployeeDTO,
  UpdateEmployeeDTO,
} from "../../domain/entities";
import {
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  SALARY_TYPE_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  BLOOD_TYPE_OPTIONS,
} from "../config/employeeConfig";
import {
  employeeSchema,
  type EmployeeFormData,
} from "../validation/employeeSchema";

type EmployeeFormValues = EmployeeFormData;

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = !!id;

  const { data: existingData, isLoading: isLoadingEmployee } = useEmployee(
    id!,
    isEditing,
  );
  const existing = existingData?.data;

  const createMutation = useCreateEmployee();
  const updateMutation = useUpdateEmployee(id!);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      hire_date: new Date().toISOString().split("T")[0],
      employment_type: "permanent",
      country: "México",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (isEditing && existing) {
      form.reset({
        first_name: existing.firstName,
        last_name: existing.lastName,
        second_last_name: existing.secondLastName ?? "",
        birth_date: existing.birthDate ?? "",
        gender: existing.gender ?? undefined,
        marital_status: existing.maritalStatus ?? undefined,
        nationality: existing.nationality ?? "",
        birth_place: existing.birthPlace ?? "",
        blood_type: existing.bloodType ?? "",
        curp: existing.curp ?? "",
        rfc: existing.rfc ?? "",
        nss: existing.nss ?? "",
        infonavit_number: existing.infonavitNumber ?? "",
        email: existing.email ?? "",
        phone: existing.phone ?? "",
        mobile_phone: existing.mobilePhone ?? "",
        street: existing.street ?? "",
        exterior_number: existing.exteriorNumber ?? "",
        interior_number: existing.interiorNumber ?? "",
        neighborhood: existing.neighborhood ?? "",
        city: existing.city ?? "",
        state: existing.state ?? "",
        postal_code: existing.postalCode ?? "",
        country: existing.country ?? "México",
        emergency_contact_name: existing.emergencyContactName ?? "",
        emergency_contact_phone: existing.emergencyContactPhone ?? "",
        emergency_contact_relationship:
          existing.emergencyContactRelationship ?? "",
        hire_date: existing.hireDate,
        employment_type: existing.employmentType,
        department: existing.department ?? "",
        position: existing.position ?? "",
        job_title: existing.jobTitle ?? "",
        work_location: existing.workLocation ?? "",
        base_salary: existing.baseSalary ?? undefined,
        salary_type: existing.salaryType ?? undefined,
        payment_method: existing.paymentMethod ?? undefined,
        bank_name: existing.bankName ?? "",
        bank_account_number: existing.bankAccountNumber ?? "",
        bank_clabe: existing.bankClabe ?? "",
        medical_notes: existing.medicalNotes ?? "",
        notes: existing.notes ?? "",
      });
    }
  }, [existing, isEditing, form]);

  const onSubmit = async (values: EmployeeFormValues) => {
    // Clean empty strings to undefined
    const clean = <T extends Record<string, unknown>>(obj: T): T =>
      Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, v === "" ? undefined : v]),
      ) as T;

    const cleaned = clean(values as Record<string, unknown>);

    try {
      if (isEditing) {
        const dto: UpdateEmployeeDTO = cleaned;
        await updateMutation.mutateAsync(dto);
        toast({ title: "Empleado actualizado correctamente" });
      } else {
        const dto: CreateEmployeeDTO = {
          ...cleaned,
          first_name: values.first_name,
          last_name: values.last_name,
          hire_date: values.hire_date,
        };
        const result = await createMutation.mutateAsync(dto);
        toast({ title: "Empleado registrado correctamente" });
        navigate(`/employees/${result.data.id}`);
        return;
      }
      navigate(`/employees/${id}`);
    } catch (err: any) {
      toast({
        title: isEditing ? "Error al actualizar" : "Error al registrar",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  if (isEditing && isLoadingEmployee) {
    return <FormSkeleton />;
  }

  // --------------------------------------------------------------------------

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            navigate(isEditing ? `/employees/${id}` : "/employees")
          }
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar empleado" : "Nuevo empleado"}
          </h1>
          {isEditing && existing && (
            <p className="text-sm text-muted-foreground">{existing.fullName}</p>
          )}
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2 hidden sm:inline" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2 hidden sm:inline" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="employment">
              <Briefcase className="h-4 w-4 mr-2 hidden sm:inline" />
              Laboral
            </TabsTrigger>
            <TabsTrigger value="compensation">
              <CreditCard className="h-4 w-4 mr-2 hidden sm:inline" />
              Compensación
            </TabsTrigger>
          </TabsList>

          {/* TAB: Personal */}
          <TabsContent value="personal" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos personales</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Select
                    value={form.watch("gender") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("gender", (v as any) || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Estado civil">
                  <Select
                    value={form.watch("marital_status") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("marital_status", (v as any) || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {MARITAL_STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Tipo de sangre">
                  <Select
                    value={form.watch("blood_type") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("blood_type", v || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {BLOOD_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Datos fiscales / gobierno
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas médicas</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...form.register("medical_notes")}
                  placeholder="Alergias, condiciones médicas relevantes..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Contact */}
          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos de contacto</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Domicilio</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <FormField label="Calle">
                    <Input
                      {...form.register("street")}
                      placeholder="Av. Insurgentes Sur"
                    />
                  </FormField>
                </div>
                <FormField label="No. exterior">
                  <Input
                    {...form.register("exterior_number")}
                    placeholder="1234"
                  />
                </FormField>
                <FormField label="No. interior">
                  <Input
                    {...form.register("interior_number")}
                    placeholder="B"
                  />
                </FormField>
                <FormField label="Colonia">
                  <Input
                    {...form.register("neighborhood")}
                    placeholder="Del Valle"
                  />
                </FormField>
                <FormField label="C.P.">
                  <Input
                    {...form.register("postal_code")}
                    placeholder="03100"
                    maxLength={10}
                  />
                </FormField>
                <FormField label="Ciudad">
                  <Input
                    {...form.register("city")}
                    placeholder="Ciudad de México"
                  />
                </FormField>
                <FormField label="Estado">
                  <Input {...form.register("state")} placeholder="CDMX" />
                </FormField>
                <FormField label="País">
                  <Input {...form.register("country")} placeholder="México" />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Contacto de emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <Input
                    {...form.register("emergency_contact_relationship")}
                    placeholder="Cónyuge"
                  />
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Employment */}
          <TabsContent value="employment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Información laboral</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Fecha de ingreso *"
                  error={form.formState.errors.hire_date?.message}
                >
                  <Input type="date" {...form.register("hire_date")} />
                </FormField>
                <FormField label="Tipo de contrato *">
                  <Select
                    value={form.watch("employment_type")}
                    onValueChange={(v) =>
                      form.setValue("employment_type", v as any)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Departamento">
                  <Input
                    {...form.register("department")}
                    placeholder="Operaciones"
                  />
                </FormField>
                <FormField label="Puesto">
                  <Input
                    {...form.register("position")}
                    placeholder="Conductor"
                  />
                </FormField>
                <FormField label="Título del trabajo">
                  <Input
                    {...form.register("job_title")}
                    placeholder="Operador de transporte"
                  />
                </FormField>
                <FormField label="Ubicación / Sucursal">
                  <Input
                    {...form.register("work_location")}
                    placeholder="Matriz"
                  />
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas generales</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  {...form.register("notes")}
                  placeholder="Observaciones o notas adicionales..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB: Compensation */}
          <TabsContent value="compensation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Compensación</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Salario base">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    {...form.register("base_salary", {
                      setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                    })}
                    placeholder="15000.00"
                  />
                </FormField>
                <FormField label="Frecuencia de pago">
                  <Select
                    value={form.watch("salary_type") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("salary_type", (v as any) || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {SALARY_TYPE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <FormField label="Método de pago">
                  <Select
                    value={form.watch("payment_method") ?? ""}
                    onValueChange={(v) =>
                      form.setValue("payment_method", (v as any) || undefined)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Datos bancarios</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField label="Banco">
                  <Input {...form.register("bank_name")} placeholder="BBVA" />
                </FormField>
                <FormField label="No. de cuenta">
                  <Input
                    {...form.register("bank_account_number")}
                    placeholder="0123456789"
                    className="font-mono"
                  />
                </FormField>
                <FormField
                  label="CLABE"
                  error={form.formState.errors.bank_clabe?.message}
                >
                  <Input
                    {...form.register("bank_clabe")}
                    placeholder="012345678901234567"
                    className="font-mono"
                    maxLength={18}
                  />
                </FormField>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              navigate(isEditing ? `/employees/${id}` : "/employees")
            }
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Registrar empleado"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-muted rounded-md" />
        <div className="h-7 w-48 bg-muted rounded" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-9 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
