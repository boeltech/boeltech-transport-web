/**
 * DriverDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Página de detalle de un conductor.
 * Tabs: Información, Licencia, Salud y Exámenes (médico + psico/antidoping), Viajes, Emergencia.
 *
 * Ubicación: src/features/drivers/presentation/pages/DriverDetailPage.tsx
 */

import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import {
  DetailAlertCard,
  DetailSection,
  DetailTimeline,
  InfoRow,
  type DetailAlertCardItem,
} from "@shared/ui/data-display";
import {
  User,
  CreditCard,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingUp,
  Route,
  Brain,
  FlaskConical,
  Cpu,
  Stethoscope,
  ClipboardCheck,
  XCircle,
} from "lucide-react";

// Application Layer
import { useDriver, useDriverTrips } from "../../application";

import { TripStatus, TRIP_STATUS_LABELS } from "@features/trips";

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
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";
import { employeePrimaryContactDisplay } from "../helpers/employeePrimaryContactDisplay";

// ============================================================================
// HELPERS
// ============================================================================

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-MX").format(num);
}

function getExpirationStatus(days: number | null): {
  variant: "default" | "secondary" | "destructive" | "warning";
  tone?: "soft";
  label: string;
} {
  if (days === null) return { variant: "secondary", label: "Sin fecha" };
  if (days <= 0) return { variant: "destructive", tone: "soft", label: "Vencido" };
  if (days <= 30) return { variant: "warning", tone: "soft", label: `${days} días` };
  return { variant: "default", label: "Vigente" };
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

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
    "default" | "secondary" | "destructive" | "warning" | "success"
  > = {
    success: "success",
    warning: "warning",
    destructive: "destructive",
    secondary: "secondary",
  };

  const variant = variantMap[colorClass] || "secondary";
  const tone =
    variant === "success" || variant === "warning" || variant === "destructive"
      ? "soft"
      : undefined;

  return (
    <Badge variant={variant} tone={tone}>
      {label}
    </Badge>
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

  const {
    data: tripsData,
    isLoading: isLoadingTrips,
    isError: isTripsError,
  } = useDriverTrips(driverId, { page: 1, limit: 10 });

  const trips = useMemo(
    () => tripsData?.data ?? [],
    [tripsData?.data],
  );

  const tripTimelineItems = useMemo(
    () =>
      trips.map((trip) => ({
        id: trip.id,
        icon: <Truck className="h-4 w-4" />,
        completed: trip.status === TripStatus.COMPLETED,
        dotSize: "sm" as const,
        content: (
          <div
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                navigate(`/trips/${trip.id}`);
              }
            }}
            onClick={() => navigate(`/trips/${trip.id}`)}
            className="flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-mono font-medium">{trip.tripCode}</p>
                <p className="text-sm text-muted-foreground">
                  {trip.originCity} → {trip.destinationCity}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="outline">
                {TRIP_STATUS_LABELS[trip.status] ?? trip.status}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">
                {formatDate(
                  trip.scheduledDeparture.toISOString().split("T")[0],
                )}
              </p>
            </div>
          </div>
        ),
      })),
    [trips, navigate],
  );

  if (!driver) {
    return (
      <DetailPageShell
        isLoading={isLoadingDriver}
        notFound
        notFoundConfig={{
          icon: <User />,
          title: "Conductor no encontrado",
          description: "El conductor que buscas no existe o fue eliminado.",
          backHref: "/drivers",
          backLabel: "Volver a Conductores",
        }}
        header={{
          backHref: "/drivers",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: "Conductor",
        }}
      />
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
  const licenseBadgeProps =
    licenseVariant === "warning"
      ? { variant: "warning" as const, tone: "soft" as const }
      : licenseVariant === "destructive"
        ? { variant: "destructive" as const, tone: "soft" as const }
        : licenseVariant === "secondary"
          ? { variant: "secondary" as const }
          : { variant: "default" as const };
  const isLicenseExpired =
    daysUntilLicenseExpiration !== null && daysUntilLicenseExpiration <= 0;
  const isLicenseExpiringSoon =
    daysUntilLicenseExpiration !== null &&
    daysUntilLicenseExpiration > 0 &&
    daysUntilLicenseExpiration <= 30;

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

  const drugEstimatedExpiry = driver.lastDrugTestDate
    ? getExpiryDateString(driver.lastDrugTestDate, 180)
    : null;
  const daysUntilDrugEstimatedExpiry = drugEstimatedExpiry
    ? getDaysUntilDateString(drugEstimatedExpiry)
    : null;
  const isDrugEstimatedExpired =
    daysUntilDrugEstimatedExpiry !== null &&
    daysUntilDrugEstimatedExpiry <= 0;
  const isDrugEstimatedExpiringSoon =
    daysUntilDrugEstimatedExpiry !== null &&
    daysUntilDrugEstimatedExpiry > 0 &&
    daysUntilDrugEstimatedExpiry <= 30;

  const hasDriverAlerts =
    isLicenseExpired ||
    isLicenseExpiringSoon ||
    isMedicalExpired ||
    isMedicalExpiringSoon ||
    isDrugEstimatedExpired ||
    isDrugEstimatedExpiringSoon;

  const licenseMedicalAlertItems: DetailAlertCardItem[] = [];
  if (isLicenseExpired || isLicenseExpiringSoon) {
    licenseMedicalAlertItems.push({
      label: "Licencia",
      text: isLicenseExpired
        ? `Vencida hace ${Math.abs(daysUntilLicenseExpiration!)} días (${formatDate(driver.licenseExpiry)})`
        : `Vence en ${daysUntilLicenseExpiration} días (${formatDate(driver.licenseExpiry)})`,
    });
  }
  if (isMedicalExpired || isMedicalExpiringSoon) {
    licenseMedicalAlertItems.push({
      label: "Certificado médico",
      text: isMedicalExpired
        ? `Vencido hace ${Math.abs(daysUntilMedicalExpiration!)} días (${formatDate(driver.medicalCertificateExpiry)})`
        : `Vence en ${daysUntilMedicalExpiration} días (${formatDate(driver.medicalCertificateExpiry)})`,
    });
  }

  const licenseMedicalAlertSeverity: "critical" | "warning" =
    isLicenseExpired || isMedicalExpired ? "critical" : "warning";

  let licenseMedicalAlertTitle: string;
  if (licenseMedicalAlertItems.length === 2) {
    if (isLicenseExpired && isMedicalExpired) {
      licenseMedicalAlertTitle = "Licencia y certificado médico vencidos";
    } else if (isLicenseExpired || isMedicalExpired) {
      licenseMedicalAlertTitle = "Revisar documentación del conductor";
    } else {
      licenseMedicalAlertTitle = "Licencia y certificado médico próximos a vencer";
    }
  } else if (isLicenseExpired || isLicenseExpiringSoon) {
    licenseMedicalAlertTitle = isLicenseExpired
      ? "Licencia vencida"
      : "Licencia próxima a vencer";
  } else {
    licenseMedicalAlertTitle = isMedicalExpired
      ? "Certificado médico vencido"
      : "Certificado médico próximo a vencer";
  }

  const stats = driver.stats || {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    averageRating: null,
    yearsOfExperience: driver.yearsOfExperience || 0,
  };

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════

  return (
    <DetailPageShell
      isLoading={isLoadingDriver}
      header={{
        backHref: "/drivers",
        icon: <User className="h-6 w-6" />,
        iconShape: "circle",
        title: fullName,
        subtitle: driver.employee?.employeeNumber || "Sin número de empleado",
        statusBadge: <DriverStatusBadge status={driver.status} showIcon size="sm" />,
        actions: (
          <DriverActions
            driverId={driver.id}
            driverName={fullName}
            status={driver.status}
            variant="buttons"
            onActionComplete={refetchDriver}
          />
        ),
      }}
      alerts={
        hasDriverAlerts ? (
        <div className="space-y-3">
          {licenseMedicalAlertItems.length > 0 ? (
            <DetailAlertCard
              severity={licenseMedicalAlertSeverity}
              icon={<ClipboardCheck className="h-5 w-5" />}
              title={licenseMedicalAlertTitle}
              items={licenseMedicalAlertItems}
            />
          ) : null}

          {driver.lastDrugTestDate &&
          (isDrugEstimatedExpired || isDrugEstimatedExpiringSoon) ? (
            <DetailAlertCard
              severity={
                isDrugEstimatedExpired ? "critical" : "warning"
              }
              icon={
                <FlaskConical
                  className={cn(
                    "h-5 w-5",
                    isDrugEstimatedExpired
                      ? "text-destructive"
                      : "text-warning",
                  )}
                />
              }
              title={
                isDrugEstimatedExpired
                  ? "Vigencia estimada del antidoping vencida"
                  : "Antidoping próximo a vencer (180 días)"
              }
              items={[
                {
                  text: isDrugEstimatedExpired
                    ? `Desde el último examen (${formatDate(driver.lastDrugTestDate)}) la vigencia estimada venció hace ${Math.abs(daysUntilDrugEstimatedExpiry!)} días.`
                    : `Quedan ${daysUntilDrugEstimatedExpiry} días antes de superar el periodo de 180 días desde el último examen (${formatDate(driver.lastDrugTestDate)}).`,
                },
              ]}
            />
          ) : null}
        </div>
        ) : undefined
      }
      stats={[
        {
          title: "Viajes Totales",
          value: formatNumber(stats.totalTrips),
          tone: "primary",
          icon: <Route className="h-5 w-5" />,
        },
        {
          title: "Viajes Completados",
          value: formatNumber(stats.completedTrips),
          tone: "success",
          icon: <CheckCircle2 className="h-5 w-5" />,
          description:
            stats.totalTrips > 0
              ? `${Math.round((stats.completedTrips / stats.totalTrips) * 100)}% de éxito`
              : undefined,
        },
        {
          title: "Viajes Cancelados",
          value: formatNumber(stats.cancelledTrips),
          tone: "destructive",
          icon: <XCircle className="h-5 w-5" />,
        },
        {
          title: "Años de Experiencia",
          value: stats.yearsOfExperience,
          tone: "info",
          icon: <TrendingUp className="h-5 w-5" />,
        },
      ]}
      metadata={{
        createdAt: driver.createdAt,
        updatedAt: driver.updatedAt,
        createdBy:
          driver.createdByName?.trim() || driver.createdBy?.trim() || undefined,
        updatedBy: driver.updatedByName?.trim() || undefined,
      }}
      tabs={{
        defaultValue: "info",
        items: [
          {
            value: "info",
            label: "Información",
            content: (
              <div className="space-y-6">
                <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
                  <DetailSection
                    className="flex h-full min-h-0 flex-col"
                    icon={<User className="h-4 w-4" />}
                    title="Datos del empleado"
                  >
                    <Card className="flex flex-1 flex-col">
                      <CardContent className="flex flex-1 flex-col pt-0">
                        <InfoRow variant="inline" label="Nombre completo" value={fullName} />
                        <InfoRow
                          variant="inline"
                          label="Número de empleado"
                          value={driver.employee?.employeeNumber ?? "—"}
                        />
                        <InfoRow
                          variant="inline"
                          label="Correo electrónico"
                          value={driver.employee?.email ?? "—"}
                        />
                        <InfoRow
                          variant="inline"
                          label="Teléfono"
                          value={
                            employeePrimaryContactDisplay(
                              driver.employee,
                            ) ?? "—"
                          }
                        />
                        {driver.employee?.curp ? (
                          <InfoRow
                            variant="inline"
                            label="CURP"
                            value={driver.employee.curp}
                            mono
                            copyable
                          />
                        ) : null}
                        {driver.employee?.rfc ? (
                          <InfoRow
                            variant="inline"
                            label="RFC"
                            value={driver.employee.rfc}
                            mono
                            copyable
                          />
                        ) : null}
                      </CardContent>
                    </Card>
                  </DetailSection>

                  <DetailSection
                    className="flex h-full min-h-0 flex-col"
                    icon={<Cpu className="h-4 w-4" />}
                    title="Dispositivo y notas"
                  >
                    <Card className="flex flex-1 flex-col">
                      <CardContent className="flex flex-1 flex-col pt-0">
                        <InfoRow
                          variant="inline"
                          label="Dispositivo GPS asignado"
                          value={
                            driver.assignedDeviceId ? (
                              <span className="font-mono">{driver.assignedDeviceId}</span>
                            ) : (
                              <span className="text-muted-foreground">Sin dispositivo</span>
                            )
                          }
                        />
                        <InfoRow
                          variant="inline"
                          label="Notas"
                          value={
                            driver.notes?.trim() ? (
                              <span className="whitespace-pre-wrap text-sm">
                                {driver.notes}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Sin notas</span>
                            )
                          }
                        />
                      </CardContent>
                    </Card>
                  </DetailSection>
                </div>
              </div>
            ),
          },
          {
            value: "license",
            label: "Licencia",
            content: (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CreditCard className="h-4 w-4" /> Información de licencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <InfoRow
                      variant="inline"
                      label="Número de licencia"
                      value={<span className="font-mono">{driver.licenseNumber}</span>}
                    />
                    <InfoRow
                      variant="inline"
                      label="Tipo de licencia"
                      value={
                        LICENSE_TYPE_LABELS[
                          driver.licenseType as LicenseTypeValue
                        ] || driver.licenseType
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label="Fecha de vencimiento"
                      value={
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span
                            className={cn(
                              isLicenseExpired && "text-destructive",
                              isLicenseExpiringSoon && "text-warning",
                            )}
                          >
                            {formatDate(driver.licenseExpiry)}
                          </span>
                          <Badge {...licenseBadgeProps}>
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
                      variant="inline"
                      label="Estado emisor"
                      value={driver.licenseIssuingState || "No especificado"}
                    />
                  </div>
                </CardContent>
              </Card>
            ),
          },
          {
            value: "health",
            label: "Salud y Exámenes",
            content: (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Stethoscope className="h-4 w-4" /> Certificado médico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <InfoRow
                        variant="inline"
                        label="Número de certificado"
                        value={
                          driver.medicalCertificateNumber ? (
                            <span className="font-mono">{driver.medicalCertificateNumber}</span>
                          ) : (
                            "No registrado"
                          )
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label="Fecha de vencimiento"
                        value={
                          driver.medicalCertificateExpiry ? (
                            <div className="flex flex-wrap items-center justify-end gap-2">
                              <span
                                className={cn(
                                  isMedicalExpired && "text-destructive",
                                  isMedicalExpiringSoon && "text-warning",
                                )}
                              >
                                {formatDate(driver.medicalCertificateExpiry)}
                              </span>
                              <Badge
                                variant={medicalStatus.variant}
                                tone={medicalStatus.tone}
                              >
                                {medicalStatus.label}
                              </Badge>
                            </div>
                          ) : (
                            "No registrado"
                          )
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label="Institución emisora"
                        value={driver.medicalCertificateIssuer || "No especificada"}
                      />
                      <InfoRow
                        variant="inline"
                        label="Tipo de sangre"
                        value={driver.bloodType || "No registrado"}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Brain className="h-4 w-4" /> Examen psicométrico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow
                        variant="inline"
                        label="Fecha del examen"
                        value={formatDate(driver.psychometricTestDate)}
                      />
                      <InfoRow
                        variant="inline"
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

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <FlaskConical className="h-4 w-4" /> Examen antidoping
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <InfoRow
                        variant="inline"
                        label="Fecha del último examen"
                        value={formatDate(driver.lastDrugTestDate)}
                      />
                      <InfoRow
                        variant="inline"
                        label="Resultado"
                        value={
                          <ResultBadge
                            result={driver.drugTestResult}
                            labels={DRUG_TEST_RESULT_LABELS}
                            colors={DRUG_TEST_RESULT_COLORS}
                          />
                        }
                      />
                      {driver.lastDrugTestDate ? (
                        <InfoRow
                          variant="inline"
                          label="Vigencia estimada"
                          value={(() => {
                            const expiryDate = getExpiryDateString(
                              driver.lastDrugTestDate,
                              180,
                            );
                            const daysRemaining = getDaysUntilDateString(expiryDate);

                            if (daysRemaining === null) return "—";
                            if (daysRemaining <= 0)
                              return (
                                <span className="text-destructive">Examen vencido</span>
                              );
                            if (daysRemaining <= 30)
                              return (
                                <span className="text-warning">
                                  {daysRemaining} días restantes
                                </span>
                              );
                            return `${daysRemaining} días restantes`;
                          })()}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>
              </div>
            ),
          },
          {
            value: "trips",
            label: (
              <span>
                Viajes
                {trips.length > 0
                  ? ` (${tripsData?.pagination?.total || trips.length})`
                  : ""}
              </span>
            ),
            content: isLoadingTrips ? (
            <Card>
              <CardContent className="py-8">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : isTripsError ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 mx-auto text-destructive/70 mb-4" />
                <p className="text-muted-foreground">
                  No se pudo cargar el historial de viajes. Intenta de nuevo más
                  tarde.
                </p>
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
                <DetailTimeline items={tripTimelineItems} />

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
            ),
          },
          {
            value: "emergency",
            label: "Emergencia",
            content: (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-4 w-4" /> Contacto de emergencia
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {driver.emergencyContactName ? (
                    <>
                      <InfoRow variant="inline" label="Nombre" value={driver.emergencyContactName} />
                      <InfoRow
                        variant="inline"
                        label="Teléfono"
                        value={
                          driver.emergencyContactPhone ? (
                            <a
                              href={`tel:${driver.emergencyContactPhone}`}
                              className="text-primary hover:underline"
                            >
                              {driver.emergencyContactPhone}
                            </a>
                          ) : (
                            "—"
                          )
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label="Parentesco"
                        value={driver.emergencyContactRelationship ?? "—"}
                      />
                    </>
                  ) : (
                    <div className="py-8 text-center">
                      <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        No se ha registrado un contacto de emergencia.
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Esta información proviene del perfil del empleado.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ),
          },
        ],
      }}
    />
  );
}

export default DriverDetailPage;
