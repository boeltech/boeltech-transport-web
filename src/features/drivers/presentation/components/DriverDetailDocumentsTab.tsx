import { Brain, CreditCard, FlaskConical, Stethoscope } from "lucide-react";
import { Badge } from "@shared/ui/badge";
import { Card, CardContent } from "@shared/ui/card";
import { DetailSection, InfoRow } from "@shared/ui/data-display";
import { cn } from "@shared/lib/utils/cn";
import {
  DRUG_TEST_RESULT_COLORS,
  DRUG_TEST_RESULT_LABELS,
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

interface DriverDetailDocumentsTabProps {
  driver: Driver;
}

export function DriverDetailDocumentsTab({
  driver,
}: DriverDetailDocumentsTabProps) {
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
    daysUntilDrugEstimatedExpiry !== null && daysUntilDrugEstimatedExpiry <= 0;
  const isDrugEstimatedExpiringSoon =
    daysUntilDrugEstimatedExpiry !== null &&
    daysUntilDrugEstimatedExpiry > 0 &&
    daysUntilDrugEstimatedExpiry <= 30;

  return (
    <div className="space-y-8">
      <DetailSection
        icon={<CreditCard className="h-4 w-4" />}
        title={copy.section.license.title}
        description={copy.section.license.description}
      >
        <Card>
          <CardContent className="grid grid-cols-1 gap-4 pt-6 lg:grid-cols-2">
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
              value={driver.licenseIssuingState ?? copy.hint.emptyOptional}
            />
          </CardContent>
        </Card>
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
