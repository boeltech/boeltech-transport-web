/**
 * El backend reusa la misma URL al reemplazar el logo, así que sin este
 * parámetro el navegador seguiría mostrando la imagen anterior.
 */
export function resolveCompanyLogoSrc(
  logoUrl: string | null | undefined,
  updatedAt: Date | null | undefined,
  fallbackVersion: number,
): string | null {
  if (!logoUrl) return null;
  const separator = logoUrl.includes("?") ? "&" : "?";
  const version = updatedAt?.getTime?.() ?? fallbackVersion;
  return `${logoUrl}${separator}v=${version}`;
}
