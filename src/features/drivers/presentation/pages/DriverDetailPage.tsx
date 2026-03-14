/**
 * DriverDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página de detalle de un conductor.
 * Muestra información completa, estadísticas y viajes asociados.
 *
 * Ubicación: src/features/drivers/presentation/pages/DriverDetailPage.tsx
 */

import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Skeleton } from "@shared/ui/skeleton";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  CreditCard,
  Calendar,
  MapPin,
  Truck,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Heart,
  Users,
  TrendingUp,
  Route,
  Brain,
  FlaskConical,
  Cpu,
  Stethoscope,
  ClipboardCheck,
  XCircle,
  Clock,
} from "lucide-react";

// Application Layer
import { useDriver, useDriverTrips } from "../../application";

// Domain
import {
  LICENSE_TYPE_LABELS,
  PSYCHOMETRIC_RESULT_LABELS,
  PSYCHOMETRIC_RESULT_COLORS,
  DRUG_TEST_RESULT_LABELS,
  DRUG_TEST_RESULT_COLORS,
  type LicenseTypeValue,
} from "../../domain";

// Presentation
import {
  DriverStatusBadge,
  getLicenseExpirationVariant,
  formatDriverName,
} from "../config/driverStatusConfig";
import { DriverActions } from "../components/DriverActions";
import {
  formatDate,
  formatDateTime,
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-MX").format(num);
}

function getExpirationStatus(days: number | null): {
  variant: "default" | "secondary" | "destructive" | "outline";
  label: string;
} {
  if (days === null) return { variant: "secondary", label: "Sin fecha" };
  if (days <= 0) return { variant: "destructive", label: "Vencido" };
  if (days <= 30) return { variant: "outline", label: `${days} días` };
  return { variant: "default", label: "Vigente" };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  className?: string;
}

function InfoRow({ icon, label, value, className }: InfoRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <span className="text-muted-foreground shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
}

function StatCard({ title, value, icon, description }: StatCardProps) {
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ResultBadgeProps {
  result: string | null;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

function ResultBadge({ result, labels, colors }: ResultBadgeProps) {
  if (!result) return <span className="text-muted-foreground">—</span>;

  const label = labels[result] || result;
  const colorClass = colors[result] || "secondary";

  const variantMap: Record<
    string,
    "default" | "secondary" | "destructive" | "outline"
  > = {
    success: "default",
    warning: "outline",
    destructive: "destructive",
    secondary: "secondary",
  };

  return <Badge variant={variantMap[colorClass] || "secondary"}>{label}</Badge>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const driverId = id || "";

  // ══════════════════════════════════════════════════════════════════════════
  // QUERIES
  // ══════════════════════════════════════════════════════════════════════════

  const {
    data: driver,
    isLoading: isLoadingDriver,
    refetch: refetchDriver,
  } = useDriver(driverId);

  const { data: tripsData, isLoading: isLoadingTrips } = useDriverTrips(
    driverId,
    { page: 1, limit: 10 },
  );

  // ══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (isLoadingDriver) {
    return <DriverDetailSkeleton />;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // NOT FOUND STATE
  // ══════════════════════════════════════════════════════════════════════════

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <User className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Conductor no encontrado</h2>
        <p className="text-muted-foreground mb-4">
          El conductor que buscas no existe o fue eliminado.
        </p>
        <Button onClick={() => navigate("/drivers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Conductores
        </Button>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CALCULATED VALUES
  // ══════════════════════════════════════════════════════════════════════════

  const fullName = driver.employee
    ? formatDriverName(driver.employee)
    : "Conductor";

  const daysUntilLicenseExpiration = getDaysUntilDateString(
    driver.licenseExpiry,
  );
  const licenseVariant = getLicenseExpirationVariant(
    daysUntilLicenseExpiration,
  );
  const isLicenseExpired = daysUntilLicenseExpiration <= 0;
  const isLicenseExpiringSoon =
    daysUntilLicenseExpiration > 0 && daysUntilLicenseExpiration <= 30;

  const daysUntilMedicalExpiration = getDaysUntilDateString(
    driver.medicalCertificateExpiry,
  );
  const medicalStatus = getExpirationStatus(daysUntilMedicalExpiration);
  const isMedicalExpired =
    daysUntilMedicalExpiration !== null && daysUntilMedicalExpiration <= 0;
  const isMedicalExpiringSoon =
    daysUntilMedicalExpiration !== null &&
    daysUntilMedicalExpiration > 0 &&
    daysUntilMedicalExpiration <= 30;

  const stats = driver.stats || {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    averageRating: null,
    yearsOfExperience: driver.yearsOfExperience || 0,
  };

  const trips = tripsData?.data ?? [];

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <div className="space-y-6">
      {/* ================================================================== */}
      {/* HEADER                                                             */}
      {/* ================================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/drivers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{fullName}</h1>
              <p className="text-sm text-muted-foreground">
                {driver.employee?.employeeNumber || "Sin número de empleado"}
              </p>
            </div>
            <DriverStatusBadge status={driver.status} showIcon size="sm" />
          </div>
        </div>

        <DriverActions
          driverId={driver.id}
          driverName={fullName}
          status={driver.status}
          variant="buttons"
          onActionComplete={() => refetchDriver()}
        />
      </div>

      {/* ================================================================== */}
      {/* ALERTS: LICENSE/MEDICAL EXPIRING                                   */}
      {/* ================================================================== */}
      {(isLicenseExpired || isLicenseExpiringSoon) && (
        <Card
          className={cn(
            "border-l-4",
            isLicenseExpired
              ? "border-l-destructive bg-destructive/5"
              : "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
          )}
        >
          <CardContent className="flex items-center gap-3 py-3">
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                isLicenseExpired ? "text-destructive" : "text-amber-500",
              )}
            />
            <div>
              <p className="font-medium">
                {isLicenseExpired
                  ? "Licencia vencida"
                  : "Licencia próxima a vencer"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isLicenseExpired
                  ? `La licencia venció hace ${Math.abs(daysUntilLicenseExpiration)} días`
                  : `La licencia vence en ${daysUntilLicenseExpiration} días (${formatDate(driver.licenseExpiry)})`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {(isMedicalExpired || isMedicalExpiringSoon) && (
        <Card
          className={cn(
            "border-l-4",
            isMedicalExpired
              ? "border-l-destructive bg-destructive/5"
              : "border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
          )}
        >
          <CardContent className="flex items-center gap-3 py-3">
            <Stethoscope
              className={cn(
                "h-5 w-5",
                isMedicalExpired ? "text-destructive" : "text-amber-500",
              )}
            />
            <div>
              <p className="font-medium">
                {isMedicalExpired
                  ? "Certificado médico vencido"
                  : "Certificado médico próximo a vencer"}
              </p>
              <p className="text-sm text-muted-foreground">
                {isMedicalExpired
                  ? `El certificado venció hace ${Math.abs(daysUntilMedicalExpiration!)} días`
                  : `El certificado vence en ${daysUntilMedicalExpiration} días (${formatDate(driver.medicalCertificateExpiry)})`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================================================================== */}
      {/* STATS CARDS                                                        */}
      {/* ================================================================== */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Viajes Totales"
          value={formatNumber(stats.totalTrips)}
          icon={<Route className="h-5 w-5 text-primary" />}
        />
        <StatCard
          title="Viajes Completados"
          value={formatNumber(stats.completedTrips)}
          icon={<CheckCircle2 className="h-5 w-5 text-green-500" />}
          description={
            stats.totalTrips > 0
              ? `${Math.round((stats.completedTrips / stats.totalTrips) * 100)}% de éxito`
              : undefined
          }
        />
        <StatCard
          title="Viajes Cancelados"
          value={formatNumber(stats.cancelledTrips)}
          icon={<XCircle className="h-5 w-5 text-red-500" />}
        />
        <StatCard
          title="Años de Experiencia"
          value={stats.yearsOfExperience}
          icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
        />
      </div>

      {/* ================================================================== */}
      {/* TABS                                                               */}
      {/* ================================================================== */}
      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="license">Licencia</TabsTrigger>
          <TabsTrigger value="medical">Médico</TabsTrigger>
          <TabsTrigger value="exams">Exámenes</TabsTrigger>
          <TabsTrigger value="trips">
            Viajes{" "}
            {trips.length > 0 &&
              `(${tripsData?.pagination?.total || trips.length})`}
          </TabsTrigger>
          <TabsTrigger value="emergency">Emergencia</TabsTrigger>
        </TabsList>

        {/* TAB: INFORMACIÓN GENERAL */}
        <TabsContent value="info" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Datos Personales */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" /> Datos del Empleado
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<User className="h-4 w-4" />}
                  label="Nombre completo"
                  value={fullName}
                />
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Número de empleado"
                  value={driver.employee?.employeeNumber || "—"}
                />
                <InfoRow
                  icon={<Mail className="h-4 w-4" />}
                  label="Correo electrónico"
                  value={driver.employee?.email || "—"}
                />
                <InfoRow
                  icon={<Phone className="h-4 w-4" />}
                  label="Teléfono"
                  value={driver.employee?.phone || "—"}
                />
                {driver.employee?.curp && (
                  <InfoRow
                    icon={<FileText className="h-4 w-4" />}
                    label="CURP"
                    value={
                      <span className="font-mono text-xs">
                        {driver.employee.curp}
                      </span>
                    }
                  />
                )}
                {driver.employee?.rfc && (
                  <InfoRow
                    icon={<FileText className="h-4 w-4" />}
                    label="RFC"
                    value={
                      <span className="font-mono text-xs">
                        {driver.employee.rfc}
                      </span>
                    }
                  />
                )}
              </CardContent>
            </Card>

            {/* Dispositivo y Notas */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4" /> Dispositivo y Notas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Cpu className="h-4 w-4" />}
                  label="Dispositivo GPS asignado"
                  value={
                    driver.assignedDeviceId ? (
                      <span className="font-mono">
                        {driver.assignedDeviceId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        Sin dispositivo
                      </span>
                    )
                  }
                />
                {driver.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Notas</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {driver.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: LICENCIA */}
        <TabsContent value="license" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Información de Licencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Número de licencia"
                  value={
                    <span className="font-mono">{driver.licenseNumber}</span>
                  }
                />
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Tipo de licencia"
                  value={
                    LICENSE_TYPE_LABELS[
                      driver.licenseType as LicenseTypeValue
                    ] || driver.licenseType
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha de vencimiento"
                  value={
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          isLicenseExpired && "text-destructive",
                          isLicenseExpiringSoon && "text-amber-600",
                        )}
                      >
                        {formatDate(driver.licenseExpiry)}
                      </span>
                      <Badge variant={licenseVariant}>
                        {isLicenseExpired
                          ? "Vencida"
                          : isLicenseExpiringSoon
                            ? `${daysUntilLicenseExpiration} días`
                            : "Vigente"}
                      </Badge>
                    </div>
                  }
                />
                <InfoRow
                  icon={<MapPin className="h-4 w-4" />}
                  label="Estado emisor"
                  value={driver.licenseIssuingState || "No especificado"}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: CERTIFICADO MÉDICO */}
        <TabsContent value="medical" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Stethoscope className="h-4 w-4" /> Certificado Médico
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Número de certificado"
                  value={
                    driver.medicalCertificateNumber ? (
                      <span className="font-mono">
                        {driver.medicalCertificateNumber}
                      </span>
                    ) : (
                      "No registrado"
                    )
                  }
                />
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha de vencimiento"
                  value={
                    driver.medicalCertificateExpiry ? (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            isMedicalExpired && "text-destructive",
                            isMedicalExpiringSoon && "text-amber-600",
                          )}
                        >
                          {formatDate(driver.medicalCertificateExpiry)}
                        </span>
                        <Badge variant={medicalStatus.variant}>
                          {medicalStatus.label}
                        </Badge>
                      </div>
                    ) : (
                      "No registrado"
                    )
                  }
                />
                <InfoRow
                  icon={<Stethoscope className="h-4 w-4" />}
                  label="Institución emisora"
                  value={driver.medicalCertificateIssuer || "No especificada"}
                />
                <InfoRow
                  icon={<Heart className="h-4 w-4" />}
                  label="Tipo de sangre"
                  value={driver.bloodType || "No registrado"}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: EXÁMENES */}
        <TabsContent value="exams" className="space-y-4 mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Examen Psicométrico */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4" /> Examen Psicométrico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha del examen"
                  value={formatDate(driver.psychometricTestDate)}
                />
                <InfoRow
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  label="Resultado"
                  value={
                    <ResultBadge
                      result={driver.psychometricTestResult}
                      labels={PSYCHOMETRIC_RESULT_LABELS}
                      colors={PSYCHOMETRIC_RESULT_COLORS}
                    />
                  }
                />
              </CardContent>
            </Card>

            {/* Examen Antidoping */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Examen Antidoping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Calendar className="h-4 w-4" />}
                  label="Fecha del último examen"
                  value={formatDate(driver.lastDrugTestDate)}
                />
                <InfoRow
                  icon={<ClipboardCheck className="h-4 w-4" />}
                  label="Resultado"
                  value={
                    <ResultBadge
                      result={driver.drugTestResult}
                      labels={DRUG_TEST_RESULT_LABELS}
                      colors={DRUG_TEST_RESULT_COLORS}
                    />
                  }
                />
                {driver.lastDrugTestDate && (
                  <InfoRow
                    icon={<Clock className="h-4 w-4" />}
                    label="Vigencia estimada"
                    value={(() => {
                      const expiryDate = getExpiryDateString(
                        driver.lastDrugTestDate,
                        180, // 6 meses de vigencia para el examen antidoping
                      );
                      const daysRemaining = getDaysUntilDateString(expiryDate);

                      if (daysRemaining === null) return "—";
                      if (daysRemaining <= 0)
                        return (
                          <span className="text-destructive">
                            Examen vencido
                          </span>
                        );
                      if (daysRemaining <= 30)
                        return (
                          <span className="text-amber-600">
                            {daysRemaining} días restantes
                          </span>
                        );
                      return `${daysRemaining} días restantes`;
                    })()}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB: VIAJES */}
        <TabsContent value="trips" className="space-y-4 mt-4">
          {isLoadingTrips ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : trips.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Este conductor no tiene viajes registrados.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Historial de Viajes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {trips.map((trip) => (
                    <div
                      key={trip.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => navigate(`/trips/${trip.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Truck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium font-mono">
                            {trip.tripCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {trip.originCity} → {trip.destinationCity}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{trip.status}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDate(
                            trip.scheduledDeparture.toISOString().split("T")[0],
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {tripsData?.pagination &&
                  tripsData.pagination.total > trips.length && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/drivers/${driverId}/trips`)}
                      >
                        Ver todos los viajes ({tripsData.pagination.total})
                      </Button>
                    </div>
                  )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* TAB: CONTACTO DE EMERGENCIA */}
        <TabsContent value="emergency" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" /> Contacto de Emergencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {driver.emergencyContactName ? (
                <>
                  <InfoRow
                    icon={<User className="h-4 w-4" />}
                    label="Nombre"
                    value={driver.emergencyContactName}
                  />
                  <InfoRow
                    icon={<Phone className="h-4 w-4" />}
                    label="Teléfono"
                    value={driver.emergencyContactPhone || "—"}
                  />
                  <InfoRow
                    icon={<Users className="h-4 w-4" />}
                    label="Parentesco"
                    value={driver.emergencyContactRelationship || "—"}
                  />
                </>
              ) : (
                <div className="py-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">
                    No se ha registrado un contacto de emergencia.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Esta información proviene del perfil del empleado.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* METADATA                                                           */}
      {/* ================================================================== */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span>
              Creado: {formatDateTime(driver.createdAt.toISOString())}
            </span>
            <span>
              Actualizado: {formatDateTime(driver.updatedAt.toISOString())}
            </span>
            {driver.createdBy && <span>Por: {driver.createdBy}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================================
// SKELETON
// ============================================================================

function DriverDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="pt-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full max-w-xl" />

      {/* Content */}
      <div className="grid gap-4 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DriverDetailPage;
