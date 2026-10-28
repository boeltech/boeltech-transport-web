/**
 * Bridge opcional: Toaster ERP lee el tema Ops resuelto sin montar un segundo
 * Sonner ni mutar `html` (TEC §C.7).
 */

import type { OpsResolvedTheme } from "./opsTheme";

let current: OpsResolvedTheme | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function registerOpsThemeBridge(resolved: OpsResolvedTheme): void {
  current = resolved;
  emit();
}

export function clearOpsThemeBridge(): void {
  current = null;
  emit();
}

export function getOpsThemeBridge(): OpsResolvedTheme | null {
  return current;
}

export function subscribeOpsThemeBridge(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
