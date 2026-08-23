/**
 * DriverDetailPage
 * Clean Architecture - Presentation Layer (Pages)
 *
 * Detalle de conductor: ficha operativa, documentación y viajes.
 */

import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import type { InfiniteData } from "@tanstack/react-query";
import { cn } from "@shared/lib/utils/cn";
import { useTabParam } from "@shared/hooks";
import { DetailPageShell } from "@shared/ui/page-shells/DetailPageShell";
import { NotFoundState } from "@shared/ui/feedback-states";
import {
  DetailAlertCard,
  type DetailAlertCardItem,
} from "@shared/ui/data-display";
import type { MappedPaginatedResult } from "@shared/api";
import {
  User,
  AlertTriangle,
  AlertCircle,
  CreditCard,
  IdCard,
  Stethoscope,
  FlaskConical,
  ClipboardCheck,
  Info,
} from "lucide-react";
import { useDriver, useDriverTripsInfinite } from "../../application";
import {
  LICENSE_TYPE_LABELS,
  getDriverLicenseJurisdiction,
  getDriverPrimaryCategoryLabel,
  getDriverPrimaryLicenseNumber,
  type DriverTripSummary,
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
import { resolveDocumentVigencyStat } from "../helpers/documentVigencyStat";
import {
  formatDate,
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";

const copy = driversCopy.detail;

/** Tabs enlazables por `?tab=` (deep-link de alertas de licencia y examen médico). */
const DRIVER_DETAIL_TABS = ["driver", "documents", "trips"] as const;

/** Derivado de campo vacío — sin estado de completitud en entidad. */
function isEmployeeRfcMissing(rfc: string | null | undefined): boolean {
  return !rfc?.trim();
}

function documentsTabHref(driverId: string): string {
  return `/drivers/${driverId}?tab=documents`;
}

export function DriverDetailPage() {
  const { id } = useParams<{ id: string }>();
  const driverId = id || "";
  const { activeTab, setActiveTab } = useTabParam(DRIVER_DETAIL_TABS, "driver");

  const {
    data: driver,
    isLoading: isLoadingDriver,
    isError: isDriverError,
    refetch: refetchDriver,
  } = useDriver(driverId);

  const { data: tripsInfiniteData } = useDriverTripsInfinite(driverId, {
    limit: 10,
  });

  const tripsTotal = useMemo(() => {
    const infinite = tripsInfiniteData as
      | InfiniteData<MappedPaginatedResult<DriverTripSummary>>
      | undefined;
    return infinite?.pages[0]?.pagination.total;
  }, [tripsInfiniteData]);

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

  if (isDriverError) {
    return (
      <NotFoundState
        icon={<AlertCircle />}
        title={copy.state.loadErrorTitle}
        description={copy.state.loadErrorDescription}
        onBackClick={() => void refetchDriver()}
        backLabel={copy.state.retry}
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

  const licenseTypeLabel = getDriverPrimaryCategoryLabel(
    driver,
    LICENSE_TYPE_LABELS,
  );
  const primaryLicenseNumber = getDriverPrimaryLicenseNumber(driver);
  const licenseJurisdiction = getDriverLicenseJurisdiction(driver);

  const federalDaysUntilExpiration = getDaysUntilDateString(
    driver.federalLicenseExpiry,
  );
  const isFederalLicenseExpired = driver.isFederalLicenseExpired;
  const isFederalLicenseExpiringSoon =
    !isFederalLicenseExpired &&
    federalDaysUntilExpiration !== null &&
    federalDaysUntilExpiration > 0 &&
    federalDaysUntilExpiration <= 30;

  const stateDaysUntilExpiration = getDaysUntilDateString(
    driver.stateLicenseExpiry,
  );
  const isStateLicenseExpired = driver.isStateLicenseExpired;
  const isStateLicenseExpiringSoon =
    !isStateLicenseExpired &&
    stateDaysUntilExpiration !== null &&
    stateDaysUntilExpiration > 0 &&
    stateDaysUntilExpiration <= 30;

  const isLicenseExpired =
    driver.isLicenseExpired ||
    isFederalLicenseExpired ||
    isStateLicenseExpired;
  const isLicenseExpiringSoon =
    !isLicenseExpired &&
    (isFederalLicenseExpiringSoon || isStateLicenseExpiringSoon);

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

  const hasDocumentAlerts =
    isLicenseExpired ||
    isLicenseExpiringSoon ||
    isMedicalExpired ||
    isMedicalExpiringSoon ||
    isDrugEstimatedExpired ||
    isDrugEstimatedExpiringSoon;

  const rfcMissing = isEmployeeRfcMissing(driver.employee?.rfc);
  const showAlerts = hasDocumentAlerts || rfcMissing;

  const viewDocumentsCta: DetailAlertCardItem = {
    text: (
      <Link
        to={documentsTabHref(driver.id)}
        className="font-medium text-primary underline-offset-4 hover:underline"
      >
        {copy.alert.viewDocuments}
      </Link>
    ),
  };

  const licenseMedicalAlertItems: DetailAlertCardItem[] = [];
  if (isFederalLicenseExpired || isFederalLicenseExpiringSoon) {
    licenseMedicalAlertItems.push({
      label: copy.alert.federalLicenseLabel,
      text: isFederalLicenseExpired
        ? copy.alert.licenseExpiredText(
            Math.abs(federalDaysUntilExpiration!),
            formatDate(driver.federalLicenseExpiry!),
          )
        : copy.alert.licenseExpiringText(
            federalDaysUntilExpiration!,
            formatDate(driver.federalLicenseExpiry!),
          ),
    });
  }
  if (isStateLicenseExpired || isStateLicenseExpiringSoon) {
    licenseMedicalAlertItems.push({
      label: copy.alert.stateLicenseLabel,
      text: isStateLicenseExpired
        ? copy.alert.licenseExpiredText(
            Math.abs(stateDaysUntilExpiration!),
            formatDate(driver.stateLicenseExpiry!),
          )
        : copy.alert.licenseExpiringText(
            stateDaysUntilExpiration!,
            formatDate(driver.stateLicenseExpiry!),
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
  if (licenseMedicalAlertItems.length > 0) {
    licenseMedicalAlertItems.push(viewDocumentsCta);
  }

  const licenseMedicalAlertSeverity: "critical" | "warning" =
    isLicenseExpired || isMedicalExpired ? "critical" : "warning";

  const licenseMedicalAlertTitle = resolveLicenseMedicalAlertTitle({
    federalExpired: isFederalLicenseExpired,
    federalExpiring: isFederalLicenseExpiringSoon,
    stateExpired: isStateLicenseExpired,
    stateExpiring: isStateLicenseExpiringSoon,
    medicalExpired: isMedicalExpired,
    medicalExpiring: isMedicalExpiringSoon,
  });

  const federalStat = resolveDocumentVigencyStat(
    driver.federalLicenseExpiry,
    "missing",
  );
  const stateStat = resolveDocumentVigencyStat(
    driver.stateLicenseExpiry,
    "notApplicable",
  );
  const medicalStat = resolveDocumentVigencyStat(
    driver.medicalCertificateExpiry,
    "notApplicable",
  );

  const tripsTabLabel =
    typeof tripsTotal === "number"
      ? copy.format.tripsTab(tripsTotal)
      : copy.tab.trips;

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
            licenseNumber={primaryLicenseNumber}
            jurisdiction={licenseJurisdiction}
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
        showAlerts ? (
          <div className="space-y-3">
            {rfcMissing ? (
              <DetailAlertCard
                severity="info"
                icon={<Info className="h-5 w-5" />}
                title={copy.alert.rfcMissing.title}
                items={[
                  { text: copy.alert.rfcMissing.body },
                  {
                    text: (
                      <>
                        <Link
                          to={`/employees/${driver.employeeId}`}
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          {copy.alert.rfcMissing.editEmployee}
                        </Link>
                      </>
                    ),
                  },
                ]}
              />
            ) : null}

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
                  viewDocumentsCta,
                ]}
              />
            ) : null}
          </div>
        ) : undefined
      }
      stats={[
        {
          title: copy.stat.federalLicense.title,
          value: federalStat.value,
          tone: federalStat.tone,
          icon: <CreditCard className="h-5 w-5" />,
          description:
            federalStat.description ?? copy.stat.federalLicense.description,
        },
        {
          title: copy.stat.stateLicense.title,
          value: stateStat.value,
          tone: stateStat.tone,
          icon: <IdCard className="h-5 w-5" />,
          description:
            stateStat.description ?? copy.stat.stateLicense.description,
        },
        {
          title: copy.stat.medical.title,
          value: medicalStat.value,
          tone: medicalStat.tone,
          icon: <Stethoscope className="h-5 w-5" />,
          description: medicalStat.description ?? copy.stat.medical.description,
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
            label: tripsTabLabel,
            content: <DriverDetailTripsTab driverId={driver.id} />,
          },
        ],
      }}
    />
  );
}

export default DriverDetailPage;
