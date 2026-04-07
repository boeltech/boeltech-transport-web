import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@shared/ui/dialog";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { Textarea } from "@shared/ui/text-area";
import { usePermissions } from "@shared/permissions";
import { useToast } from "@shared/hooks";
import { formatDate, formatDateTime } from "@shared/utils/dateUtils";
import {
  ArrowLeft,
  User,
  Pencil,
  UserX,
  Phone,
  MapPin,
  Briefcase,
  CreditCard,
  Building2,
  Heart,
  AlertCircle,
  Calendar,
  Hash,
} from "lucide-react";
import { cn } from "@shared/lib/utils/cn";

import {
  useEmployee,
  useTerminateEmployee,
} from "../../application/hooks/useEmployees";
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_VARIANTS,
  EMPLOYMENT_TYPE_LABELS,
  SALARY_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
} from "../config/employeeConfig";

// ============================================================================
// COMPONENT
// ============================================================================

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  const { data, isLoading, isError } = useEmployee(id!);
  const employee = data?.data;

  const terminateMutation = useTerminateEmployee();
  const [showTerminateDialog, setShowTerminateDialog] = useState(false);
  const [terminationDate, setTerminationDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [terminationReason, setTerminationReason] = useState("");

  const canUpdate = hasPermission("employees", "update");
  const canDelete = hasPermission("employees", "delete");

  const handleTerminate = async () => {
    if (!id || !terminationDate) return;
    try {
      await terminateMutation.mutateAsync({
        id,
        data: {
          termination_date: terminationDate,
          termination_reason: terminationReason || undefined,
        },
      });
      toast({ title: "Empleado dado de baja correctamente" });
      setShowTerminateDialog(false);
    } catch (err: any) {
      toast({
        title: "Error al dar de baja",
        description: err?.message,
        variant: "destructive",
      });
    }
  };

  // --------------------------------------------------------------------------

  if (isLoading) return <DetailSkeleton />;

  if (isError || !employee) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg font-medium">Empleado no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/employees")}>
          Volver al listado
        </Button>
      </div>
    );
  }

  const isTerminated = employee.status === "terminated";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/employees")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{employee.fullName}</h1>
                <Badge variant={EMPLOYEE_STATUS_VARIANTS[employee.status]}>
                  {EMPLOYEE_STATUS_LABELS[employee.status]}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {employee.employeeNumber}
                {employee.position && ` · ${employee.position}`}
                {employee.department && ` · ${employee.department}`}
              </p>
            </div>
          </div>
        </div>

        {!isTerminated && (
          <div className="flex items-center gap-2">
            {canUpdate && (
              <Button
                variant="outline"
                onClick={() => navigate(`/employees/${id}/edit`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setShowTerminateDialog(true)}
              >
                <UserX className="h-4 w-4 mr-2" />
                Dar de baja
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="personal">
        <TabsList>
          <TabsTrigger value="personal">Datos personales</TabsTrigger>
          <TabsTrigger value="contact">Contacto</TabsTrigger>
          <TabsTrigger value="employment">Laboral</TabsTrigger>
          <TabsTrigger value="compensation">Compensación</TabsTrigger>
        </TabsList>

        {/* TAB: Personal */}
        <TabsContent value="personal" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Información personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nombre completo" value={employee.fullName} />
                <InfoRow
                  label="Fecha de nacimiento"
                  value={
                    employee.birthDate ? formatDate(employee.birthDate) : null
                  }
                />
                <InfoRow
                  label="Género"
                  value={
                    employee.gender ? GENDER_LABELS[employee.gender] : null
                  }
                />
                <InfoRow
                  label="Estado civil"
                  value={
                    employee.maritalStatus
                      ? MARITAL_STATUS_LABELS[employee.maritalStatus]
                      : null
                  }
                />
                <InfoRow label="Nacionalidad" value={employee.nationality} />
                <InfoRow
                  label="Lugar de nacimiento"
                  value={employee.birthPlace}
                />
                <InfoRow label="Tipo de sangre" value={employee.bloodType} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4" /> Datos fiscales / gobierno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="CURP" value={employee.curp} mono />
                <InfoRow label="RFC" value={employee.rfc} mono />
                <InfoRow label="NSS" value={employee.nss} mono />
                <InfoRow
                  label="Infonavit"
                  value={employee.infonavitNumber}
                  mono
                />
              </CardContent>
            </Card>
          </div>

          {employee.medicalNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Notas médicas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {employee.medicalNotes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Contact */}
        <TabsContent value="contact" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Datos de contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Email" value={employee.email} />
                <InfoRow label="Teléfono" value={employee.phone} />
                <InfoRow label="Celular" value={employee.mobilePhone} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Domicilio
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Calle"
                  value={
                    employee.street
                      ? `${employee.street} ${employee.exteriorNumber ?? ""}${employee.interiorNumber ? ` Int. ${employee.interiorNumber}` : ""}`.trim()
                      : null
                  }
                />
                <InfoRow label="Colonia" value={employee.neighborhood} />
                <InfoRow
                  label="Ciudad / Estado"
                  value={
                    [employee.city, employee.state]
                      .filter(Boolean)
                      .join(", ") || null
                  }
                />
                <InfoRow label="C.P." value={employee.postalCode} />
                <InfoRow label="País" value={employee.country} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Contacto de emergencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Nombre" value={employee.emergencyContactName} />
                <InfoRow
                  label="Teléfono"
                  value={employee.emergencyContactPhone}
                />
                <InfoRow
                  label="Parentesco"
                  value={employee.emergencyContactRelationship}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: Employment */}
        <TabsContent value="employment" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Información laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Tipo de contrato"
                  value={EMPLOYMENT_TYPE_LABELS[employee.employmentType]}
                />
                <InfoRow label="Departamento" value={employee.department} />
                <InfoRow label="Puesto" value={employee.position} />
                <InfoRow label="Título del trabajo" value={employee.jobTitle} />
                <InfoRow label="Ubicación" value={employee.workLocation} />
                <InfoRow
                  label="Fecha de ingreso"
                  value={formatDate(employee.hireDate)}
                />
                {employee.terminationDate && (
                  <InfoRow
                    label="Fecha de baja"
                    value={formatDate(employee.terminationDate)}
                  />
                )}
                {employee.terminationReason && (
                  <InfoRow
                    label="Motivo de baja"
                    value={employee.terminationReason}
                  />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Auditoría
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Registrado"
                  value={formatDateTime(employee.createdAt)}
                />
                <InfoRow
                  label="Última modificación"
                  value={formatDateTime(employee.updatedAt)}
                />
              </CardContent>
            </Card>
          </div>

          {employee.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {employee.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: Compensation */}
        <TabsContent value="compensation" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Compensación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow
                  label="Salario base"
                  value={
                    employee.baseSalary != null
                      ? new Intl.NumberFormat("es-MX", {
                          style: "currency",
                          currency: "MXN",
                        }).format(employee.baseSalary)
                      : null
                  }
                />
                <InfoRow
                  label="Frecuencia de pago"
                  value={
                    employee.salaryType
                      ? SALARY_TYPE_LABELS[employee.salaryType]
                      : null
                  }
                />
                <InfoRow
                  label="Método de pago"
                  value={
                    employee.paymentMethod
                      ? PAYMENT_METHOD_LABELS[employee.paymentMethod]
                      : null
                  }
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Datos bancarios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <InfoRow label="Banco" value={employee.bankName} />
                <InfoRow
                  label="No. de cuenta"
                  value={employee.bankAccountNumber}
                  mono
                />
                <InfoRow label="CLABE" value={employee.bankClabe} mono />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Terminate Dialog */}
      <Dialog open={showTerminateDialog} onOpenChange={setShowTerminateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dar de baja a {employee.fullName}</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El empleado quedará inactivo en
              el sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="termination_date">Fecha de baja *</Label>
              <Input
                id="termination_date"
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termination_reason">Motivo (opcional)</Label>
              <Textarea
                id="termination_reason"
                placeholder="Describe el motivo de la baja..."
                value={terminationReason}
                onChange={(e) => setTerminationReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowTerminateDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!terminationDate || terminateMutation.isPending}
              onClick={handleTerminate}
            >
              {terminateMutation.isPending ? "Procesando..." : "Confirmar baja"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="flex justify-between gap-4 py-1 border-b last:border-0">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span
        className={cn(
          "text-sm text-right",
          mono && "font-mono",
          !value && "text-muted-foreground italic",
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 bg-muted rounded-md" />
        <div className="h-14 w-14 bg-muted rounded-full" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
