import type { TripStopFormValues } from "./validation";
import { stopHasUnifiedAddressId } from "./validation";

export function formatWizardStopAddressLine(stop: TripStopFormValues): string {
  const streetLine = [stop.street, stop.exteriorNumber]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (streetLine) {
    return [streetLine, stop.reference].filter(Boolean).join(" · ");
  }
  return stop.postalCode ? `CP ${stop.postalCode}` : "—";
}

export function formatWizardStopCityLine(stop: TripStopFormValues): string {
  const line = [stop.cityName, stop.neighborhoodName].filter(Boolean).join(" · ");
  if (line) return line;
  return stop.postalCode ?? "—";
}

function buildWizardStopStreetLine(stop: TripStopFormValues): string | null {
  const street = stop.street?.trim();
  if (!street) return null;

  let line = street;
  if (stop.exteriorNumber?.trim()) {
    line += ` #${stop.exteriorNumber.trim()}`;
  }
  if (stop.interiorNumber?.trim()) {
    line += `, Int. ${stop.interiorNumber.trim()}`;
  }
  return line;
}

function buildWizardStopLocalityLine(stop: TripStopFormValues): string | null {
  const locationParts: string[] = [];

  if (stop.postalCode?.trim()) {
    locationParts.push(`C.P. ${stop.postalCode.trim()}`);
  }

  if (stop.cityName?.trim()) {
    locationParts.push(stop.cityName.trim());
  } else if (stop.satMunicipalityCode?.trim()) {
    locationParts.push(`Municipio ${stop.satMunicipalityCode.trim()}`);
  }

  if (stop.satStateCode?.trim()) {
    locationParts.push(`Estado ${stop.satStateCode.trim()}`);
  }

  return locationParts.length > 0 ? locationParts.join(", ") : null;
}

/** Líneas de domicilio para cards del paso Ruta (sin repetir `locationName`). */
export function formatWizardStopAddressDisplay(stop: TripStopFormValues): {
  streetLine: string | null;
  localityLine: string | null;
  showNoAddress: boolean;
} {
  const locationName = stop.locationName?.trim();
  const localityLine = buildWizardStopLocalityLine(stop);
  let streetLine = buildWizardStopStreetLine(stop);

  if (!streetLine) {
    const neighborhood = stop.neighborhoodName?.trim();
    if (neighborhood && neighborhood !== locationName) {
      streetLine = neighborhood;
    }
  }

  if (locationName) {
    return { streetLine, localityLine, showNoAddress: false };
  }

  if (!streetLine && stopHasUnifiedAddressId(stop)) {
    streetLine = "Domicilio en catálogo";
  }

  if (!streetLine && !localityLine) {
    return { streetLine: null, localityLine: null, showNoAddress: true };
  }

  return { streetLine, localityLine, showNoAddress: false };
}

export function getWizardStopRoleLabel(stopType: string[]): {
  primary: string;
  operation: string;
} {
  if (stopType.includes("origin")) return { primary: "Origen", operation: "Carga" };
  if (stopType.includes("destination")) return { primary: "Destino", operation: "Descarga" };
  const ops: string[] = [];
  if (stopType.includes("pickup")) ops.push("Carga");
  if (stopType.includes("delivery")) ops.push("Descarga");
  return { primary: "Escala", operation: ops.join(" / ") || "Paso" };
}
