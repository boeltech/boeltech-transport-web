/** Copy compartido para alerta operativa CP ↔ coordenadas. */
export const coordinatesPostalCodeWarningCopy = {
  coordinatesFarFromPostalCode: (distanceKm: number, postalCode: string) =>
    `Las coordenadas están a unos ${Math.round(distanceKm)} km del centro aproximado del CP ${postalCode}. Revisa latitud y longitud: no bloquea el timbrado, pero puede afectar distancias en Carta Porte.`,
  coordinatesFarFromPostalCodeReference: (input: {
    label: string;
    latitude: number;
    longitude: number;
    query: string;
    resolutionSource: string;
  }) =>
    `Referencia del sistema para el CP (consulta «${input.query}», fuente ${input.resolutionSource}): ${input.label} — lat ${input.latitude.toFixed(6)}, lng ${input.longitude.toFixed(6)}.`,
} as const;
