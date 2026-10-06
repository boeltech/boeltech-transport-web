import { useCallback, useMemo, useState } from "react";
import { CHART_AXIS_TICK } from "./chartTokens";

/** Ancho medio estimado de un carácter del tick (fuente de 12 px). */
const TICK_CHAR_WIDTH = CHART_AXIS_TICK.fontSize * 0.6;
const TICK_MIN_GAP = 8;

export interface SelectCategoryAxisTicksOptions {
  values: readonly string[];
  /** Etiqueta que se pintará para cada valor (misma posición). */
  labels: readonly string[];
  /** Ancho útil del eje X en px; `<= 0` = desconocido. */
  availableWidth: number;
  /** Valores que nunca se ocultan, además del último. */
  priorityValues?: readonly string[];
}

/**
 * Ticks visibles de un eje de categorías.
 * - Si todas las etiquetas caben: todas.
 * - Si no: cada `stride` contando desde el último valor (el último siempre se ve)
 *   y los prioritarios forzados, quitando los vecinos que chocarían con ellos.
 *   Un prioritario que no deja `TICK_MIN_GAP` px con el último se omite.
 * - `undefined` si el ancho es desconocido (Recharts decide).
 */
export function selectCategoryAxisTicks({
  values,
  labels,
  availableWidth,
  priorityValues = [],
}: SelectCategoryAxisTicksOptions): string[] | undefined {
  const count = values.length;
  if (count === 0 || availableWidth <= 0) return undefined;

  const slotWidth = availableWidth / count;
  const labelWidth = (index: number) => (labels[index]?.length ?? 0) * TICK_CHAR_WIDTH;
  const allFit = values.every(
    (_, index) =>
      index === 0 ||
      (labelWidth(index - 1) + labelWidth(index)) / 2 + TICK_MIN_GAP <= slotWidth,
  );
  if (allFit) return [...values];

  const widestLabel = Math.max(...labels.map((label) => label.length), 1);
  const stride = Math.ceil((widestLabel * TICK_CHAR_WIDTH + TICK_MIN_GAP) / slotWidth);
  const last = count - 1;
  const fitsBeside = (a: number, b: number) =>
    Math.abs(a - b) * slotWidth >= (labelWidth(a) + labelWidth(b)) / 2 + TICK_MIN_GAP;

  /** El último manda: un prioritario que chocaría con otro ya aceptado se descarta. */
  const priority = new Set<number>([last]);
  for (const value of priorityValues) {
    const index = values.indexOf(value);
    if (index < 0 || priority.has(index)) continue;
    if ([...priority].every((accepted) => fitsBeside(index, accepted))) {
      priority.add(index);
    }
  }

  const selected = new Set<number>();
  for (let index = last; index >= 0; index -= stride) selected.add(index);
  for (const forced of priority) {
    for (const index of [...selected]) {
      if (!priority.has(index) && Math.abs(index - forced) < stride) {
        selected.delete(index);
      }
    }
    selected.add(forced);
  }

  return [...selected].sort((a, b) => a - b).map((index) => values[index]!);
}

/** Categoría de la fila con el valor más alto entre `valueKeys` (si es > 0). */
export function findPeakCategory(
  rows: readonly Record<string, unknown>[],
  categoryKey: string,
  valueKeys: readonly string[],
): string | undefined {
  let peak: { category: string; value: number } | undefined;
  for (const row of rows) {
    for (const key of valueKeys) {
      const value = Number(row[key] ?? 0);
      if (Number.isFinite(value) && value > (peak?.value ?? 0)) {
        peak = { category: String(row[categoryKey]), value };
      }
    }
  }
  return peak?.category;
}

interface UseFittedCategoryTicksOptions {
  data: readonly Record<string, unknown>[];
  xAxisKey: string;
  tickFormatter?: (value: string, index: number) => string;
  /** `undefined` desactiva la selección (comportamiento por defecto de Recharts). */
  priorityValues?: readonly string[];
  /** Px del contenedor que no son eje X (ejes Y y márgenes). */
  reservedWidth: number;
}

export function useFittedCategoryTicks({
  data,
  xAxisKey,
  tickFormatter,
  priorityValues,
  reservedWidth,
}: UseFittedCategoryTicksOptions) {
  const [containerWidth, setContainerWidth] = useState(0);
  const enabled = priorityValues !== undefined;

  const ticks = useMemo(() => {
    if (!enabled) return undefined;
    const values = data.map((row) => String(row[xAxisKey] ?? ""));
    return selectCategoryAxisTicks({
      values,
      labels: values.map((value, index) =>
        tickFormatter ? tickFormatter(value, index) : value,
      ),
      availableWidth: containerWidth > 0 ? containerWidth - reservedWidth : 0,
      priorityValues,
    });
  }, [enabled, data, xAxisKey, tickFormatter, containerWidth, reservedWidth, priorityValues]);

  const onResize = useCallback((width: number) => setContainerWidth(width), []);

  return {
    ticks,
    interval: ticks ? (0 as const) : ("preserveEnd" as const),
    onResize: enabled ? onResize : undefined,
  };
}
