import type { TripStopFormValues } from "./validation";

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
