/**
 * Prioridad D32 de avisos ATF (1 = mayor).
 * 1 seguridad/ops · 2 bloquea avanzar · 3 tiempo · 4 fiscal · 5 pendientes.
 */

export type TripShellAlertPriority = 1 | 2 | 3 | 4 | 5;

export type TripShellAlertItem = {
  readonly key: string;
  readonly priority: TripShellAlertPriority;
  /** Si true, el aviso se absorbe en Qué sigue (D31) y no se lista abajo. */
  readonly absorbedByNextStep?: boolean;
};

/**
 * Ordena avisos por prioridad ASC (1 primero). Estable para empates.
 */
export function sortTripShellAlertsByPriority<T extends TripShellAlertItem>(
  items: readonly T[],
): T[] {
  return [...items]
    .filter((item) => !item.absorbedByNextStep)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;
      return a.key.localeCompare(b.key);
    });
}
