/**
 * useUnsavedChangesGuard
 *
 * Bloquea navegación in-app (React Router data API) y cierre/recarga del
 * navegador cuando hay cambios sin guardar. Pareja: `UnsavedChangesDialog`.
 *
 * Requiere data router (`createBrowserRouter` / `createMemoryRouter`).
 * Doc: `.agents/skills/design-system/SKILL.md` § Formularios largos.
 */

import { useCallback, useEffect, useState } from "react";
import { useBlocker, type Blocker } from "react-router-dom";

export const UNSAVED_CHANGES_COPY = {
  title: "¿Salir sin guardar?",
  description: "Hay cambios sin guardar. Si sales ahora, se perderán.",
  confirmLabel: "Salir sin guardar",
  keepEditingLabel: "Seguir editando",
} as const;

export interface UseUnsavedChangesGuardOptions {
  /** true cuando el formulario tiene cambios locales sin persistir */
  isDirty: boolean;
  /** false desactiva el bloqueo (p. ej. pantalla solo lectura). Default true */
  enabled?: boolean;
}

export interface UseUnsavedChangesGuardResult {
  blocker: Blocker;
  /** Llama antes de navegar tras un submit válido (evita el diálogo en éxito). */
  allowLeave: () => void;
  /** Reactiva el bloqueo tras un submit fallido (isPending → false). */
  resetAllowLeave: () => void;
  isBlocked: boolean;
}

export function useUnsavedChangesGuard({
  isDirty,
  enabled = true,
}: UseUnsavedChangesGuardOptions): UseUnsavedChangesGuardResult {
  const [forceAllow, setForceAllow] = useState(false);
  const shouldBlock = Boolean(enabled && isDirty && !forceAllow);

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (!shouldBlock) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [shouldBlock]);

  const allowLeave = useCallback(() => {
    setForceAllow(true);
  }, []);

  const resetAllowLeave = useCallback(() => {
    setForceAllow(false);
  }, []);

  return {
    blocker,
    allowLeave,
    resetAllowLeave,
    isBlocked: blocker.state === "blocked",
  };
}
