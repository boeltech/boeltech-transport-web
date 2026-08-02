/**
 * DriverDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de conductor: ficha operativa, documentación y viajes.
 */

import { useParams } from "react-router-dom";
import { cn } from "@shared/lib/utils/cn";
import { useTabParam } from "@shared/hooks";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import {
  DetailAlertCard,
  type DetailAlertCardItem,
} from "@shared/ui/data-display";
import {
  User,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Route,
  FlaskConical,
  ClipboardCheck,
} from "lucide-react";
import { useDriver } from "../../application";
import {
  LICENSE_TYPE_LABELS,
  type LicenseTypeValue,
} from "../../domain";
import {
  DriverStatusBadge,
  formatDriverName,
} from "../config/driverStatusConfig";
import { DriverActions } from "../components/DriverActions";
import { DriverDetailDocumentsTab } from "../components/DriverDetailDocumentsTab";
import { DriverDetailDriverTab } from "../components/DriverDetailDriverTab";
import { DriverDetailHeaderSubtitle } from "../components/DriverDetailHeaderSubtitle";
import { DriverDetailTripsTab } from "../components/DriverDetailTripsTab";
import {
  driversCopy,
  resolveLicenseMedicalAlertTitle,
} from "../copy";
import {
  formatDate,
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";

const copy = driversCopy.detail;

/** Tabs enlazables por `?tab=` (deep-link de alertas de licencia y examen médico). */
const DRIVER_DETAIL_TABS = ["driver", "documents", "trips"] as const;

function formatNumber(num: number): string {
  return new Intl.NumberFormat("es-MX").format(num);
}

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const driverId = id || "";
  const { activeTab, setActiveTab } = useTabParam(DRIVER_DETAIL_TABS, "driver");

  const {
    data: driver,
    isLoading: isLoadingDriver,
    refetch: refetchDriver,
  } = useDriver(driverId);

  if (isLoadingDriver) {
    return (
      <DetailPageShell
        isLoading
        header={{
          backHref: "/drivers",
          icon: <User className="h-6 w-6" />,
          iconShape: "circle",
          title: copy.title.fallback,
        }}
      />
    );
  }

  if (!driver) {
    return (
      <DetailPageShell
        isLoading={false}
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
  const isLicenseExpired =
    daysUntilLicenseExpiration !== null && daysUntilLicenseExpiration <= 0;
  const isLicenseExpiringSoon =
    daysUntilLicenseExpiration !== null &&
    daysUntilLicenseExpiration > 0 &&
    daysUntilLicenseExpiration <= 30;

  const daysUntilMedicalExpiration = getDaysUntilDateString(
    driver.medicalCertificateExpiry,
  );
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
    daysUntilDrugEstimatedExpiry !== null && daysUntilDrugEstimatedExpiry <= 0;
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

  const hasDocumentAlerts =
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

  return (
    <DetailPageShell
      isLoading={false}
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
        defaultValue: "driver",
        value: activeTab,
        onValueChange: setActiveTab,
        items: [
          {
            value: "driver",
            label: copy.tab.driver,
            content: <DriverDetailDriverTab driver={driver} />,
          },
          {
            value: "documents",
            label: (
              <span className="inline-flex items-center">
                {copy.tab.documents}
                {hasDocumentAlerts ? (
                  <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-warning" />
                ) : null}
              </span>
            ),
            content: <DriverDetailDocumentsTab driver={driver} />,
          },
          {
            value: "trips",
            label: copy.tab.trips,
            content: <DriverDetailTripsTab driverId={driver.id} />,
          },
        ],
      }}
    />
  );
}

export default DriverDetailPage;
