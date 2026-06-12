import { useCallback, useState } from "react";

const STORAGE_KEYS = {
  stop: "boeltech.tracking.stopLegendCollapsed",
  cargo: "boeltech.tracking.cargoLegendCollapsed",
} as const;

export type TrackingLegendKind = keyof typeof STORAGE_KEYS;

function readCollapsed(key: TrackingLegendKind): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEYS[key]) === "true";
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
