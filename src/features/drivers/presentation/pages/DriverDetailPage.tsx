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
  Gauge,
} from "lucide-react";

// Application Layer
import { useDriver, useDriverTrips } from "../../application";

// Domain
import { LICENSE_TYPE_LABELS, type LicenseTypeValue } from "../../domain";

// Presentation
import {
  DriverStatusBadge,
  getDaysUntilLicenseExpiration,
  getLicenseExpirationVariant,
  formatDriverName,
} from "../config/driverStatusConfig";
import { DriverActions } from "../components/DriverActions";

// ============================================================================
// HELPERS
// ============================================================================

function formatDate(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// function formatCurrency(amount: number): string {
//   return new Intl.NumberFormat("es-MX", {
//     style: "currency",
//     currency: "MXN",
//   }).format(amount);
// }

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-MX").format(num);
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
  trend?: "up" | "down" | "neutral";
}

function StatCard({ title, value, icon, description, trend }: StatCardProps) {
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

  const daysUntilExpiration = getDaysUntilLicenseExpiration(
    driver.licenseExpiration,
  );
  const licenseVariant = getLicenseExpirationVariant(daysUntilExpiration);
  const isLicenseExpired = daysUntilExpiration <= 0;
  const isLicenseExpiringSoon =
    daysUntilExpiration > 0 && daysUntilExpiration <= 30;

  const stats = driver.stats || {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    totalKilometers: 0,
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
      {/* ALERT: LICENSE EXPIRING/EXPIRED                                    */}
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
                  ? `La licencia venció hace ${Math.abs(daysUntilExpiration)} días`
                  : `La licencia vence en ${daysUntilExpiration} días (${formatDate(driver.licenseExpiration)})`}
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
          title="Kilómetros Recorridos"
          value={`${formatNumber(stats.totalKilometers)} km`}
          icon={<Gauge className="h-5 w-5 text-blue-500" />}
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
                  <User className="h-4 w-4" /> Datos Personales
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
              </CardContent>
            </Card>

            {/* Información Médica */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Información Médica
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow
                  icon={<Heart className="h-4 w-4" />}
                  label="Tipo de sangre"
                  value={driver.bloodType || "No registrado"}
                />
                <InfoRow
                  icon={<FileText className="h-4 w-4" />}
                  label="Certificado médico"
                  value={
                    driver.medicalCertificateExpiration ? (
                      <span
                        className={cn(
                          new Date(driver.medicalCertificateExpiration) <
                            new Date() && "text-destructive",
                        )}
                      >
                        Vence: {formatDate(driver.medicalCertificateExpiration)}
                      </span>
                    ) : (
                      "No registrado"
                    )
                  }
                />
              </CardContent>
            </Card>
          </div>

          {/* Notas */}
          {driver.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Notas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {driver.notes}
                </p>
              </CardContent>
            </Card>
          )}
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
                  label="Fecha de emisión"
                  value={formatDate(driver.licenseIssuedDate)}
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
                        {formatDate(driver.licenseExpiration)}
                      </span>
                      <Badge variant={licenseVariant}>
                        {isLicenseExpired
                          ? "Vencida"
                          : isLicenseExpiringSoon
                            ? `${daysUntilExpiration} días`
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
                          {formatDate(trip.scheduledDeparture)}
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate(`/drivers/${driverId}/edit`)}
                  >
                    Agregar contacto
                  </Button>
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
            <span>Creado: {formatDateTime(driver.createdAt)}</span>
            <span>Actualizado: {formatDateTime(driver.updatedAt)}</span>
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
      <Skeleton className="h-10 w-96" />

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
