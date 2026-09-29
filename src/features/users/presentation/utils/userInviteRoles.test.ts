import { describe, expect, it } from "vitest";
import { ROLE_LABELS, ROLES } from "@shared/constants/roles";

import { usersCopy } from "../copy/usersCopy";
import {
  filterInviteRoleOptions,
  isInviteAssignableRole,
  resolvePortalLinkDescription,
} from "./userInviteRoles";

describe("userInviteRoles", () => {
  it("invite excluye Cliente y Conductor", () => {
    expect(isInviteAssignableRole(ROLES.OPERATOR)).toBe(true);
    expect(isInviteAssignableRole(ROLES.ADMIN)).toBe(true);
    expect(isInviteAssignableRole(ROLES.CLIENT)).toBe(false);
    expect(isInviteAssignableRole(ROLES.DRIVER)).toBe(false);

    const filtered = filterInviteRoleOptions(
      Object.values(ROLES).map((value) => ({
        value,
        label: ROLE_LABELS[value],
      })),
    );
    expect(filtered.map((o) => o.value)).not.toContain(ROLES.CLIENT);
    expect(filtered.map((o) => o.value)).not.toContain(ROLES.DRIVER);
    expect(filtered.map((o) => o.value)).toContain(ROLES.OPERATOR);
  });

  it("lista vacía pide al gerente y no apunta a altas de maestro", () => {
    expect(
      resolvePortalLinkDescription({
        loaded: true,
        isEmpty: true,
        emptyCopy: usersCopy.addUser.link.clientEmpty,
        filledCopy: usersCopy.addUser.link.clientDescription,
      }),
    ).toBe(usersCopy.addUser.link.clientEmpty);
    expect(usersCopy.addUser.link.clientEmpty).toMatch(/gerente/i);
    expect(usersCopy.addUser.link.driverEmpty).toMatch(/gerente/i);
    expect(usersCopy.addUser.link.clientEmpty).not.toMatch(/\/clients\/new/);
    expect(usersCopy.addUser.link.driverEmpty).not.toMatch(/\/drivers\/new/);
  });
});
