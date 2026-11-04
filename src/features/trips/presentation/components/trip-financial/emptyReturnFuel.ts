/**
 * Estimación local de la ayuda de diésel (D6).
 * Litros exactos × precio, sin redondear litros antes; cada monto a centavos.
 * El total es la suma de esos montos ya redondeados.
 */

export type EmptyReturnScope = "route" | "both" | "return";

export type EmptyReturnSaveShape = "route" | "return" | "pair";

export interface FuelPortionQuote {
  /** Litros a 1 decimal, solo para pantalla y la nota. */
  litersDisplay: number;
  /** Monto ya redondeado a centavos. */
  amount: number;
}

/** Texto del atajo: la distancia de la ruta, editable después. */
export function formatKmInput(km: number): string {
  if (!Number.isFinite(km) || km <= 0) return "";
  const rounded = Math.round(km * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function parseReturnKm(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

export function quoteFuelPortion(
  km: number,
  kmPerLiter: number,
  pricePerLiter: number,
): FuelPortionQuote | null {
  if (!(km > 0) || !(kmPerLiter > 0) || !(pricePerLiter > 0)) return null;
  const liters = km / kmPerLiter;
  return {
    litersDisplay: Math.round(liters * 10) / 10,
    amount: Math.round(liters * pricePerLiter * 100) / 100,
  };
}

/** Suma de montos que ya están en centavos (no re-redondea el producto crudo). */
export function sumRoundedAmounts(amounts: number[]): number {
  const cents = amounts.reduce((sum, amount) => sum + Math.round(amount * 100), 0);
  return cents / 100;
}

export function quoteEmptyReturnFuel(input: {
  scope: EmptyReturnScope;
  routeKm: number;
  returnKm: number;
  kmPerLiter: number;
  pricePerLiter: number;
}): {
  route: FuelPortionQuote | null;
  emptyReturn: FuelPortionQuote | null;
  total: number;
} {
  const route =
    input.scope === "return"
      ? null
      : quoteFuelPortion(input.routeKm, input.kmPerLiter, input.pricePerLiter);
  const emptyReturn =
    input.scope === "route"
      ? null
      : quoteFuelPortion(input.returnKm, input.kmPerLiter, input.pricePerLiter);
  return {
    route,
    emptyReturn,
    total: sumRoundedAmounts([route?.amount ?? 0, emptyReturn?.amount ?? 0]),
  };
}

/** D7: el modo combinado no vuelve a crear la fila de ruta si ya hay un fuel sin marca. */
export function emptyReturnSaveShape(input: {
  scope: EmptyReturnScope;
  hasUnmarkedRouteFuel: boolean;
}): EmptyReturnSaveShape {
  if (input.scope === "route") return "route";
  if (input.scope === "return") return "return";
  return input.hasUnmarkedRouteFuel ? "return" : "pair";
}

/** Fuel de ruta ya capturado (sin marca). El modo combinado no lo vuelve a crear. */
export function hasUnmarkedRouteFuel(
  lines: ReadonlyArray<{ category: string; isEmptyReturn?: boolean }>,
): boolean {
  return lines.some(
    (line) => line.category === "fuel" && line.isEmptyReturn !== true,
  );
}
