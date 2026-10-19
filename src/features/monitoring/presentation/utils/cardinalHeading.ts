/**
 * Rumbo cardinal + flecha (PRD D27 / CA-51).
 * 8 rumbos: N NE E SE S SW W NW.
 */

export type CardinalCode =
  | "N"
  | "NE"
  | "E"
  | "SE"
  | "S"
  | "SW"
  | "W"
  | "NW";

export interface CardinalHeading {
  arrow: string;
  cardinal: CardinalCode;
  degrees: number;
  /** p.ej. "↗ NE 045°" */
  label: string;
}

const CARDINALS: readonly {
  code: CardinalCode;
  arrow: string;
}[] = [
  { code: "N", arrow: "↑" },
  { code: "NE", arrow: "↗" },
  { code: "E", arrow: "→" },
  { code: "SE", arrow: "↘" },
  { code: "S", arrow: "↓" },
  { code: "SW", arrow: "↙" },
  { code: "W", arrow: "←" },
  { code: "NW", arrow: "↖" },
] as const;

/** Normaliza grados a [0, 360). */
export function normalizeCourseDeg(deg: number): number {
  const n = deg % 360;
  return n < 0 ? n + 360 : n;
}

/**
 * Convierte course_deg a rumbo de 8 puntos.
 * Sectores centrados: N = −22.5…22.5, etc.
 */
export function courseToCardinal(deg: number): CardinalCode {
  const normalized = normalizeCourseDeg(deg);
  const index = Math.round(normalized / 45) % 8;
  return CARDINALS[index]!.code;
}

export function formatCardinalHeading(deg: number | null | undefined): CardinalHeading | null {
  if (deg == null || !Number.isFinite(deg)) return null;
  const degrees = Math.round(normalizeCourseDeg(deg));
  const cardinal = courseToCardinal(degrees);
  const entry = CARDINALS.find((c) => c.code === cardinal)!;
  const padded = String(degrees).padStart(3, "0");
  return {
    arrow: entry.arrow,
    cardinal,
    degrees,
    label: `${entry.arrow} ${cardinal} ${padded}°`,
  };
}
