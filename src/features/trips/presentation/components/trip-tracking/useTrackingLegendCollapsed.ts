import { useCallback, useState } from "react";

const STORAGE_KEYS = {
  stop: "boeltech.tracking.stopLegendCollapsed",
  cargo: "boeltech.tracking.cargoLegendCollapsed",
} as const;

export type TrackingLegendKind = keyof typeof STORAGE_KEYS;

/**
 * Default colapsado (handoff D5). Solo se expande si el usuario lo pidió
 * (`localStorage === "false"`). Ausencia de clave = nunca tocado → colapsado.
 */
function readCollapsed(key: TrackingLegendKind): boolean {
  if (typeof window === "undefined") return true;
  const raw = localStorage.getItem(STORAGE_KEYS[key]);
  if (raw === null) return true;
  return raw === "true";
}

export function useTrackingLegendCollapsed(kind: TrackingLegendKind) {
  const [collapsed, setCollapsedState] = useState(() => readCollapsed(kind));

  const setCollapsed = useCallback(
    (value: boolean) => {
      setCollapsedState(value);
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS[kind], String(value));
      }
    },
    [kind],
  );

  return {
    collapsed,
    expand: () => setCollapsed(false),
    collapse: () => setCollapsed(true),
  };
}
