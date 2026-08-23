import { Brain, CreditCard, FlaskConical, Stethoscope } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent } from "@shared/ui/card";
import { DetailSection, InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import {
  DRUG_TEST_RESULT_COLORS,
  DRUG_TEST_RESULT_LABELS,
  LICENSE_TYPE_LABELS,
  PSYCHOMETRIC_RESULT_COLORS,
  PSYCHOMETRIC_RESULT_LABELS,
  type Driver,
} from "../../domain";
import { getLicenseExpirationVariant } from "../config/driverStatusConfig";
import { driversCopy } from "../copy";
import {
  formatDate,
  getDaysUntilDateString,
  getExpiryDateString,
} from "@shared/utils/dateUtils";
import { DriverResultBadge, getExpirationStatus } from "./driverDetailShared";

const copy = driversCopy.detail;

function formatDrugEstimatedExpiry(lastDrugTestDate: string | null): string {
  if (!lastDrugTestDate) return copy.hint.empty;

  const expiryDate = getExpiryDateString(lastDrugTestDate, 180);
  const daysRemaining = getDaysUntilDateString(expiryDate);

  if (daysRemaining === null) return copy.hint.empty;
  if (daysRemaining <= 0) {
    return copy.vigency.drugExpired;
  }
  return copy.vigency.daysRemainingLong(daysRemaining);
}

function LicenseExpiryRow({
  expiry,
  isExpired,
  isExpiringSoon,
}: {
  expiry: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean;
}) {
  const daysUntilExpiration = expiry ? getDaysUntilDateString(expiry) : null;
  const licenseVariant = getLicenseExpirationVariant(daysUntilExpiration);
  const licenseBadgeProps =
    licenseVariant === "warning"
      ? { variant: "warning" as const, tone: "soft" as const }
      : licenseVariant === "destructive"
        ? { variant: "destructive" as const, tone: "soft" as const }
        : licenseVariant === "secondary"
          ? { variant: "secondary" as const }
          : { variant: "default" as const };

  if (!expiry) {
    return copy.hint.emptyOptional;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <span
        className={cn(
          isExpired && "text-destructive",
          isExpiringSoon && "text-warning",
        )}
      >
        {formatDate(expiry)}
      </span>
      <Badge {...licenseBadgeProps}>
        {isExpired
          ? copy.vigency.expiredShort
          : isExpiringSoon
            ? copy.vigency.daysRemaining(daysUntilExpiration!)
            : copy.vigency.valid}
      </Badge>
    </div>
  );
}

interface DriverDetailDocumentsTabProps {
  driver: Driver;
}

export function DriverDetailDocumentsTab({
  driver,
}: DriverDetailDocumentsTabProps) {
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
    daysUntilDrugEstimatedExpiry !== null && daysUntilDrugEstimatedExpiry <= 0;
  const isDrugEstimatedExpiringSoon =
    daysUntilDrugEstimatedExpiry !== null &&
    daysUntilDrugEstimatedExpiry > 0 &&
    daysUntilDrugEstimatedExpiry <= 30;

  const federalCategoryLabel = driver.federalLicenseCategory
    ? LICENSE_TYPE_LABELS[driver.federalLicenseCategory]
    : copy.hint.emptyOptional;

  return (
    <div className="space-y-8">
      <DetailSection
        icon={<CreditCard className="h-4 w-4" />}
        title={copy.section.license.title}
        description={copy.section.license.description}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">{copy.section.licenseFederal.title}</p>
            <p className="text-xs text-muted-foreground">
              {copy.section.licenseFederal.description}
            </p>
            {!driver.federalLicenseNumber &&
            !driver.federalLicenseCategory &&
            !driver.federalLicenseExpiry ? (
              <p className="text-sm text-muted-foreground">{copy.hint.empty}</p>
            ) : (
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
                <InfoRow
                  variant="inline"
                  label={copy.label.federalLicenseNumber}
                  value={
                    driver.federalLicenseNumber ? (
                      <span className="font-mono">{driver.federalLicenseNumber}</span>
                    ) : (
                      copy.hint.emptyOptional
                    )
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.federalLicenseCategory}
                  value={federalCategoryLabel}
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.federalLicenseExpiry}
                  value={
                    <LicenseExpiryRow
                      expiry={driver.federalLicenseExpiry}
                      isExpired={isFederalLicenseExpired}
                      isExpiringSoon={isFederalLicenseExpiringSoon}
                    />
                  }
                />
              </CardContent>
            </Card>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">{copy.section.licenseState.title}</p>
            <p className="text-xs text-muted-foreground">
              {copy.section.licenseState.description}
            </p>
            {!driver.stateLicenseNumber &&
            !driver.stateLicenseExpiry &&
            !driver.stateIssuingState ? (
              <p className="text-sm text-muted-foreground">{copy.hint.empty}</p>
            ) : (
            <Card>
              <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
                <InfoRow
                  variant="inline"
                  label={copy.label.stateLicenseNumber}
                  value={
                    driver.stateLicenseNumber ? (
                      <span className="font-mono">{driver.stateLicenseNumber}</span>
                    ) : (
                      copy.hint.emptyOptional
                    )
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.stateLicenseExpiry}
                  value={
                    <LicenseExpiryRow
                      expiry={driver.stateLicenseExpiry}
                      isExpired={isStateLicenseExpired}
                      isExpiringSoon={isStateLicenseExpiringSoon}
                    />
                  }
                />
                <InfoRow
                  variant="inline"
                  label={copy.label.stateIssuingState}
                  value={driver.stateIssuingState ?? copy.hint.emptyOptional}
                />
              </CardContent>
            </Card>
            )}
          </div>
        </div>
      </DetailSection>

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
                driver.medicalCertificateIssuer ?? copy.hint.emptyOptional
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
                  <DriverResultBadge
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
                  <DriverResultBadge
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
                      {formatDrugEstimatedExpiry(driver.lastDrugTestDate)}
                    </span>
                  }
                />
              ) : null}
            </CardContent>
          </Card>
        </DetailSection>
      </div>
    </div>
  );
}
