/**
 * DriverDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de conductor: resumen, licencia, salud, viajes y emergencia.
 */

import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { Badge } from "@shared/ui/badge";
import { Button } from "@shared/ui/button";
import {
  Card,
  CardContent,
} from "@shared/ui/card";
import { Skeleton } from "@shared/ui/skeleton";
import { Separator } from "@shared/ui/separator";
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
import { useDriver, useDriverTrips } from "../../application";
import { TripStatus, TRIP_STATUS_LABELS } from "@features/trips";
import {
  LICENSE_TYPE_LABELS,
  PSYCHOMETRIC_RESULT_LABELS,
  PSYCHOMETRIC_RESULT_COLORS,
  DRUG_TEST_RESULT_LABELS,
  DRUG_TEST_RESULT_COLORS,
  type LicenseTypeValue,
} from "../../domain";
import {
  DriverStatusBadge,
  getLicenseExpirationVariant,
  formatDriverName,
} from "../config/driverStatusConfig";
import { DriverActions } from "../components/DriverActions";
import { DriverDetailHeaderSubtitle } from "../components/DriverDetailHeaderSubtitle";
import {
  driversCopy,
  resolveLicenseMedicalAlertTitle,
} from "../copy";
import {
  formatDate,
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";
import { employeePrimaryContactDisplay } from "../helpers/employeePrimaryContactDisplay";

const copy = driversCopy.detail;

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-MX").format(num);
}

function getExpirationStatus(days: number | null): {
  variant: "default" | "secondary" | "destructive" | "warning";
  tone?: "soft";
  label: string;
} {
  if (days === null) {
    return { variant: "secondary", label: copy.vigency.noDate };
  }
  if (days <= 0) {
    return {
      variant: "destructive",
      tone: "soft",
      label: copy.vigency.expired,
    };
  }
  if (days <= 30) {
    return {
      variant: "warning",
      tone: "soft",
      label: copy.vigency.daysRemaining(days),
    };
  }
  return { variant: "default", label: copy.vigency.valid };
}

interface ResultBadgeProps {
  result: string | null;
  labels: Record<string, string>;
  colors: Record<string, string>;
}

function ResultBadge({ result, labels, colors }: ResultBadgeProps) {
  if (!result) {
    return <span className="text-muted-foreground">{copy.hint.empty}</span>;
  }

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

function formatDrugEstimatedExpiry(lastDrugTestDate: string | null): string {
  if (!lastDrugTestDate) return copy.hint.empty;

  const expiryDate = getExpiryDateString(lastDrugTestDate, 180);
  const daysRemaining = getDaysUntilDateString(expiryDate);

  if (daysRemaining === null) return copy.hint.empty;
  if (daysRemaining <= 0) {
    return copy.vigency.drugExpired;
  }
  if (daysRemaining <= 30) {
    return copy.vigency.daysRemainingLong(daysRemaining);
  }
  return copy.vigency.daysRemainingLong(daysRemaining);
}

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const driverId = id || "";

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

  const trips = useMemo(() => tripsData?.data ?? [], [tripsData?.data]);

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
          title: copy.state.notFoundTitle,
          description: copy.state.notFoundDescription,
          backHref: "/drivers",
          backLabel: copy.state.backToList,
        }}
        header={{
          backHref: "/drivers",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: copy.title.fallback,
        }}
      />
    );
  }

  const fullName = driver.employee
    ? formatDriverName(driver.employee)
    : copy.title.fallback;

  const licenseTypeLabel =
    LICENSE_TYPE_LABELS[driver.licenseType as LicenseTypeValue] ||
    driver.licenseType;

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
      label: copy.alert.licenseLabel,
      text: isLicenseExpired
        ? copy.alert.licenseExpiredText(
            Math.abs(daysUntilLicenseExpiration!),
            formatDate(driver.licenseExpiry),
          )
        : copy.alert.licenseExpiringText(
            daysUntilLicenseExpiration!,
            formatDate(driver.licenseExpiry),
          ),
    });
  }
  if (isMedicalExpired || isMedicalExpiringSoon) {
    licenseMedicalAlertItems.push({
      label: copy.alert.medicalLabel,
      text: isMedicalExpired
        ? copy.alert.medicalExpiredText(
            Math.abs(daysUntilMedicalExpiration!),
            formatDate(driver.medicalCertificateExpiry!),
          )
        : copy.alert.medicalExpiringText(
            daysUntilMedicalExpiration!,
            formatDate(driver.medicalCertificateExpiry!),
          ),
    });
  }

  const licenseMedicalAlertSeverity: "critical" | "warning" =
    isLicenseExpired || isMedicalExpired ? "critical" : "warning";

  const licenseMedicalAlertTitle = resolveLicenseMedicalAlertTitle({
    hasLicenseItem: isLicenseExpired || isLicenseExpiringSoon,
    hasMedicalItem: isMedicalExpired || isMedicalExpiringSoon,
    isLicenseExpired,
    isMedicalExpired,
  });

  const stats = driver.stats || {
    totalTrips: 0,
    completedTrips: 0,
    cancelledTrips: 0,
    averageRating: null,
    yearsOfExperience: driver.yearsOfExperience || 0,
  };

  const tripsTotal = tripsData?.pagination?.total ?? trips.length;

  return (
    <DetailPageShell
      isLoading={isLoadingDriver}
      header={{
        backHref: "/drivers",
        icon: <User className="h-6 w-6" />,
        iconShape: "circle",
        title: fullName,
        subtitle: (
          <DriverDetailHeaderSubtitle
            employeeNumber={driver.employee?.employeeNumber ?? null}
            licenseTypeLabel={licenseTypeLabel}
            licenseNumber={driver.licenseNumber}
          />
        ),
        statusBadge: (
          <DriverStatusBadge status={driver.status} showIcon size="sm" />
        ),
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
                severity={isDrugEstimatedExpired ? "critical" : "warning"}
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
                    ? copy.alert.drug.expiredTitle
                    : copy.alert.drug.expiringTitle
                }
                items={[
                  {
                    text: isDrugEstimatedExpired
                      ? copy.alert.drug.expiredBody(
                          formatDate(driver.lastDrugTestDate),
                          Math.abs(daysUntilDrugEstimatedExpiry!),
                        )
                      : copy.alert.drug.expiringBody(
                          formatDate(driver.lastDrugTestDate),
                          daysUntilDrugEstimatedExpiry!,
                        ),
                  },
                ]}
              />
            ) : null}
          </div>
        ) : undefined
      }
      stats={[
        {
          title: copy.stat.totalTrips.title,
          value: formatNumber(stats.totalTrips),
          tone: "primary",
          icon: <Route className="h-5 w-5" />,
          description: copy.stat.totalTrips.description,
        },
        {
          title: copy.stat.completedTrips.title,
          value: formatNumber(stats.completedTrips),
          tone: "success",
          icon: <CheckCircle2 className="h-5 w-5" />,
          description:
            stats.totalTrips > 0
              ? copy.stat.completedTrips.successRate(
                  Math.round((stats.completedTrips / stats.totalTrips) * 100),
                )
              : undefined,
        },
        {
          title: copy.stat.cancelledTrips.title,
          value: formatNumber(stats.cancelledTrips),
          tone: "destructive",
          icon: <XCircle className="h-5 w-5" />,
          description: copy.stat.cancelledTrips.description,
        },
        {
          title: copy.stat.experience.title,
          value: copy.stat.experience.value(stats.yearsOfExperience),
          tone: "info",
          icon: <TrendingUp className="h-5 w-5" />,
          description: copy.stat.experience.description,
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
        defaultValue: "summary",
        items: [
          {
            value: "summary",
            label: copy.tab.summary,
            content: (
              <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-2">
                <DetailSection
                  className="flex h-full min-h-0 flex-col"
                  icon={<User className="h-4 w-4" />}
                  title={copy.section.employee.title}
                  description={copy.section.employee.description}
                >
                  <Card className="flex flex-1 flex-col">
                    <CardContent className="flex flex-1 flex-col space-y-4 pt-6">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {copy.section.employee.groupContact}
                        </p>
                        <InfoRow
                          variant="inline"
                          label={copy.label.employeeNumber}
                          value={
                            driver.employee?.employeeNumber ?? copy.hint.empty
                          }
                          copyable={Boolean(driver.employee?.employeeNumber)}
                          copyValue={driver.employee?.employeeNumber}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.email}
                          value={driver.employee?.email ?? copy.hint.empty}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.phone}
                          value={
                            employeePrimaryContactDisplay(driver.employee) ??
                            copy.hint.empty
                          }
                        />
                      </div>

                      {driver.employee?.curp || driver.employee?.rfc ? (
                        <>
                          <Separator />
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {copy.section.employee.groupFiscal}
                            </p>
                            {driver.employee?.curp ? (
                              <InfoRow
                                variant="inline"
                                label={copy.label.curp}
                                value={driver.employee.curp}
                                mono
                                copyable
                              />
                            ) : null}
                            {driver.employee?.rfc ? (
                              <InfoRow
                                variant="inline"
                                label={copy.label.rfc}
                                value={driver.employee.rfc}
                                mono
                                copyable
                              />
                            ) : null}
                          </div>
                        </>
                      ) : null}
                    </CardContent>
                  </Card>
                </DetailSection>

                <DetailSection
                  className="flex h-full min-h-0 flex-col"
                  icon={<Cpu className="h-4 w-4" />}
                  title={copy.section.operation.title}
                  description={copy.section.operation.description}
                >
                  <Card className="flex flex-1 flex-col">
                    <CardContent className="flex flex-1 flex-col pt-6">
                      <InfoRow
                        variant="inline"
                        label={copy.label.gpsDevice}
                        value={
                          driver.assignedDeviceId ? (
                            <span className="font-mono">
                              {driver.assignedDeviceId}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {copy.hint.noDevice}
                            </span>
                          )
                        }
                        copyable={Boolean(driver.assignedDeviceId)}
                        copyValue={driver.assignedDeviceId ?? undefined}
                        mono={Boolean(driver.assignedDeviceId)}
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.notes}
                        value={
                          driver.notes?.trim() ? (
                            <span className="whitespace-pre-wrap text-sm">
                              {driver.notes}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {copy.hint.noNotes}
                            </span>
                          )
                        }
                      />
                    </CardContent>
                  </Card>
                </DetailSection>
              </div>
            ),
          },
          {
            value: "license",
            label: copy.tab.license,
            content: (
              <DetailSection
                icon={<CreditCard className="h-4 w-4" />}
                title={copy.section.license.title}
                description={copy.section.license.description}
              >
                <Card>
                  <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
                    <InfoRow
                      variant="inline"
                      label={copy.label.licenseNumber}
                      value={
                        <span className="font-mono">{driver.licenseNumber}</span>
                      }
                      copyable
                      copyValue={driver.licenseNumber}
                      mono
                    />
                    <InfoRow
                      variant="inline"
                      label={copy.label.licenseType}
                      value={licenseTypeLabel}
                    />
                    <InfoRow
                      variant="inline"
                      label={copy.label.licenseExpiry}
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
                              ? copy.vigency.expiredShort
                              : isLicenseExpiringSoon
                                ? copy.vigency.daysRemaining(
                                    daysUntilLicenseExpiration!,
                                  )
                                : copy.vigency.valid}
                          </Badge>
                        </div>
                      }
                    />
                    <InfoRow
                      variant="inline"
                      label={copy.label.licenseState}
                      value={
                        driver.licenseIssuingState ?? copy.hint.emptyOptional
                      }
                    />
                  </CardContent>
                </Card>
              </DetailSection>
            ),
          },
          {
            value: "health",
            label: copy.tab.health,
            content: (
              <div className="space-y-8">
                <DetailSection
                  icon={<Stethoscope className="h-4 w-4" />}
                  title={copy.section.medical.title}
                  description={copy.section.medical.description}
                >
                  <Card>
                    <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
                      <InfoRow
                        variant="inline"
                        label={copy.label.medicalNumber}
                        value={
                          driver.medicalCertificateNumber ? (
                            <span className="font-mono">
                              {driver.medicalCertificateNumber}
                            </span>
                          ) : (
                            copy.hint.empty
                          )
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.medicalExpiry}
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
                            copy.hint.empty
                          )
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.medicalIssuer}
                        value={
                          driver.medicalCertificateIssuer ??
                          copy.hint.emptyOptional
                        }
                      />
                      <InfoRow
                        variant="inline"
                        label={copy.label.bloodType}
                        value={driver.bloodType ?? copy.hint.empty}
                      />
                    </CardContent>
                  </Card>
                </DetailSection>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <DetailSection
                    icon={<Brain className="h-4 w-4" />}
                    title={copy.section.psychometric.title}
                    description={copy.section.psychometric.description}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <InfoRow
                          variant="inline"
                          label={copy.label.psychometricDate}
                          value={formatDate(driver.psychometricTestDate)}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.psychometricResult}
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
                  </DetailSection>

                  <DetailSection
                    icon={<FlaskConical className="h-4 w-4" />}
                    title={copy.section.drugTest.title}
                    description={copy.section.drugTest.description}
                  >
                    <Card>
                      <CardContent className="pt-6">
                        <InfoRow
                          variant="inline"
                          label={copy.label.drugTestDate}
                          value={formatDate(driver.lastDrugTestDate)}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.drugTestResult}
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
                            label={copy.label.drugEstimatedExpiry}
                            value={
                              <span
                                className={cn(
                                  isDrugEstimatedExpired && "text-destructive",
                                  isDrugEstimatedExpiringSoon && "text-warning",
                                )}
                              >
                                {formatDrugEstimatedExpiry(
                                  driver.lastDrugTestDate,
                                )}
                              </span>
                            }
                          />
                        ) : null}
                      </CardContent>
                    </Card>
                  </DetailSection>
                </div>
              </div>
            ),
          },
          {
            value: "trips",
            label:
              tripsTotal > 0
                ? copy.format.tripsTab(tripsTotal)
                : copy.tab.trips,
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
                  <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-destructive/70" />
                  <p className="text-muted-foreground">{copy.trips.loadError}</p>
                </CardContent>
              </Card>
            ) : trips.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Truck className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">{copy.trips.empty}</p>
                </CardContent>
              </Card>
            ) : (
              <DetailSection
                icon={<Route className="h-4 w-4" />}
                title={copy.section.trips.title}
                description={copy.section.trips.description}
              >
                <Card>
                  <CardContent className="pt-6">
                    <DetailTimeline items={tripTimelineItems} />

                    {tripsData?.pagination &&
                    tripsData.pagination.total > trips.length ? (
                      <div className="mt-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/drivers/${driverId}/trips`)}
                        >
                          {copy.action.viewAllTrips(tripsData.pagination.total)}
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </DetailSection>
            ),
          },
          {
            value: "emergency",
            label: copy.tab.emergency,
            content: (
              <DetailSection
                icon={<Users className="h-4 w-4" />}
                title={copy.section.emergency.title}
                description={copy.section.emergency.description}
              >
                <Card>
                  <CardContent className="pt-6">
                    {driver.emergencyContactName ? (
                      <>
                        <InfoRow
                          variant="inline"
                          label={copy.label.emergencyName}
                          value={driver.emergencyContactName}
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.emergencyPhone}
                          value={
                            driver.emergencyContactPhone ? (
                              <a
                                href={`tel:${driver.emergencyContactPhone}`}
                                className="text-primary hover:underline"
                              >
                                {driver.emergencyContactPhone}
                              </a>
                            ) : (
                              copy.hint.empty
                            )
                          }
                        />
                        <InfoRow
                          variant="inline"
                          label={copy.label.emergencyRelationship}
                          value={
                            driver.emergencyContactRelationship ??
                            copy.hint.empty
                          }
                        />
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Users className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                        <p className="text-muted-foreground">
                          {copy.hint.noEmergencyContact}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {copy.hint.emergencyFromEmployee}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DetailSection>
            ),
          },
        ],
      }}
    />
  );
}

export default DriverDetailPage;
