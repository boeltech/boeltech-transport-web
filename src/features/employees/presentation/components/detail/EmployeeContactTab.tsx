import { memo } from "react";
import { AlertCircle, MapPin, Phone } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { usePostalCodeLookup } from "@shared/ui/address-input/use-postal-code-lookup";
import { useCatalogOptions } from "@features/catalogs";
import type { Employee } from "../../../domain/entities";
import {
  formatEmployeeCityStateLine,
  formatEmployeeStreetLine,
} from "../../helpers/employeeDetailFormatters";
import { employeesCopy } from "../../copy";

const copy = employeesCopy.detail;

function toShortSatCode(value: string | null | undefined): string {
  if (!value) return "";
  const normalized = value.trim();
  if (!normalized) return "";
  const parts = normalized.split("-").filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

function resolveCatalogNameByCode(
  code: string | null | undefined,
  options: Array<{ code: string; name: string }>,
): string | null {
  if (!code) return null;
  const shortCode = toShortSatCode(code);
  const exact = options.find(
    (option) => option.code.toUpperCase() === code.trim().toUpperCase(),
  );
  if (exact) return exact.name;
  const byShort = options.find(
    (option) => toShortSatCode(option.code) === shortCode,
  );
  return byShort?.name ?? null;
}

export const EmployeeContactTab = memo(function EmployeeContactTab({
  employee,
}: {
  employee: Employee;
}) {
  const postalCode = employee.personalAddress?.postalCode ?? employee.postalCode ?? "";
  const postalLookup = usePostalCodeLookup(postalCode);
  const localityName = resolveCatalogNameByCode(
    employee.personalAddress?.satLocalityCode,
    postalLookup.data?.localities ?? [],
  );
  const neighborhoodNameFromLookup = resolveCatalogNameByCode(
    employee.personalAddress?.satNeighborhoodCode,
    postalLookup.data?.neighborhoods ?? [],
  );
  const municipalityCode = employee.personalAddress?.satMunicipalityCode;
  const stateCode = employee.personalAddress?.satStateCode;
  const { data: municipalityOptions = [] } = useCatalogOptions("sat_municipio", {
    parentCode: stateCode ?? undefined,
    enabled: Boolean(stateCode),
  });
  const { data: stateOptions = [] } = useCatalogOptions("sat_estado");
  const municipalityNameFromCatalog = resolveCatalogNameByCode(
    municipalityCode,
    municipalityOptions,
  );
  const stateNameFromCatalog = resolveCatalogNameByCode(stateCode, stateOptions);
  const municipalityName =
    postalLookup.data?.municipalityName ?? municipalityNameFromCatalog;
  const stateName = postalLookup.data?.stateName ?? stateNameFromCatalog;
  const cityStateFromSat =
    municipalityName && stateName
      ? `${municipalityName}, ${stateName}`
      : municipalityName
        ? municipalityName
        : stateName
          ? stateName
          : null;
  const cityStateWithCodes =
    cityStateFromSat && (municipalityCode || stateCode)
      ? `${cityStateFromSat} (${[municipalityCode, stateCode]
          .filter(Boolean)
          .join(" · ")})`
      : cityStateFromSat;

  const countryValue =
    employee.personalAddress?.satCountryCode === "MEX"
      ? copy.hint.countryMexico
      : (employee.personalAddress?.country ?? employee.country);

  const localityValue = localityName
    ? copy.format.localityWithCode(
        localityName,
        employee.personalAddress?.satLocalityCode,
      )
    : employee.personalAddress?.satLocalityCode;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.contact.title}
            </CardTitle>
            <CardDescription>{copy.section.contact.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label={copy.label.email} value={employee.email} />
            <InfoRow variant="inline" label={copy.label.phone} value={employee.phone} />
            <InfoRow
              variant="inline"
              label={copy.label.mobilePhone}
              value={employee.mobilePhone}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {copy.section.address.title}
            </CardTitle>
            <CardDescription>{copy.section.address.description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow
              variant="inline"
              label={copy.label.street}
              value={formatEmployeeStreetLine(employee)}
            />
            <InfoRow
              variant="inline"
              label={copy.label.neighborhood}
              value={
                employee.personalAddress?.neighborhoodName ??
                neighborhoodNameFromLookup ??
                employee.personalAddress?.satNeighborhoodCode ??
                employee.neighborhood
              }
            />
            <InfoRow
              variant="inline"
              label={copy.label.cityState}
              value={cityStateWithCodes ?? formatEmployeeCityStateLine(employee)}
            />
            <InfoRow
              variant="inline"
              label={copy.label.postalCode}
              value={employee.personalAddress?.postalCode ?? employee.postalCode}
              mono
            />
            <InfoRow variant="inline" label={copy.label.country} value={countryValue} />
            <InfoRow
              variant="inline"
              label={copy.label.satLocality}
              value={localityValue}
            />
            <InfoRow
              variant="inline"
              label={copy.label.reference}
              value={employee.personalAddress?.reference}
            />
            <InfoRow
              variant="inline"
              label={copy.label.latitude}
              value={
                employee.personalAddress?.latitude != null
                  ? String(employee.personalAddress.latitude)
                  : null
              }
              mono
            />
            <InfoRow
              variant="inline"
              label={copy.label.longitude}
              value={
                employee.personalAddress?.longitude != null
                  ? String(employee.personalAddress.longitude)
                  : null
              }
              mono
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            {copy.section.emergency.title}
          </CardTitle>
          <CardDescription>{copy.section.emergency.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <InfoRow
            variant="inline"
            label={copy.label.emergencyName}
            value={employee.emergencyContactName}
          />
          <InfoRow
            variant="inline"
            label={copy.label.emergencyPhone}
            value={employee.emergencyContactPhone}
          />
          <InfoRow
            variant="inline"
            label={copy.label.emergencyRelationship}
            value={employee.emergencyContactRelationship}
          />
        </CardContent>
      </Card>
    </div>
  );
});
