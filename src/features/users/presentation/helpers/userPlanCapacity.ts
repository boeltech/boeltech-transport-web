/**
 * Capacidad de usuarios del plan (asientos activos).
 *
 * Fuente del tope: `GET /users` → `meta` (`maxUsers` null = sin límite).
 * Si `meta` no viene (API antigua / error de forma), la UI no bloquea altas;
 * el API sigue siendo la autoridad final al mutar.
 */

import type { UserListMeta } from "../../domain/entities";

export interface UserPlanCapacity {
  readonly activeCount: number;
  /** `undefined` mientras no hay meta de cupo. */
  readonly maxUsers: number | null | undefined;
  readonly isPlanResolved: boolean;
  readonly unlimited: boolean;
  readonly limitReached: boolean;
  readonly overQuota: boolean;
  /** Puede invitar/crear en UI. */
  readonly canAdd: boolean;
}

export function resolveUserPlanCapacity(
  activeCount: number,
  maxUsers: number | null | undefined,
): UserPlanCapacity {
  const isPlanResolved = maxUsers !== undefined;
  const unlimited = isPlanResolved && maxUsers === null;
  const hasFiniteCap = typeof maxUsers === "number";
  const limitReached = hasFiniteCap && activeCount >= maxUsers;
  const overQuota = hasFiniteCap && activeCount > maxUsers;

  return {
    activeCount,
    maxUsers,
    isPlanResolved,
    unlimited,
    limitReached,
    overQuota,
    // Sin meta aún: no bloquear; el API valida al mutar.
    canAdd: !isPlanResolved || unlimited || activeCount < (maxUsers as number),
  };
}

/** Adapter desde `data.meta` del listado. Sin meta → no bloquear altas. */
export function capacityFromUserListMeta(
  meta: UserListMeta | undefined,
): UserPlanCapacity {
  if (!meta) {
    return resolveUserPlanCapacity(0, undefined);
  }
  return resolveUserPlanCapacity(meta.activeCount, meta.maxUsers);
}
