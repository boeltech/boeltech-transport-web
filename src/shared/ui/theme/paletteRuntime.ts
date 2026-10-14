/**
 * Color palette runtime (independent of light/dark).
 *
 * v1 — Azul-tinta (alternativa DS)
 * v2 — Patio triad: ink + ámbar + brand Teal Operate (default producto)
 *
 * Persistencia: localStorage. Aplicación: `data-palette` en <html>.
 */

export type ColorPaletteId = "v1" | "v2";

export const COLOR_PALETTE_STORAGE_KEY = "boeltech-palette";
export const COLOR_PALETTE_DEFAULT: ColorPaletteId = "v2";
export const COLOR_PALETTE_ATTR = "data-palette";

export const COLOR_PALETTE_META: Record<
  ColorPaletteId,
  { label: string; shortLabel: string; description: string }
> = {
  v1: {
    label: "Azul-tinta",
    shortLabel: "v1",
    description: "Paleta incumbente Fase 1 — primary azul, sidebar claro.",
  },
  v2: {
    label: "Patio (ink + ámbar)",
    shortLabel: "v2",
    description:
      "Ink estructura el chrome, ámbar señala activo/urgente, brand Teal Operate es la marca (CTAs).",
  },
};

export const COLOR_PALETTE_CYCLE: ColorPaletteId[] = ["v1", "v2"];

export function parseStoredColorPalette(
  raw: string | null,
): ColorPaletteId | null {
  if (raw === "v1" || raw === "v2") return raw;
  return null;
}

export function readStoredColorPalette(
  storageKey: string = COLOR_PALETTE_STORAGE_KEY,
): ColorPaletteId | null {
  if (typeof window === "undefined") return null;
  try {
    return parseStoredColorPalette(localStorage.getItem(storageKey));
  } catch {
    return null;
  }
}

export function writeStoredColorPalette(
  palette: ColorPaletteId,
  storageKey: string = COLOR_PALETTE_STORAGE_KEY,
): void {
  try {
    localStorage.setItem(storageKey, palette);
  } catch {
    // localStorage no disponible
  }
}

export function cycleColorPalette(current: ColorPaletteId): ColorPaletteId {
  const index = COLOR_PALETTE_CYCLE.indexOf(current);
  if (index === -1) return COLOR_PALETTE_CYCLE[0];
  return COLOR_PALETTE_CYCLE[(index + 1) % COLOR_PALETTE_CYCLE.length];
}

export function applyColorPaletteToDocument(
  palette: ColorPaletteId,
  attribute: string = COLOR_PALETTE_ATTR,
): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute(attribute, palette);
}
