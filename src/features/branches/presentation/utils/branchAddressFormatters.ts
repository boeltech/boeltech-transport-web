import type { BranchAddress } from "../../domain";

/**
 * Formato de domicilio para lectura en detalle (una sola presentación).
 *
 * Ejemplo:
 *   Av. Constitución 1234, Int. 2
 *   Colonia Centro, C.P. 64000
 *   Monterrey, Nuevo León, México
 */
export function formatBranchFullAddress(address: BranchAddress): string[] {
  const streetParts = [address.street?.trim()].filter(Boolean);
  const numberParts = [
    address.exteriorNumber?.trim()
      ? `No. ${address.exteriorNumber.trim()}`
      : null,
    address.interiorNumber?.trim()
      ? `Int. ${address.interiorNumber.trim()}`
      : null,
  ].filter(Boolean);

  const streetLine = [...streetParts, ...numberParts].join(" ").trim();

  const localityParts = [
    address.neighborhood?.trim() || null,
    address.postalCode?.trim() ? `C.P. ${address.postalCode.trim()}` : null,
  ].filter(Boolean);

  const cityLine = [address.city, address.state, address.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return [streetLine, localityParts.join(", "), cityLine].filter(Boolean);
}

/** Etiqueta compacta ciudad/estado para listados (tabla, tarjeta, export). */
export function formatBranchListLocation(
  city: string | null | undefined,
  state: string | null | undefined,
): string {
  const parts = [city?.trim(), state?.trim()].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "";
}
