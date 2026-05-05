import { memo } from "react";
import { AlertCircle, MapPin, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { InfoRow } from "@shared/ui/data-display";
import { usePostalCodeLookup } from "@shared/ui/address-input/use-postal-code-lookup";
import { useCatalogOptions } from "@features/catalogs";
import type { Employee } from "../../../domain/entities";
import {
  formatEmployeeCityStateLine,
  formatEmployeeStreetLine,
} from "../../helpers/employeeDetailFormatters";

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

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-4 w-4" /> Datos de contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Email" value={employee.email} />
            <InfoRow variant="inline" label="Teléfono" value={employee.phone} />
            <InfoRow variant="inline" label="Celular" value={employee.mobilePhone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4" /> Domicilio
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Calle" value={formatEmployeeStreetLine(employee)} />
            <InfoRow
              variant="inline"
              label="Colonia"
              value={
                employee.personalAddress?.neighborhoodName ??
                neighborhoodNameFromLookup ??
                employee.personalAddress?.satNeighborhoodCode ??
                employee.neighborhood
              }
            />
            <InfoRow
              variant="inline"
              label="Ciudad / Estado"
              value={cityStateWithCodes ?? formatEmployeeCityStateLine(employee)}
            />
            <InfoRow
              variant="inline"
              label="C.P."
              value={employee.personalAddress?.postalCode ?? employee.postalCode}
              mono
            />
            <InfoRow
              variant="inline"
              label="País"
              value={
                employee.personalAddress?.satCountryCode === "MEX"
                  ? "México"
                  : (employee.personalAddress?.country ?? employee.country)
              }
            />
            <InfoRow
              variant="inline"
              label="Localidad SAT"
              value={
                localityName
                  ? `${localityName}${
                      employee.personalAddress?.satLocalityCode
                        ? ` (${employee.personalAddress.satLocalityCode})`
                        : ""
                    }`
                  : employee.personalAddress?.satLocalityCode
              }
            />
            <InfoRow
              variant="inline"
              label="Referencia"
              value={employee.personalAddress?.reference}
            />
            <InfoRow
              variant="inline"
              label="Latitud"
              value={
                employee.personalAddress?.latitude != null
                  ? String(employee.personalAddress.latitude)
                  : null
              }
              mono
            />
            <InfoRow
              variant="inline"
              label="Longitud"
              value={
                employee.personalAddress?.longitude != null
                  ? String(employee.personalAddress.longitude)
                  : null
              }
              mono
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4" /> Contacto de emergencia
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <InfoRow variant="inline" label="Nombre" value={employee.emergencyContactName} />
            <InfoRow variant="inline" label="Teléfono" value={employee.emergencyContactPhone} />
            <InfoRow
              variant="inline"
              label="Parentesco"
              value={employee.emergencyContactRelationship}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

