import { ROLES, type UserRole } from "@shared/constants/roles";

/** Invite no puede llevar vínculo de portal (D7). */
export function isInviteAssignableRole(role: UserRole): boolean {
  return role !== ROLES.CLIENT && role !== ROLES.DRIVER;
}

export function filterInviteRoleOptions<T extends { value: string }>(
  options: T[],
): T[] {
  return options.filter((option) =>
    isInviteAssignableRole(option.value as UserRole),
  );
}

export function resolvePortalLinkDescription({
  loaded,
  isEmpty,
  emptyCopy,
  filledCopy,
}: {
  loaded: boolean;
  isEmpty: boolean;
  emptyCopy: string;
  filledCopy: string;
}): string {
  if (loaded && isEmpty) return emptyCopy;
  return filledCopy;
}
