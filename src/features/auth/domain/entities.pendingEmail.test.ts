import { describe, expect, it } from "vitest";
import { User } from "./entities";
import { ROLES } from "@shared/constants/roles";

const base = {
  id: "u1",
  email: "rosa@tbajio.mx",
  firstName: "Rosa",
  lastName: "Alcántara",
  role: ROLES.ADMIN,
  tenant: {
    id: "t1",
    name: "Transportes del Bajío",
    subdomain: "tbajio",
  },
};

describe("User pendingEmail", () => {
  it("persiste pendingEmail y expires en toJSON/fromJSON", () => {
    const user = User.create({
      ...base,
      pendingEmail: "rosa@nuevo.mx",
      pendingEmailExpiresAt: "2026-11-22T18:31:00.000Z",
    });
    expect(user.pendingEmail).toBe("rosa@nuevo.mx");
    expect(user.pendingEmailExpiresAt?.toISOString()).toBe(
      "2026-11-22T18:31:00.000Z",
    );

    const roundTrip = User.fromJSON(user.toJSON());
    expect(roundTrip.pendingEmail).toBe("rosa@nuevo.mx");
    expect(roundTrip.pendingEmailExpiresAt?.toISOString()).toBe(
      "2026-11-22T18:31:00.000Z",
    );
  });

  it("acepta null explícito (sin solicitud viva)", () => {
    const user = User.create({
      ...base,
      pendingEmail: null,
      pendingEmailExpiresAt: null,
    });
    expect(user.pendingEmail).toBeNull();
    expect(user.pendingEmailExpiresAt).toBeNull();
  });
});
